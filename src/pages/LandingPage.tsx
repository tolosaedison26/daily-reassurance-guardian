import LandingNav from "@/components/landing/LandingNav";
import LandingHero from "@/components/landing/LandingHero";
import LandingSocialProof from "@/components/landing/LandingSocialProof";
import LandingHowItWorks from "@/components/landing/LandingHowItWorks";
import LandingFeatures from "@/components/landing/LandingFeatures";
import LandingTestimonials from "@/components/landing/LandingTestimonials";
import LandingPricing from "@/components/landing/LandingPricing";
import LandingOrganizations from "@/components/landing/LandingOrganizations";
import LandingFAQ from "@/components/landing/LandingFAQ";
import LandingFinalCTA from "@/components/landing/LandingFinalCTA";
import LandingFooter from "@/components/landing/LandingFooter";

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn?: () => void;
}

export default function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  const handleSignIn = onSignIn || onGetStarted;

  return (
    <div className="min-h-screen bg-background">
      <LandingNav onGetStarted={onGetStarted} onSignIn={handleSignIn} />
      <LandingHero onGetStarted={onGetStarted} />
      <LandingSocialProof />
      <LandingHowItWorks />
      <LandingFeatures />
      <LandingTestimonials />
      <LandingPricing onGetStarted={onGetStarted} />
      <LandingOrganizations onGetStarted={onGetStarted} />
      <LandingFAQ />
      <LandingFinalCTA onGetStarted={onGetStarted} />
      <LandingFooter />
    </div>
  );
}
