import { LuxuryHeader } from '@/components/ui/luxury-header';
import { COMPANY_INFO } from '@/lib/companyInfo';

export default function Privacy() {
  return (
    <>
      <LuxuryHeader />
      <main className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-20">
          <h1 className="text-3xl md:text-4xl font-light text-foreground mb-2">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground mb-10">Last updated February 12, 2026</p>

          <div className="prose prose-sm md:prose-base max-w-none text-foreground prose-headings:text-foreground prose-h2:text-2xl prose-h2:font-light prose-h2:mt-12 prose-h2:mb-6 prose-h3:text-lg prose-h3:font-medium prose-h3:mt-8 prose-h3:mb-3 prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-hr:border-border">

            <h2>1. Introduction</h2>
            <p>
              <strong>{COMPANY_INFO.name} Ltd.</strong> (&ldquo;HBW,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you visit our website at <strong>mercuryrepower.ca</strong> and use our services.
            </p>
            <p>
              We comply with the <strong>Personal Information Protection and Electronic Documents Act (PIPEDA)</strong> and applicable Canadian privacy legislation.
            </p>
            <hr />

            <h2>2. Information We Collect</h2>

            <h3>Information You Provide</h3>
            <ul>
              <li><strong>Contact information:</strong> Name, email address, phone number, and mailing address.</li>
              <li><strong>Quote &amp; purchase data:</strong> Motor preferences, boat information, trade-in details, financing applications, and payment information.</li>
              <li><strong>Account information:</strong> Login credentials when you create an account.</li>
              <li><strong>Communications:</strong> Messages sent through our contact forms, chat, or email correspondence.</li>
              <li><strong>Financing applications:</strong> Employment details, financial information, and Social Insurance Number (SIN), which is encrypted at rest using industry-standard encryption.</li>
            </ul>

            <h3>Information Collected Automatically</h3>
            <ul>
              <li><strong>Usage data:</strong> Pages visited, time spent on pages, and navigation patterns.</li>
              <li><strong>Device information:</strong> Browser type, operating system, and screen resolution.</li>
              <li><strong>Cookies &amp; similar technologies:</strong> Session identifiers and preferences.</li>
            </ul>
            <hr />

            <h2>3. How We Use Your Information</h2>
            <p>We use your personal information to:</p>
            <ul>
              <li>Generate and manage motor quotes and pricing.</li>
              <li>Process financing applications and deposits.</li>
              <li>Communicate about your quotes, orders, and service appointments.</li>
              <li>Send promotional offers and notifications you have opted into.</li>
              <li>Improve our website, products, and services.</li>
              <li>Comply with legal and regulatory obligations.</li>
            </ul>
            <hr />

            <h2>4. Third-Party Services</h2>
            <p>We use trusted third-party services to operate our business. These services may process your data as described below:</p>
            <ul>
              <li><strong>Supabase:</strong> Database hosting and authentication.</li>
              <li><strong>Stripe:</strong> Payment processing for deposits. Stripe&rsquo;s privacy policy applies to payment data.</li>
              <li><strong>Resend:</strong> Transactional and marketing email delivery.</li>
              <li><strong>Twilio:</strong> SMS notifications.</li>
              <li><strong>TikTok:</strong> Social media integration for content posting. Subject to TikTok&rsquo;s privacy policy.</li>
              <li><strong>Google:</strong> Maps, Places API, and analytics services.</li>
            </ul>
            <p>
              We do not sell your personal information to third parties. We only share information as necessary to provide our services or as required by law.
            </p>
            <hr />

            <h2>5. Data Retention</h2>
            <ul>
              <li><strong>Quote data:</strong> Retained for the duration of your account, or until you request deletion.</li>
              <li><strong>Financing applications:</strong> Retained as required by financial regulations and our data retention policies. Declined or withdrawn applications are purged according to our retention schedule.</li>
              <li><strong>Communication records:</strong> Retained for up to 2 years for customer service purposes.</li>
              <li><strong>Security audit logs:</strong> Retained for compliance and security monitoring.</li>
            </ul>
            <hr />

            <h2>6. Your Rights Under PIPEDA</h2>
            <p>You have the right to:</p>
            <ul>
              <li><strong>Access</strong> your personal information held by us.</li>
              <li><strong>Correct</strong> inaccurate or incomplete information.</li>
              <li><strong>Withdraw consent</strong> for the collection, use, or disclosure of your information (subject to legal or contractual restrictions).</li>
              <li><strong>Request deletion</strong> of your personal information.</li>
              <li><strong>Unsubscribe</strong> from marketing communications at any time.</li>
            </ul>
            <p>
              To exercise any of these rights, contact us at{' '}
              <a href={`mailto:${COMPANY_INFO.contact.email}`} className="text-primary hover:underline">
                {COMPANY_INFO.contact.email}
              </a>.
            </p>
            <hr />

            <h2>7. Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information, including:
            </p>
            <ul>
              <li>Encryption of sensitive data (e.g., SIN numbers) at rest and in transit.</li>
              <li>Role-based access controls for administrative functions.</li>
              <li>Regular security audits and monitoring.</li>
              <li>Secure authentication and session management.</li>
            </ul>
            <p>
              While we strive to protect your information, no method of electronic storage or transmission is 100% secure. We cannot guarantee absolute security.
            </p>
            <hr />

            <h2>8. Cookies</h2>
            <p>
              Our website uses cookies and similar technologies to maintain your session, remember preferences, and improve your experience. You can control cookie settings through your browser. Disabling cookies may affect the functionality of certain features.
            </p>
            <hr />

            <h2>9. Children&rsquo;s Privacy</h2>
            <p>
              Our services are not intended for individuals under the age of 13. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
            </p>
            <hr />

            <h2>10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated &ldquo;Last updated&rdquo; date. Your continued use of our services after changes constitutes acceptance of the revised policy.
            </p>
            <hr />

            <h2>11. Contact Us</h2>
            <p>
              If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
            </p>
            <ul>
              <li><strong>Email:</strong>{' '}
                <a href={`mailto:${COMPANY_INFO.contact.email}`} className="text-primary hover:underline">
                  {COMPANY_INFO.contact.email}
                </a>
              </li>
              <li><strong>Phone:</strong>{' '}
                <a href={`tel:${COMPANY_INFO.contact.phone}`} className="text-primary hover:underline">
                  {COMPANY_INFO.contact.phone}
                </a>
              </li>
              <li><strong>Address:</strong> {COMPANY_INFO.address.full}</li>
            </ul>
          </div>

          <div className="mt-16 pt-8 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} {COMPANY_INFO.name} Ltd. &middot;{' '}
              {COMPANY_INFO.address.full} &middot;{' '}
              <a href={`tel:${COMPANY_INFO.contact.phone}`} className="text-primary hover:underline">
                {COMPANY_INFO.contact.phone}
              </a>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
