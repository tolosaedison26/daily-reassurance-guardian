import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, ChevronRight, X, RefreshCw, Trash2 } from "lucide-react";

interface Senior {
  id: string;
  name: string;
  phone: string | null;
  check_in_time: string | null;
  paused: boolean;
  sms_consent_status: string | null;
  timezone: string | null;
  grace_period_minutes: number | null;
  order_number: string | null;
  created_at: string;
  profile_id: string;
  ec_count: number;
  today_status: string | null;
}

function consentBadge(status: string | null) {
  switch (status) {
    case "confirmed":
      return <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200 hover:bg-emerald-500/10">Subscribed</Badge>;
    case "requested":
      return <Badge className="bg-amber-500/10 text-amber-700 border-amber-200 hover:bg-amber-500/10">Requested</Badge>;
    case "opted_out":
      return <Badge className="bg-red-500/10 text-red-700 border-red-200 hover:bg-red-500/10">Opted Out</Badge>;
    default:
      return <Badge variant="outline" className="text-muted-foreground">None</Badge>;
  }
}

function statusBadge(status: string | null) {
  switch (status) {
    case "SAFE":
      return <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200 hover:bg-emerald-500/10">Safe</Badge>;
    case "PENDING":
      return <Badge className="bg-amber-500/10 text-amber-700 border-amber-200 hover:bg-amber-500/10">Pending</Badge>;
    case "MISSED":
      return <Badge className="bg-red-500/10 text-red-700 border-red-200 hover:bg-red-500/10">Missed</Badge>;
    case "SKIPPED":
      return <Badge variant="outline" className="text-muted-foreground">Skipped</Badge>;
    default:
      return <span className="text-xs text-muted-foreground">—</span>;
  }
}

function getFilterLabel(key: string, value: string): string {
  if (key === "sms") {
    const map: Record<string, string> = { confirmed: "SMS: Subscribed", opted_out: "SMS: Opted Out", requested: "SMS: Requested", none: "SMS: None" };
    return map[value] ?? `SMS: ${value}`;
  }
  if (key === "status") return value === "paused" ? "Status: Paused" : "Status: Active";
  if (key === "today") {
    const map: Record<string, string> = { MISSED: "Today: Missed", SAFE: "Today: Safe", PENDING: "Today: Pending" };
    return map[value] ?? `Today: ${value}`;
  }
  return `${key}: ${value}`;
}

export default function AdminSeniors() {
  const [seniors, setSeniors] = useState<Senior[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const smsFilter = searchParams.get("sms");
  const statusFilter = searchParams.get("status");
  const todayFilter = searchParams.get("today");

  const activeFilterKey = smsFilter ? "sms" : statusFilter ? "status" : todayFilter ? "today" : null;
  const activeFilterValue = smsFilter ?? statusFilter ?? todayFilter ?? null;

  useEffect(() => {
    loadSeniors();
  }, []);

  async function loadSeniors(isManual = false) {
    if (isManual) setRefreshing(true);
    try {
      const today = new Date().toISOString().split("T")[0];

      // Get admin profile_ids to exclude
      const { data: adminProfiles } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("role", "admin");
      const adminProfileIds = (adminProfiles || []).map((p) => p.user_id);

      const [{ data: seniorData }, { data: ecCounts }, { data: todayCheckins }] =
        await Promise.all([
          supabase
            .from("seniors")
            .select("id, name, phone, check_in_time, paused, sms_consent_status, timezone, grace_period_minutes, order_number, created_at, profile_id")
            .order("created_at", { ascending: false }),
          supabase.from("emergency_contacts").select("senior_id"),
          supabase
            .from("check_ins")
            .select("senior_id, status")
            .eq("date", today),
        ]);

      const ecCountMap: Record<string, number> = {};
      (ecCounts || []).forEach((ec) => {
        ecCountMap[ec.senior_id] = (ecCountMap[ec.senior_id] || 0) + 1;
      });

      const checkinMap: Record<string, string> = {};
      (todayCheckins || []).forEach((ci) => {
        checkinMap[ci.senior_id] = ci.status;
      });

      setSeniors(
        (seniorData || [])
          .filter((s) => !adminProfileIds.includes(s.profile_id))
          .map((s) => ({
            ...s,
            ec_count: ecCountMap[s.id] || 0,
            today_status: checkinMap[s.id] || null,
          }))
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleDelete(profileId: string) {
    setDeletingId(profileId);
    const { error } = await supabase.rpc("admin_delete_user", {
      p_user_id: profileId,
    } as never);
    if (!error) {
      setSeniors((prev) => prev.filter((s) => s.profile_id !== profileId));
    }
    setDeletingId(null);
    setConfirmDeleteId(null);
  }

  const filtered = seniors.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (s.name || "").toLowerCase().includes(q) ||
      (s.phone || "").includes(search) ||
      (s.order_number || "").toLowerCase().includes(q);
    if (!matchesSearch) return false;

    if (smsFilter) {
      if (smsFilter === "none") return !s.sms_consent_status || s.sms_consent_status === "none";
      return s.sms_consent_status === smsFilter;
    }
    if (statusFilter === "paused") return s.paused;
    if (statusFilter === "active") return !s.paused;
    if (todayFilter) return s.today_status === todayFilter;

    return true;
  });

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">All Users</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {seniors.length} registered user{seniors.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadSeniors(true)}
          disabled={refreshing}
          className="h-8 w-8 p-0 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {activeFilterKey && activeFilterValue && (
          <Button
            variant="secondary"
            size="sm"
            className="h-9 gap-1.5 text-sm font-medium"
            onClick={() => setSearchParams({})}
          >
            {getFilterLabel(activeFilterKey, activeFilterValue)}
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground animate-pulse">
              Loading users...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {search || activeFilterKey ? "No matching users" : "No users registered yet"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Name</TableHead>
                    <TableHead className="font-bold">Order #</TableHead>
                    <TableHead className="font-bold">Phone</TableHead>
                    <TableHead className="font-bold">Check-In Time</TableHead>
                    <TableHead className="font-bold">SMS Status</TableHead>
                    <TableHead className="font-bold">Today</TableHead>
                    <TableHead className="font-bold text-center">ECs</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="w-10" />
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    confirmDeleteId === s.profile_id ? (
                      <TableRow key={s.id} className="bg-destructive/5">
                        <TableCell colSpan={8} className="py-3">
                          <span className="text-sm font-semibold text-foreground">
                            Delete <span className="text-destructive">{s.name}</span>? This cannot be undone.
                          </span>
                        </TableCell>
                        <TableCell colSpan={2} className="py-3">
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={deletingId === s.profile_id}
                              onClick={(e) => { e.stopPropagation(); handleDelete(s.profile_id); }}
                            >
                              {deletingId === s.profile_id ? "Deleting…" : "Delete"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                    <TableRow
                      key={s.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate(`/admin/users/${s.id}`)}
                    >
                      <TableCell className="font-semibold">
                        {s.name || "—"}
                      </TableCell>
                      <TableCell className="text-sm font-mono whitespace-nowrap">
                        {s.order_number || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground font-mono">
                        {s.phone || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {s.check_in_time
                          ? s.check_in_time.slice(0, 5)
                          : "Not set"}
                        {s.timezone && s.timezone !== "UTC" && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({s.timezone})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{consentBadge(s.sms_consent_status)}</TableCell>
                      <TableCell>{statusBadge(s.today_status)}</TableCell>
                      <TableCell className="text-center text-sm">
                        {s.ec_count}
                      </TableCell>
                      <TableCell>
                        {s.paused ? (
                          <Badge variant="outline" className="text-amber-600 border-amber-200">
                            Paused
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200 hover:bg-emerald-500/10">
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(s.profile_id); }}
                          aria-label={`Delete ${s.name}`}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                    )
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
