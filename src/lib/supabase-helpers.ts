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

export async function getTodayCheckIn(seniorId: string) {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("daily_check_ins")
    .select("*")
    .eq("senior_id", seniorId)
    .eq("check_date", today)
    .maybeSingle();
  return { data, error };
}

export async function createCheckIn(seniorId: string) {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("daily_check_ins")
    .upsert({ senior_id: seniorId, check_date: today, checked_in_at: new Date().toISOString() }, {
      onConflict: "senior_id,check_date",
    })
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

export async function getConnectedSeniors(caregiverId: string) {
  const { data: connections, error } = await supabase
    .from("senior_connections")
    .select("*")
    .eq("caregiver_id", caregiverId)
    .eq("status", "active");

  if (error || !connections || connections.length === 0) {
    return { data: connections, error };
  }

  // Fetch profiles separately since there's no FK relationship
  const seniorIds = connections.map((c) => c.senior_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, full_name, role")
    .in("user_id", seniorIds);

  // Merge profiles into connections
  const merged = connections.map((conn) => ({
    ...conn,
    profiles: profiles?.find((p) => p.user_id === conn.senior_id) || null,
  }));

  return { data: merged, error: null };
}

export async function addSeniorConnection(caregiverId: string, seniorEmail: string) {
  // First find the senior by looking up their profile via auth
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("user_id, full_name, role")
    .eq("role", "senior")
    .ilike("full_name", `%${seniorEmail}%`)
    .limit(5);
  return { data: profileData, error: profileError };
}

export async function connectToSeniorById(caregiverId: string, seniorId: string) {
  const { data, error } = await supabase
    .from("senior_connections")
    .insert({ caregiver_id: caregiverId, senior_id: seniorId, status: "active" })
    .select()
    .single();
  return { data, error };
}

export async function getSeniorCheckInStatus(seniorId: string) {
  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("daily_check_ins")
    .select("*")
    .eq("senior_id", seniorId)
    .eq("check_date", today)
    .maybeSingle();
  return data;
}
