export interface PillReminder {
  id: string;
  senior_id: string;
  medication_name: string;
  dosage: string | null;
  frequency: PillFrequency;
  times: string[];
  notes: string | null;
  color: string;
  paused: boolean;
  created_at: string;
  updated_at: string;
}

export interface PillDose {
  id: string;
  pill_reminder_id: string;
  senior_id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: "PENDING" | "TAKEN" | "MISSED" | "SKIPPED";
  taken_at: string | null;
  created_at: string;
}

export type PillFrequency =
  | "daily"
  | "twice_daily"
  | "three_times_daily"
  | "weekly"
  | "as_needed";

export const FREQUENCY_OPTIONS: {
  value: PillFrequency;
  label: string;
  timeCount: number;
}[] = [
  { value: "daily", label: "Once daily", timeCount: 1 },
  { value: "twice_daily", label: "Twice daily", timeCount: 2 },
  { value: "three_times_daily", label: "3 times daily", timeCount: 3 },
  { value: "weekly", label: "Once weekly", timeCount: 1 },
  { value: "as_needed", label: "As needed", timeCount: 0 },
];

export const PILL_COLORS = [
  { value: "blue", bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", stripe: "bg-blue-500" },
  { value: "red", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300", stripe: "bg-red-500" },
  { value: "green", bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300", stripe: "bg-emerald-500" },
  { value: "purple", bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300", stripe: "bg-purple-500" },
  { value: "orange", bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300", stripe: "bg-orange-500" },
  { value: "gray", bg: "bg-gray-100 dark:bg-gray-800/50", text: "text-gray-700 dark:text-gray-300", stripe: "bg-gray-500" },
];

export const MEDICATION_PRESETS = [
  { name: "Lisinopril", dosage: "10mg", frequency: "daily" as PillFrequency, label: "Blood Pressure" },
  { name: "Metformin", dosage: "500mg", frequency: "twice_daily" as PillFrequency, label: "Diabetes" },
  { name: "Atorvastatin", dosage: "20mg", frequency: "daily" as PillFrequency, label: "Cholesterol" },
  { name: "Aspirin", dosage: "81mg", frequency: "daily" as PillFrequency, label: "Blood Thinner" },
  { name: "Levothyroxine", dosage: "50mcg", frequency: "daily" as PillFrequency, label: "Thyroid" },
  { name: "Acetaminophen", dosage: "500mg", frequency: "as_needed" as PillFrequency, label: "Pain Relief" },
];

export function formatTime12h(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr || "00";
  const period = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${period}`;
}

export function getDefaultTimes(frequency: PillFrequency): string[] {
  switch (frequency) {
    case "daily":
    case "weekly":
      return ["08:00"];
    case "twice_daily":
      return ["08:00", "20:00"];
    case "three_times_daily":
      return ["08:00", "13:00", "20:00"];
    case "as_needed":
      return [];
  }
}
