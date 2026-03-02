import { useState } from "react";
import { HelpCircle } from "lucide-react";
import HelpModal from "./HelpModal";

export function SeniorsHelpButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
        aria-label="Help for Your Seniors"
      >
        <HelpCircle className="w-4 h-4 text-muted-foreground" />
      </button>
      <HelpModal open={open} onClose={() => setOpen(false)} title="Your Seniors" icon="👥">
        <p>This list shows everyone you are monitoring. Each senior has a status badge that updates throughout the day:</p>
        <ul className="mt-2 space-y-1">
          <li><strong>✓ Safe</strong> — They replied to today's check-in</li>
          <li><strong>⏳ Awaiting</strong> — Reminder sent, waiting for reply</li>
          <li><strong>⚠ Missed</strong> — Grace period passed, no reply</li>
          <li><strong>— Paused</strong> — Check-ins temporarily paused</li>
        </ul>
        <p className="mt-3 font-semibold text-foreground">What you can do:</p>
        <ul className="mt-1 space-y-1 list-disc list-inside">
          <li>Click a senior's name to view their full profile and check-in history</li>
          <li>Click "Mark Safe" to manually confirm they are okay</li>
          <li>Click "Send Reminder" to send an extra SMS now</li>
          <li>Click "Add Senior" to monitor someone new</li>
          <li>Go to their profile → Edit to change schedule, contacts, or pause check-ins</li>
        </ul>
      </HelpModal>
    </>
  );
}

export function ReportsHelpButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
        aria-label="Help for Reports"
      >
        <HelpCircle className="w-4 h-4 text-muted-foreground" />
      </button>
      <HelpModal open={open} onClose={() => setOpen(false)} title="Reports" icon="📊">
        <p>Reports show a weekly summary of all check-in activity across your seniors.</p>
        <p className="mt-3 font-semibold text-foreground">What you'll find:</p>
        <ul className="mt-1 space-y-1 list-disc list-inside">
          <li><strong>Check-in rate</strong> — percentage of days each senior successfully checked in (green ≥80%, amber 60–79%, red &lt;60%)</li>
          <li><strong>Mood trends</strong> — daily mood responses over 7 or 30 days</li>
          <li><strong>Attention needed</strong> — seniors with low check-in rates or declining mood flagged for follow-up</li>
          <li><strong>Weekly digest</strong> — a summary emailed to you every Sunday</li>
        </ul>
        <p className="mt-3 font-semibold text-foreground">How to use it:</p>
        <ul className="mt-1 space-y-1 list-disc list-inside">
          <li>Use the date navigator to view previous weeks</li>
          <li>Click "Send Preview Email" to get a digest now</li>
          <li>Click a senior's name to jump to their full profile</li>
        </ul>
      </HelpModal>
    </>
  );
}

export function SettingsHelpButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
        aria-label="Help for Settings"
      >
        <HelpCircle className="w-4 h-4 text-muted-foreground" />
      </button>
      <HelpModal open={open} onClose={() => setOpen(false)} title="Settings" icon="⚙️">
        <p>Settings lets you control how Daily Guardian works for your account.</p>
        <p className="mt-3 font-semibold text-foreground">What you can change:</p>
        <ul className="mt-1 space-y-1 list-disc list-inside">
          <li><strong>Notifications</strong> — choose how and when you receive alerts (email, SMS, or both)</li>
          <li><strong>Account</strong> — update your name, email, and password</li>
          <li><strong>Emergency contact rules</strong> — edit how quickly contacts are notified and in what order</li>
          <li><strong>Onboarding</strong> — replay the setup guide or dashboard tour at any time</li>
        </ul>
        <p className="mt-3 text-foreground">To change a senior's schedule or contacts, go to their profile → Edit Senior or Contacts & Escalation — not in Settings.</p>
      </HelpModal>
    </>
  );
}
