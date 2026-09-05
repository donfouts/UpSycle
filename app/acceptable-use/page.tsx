import Link from "next/link";
import LegalPageLayout, { LegalSection, type LegalTocItem } from "@/components/legal/LegalPageLayout";

export const metadata = {
  title: "Acceptable Use Policy — UpSycle Market",
};

const toc: LegalTocItem[] = [
  { id: "scope", label: "Scope of This Policy" },
  { id: "who-we-are", label: "Who We Are" },
  { id: "use", label: "Use of the Services" },
  { id: "contributions", label: "Contributions" },
  { id: "reviews", label: "Reviews & Ratings" },
  { id: "reporting", label: "Reporting a Breach of This Policy" },
  { id: "consequences", label: "Consequences of Breaching This Policy" },
  { id: "complaints", label: "Complaints & Removal of Legitimate Content" },
  { id: "disclaimer", label: "Disclaimer" },
  { id: "contact", label: "Contact Us About This Policy" },
];

export default function AcceptableUsePage() {
  return (
    <LegalPageLayout
      eyebrow="UpSycle Market"
      title="Acceptable Use Policy"
      effectiveDate="August 25, 2026"
      lastUpdated="August 25, 2026"
      disclaimer={
        <>
          This page reflects UpSycle Market&rsquo;s current Acceptable Use Policy, including our
          real entity and contact details. It is still not legal advice &mdash; have an attorney
          review it before you rely on it.
        </>
      }
      toc={toc}
    >
      <LegalSection id="scope" num="01" title="Scope of This Policy">
        <p>
          This Acceptable Use Policy (&ldquo;Policy&rdquo;) is part of our{" "}
          <Link href="/terms">Terms &amp; Conditions</Link> (&ldquo;Legal Terms&rdquo;) and should
          therefore be read alongside our main Legal Terms. If you do not agree with these Legal
          Terms, please refrain from using our Services. Your continued use of our Services implies
          acceptance of these Legal Terms.
        </p>
        <p>Please carefully review this Policy, which applies to any and all:</p>
        <ul>
          <li>uses of our Services (as defined in our Legal Terms);</li>
          <li>
            forms, materials, consent tools, comments, posts, and all other content available on
            the Services (&ldquo;Content&rdquo;); and
          </li>
          <li>
            material which you contribute to the Services including any upload, post, review,
            disclosure, rating, comment, or chat in any forum, chatroom, review, or interactive
            service associated with it (&ldquo;Contribution&rdquo;).
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="who-we-are" num="02" title="Who We Are">
        <p>
          We are UpSycle Market LLC (&ldquo;Company,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or
          &ldquo;our&rdquo;), a company registered in California, United States at 3020 Alta Vista
          Dr, Fallbrook, CA 92028. We operate the website{" "}
          <a href="http://www.upsyclemarket.com" target="_blank" rel="noreferrer">
            www.upsyclemarket.com
          </a>{" "}
          (the &ldquo;Site&rdquo;), the mobile application UpSycleMarket (the &ldquo;App&rdquo;),
          as well as any other related products and services that refer or link to this Policy
          (collectively, the &ldquo;Services&rdquo;).
        </p>
      </LegalSection>

      <LegalSection id="use" num="03" title="Use of the Services">
        <p>
          When you use the Services, you warrant that you will comply with this Policy and with all
          applicable laws. You also acknowledge that you may not:
        </p>
        <ul>
          <li>Systematically retrieve data or other content from the Services to create or compile, directly or indirectly, a collection, compilation, database, or directory without written permission from us.</li>
          <li>Make any unauthorized use of the Services, including collecting usernames and/or email addresses of users by electronic or other means for the purpose of sending unsolicited email, or creating user accounts by automated means or under false pretenses.</li>
          <li>Circumvent, disable, or otherwise interfere with security-related features of the Services, including features that prevent or restrict the use or copying of any Content or enforce limitations on the use of the Services and/or the Content contained therein.</li>
          <li>Engage in unauthorized framing of or linking to the Services.</li>
          <li>Trick, defraud, or mislead us and other users, especially in any attempt to learn sensitive account information such as user passwords.</li>
          <li>Make improper use of our Services, including our support services, or submit false reports of abuse or misconduct.</li>
          <li>Engage in any automated use of the Services, such as using scripts to send comments or messages, or using any data mining, robots, or similar data gathering and extraction tools.</li>
          <li>Interfere with, disrupt, or create an undue burden on the Services or the networks connected to the Services.</li>
          <li>Attempt to impersonate another user or person or use the username of another user.</li>
          <li>Use any information obtained from the Services in order to harass, abuse, or harm another person.</li>
          <li>Use the Services as part of any effort to compete with us or otherwise use the Services and/or the Content for any revenue-generating endeavor or commercial enterprise.</li>
          <li>Decipher, decompile, disassemble, or reverse engineer any of the software comprising or in any way making up a part of the Services, except as expressly permitted by applicable law.</li>
          <li>Attempt to bypass any measures of the Services designed to prevent or restrict access to the Services, or any portion of the Services.</li>
          <li>Harass, annoy, intimidate, or threaten any of our employees or agents engaged in providing any portion of the Services to you.</li>
          <li>Delete the copyright or other proprietary rights notice from any Content.</li>
          <li>Copy or adapt the Services&rsquo; software, including but not limited to Flash, PHP, HTML, JavaScript, or other code.</li>
          <li>
            Upload or transmit (or attempt to upload or to transmit) viruses, Trojan horses, or
            other material, including excessive use of capital letters and spamming (continuous
            posting of repetitive text), that interferes with any party&rsquo;s uninterrupted use
            and enjoyment of the Services or modifies, impairs, disrupts, alters, or interferes with
            the use, features, functions, operation, or maintenance of the Services.
          </li>
          <li>
            Upload or transmit (or attempt to upload or to transmit) any material that acts as a
            passive or active information collection or transmission mechanism, including without
            limitation, clear graphics interchange formats (&ldquo;gifs&rdquo;), 1&times;1 pixels,
            web bugs, cookies, or other similar devices (sometimes referred to as
            &ldquo;spyware&rdquo; or &ldquo;passive collection mechanisms&rdquo; or
            &ldquo;pcms&rdquo;).
          </li>
          <li>
            Except as may be the result of standard search engine or Internet browser usage, use,
            launch, develop, or distribute any automated system, including without limitation, any
            spider, robot, cheat utility, scraper, or offline reader that accesses the Services, or
            launch any unauthorized script or other software.
          </li>
          <li>Disparage, tarnish, or otherwise harm, in our opinion, us and/or the Services.</li>
          <li>Use the Services in a manner inconsistent with any applicable laws or regulations.</li>
          <li>Sell or otherwise transfer your profile.</li>
        </ul>

        <h3>Subscriptions</h3>
        <p>
          If you subscribe to our Services, you understand, acknowledge, and agree that you may
          not, except if expressly permitted:
        </p>
        <ul>
          <li>
            Engage in any use, including modification, copying, redistribution, publication,
            display, performance, or retransmission, of any portions of any Services, other than as
            expressly permitted by this Policy, without the prior written consent of UpSycle Market
            LLC, which consent UpSycle Market LLC may grant or refuse in its sole and absolute
            discretion.
          </li>
          <li>Reconstruct or attempt to discover any source code or algorithms of the Services, or any portion thereof, by any means whatsoever.</li>
          <li>Provide, or otherwise make available, the Services to any third party.</li>
          <li>Intercept any data not intended for you.</li>
          <li>Damage, reveal, or alter any user&rsquo;s data, or any other hardware, software, or information relating to another person or entity.</li>
        </ul>
      </LegalSection>

      <LegalSection id="contributions" num="04" title="Contributions">
        <p>In this Policy, the term &ldquo;Contributions&rdquo; means:</p>
        <ul>
          <li>
            any data, information, software, text, code, music, scripts, sound, graphics, photos,
            videos, tags, messages, interactive features, or other materials that you post, share,
            upload, submit, or otherwise provide in any manner on or through the Services; or
          </li>
          <li>any other content, materials, or data you provide to UpSycle Market LLC or use with the Services.</li>
        </ul>
        <p>
          Some areas of the Services may allow users to upload, transmit, or post Contributions. We
          may but are under no obligation to review or moderate the Contributions made on the
          Services, and we expressly exclude our liability for any loss or damage resulting from
          any of our users&rsquo; breach of this Policy. Please report any Contribution that you
          believe breaches this Policy; however, we will determine, in our sole discretion, whether
          a Contribution is indeed in breach of this Policy.
        </p>
        <p>You warrant that:</p>
        <ul>
          <li>
            you are the creator and owner of or have the necessary licenses, rights, consents,
            releases, and permissions to use and to authorize us, the Services, and other users of
            the Services to use your Contributions in any manner contemplated by the Services and
            this Policy;
          </li>
          <li>all your Contributions comply with applicable laws and are original and true (if they represent your opinion or facts);</li>
          <li>
            the creation, distribution, transmission, public display, or performance, and the
            accessing, downloading, or copying of your Contributions do not and will not infringe
            the proprietary rights, including but not limited to the copyright, patent, trademark,
            trade secret, or moral rights of any third party; and
          </li>
          <li>
            you have the verifiable consent, release, and/or permission of each and every
            identifiable individual person in your Contributions to use the name or likeness of
            each and every such identifiable individual person to enable inclusion and use of your
            Contributions in any manner contemplated by the Services and this Policy.
          </li>
        </ul>
        <p>You also agree that you will not post, transmit, or upload any (or any part of a) Contribution that:</p>
        <ul>
          <li>is in breach of applicable laws, regulation, court order, contractual obligation, this Policy, our Legal Terms, a legal duty, or that promotes or facilitates fraud or illegal activities;</li>
          <li>is defamatory, obscene, offensive, hateful, insulting, intimidating, bullying, abusive, or threatening, to any person or group;</li>
          <li>is false, inaccurate, or misleading;</li>
          <li>includes child sexual abuse material, or violates any applicable law concerning child pornography or otherwise intended to protect minors;</li>
          <li>contains any material that solicits personal information from anyone under the age of 18 or exploits people under the age of 18 in a sexual or violent manner;</li>
          <li>promotes violence, advocates the violent overthrow of any government, or incites, encourages, or threatens physical harm against another;</li>
          <li>is obscene, lewd, lascivious, filthy, violent, harassing, libelous, slanderous, contains sexually explicit material, or is otherwise objectionable (as determined by us);</li>
          <li>is discriminatory based on race, sex, religion, nationality, disability, sexual orientation, or age;</li>
          <li>bullies, intimidates, humiliates, or insults any person;</li>
          <li>promotes, facilitates, or assists anyone in promoting and facilitating acts of terrorism;</li>
          <li>infringes, or assists anyone in infringing, a third party&rsquo;s intellectual property rights or publicity or privacy rights;</li>
          <li>is deceitful, misrepresents your identity or affiliation with any person, and/or misleads anyone as to your relationship with us or implies that the Contribution was made by someone other than you;</li>
          <li>contains unsolicited or unauthorized advertising, promotional materials, pyramid schemes, chain letters, spam, mass mailings, or other forms of solicitation that has been &ldquo;paid for,&rdquo; whether with monetary compensation or in kind; or</li>
          <li>misrepresents your identity or who the Contribution is from.</li>
        </ul>
        <p>
          You may not use our Services to offer, present, promote, sell, give away, or otherwise
          make available to others any good or service involving:
        </p>
        <ul>
          <li>items that promote, encourage, facilitate, or instruct others how to engage in illegal activity;</li>
          <li>cigarettes;</li>
          <li>controlled substances and/or other products that present a risk to consumer safety, narcotics, steroids, or drug paraphernalia;</li>
          <li>specific knives or other weapons regulated under applicable law;</li>
          <li>firearms, ammunition, or certain firearm parts or accessories;</li>
          <li>certain sexually oriented materials or services;</li>
          <li>certain items before the seller has control or possession of the item;</li>
          <li>stolen goods;</li>
          <li>products or services identified by government agencies to be highly likely to be fraudulent; and</li>
          <li>any transaction or activity that requires pre-approval without having obtained said approval.</li>
        </ul>
      </LegalSection>

      <LegalSection id="reviews" num="05" title="Reviews & Ratings">
        <p>When your Contribution is a review or rating, you also agree that:</p>
        <ul>
          <li>you have firsthand experience with the goods and services being reviewed;</li>
          <li>your Contribution is true to your experience;</li>
          <li>
            you are not affiliated with competitors if posting negative reviews (or linked in any
            way to, e.g., by being the owner or seller/manufacturer of, a product or service if
            posting positive reviews);
          </li>
          <li>you cannot make or offer any conclusions as to the legality of conduct;</li>
          <li>you cannot post any false or misleading statements; and</li>
          <li>you do not and will not organize a campaign encouraging others to post reviews, whether positive or negative.</li>
        </ul>
      </LegalSection>

      <LegalSection id="reporting" num="06" title="Reporting a Breach of This Policy">
        <p>
          We may but are under no obligation to review or moderate the Contributions made on the
          Services and we expressly exclude our liability for any loss or damage resulting from any
          of our users&rsquo; breach of this Policy.
        </p>
        <p>If you consider that any Service, Content, or Contribution:</p>
        <ul>
          <li>
            breaches this Policy, please email us at{" "}
            <a href="mailto:vmcsheehy@upsyclemarket.com">vmcsheehy@upsyclemarket.com</a> to let us
            know which Service, Content, or Contribution is in breach of this Policy and why;
          </li>
          <li>
            infringes any third-party intellectual property rights, please email us at{" "}
            <a href="mailto:vmcsheehy@upsyclemarket.com">vmcsheehy@upsyclemarket.com</a>.
          </li>
        </ul>
        <p>We will reasonably determine whether a Service, Content, or Contribution breaches this Policy.</p>
      </LegalSection>

      <LegalSection id="consequences" num="07" title="Consequences of Breaching This Policy">
        <p>
          The consequences for violating our Policy will vary depending on the severity of the
          breach and the user&rsquo;s history on the Services. By way of example, we may, in some
          cases, give you a warning and/or remove the infringing Contribution; however, if your
          breach is serious or if you continue to breach our Legal Terms and this Policy, we have
          the right to suspend or terminate your access to and use of our Services and, if
          applicable, disable your account. We may also notify law enforcement or issue legal
          proceedings against you when we believe that there is a genuine risk to an individual or
          a threat to public safety.
        </p>
        <p>We exclude our liability for all action we may take in response to any of your breaches of this Policy.</p>
      </LegalSection>

      <LegalSection id="complaints" num="08" title="Complaints & Removal of Legitimate Content">
        <p>
          If you consider that some Content or Contribution has been mistakenly removed or blocked
          from the Services, please refer to the contact details in{" "}
          <a href="#contact">Section 10</a> and we will promptly review our decision to remove such
          Content or Contribution. The Content or Contribution may stay &ldquo;down&rdquo; while we
          conduct the review process.
        </p>
      </LegalSection>

      <LegalSection id="disclaimer" num="09" title="Disclaimer">
        <p>
          UpSycle Market LLC is under no obligation to monitor users&rsquo; activities, and we
          disclaim any responsibility for any user&rsquo;s misuse of the Services. UpSycle Market
          LLC has no responsibility for any user or other Content or Contribution created,
          maintained, stored, transmitted, or accessible on or through the Services, and is not
          obligated to monitor or exercise any editorial control over such material. If UpSycle
          Market LLC becomes aware that any such Content or Contribution violates this Policy,
          UpSycle Market LLC may, in addition to removing such Content or Contribution and blocking
          your account, report such breach to the police or appropriate regulatory authority.
          Unless otherwise stated in this Policy, UpSycle Market LLC disclaims any obligation to
          any person who has not entered into an agreement with UpSycle Market LLC for the use of
          the Services.
        </p>
      </LegalSection>

      <LegalSection id="contact" num="10" title="Contact Us About This Policy">
        <p>
          If you have any further questions or comments or wish to report any problematic Content
          or Contribution, you may contact us by:
        </p>
        <p>
          Email: <a href="mailto:vmcsheehy@upsyclemarket.com">vmcsheehy@upsyclemarket.com</a>
          <br />
          Phone: (760) 695-2784
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
