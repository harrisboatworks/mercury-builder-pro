import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ADMIN_QUOTE_EMAIL_HISTORY_EMPTY,
  ADMIN_QUOTE_EMAIL_HISTORY_SCOPE,
  QUOTE_EMAIL_CLAIM_MISMATCH_ERROR,
  QUOTE_EMAIL_DELIVERY_READ_RPC,
} from "../admin-quote-email";

const mocks = vi.hoisted(() => ({
  toast: vi.fn(),
  rpc: vi.fn(),
  invoke: vi.fn(),
  onDeliverySettled: vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: (...args: unknown[]) => mocks.rpc(...args),
    functions: {
      invoke: (...args: unknown[]) => mocks.invoke(...args),
    },
  },
}));

import QuoteEmailDeliveryHistory from "@/components/admin/QuoteEmailDeliveryHistory";
import SendQuoteEmail from "@/components/admin/SendQuoteEmail";

const QUOTE_ID = "11111111-1111-4111-8111-111111111111";

describe("QuoteEmailDeliveryHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("states the trusted-quote-id scope when the admin list is empty", async () => {
    mocks.rpc.mockResolvedValue({ data: [], error: null });

    render(<QuoteEmailDeliveryHistory quoteId={QUOTE_ID} />);

    expect(await screen.findByText(ADMIN_QUOTE_EMAIL_HISTORY_EMPTY)).toBeTruthy();
    expect(screen.getByText(ADMIN_QUOTE_EMAIL_HISTORY_SCOPE)).toBeTruthy();
    expect(screen.queryByText(/no emails sent yet/i)).toBeNull();
    expect(screen.queryByText(/^To:/)).toBeNull();
    expect(mocks.rpc).toHaveBeenCalledWith(QUOTE_EMAIL_DELIVERY_READ_RPC, {
      _quote_id: QUOTE_ID,
    });
  });

  it("renders an admin row without implying a plaintext recipient", async () => {
    mocks.rpc.mockResolvedValue({
      data: [{
        id: "d-1",
        email_type: "quote_delivery",
        status: "sent",
        attachment_status: "none",
        created_at: "2026-09-09T12:00:00.000Z",
        completed_at: "2026-09-09T12:00:02.000Z",
        initiator: "admin",
        error_detail: null,
        recipient_sha256: "abcd".repeat(16),
      }],
      error: null,
    });

    render(<QuoteEmailDeliveryHistory quoteId={QUOTE_ID} />);

    expect(await screen.findByText("quote_delivery")).toBeTruthy();
    expect(screen.getByText("sent")).toBeTruthy();
    expect(screen.getByText(/Initiator: admin/)).toBeTruthy();
    expect(screen.queryByText(/abcdabcd/)).toBeNull();
    expect(screen.queryByText(/@/)).toBeNull();
    expect(screen.queryByText(/^To:/)).toBeNull();
  });
});

describe("SendQuoteEmail claim toasts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderSender() {
    return render(
      <SendQuoteEmail
        quoteId={QUOTE_ID}
        customerName="Pat Boater"
        customerEmail="pat@example.com"
        motorModel="115 ELPT"
        totalPrice={18000}
        onDeliverySettled={mocks.onDeliverySettled}
      />,
    );
  }

  it("refuses a mismatch 409 instead of celebrating a send", async () => {
    const response = new Response(JSON.stringify({
      success: false,
      error: QUOTE_EMAIL_CLAIM_MISMATCH_ERROR,
    }), { status: 409, headers: { "Content-Type": "application/json" } });
    mocks.invoke.mockResolvedValue({
      data: null,
      error: {
        name: "FunctionsHttpError",
        message: "Edge Function returned a non-2xx status code",
        context: response,
      },
      response,
    });

    renderSender();
    fireEvent.click(screen.getByRole("button", { name: "Email Quote" }));

    await waitFor(() => {
      expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Send refused",
        description: QUOTE_EMAIL_CLAIM_MISMATCH_ERROR,
        variant: "destructive",
      }));
    });
    expect(mocks.toast).not.toHaveBeenCalledWith(expect.objectContaining({
      title: "Email Sent",
    }));
    expect(mocks.onDeliverySettled).not.toHaveBeenCalled();
    expect(screen.queryByText("Sent!")).toBeNull();
  });

  it("treats a verified send as success and a duplicate as already sent", async () => {
    mocks.invoke.mockResolvedValueOnce({
      data: { success: true, messageId: "msg-1" },
      error: null,
    });

    const first = renderSender();
    fireEvent.click(screen.getByRole("button", { name: "Email Quote" }));
    await waitFor(() => {
      expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Email Sent",
      }));
    });
    expect(mocks.onDeliverySettled).toHaveBeenCalledTimes(1);
    first.unmount();

    mocks.invoke.mockResolvedValueOnce({
      data: { success: true, duplicate: true, messageId: "msg-1" },
      error: null,
    });
    renderSender();
    fireEvent.click(screen.getByRole("button", { name: "Email Quote" }));
    await waitFor(() => {
      expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Already sent",
      }));
    });
  });
});
