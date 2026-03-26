import { useNavigate } from "react-router-dom";
import { Shield, ChevronLeft } from "lucide-react";

export default function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-6 h-6 text-primary" />
          <span className="text-lg font-black text-primary">Daily Guardian</span>
        </div>

        <h1 className="text-3xl font-black text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>

        <div className="space-y-8 text-base text-foreground leading-relaxed">
          <section>
            <h2 className="text-xl font-black mb-3">1. Introduction</h2>
            <p>
              Daily Guardian ("we," "us," or "our") is committed to protecting your
              privacy. This Privacy Policy explains what information we collect, how we
              use it, and how we keep it safe. We designed this service with your
              privacy and safety in mind.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3">2. Information We Collect</h2>
            <p className="mb-3">We collect only the minimum information needed to operate the service:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <span className="font-semibold">Account information:</span> Your name,
                email address, and phone number when you create an account.
              </li>
              <li>
                <span className="font-semibold">Emergency contacts:</span> Names and
                phone numbers of the people you choose to be notified if you miss a
                check-in (up to 3 contacts).
              </li>
              <li>
                <span className="font-semibold">Check-in data:</span> Your daily
                check-in time preference, check-in history, mood responses, and
                response timestamps.
              </li>
              <li>
                <span className="font-semibold">Device information:</span> Basic
                browser and device type for ensuring the app works correctly on your
                device.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3">3. How We Use Your Information</h2>
            <p className="mb-3">Your information is used solely to provide and improve the Daily Guardian service:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Send you daily check-in reminders via SMS at your scheduled time.</li>
              <li>Notify your emergency contacts if you miss a check-in.</li>
              <li>Display your check-in history and mood trends on your dashboard.</li>
              <li>Authenticate your identity when you sign in.</li>
              <li>Send important service updates (such as changes to our terms).</li>
            </ul>
            <p className="mt-3 font-semibold">
              We do NOT sell, rent, or share your personal information with advertisers
              or third-party marketers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3">4. Data Storage and Protection</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Your data is stored securely using <span className="font-semibold">Supabase</span>,
                a cloud database platform with enterprise-grade security, including
                encryption at rest and in transit.
              </li>
              <li>
                Passwords are hashed and never stored in plain text. We cannot see your
                password.
              </li>
              <li>
                Access to your data is restricted through Row Level Security (RLS)
                policies — only you can see your own data.
              </li>
              <li>
                All connections to Daily Guardian use HTTPS encryption.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3">5. SMS Messaging &amp; Phone Number Privacy</h2>
            <p className="mb-3">
              During sign-up, a disclosure below the phone number field informs you
              that providing your number enables SMS check-in reminders. You may also
              check an optional checkbox to confirm SMS consent. If selected, a
              confirmation message is sent to your phone — you must reply YES to
              activate daily reminders (double opt-in). No recurring messages are sent
              until you confirm. Account creation does not require SMS opt-in.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <span className="font-semibold">We will never share, sell, rent,
                or transfer your mobile phone number</span> or SMS consent data to
                third parties, lead generators, advertisers, or any other outside
                organizations for any purpose.
              </li>
              <li>
                Mobile opt-in consent and phone numbers collected for SMS messaging
                will not be shared with any third party and will only be used to
                deliver the Daily Guardian service you have signed up for.
              </li>
              <li>
                <span className="font-semibold">Message frequency:</span> Approximately
                1–3 SMS messages per day (one daily check-in, plus safety alerts only
                if a check-in is missed).
              </li>
              <li>
                <span className="font-semibold">To opt out:</span> Reply{" "}
                <span className="font-mono font-bold">STOP</span> to any message at
                any time. You will receive one confirmation message and no further
                messages will be sent. Reply{" "}
                <span className="font-mono font-bold">START</span> to re-subscribe.
              </li>
              <li>
                <span className="font-semibold">For help:</span> Reply{" "}
                <span className="font-mono font-bold">HELP</span> or visit{" "}
                <a
                  href="https://daily-guardian.com"
                  className="text-primary font-semibold hover:underline"
                >
                  daily-guardian.com
                </a>.
              </li>
              <li>
                Standard message and data rates may apply based on your mobile carrier plan.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3">6. Third-Party Services</h2>
            <p className="mb-3">We use the following third-party services to operate Daily Guardian:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <span className="font-semibold">Twilio</span> — for sending and
                receiving SMS messages. Your phone number and message content are
                processed by Twilio subject to their{" "}
                <a
                  href="https://www.twilio.com/legal/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-semibold hover:underline"
                >
                  privacy policy
                </a>.
                Twilio is used solely for message delivery and does not use your
                information for any other purpose.
              </li>
              <li>
                <span className="font-semibold">Supabase</span> — for data storage
                and user authentication.
              </li>
            </ul>
            <p className="mt-3">
              We do not use analytics trackers, advertising pixels, or social media
              tracking tools.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3">7. Your Rights</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <span className="font-semibold">Access your data:</span> View all
                your personal information through your account dashboard and settings.
              </li>
              <li>
                <span className="font-semibold">Update your data:</span> Change your
                name, email, phone number, emergency contacts, and check-in time at
                any time.
              </li>
              <li>
                <span className="font-semibold">Delete your account:</span> Request
                complete deletion of your account and all associated data by contacting
                us at the email below.
              </li>
              <li>
                <span className="font-semibold">Opt out of SMS:</span> Emergency
                contacts can opt out of notifications by replying STOP to any message
                they receive.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3">8. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active. If you delete
              your account, we will remove all your personal data, check-in records,
              and emergency contact information within 30 days. Some anonymized,
              aggregated data (such as total check-in counts) may be retained for
              service improvement purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3">9. Children's Privacy</h2>
            <p>
              Daily Guardian is not intended for use by children under 13 years of age.
              We do not knowingly collect personal information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. If we make
              significant changes, we will notify you through the app or via email.
              Continued use of Daily Guardian after changes constitutes acceptance of
              the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3">11. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or how your data is
              handled, please contact us at{" "}
              <a
                href="mailto:support@daily-guardian.com"
                className="text-primary font-semibold hover:underline"
              >
                support@daily-guardian.com
              </a>{" "}
              or call{" "}
              <a
                href="tel:+17432107677"
                className="text-primary font-semibold hover:underline"
              >
                +1 (743) 210-7677
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
