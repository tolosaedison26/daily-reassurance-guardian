import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw } from "lucide-react";

interface EC {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  relationship: string | null;
  opted_out: boolean;
  notify_via_sms: boolean;
  notify_via_email: boolean;
  senior_name: string;
  senior_id: string;
}

export default function AdminEmergencyContacts() {
  const [contacts, setContacts] = useState<EC[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchParams] = useSearchParams();

  const urlFilter = searchParams.get("filter");
  const validFilter = (urlFilter === "active" || urlFilter === "opted_out") ? urlFilter : "all";

  // manualFilter = null means "follow URL param"; non-null = user chose via dropdown
  const [manualFilter, setManualFilter] = useState<"all" | "active" | "opted_out" | null>(null);

  // Reset manual override whenever the URL param changes (e.g. clicking a different Overview card)
  useEffect(() => {
    setManualFilter(null);
  }, [urlFilter]);

  const filter = manualFilter ?? validFilter;

  const loadContacts = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const { data: ecData } = await supabase
        .from("emergency_contacts")
        .select("id, name, phone, email, relationship, opted_out, notify_via_sms, notify_via_email, senior_id")
        .order("name");

      const seniorIds = [...new Set((ecData || []).map((ec) => ec.senior_id))];
      let seniorNames: Record<string, string> = {};
      if (seniorIds.length > 0) {
        const { data: sNames } = await supabase
          .from("seniors")
          .select("id, name")
          .in("id", seniorIds);
        (sNames || []).forEach((s) => {
          seniorNames[s.id] = s.name || "Unknown";
        });
      }

      setContacts(
        (ecData || []).map((ec) => ({
          ...ec,
          senior_name: seniorNames[ec.senior_id] || "Unknown",
        }))
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const filtered = contacts.filter((ec) => {
    const matchesSearch =
      (ec.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (ec.phone || "").includes(search) ||
      (ec.senior_name || "").toLowerCase().includes(search.toLowerCase());

    if (filter === "active") return matchesSearch && !ec.opted_out;
    if (filter === "opted_out") return matchesSearch && ec.opted_out;
    return matchesSearch;
  });

  const activeCount = contacts.filter((ec) => !ec.opted_out).length;
  const optedOutCount = contacts.filter((ec) => ec.opted_out).length;

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">
            Emergency Contacts
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {activeCount} active, {optedOutCount} opted out of{" "}
            {contacts.length} total
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadContacts(true)}
          disabled={refreshing}
          className="h-8 w-8 p-0 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or senior..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={filter}
          onValueChange={(v) => setManualFilter(v as "all" | "active" | "opted_out")}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ({contacts.length})</SelectItem>
            <SelectItem value="active">Active ({activeCount})</SelectItem>
            <SelectItem value="opted_out">
              Opted Out ({optedOutCount})
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground animate-pulse">
              Loading contacts...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {search || filter !== "all"
                ? "No matching contacts"
                : "No emergency contacts yet"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Contact Name</TableHead>
                    <TableHead className="font-bold">Phone</TableHead>
                    <TableHead className="font-bold">Email</TableHead>
                    <TableHead className="font-bold">Relationship</TableHead>
                    <TableHead className="font-bold">Senior</TableHead>
                    <TableHead className="font-bold">Notify Via</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((ec) => (
                    <TableRow key={ec.id}>
                      <TableCell className="font-semibold">
                        {ec.name || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground font-mono">
                        {ec.phone || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {ec.email || "—"}
                      </TableCell>
                      <TableCell className="text-sm capitalize">
                        {ec.relationship || "—"}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {ec.senior_name}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {ec.notify_via_sms && (
                            <Badge variant="outline" className="text-xs">
                              SMS
                            </Badge>
                          )}
                          {ec.notify_via_email && (
                            <Badge variant="outline" className="text-xs">
                              Email
                            </Badge>
                          )}
                          {!ec.notify_via_sms && !ec.notify_via_email && (
                            <span className="text-xs text-muted-foreground">
                              None
                            </span>
                          )}
                        </div>
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
    </div>
  );
}
