import { subDays, format, startOfMonth, getDay, getDaysInMonth, addDays, isFuture, isToday } from "date-fns";

export type CheckinStatus = "checked" | "missed" | "late" | "none" | "future";
export type MoodValue = "great" | "okay" | "bad" | null;

export interface DayData {
  date: Date;
  status: CheckinStatus;
  time?: string;
  mood?: MoodValue;
  note?: string;
  responseMinutes?: number;
}

export interface TimelineEvent {
  id: string;
  type: "checkin" | "missed" | "reminder" | "escalation" | "safe" | "note" | "edit" | "started";
  label: string;
  subText?: string;
  timestamp: Date;
  mood?: MoodValue;
}

export interface CaregiverNote {
  id: string;
  text: string;
  createdAt: Date;
}

// Mock senior for demo
export const MOCK_SENIOR = {
  id: "demo-margaret",
  first_name: "Margaret",
  last_name: "Ross",
  relationship: "Mother",
  date_of_birth: "1948-03-15",
  phone: "+1 555 000-0000",
  frequency: "daily",
  custom_days: [] as string[],
  reminder_hour: "08",
  reminder_minute: "00",
  reminder_period: "AM",
  timezone: "America/New_York",
  grace_period_minutes: 60,
  mood_check_enabled: true,
  vacation_mode: false,
  vacation_from: null,
  vacation_until: null,
};

function randomMood(): MoodValue {
  const r = Math.random();
  if (r < 0.6) return "great";
  if (r < 0.85) return "okay";
  return "bad";
}

export function generateMonthData(year: number, month: number): DayData[] {
  const today = new Date();
  const daysInMonth = getDaysInMonth(new Date(year, month));
  const days: DayData[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    if (isFuture(date) && !isToday(date)) {
      days.push({ date, status: "future" });
      continue;
    }
    // Simulate check-in data
    const r = Math.random();
    if (r < 0.72) {
      const mood = randomMood();
      const mins = Math.floor(Math.random() * 15) + 1;
      days.push({
        date,
        status: "checked",
        time: `8:${String(mins).padStart(2, "0")} AM`,
        mood,
        note: mood === "great" ? "Feeling good today" : mood === "okay" ? "Doing alright" : "Not the best day",
        responseMinutes: mins,
      });
    } else if (r < 0.85) {
      days.push({ date, status: "missed" });
    } else if (r < 0.93) {
      const mins = Math.floor(Math.random() * 30) + 60;
      days.push({
        date,
        status: "late",
        time: `9:${String(mins % 60).padStart(2, "0")} AM`,
        mood: randomMood(),
        responseMinutes: mins,
      });
    } else {
      days.push({ date, status: "none" });
    }
  }
  return days;
}

export function generateTimelineEvents(): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const now = new Date();

  events.push({ id: "t1", type: "checkin", label: "Checked in · Mood: 😊 Great", timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 4), mood: "great" });
  events.push({ id: "t2", type: "reminder", label: "Reminder sent", timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0) });

  const yesterday = subDays(now, 1);
  events.push({ id: "t3", type: "missed", label: "Missed check-in", subText: "Grace period expired. Sarah Ross notified.", timestamp: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 10, 15) });
  events.push({ id: "t4", type: "escalation", label: "Alert escalated to Sarah Ross", timestamp: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 9, 5) });
  events.push({ id: "t5", type: "reminder", label: "Reminder sent", timestamp: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 8, 0) });

  const d2 = subDays(now, 2);
  events.push({ id: "t6", type: "safe", label: "Marked safe by caregiver", subText: "Marked safe by you (web)", timestamp: new Date(d2.getFullYear(), d2.getMonth(), d2.getDate(), 11, 30) });

  const d3 = subDays(now, 3);
  events.push({ id: "t7", type: "checkin", label: "Checked in · Mood: 😊 Great", timestamp: new Date(d3.getFullYear(), d3.getMonth(), d3.getDate(), 8, 12), mood: "great" });
  events.push({ id: "t8", type: "reminder", label: "Reminder sent", timestamp: new Date(d3.getFullYear(), d3.getMonth(), d3.getDate(), 8, 0) });

  const d5 = subDays(now, 5);
  events.push({ id: "t9", type: "checkin", label: "Checked in · Mood: 😐 Okay", timestamp: new Date(d5.getFullYear(), d5.getMonth(), d5.getDate(), 8, 22), mood: "okay" });

  const d7 = subDays(now, 7);
  events.push({ id: "t10", type: "note", label: "Note added", subText: "Feeling good today, going to the garden", timestamp: new Date(d7.getFullYear(), d7.getMonth(), d7.getDate(), 14, 0) });

  const d10 = subDays(now, 10);
  events.push({ id: "t11", type: "checkin", label: "Checked in · Mood: 😊 Great", timestamp: new Date(d10.getFullYear(), d10.getMonth(), d10.getDate(), 7, 58), mood: "great" });

  const d14 = subDays(now, 14);
  events.push({ id: "t12", type: "edit", label: "Profile updated", subText: "Check-in time changed to 8:00 AM", timestamp: new Date(d14.getFullYear(), d14.getMonth(), d14.getDate(), 9, 0) });

  const d20 = subDays(now, 20);
  events.push({ id: "t13", type: "checkin", label: "Checked in · Mood: 😊 Great", timestamp: new Date(d20.getFullYear(), d20.getMonth(), d20.getDate(), 8, 5), mood: "great" });

  const d30 = subDays(now, 30);
  events.push({ id: "t14", type: "missed", label: "Missed check-in", subText: "No response after grace period.", timestamp: new Date(d30.getFullYear(), d30.getMonth(), d30.getDate(), 10, 0) });

  const d50 = subDays(now, 50);
  events.push({ id: "t15", type: "started", label: "Monitoring started", timestamp: new Date(d50.getFullYear(), d50.getMonth(), d50.getDate(), 15, 15) });

  return events;
}

export const MOCK_NOTES: CaregiverNote[] = [
  { id: "n1", text: "Feeling good today, mentioned she wants to try the new garden club next week.", createdAt: subDays(new Date(), 7) },
  { id: "n2", text: "Had a fall scare last week but doctor confirmed she's okay. Keep monitoring.", createdAt: subDays(new Date(), 14) },
  { id: "n3", text: "Started new medication — might affect morning routine.", createdAt: subDays(new Date(), 21) },
];
