import { useState } from "react";
import { HelpCircle } from "lucide-react";
import HelpModal from "./HelpModal";

function HelpButton({ label, title, icon, children }: { label: string; title: string; icon: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
        aria-label={`Help for ${label}`}
      >
        <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
      </button>
      <HelpModal open={open} onClose={() => setOpen(false)} title={title} icon={icon}>
        {children}
      </HelpModal>
    </>
  );
}

export function DashboardHelpButton() {
  return (
    <HelpButton label="Dashboard" title="Dashboard" icon="📊">
      <p>Your dashboard shows the real-time status of all your seniors at a glance.</p>
      <p className="mt-3">The banner at the top tells you immediately whether everyone is okay today:</p>
      <ul className="mt-1 space-y-1 list-disc list-inside">
        <li><strong>Green</strong> — all seniors have checked in</li>
        <li><strong>Amber</strong> — some seniors haven't responded yet (still within their grace period)</li>
        <li><strong>Red</strong> — one or more seniors missed their check-in</li>
      </ul>
      <p className="mt-3">Each senior row shows:</p>
      <ul className="mt-1 space-y-1 list-disc list-inside">
        <li>Their current status badge (Safe / Awaiting / Missed / Paused)</li>
        <li>Their last check-in time</li>
        <li>Their current mood (if reported)</li>
      </ul>
      <p className="mt-3">From here you can Mark Safe, Send a Reminder, or click their name to view their full profile and history.</p>
    </HelpButton>
  );
}

export function SeniorsHelpButton() {
  return (
    <HelpButton label="Seniors" title="Seniors" icon="👥">
      <p>The Seniors tab lists everyone you are monitoring.</p>
      <p className="mt-3">Click any senior's name to open their full profile, which shows:</p>
      <ul className="mt-1 space-y-1 list-disc list-inside">
        <li>Today's check-in status and response time</li>
        <li>Their full check-in history calendar</li>
        <li>Mood trend for the past 7 or 30 days</li>
        <li>Their emergency contacts and escalation settings</li>
      </ul>
      <p className="mt-3 font-semibold text-foreground">From the profile you can:</p>
      <ul className="mt-1 space-y-1 list-disc list-inside">
        <li>Mark them safe manually</li>
        <li>Send an extra check-in reminder</li>
        <li>Edit their schedule, grace period, or contacts</li>
        <li>Pause check-ins temporarily (e.g. during a hospital stay)</li>
      </ul>
      <p className="mt-3">To add a new senior, click "Add Senior" in the top right or sidebar.</p>
    </HelpButton>
  );
}

export function ReportsHelpButton() {
  return (
    <HelpButton label="Reports" title="Reports" icon="📊">
      <p>Reports give you a weekly summary of all check-in activity.</p>
      <p className="mt-3 font-semibold text-foreground">What you'll see:</p>
      <ul className="mt-1 space-y-1 list-disc list-inside">
        <li><strong>Check-in rate</strong> — the percentage of days each senior checked in. Green means 80%+, amber means 60–79%, red means below 60%</li>
        <li><strong>Mood trends</strong> — a day-by-day view of how each senior reported feeling over the past 7 or 30 days</li>
        <li><strong>Attention needed</strong> — seniors who may need a follow-up based on missed check-ins or declining mood</li>
        <li><strong>Weekly digest</strong> — an email summary sent to you every Sunday</li>
      </ul>
      <p className="mt-3">Use the arrow buttons at the top to navigate between weeks. Click "Send Preview Email" to receive the current week's digest immediately.</p>
    </HelpButton>
  );
}

export function SettingsHelpButton() {
  return (
    <HelpButton label="Settings" title="Settings" icon="⚙️">
      <p>Settings controls your account and notification preferences.</p>
      <p className="mt-3 font-semibold text-foreground">What you can change here:</p>
      <ul className="mt-1 space-y-1 list-disc list-inside">
        <li><strong>Account</strong> — your name, email address, and password</li>
        <li><strong>Notifications</strong> — whether you receive alerts by email, SMS, or both, and how quickly you are notified</li>
        <li><strong>Setup guide</strong> — replay the onboarding walkthrough or dashboard tour at any time</li>
      </ul>
      <p className="mt-3 text-foreground">To change a senior's check-in time, grace period, or emergency contacts — go to their profile page and use "Edit Senior" or "Contacts & Escalation". Those settings are per-senior and are not in this Settings page.</p>
    </HelpButton>
  );
}
