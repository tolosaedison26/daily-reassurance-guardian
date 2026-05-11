import { supabase } from "@/integrations/supabase/client";

export type UserRole = "senior" | "admin";

/** Strip formatting chars, ensure leading '+' for E.164.
 *  10-digit numbers are assumed US → prepend +1. */
export const normalizePhone = (p: string): string => {
  const digits = p.replace(/[^\d]/g, "");
  if (!digits) return "";
  // 10-digit US number without country code
  if (digits.length === 10 && !digits.startsWith("1")) return `+1${digits}`;
  // 11-digit US number starting with 1
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  // Already has country code or international
  return `+${digits}`;
};

/** Format US phone as +1 (XXX) XXX-XXXX as user types */
export const formatPhoneDisplay = (raw: string): string => {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 0) return "";
  // If starts with 1 (US country code already), format normally
  if (digits.startsWith("1")) {
    const d = digits.slice(1);
    if (d.length <= 3) return `+1 (${d}`;
    if (d.length <= 6) return `+1 (${d.slice(0, 3)}) ${d.slice(3)}`;
    return `+1 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`;
  }
  // 10-digit US number without country code — treat as US
  if (digits.length <= 10) {
    if (digits.length <= 3) return `+1 (${digits}`;
    if (digits.length <= 6) return `+1 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
  return `+${digits}`;
};

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  return { data, error };
}

export async function createUserProfile(userId: string, fullName: string, role: UserRole) {
  const { data, error } = await supabase
    .from("profiles")
    .insert({ user_id: userId, full_name: fullName, role })
    .select()
    .single();
  return { data, error };
}

/** Get today's check-in for a senior (by seniors.id) */
export async function getTodayCheckIn(seniorId: string) {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("check_ins")
    .select("*")
    .eq("senior_id", seniorId)
    .eq("date", today)
    .maybeSingle();
  return { data, error };
}

/** Create/upsert a check-in for today */
export async function createCheckIn(seniorId: string, mood?: string) {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("check_ins")
    .upsert(
      {
        senior_id: seniorId,
        date: today,
        status: "SAFE",
        mood: mood || null,
        responded_at: new Date().toISOString(),
      },
      { onConflict: "senior_id,date" }
    )
    .select()
    .single();
  return { data, error };
}

/** Get reminder settings from seniors table */
export async function getReminderSettings(seniorId: string) {
  const { data, error } = await supabase
    .from("seniors")
    .select("check_in_time, grace_period_minutes, timezone")
    .eq("id", seniorId)
    .maybeSingle();
  return { data, error };
}

/** Update reminder settings on seniors table */
export async function upsertReminderSettings(
  seniorId: string,
  reminderTime: string,
  gracePeriodMinutes: number
) {
  const { data, error } = await supabase
    .from("seniors")
    .update({ check_in_time: reminderTime, grace_period_minutes: gracePeriodMinutes })
    .eq("id", seniorId)
    .select()
    .single();
  return { data, error };
}

// n8n webhook URLs — centralised so they appear in exactly one place
const N8N_BASE = "https://n8n.srv1333522.hstgr.cloud/webhook";
const SMS_WEBHOOK_URL = `${N8N_BASE}/sms-opt-in-requested`;
const EC_WEBHOOK_URL = `${N8N_BASE}/emergency-contact-added`;

const REGISTRATION_WEBHOOK_URL = `${N8N_BASE}/new-registration-alert`;

/**
 * Trigger SMS opt-in (sends confirmation SMS) or opt-out (sends unsubscribe SMS).
 * Fire-and-forget — does not block UI.
 * If phone/name not provided, fetches from seniors table.
 */
export async function triggerSmsWebhook(
  seniorId: string,
  type: "opt_in" | "opt_out",
  phone?: string,
  name?: string
) {
  try {
    let sPhone = phone;
    let sName = name;
    if (!sPhone || !sName) {
      const { data } = await supabase
        .from("seniors")
        .select("phone, name")
        .eq("id", seniorId)
        .maybeSingle();
      if (data) {
        sPhone = sPhone || data.phone;
        sName = sName || data.name;
      }
    }
    if (!sPhone) return; // no phone — can't send SMS
    const cleanPhone = normalizePhone(sPhone);
    if (!cleanPhone || cleanPhone.length < 10) return; // invalid phone
    fetch(SMS_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senior_id: seniorId, phone: cleanPhone, name: sName || "there", type }),
    }).catch(() => {}); // fire-and-forget
  } catch {
    // silent — SMS webhook is best-effort
  }
}

/**
 * Send a Slack notification when a new user registers.
 * Includes order number and a note to manually verify in admin console.
 * Fire-and-forget — does not block UI.
 */
export function notifyRegistrationSlack(payload: {
  name: string;
  phone: string;
  order_number: string;
}) {
  fetch(REGISTRATION_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {}); // fire-and-forget
}

/**
 * Notify n8n that an emergency contact was added (Wf5).
 * Fire-and-forget — does not block UI.
 */
export function triggerEmergencyContactWebhook(payload: {
  senior_name: string;
  contact_name: string;
  contact_phone: string;
  senior_id: string;
  contact_id: string;
}) {
  fetch(EC_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {}); // fire-and-forget
}
