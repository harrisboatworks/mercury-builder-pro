import { useState, FormEvent } from "react";

type Status = "idle" | "loading" | "success" | "error";

const SUPABASE_URL =
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  "https://eutsoqdpjurknjsshxes.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY || "";

const PDF_URL = "/lovable-uploads/HBW-Used-Boat-Walkaround-Guide.pdf";

export default function WalkaroundLeadCapture() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/subscribe-walkaround`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          firstName: firstName.trim() || undefined,
        }),
      });
      if (res.ok) setStatus("success");
      else setStatus("error");
    } catch {
      setStatus("error");
    }
  };

  const btnClass =
    "bg-[#E26A2C] hover:bg-[#c95a23] text-white font-semibold px-6 py-3 rounded-md w-full sm:w-auto transition-colors";

  const inputClass =
    "bg-white !text-[#0B2545] placeholder:text-[#0B2545]/50 text-base px-3 py-2 h-11 rounded-md border border-white/20 w-full focus:outline-none focus:ring-2 focus:ring-[#8ec0df]";

  if (status === "success") {
    return (
      <div className="not-prose bg-[#20384d] text-white rounded-md p-6 my-8 border border-white/10 shadow-sm">
        <h3 className="!text-white text-xl font-semibold !mt-0 mb-2 leading-snug">Thanks — your guide is ready</h3>
        <p className="text-[#f4f7f9]/90 text-sm leading-relaxed mb-4">
          Check your email for confirmation. Or grab the PDF right now:
        </p>
        <a
          href={PDF_URL}
          target="_blank"
          rel="noopener"
          className={`${btnClass} inline-block text-center`}
        >
          Download the PDF
        </a>
      </div>
    );
  }

  return (
    <div className="not-prose bg-[#20384d] text-white rounded-md p-6 my-8 border border-white/10 shadow-sm">
      <h3 className="!text-white text-xl font-semibold !mt-0 mb-2 leading-snug">Get the printable PDF</h3>
      <p className="text-[#f4f7f9]/90 text-sm leading-relaxed mb-4">
        Free 13-page used-boat inspection guide. We'll email you the link plus occasional
        Rice Lake &amp; Mercury repower tips. Unsubscribe anytime.
      </p>
      <form onSubmit={handleSubmit} className="max-w-md">
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <input
            type="text"
            name="firstName"
            placeholder="First name (optional)"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={inputClass}
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        <button type="submit" disabled={status === "loading"} className={btnClass}>
          {status === "loading" ? "Sending\u2026" : "Get the guide"}
        </button>
        {status === "error" && (
          <p className="text-red-300 text-sm mt-3">
            Something went wrong. Please try again or email info@harrisboatworks.ca.
          </p>
        )}
      </form>
    </div>
  );
}
