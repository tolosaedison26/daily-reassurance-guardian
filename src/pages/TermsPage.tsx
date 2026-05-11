import { useNavigate } from "react-router-dom";
import { Shield, ChevronLeft } from "lucide-react";

export default function TermsPage() {
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

        <h1 className="text-3xl font-black text-foreground mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>

        <div className="space-y-8 text-base text-foreground leading-relaxed">
          <section>
            <h2 className="text-xl font-black mb-3">1. About Daily Guardian</h2>
            <p>
              Daily Guardian is a daily check-in and wellness service available
              exclusively to{" "}
              <a href="https://www.edwardcreation.com/" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">Edward Creation</a>{" "}
              customers. It sends automated SMS messages to users at a scheduled time.
              If a user does not respond within a configurable grace period, their
              designated emergency contacts are notified via SMS in priority order.
              The service also includes medication tracking with optional SMS
              reminders, brain games (Word Scramble and Memory Match with solo,
              daily challenge, and VS multiplayer modes), and calming ambient sounds.
            </p>
          </section>

          <section className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6">
            <h2 className="text-xl font-black mb-3 text-destructive">
              2. NOT AN EMERGENCY SERVICE
            </h2>
            <p className="font-semibold">
              Daily Guardian is NOT a substitute for 911, emergency medical services (EMS),
              or any professional emergency response system.
            </p>
            <p className="mt-3">
              This service is a communication tool only. It does not dispatch emergency
              responders, provide medical advice, or guarantee any form of emergency
              intervention. In any medical or safety emergency, always call 911 or your
              local emergency number first.
            </p>
          </section>

          <section className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6">
            <h2 className="text-xl font-black mb-3 text-destructive">
              3. NO GUARANTEE OF DELIVERY OR RESPONSE
            </h2>
            <p className="font-semibold">
              Daily Guardian does not guarantee that SMS messages will be delivered or
              received on time, or at all.
            </p>
            <p className="mt-3">
              SMS delivery depends on third-party carriers, network availability, device
              status, and other factors outside our control. Messages may be delayed,
              filtered, or undelivered due to carrier issues, phone settings, signal
              strength, or device power status. A missed or delayed notification does not
              necessarily indicate an emergency.
            </p>
          </section>

          <section className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6">
            <h2 className="text-xl font-black mb-3 text-destructive">
              4. LIMITATION OF LIABILITY
            </h2>
            <p className="font-semibold">
              Daily Guardian, its operators, affiliates, and partners shall not be held
              liable for any harm, injury, death, loss, or damages arising from the use
              or inability to use this service.
            </p>
            <p className="mt-3">
              This includes but is not limited to: failure to deliver or receive SMS
              messages, delays in notification, system outages, incorrect contact
              information provided by users, or any reliance on this service as a
              primary safety mechanism. By using Daily Guardian, you acknowledge that
              this service supplements — but does not replace — personal check-ins,
              professional care, and emergency services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3">5. User Responsibilities</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide a valid Edward Creation order number during registration.</li>
              <li>Provide accurate phone numbers for yourself and your emergency contacts.</li>
              <li>Ensure emergency contacts have consented to receiving automated SMS notifications.</li>
              <li>Maintain a working mobile device capable of receiving SMS messages.</li>
              <li>Do not rely on Daily Guardian as your sole safety or emergency system.</li>
              <li>Keep your account information, medications, and emergency contacts up to date.</li>
              <li>Use brain games and calming sounds features for personal, non-commercial purposes only.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3">6. Privacy & Data</h2>
            <p>
              We collect and store the minimum data necessary to operate the service:
              your name, phone number, Edward Creation order number, check-in schedule,
              medication information, game activity, and emergency contact information.
              We do not sell your data to third parties. SMS messages are sent through
              third-party providers (Twilio) subject to their own privacy policies.
              For full details, see our{" "}
              <a href="/privacy" className="text-primary font-semibold hover:underline">
                Privacy Policy
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3">7. Account Inactivity</h2>
            <p>
              Accounts that show no activity for 5 consecutive days (no check-ins,
              no logins, no app usage) and have not paused check-ins may be
              automatically deleted along with all associated data. You can prevent
              this by pausing check-ins in your Settings if you will be away.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3">8. Service Availability</h2>
            <p>
              Daily Guardian is provided "as is" without warranties of any kind, whether
              express or implied. We do not guarantee uninterrupted service availability.
              We may modify, suspend, or discontinue the service at any time with or
              without notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3">9. Changes to These Terms</h2>
            <p>
              We may update these Terms of Service from time to time. Continued use of
              Daily Guardian after changes constitutes acceptance of the updated terms.
              We will make reasonable efforts to notify users of material changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3">10. Contact</h2>
            <p>
              If you have questions about these Terms of Service, please contact us at{" "}
              <a href="mailto:support@daily-guardian.com" className="text-primary font-semibold hover:underline">
                support@daily-guardian.com
              </a>{" "}
              or call{" "}
              <a href="tel:+17432107677" className="text-primary font-semibold hover:underline">
                +1 (743) 210-7677
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
