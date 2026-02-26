import { Shield } from "lucide-react";

export default function LandingFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-lg font-black text-primary">Daily Guardian</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Peace of mind for families. Independence for seniors.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-black text-sm text-foreground mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a></li>
              <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
              <li><a href="#organizations" className="hover:text-foreground transition-colors">For Organizations</a></li>
              <li className="text-muted-foreground/50">Download App (coming soon)</li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-black text-sm text-foreground mb-3">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Help Center</li>
              <li>Contact Us</li>
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
              <li>HIPAA Compliance</li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-black text-sm text-foreground mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>About Us</li>
              <li>Blog</li>
              <li>Careers</li>
              <li>Press</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
          <span>© {new Date().getFullYear()} Daily Guardian. All rights reserved.</span>
          <span>Made with ❤️ for families everywhere</span>
        </div>
      </div>
    </footer>
  );
}
