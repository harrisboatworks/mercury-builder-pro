import { LuxuryHeader } from '@/components/ui/luxury-header';
import { COMPANY_INFO } from '@/lib/companyInfo';

export default function Terms() {
  return (
    <>
      <LuxuryHeader />
      <main className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-20">
          <h1 className="text-3xl md:text-4xl font-light text-foreground mb-2">
            Terms &amp; Conditions
          </h1>
          <p className="text-sm text-muted-foreground mb-10">Last updated February 12, 2026</p>

          <div className="prose prose-sm md:prose-base max-w-none text-foreground prose-headings:text-foreground prose-h2:text-2xl prose-h2:font-light prose-h2:mt-12 prose-h2:mb-6 prose-h3:text-lg prose-h3:font-medium prose-h3:mt-8 prose-h3:mb-3 prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-hr:border-border">

            {/* ===== PART A ===== */}
            <h2>Part A — Service, Repair &amp; Storage Terms</h2>

            <h3>1. Application</h3>
            <p>
              These terms apply to all boats, trailers, and equipment (&ldquo;Vessel&rdquo;) left with{' '}
              <strong>{COMPANY_INFO.name} Ltd.</strong> (&ldquo;HBW&rdquo;) for service, repair, or storage.
            </p>
            <hr />

            <h3>2. Authorization &amp; Operation of Vessel</h3>
            <p>By signing a work order, online service request, or storage agreement, the customer:</p>
            <ul>
              <li>Authorizes HBW to carry out requested repairs or services, including using necessary materials.</li>
              <li>Authorizes HBW staff to operate the Vessel for purposes of testing, inspection, or transport.</li>
              <li>Acknowledges responsibility for ensuring the Vessel, trailer, motor, and accessories are secure and suitable for transport by land or water.</li>
            </ul>
            <hr />

            <h3>3. Liability &amp; Acts of God</h3>
            <ul>
              <li>HBW will exercise <strong>reasonable care</strong> in handling and storing the Vessel.</li>
              <li>HBW is <strong>not responsible</strong> for loss, theft, damage, or delay unless caused by HBW&rsquo;s negligence or willful misconduct.</li>
              <li>HBW is specifically <strong>not liable</strong> for damage or loss caused by <strong>Acts of God or causes beyond its control</strong>, including but not limited to: fire, storm, flood, snow, ice, wind, falling trees or branches, vermin, rodents, birds, or other animals.</li>
              <li>Customers must maintain <strong>adequate insurance</strong> for their Vessel and accessories while in HBW&rsquo;s care.</li>
            </ul>
            <hr />

            <h3>4. Estimates &amp; Authorization of Work</h3>
            <ul>
              <li>Written or verbal estimates are available upon request.</li>
              <li>HBW will obtain customer approval before exceeding any estimate by more than 10%.</li>
              <li>Approval may be given in writing, electronically, or verbally.</li>
            </ul>
            <hr />

            <h3>5. Payment &amp; Interest</h3>
            <ul>
              <li>Payment in full is due before the Vessel is released.</li>
              <li>Storage and service fees accrue as posted at the time the Vessel is delivered to HBW.</li>
              <li>Overdue balances are subject to interest at <strong>2% per month (24% per annum)</strong>.</li>
            </ul>
            <hr />

            <h3>6. Repair &amp; Storage Lien; Abandonment</h3>
            <ul>
              <li>HBW has a <strong>repairer&rsquo;s and storage lien</strong> on all Vessels in its possession for unpaid charges, under the <strong>Repair and Storage Liens Act (Ontario)</strong> (&ldquo;RSLA&rdquo;).</li>
              <li>The Vessel will not be released until all charges are paid in full.</li>
              <li>If unpaid, HBW may enforce its lien, including by <strong>retaining, repossessing (if removed), and/or selling the Vessel</strong>, after providing written notice to the owner and any known secured parties as required by the RSLA.</li>
              <li>
                If the owner fails to respond within the statutory notice period, HBW may proceed with the sale. From sale proceeds, HBW is entitled to recover:
                <ul>
                  <li>All unpaid charges for service, repair, or storage;</li>
                  <li>All reasonable costs of enforcing the lien and conducting the sale.</li>
                </ul>
              </li>
              <li>Any surplus proceeds will be handled in accordance with the RSLA. If the sale proceeds are insufficient, the customer remains liable for the balance.</li>
              <li>A Vessel left more than <strong>90 days</strong> after completion of work or end of storage term, without payment or arrangements, may be deemed <strong>abandoned</strong> and subject to lien enforcement and sale.</li>
            </ul>
            <hr />

            <h3>7. Governing Law</h3>
            <p>
              These terms are governed exclusively by the <strong>laws of Ontario</strong> and subject to the jurisdiction of Ontario courts.
            </p>

            {/* ===== PART B ===== */}
            <h2 className="!mt-16">Part B — Website Use Terms</h2>
            <p>
              The following terms govern use of the <strong>{COMPANY_INFO.name}</strong> quote tool website (mercuryrepower.ca). These cover website browsing, e-commerce, and online content.
            </p>
            <p>
              <strong>Important Distinction:</strong> Part A (above) applies to all service, repair, and storage arrangements and is governed solely by Ontario law. Part B (below) applies only to use of this website.
            </p>
            <hr />

            <h3>Introduction</h3>
            <p>
              These Terms of Use (the &ldquo;Terms&rdquo;) govern this website and any related services (collectively, &ldquo;Services&rdquo;) that link to these Terms. These Terms are binding on all individuals and entities that access, visit, and/or use the Services, whether acting as an individual or on behalf of an entity, including those using automated or manual processes to harvest, crawl, index, scrape, spider, or mine digital content (collectively, &ldquo;you&rdquo; or &ldquo;your&rdquo;).
            </p>
            <p>
              The Terms may be modified at any time upon posting of the modified Terms. Any such modifications shall be effective immediately. By using the Services, you accept any changes and revisions to the Terms. If you do not agree with the Terms, your access to and use of the Services is unauthorized. We reserve the right to terminate, suspend, or restrict your access to the Services with or without notice.
            </p>
            <hr />

            <h3>Ownership</h3>
            <p>
              All information, text, images, video, audio, material, software, products or services (&ldquo;Content&rdquo;) included in the Services are and shall continue to be the property of {COMPANY_INFO.name} or its content suppliers, and are protected under applicable copyright, patent, trademark, and other proprietary rights. The text, information, images, audio, video, and all other content in the Services, including the selection, compilation, arrangement, presentation of all materials, and the overall design are protected by copyright.
            </p>
            <hr />

            <h3>Site Use</h3>
            <p>
              {COMPANY_INFO.name} grants you a limited, revocable, and nonexclusive permission to view and use the Services and to print individual pages from this website for your own personal, noncommercial use, provided that you agree to and accept without modification the notices, terms and conditions set forth herein. Your use of the Services is at the sole discretion of {COMPANY_INFO.name} and may be terminated at any time.
            </p>
            <p>Whether on behalf of yourself or another third party, you may NOT do any of the following in connection with the Services and Content:</p>
            <ul>
              <li>Modify, duplicate, adapt, translate, distribute, redistribute, transmit, display, perform, reproduce, publish, license, create derivative works from, transfer, sell, or otherwise exploit any Content for any purpose without express written consent.</li>
              <li>Download, copy, or transmit any Content for the benefit of any third party without express written consent.</li>
              <li>Interfere with or disrupt the operation of the Services or the systems, networks, or servers used to make the Services available, including by hacking or defacing any portion of the Services.</li>
              <li>Use any robot, spider, site search/retrieval application or other devices to access, modify, download, retrieve, index, query, scrape, data mine or otherwise collect or gather any Content, or reproduce or circumvent the navigational structure or presentation of the Services without express prior written consent.</li>
              <li>Make any commercial, advertising, promotional, or marketing use of the Services and/or Content, except as permitted by law or as expressly permitted in writing.</li>
            </ul>
            <hr />

            <h3>Compliance with Laws</h3>
            <p>
              You agree to comply with all applicable laws regarding your use of the Services and any purchase you make. You further agree that information provided by you is truthful and accurate to the best of your knowledge.
            </p>
            <hr />

            <h3>Third Party Sites</h3>
            <p>
              The Services may contain links to other websites on the Internet that are owned and operated by third parties (&ldquo;External Sites&rdquo;). We have no responsibility for content of these third party sites and therefore do not represent, warrant, or endorse that the contents of such third party sites are available, accurate, complete, or compliant with applicable laws.
            </p>
            <hr />

            <h3>Indemnification</h3>
            <p>
              You agree to indemnify, defend and hold {COMPANY_INFO.name} and its partners, agents, employees, and affiliates, harmless from any liability, loss, claim and expense, including reasonable attorney&rsquo;s fees, related to your violation of these Terms or use of the Services.
            </p>
            <hr />

            <h3>Disclaimer</h3>
            <p>
              THE INFORMATION IN THE SERVICES IS PROVIDED ON AN &ldquo;AS IS,&rdquo; &ldquo;AS AVAILABLE&rdquo; BASIS. YOU AGREE THAT USE OF THE SERVICES IS AT YOUR SOLE RISK. {COMPANY_INFO.name.toUpperCase()} DISCLAIMS ALL WARRANTIES OF ANY KIND, INCLUDING BUT NOT LIMITED TO ANY EXPRESS WARRANTIES, STATUTORY WARRANTIES, AND ANY IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. YOUR SOLE AND EXCLUSIVE REMEDY RELATING TO YOUR USE OF THE SERVICES SHALL BE TO DISCONTINUE USING THE SERVICES.
            </p>
            <hr />

            <h3>Limitation of Liability</h3>
            <p>
              UNDER NO CIRCUMSTANCES WILL {COMPANY_INFO.name.toUpperCase()} BE LIABLE OR RESPONSIBLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, EXEMPLARY, PUNITIVE, OR OTHER DAMAGES, UNDER ANY LEGAL THEORY, ARISING OUT OF OR IN ANY WAY RELATING TO THE SERVICES, YOUR USE, OR THE CONTENT, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. YOUR SOLE REMEDY FOR DISSATISFACTION WITH THE SERVICES AND/OR CONTENT IS TO CEASE ALL USE.
            </p>
            <p>
              Price and availability information is subject to change without notice. {COMPANY_INFO.name} shall not be required or obligated to honor any price if said price is incorrect or inaccurate.
            </p>
            <hr />

            <h3>Privacy</h3>
            <p>
              Your use of our Services is also governed by our Privacy Policy. This website is intended for adults only and is not intended for any children under the age of 13.
            </p>
            <hr />

            <h3>Communication</h3>
            <p>
              You agree that by providing your phone number, {COMPANY_INFO.name} may call and/or send text messages about your interest in products, merchandise, financing, marketing or sales purposes, appointment information, or for any other purpose related to your account. You do not have to consent to receiving calls or texts to purchase from {COMPANY_INFO.name}.
            </p>
            <hr />

            <h3>Acceptance of Orders</h3>
            <p>
              The receipt of an e-mail order confirmation or reservation of a part, accessory, or unit does not constitute the acceptance of an order or a confirmation of an offer to sell. {COMPANY_INFO.name} reserves the right, without prior notification, to limit the order quantity on any item and/or refuse service to any customer. {COMPANY_INFO.name} may cancel an order at any time before delivery or pickup for any reason, including pricing errors or stock availability issues.
            </p>
            <hr />

            <h3>Pricing, Availability, Taxes &amp; Surcharges</h3>
            <p>
              All prices are subject to change without notice. Prices do not include applicable taxes, shipping, and handling charges, which may be calculated and added at checkout. You are responsible for paying all applicable sales, use, value-added, and other taxes, duties, and charges associated with your purchase.
            </p>
            <hr />

            <h3>Copyrights &amp; Copyright Agent</h3>
            <p>
              If you believe your work has been copied in a way that constitutes copyright infringement, or your intellectual property rights have otherwise been violated, please provide a notice containing all of the following information to our Copyright Agent:
            </p>
            <ul>
              <li>An electronic or physical signature of the person authorized to act on behalf of the owner of the copyright or other intellectual property interest;</li>
              <li>A description of the copyrighted work that you claim has been infringed;</li>
              <li>A description of where the material that you claim is infringing is located on this website;</li>
              <li>Your address, telephone number, and e-mail address;</li>
              <li>A statement by you that you have a good faith belief that the disputed use is not authorized by the copyright owner, its agent, or the law;</li>
              <li>A statement by you, made under penalty of perjury, that the above information in your notice is accurate and that you are the copyright owner or authorized to act on the copyright owner&rsquo;s behalf.</li>
            </ul>
            <p>
              Claims of copyright infringement can be sent to:{' '}
              <a href={`mailto:${COMPANY_INFO.contact.email}`} className="text-primary hover:underline">
                {COMPANY_INFO.contact.email}
              </a>
            </p>
            <hr />

            <h3>Governing Law</h3>
            <p>
              You agree that the laws of the <strong>Province of Ontario, Canada</strong>, without regard to conflicts of laws provisions, will govern these Terms and any dispute that may arise between you and {COMPANY_INFO.name}.
            </p>
            <hr />

            <h3>Other Terms</h3>
            <p>
              If any provision of these Terms shall be adjudged by any court of competent jurisdiction to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary so that these Terms will otherwise remain in full force and effect. The failure of {COMPANY_INFO.name} to exercise or enforce any right or provision of the Terms shall not operate as a waiver of such right or provision. These Terms constitute the entire agreement between you and {COMPANY_INFO.name} governing your use of the Services.
            </p>
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
