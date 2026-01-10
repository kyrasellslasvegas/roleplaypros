import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthCodeErrorPage() {
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
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>

        {/* Content */}
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">
          Authentication Error
        </h1>
        <p className="text-muted-foreground mb-8">
          The magic link you clicked may have expired or already been used.
          Please try signing in again.
        </p>

        {/* Tips */}
        <div className="bg-muted/50 rounded-lg p-4 text-left mb-8">
          <p className="text-sm font-medium text-foreground mb-2">
            This can happen if:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• The link has expired (links are valid for 1 hour)</li>
            <li>• The link was already used to sign in</li>
            <li>• The link was opened in a different browser</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button asChild variant="gold" className="w-full">
            <Link href="/login">Try signing in again</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/signup">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Create new account
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
