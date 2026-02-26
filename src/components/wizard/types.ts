export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
  notifyViaSms: boolean;
  notifyViaEmail: boolean;
  delayMinutes: number;
}

export interface SeniorFormData {
  firstName: string;
  lastName: string;
  phone: string;
  relationship: string;
  dateOfBirth: string;
  notes: string;
  reminderHour: string;
  reminderMinute: string;
  reminderPeriod: "AM" | "PM";
  timezone: string;
  gracePeriodMinutes: number;
  frequency: "daily" | "weekdays" | "custom";
  customDays: string[];
  moodCheckEnabled: boolean;
  vacationMode: boolean;
  vacationFrom: string;
  vacationUntil: string;
  contacts: EmergencyContact[];
}

export const defaultFormData: SeniorFormData = {
  firstName: "",
  lastName: "",
  phone: "",
  relationship: "",
  dateOfBirth: "",
  notes: "",
  reminderHour: "08",
  reminderMinute: "00",
  reminderPeriod: "AM",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  gracePeriodMinutes: 60,
  frequency: "daily",
  customDays: [],
  moodCheckEnabled: true,
  vacationMode: false,
  vacationFrom: "",
  vacationUntil: "",
  contacts: [
    {
      id: crypto.randomUUID(),
      name: "",
      relationship: "",
      phone: "",
      email: "",
      notifyViaSms: true,
      notifyViaEmail: false,
      delayMinutes: 0,
    },
  ],
};

export const MOCK_SENIOR: SeniorFormData = {
  firstName: "Margaret",
  lastName: "Ross",
  phone: "+15551234567",
  relationship: "Mother",
  dateOfBirth: "1946-03-15",
  notes: "Lives alone in a two-story house. Has a mild hearing impairment — prefers texts over calls.",
  reminderHour: "08",
  reminderMinute: "00",
  reminderPeriod: "AM",
  timezone: "America/New_York",
  gracePeriodMinutes: 60,
  frequency: "daily",
  customDays: [],
  moodCheckEnabled: true,
  vacationMode: false,
  vacationFrom: "",
  vacationUntil: "",
  contacts: [
    {
      id: "c1",
      name: "Jennifer Ross",
      relationship: "Daughter",
      phone: "+15559876543",
      email: "jennifer@example.com",
      notifyViaSms: true,
      notifyViaEmail: true,
      delayMinutes: 0,
    },
    {
      id: "c2",
      name: "Frank Miller",
      relationship: "Neighbor",
      phone: "+15555551234",
      email: "",
      notifyViaSms: true,
      notifyViaEmail: false,
      delayMinutes: 30,
    },
  ],
};
