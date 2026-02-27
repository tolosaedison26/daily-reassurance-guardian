import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-5">
      <span className="text-6xl mb-4">🔍</span>
      <h1 className="text-4xl font-black mb-2">404</h1>
      <p className="text-lg text-muted-foreground mb-6 text-center max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Button onClick={() => navigate("/")} className="rounded-xl font-bold">
        Return Home
      </Button>
    </div>
  );
};

export default NotFound;
