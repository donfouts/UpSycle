import LegalPageLayout, { LegalSection, type LegalTocItem } from "@/components/legal/LegalPageLayout";

export const metadata = {
  title: "Return Policy — UpSycle Market",
};

const toc: LegalTocItem[] = [
  { id: "overview", label: "Overview" },
  { id: "returns", label: "Returns" },
  { id: "process", label: "Return Process" },
  { id: "refunds", label: "Refunds" },
  { id: "exceptions", label: "Exceptions" },
  { id: "contact", label: "Questions" },
];

export default function ReturnPolicyPage() {
  return (
    <LegalPageLayout
      eyebrow="UpSycle Market"
      title="Return Policy"
      effectiveDate="August 25, 2026"
      lastUpdated="August 25, 2026"
      disclaimer={
        <>
          This page reflects UpSycle Market&rsquo;s current Return Policy. It is still not legal
          advice &mdash; have an attorney review it before you rely on it. Because listings on
          UpSycle Market are created and fulfilled by independent sellers, individual sellers may
          also post their own return terms on a listing; where they do, those terms control for
          that item alongside this policy.
        </>
      }
      toc={toc}
    >
      <LegalSection id="overview" num="01" title="Overview">
        <p>
          Thank you for your purchase. We hope you are happy with it. However, if you are not
          completely satisfied with your purchase for any reason, you may return it to us for a
          refund only. Please see below for more information on our return policy.
        </p>
      </LegalSection>

      <LegalSection id="returns" num="02" title="Returns">
        <p>
          All returns must be postmarked within seven (7) days of the purchase date. All returned
          items must be in new and unused condition, with all original tags and labels attached.
        </p>
      </LegalSection>

      <LegalSection id="process" num="03" title="Return Process">
        <p>
          To return an item, please email customer service at{" "}
          <a href="mailto:vmcsheehy@upsyclemarket.com">vmcsheehy@upsyclemarket.com</a> to obtain a
          Return Merchandise Authorization (RMA) number. After receiving an RMA number, place the
          item securely in its original packaging, and mail your return to the following address:
        </p>
        <p>
          UpSycle Market LLC
          <br />
          Attn: Returns
          <br />
          RMA #{" "}
          <span className="legal-placeholder">[include the RMA number you were issued]</span>
          <br />
          3020 Alta Vista Dr
          <br />
          Fallbrook, CA 92028
          <br />
          United States
        </p>
        <p>
          You may also use the prepaid shipping label enclosed with your package, if provided.
          Return shipping charges will be paid or reimbursed by us.
        </p>
      </LegalSection>

      <LegalSection id="refunds" num="04" title="Refunds">
        <p>
          After receiving your return and inspecting the condition of your item, we will process
          your return. Please allow at least seven (7) days from the receipt of your item to
          process your return. Refunds may take 1&ndash;2 billing cycles to appear on your credit
          card statement, depending on your credit card company. We will notify you by email when
          your return has been processed.
        </p>
      </LegalSection>

      <LegalSection id="exceptions" num="05" title="Exceptions">
        <p>
          For defective or damaged products, please contact us using the details below to arrange a
          refund or exchange.
        </p>
      </LegalSection>

      <LegalSection id="contact" num="06" title="Questions">
        <p>
          If you have any questions concerning our return policy, please contact us at{" "}
          <a href="mailto:vmcsheehy@upsyclemarket.com">vmcsheehy@upsyclemarket.com</a> or (760)
          695-2784.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
