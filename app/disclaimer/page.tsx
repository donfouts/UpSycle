import LegalPageLayout, { LegalSection, type LegalTocItem } from "@/components/legal/LegalPageLayout";

export const metadata = {
  title: "Disclaimer — UpSycle Market",
};

const toc: LegalTocItem[] = [
  { id: "website", label: "Website Disclaimer" },
  { id: "external-links", label: "External Links Disclaimer" },
  { id: "testimonials", label: "Testimonials Disclaimer" },
];

export default function DisclaimerPage() {
  return (
    <LegalPageLayout
      eyebrow="UpSycle Market"
      title="Disclaimer"
      effectiveDate="August 25, 2026"
      lastUpdated="August 25, 2026"
      disclaimer={
        <>
          This page reflects UpSycle Market&rsquo;s current Disclaimer, including our real entity
          and contact details. It is still not legal advice &mdash; have an attorney review it
          before you rely on it.
        </>
      }
      toc={toc}
    >
      <LegalSection id="website" num="01" title="Website Disclaimer">
        <p>
          The information provided by UpSycle Market LLC (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or
          &ldquo;our&rdquo;) on{" "}
          <a href="http://www.upsyclemarket.com" target="_blank" rel="noreferrer">
            www.upsyclemarket.com
          </a>{" "}
          (the &ldquo;Site&rdquo;) and our mobile application is for general informational purposes
          only. All information on the Site and our mobile application is provided in good faith,
          however we make no representation or warranty of any kind, express or implied, regarding
          the accuracy, adequacy, validity, reliability, availability, or completeness of any
          information on the Site or our mobile application.
        </p>
        <p>
          <strong>
            Under no circumstance shall we have any liability to you for any loss or damage of any
            kind incurred as a result of the use of the Site or our mobile application or reliance
            on any information provided on the Site and our mobile application. Your use of the
            Site and our mobile application and your reliance on any information on the Site and
            our mobile application is solely at your own risk.
          </strong>
        </p>
      </LegalSection>

      <LegalSection id="external-links" num="02" title="External Links Disclaimer">
        <p>
          The Site and our mobile application may contain (or you may be sent through the Site or
          our mobile application) links to other websites or content belonging to or originating
          from third parties or links to websites and features in banners or other advertising.
          Such external links are not investigated, monitored, or checked for accuracy, adequacy,
          validity, reliability, availability, or completeness by us.
        </p>
        <p>
          <strong>
            We do not warrant, endorse, guarantee, or assume responsibility for the accuracy or
            reliability of any information offered by third-party websites linked through the Site
            or any website or feature linked in any banner or other advertising. We will not be a
            party to or in any way be responsible for monitoring any transaction between you and
            third-party providers of products or services.
          </strong>
        </p>
      </LegalSection>

      <LegalSection id="testimonials" num="03" title="Testimonials Disclaimer">
        <p>
          The Site may contain testimonials by users of our products and/or services. These
          testimonials reflect the real-life experiences and opinions of such users. However, the
          experiences are personal to those particular users, and may not necessarily be
          representative of all users of our products and/or services. We do not claim, and you
          should not assume, that all users will have the same experiences.{" "}
          <strong>Your individual results may vary.</strong>
        </p>
        <p>
          The testimonials on the Site are submitted in various forms such as text, audio, and/or
          video, and are reviewed by us before being posted. They appear on the Site verbatim as
          given by the users, except for the correction of grammar or typing errors. Some
          testimonials may have been shortened for the sake of brevity where the full testimonial
          contained extraneous information not relevant to the general public.
        </p>
        <p>
          The views and opinions contained in the testimonials belong solely to the individual user
          and do not reflect our views and opinions. We are not affiliated with users who provide
          testimonials, and users are not paid or otherwise compensated for their testimonials.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
