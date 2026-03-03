import { supabase } from "@/integrations/supabase/client";

export type UserRole = "senior" | "caregiver";

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
    .eq("check_date", today)
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
        check_date: today,
        status: "SAFE",
        mood: mood || null,
        checked_in_at: new Date().toISOString(),
      },
      { onConflict: "senior_id,check_date" }
    )
    .select()
    .single();
  return { data, error };
}

export async function getReminderSettings(seniorId: string) {
  const { data, error } = await supabase
    .from("reminder_settings")
    .select("*")
    .eq("senior_id", seniorId)
    .maybeSingle();
  return { data, error };
}

export async function upsertReminderSettings(
  seniorId: string,
  reminderTime: string,
  gracePeriodHours: number
) {
  const { data, error } = await supabase
    .from("reminder_settings")
    .upsert(
      { senior_id: seniorId, reminder_time: reminderTime, grace_period_hours: gracePeriodHours },
      { onConflict: "senior_id" }
    )
    .select()
    .single();
  return { data, error };
}

/** Load seniors for a caregiver via the families table */
export async function getCaregiversSeniors(caregiverId: string) {
  const { data: families, error } = await supabase
    .from("families")
    .select("id, senior_id, created_at")
    .eq("caregiver_id", caregiverId);

  if (error || !families || families.length === 0) {
    return { data: [], error };
  }

  const seniorIds = families.map((f: any) => f.senior_id);
  const { data: seniors } = await supabase
    .from("seniors")
    .select("*")
    .in("id", seniorIds);

  const merged = families.map((f: any) => ({
    family_id: f.id,
    senior: (seniors || []).find((s: any) => s.id === f.senior_id) || null,
  }));

  return { data: merged, error: null };
}

/** Get today's check-in status for a senior */
export async function getSeniorCheckInStatus(seniorId: string) {
  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("check_ins")
    .select("*")
    .eq("senior_id", seniorId)
    .eq("check_date", today)
    .maybeSingle();
  return data;
}
