"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, Sparkles, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  fullName: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  plan: z.enum(["free", "pro"], {
    message: "Please select a plan.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

const plans = [
  {
    id: "free" as const,
    name: "Free Trial",
    price: "$0",
    period: "7 days",
    description: "Try all features free for 7 days",
    features: [
      "3 AI roleplay sessions",
      "Basic performance feedback",
      "Access to daily drills",
      "Email support",
    ],
    icon: Sparkles,
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: "$49",
    period: "/month",
    description: "Everything you need to master sales",
    features: [
      "Unlimited AI roleplay sessions",
      "Advanced analytics & insights",
      "Real-time AI coaching",
      "Custom buyer personas",
      "Priority support",
    ],
    icon: Crown,
    popular: true,
  },
];

interface SignupFormProps {
  onSuccess?: () => void;
}

export function SignupForm({ onSuccess }: SignupFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const defaultPlan = searchParams.get("plan") as "free" | "pro" | null;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      fullName: "",
      plan: defaultPlan || "free",
    },
  });

  const selectedPlan = form.watch("plan");

  async function onSubmit(values: FormValues) {
    setIsLoading(true);

    try {
      const supabase = createClient();

      // Send magic link with metadata for plan selection
      const { error } = await supabase.auth.signInWithOtp({
        email: values.email,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback?plan=${values.plan}&next=/dashboard`,
          data: {
            full_name: values.fullName,
            subscription_tier: values.plan,
          },
        },
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error sending magic link",
          description: error.message,
        });
        return;
      }

      toast({
        title: "Check your email!",
        description: "We've sent you a magic link to sign in.",
      });

      onSuccess?.();
      router.push("/check-email");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Plan Selection */}
        <FormField
          control={form.control}
          name="plan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Choose your plan</FormLabel>
              <FormControl>
                <div className="grid gap-4 sm:grid-cols-2">
                  {plans.map((plan) => {
                    const Icon = plan.icon;
                    const isSelected = field.value === plan.id;
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => field.onChange(plan.id)}
                        className={cn(
                          "relative flex flex-col rounded-lg border-2 p-4 text-left transition-all hover:border-gold-500/50",
                          isSelected
                            ? "border-gold-500 bg-gold-500/5"
                            : "border-border bg-background"
                        )}
                      >
                        {plan.popular && (
                          <span className="absolute -top-2.5 right-3 rounded-full bg-gold-500 px-2 py-0.5 text-xs font-semibold text-obsidian-950">
                            Popular
                          </span>
                        )}
                        <div className="flex items-center gap-2">
                          <Icon
                            className={cn(
                              "h-5 w-5",
                              isSelected ? "text-gold-500" : "text-muted-foreground"
                            )}
                          />
                          <span className="font-semibold">{plan.name}</span>
                        </div>
                        <div className="mt-2">
                          <span className="text-2xl font-bold">{plan.price}</span>
                          <span className="text-sm text-muted-foreground">
                            {plan.period}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {plan.description}
                        </p>
                        <ul className="mt-3 space-y-1">
                          {plan.features.slice(0, 3).map((feature) => (
                            <li
                              key={feature}
                              className="flex items-center gap-1.5 text-xs text-muted-foreground"
                            >
                              <Check className="h-3 w-3 text-gold-500" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        {isSelected && (
                          <div className="absolute right-3 top-3">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gold-500">
                              <Check className="h-3 w-3 text-obsidian-950" />
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Name Field */}
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="John Smith"
                  autoCapitalize="words"
                  autoComplete="name"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email Field */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="agent@example.com"
                  type="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          variant="gold"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {selectedPlan === "pro" ? "Start Pro Trial" : "Start Free Trial"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          By signing up, you agree to our{" "}
          <a href="/terms" className="underline hover:text-foreground">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </a>
        </p>
      </form>
    </Form>
  );
}
