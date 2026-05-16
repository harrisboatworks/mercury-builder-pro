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
    "bg-[#E26A2C] hover:bg-[#c95a23] text-white font-semibold px-6 py-3 rounded w-full sm:w-auto transition-colors";

  if (status === "success") {
    return (
      <div className="bg-[#0B2545] text-white rounded-lg p-6 my-8">
        <h3 className="text-xl font-bold mb-2">Thanks &mdash; your guide is ready</h3>
        <p className="text-sm opacity-90 mb-4">
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
    <div className="bg-[#0B2545] text-white rounded-lg p-6 my-8">
      <h3 className="text-xl font-bold mb-2">Get the printable PDF</h3>
      <p className="text-sm opacity-90 mb-4">
        Free 13-page used-boat inspection guide. We'll email you the link plus occasional
        Rice Lake &amp; Mercury repower tips. Unsubscribe anytime.
      </p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="firstName"
          placeholder="First name (optional)"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="bg-white text-[#0B2545] px-4 py-3 rounded w-full mb-3"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-white text-[#0B2545] px-4 py-3 rounded w-full mb-3"
        />
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
