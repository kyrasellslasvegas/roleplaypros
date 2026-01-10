import { Metadata } from "next";
import {
  WaitlistHero,
  IncentivesSection,
  FeaturesPreview,
  TestimonialsSection,
  FAQSection,
  FinalCTA,
} from "@/components/waitlist";

export const metadata: Metadata = {
  title: "Join the Waitlist | RoleplayPro - AI Sales Training for Real Estate",
  description:
    "Be among the first to experience RoleplayPro. Get 7 days early access, 30% lifetime discount, and exclusive buyer personas. Join 1,200+ Nevada agents on the waitlist.",
  openGraph: {
    title: "Join the Waitlist | RoleplayPro",
    description:
      "The future of real estate training launches January 16, 2026. Get early access and exclusive founding member benefits.",
    type: "website",
  },
};

export default function WaitlistPage() {
  return (
    <div className="relative">
      {/* Hero with countdown and signup */}
      <WaitlistHero />

      {/* Founding member benefits */}
      <IncentivesSection />

      {/* Features preview */}
      <FeaturesPreview />

      {/* Social proof */}
      <TestimonialsSection />

      {/* Common questions */}
      <FAQSection />

      {/* Final CTA */}
      <FinalCTA />
    </div>
  );
}
