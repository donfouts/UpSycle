import Link from "next/link";
import LegalPageLayout, { LegalSection, type LegalTocItem } from "@/components/legal/LegalPageLayout";

export const metadata = {
  title: "Terms & Conditions — UpSycle Market",
};

const toc: LegalTocItem[] = [
  { id: "acceptance", label: "Acceptance of Terms" },
  { id: "platform", label: "What UpSycle Market Is" },
  { id: "eligibility", label: "Eligibility & Accounts" },
  { id: "sellers", label: "Seller Terms" },
  { id: "buyers", label: "Buyer Terms" },
  { id: "fees", label: "Fees & Payments" },
  { id: "rewards", label: "Rewards Program" },
  { id: "ip", label: "Intellectual Property" },
  { id: "conduct", label: "Prohibited Conduct" },
  { id: "content", label: "User Content & Reviews" },
  { id: "liability", label: "Disclaimers & Liability" },
  { id: "indemnity", label: "Indemnification" },
  { id: "disputes", label: "Dispute Resolution" },
  { id: "termination", label: "Termination" },
  { id: "changes", label: "Changes to These Terms" },
  { id: "law", label: "Governing Law" },
  { id: "contact", label: "Contact" },
];

export default function TermsPage() {
  return (
    <LegalPageLayout
      eyebrow="UpSycle Market"
      title="Terms & Conditions"
      effectiveDate={<span className="legal-placeholder">[Insert Effective Date]</span>}
      lastUpdated={<span className="legal-placeholder">[Insert Date]</span>}
      disclaimer={
        <>
          This page is a starting draft built around what&rsquo;s currently known about UpSycle
          Market&rsquo;s fee structure and marketplace model. It is not legal advice. Have an
          attorney licensed in your state review it &mdash; especially the arbitration, liability,
          and tax sections &mdash; before publishing, since marketplace facilitator and seller-fee
          rules vary by state and change often.
        </>
      }
      toc={toc}
    >
      <LegalSection id="acceptance" num="01" title="Acceptance of Terms">
        <p>
          These Terms and Conditions (&ldquo;Terms&rdquo;) govern access to and use of the UpSycle
          Market website, mobile experience, and related services (collectively, the
          &ldquo;Platform&rdquo;), operated by{" "}
          <span className="legal-placeholder">[Legal Entity Name, e.g. UpSycle Market LLC]</span>{" "}
          (&ldquo;UpSycle Market,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;).
        </p>
        <p>
          By creating an account, browsing listings, or making a purchase on the Platform, you
          agree to be bound by these Terms and by our <Link href="/privacy">Privacy Policy</Link>.
          If you don&rsquo;t agree, please don&rsquo;t use the Platform.
        </p>
      </LegalSection>

      <LegalSection id="platform" num="02" title="What UpSycle Market Is">
        <p>
          UpSycle Market is a curated online marketplace connecting buyers with independent
          artists selling handmade and upcycled goods. We provide the platform, tools, and payment
          infrastructure that make those transactions possible &mdash; but each listing is
          created, priced, and fulfilled by the individual seller, not by UpSycle Market.
        </p>
        <p>
          We are a marketplace facilitator, not the manufacturer, seller, or owner of the goods
          listed. Contracts of sale are formed directly between buyers and sellers; UpSycle Market
          is not a party to that sale except as described in these Terms.
        </p>
      </LegalSection>

      <LegalSection id="eligibility" num="03" title="Eligibility & Accounts">
        <p>
          You must be at least 18 years old and able to form a binding contract to create an
          account. You&rsquo;re responsible for keeping your account credentials secure and for
          all activity that happens under your account.
        </p>
        <p>
          Information you provide during registration &mdash; including for identity verification
          and payment onboarding &mdash; must be accurate and kept up to date. We may suspend or
          terminate accounts that provide false or misleading information.
        </p>
      </LegalSection>

      <LegalSection id="sellers" num="04" title="Seller Terms">
        <h3>Who can sell</h3>
        <p>
          UpSycle Market is reserved for independent artists and makers selling goods that are
          genuinely handmade, upcycled, reclaimed, or meaningfully transformed by the seller. We
          reserve the right to review, decline, or remove listings and sellers that don&rsquo;t
          meet this standard, including mass-produced, drop-shipped, or resold commercial goods.
        </p>

        <h3>Listings</h3>
        <ul>
          <li>Listings must accurately describe the item, its materials, condition, and origin.</li>
          <li>
            Sellers set their own prices, shipping terms, and return policies, within the bounds of
            these Terms and any published Marketplace Guidelines.
          </li>
          <li>Sellers are solely responsible for the safety, legality, and quality of the goods they list.</li>
        </ul>

        <h3>Onboarding &amp; payments</h3>
        <p>
          Sellers complete identity and payout onboarding through our third-party payment
          processor. You authorize UpSycle Market and our payment processor to verify your
          information and to remit payments owed to you, less applicable fees, to the account you
          provide.
        </p>

        <h3>Fees</h3>
        <p>
          Selling on UpSycle Market involves a monthly subscription fee plus a per-sale transaction
          fee, described in <a href="#fees">Section 6</a>. Fees are non-refundable except as
          required by law or expressly stated otherwise.
        </p>

        <h3>Shipping &amp; fulfillment</h3>
        <p>
          Sellers are responsible for packaging and shipping orders within the timeframe stated on
          their listing, and for the accuracy of tracking information provided to buyers.
        </p>

        <h3>Taxes</h3>
        <p>
          Sellers are responsible for determining and remitting any taxes owed on their sales.
          Where required by law, UpSycle Market may collect and remit marketplace facilitator
          taxes on your behalf; this does not relieve you of your own tax filing obligations.
        </p>
      </LegalSection>

      <LegalSection id="buyers" num="05" title="Buyer Terms">
        <p>
          When you place an order, you&rsquo;re entering into a contract directly with the seller.
          A service fee is added at checkout, described in <a href="#fees">Section 6</a>.
        </p>
        <ul>
          <li>Orders are subject to seller availability and acceptance.</li>
          <li>
            Returns, exchanges, and refunds are governed by the individual seller&rsquo;s stated
            policy, shown on the listing before purchase, unless otherwise required by law.
          </li>
          <li>If an item doesn&rsquo;t arrive or doesn&rsquo;t match its listing, buyers may open a dispute through the Platform for review.</li>
        </ul>
      </LegalSection>

      <LegalSection id="fees" num="06" title="Fees & Payments">
        <p>
          The following fees apply to activity on the Platform. Current rates are also shown at
          checkout and in your seller dashboard, which control in the event of a discrepancy with
          this page.
        </p>
        <table className="legal-table">
          <tbody>
            <tr>
              <th>Fee</th>
              <th>Who pays</th>
              <th>Amount</th>
            </tr>
            <tr>
              <td>Seller subscription</td>
              <td>Sellers</td>
              <td>
                <span className="legal-placeholder">Starting at $19.99/mo</span>, with higher
                tiers up to <span className="legal-placeholder">$299/mo</span>
              </td>
            </tr>
            <tr>
              <td>Transaction fee</td>
              <td>Sellers</td>
              <td>
                <span className="legal-placeholder">3&ndash;8% per sale</span>, depending on
                subscription tier
              </td>
            </tr>
            <tr>
              <td>Buyer service fee</td>
              <td>Buyers</td>
              <td>Added at checkout, shown before payment</td>
            </tr>
            <tr>
              <td>Payment processing</td>
              <td>Sellers</td>
              <td>Standard third-party processor rates</td>
            </tr>
          </tbody>
        </table>
        <p>
          All payments are processed through our third-party payment processor. UpSycle Market
          does not store your full payment card details.
        </p>
      </LegalSection>

      <LegalSection id="rewards" num="07" title="Rewards Program">
        <p>
          UpSycle Market may offer eligible sellers rewards &mdash; such as gift cards from partner
          retailers &mdash; for reaching certain milestones. Rewards are subject to separate
          program terms, partner availability, and may change or end at any time. Participation in
          a partner rewards program does not make that partner a party to these Terms.
        </p>
      </LegalSection>

      <LegalSection id="ip" num="08" title="Intellectual Property">
        <p>
          Sellers retain ownership of their original designs and creative work, and grant UpSycle
          Market a license to display, promote, and reproduce listing content (photos,
          descriptions) on the Platform and in our marketing.
        </p>
        <p>
          The UpSycle Market name, logo, and site design are our property and may not be used
          without permission. Sellers may not list items that infringe another party&rsquo;s
          copyright, trademark, or other rights.
        </p>
      </LegalSection>

      <LegalSection id="conduct" num="09" title="Prohibited Conduct">
        <ul>
          <li>Listing counterfeit, stolen, recalled, or unsafe goods</li>
          <li>Misrepresenting an item&rsquo;s materials, origin, or handmade status</li>
          <li>Circumventing the Platform to avoid fees</li>
          <li>Harassment, discrimination, or abusive communication with other users</li>
          <li>Manipulating reviews, ratings, or search rankings</li>
          <li>Attempting to interfere with or reverse-engineer the Platform</li>
        </ul>
      </LegalSection>

      <LegalSection id="content" num="10" title="User Content & Reviews">
        <p>
          You&rsquo;re responsible for content you post &mdash; listings, photos, reviews,
          messages. Reviews must reflect genuine experiences. We may remove content that violates
          these Terms or our community guidelines.
        </p>
      </LegalSection>

      <LegalSection id="liability" num="11" title="Disclaimers & Limitation of Liability">
        <p>
          The Platform is provided &ldquo;as is.&rdquo; UpSycle Market doesn&rsquo;t manufacture or
          inspect seller goods and makes no warranty as to their quality, safety, or fitness for a
          particular purpose.
        </p>
        <p>
          To the fullest extent permitted by law, UpSycle Market is not liable for indirect,
          incidental, or consequential damages arising from your use of the Platform, or from any
          transaction between a buyer and seller. Our total liability for any claim is limited to
          the fees you paid to UpSycle Market in the{" "}
          <span className="legal-placeholder">[12 months]</span> preceding the claim.
        </p>
      </LegalSection>

      <LegalSection id="indemnity" num="12" title="Indemnification">
        <p>
          You agree to defend and indemnify UpSycle Market against claims, losses, and expenses
          arising from your breach of these Terms, your listings, or your violation of any law or
          third-party right.
        </p>
      </LegalSection>

      <LegalSection id="disputes" num="13" title="Dispute Resolution">
        <p>
          <span className="legal-placeholder">
            [Placeholder &mdash; arbitration clauses carry specific state and federal requirements
            (e.g. opt-out windows, class-action waiver enforceability) and should be drafted or
            reviewed by counsel rather than templated.]
          </span>{" "}
          Generally: disputes between buyers and sellers should first be raised through our
          resolution center; disputes between you and UpSycle Market will be resolved as described
          here once finalized.
        </p>
      </LegalSection>

      <LegalSection id="termination" num="14" title="Termination">
        <p>
          You may close your account at any time. We may suspend or terminate accounts that
          violate these Terms, pose a risk to the Platform or other users, or as required by law.
          Sections that by their nature should survive termination (fees owed, liability, dispute
          resolution) will continue to apply.
        </p>
      </LegalSection>

      <LegalSection id="changes" num="15" title="Changes to These Terms">
        <p>
          We may update these Terms from time to time. Material changes will be notified via the
          Platform or email before taking effect. Continued use after changes take effect means you
          accept the updated Terms.
        </p>
      </LegalSection>

      <LegalSection id="law" num="16" title="Governing Law">
        <p>
          These Terms are governed by the laws of the State of California, without regard to
          conflict-of-law principles, unless otherwise required by applicable consumer protection
          law in your jurisdiction.
        </p>
      </LegalSection>

      <LegalSection id="contact" num="17" title="Contact">
        <p>
          Questions about these Terms can be sent to{" "}
          <span className="legal-placeholder">[support@upsyclemarket.com]</span> or to{" "}
          <span className="legal-placeholder">[mailing address]</span>.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
