import { Shield } from "lucide-react";
import { Link } from "react-router-dom";

export default function LandingFooter() {
  return (
    <footer className="border-t border-border/40 bg-card">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-primary" />
              <span className="font-black text-foreground">Daily Guardian</span>
            </div>
            <p className="text-sm text-muted-foreground" style={{ lineHeight: "1.6" }}>
              Daily safety check-ins. Peace of mind for you and your loved ones.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Product</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li><a href="#how-it-works" className="hover:text-foreground transition-colors cursor-pointer py-2 inline-block">How It Works</a></li>
              <li><a href="#features" className="hover:text-foreground transition-colors cursor-pointer py-2 inline-block">Features</a></li>
              <li><a href="#pricing" className="hover:text-foreground transition-colors cursor-pointer py-2 inline-block">Pricing</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Company</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li><Link to="/contact" className="hover:text-foreground transition-colors cursor-pointer py-2 inline-block">Contact Us</Link></li>
              <li><Link to="/privacy" className="hover:text-foreground transition-colors cursor-pointer py-2 inline-block">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-foreground transition-colors cursor-pointer py-2 inline-block">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-border/40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
          <span>&copy; {new Date().getFullYear()} Daily Guardian. All rights reserved.</span>
          <span>Made with care for people everywhere</span>
        </div>
      </div>
    </footer>
  );
}
