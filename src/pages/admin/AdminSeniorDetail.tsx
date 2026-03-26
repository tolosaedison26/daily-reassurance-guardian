import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Phone, Clock, Shield, User, RefreshCw } from "lucide-react";

interface SeniorInfo {
  id: string;
  name: string;
  phone: string | null;
  check_in_time: string | null;
  paused: boolean;
  sms_consent_status: string | null;
  timezone: string | null;
  grace_period_minutes: number | null;
  created_at: string;
}

interface EC {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  relationship: string | null;
  opted_out: boolean;
}

interface CheckIn {
  id: string;
  date: string;
  status: string;
  mood: string | null;
  sent_at: string | null;
  responded_at: string | null;
  reply_text: string | null;
}

interface Alert {
  id: string;
  contact_name: string | null;
  contact_phone: string | null;
  alerted_at: string | null;
  acknowledged_at: string | null;
}

export default function AdminSeniorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [senior, setSenior] = useState<SeniorInfo | null>(null);
  const [ecs, setEcs] = useState<EC[]>([]);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (id) loadData(id);
  }, [id]);

  async function loadData(seniorId: string, isManual = false) {
    if (isManual) setRefreshing(true);
    try {
      const [
        { data: seniorData },
        { data: ecData },
        { data: ciData },
        { data: alertData },
      ] = await Promise.all([
        supabase
          .from("seniors")
          .select("id, name, phone, check_in_time, paused, sms_consent_status, timezone, grace_period_minutes, created_at")
          .eq("id", seniorId)
          .maybeSingle(),
        supabase
          .from("emergency_contacts")
          .select("id, name, phone, email, relationship, opted_out")
          .eq("senior_id", seniorId)
          .order("name"),
        supabase
          .from("check_ins")
          .select("id, date, status, mood, sent_at, responded_at, reply_text")
          .eq("senior_id", seniorId)
          .order("date", { ascending: false })
          .limit(30),
        supabase
          .from("alerts")
          .select("id, contact_name, contact_phone, alerted_at, acknowledged_at")
          .eq("senior_id", seniorId)
          .order("alerted_at", { ascending: false })
          .limit(10),
      ]);

      setSenior(seniorData as SeniorInfo | null);
      setEcs(ecData || []);
      setCheckins(ciData || []);
      setAlerts(alertData || []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 animate-pulse space-y-4">
        <div className="h-6 w-32 bg-muted rounded" />
        <div className="h-40 bg-muted rounded-xl" />
      </div>
    );
  }

  if (!senior) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Senior not found.</p>
        <Button
          variant="ghost"
          onClick={() => navigate("/admin/seniors")}
          className="mt-4 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </div>
    );
  }

  const infoItems = [
    { icon: User, label: "Name", value: senior.name || "—" },
    { icon: Phone, label: "Phone", value: senior.phone || "—" },
    {
      icon: Clock,
      label: "Check-In Time",
      value: senior.check_in_time
        ? `${senior.check_in_time.slice(0, 5)} ${senior.timezone || "UTC"}`
        : "Not set",
    },
    {
      icon: Shield,
      label: "SMS Consent",
      value: senior.sms_consent_status || "none",
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/seniors")}
            className="cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight truncate">{senior.name}</h1>
            <div className="flex items-center gap-2 mt-1">
            {senior.paused ? (
              <Badge className="bg-amber-500/10 text-amber-700 border-amber-200 hover:bg-amber-500/10">
                Paused
              </Badge>
            ) : (
              <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200 hover:bg-emerald-500/10">
                Active
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              Joined {new Date(senior.created_at).toLocaleDateString()}
            </span>
          </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => id && loadData(id, true)}
          disabled={refreshing}
          className="h-8 w-8 p-0 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Senior info cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {infoItems.map((item) => (
          <Card key={item.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <item.icon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">
                  {item.label}
                </span>
              </div>
              <p className="text-sm font-bold truncate">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Emergency Contacts */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold">
            Emergency Contacts ({ecs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ecs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No emergency contacts
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Name</TableHead>
                    <TableHead className="font-bold">Phone</TableHead>
                    <TableHead className="font-bold">Relationship</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ecs.map((ec) => (
                    <TableRow key={ec.id}>
                      <TableCell className="font-semibold">{ec.name}</TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {ec.phone || "—"}
                      </TableCell>
                      <TableCell className="capitalize text-sm">
                        {ec.relationship || "—"}
                      </TableCell>
                      <TableCell>
                        {ec.opted_out ? (
                          <Badge className="bg-red-500/10 text-red-700 border-red-200 hover:bg-red-500/10">
                            Opted Out
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200 hover:bg-emerald-500/10">
                            Active
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Check-In History */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold">
            Check-In History (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {checkins.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No check-in history
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Date</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="font-bold">Mood</TableHead>
                    <TableHead className="font-bold">Sent</TableHead>
                    <TableHead className="font-bold">Responded</TableHead>
                    <TableHead className="font-bold">Reply</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checkins.map((ci) => (
                    <TableRow key={ci.id}>
                      <TableCell className="text-sm font-medium">
                        {new Date(ci.date + "T00:00:00").toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" }
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            ci.status === "SAFE"
                              ? "bg-emerald-500/10 text-emerald-700 border-emerald-200 hover:bg-emerald-500/10"
                              : ci.status === "MISSED"
                              ? "bg-red-500/10 text-red-700 border-red-200 hover:bg-red-500/10"
                              : ci.status === "PENDING"
                              ? "bg-amber-500/10 text-amber-700 border-amber-200 hover:bg-amber-500/10"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {ci.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm capitalize">
                        {ci.mood || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {ci.sent_at
                          ? new Date(ci.sent_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {ci.responded_at
                          ? new Date(ci.responded_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm max-w-[120px] truncate">
                        {ci.reply_text || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert History */}
      {alerts.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">
              Alert History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Contact</TableHead>
                    <TableHead className="font-bold">Phone</TableHead>
                    <TableHead className="font-bold">Alerted</TableHead>
                    <TableHead className="font-bold">Acknowledged</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-semibold">
                        {a.contact_name || "—"}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {a.contact_phone || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {a.alerted_at
                          ? new Date(a.alerted_at).toLocaleString()
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {a.acknowledged_at
                          ? new Date(a.acknowledged_at).toLocaleString()
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
