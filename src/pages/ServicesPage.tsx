import { useState } from "react";
import { Car, ShoppingCart, MapPin, ArrowRight, ExternalLink, Loader2, Navigation, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  buildUberDeepLink,
  buildSimpleUberLink,
  getCurrentPosition,
  geocodeNearby,
} from "@/lib/uber";

type RideTab = "quick" | "custom";

const QUICK_DESTINATIONS = [
  { label: "Hospital / Clinic", search: "hospital", icon: "🏥", desc: "Nearest hospital or clinic" },
  { label: "Pharmacy", search: "pharmacy", icon: "💊", desc: "Nearest pharmacy" },
  { label: "Grocery Store", search: "grocery store", icon: "🛒", desc: "Nearest grocery store" },
  { label: "Church", search: "church", icon: "⛪", desc: "Nearest church" },
  { label: "Bank", search: "bank", icon: "🏦", desc: "Nearest bank" },
  { label: "Post Office", search: "post office", icon: "📬", desc: "Nearest post office" },
];

export default function ServicesPage() {
  const [rideTab, setRideTab] = useState<RideTab>("quick");
  const [customAddress, setCustomAddress] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleBookRide = async (searchQuery: string, displayName: string) => {
    if (!searchQuery.trim()) {
      window.open(buildSimpleUberLink(), "_blank", "noopener,noreferrer");
      return;
    }

    setLoading(true);

    try {
      const position = await getCurrentPosition();
      const result = await geocodeNearby(searchQuery, position.lat, position.lng);

      if (result) {
        const url = buildUberDeepLink({
          pickupLat: position.lat,
          pickupLng: position.lng,
          pickupName: "Current Location",
          dropoffLat: result.lat,
          dropoffLng: result.lng,
          dropoffName: displayName,
          dropoffAddress: result.displayName,
        });
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        toast({
          title: "Location not found",
          description: "Could not find that destination. Try a more specific address.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.warn("Geolocation failed:", err);
      window.open(buildSimpleUberLink(), "_blank", "noopener,noreferrer");
      toast({
        title: "Location access needed",
        description: "Allow location access to auto-fill your destination in Uber.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRide = (preset: typeof QUICK_DESTINATIONS[number]) => {
    setSelectedPreset(preset.label);
    handleBookRide(preset.search, preset.label);
  };

  const handleCustomRide = () => {
    handleBookRide(customAddress.trim(), customAddress.trim());
  };

  return (
    <div className="flex flex-col bg-background max-w-3xl mx-auto w-full">
      <div className="flex-1 flex flex-col px-4 sm:px-5 pt-4 sm:pt-6 pb-6 gap-5">
        {/* Page header */}
        <div>
          <h1 className="font-black text-foreground" style={{ fontSize: "28px", lineHeight: "36px" }}>
            Services
          </h1>
          <p className="text-muted-foreground mt-1" style={{ fontSize: "16px" }}>
            Book rides and order essentials from one place.
          </p>
        </div>

        {/* Uber Ride Section */}
        <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
          {/* Header */}
          <div className="p-4 pb-3 flex items-center gap-3">
            <div
              className="w-12 h-12 min-w-[48px] rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "#000" }}
            >
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold" style={{ fontSize: "18px" }}>Book a Ride</p>
              <p className="text-muted-foreground" style={{ fontSize: "14px" }}>
                Powered by Uber
              </p>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="px-4 pb-3">
            <div className="flex rounded-xl overflow-hidden border border-border" style={{ background: "hsl(var(--muted))" }}>
              <button
                onClick={() => setRideTab("quick")}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold transition-all"
                style={{
                  background: rideTab === "quick" ? "hsl(var(--card))" : "transparent",
                  color: rideTab === "quick" ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                  boxShadow: rideTab === "quick" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  borderRadius: "0.65rem",
                  margin: "3px",
                }}
              >
                <Navigation className="w-4 h-4" />
                Quick Ride
              </button>
              <button
                onClick={() => setRideTab("custom")}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold transition-all"
                style={{
                  background: rideTab === "custom" ? "hsl(var(--card))" : "transparent",
                  color: rideTab === "custom" ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                  boxShadow: rideTab === "custom" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  borderRadius: "0.65rem",
                  margin: "3px",
                }}
              >
                <PenLine className="w-4 h-4" />
                Custom Address
              </button>
            </div>
          </div>

          {/* Tab content */}
          <div className="px-4 pb-4">
            {rideTab === "quick" ? (
              /* ── Quick Ride tab ── */
              <div className="space-y-2">
                <p className="text-muted-foreground mb-3" style={{ fontSize: "14px" }}>
                  Tap a destination below. We'll find the nearest one and open Uber for you.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {QUICK_DESTINATIONS.map((dest) => (
                    <button
                      key={dest.label}
                      onClick={() => handleQuickRide(dest)}
                      disabled={loading}
                      className="flex items-center gap-3 p-3 rounded-xl border transition-all text-left"
                      style={{
                        borderColor: loading && selectedPreset === dest.label
                          ? "hsl(var(--primary))"
                          : "hsl(var(--border))",
                        background: loading && selectedPreset === dest.label
                          ? "hsl(var(--primary) / 0.06)"
                          : "transparent",
                        opacity: loading && selectedPreset !== dest.label ? 0.5 : 1,
                      }}
                    >
                      <span style={{ fontSize: "28px", lineHeight: 1 }}>{dest.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm">{dest.label}</p>
                        <p className="text-muted-foreground text-xs truncate">{dest.desc}</p>
                      </div>
                      {loading && selectedPreset === dest.label ? (
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: "hsl(var(--primary))" }} />
                      ) : (
                        <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                    </button>
                  ))}
                </div>

                <p className="text-center text-muted-foreground pt-1" style={{ fontSize: "12px" }}>
                  Uses your current location as pickup
                </p>
              </div>
            ) : (
              /* ── Custom Address tab ── */
              <div className="space-y-3">
                <p className="text-muted-foreground mb-1" style={{ fontSize: "14px" }}>
                  Enter an address, place name, or landmark and we'll set it as your Uber destination.
                </p>

                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="e.g. 123 Main St or Central Park"
                    value={customAddress}
                    onChange={(e) => setCustomAddress(e.target.value)}
                    disabled={loading}
                    className="pl-11 h-14 rounded-xl text-base"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && customAddress.trim()) handleCustomRide();
                    }}
                  />
                </div>

                <Button
                  onClick={handleCustomRide}
                  disabled={loading || !customAddress.trim()}
                  className="w-full rounded-xl font-bold h-12 text-base gap-2"
                  style={{ background: "#000", color: "#fff" }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Finding location...
                    </>
                  ) : (
                    <>
                      Open Uber
                      <ExternalLink className="w-4 h-4" />
                    </>
                  )}
                </Button>

                <p className="text-center text-muted-foreground" style={{ fontSize: "12px" }}>
                  Uses your current location as pickup. You'll confirm everything in Uber.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Instacart Groceries Section */}
        <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
          <div className="p-4 flex items-center gap-3">
            <div
              className="w-12 h-12 min-w-[48px] rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "#43B02A" }}
            >
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold" style={{ fontSize: "18px" }}>Order Groceries</p>
              <p className="text-muted-foreground" style={{ fontSize: "14px" }}>
                Powered by Instacart
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
          </div>

          <div className="px-4 pb-4">
            <div
              className="rounded-xl p-4 text-center"
              style={{ background: "hsl(var(--muted))" }}
            >
              <p className="text-muted-foreground font-semibold" style={{ fontSize: "14px" }}>
                Coming Soon
              </p>
              <p className="text-muted-foreground mt-1" style={{ fontSize: "13px" }}>
                Order groceries and essentials for delivery right to your door.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
