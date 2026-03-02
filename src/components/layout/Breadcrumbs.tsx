import { useLocation, Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  seniors: "Seniors",
  new: "Add Senior",
  edit: "Edit",
  contacts: "Contacts & Escalation",
  alert: "Alert Detail",
  reports: "Reports",
  settings: "Settings",
  notifications: "Notifications",
  billing: "Billing",
};

export default function Breadcrumbs() {
  const location = useLocation();
  const parts = location.pathname.split("/").filter(Boolean);

  // Don't show breadcrumbs on top-level routes
  if (parts.length <= 1) return null;

  const crumbs: { label: string; path: string }[] = [];

  for (let i = 0; i < parts.length; i++) {
    const segment = parts[i];
    const path = "/" + parts.slice(0, i + 1).join("/");

    // Skip UUID segments — use parent label context
    if (/^[0-9a-f-]{36}$/.test(segment)) {
      continue;
    }

    const label = ROUTE_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    crumbs.push({ label, path });
  }

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm mb-4">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.path} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
            {isLast ? (
              <span className="font-semibold text-foreground">{crumb.label}</span>
            ) : (
              <Link
                to={crumb.path}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
