import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
            <span className="font-display text-xl font-bold text-obsidian-950">
              R
            </span>
          </div>
          <span className="font-display text-2xl font-semibold">
            <span className="text-gradient-gold">Roleplay</span>
            <span className="text-foreground">Pro</span>
          </span>
        </div>

        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-gold-500/10 flex items-center justify-center mb-6">
          <Mail className="w-8 h-8 text-gold-500" />
        </div>

        {/* Content */}
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">
          Check your email
        </h1>
        <p className="text-muted-foreground mb-8">
          We&apos;ve sent you a magic link to sign in. Click the link in your
          email to access your dashboard.
        </p>

        {/* Tips */}
        <div className="bg-muted/50 rounded-lg p-4 text-left mb-8">
          <p className="text-sm font-medium text-foreground mb-2">
            Didn&apos;t receive the email?
          </p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Check your spam or junk folder</li>
            <li>• Make sure you entered the correct email</li>
            <li>• Wait a few minutes and try again</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button asChild variant="outline" className="w-full">
            <Link href="/signup">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to sign up
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-gold-500 hover:text-gold-400"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
