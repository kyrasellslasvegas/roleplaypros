import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary flex items-center justify-center">
              <span className="font-display text-xl font-bold text-primary-foreground">
                R
              </span>
            </div>
            <span className="font-display text-2xl font-semibold">
              <span className="text-primary font-semibold">Roleplay</span>
              <span className="text-foreground"> Pros</span>
            </span>
          </div>

          <h2 className="mt-8 font-display text-2xl font-bold text-foreground">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email and we&apos;ll send you a magic link to access
            your training dashboard.
          </p>

          <div className="mt-8">
            <Suspense fallback={<div>Loading...</div>}>
              <LoginForm />
            </Suspense>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-primary hover:text-gold-400"
            >
              Sign up free
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Background */}
      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          {/* Decorative elements */}
          <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

          {/* Content */}
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <div className="max-w-lg text-center">
              <blockquote className="font-display text-2xl font-medium text-white/90">
                &quot;Roleplay Pros transformed my sales approach. I closed 40%
                more deals in my first month.&quot;
              </blockquote>
              <div className="mt-8">
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
                <p className="mt-4 font-medium text-white">Sarah Mitchell</p>
                <p className="text-sm text-white/70">
                  Top Producer, Las Vegas Realty
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
