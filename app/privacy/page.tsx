import Link from "next/link";
import LegalPageLayout, { LegalSection, type LegalTocItem } from "@/components/legal/LegalPageLayout";

export const metadata = {
  title: "Privacy Policy — UpSycle Market",
};

const toc: LegalTocItem[] = [
  { id: "overview", label: "Overview" },
  { id: "collect", label: "Information We Collect" },
  { id: "use", label: "How We Use Information" },
  { id: "share", label: "How We Share Information" },
  { id: "cookies", label: "Cookies & Tracking" },
  { id: "payments", label: "Payments & Financial Data" },
  { id: "retention", label: "Data Retention" },
  { id: "rights", label: "Your Choices & Rights" },
  { id: "security", label: "Data Security" },
  { id: "children", label: "Children's Privacy" },
  { id: "international", label: "International Users" },
  { id: "thirdparty", label: "Third-Party Links" },
  { id: "changes", label: "Changes to This Policy" },
  { id: "contact", label: "Contact Us" },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      eyebrow="UpSycle Market"
      title="Privacy Policy"
      effectiveDate={<span className="legal-placeholder">[Insert Effective Date]</span>}
      lastUpdated={<span className="legal-placeholder">[Insert Date]</span>}
      disclaimer={
        <>
          This is a starting draft, not legal advice. Privacy obligations depend on where your
          users are located &mdash; California (CCPA/CPRA), other US states, and internationally
          (e.g. GDPR) all impose different requirements. Have an attorney review this before
          publishing, and update it as soon as your data practices, processors, or tracking tools
          change.
        </>
      }
      toc={toc}
    >
      <LegalSection id="overview" num="01" title="Overview">
        <p>
          This Privacy Policy explains how{" "}
          <span className="legal-placeholder">[Legal Entity Name, e.g. UpSycle Market LLC]</span>{" "}
          (&ldquo;UpSycle Market,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;)
          collects, uses, shares, and protects information when you use our website, app, and
          related services (the &ldquo;Platform&rdquo;), whether you&rsquo;re browsing, buying, or
          selling.
        </p>
        <p>
          This policy should be read alongside our <Link href="/terms">Terms &amp; Conditions</Link>.
        </p>
      </LegalSection>

      <LegalSection id="collect" num="02" title="Information We Collect">
        <h3>Information you give us</h3>
        <table className="legal-table">
          <tbody>
            <tr>
              <th>Category</th>
              <th>Examples</th>
            </tr>
            <tr>
              <td>Account info</td>
              <td>Name, email, password, profile photo</td>
            </tr>
            <tr>
              <td>Seller profile</td>
              <td>Business/artist name, bio, artist story, product photos, portfolio links</td>
            </tr>
            <tr>
              <td>Order info</td>
              <td>Shipping address, billing address, order history, messages with buyers/sellers</td>
            </tr>
            <tr>
              <td>Payment onboarding</td>
              <td>
                Bank details and identity information submitted to our payment processor for
                payouts (we don&rsquo;t store full account or card numbers ourselves)
              </td>
            </tr>
            <tr>
              <td>Support requests</td>
              <td>Anything you share when contacting us for help</td>
            </tr>
          </tbody>
        </table>

        <h3>Information collected automatically</h3>
        <ul>
          <li>Device and browser type, IP address, approximate location</li>
          <li>Pages viewed, searches, listings clicked, time on site</li>
          <li>
            Cookies and similar technologies (see <a href="#cookies">Section 5</a>)
          </li>
        </ul>

        <h3>Information from third parties</h3>
        <ul>
          <li>Identity verification results from our payment processor</li>
          <li>Information from social login providers, if you choose to sign in that way</li>
          <li>Delivery status from shipping carriers</li>
        </ul>
      </LegalSection>

      <LegalSection id="use" num="03" title="How We Use Information">
        <ul>
          <li>Operate the marketplace &mdash; create accounts, process orders, connect buyers and sellers</li>
          <li>Facilitate payments and seller payouts</li>
          <li>Verify seller identity and prevent fraud</li>
          <li>Provide customer support and resolve disputes</li>
          <li>
            Send order updates, account notices, and &mdash; where you&rsquo;ve opted in &mdash;
            marketing communications
          </li>
          <li>Improve the Platform, including search, recommendations, and site performance</li>
          <li>Meet legal and tax obligations</li>
        </ul>
      </LegalSection>

      <LegalSection id="share" num="04" title="How We Share Information">
        <p>We don&rsquo;t sell your personal information. We share it only as needed to run the Platform:</p>
        <ul>
          <li>
            <strong>Between buyers and sellers</strong> &mdash; to fulfill an order, sellers
            receive the buyer&rsquo;s shipping details and order contents; buyers can see the
            seller&rsquo;s public profile and shop info.
          </li>
          <li>
            <strong>Service providers</strong> &mdash; payment processing (
            <span className="legal-placeholder">e.g. Stripe</span>), hosting and infrastructure (
            <span className="legal-placeholder">e.g. Sharetribe</span>), shipping carriers, email
            and analytics tools, all bound by confidentiality and data-use obligations.
          </li>
          <li>
            <strong>Rewards partners</strong> &mdash; where you participate in our seller rewards
            program, limited information needed to issue a reward (e.g. gift card fulfillment) may
            be shared with the partner.
          </li>
          <li>
            <strong>Legal &amp; safety</strong> &mdash; where required by law, to enforce our
            Terms, or to protect the rights, property, or safety of UpSycle Market, our users, or
            the public.
          </li>
          <li>
            <strong>Business transfers</strong> &mdash; if UpSycle Market is involved in a merger,
            acquisition, or asset sale, information may be transferred as part of that transaction.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="cookies" num="05" title="Cookies & Tracking">
        <p>
          We use cookies and similar technologies to keep you signed in, remember preferences,
          understand how the Platform is used, and &mdash; where enabled &mdash; measure the
          performance of our marketing. You can control cookies through your browser settings{" "}
          <span className="legal-placeholder">
            [and via our cookie preference banner, if implemented]
          </span>
          . Turning some cookies off may affect how the Platform works.
        </p>
      </LegalSection>

      <LegalSection id="payments" num="06" title="Payments & Financial Data">
        <p>
          Payments and seller payouts are handled by our third-party payment processor. Card
          numbers and bank account details you submit go directly to the processor under its own
          privacy and security practices &mdash; UpSycle Market does not store full payment card
          numbers on our own servers.
        </p>
      </LegalSection>

      <LegalSection id="retention" num="07" title="Data Retention">
        <p>
          We keep information for as long as your account is active and as needed to provide the
          Platform, resolve disputes, enforce our agreements, and meet legal, tax, and accounting
          requirements. When information is no longer needed, we delete or anonymize it.
        </p>
      </LegalSection>

      <LegalSection id="rights" num="08" title="Your Choices & Rights">
        <p>
          Depending on where you live, you may have the right to access, correct, delete, or
          export your personal information, or to opt out of certain uses such as targeted
          advertising.{" "}
          <span className="legal-placeholder">
            [This section should be expanded with specific mechanisms and timelines for CCPA/CPRA
            (California), and any other applicable state or international laws, once your user
            base and legal counsel confirm which apply.]
          </span>
        </p>
        <ul>
          <li>
            <strong>Account information</strong> &mdash; update most details directly in your
            account settings.
          </li>
          <li>
            <strong>Marketing emails</strong> &mdash; unsubscribe via the link in any marketing
            email.
          </li>
          <li>
            <strong>Deletion requests</strong> &mdash; contact us using the details in{" "}
            <a href="#contact">Section 14</a>; we may need to retain some information where
            required by law (e.g. completed transaction and tax records).
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="security" num="09" title="Data Security">
        <p>
          We use reasonable technical and organizational measures to protect your information. No
          method of transmission or storage is completely secure, and we can&rsquo;t guarantee
          absolute security.
        </p>
      </LegalSection>

      <LegalSection id="children" num="10" title="Children's Privacy">
        <p>
          The Platform is intended for users 18 and older. We don&rsquo;t knowingly collect
          personal information from children. If you believe a child has provided us information,
          contact us so we can remove it.
        </p>
      </LegalSection>

      <LegalSection id="international" num="11" title="International Users">
        <p>
          UpSycle Market is based in the United States, and information may be processed and
          stored there. If you access the Platform from outside the US, you understand your
          information will be transferred to and processed in the US.
        </p>
      </LegalSection>

      <LegalSection id="thirdparty" num="12" title="Third-Party Links">
        <p>
          Seller shops, listings, or our marketing may link to third-party sites we don&rsquo;t
          control. This Policy doesn&rsquo;t cover those sites &mdash; check their own privacy
          policies before sharing information.
        </p>
      </LegalSection>

      <LegalSection id="changes" num="13" title="Changes to This Policy">
        <p>
          We may update this Policy from time to time. Material changes will be posted on this
          page, with the &ldquo;last updated&rdquo; date revised; where required by law,
          we&rsquo;ll provide additional notice.
        </p>
      </LegalSection>

      <LegalSection id="contact" num="14" title="Contact Us">
        <p>
          Questions about this Policy or your information can be sent to{" "}
          <span className="legal-placeholder">[privacy@upsyclemarket.com]</span> or to{" "}
          <span className="legal-placeholder">[mailing address]</span>.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
