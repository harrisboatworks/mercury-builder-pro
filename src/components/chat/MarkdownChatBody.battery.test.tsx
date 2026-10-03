import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { buildVerifiedMercuryTechnicalAnswer } from "../../../supabase/functions/_shared/verified-mercury-technical-facts";
import { MarkdownChatBody } from "./MarkdownChatBody";

const answer = buildVerifiedMercuryTechnicalAnswer("What battery does my Mercury outboard need?")!;
const guideLabel = "HBW's Mercury outboard battery-size guide";
const guideUrl = "https://www.mercuryrepower.ca/blog/mercury-outboard-battery-size-guide";

describe("battery manual handoff in chat", () => {
  it.each([undefined, vi.fn()])("renders both links with navigation callback %s", (onInternalLink) => {
    render(<MarkdownChatBody text={answer} isUser={false} onInternalLink={onInternalLink} />);

    expect(screen.getByRole("link", { name: "Mercury's owner-manual lookup" }))
      .toHaveAttribute("href", "https://www.mercurymarine.com/ca/en/service-and-support/owners-resources");
    const guide = screen.getByRole("link", { name: guideLabel });
    expect(guide).toHaveAttribute("href", guideUrl);
    expect(guide).toHaveAttribute("target", "_blank");
    expect(guide).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText(/I won't guess/)).toBeInTheDocument();
  });
});
