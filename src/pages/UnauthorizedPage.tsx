import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldX } from "lucide-react";

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-4">
      <div className="w-16 h-16 rounded-full flex items-center justify-center bg-destructive/10">
        <ShieldX className="w-8 h-8 text-destructive" />
      </div>
      <h1 className="text-2xl font-black">Access Denied</h1>
      <p className="text-muted-foreground text-sm text-center max-w-[280px]">
        You don't have permission to view this page.
      </p>
      <Button onClick={() => navigate("/dashboard")} className="rounded-xl font-bold">
        Go to Dashboard
      </Button>
    </div>
  );
}
