"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, User, Building2, Award, X } from "lucide-react";
import { US_STATES, getStateName } from "@/lib/constants/us-states";
import { Badge } from "@/components/ui/badge";
import { agentApplicationSchema, type AgentApplicationFormData } from "./schema";

export function AgentApplicationForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<AgentApplicationFormData>({
    resolver: zodResolver(agentApplicationSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      brokerageName: "",
      brokerageAddress: "",
      brokeragePhone: "",
      isActiveAgent: true,
      licensedStates: [],
      licenseNumbers: {},
      yearsOfExperience: 0,
    },
  });

  const licensedStates = form.watch("licensedStates");

  function handleStateAdd(stateCode: string) {
    const currentStates = form.getValues("licensedStates");
    if (!currentStates.includes(stateCode)) {
      const newStates = [...currentStates, stateCode];
      form.setValue("licensedStates", newStates, { shouldValidate: true });
    }
  }

  function handleStateRemove(stateCode: string) {
    const currentStates = form.getValues("licensedStates");
    const newStates = currentStates.filter((s) => s !== stateCode);
    form.setValue("licensedStates", newStates, { shouldValidate: true });

    const currentLicenses = form.getValues("licenseNumbers");
    const { [stateCode]: _, ...remainingLicenses } = currentLicenses;
    form.setValue("licenseNumbers", remainingLicenses);
  }

  async function onSubmit(data: AgentApplicationFormData) {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/applications/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.code === "DUPLICATE_EMAIL") {
          setError("An application with this email already exists. Please check your email for updates.");
        } else {
          throw new Error(result.error || "Something went wrong");
        }
        return;
      }

      router.push("/apply/confirmation");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Section 1: Personal Information */}
        <Card className="border-primary/20 bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <User className="h-5 w-5 text-primary" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John Smith"
                      className="border-primary/30 bg-muted/50 focus:border-primary"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        className="border-primary/30 bg-muted/50 focus:border-primary"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="(702) 555-1234"
                        className="border-primary/30 bg-muted/50 focus:border-primary"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      We&apos;ll send you a text when your account is approved
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Brokerage Information */}
        <Card className="border-primary/20 bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Building2 className="h-5 w-5 text-primary" />
              Brokerage Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="brokerageName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brokerage Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Premier Realty Group"
                      className="border-primary/30 bg-muted/50 focus:border-primary"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="brokerageAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brokerage Address</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="123 Main Street, Suite 100&#10;Las Vegas, NV 89101"
                      className="min-h-[80px] border-primary/30 bg-muted/50 focus:border-primary"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="brokeragePhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brokerage Phone</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="(702) 555-5678"
                      className="border-primary/30 bg-muted/50 focus:border-primary"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Section 3: License Information */}
        <Card className="border-primary/20 bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Award className="h-5 w-5 text-primary" />
              License Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="isActiveAgent"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-primary/20 p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>I am an active licensed real estate agent</FormLabel>
                    <FormDescription>
                      Check this if your license is currently active and in good standing
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="licensedStates"
              render={() => (
                <FormItem>
                  <FormLabel>Licensed States</FormLabel>
                  <Select onValueChange={handleStateAdd}>
                    <FormControl>
                      <SelectTrigger className="border-primary/30 bg-muted/50 focus:border-primary">
                        <SelectValue placeholder="Select states where you're licensed" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {US_STATES.filter((s) => !licensedStates.includes(s.code)).map(
                        (state) => (
                          <SelectItem key={state.code} value={state.code}>
                            {state.name} ({state.code})
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  {licensedStates.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {licensedStates.map((code) => (
                        <Badge
                          key={code}
                          variant="secondary"
                          className="gap-1 bg-gold-500/20 text-primary hover:bg-gold-500/30"
                        >
                          {getStateName(code)}
                          <button
                            type="button"
                            onClick={() => handleStateRemove(code)}
                            className="ml-1 rounded-full hover:bg-primary/20"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {licensedStates.length > 0 && (
              <div className="space-y-3">
                <FormLabel>License Numbers</FormLabel>
                <FormDescription>
                  Enter your license number for each state
                </FormDescription>
                {licensedStates.map((stateCode) => (
                  <FormField
                    key={stateCode}
                    control={form.control}
                    name={`licenseNumbers.${stateCode}`}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-3">
                          <span className="w-20 text-sm font-medium text-muted-foreground">
                            {stateCode}:
                          </span>
                          <FormControl>
                            <Input
                              placeholder={`${stateCode} License Number`}
                              className="flex-1 border-primary/30 bg-muted/50 focus:border-primary"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            )}

            <FormField
              control={form.control}
              name="yearsOfExperience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Years of Experience</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="50"
                      placeholder="5"
                      className="w-32 border-primary/30 bg-muted/50 focus:border-primary"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    How many years have you been a licensed real estate agent?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button
          type="submit"
          variant="gold"
          size="xl"
          disabled={isSubmitting}
          className="w-full gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting Application...
            </>
          ) : (
            "Submit Application"
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          By submitting this application, you agree to our Terms of Service and Privacy Policy.
          Your license information will be verified within 1 hour during business hours.
        </p>
      </form>
    </Form>
  );
}
