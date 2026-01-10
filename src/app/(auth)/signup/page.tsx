import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function SignupPage() {
  // Check if user is already logged in
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-lg lg:w-[480px]">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary flex items-center justify-center">
              <span className="font-display text-xl font-bold text-primary-foreground">
                R
              </span>
            </div>
            <span className="font-display text-2xl font-semibold">
              <span className="text-primary font-semibold">Roleplay</span>
              <span className="text-foreground">Pro</span>
            </span>
          </div>

          <h2 className="mt-8 font-display text-2xl font-bold text-foreground">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Start mastering real estate sales with AI-powered training.
            No password needed — we&apos;ll send you a magic link.
          </p>

          <div className="mt-8">
            <Suspense fallback={<div>Loading...</div>}>
              <SignupFormWrapper />
            </Suspense>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-primary hover:text-gold-400"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Background */}
      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-muted via-background to-background">
          {/* Decorative elements */}
          <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />

          {/* Content */}
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <div className="max-w-lg text-center">
              <h3 className="font-display text-3xl font-bold text-white mb-6">
                Join 10,000+ agents closing more deals
              </h3>
              <div className="grid grid-cols-3 gap-8 mb-8">
                <div>
                  <div className="text-3xl font-bold text-primary">40%</div>
                  <div className="text-sm text-white/60">More closes</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">2x</div>
                  <div className="text-sm text-white/60">Faster training</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">24/7</div>
                  <div className="text-sm text-white/60">AI coaching</div>
                </div>
              </div>
              <blockquote className="font-display text-xl font-medium text-white/90">
                &quot;I practiced objection handling for 30 minutes and closed
                a deal the next day that I would have lost before.&quot;
              </blockquote>
              <div className="mt-6">
                <div className="flex justify-center">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg
                      key={i}
                      className="h-5 w-5 text-primary"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="mt-4 font-medium text-white">Marcus Johnson</p>
                <p className="text-sm text-white/60">
                  Luxury Home Specialist, Miami
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SignupFormWrapper() {
  return <SignupForm />;
}
