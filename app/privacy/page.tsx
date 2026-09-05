import Link from "next/link";
import LegalPageLayout, { LegalSection, type LegalTocItem } from "@/components/legal/LegalPageLayout";

export const metadata = {
  title: "Privacy Policy — UpSycle Market",
};

const toc: LegalTocItem[] = [
  { id: "overview", label: "Overview" },
  { id: "collect", label: "What Information We Collect" },
  { id: "use", label: "How We Process Your Information" },
  { id: "share", label: "When & With Whom We Share Your Information" },
  { id: "social-logins", label: "How We Handle Your Social Logins" },
  { id: "retention", label: "How Long We Keep Your Information" },
  { id: "security", label: "How We Keep Your Information Safe" },
  { id: "children", label: "Do We Collect Information From Minors?" },
  { id: "rights", label: "Your Privacy Rights" },
  { id: "dnt", label: "Do-Not-Track Controls" },
  { id: "us-rights", label: "US State Privacy Rights" },
  { id: "changes", label: "Changes to This Notice" },
  { id: "contact", label: "Contact Us" },
  { id: "review-data", label: "Review, Update, or Delete Your Data" },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      eyebrow="UpSycle Market"
      title="Privacy Policy"
      effectiveDate="August 25, 2026"
      lastUpdated="August 25, 2026"
      disclaimer={
        <>
          This page reflects UpSycle Market&rsquo;s current Privacy Notice, including our real
          entity and contact details. It is still not legal advice &mdash; privacy obligations
          depend on where your users are located, and this notice should be reviewed by an
          attorney before you rely on it, especially the California and other US state privacy
          rights sections, since requirements vary by state and change often.
        </>
      }
      toc={toc}
    >
      <LegalSection id="overview" num="01" title="Overview">
        <p>
          This Privacy Notice for UpSycle Market LLC (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or
          &ldquo;our&rdquo;) describes how and why we might access, collect, store, use, and/or
          share (&ldquo;process&rdquo;) your personal information when you use our services (the
          &ldquo;Services&rdquo;), including when you:
        </p>
        <ul>
          <li>
            Visit our website at{" "}
            <a href="http://www.upsyclemarket.com" target="_blank" rel="noreferrer">
              www.upsyclemarket.com
            </a>{" "}
            or any website of ours that links to this Privacy Notice
          </li>
          <li>Download and use our mobile application (UpSycleMarket), or any other application of ours that links to this Privacy Notice</li>
          <li>
            Use our marketplace, which is built to support the work of independent artists &mdash;
            UpSycle Market only carries listings from independent sellers
          </li>
          <li>Engage with us in other related ways, including any marketing or events</li>
        </ul>
        <p>
          <strong>Questions or concerns?</strong> Reading this Privacy Notice will help you
          understand your privacy rights and choices. We are responsible for making decisions about
          how your personal information is processed. If you do not agree with our policies and
          practices, please do not use our Services. If you still have any questions or concerns,
          please contact us at{" "}
          <a href="mailto:vmcsheehy@upsyclemarket.com">vmcsheehy@upsyclemarket.com</a>. This policy
          should be read alongside our <Link href="/terms">Terms &amp; Conditions</Link>.
        </p>

        <h3>Summary of key points</h3>
        <ul>
          <li>
            <strong>What personal information do we process?</strong> When you visit, use, or
            navigate our Services, we may process personal information depending on how you
            interact with us and the Services, the choices you make, and the products and features
            you use. See <a href="#collect">Section 2</a>.
          </li>
          <li>
            <strong>Do we process any sensitive personal information?</strong> Some information may
            be considered &ldquo;special&rdquo; or &ldquo;sensitive&rdquo; in certain jurisdictions,
            for example your racial or ethnic origins, sexual orientation, and religious beliefs. We
            do not process sensitive personal information.
          </li>
          <li>
            <strong>Do we collect any information from third parties?</strong> We do not collect
            any information from third parties.
          </li>
          <li>
            <strong>How do we process your information?</strong> We process your information to
            provide, improve, and administer our Services, communicate with you, for security and
            fraud prevention, and to comply with law. We may also process your information for other
            purposes with your consent. See <a href="#use">Section 3</a>.
          </li>
          <li>
            <strong>In what situations and with which parties do we share personal information?</strong>{" "}
            We may share information in specific situations and with specific third parties. See{" "}
            <a href="#share">Section 4</a>.
          </li>
          <li>
            <strong>How do we keep your information safe?</strong> We have organizational and
            technical processes and procedures in place to protect your personal information.
            However, no electronic transmission over the internet or information storage technology
            can be guaranteed to be 100% secure. See <a href="#security">Section 7</a>.
          </li>
          <li>
            <strong>What are your rights?</strong> Depending on where you are located
            geographically, applicable privacy law may mean you have certain rights regarding your
            personal information. See <a href="#rights">Section 9</a>.
          </li>
          <li>
            <strong>How do you exercise your rights?</strong> The easiest way to exercise your
            rights is by contacting us. We will consider and act upon any request in accordance
            with applicable data protection laws.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="collect" num="02" title="What Information We Collect">
        <h3>Personal information you disclose to us</h3>
        <p>
          We collect personal information that you voluntarily provide to us when you register on
          the Services, express an interest in obtaining information about us or our products and
          Services, when you participate in activities on the Services, or otherwise when you
          contact us. The personal information we collect depends on the context of your
          interactions with us and the Services, the choices you make, and the products and
          features you use, and may include:
        </p>
        <ul>
          <li>Names</li>
          <li>Phone numbers</li>
          <li>Email addresses</li>
          <li>Mailing addresses</li>
          <li>Billing addresses</li>
          <li>Debit/credit card numbers</li>
          <li>Usernames</li>
        </ul>
        <p>We do not process sensitive information.</p>
        <p>
          <strong>Payment Data.</strong> We may collect data necessary to process your payment if
          you choose to make purchases, such as your payment instrument number and the security
          code associated with your payment instrument. All payment data is handled and stored by{" "}
          <a href="https://stripe.com/legal/privacy-center" target="_blank" rel="noreferrer">
            Stripe
          </a>
          . You may find their privacy notice at the link above.
        </p>
        <p>
          <strong>Social Media Login Data.</strong> We may provide you with the option to register
          with us using your existing social media account details, like your Facebook, X, or other
          social media account. If you choose to register in this way, we will collect certain
          profile information about you from the social media provider, as described in{" "}
          <a href="#social-logins">Section 5</a>.
        </p>
        <p>
          <strong>Application Data.</strong> If you use our application(s), we also may collect the
          following information if you choose to provide us with access or permission:
        </p>
        <ul>
          <li>
            <strong>Geolocation Information.</strong> We may request access or permission to track
            location-based information from your mobile device, either continuously or while you
            are using our mobile application(s), to provide certain location-based services. If you
            wish to change our access or permissions, you may do so in your device&rsquo;s settings.
          </li>
        </ul>
        <p>
          This information is primarily needed to maintain the security and operation of our
          application(s), for troubleshooting, and for our internal analytics and reporting
          purposes. All personal information that you provide to us must be true, complete, and
          accurate, and you must notify us of any changes to such personal information.
        </p>

        <h3>Information automatically collected</h3>
        <p>
          Some information &mdash; such as your Internet Protocol (IP) address and/or browser and
          device characteristics &mdash; is collected automatically when you visit our Services.
          This information does not reveal your specific identity (like your name or contact
          information) but may include device and usage information, such as your IP address,
          browser and device characteristics, operating system, language preferences, referring
          URLs, device name, country, location, information about how and when you use our
          Services, and other technical information. This information is primarily needed to
          maintain the security and operation of our Services, and for our internal analytics and
          reporting purposes. The information we collect includes:
        </p>
        <ul>
          <li>
            <strong>Log and Usage Data.</strong> Log and usage data is service-related, diagnostic,
            usage, and performance information our servers automatically collect when you access or
            use our Services and which we record in log files. Depending on how you interact with
            us, this log data may include your IP address, device information, browser type, and
            settings and information about your activity in the Services (such as the date/time
            stamps associated with your usage, pages and files viewed, searches, and other actions
            you take such as which features you use), device event information (such as system
            activity, error reports (sometimes called &ldquo;crash dumps&rdquo;), and hardware
            settings).
          </li>
          <li>
            <strong>Location Data.</strong> We collect location data such as information about your
            device&rsquo;s location, which can be either precise or imprecise. How much information
            we collect depends on the type and settings of the device you use to access the
            Services. For example, we may use GPS and other technologies to collect geolocation data
            that tells us your current location (based on your IP address). You can opt out of
            allowing us to collect this information either by refusing access to the information or
            by disabling your Location setting on your device. However, if you choose to opt out,
            you may not be able to use certain aspects of the Services.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="use" num="03" title="How We Process Your Information">
        <p>
          We process your personal information for a variety of reasons, depending on how you
          interact with our Services, including:
        </p>
        <ul>
          <li>To facilitate account creation and authentication and otherwise manage user accounts.</li>
          <li>To deliver and facilitate delivery of services to the user.</li>
          <li>To respond to user inquiries and offer support to users.</li>
          <li>To fulfill and manage your orders, payments, returns, and exchanges made through the Services.</li>
          <li>To request feedback and to contact you about your use of our Services.</li>
          <li>
            To send you marketing and promotional communications, if this is in accordance with
            your marketing preferences. You can opt out of our marketing emails at any time &mdash;
            see <a href="#rights">Section 9</a>.
          </li>
          <li>To deliver targeted advertising and develop and display personalized content tailored to your interests, location, and more.</li>
          <li>To post testimonials on our Services that may contain personal information.</li>
          <li>To protect our Services, including fraud monitoring and prevention.</li>
          <li>To evaluate and improve our Services, products, marketing, and your experience, including identifying usage trends and determining the effectiveness of our promotional campaigns.</li>
          <li>To comply with our legal obligations, respond to legal requests, and exercise, establish, or defend our legal rights.</li>
        </ul>
      </LegalSection>

      <LegalSection id="share" num="04" title="When & With Whom We Share Your Information">
        <p>We may need to share your personal information in the following situations:</p>
        <ul>
          <li>
            <strong>Business Transfers.</strong> We may share or transfer your information in
            connection with, or during negotiations of, any merger, sale of company assets,
            financing, or acquisition of all or a portion of our business to another company.
          </li>
          <li>
            <strong>Business Partners.</strong> We may share your information with our business
            partners to offer you certain products, services, or promotions.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="social-logins" num="05" title="How We Handle Your Social Logins">
        <p>
          Our Services offer you the ability to register and log in using your third-party social
          media account details (like your Facebook or X logins). Where you choose to do this, we
          will receive certain profile information about you from your social media provider. The
          profile information we receive may vary depending on the social media provider concerned,
          but will often include your name, email address, friends list, and profile picture, as
          well as other information you choose to make public on such a social media platform.
        </p>
        <p>
          We will use the information we receive only for the purposes that are described in this
          Privacy Notice or that are otherwise made clear to you on the relevant Services. Please
          note that we do not control, and are not responsible for, other uses of your personal
          information by your third-party social media provider. We recommend that you review their
          privacy notice to understand how they collect, use, and share your personal information,
          and how you can set your privacy preferences on their sites and apps.
        </p>
      </LegalSection>

      <LegalSection id="retention" num="06" title="How Long We Keep Your Information">
        <p>
          We will only keep your personal information for as long as it is necessary for the
          purposes set out in this Privacy Notice, unless a longer retention period is required or
          permitted by law (such as tax, accounting, or other legal requirements). No purpose in
          this notice will require us keeping your personal information for longer than the period
          of time in which users have an account with us.
        </p>
        <p>
          When we have no ongoing legitimate business need to process your personal information, we
          will either delete or anonymize such information, or, if this is not possible (for
          example, because your personal information has been stored in backup archives), then we
          will securely store your personal information and isolate it from any further processing
          until deletion is possible.
        </p>
      </LegalSection>

      <LegalSection id="security" num="07" title="How We Keep Your Information Safe">
        <p>
          We have implemented appropriate and reasonable technical and organizational security
          measures designed to protect the security of any personal information we process.
          However, despite our safeguards and efforts to secure your information, no electronic
          transmission over the internet or information storage technology can be guaranteed to be
          100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other
          unauthorized third parties will not be able to defeat our security and improperly
          collect, access, steal, or modify your information. Although we will do our best to
          protect your personal information, transmission of personal information to and from our
          Services is at your own risk. You should only access the Services within a secure
          environment.
        </p>
      </LegalSection>

      <LegalSection id="children" num="08" title="Do We Collect Information From Minors?">
        <p>
          We do not knowingly collect, solicit data from, or market to children under 18 years of
          age, nor do we knowingly sell such personal information. By using the Services, you
          represent that you are at least 18 or that you are the parent or guardian of such a minor
          and consent to such minor dependent&rsquo;s use of the Services. If we learn that
          personal information from users less than 18 years of age has been collected, we will
          deactivate the account and take reasonable measures to promptly delete such data from our
          records. If you become aware of any data we may have collected from children under age
          18, please contact us at{" "}
          <a href="mailto:vmcsheehy@upsyclemarket.com">vmcsheehy@upsyclemarket.com</a>.
        </p>
      </LegalSection>

      <LegalSection id="rights" num="09" title="Your Privacy Rights">
        <p>
          You may review, change, or terminate your account at any time, depending on your country,
          province, or state of residence.
        </p>
        <p>
          <strong>Withdrawing your consent:</strong> if we are relying on your consent to process
          your personal information, which may be express and/or implied consent depending on the
          applicable law, you have the right to withdraw your consent at any time by contacting us
          using the details in <a href="#contact">Section 13</a>. However, please note that this
          will not affect the lawfulness of the processing before its withdrawal nor, when
          applicable law allows, will it affect the processing of your personal information
          conducted in reliance on lawful processing grounds other than consent.
        </p>
        <p>
          <strong>Opting out of marketing and promotional communications:</strong> you can
          unsubscribe from our marketing and promotional communications at any time by replying
          &ldquo;STOP&rdquo; or &ldquo;UNSUBSCRIBE&rdquo; to the SMS messages that we send, or by
          contacting us using the details in <a href="#contact">Section 13</a>. You will then be
          removed from the marketing lists. However, we may still communicate with you &mdash; for
          example, to send you service-related messages that are necessary for the administration
          and use of your account, to respond to service requests, or for other non-marketing
          purposes.
        </p>
        <h3>Account Information</h3>
        <p>If you would at any time like to review or change the information in your account or terminate your account, you can:</p>
        <ul>
          <li>Log in to your account settings and update your user account.</li>
        </ul>
        <p>
          Upon your request to terminate your account, we will deactivate or delete your account and
          information from our active databases. However, we may retain some information in our
          files to prevent fraud, troubleshoot problems, assist with any investigations, enforce our
          legal terms and/or comply with applicable legal requirements.
        </p>
        <p>
          If you have questions or comments about your privacy rights, you may email us at{" "}
          <a href="mailto:vmcsheehy@upsyclemarket.com">vmcsheehy@upsyclemarket.com</a>.
        </p>
      </LegalSection>

      <LegalSection id="dnt" num="10" title="Do-Not-Track Controls">
        <p>
          Most web browsers and some mobile operating systems and mobile applications include a
          Do-Not-Track (&ldquo;DNT&rdquo;) feature or setting you can activate to signal your
          privacy preference not to have data about your online browsing activities monitored and
          collected. At this stage, no uniform technology standard for recognizing and implementing
          DNT signals has been finalized. As such, we do not currently respond to DNT browser
          signals or any other mechanism that automatically communicates your choice not to be
          tracked online. If a standard for online tracking is adopted that we must follow in the
          future, we will inform you about that practice in a revised version of this Privacy
          Notice.
        </p>
        <p>
          California law requires us to let you know how we respond to web browser DNT signals.
          Because there currently is not an industry or legal standard for recognizing or honoring
          DNT signals, we do not respond to them at this time.
        </p>
      </LegalSection>

      <LegalSection id="us-rights" num="11" title="US State Privacy Rights">
        <p>
          If you are a resident of California, Colorado, Connecticut, Delaware, Florida, Indiana,
          Iowa, Kentucky, Maryland, Minnesota, Montana, Nebraska, New Hampshire, New Jersey, Oregon,
          Rhode Island, Tennessee, Texas, Utah, or Virginia, you may have the right to request
          access to and receive details about the personal information we maintain about you and
          how we have processed it, correct inaccuracies, get a copy of, or delete your personal
          information. You may also have the right to withdraw your consent to our processing of
          your personal information. These rights may be limited in some circumstances by
          applicable law.
        </p>

        <h3>Categories of Personal Information We Collect</h3>
        <p>
          The table below shows the categories of personal information we have collected in the
          past twelve (12) months. The table includes illustrative examples of each category and
          does not reflect the personal information we collect from you. For a comprehensive
          inventory of all personal information we process, please refer to{" "}
          <a href="#collect">Section 2</a>.
        </p>
        <table className="legal-table">
          <tbody>
            <tr>
              <th>Category</th>
              <th>Examples</th>
              <th>Collected</th>
            </tr>
            <tr>
              <td>A. Identifiers</td>
              <td>
                Contact details, such as real name, alias, postal address, telephone or mobile
                contact number, unique personal identifier, online identifier, Internet Protocol
                address, email address, and account name
              </td>
              <td>Yes</td>
            </tr>
            <tr>
              <td>B. Personal information as defined in the California Customer Records statute</td>
              <td>Name, contact information, education, employment, employment history, and financial information</td>
              <td>No</td>
            </tr>
            <tr>
              <td>C. Protected classification characteristics under state or federal law</td>
              <td>Gender, age, date of birth, race and ethnicity, national origin, marital status, and other demographic data</td>
              <td>No</td>
            </tr>
            <tr>
              <td>D. Commercial information</td>
              <td>Transaction information, purchase history, financial details, and payment information</td>
              <td>No</td>
            </tr>
            <tr>
              <td>E. Biometric information</td>
              <td>Fingerprints and voiceprints</td>
              <td>No</td>
            </tr>
            <tr>
              <td>F. Internet or other similar network activity</td>
              <td>Browsing history, search history, online behavior, interest data, and interactions with our and other websites, applications, systems, and advertisements</td>
              <td>No</td>
            </tr>
            <tr>
              <td>G. Geolocation data</td>
              <td>Device location</td>
              <td>No</td>
            </tr>
            <tr>
              <td>H. Audio, electronic, sensory, or similar information</td>
              <td>Images and audio, video, or call recordings created in connection with our business activities</td>
              <td>No</td>
            </tr>
            <tr>
              <td>I. Professional or employment-related information</td>
              <td>Business contact details in order to provide you our Services at a business level or job title, work history, and professional qualifications if you apply for a job with us</td>
              <td>No</td>
            </tr>
            <tr>
              <td>J. Education information</td>
              <td>Student records and directory information</td>
              <td>No</td>
            </tr>
            <tr>
              <td>K. Inferences drawn from collected personal information</td>
              <td>Inferences drawn from any of the collected personal information listed above to create a profile or summary about, for example, an individual&rsquo;s preferences and characteristics</td>
              <td>No</td>
            </tr>
            <tr>
              <td>L. Sensitive personal information</td>
              <td>&mdash;</td>
              <td>No</td>
            </tr>
          </tbody>
        </table>
        <p>
          We may also collect other personal information outside of these categories through
          instances where you interact with us in person, online, or by phone or mail in the
          context of:
        </p>
        <ul>
          <li>Receiving help through our customer support channels;</li>
          <li>Participation in customer surveys or contests; and</li>
          <li>Facilitation in the delivery of our Services and to respond to your inquiries.</li>
        </ul>
        <p>
          We will use and retain the collected personal information as needed to provide the
          Services or for Category A, as long as the user has an account with us. Learn more about
          the sources of personal information we collect in <a href="#collect">Section 2</a>, and
          how we use and share it in <a href="#use">Section 3</a> and{" "}
          <a href="#share">Section 4</a>.
        </p>
        <p>
          We may use your personal information for our own business purposes, such as for
          undertaking internal research for technological development and demonstration. This is
          not considered to be &ldquo;selling&rdquo; of your personal information. We have not
          disclosed, sold, or shared any personal information to third parties for a business or
          commercial purpose in the preceding twelve (12) months. We will not sell or share personal
          information in the future belonging to website visitors, users, and other consumers.
        </p>

        <h3>Your Rights</h3>
        <p>
          You have rights under certain US state data protection laws. However, these rights are
          not absolute, and in certain cases, we may decline your request as permitted by law.
          These rights include:
        </p>
        <ul>
          <li>Right to know whether or not we are processing your personal data</li>
          <li>Right to access your personal data</li>
          <li>Right to correct inaccuracies in your personal data</li>
          <li>Right to request the deletion of your personal data</li>
          <li>Right to obtain a copy of the personal data you previously shared with us</li>
          <li>Right to non-discrimination for exercising your rights</li>
          <li>
            Right to opt out of the processing of your personal data if it is used for targeted
            advertising (or sharing as defined under California&rsquo;s privacy law), the sale of
            personal data, or profiling in furtherance of decisions that produce legal or similarly
            significant effects (&ldquo;profiling&rdquo;)
          </li>
        </ul>
        <p>Depending upon the state where you live, you may also have the following rights:</p>
        <ul>
          <li>Right to access the categories of personal data being processed (as permitted by applicable law, including the privacy law in Minnesota)</li>
          <li>Right to obtain a list of the categories of third parties to which we have disclosed personal data (as permitted by applicable law, including the privacy law in California, Delaware, and Maryland)</li>
          <li>Right to obtain a list of specific third parties to which we have disclosed personal data (as permitted by applicable law, including the privacy law in Minnesota and Oregon)</li>
          <li>Right to obtain a list of third parties to which we have sold personal data (as permitted by applicable law, including the privacy law in Connecticut)</li>
          <li>Right to review, understand, question, and depending on where you live, correct how personal data has been profiled (as permitted by applicable law, including the privacy law in Connecticut and Minnesota)</li>
          <li>Right to limit use and disclosure of sensitive personal data (as permitted by applicable law, including the privacy law in California)</li>
          <li>Right to opt out of the collection of sensitive data and personal data collected through the operation of a voice or facial recognition feature (as permitted by applicable law, including the privacy law in Florida)</li>
        </ul>

        <h3>How to Exercise Your Rights</h3>
        <p>
          To exercise these rights, you can contact us by emailing us at{" "}
          <a href="mailto:vmcsheehy@upsyclemarket.com">vmcsheehy@upsyclemarket.com</a> or by
          referring to the contact details in <a href="#contact">Section 13</a>. Under certain US
          state data protection laws, you can designate an authorized agent to make a request on
          your behalf. We may deny a request from an authorized agent that does not submit proof
          that they have been validly authorized to act on your behalf in accordance with
          applicable laws.
        </p>

        <h3>Request Verification</h3>
        <p>
          Upon receiving your request, we will need to verify your identity to determine you are
          the same person about whom we have the information in our system. We will only use
          personal information provided in your request to verify your identity or authority to
          make the request. However, if we cannot verify your identity from the information already
          maintained by us, we may request that you provide additional information for the purposes
          of verifying your identity and for security or fraud-prevention purposes. If you submit
          the request through an authorized agent, we may need to collect additional information to
          verify your identity before processing your request and the agent will need to provide a
          written and signed permission from you to submit such request on your behalf.
        </p>

        <h3>Appeals</h3>
        <p>
          Under certain US state data protection laws, if we decline to take action regarding your
          request, you may appeal our decision by emailing us at{" "}
          <a href="mailto:vmcsheehy@upsyclemarket.com">vmcsheehy@upsyclemarket.com</a>. We will
          inform you in writing of any action taken or not taken in response to the appeal,
          including a written explanation of the reasons for the decisions. If your appeal is
          denied, you may submit a complaint to your state attorney general.
        </p>
      </LegalSection>

      <LegalSection id="changes" num="12" title="Changes to This Notice">
        <p>
          We may update this Privacy Notice from time to time. The updated version will be
          indicated by an updated &ldquo;Last updated&rdquo; date at the top of this Privacy
          Notice. If we make material changes to this Privacy Notice, we may notify you either by
          prominently posting a notice of such changes or by directly sending you a notification. We
          encourage you to review this Privacy Notice frequently to be informed of how we are
          protecting your information.
        </p>
      </LegalSection>

      <LegalSection id="contact" num="13" title="Contact Us">
        <p>If you have questions or comments about this notice, you may contact us by post at:</p>
        <p>
          UpSycle Market LLC
          <br />
          3020 Alta Vista Dr
          <br />
          Fallbrook, CA 92028
          <br />
          United States
          <br />
          <a href="mailto:vmcsheehy@upsyclemarket.com">vmcsheehy@upsyclemarket.com</a>
        </p>
      </LegalSection>

      <LegalSection id="review-data" num="14" title="Review, Update, or Delete Your Data">
        <p>
          Based on the applicable laws of your country or state of residence in the US, you may
          have the right to request access to the personal information we collect from you, details
          about how we have processed it, correct inaccuracies, or delete your personal information.
          You may also have the right to withdraw your consent to our processing of your personal
          information. These rights may be limited in some circumstances by applicable law. To
          request to review, update, or delete your personal information, please contact us using
          the details in <a href="#contact">Section 13</a>.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
