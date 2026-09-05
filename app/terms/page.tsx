import Link from "next/link";
import LegalPageLayout, { LegalSection, type LegalTocItem } from "@/components/legal/LegalPageLayout";

export const metadata = {
  title: "Terms & Conditions — UpSycle Market",
};

const toc: LegalTocItem[] = [
  { id: "agreement", label: "Agreement to These Terms" },
  { id: "services", label: "Our Services" },
  { id: "ip", label: "Intellectual Property Rights" },
  { id: "representations", label: "User Representations" },
  { id: "registration", label: "User Registration" },
  { id: "products", label: "Products" },
  { id: "payment", label: "Purchases & Payment" },
  { id: "subscriptions", label: "Subscriptions" },
  { id: "returns", label: "Return Policy" },
  { id: "conduct", label: "Prohibited Activities" },
  { id: "contributions", label: "User Generated Contributions" },
  { id: "contribution-license", label: "Contribution License" },
  { id: "reviews", label: "Guidelines for Reviews" },
  { id: "mobile-app", label: "Mobile Application License" },
  { id: "social-media", label: "Social Media" },
  { id: "services-management", label: "Services Management" },
  { id: "privacy-ref", label: "Privacy Policy" },
  { id: "copyright", label: "Copyright Infringements" },
  { id: "termination", label: "Term & Termination" },
  { id: "modifications", label: "Modifications & Interruptions" },
  { id: "law", label: "Governing Law" },
  { id: "disputes", label: "Dispute Resolution" },
  { id: "corrections", label: "Corrections" },
  { id: "disclaimer", label: "Disclaimer" },
  { id: "liability", label: "Limitations of Liability" },
  { id: "indemnity", label: "Indemnification" },
  { id: "user-data", label: "User Data" },
  { id: "esign", label: "Electronic Communications, Transactions & Signatures" },
  { id: "sms", label: "SMS Text Messaging" },
  { id: "california", label: "California Users & Residents" },
  { id: "misc", label: "Miscellaneous" },
  { id: "seller-approval", label: "Seller Approval" },
  { id: "no-resale", label: "No Resale, Commercial & Large-Production Goods" },
  { id: "third-party-marketing", label: "Third-Party Marketing on Site" },
  { id: "seller-buyer", label: "Seller Interaction with Buyer" },
  { id: "contact", label: "Contact Us" },
];

export default function TermsPage() {
  return (
    <LegalPageLayout
      eyebrow="UpSycle Market"
      title="Terms & Conditions"
      effectiveDate="August 25, 2026"
      lastUpdated="August 25, 2026"
      disclaimer={
        <>
          This page reflects UpSycle Market&rsquo;s current Terms &amp; Conditions, including our
          real entity, contact, and business details. It is still not legal advice &mdash; have an
          attorney licensed in California review it before you rely on it, especially the
          arbitration, liability-limitation, and California consumer-rights sections, since those
          provisions carry specific enforceability requirements.
        </>
      }
      toc={toc}
    >
      <LegalSection id="agreement" num="01" title="Agreement to These Terms">
        <p>
          We are <strong>UpSycle Market LLC</strong> (&ldquo;Company,&rdquo; &ldquo;we,&rdquo;
          &ldquo;us,&rdquo; &ldquo;our&rdquo;), a company registered in California, United States
          at 3020 Alta Vista Dr, Fallbrook, CA 92028.
        </p>
        <p>
          We operate the website{" "}
          <a href="http://www.upsyclemarket.com" target="_blank" rel="noreferrer">
            www.upsyclemarket.com
          </a>{" "}
          (the &ldquo;Site&rdquo;), the mobile application UpSycleMarket (the &ldquo;App&rdquo;),
          as well as any other related products and services that refer or link to these legal
          terms (the &ldquo;Legal Terms&rdquo;) (collectively, the &ldquo;Services&rdquo;). We
          provide a marketplace for independent sellers to market their work.
        </p>
        <p>
          You can contact us by phone at (760) 695-2784, email at{" "}
          <a href="mailto:vmcsheehy@upsyclemarket.com">vmcsheehy@upsyclemarket.com</a>, or by mail
          to 3020 Alta Vista Dr, Fallbrook, CA 92028, United States.
        </p>
        <p>
          These Legal Terms constitute a legally binding agreement made between you, whether
          personally or on behalf of an entity (&ldquo;you&rdquo;), and UpSycle Market LLC,
          concerning your access to and use of the Services. You agree that by accessing the
          Services, you have read, understood, and agreed to be bound by all of these Legal Terms.{" "}
          <strong>
            IF YOU DO NOT AGREE WITH ALL OF THESE LEGAL TERMS, THEN YOU ARE EXPRESSLY PROHIBITED
            FROM USING THE SERVICES AND YOU MUST DISCONTINUE USE IMMEDIATELY.
          </strong>
        </p>
        <p>
          We will provide you with prior notice of any scheduled changes to the Services you are
          using. Changes to these Legal Terms will become effective seven (7) days after the notice
          is given, except if the changes apply to new functionality, security updates, and bug
          fixes, in which case the changes will be effective immediately. By continuing to use the
          Services after the effective date of any changes, you agree to be bound by the modified
          terms. If you disagree with such changes, you may terminate Services as described in{" "}
          <a href="#termination">Section 19</a>.
        </p>
        <p>
          The Services are intended for users who are at least 18 years old. Persons under the age
          of 18 are not permitted to use or register for the Services. We recommend that you print
          a copy of these Legal Terms for your records.
        </p>
      </LegalSection>

      <LegalSection id="services" num="02" title="Our Services">
        <p>
          The information provided when using the Services is not intended for distribution to or
          use by any person or entity in any jurisdiction or country where such distribution or use
          would be contrary to law or regulation or which would subject us to any registration
          requirement within such jurisdiction or country. Accordingly, those persons who choose to
          access the Services from other locations do so on their own initiative and are solely
          responsible for compliance with local laws, if and to the extent local laws are
          applicable.
        </p>
        <p>
          The Services are not tailored to comply with industry-specific regulations (Health
          Insurance Portability and Accountability Act (HIPAA), Federal Information Security
          Management Act (FISMA), etc.), so if your interactions would be subjected to such laws,
          you may not use the Services. You may not use the Services in a way that would violate
          the Gramm-Leach-Bliley Act (GLBA).
        </p>
      </LegalSection>

      <LegalSection id="ip" num="03" title="Intellectual Property Rights">
        <h3>Our intellectual property</h3>
        <p>
          We are the owner or the licensee of all intellectual property rights in our Services,
          including all source code, databases, functionality, software, website designs, audio,
          video, text, photographs, and graphics in the Services (collectively, the
          &ldquo;Content&rdquo;), as well as the trademarks, service marks, and logos contained
          therein (the &ldquo;Marks&rdquo;).
        </p>
        <p>
          Our Content and Marks are protected by copyright and trademark laws (and various other
          intellectual property rights and unfair competition laws) and treaties in the United
          States and around the world. The Content and Marks are provided in or through the
          Services &ldquo;AS IS&rdquo; for your personal, non-commercial use only.
        </p>

        <h3>Your use of our Services</h3>
        <p>
          Subject to your compliance with these Legal Terms, including the{" "}
          <a href="#conduct">Prohibited Activities</a> section below, we grant you a non-exclusive,
          non-transferable, revocable license to:
        </p>
        <ul>
          <li>access the Services; and</li>
          <li>
            download or print a copy of any portion of the Content to which you have properly
            gained access, solely for your personal, non-commercial use.
          </li>
        </ul>
        <p>
          Except as set out in this section or elsewhere in our Legal Terms, no part of the
          Services and no Content or Marks may be copied, reproduced, aggregated, republished,
          uploaded, posted, publicly displayed, encoded, translated, transmitted, distributed,
          sold, licensed, or otherwise exploited for any commercial purpose whatsoever, without our
          express prior written permission.
        </p>
        <p>
          If you wish to make any use of the Services, Content, or Marks other than as set out in
          this section or elsewhere in our Legal Terms, please address your request to{" "}
          <a href="mailto:vmcsheehy@upsyclemarket.com">vmcsheehy@upsyclemarket.com</a>. If we ever
          grant you permission to post, reproduce, or publicly display any part of our Services or
          Content, you must identify us as the owners or licensors of the Services, Content, or
          Marks and ensure that any copyright or proprietary notice appears or is visible on
          posting, reproducing, or displaying our Content.
        </p>
        <p>
          We reserve all rights not expressly granted to you in and to the Services, Content, and
          Marks. Any breach of these Intellectual Property Rights will constitute a material breach
          of our Legal Terms and your right to use our Services will terminate immediately.
        </p>

        <h3>Your submissions and contributions</h3>
        <p>
          Please review this section and the <a href="#conduct">Prohibited Activities</a> section
          carefully prior to using our Services to understand the (a) rights you give us and (b)
          obligations you have when you post or upload any content through the Services.
        </p>
        <p>
          <strong>Submissions:</strong> By directly sending us any question, comment, suggestion,
          idea, feedback, or other information about the Services (&ldquo;Submissions&rdquo;), you
          agree to assign to us all intellectual property rights in such Submission. You agree that
          we shall own this Submission and be entitled to its unrestricted use and dissemination
          for any lawful purpose, commercial or otherwise, without acknowledgment or compensation
          to you.
        </p>
        <p>
          <strong>Contributions:</strong> The Services may invite you to chat, contribute to, or
          participate in blogs, message boards, online forums, and other functionality during which
          you may create, submit, post, display, transmit, publish, distribute, or broadcast
          content and materials to us or through the Services, including but not limited to text,
          writings, video, audio, photographs, music, graphics, comments, reviews, rating
          suggestions, personal information, or other material (&ldquo;Contributions&rdquo;). Any
          Submission that is publicly posted shall also be treated as a Contribution. You understand
          that Contributions may be viewable by other users of the Services.
        </p>
        <p>
          When you post Contributions, you grant us a license (including use of your name,
          trademarks, and logos): by posting any Contributions, you grant us an unrestricted,
          unlimited, irrevocable, perpetual, non-exclusive, transferable, royalty-free, fully-paid,
          worldwide right, and license to use, copy, reproduce, distribute, sell, resell, publish,
          broadcast, retitle, store, publicly perform, publicly display, reformat, translate,
          excerpt (in whole or in part), and exploit your Contributions (including, without
          limitation, your image, name, and voice) for any purpose, commercial, advertising, or
          otherwise, to prepare derivative works of, or incorporate into other works, your
          Contributions, and to sublicense the licenses granted in this section. Our use and
          distribution may occur in any media formats and through any media channels. This license
          includes our use of your name, company name, and franchise name, as applicable, and any
          of the trademarks, service marks, trade names, logos, and personal and commercial images
          you provide.
        </p>
        <p>
          <strong>You are responsible for what you post or upload:</strong> by sending us
          Submissions and/or posting Contributions through any part of the Services or making
          Contributions accessible through the Services by linking your account through the
          Services to any of your social networking accounts, you:
        </p>
        <ul>
          <li>
            confirm that you have read and agree with our Prohibited Activities and will not post,
            send, publish, upload, or transmit through the Services any Submission nor post any
            Contribution that is illegal, harassing, hateful, harmful, defamatory, obscene,
            bullying, abusive, discriminatory, threatening to any person or group, sexually
            explicit, false, inaccurate, deceitful, or misleading;
          </li>
          <li>
            to the extent permissible by applicable law, waive any and all moral rights to any such
            Submission and/or Contribution;
          </li>
          <li>
            warrant that any such Submission and/or Contributions are original to you or that you
            have the necessary rights and licenses to submit such Submissions and/or Contributions
            and that you have full authority to grant us the above-mentioned rights in relation to
            your Submissions and/or Contributions; and
          </li>
          <li>warrant and represent that your Submissions and/or Contributions do not constitute confidential information.</li>
        </ul>
        <p>
          You are solely responsible for your Submissions and/or Contributions and you expressly
          agree to reimburse us for any and all losses that we may suffer because of your breach of
          (a) this section, (b) any third party&rsquo;s intellectual property rights, or (c)
          applicable law.
        </p>
        <p>
          <strong>We may remove or edit your Content:</strong> although we have no obligation to
          monitor any Contributions, we shall have the right to remove or edit any Contributions at
          any time without notice if in our reasonable opinion we consider such Contributions
          harmful or in breach of these Legal Terms. If we remove or edit any such Contributions,
          we may also suspend or disable your account and report you to the authorities.
        </p>

        <h3>Copyright infringement</h3>
        <p>
          We respect the intellectual property rights of others. If you believe that any material
          available on or through the Services infringes upon any copyright you own or control,
          please immediately refer to <a href="#copyright">Section 18</a>.
        </p>
      </LegalSection>

      <LegalSection id="representations" num="04" title="User Representations">
        <p>
          By using the Services, you represent and warrant that: (1) all registration information
          you submit will be true, accurate, current, and complete; (2) you will maintain the
          accuracy of such information and promptly update such registration information as
          necessary; (3) you have the legal capacity and you agree to comply with these Legal
          Terms; (4) you are not a minor in the jurisdiction in which you reside; (5) you will not
          access the Services through automated or non-human means, whether through a bot, script,
          or otherwise; (6) you will not use the Services for any illegal or unauthorized purpose;
          and (7) your use of the Services will not violate any applicable law or regulation.
        </p>
        <p>
          If you provide any information that is untrue, inaccurate, not current, or incomplete, we
          have the right to suspend or terminate your account and refuse any and all current or
          future use of the Services (or any portion thereof).
        </p>
      </LegalSection>

      <LegalSection id="registration" num="05" title="User Registration">
        <p>
          You may be required to register to use the Services. You agree to keep your password
          confidential and will be responsible for all use of your account and password. We reserve
          the right to remove, reclaim, or change a username you select if we determine, in our
          sole discretion, that such username is inappropriate, obscene, or otherwise
          objectionable.
        </p>
      </LegalSection>

      <LegalSection id="products" num="06" title="Products">
        <p>
          We make every effort to display as accurately as possible the colors, features,
          specifications, and details of the products available on the Services. However, we do
          not guarantee that the colors, features, specifications, and details of the products will
          be accurate, complete, reliable, current, or free of other errors, and your electronic
          display may not accurately reflect the actual colors and details of the products. All
          products are subject to availability, and we cannot guarantee that items will be in
          stock. We reserve the right to discontinue any products at any time for any reason. Prices
          for all products are subject to change.
        </p>
      </LegalSection>

      <LegalSection id="payment" num="07" title="Purchases & Payment">
        <p>We accept the following forms of payment:</p>
        <ul>
          <li>Visa</li>
          <li>Mastercard</li>
          <li>American Express</li>
          <li>Discover</li>
        </ul>
        <p>
          You agree to provide current, complete, and accurate purchase and account information for
          all purchases made via the Services. You further agree to promptly update account and
          payment information, including email address, payment method, and payment card expiration
          date, so that we can complete your transactions and contact you as needed. Sales tax will
          be added to the price of purchases as deemed required by us. We may change prices at any
          time. All payments shall be in US dollars.
        </p>
        <p>
          You agree to pay all charges at the prices then in effect for your purchases and any
          applicable shipping fees, and you authorize us to charge your chosen payment provider for
          any such amounts upon placing your order. We reserve the right to correct any errors or
          mistakes in pricing, even if we have already requested or received payment.
        </p>
        <p>
          We reserve the right to refuse any order placed through the Services. We may, in our sole
          discretion, limit or cancel quantities purchased per person, per household, or per order.
          These restrictions may include orders placed by or under the same customer account, the
          same payment method, and/or orders that use the same billing or shipping address. We
          reserve the right to limit or prohibit orders that, in our sole judgment, appear to be
          placed by dealers, resellers, or distributors.
        </p>
      </LegalSection>

      <LegalSection id="subscriptions" num="08" title="Subscriptions">
        <h3>Billing and Renewal</h3>
        <p>
          Your subscription will continue and automatically renew unless canceled. You consent to
          our charging your payment method on a recurring basis without requiring your prior
          approval for each recurring charge, until such time as you cancel the applicable order.
          The length of your billing cycle is monthly.
        </p>
        <h3>Cancellation</h3>
        <p>
          You can cancel your subscription at any time by logging into your account. Your
          cancellation will take effect at the end of the current paid term. If you have any
          questions or are unsatisfied with our Services, please email us at{" "}
          <a href="mailto:vmcsheehy@upsyclemarket.com">vmcsheehy@upsyclemarket.com</a>.
        </p>
        <h3>Fee Changes</h3>
        <p>
          We may, from time to time, make changes to the subscription fee and will communicate any
          price changes to you in accordance with applicable law.
        </p>
      </LegalSection>

      <LegalSection id="returns" num="09" title="Return Policy">
        <p>
          Please review our <Link href="/returns">Return Policy</Link> prior to making any
          purchases.
        </p>
      </LegalSection>

      <LegalSection id="conduct" num="10" title="Prohibited Activities">
        <p>
          You may not access or use the Services for any purpose other than that for which we make
          the Services available. The Services may not be used in connection with any commercial
          endeavors except those that are specifically endorsed or approved by us.
        </p>
        <p>As a user of the Services, you agree not to:</p>
        <ul>
          <li>
            Systematically retrieve data or other content from the Services to create or compile,
            directly or indirectly, a collection, compilation, database, or directory without
            written permission from us.
          </li>
          <li>
            Trick, defraud, or mislead us and other users, especially in any attempt to learn
            sensitive account information such as user passwords.
          </li>
          <li>
            Circumvent, disable, or otherwise interfere with security-related features of the
            Services, including features that prevent or restrict the use or copying of any Content
            or enforce limitations on the use of the Services and/or the Content contained therein.
          </li>
          <li>Disparage, tarnish, or otherwise harm, in our opinion, us and/or the Services.</li>
          <li>Use any information obtained from the Services in order to harass, abuse, or harm another person.</li>
          <li>Make improper use of our support services or submit false reports of abuse or misconduct.</li>
          <li>Use the Services in a manner inconsistent with any applicable laws or regulations.</li>
          <li>Engage in unauthorized framing of or linking to the Services.</li>
          <li>
            Upload or transmit (or attempt to upload or to transmit) viruses, Trojan horses, or
            other material, including excessive use of capital letters and spamming (continuous
            posting of repetitive text), that interferes with any party&rsquo;s uninterrupted use
            and enjoyment of the Services or modifies, impairs, disrupts, alters, or interferes with
            the use, features, functions, operation, or maintenance of the Services.
          </li>
          <li>
            Engage in any automated use of the system, such as using scripts to send comments or
            messages, or using any data mining, robots, or similar data gathering and extraction
            tools.
          </li>
          <li>Delete the copyright or other proprietary rights notice from any Content.</li>
          <li>Attempt to impersonate another user or person or use the username of another user.</li>
          <li>
            Upload or transmit (or attempt to upload or to transmit) any material that acts as a
            passive or active information collection or transmission mechanism, including without
            limitation, clear graphics interchange formats (&ldquo;gifs&rdquo;), 1&times;1 pixels,
            web bugs, cookies, or other similar devices (sometimes referred to as
            &ldquo;spyware&rdquo; or &ldquo;passive collection mechanisms&rdquo; or
            &ldquo;pcms&rdquo;).
          </li>
          <li>Interfere with, disrupt, or create an undue burden on the Services or the networks or services connected to the Services.</li>
          <li>Harass, annoy, intimidate, or threaten any of our employees or agents engaged in providing any portion of the Services to you.</li>
          <li>Attempt to bypass any measures of the Services designed to prevent or restrict access to the Services, or any portion of the Services.</li>
          <li>Copy or adapt the Services&rsquo; software, including but not limited to Flash, PHP, HTML, JavaScript, or other code.</li>
          <li>Except as permitted by applicable law, decipher, decompile, disassemble, or reverse engineer any of the software comprising or in any way making up a part of the Services.</li>
          <li>
            Except as may be the result of standard search engine or Internet browser usage, use,
            launch, develop, or distribute any automated system, including without limitation, any
            spider, robot, cheat utility, scraper, or offline reader that accesses the Services, or
            use or launch any unauthorized script or other software.
          </li>
          <li>Use a buying agent or purchasing agent to make purchases on the Services.</li>
          <li>
            Make any unauthorized use of the Services, including collecting usernames and/or email
            addresses of users by electronic or other means for the purpose of sending unsolicited
            email, or creating user accounts by automated means or under false pretenses.
          </li>
          <li>Use the Services as part of any effort to compete with us or otherwise use the Services and/or the Content for any revenue-generating endeavor or commercial enterprise.</li>
          <li>Use the Services to advertise or offer to sell goods and services.</li>
        </ul>
      </LegalSection>

      <LegalSection id="contributions" num="11" title="User Generated Contributions">
        <p>
          The Services may invite you to chat, contribute to, or participate in blogs, message
          boards, online forums, and other functionality, and may provide you with the opportunity
          to create, submit, post, display, transmit, perform, publish, distribute, or broadcast
          content and materials to us or on the Services, including but not limited to text,
          writings, video, audio, photographs, graphics, comments, suggestions, or personal
          information or other material (collectively, &ldquo;Contributions&rdquo;). Contributions
          may be viewable by other users of the Services and through third-party websites. As such,
          any Contributions you transmit may be treated as non-confidential and non-proprietary.
          When you create or make available any Contributions, you thereby represent and warrant
          that:
        </p>
        <ul>
          <li>
            The creation, distribution, transmission, public display, or performance, and the
            accessing, downloading, or copying of your Contributions do not and will not infringe
            the proprietary rights, including but not limited to the copyright, patent, trademark,
            trade secret, or moral rights of any third party.
          </li>
          <li>
            You are the creator and owner of or have the necessary licenses, rights, consents,
            releases, and permissions to use and to authorize us, the Services, and other users of
            the Services to use your Contributions in any manner contemplated by the Services and
            these Legal Terms.
          </li>
          <li>
            You have the written consent, release, and/or permission of each and every identifiable
            individual person in your Contributions to use the name or likeness of each and every
            such identifiable individual person to enable inclusion and use of your Contributions
            in any manner contemplated by the Services and these Legal Terms.
          </li>
          <li>Your Contributions are not false, inaccurate, or misleading.</li>
          <li>
            Your Contributions are not unsolicited or unauthorized advertising, promotional
            materials, pyramid schemes, chain letters, spam, mass mailings, or other forms of
            solicitation.
          </li>
          <li>
            Your Contributions are not obscene, lewd, lascivious, filthy, violent, harassing,
            libelous, slanderous, or otherwise objectionable (as determined by us).
          </li>
          <li>Your Contributions do not ridicule, mock, disparage, intimidate, or abuse anyone.</li>
          <li>
            Your Contributions are not used to harass or threaten (in the legal sense of those
            terms) any other person and to promote violence against a specific person or class of
            people.
          </li>
          <li>Your Contributions do not violate any applicable law, regulation, or rule.</li>
          <li>Your Contributions do not violate the privacy or publicity rights of any third party.</li>
          <li>
            Your Contributions do not violate any applicable law concerning child pornography, or
            otherwise intended to protect the health or well-being of minors.
          </li>
          <li>Your Contributions do not include any offensive comments that are connected to race, national origin, gender, sexual preference, or physical handicap.</li>
          <li>Your Contributions do not otherwise violate, or link to material that violates, any provision of these Legal Terms, or any applicable law or regulation.</li>
        </ul>
        <p>
          Any use of the Services in violation of the foregoing violates these Legal Terms and may
          result in, among other things, termination or suspension of your rights to use the
          Services.
        </p>
      </LegalSection>

      <LegalSection id="contribution-license" num="12" title="Contribution License">
        <p>
          By posting your Contributions to any part of the Services or making Contributions
          accessible to the Services by linking your account from the Services to any of your
          social networking accounts, you automatically grant, and you represent and warrant that
          you have the right to grant, to us an unrestricted, unlimited, irrevocable, perpetual,
          non-exclusive, transferable, royalty-free, fully-paid, worldwide right, and license to
          host, use, copy, reproduce, disclose, sell, resell, publish, broadcast, retitle, archive,
          store, cache, publicly perform, publicly display, reformat, translate, transmit, excerpt
          (in whole or in part), and distribute such Contributions (including, without limitation,
          your image and voice) for any purpose, commercial, advertising, or otherwise, and to
          prepare derivative works of, or incorporate into other works, such Contributions, and
          grant and authorize sublicenses of the foregoing. The use and distribution may occur in
          any media formats and through any media channels.
        </p>
        <p>
          This license will apply to any form, media, or technology now known or hereafter
          developed, and includes our use of your name, company name, and franchise name, as
          applicable, and any of the trademarks, service marks, trade names, logos, and personal and
          commercial images you provide. You waive all moral rights in your Contributions, and you
          warrant that moral rights have not otherwise been asserted in your Contributions.
        </p>
        <p>
          We do not assert any ownership over your Contributions. You retain full ownership of all
          of your Contributions and any intellectual property rights or other proprietary rights
          associated with your Contributions. We are not liable for any statements or
          representations in your Contributions provided by you in any area on the Services. You
          are solely responsible for your Contributions to the Services and you expressly agree to
          exonerate us from any and all responsibility and to refrain from any legal action against
          us regarding your Contributions.
        </p>
        <p>
          We have the right, in our sole and absolute discretion, (1) to edit, redact, or otherwise
          change any Contributions; (2) to re-categorize any Contributions to place them in more
          appropriate locations on the Services; and (3) to pre-screen or delete any Contributions
          at any time and for any reason, without notice. We have no obligation to monitor your
          Contributions.
        </p>
      </LegalSection>

      <LegalSection id="reviews" num="13" title="Guidelines for Reviews">
        <p>
          We may provide you areas on the Services to leave reviews or ratings. When posting a
          review, you must comply with the following criteria: (1) you should have firsthand
          experience with the person/entity being reviewed; (2) your reviews should not contain
          offensive profanity, or abusive, racist, offensive, or hateful language; (3) your reviews
          should not contain discriminatory references based on religion, race, gender, national
          origin, age, marital status, sexual orientation, or disability; (4) your reviews should
          not contain references to illegal activity; (5) you should not be affiliated with
          competitors if posting negative reviews; (6) you should not make any conclusions as to the
          legality of conduct; (7) you may not post any false or misleading statements; and (8) you
          may not organize a campaign encouraging others to post reviews, whether positive or
          negative.
        </p>
        <p>
          We may accept, reject, or remove reviews in our sole discretion. We have absolutely no
          obligation to screen reviews or to delete reviews, even if anyone considers reviews
          objectionable or inaccurate. Reviews are not endorsed by us, and do not necessarily
          represent our opinions or the views of any of our affiliates or partners. We do not assume
          liability for any review or for any claims, liabilities, or losses resulting from any
          review. By posting a review, you hereby grant to us a perpetual, non-exclusive, worldwide,
          royalty-free, fully paid, assignable, and sublicensable right and license to reproduce,
          modify, translate, transmit by any means, display, perform, and/or distribute all content
          relating to review.
        </p>
      </LegalSection>

      <LegalSection id="mobile-app" num="14" title="Mobile Application License">
        <h3>Use License</h3>
        <p>
          If you access the Services via the App, then we grant you a revocable, non-exclusive,
          non-transferable, limited right to install and use the App on wireless electronic devices
          owned or controlled by you, and to access and use the App on such devices strictly in
          accordance with the terms and conditions of this mobile application license contained in
          these Legal Terms. You shall not: (1) except as permitted by applicable law, decompile,
          reverse engineer, disassemble, attempt to derive the source code of, or decrypt the App;
          (2) make any modification, adaptation, improvement, enhancement, translation, or
          derivative work from the App; (3) violate any applicable laws, rules, or regulations in
          connection with your access or use of the App; (4) remove, alter, or obscure any
          proprietary notice (including any notice of copyright or trademark) posted by us or the
          licensors of the App; (5) use the App for any revenue-generating endeavor, commercial
          enterprise, or other purpose for which it is not designed or intended; (6) make the App
          available over a network or other environment permitting access or use by multiple
          devices or users at the same time; (7) use the App for creating a product, service, or
          software that is, directly or indirectly, competitive with or in any way a substitute for
          the App; (8) use the App to send automated queries to any website or to send any
          unsolicited commercial email; or (9) use any proprietary information or any of our
          interfaces or our other intellectual property in the design, development, manufacture,
          licensing, or distribution of any applications, accessories, or devices for use with the
          App.
        </p>
        <h3>Apple and Android Devices</h3>
        <p>
          The following terms apply when you use the App obtained from either the Apple Store or
          Google Play (each an &ldquo;App Distributor&rdquo;) to access the Services: (1) the
          license granted to you for our App is limited to a non-transferable license to use the
          application on a device that utilizes the Apple iOS or Android operating systems, as
          applicable, and in accordance with the usage rules set forth in the applicable App
          Distributor&rsquo;s terms of service; (2) we are responsible for providing any maintenance
          and support services with respect to the App as specified in the terms and conditions of
          this mobile application license contained in these Legal Terms or as otherwise required
          under applicable law, and you acknowledge that each App Distributor has no obligation
          whatsoever to furnish any maintenance and support services with respect to the App; (3) in
          the event of any failure of the App to conform to any applicable warranty, you may notify
          the applicable App Distributor, and the App Distributor, in accordance with its terms and
          policies, may refund the purchase price, if any, paid for the App, and to the maximum
          extent permitted by applicable law, the App Distributor will have no other warranty
          obligation whatsoever with respect to the App; (4) you represent and warrant that (i) you
          are not located in a country that is subject to a US government embargo, or that has been
          designated by the US government as a &ldquo;terrorist supporting&rdquo; country and (ii)
          you are not listed on any US government list of prohibited or restricted parties; (5) you
          must comply with applicable third-party terms of agreement when using the App, e.g., if
          you have a VoIP application, then you must not be in violation of their wireless data
          service agreement when using the App; and (6) you acknowledge and agree that the App
          Distributors are third-party beneficiaries of the terms and conditions in this mobile
          application license contained in these Legal Terms, and that each App Distributor will
          have the right (and will be deemed to have accepted the right) to enforce the terms and
          conditions in this mobile application license contained in these Legal Terms against you
          as a third-party beneficiary thereof.
        </p>
      </LegalSection>

      <LegalSection id="social-media" num="15" title="Social Media">
        <p>
          As part of the functionality of the Services, you may link your account with online
          accounts you have with third-party service providers (each such account, a
          &ldquo;Third-Party Account&rdquo;) by either: (1) providing your Third-Party Account login
          information through the Services; or (2) allowing us to access your Third-Party Account,
          as is permitted under the applicable terms and conditions that govern your use of each
          Third-Party Account. You represent and warrant that you are entitled to disclose your
          Third-Party Account login information to us and/or grant us access to your Third-Party
          Account, without breach by you of any of the terms and conditions that govern your use of
          the applicable Third-Party Account, and without obligating us to pay any fees or making us
          subject to any usage limitations imposed by the third-party service provider of the
          Third-Party Account.
        </p>
        <p>
          By granting us access to any Third-Party Accounts, you understand that (1) we may access,
          make available, and store (if applicable) any content that you have provided to and
          stored in your Third-Party Account (the &ldquo;Social Network Content&rdquo;) so that it
          is available on and through the Services via your account, including without limitation
          any friend lists and (2) we may submit to and receive from your Third-Party Account
          additional information to the extent you are notified when you link your account with the
          Third-Party Account. Depending on the Third-Party Accounts you choose and subject to the
          privacy settings that you have set in such Third-Party Accounts, personally identifiable
          information that you post to your Third-Party Accounts may be available on and through
          your account on the Services. Please note that if a Third-Party Account or associated
          service becomes unavailable or our access to such Third-Party Account is terminated by the
          third-party service provider, then Social Network Content may no longer be available on
          and through the Services. You will have the ability to disable the connection between your
          account on the Services and your Third-Party Accounts at any time.
        </p>
        <p>
          <strong>
            Please note that your relationship with the third-party service providers associated
            with your Third-Party Accounts is governed solely by your agreement(s) with such
            third-party service providers.
          </strong>{" "}
          We make no effort to review any Social Network Content for any purpose, including but not
          limited to, for accuracy, legality, or non-infringement, and we are not responsible for
          any Social Network Content. You acknowledge and agree that we may access your email
          address book associated with a Third-Party Account and your contacts list stored on your
          mobile device or tablet computer solely for purposes of identifying and informing you of
          those contacts who have also registered to use the Services. You can deactivate the
          connection between the Services and your Third-Party Account by contacting us using the
          contact information below or through your account settings (if applicable). We will
          attempt to delete any information stored on our servers that was obtained through such
          Third-Party Account, except the username and profile picture that become associated with
          your account.
        </p>
      </LegalSection>

      <LegalSection id="services-management" num="16" title="Services Management">
        <p>
          We reserve the right, but not the obligation, to: (1) monitor the Services for violations
          of these Legal Terms; (2) take appropriate legal action against anyone who, in our sole
          discretion, violates the law or these Legal Terms, including without limitation, reporting
          such user to law enforcement authorities; (3) in our sole discretion and without
          limitation, refuse, restrict access to, limit the availability of, or disable (to the
          extent technologically feasible) any of your Contributions or any portion thereof; (4) in
          our sole discretion and without limitation, notice, or liability, to remove from the
          Services or otherwise disable all files and content that are excessive in size or are in
          any way burdensome to our systems; and (5) otherwise manage the Services in a manner
          designed to protect our rights and property and to facilitate the proper functioning of
          the Services.
        </p>
      </LegalSection>

      <LegalSection id="privacy-ref" num="17" title="Privacy Policy">
        <p>
          We care about data privacy and security. By using the Services, you agree to be bound by
          our <Link href="/privacy">Privacy Policy</Link> posted on the Services, which is
          incorporated into these Legal Terms. Please be advised the Services are hosted in the
          United States. If you access the Services from any other region of the world with laws or
          other requirements governing personal data collection, use, or disclosure that differ from
          applicable laws in the United States, then through your continued use of the Services, you
          are transferring your data to the United States, and you expressly consent to have your
          data transferred to and processed in the United States.
        </p>
      </LegalSection>

      <LegalSection id="copyright" num="18" title="Copyright Infringements">
        <p>
          We respect the intellectual property rights of others. If you believe that any material
          available on or through the Services infringes upon any copyright you own or control,
          please immediately notify us using the contact information provided in{" "}
          <a href="#contact">Section 36</a> (a &ldquo;Notification&rdquo;). A copy of your
          Notification will be sent to the person who posted or stored the material addressed in the
          Notification. Please be advised that pursuant to applicable law you may be held liable for
          damages if you make material misrepresentations in a Notification. Thus, if you are not
          sure that material located on or linked to by the Services infringes your copyright, you
          should consider first contacting an attorney.
        </p>
      </LegalSection>

      <LegalSection id="termination" num="19" title="Term & Termination">
        <p>
          These Legal Terms shall remain in full force and effect while you use the Services.{" "}
          <strong>
            Without limiting any other provision of these Legal Terms, we reserve the right to, in
            our sole discretion and without notice or liability, deny access to and use of the
            Services (including blocking certain IP addresses), to any person for any reason or for
            no reason, including without limitation for breach of any representation, warranty, or
            covenant contained in these Legal Terms or of any applicable law or regulation. We may
            terminate your use or participation in the Services or delete your account and any
            content or information that you posted at any time, without warning, in our sole
            discretion.
          </strong>
        </p>
        <p>
          If we terminate or suspend your account for any reason, you are prohibited from
          registering and creating a new account under your name, a fake or borrowed name, or the
          name of any third party, even if you may be acting on behalf of the third party. In
          addition to terminating or suspending your account, we reserve the right to take
          appropriate legal action, including without limitation pursuing civil, criminal, and
          injunctive redress.
        </p>
      </LegalSection>

      <LegalSection id="modifications" num="20" title="Modifications & Interruptions">
        <p>
          We reserve the right to change, modify, or remove the contents of the Services at any time
          or for any reason at our sole discretion without notice. However, we have no obligation to
          update any information on our Services. We also reserve the right to modify or discontinue
          all or part of the Services without notice at any time. We will not be liable to you or
          any third party for any modification, price change, suspension, or discontinuance of the
          Services.
        </p>
        <p>
          We cannot guarantee the Services will be available at all times. We may experience
          hardware, software, or other problems or need to perform maintenance related to the
          Services, resulting in interruptions, delays, or errors. We reserve the right to change,
          revise, update, suspend, discontinue, or otherwise modify the Services at any time or for
          any reason without notice to you. You agree that we have no liability whatsoever for any
          loss, damage, or inconvenience caused by your inability to access or use the Services
          during any downtime or discontinuance of the Services. Nothing in these Legal Terms will
          be construed to obligate us to maintain and support the Services or to supply any
          corrections, updates, or releases in connection therewith.
        </p>
      </LegalSection>

      <LegalSection id="law" num="21" title="Governing Law">
        <p>
          These Legal Terms and your use of the Services are governed by and construed in accordance
          with the laws of the State of California applicable to agreements made and to be entirely
          performed within the State of California, without regard to its conflict of law
          principles.
        </p>
      </LegalSection>

      <LegalSection id="disputes" num="22" title="Dispute Resolution">
        <h3>Informal Negotiations</h3>
        <p>
          To expedite resolution and control the cost of any dispute, controversy, or claim related
          to these Legal Terms (each a &ldquo;Dispute&rdquo; and collectively, the
          &ldquo;Disputes&rdquo;) brought by either you or us (individually, a &ldquo;Party&rdquo;
          and collectively, the &ldquo;Parties&rdquo;), the Parties agree to first attempt to
          negotiate any Dispute (except those Disputes expressly provided below) informally for at
          least thirty (30) days before initiating arbitration. Such informal negotiations commence
          upon written notice from one Party to the other Party.
        </p>
        <h3>Binding Arbitration</h3>
        <p>
          If the Parties are unable to resolve a Dispute through informal negotiations, the Dispute
          (except those Disputes expressly excluded below) will be finally and exclusively resolved
          by binding arbitration.{" "}
          <strong>
            You understand that without this provision, you would have the right to sue in court
            and have a jury trial.
          </strong>{" "}
          The arbitration shall be commenced and conducted under the Commercial Arbitration Rules of
          the American Arbitration Association (&ldquo;AAA&rdquo;) and, where appropriate, the
          AAA&rsquo;s Supplementary Procedures for Consumer Related Disputes (&ldquo;AAA Consumer
          Rules&rdquo;), both of which are available at the American Arbitration Association (AAA)
          website. Your arbitration fees and your share of arbitrator compensation shall be governed
          by the AAA Consumer Rules and, where appropriate, limited by the AAA Consumer Rules. If
          such costs are determined by the arbitrator to be excessive, we will pay all arbitration
          fees and expenses. The arbitration may be conducted in person, through the submission of
          documents, by phone, or online. The arbitrator will make a decision in writing, but need
          not provide a statement of reasons unless requested by either Party. The arbitrator must
          follow applicable law, and any award may be challenged if the arbitrator fails to do so.
          Except where otherwise required by the applicable AAA rules or applicable law, the
          arbitration will take place in San Diego, California. Except as otherwise provided herein,
          the Parties may litigate in court to compel arbitration, stay proceedings pending
          arbitration, or to confirm, modify, vacate, or enter judgment on the award entered by the
          arbitrator.
        </p>
        <p>
          If for any reason, a Dispute proceeds in court rather than arbitration, the Dispute shall
          be commenced or prosecuted in the state and federal courts located in San Diego,
          California, and the Parties hereby consent to, and waive all defenses of lack of personal
          jurisdiction, and forum non conveniens with respect to venue and jurisdiction in such state
          and federal courts. Application of the United Nations Convention on Contracts for the
          International Sale of Goods and the Uniform Computer Information Transaction Act (UCITA)
          are excluded from these Legal Terms.
        </p>
        <p>
          In no event shall any Dispute brought by either Party related in any way to the Services be
          commenced more than one (1) year after the cause of action arose. If this provision is
          found to be illegal or unenforceable, then neither Party will elect to arbitrate any
          Dispute falling within that portion of this provision found to be illegal or unenforceable
          and such Dispute shall be decided by a court of competent jurisdiction within the courts
          listed for jurisdiction above, and the Parties agree to submit to the personal jurisdiction
          of that court.
        </p>
        <h3>Restrictions</h3>
        <p>
          The Parties agree that any arbitration shall be limited to the Dispute between the Parties
          individually. To the full extent permitted by law, (a) no arbitration shall be joined with
          any other proceeding; (b) there is no right or authority for any Dispute to be arbitrated
          on a class-action basis or to utilize class action procedures; and (c) there is no right or
          authority for any Dispute to be brought in a purported representative capacity on behalf of
          the general public or any other persons.
        </p>
        <h3>Exceptions to Informal Negotiations and Arbitration</h3>
        <p>
          The Parties agree that the following Disputes are not subject to the above provisions
          concerning informal negotiations and binding arbitration: (a) any Disputes seeking to
          enforce or protect, or concerning the validity of, any of the intellectual property rights
          of a Party; (b) any Dispute related to, or arising from, allegations of theft, piracy,
          invasion of privacy, or unauthorized use; and (c) any claim for injunctive relief. If this
          provision is found to be illegal or unenforceable, then neither Party will elect to
          arbitrate any Dispute falling within that portion of this provision found to be illegal or
          unenforceable and such Dispute shall be decided by a court of competent jurisdiction within
          the courts listed for jurisdiction above, and the Parties agree to submit to the personal
          jurisdiction of that court.
        </p>
      </LegalSection>

      <LegalSection id="corrections" num="23" title="Corrections">
        <p>
          There may be information on the Services that contains typographical errors, inaccuracies,
          or omissions, including descriptions, pricing, availability, and various other information.
          We reserve the right to correct any errors, inaccuracies, or omissions and to change or
          update the information on the Services at any time, without prior notice.
        </p>
      </LegalSection>

      <LegalSection id="disclaimer" num="24" title="Disclaimer">
        <p>
          <strong>
            The Services are provided on an as-is and as-available basis. You agree that your use of
            the Services will be at your sole risk. To the fullest extent permitted by law, we
            disclaim all warranties, express or implied, in connection with the Services and your use
            thereof, including, without limitation, the implied warranties of merchantability,
            fitness for a particular purpose, and non-infringement. We make no warranties or
            representations about the accuracy or completeness of the Services&rsquo; content or the
            content of any websites or mobile applications linked to the Services and we will assume
            no liability or responsibility for any (1) errors, mistakes, or inaccuracies of content
            and materials, (2) personal injury or property damage, of any nature whatsoever, resulting
            from your access to and use of the Services, (3) any unauthorized access to or use of our
            secure servers and/or any and all personal information and/or financial information
            stored therein, (4) any interruption or cessation of transmission to or from the Services,
            (5) any bugs, viruses, Trojan horses, or the like which may be transmitted to or through
            the Services by any third party, and/or (6) any errors or omissions in any content and
            materials or for any loss or damage of any kind incurred as a result of the use of any
            content posted, transmitted, or otherwise made available via the Services.
          </strong>
        </p>
        <p>
          <strong>
            We do not warrant, endorse, guarantee, or assume responsibility for any product or
            service advertised or offered by a third party through the Services, any hyperlinked
            website, or any website or mobile application featured in any banner or other
            advertising, and we will not be a party to or in any way be responsible for monitoring any
            transaction between you and any third-party providers of products or services. As with the
            purchase of a product or service through any medium or in any environment, you should use
            your best judgment and exercise caution where appropriate.
          </strong>
        </p>
      </LegalSection>

      <LegalSection id="liability" num="25" title="Limitations of Liability">
        <p>
          <strong>
            In no event will we or our directors, employees, or agents be liable to you or any third
            party for any direct, indirect, consequential, exemplary, incidental, special, or
            punitive damages, including lost profit, lost revenue, loss of data, or other damages
            arising from your use of the Services, even if we have been advised of the possibility of
            such damages.
          </strong>{" "}
          Notwithstanding anything to the contrary contained herein, our liability to you for any
          cause whatsoever and regardless of the form of the action, will at all times be limited to
          the lesser of the amount paid, if any, by you to us during the six (6) month period prior
          to any cause of action arising or{" "}
          <span className="legal-placeholder">$500.00 USD</span>. Certain US state laws and
          international laws do not allow limitations on implied warranties or the exclusion or
          limitation of certain damages. If these laws apply to you, some or all of the above
          disclaimers or limitations may not apply to you, and you may have additional rights.
        </p>
      </LegalSection>

      <LegalSection id="indemnity" num="26" title="Indemnification">
        <p>
          You agree to defend, indemnify, and hold us harmless, including our subsidiaries,
          affiliates, and all of our respective officers, agents, partners, and employees, from and
          against any loss, damage, liability, claim, or demand, including reasonable
          attorneys&rsquo; fees and expenses, made by any third party due to or arising out of: (1)
          your Contributions; (2) use of the Services; (3) breach of these Legal Terms; (4) any
          breach of your representations and warranties set forth in these Legal Terms; (5) your
          violation of the rights of a third party, including but not limited to intellectual
          property rights; or (6) any overt harmful act toward any other user of the Services with
          whom you connected via the Services.
        </p>
        <p>
          Notwithstanding the foregoing, we reserve the right, at your expense, to assume the
          exclusive defense and control of any matter for which you are required to indemnify us,
          and you agree to cooperate, at your expense, with our defense of such claims. We will use
          reasonable efforts to notify you of any such claim, action, or proceeding which is subject
          to this indemnification upon becoming aware of it.
        </p>
      </LegalSection>

      <LegalSection id="user-data" num="27" title="User Data">
        <p>
          We will maintain certain data that you transmit to the Services for the purpose of
          managing the performance of the Services, as well as data relating to your use of the
          Services. Although we perform regular routine backups of data, you are solely responsible
          for all data that you transmit or that relates to any activity you have undertaken using
          the Services. You agree that we shall have no liability to you for any loss or corruption
          of any such data, and you hereby waive any right of action against us arising from any
          such loss or corruption of such data.
        </p>
      </LegalSection>

      <LegalSection id="esign" num="28" title="Electronic Communications, Transactions & Signatures">
        <p>
          Visiting the Services, sending us emails, and completing online forms constitute
          electronic communications. You consent to receive electronic communications, and you
          agree that all agreements, notices, disclosures, and other communications we provide to
          you electronically, via email and on the Services, satisfy any legal requirement that such
          communication be in writing.{" "}
          <strong>
            You hereby agree to the use of electronic signatures, contracts, orders, and other
            records, and to electronic delivery of notices, policies, and records of transactions
            initiated or completed by us or via the Services.
          </strong>{" "}
          You hereby waive any rights or requirements under any statutes, regulations, rules,
          ordinances, or other laws in any jurisdiction which require an original signature or
          delivery or retention of non-electronic records, or to payments or the granting of credits
          by any means other than electronic means.
        </p>
      </LegalSection>

      <LegalSection id="sms" num="29" title="SMS Text Messaging">
        <h3>Program Description</h3>
        <p>
          By opting into our SMS text messaging program, you expressly consent to receive text
          messages (SMS) to your mobile number. Text messages may include: order and account alerts.
        </p>
        <h3>Opting Out</h3>
        <p>
          If at any time you wish to stop receiving SMS messages from us, simply reply to the text
          with &ldquo;STOP.&rdquo; You may receive an SMS message confirming your opt out. After
          this, you will no longer receive SMS messages from us. If you want to join again, please
          sign up as you did the first time and we will start sending SMS messages to you again.
        </p>
        <h3>Message and Data Rates</h3>
        <p>
          Please be aware that message and data rates may apply to any SMS messages sent or
          received. The rates are determined by your carrier and the specifics of your mobile plan.
          Carriers are not liable for delayed or undelivered messages. If you have any questions
          about your text plan or data plan, contact your wireless provider.
        </p>
        <h3>Support</h3>
        <p>
          If you have any questions or need assistance regarding our SMS communications, please
          reply with the keyword HELP. You can also email us at{" "}
          <a href="mailto:vmcsheehy@upsyclemarket.com">vmcsheehy@upsyclemarket.com</a> or call at
          (760) 695-2784.
        </p>
      </LegalSection>

      <LegalSection id="california" num="30" title="California Users & Residents">
        <p>
          If any complaint with us is not satisfactorily resolved, you can contact the Complaint
          Assistance Unit of the Division of Consumer Services of the California Department of
          Consumer Affairs in writing at 1625 North Market Blvd., Suite N 112, Sacramento,
          California 95834 or by telephone at (800) 952-5210 or (916) 445-1254.
        </p>
      </LegalSection>

      <LegalSection id="misc" num="31" title="Miscellaneous">
        <p>
          These Legal Terms and any policies or operating rules posted by us on the Services or in
          respect to the Services constitute the entire agreement and understanding between you and
          us. Our failure to exercise or enforce any right or provision of these Legal Terms shall
          not operate as a waiver of such right or provision. These Legal Terms operate to the
          fullest extent permissible by law. We may assign any or all of our rights and obligations
          to others at any time. We shall not be responsible or liable for any loss, damage, delay,
          or failure to act caused by any cause beyond our reasonable control. If any provision or
          part of a provision of these Legal Terms is determined to be unlawful, void, or
          unenforceable, that provision or part of the provision is deemed severable from these
          Legal Terms and does not affect the validity and enforceability of any remaining
          provisions. There is no joint venture, partnership, employment, or agency relationship
          created between you and us as a result of these Legal Terms or use of the Services. You
          agree that these Legal Terms will not be construed against us by virtue of having drafted
          them. You hereby waive any and all defenses you may have based on the electronic form of
          these Legal Terms and the lack of signing by the parties hereto to execute these Legal
          Terms.
        </p>
      </LegalSection>

      <LegalSection id="seller-approval" num="32" title="Seller Approval">
        <p>All sellers will be approved based on authenticity and quality.</p>
      </LegalSection>

      <LegalSection id="no-resale" num="33" title="No Resale, Commercial & Large-Production Goods">
        <p>
          If a seller is promoting resale, commercial, and/or large-production goods, UpSycle Market
          has the right to remove the seller from the Site and revoke their subscription with no
          advance notice.
        </p>
      </LegalSection>

      <LegalSection id="third-party-marketing" num="34" title="Third-Party Marketing on Site">
        <p>Third-party marketing is prohibited unless approved by UpSycle Market.</p>
      </LegalSection>

      <LegalSection id="seller-buyer" num="35" title="Seller Interaction with Buyer">
        <p>Sellers are prohibited from contacting UpSycle Market customers to sell goods outside of UpSycle Market.</p>
      </LegalSection>

      <LegalSection id="contact" num="36" title="Contact Us">
        <p>
          In order to resolve a complaint regarding the Services or to receive further information
          regarding use of the Services, please contact us at:
        </p>
        <p>
          UpSycle Market LLC
          <br />
          3020 Alta Vista Dr
          <br />
          Fallbrook, CA 92028
          <br />
          United States
          <br />
          Phone: (760) 695-2784
          <br />
          <a href="mailto:vmcsheehy@upsyclemarket.com">vmcsheehy@upsyclemarket.com</a>
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
