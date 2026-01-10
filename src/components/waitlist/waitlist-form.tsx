"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface WaitlistFormProps {
  onSuccess?: () => void;
  showName?: boolean;
  variant?: "default" | "compact";
}

export function WaitlistForm({
  variant = "default",
}: WaitlistFormProps) {
  const router = useRouter();

  if (variant === "compact") {
    return (
      <div className="w-full">
        <Button
          type="button"
          variant="gold"
          size="xl"
          onClick={() => router.push("/apply")}
          className="w-full gap-2 sm:w-auto"
        >
          Get Early Access
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <Button
        type="button"
        variant="gold"
        size="xl"
        onClick={() => router.push("/apply")}
        className="w-full gap-2"
      >
        Get Early Access
        <ArrowRight className="h-4 w-4" />
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Complete your application to join the early access program
      </p>
    </div>
  );
}
