"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ApplicationStatusBadge,
  ApproveDialog,
  RejectDialog,
} from "@/components/admin";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  User,
  Building2,
  Award,
  Calendar,
  Phone,
  Mail,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { getStateName } from "@/lib/constants/us-states";
import { formatDistanceToNow, format } from "date-fns";

interface Application {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  brokerage_name: string;
  brokerage_address: string;
  brokerage_phone: string;
  is_active_agent: boolean;
  licensed_states: string[];
  license_numbers: Record<string, string>;
  years_of_experience: number;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export default function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchApplication() {
      try {
        const response = await fetch(`/api/applications/${id}`);
        const data = await response.json();

        if (!response.ok) throw new Error(data.error);

        setApplication(data.application);
      } catch (error) {
        console.error("Failed to fetch application:", error);
        toast({
          title: "Error",
          description: "Failed to load application",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchApplication();
  }, [id, toast]);

  async function handleApprove() {
    try {
      const response = await fetch(`/api/applications/${id}/approve`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      toast({
        title: "Application Approved",
        description: "The applicant has been notified via email and SMS.",
      });

      router.push("/admin/applications");
    } catch (error) {
      console.error("Failed to approve:", error);
      toast({
        title: "Error",
        description: "Failed to approve application",
        variant: "destructive",
      });
      throw error;
    }
  }

  async function handleReject(reason: string) {
    try {
      const response = await fetch(`/api/applications/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      toast({
        title: "Application Rejected",
        description: "The application has been rejected.",
      });

      router.push("/admin/applications");
    } catch (error) {
      console.error("Failed to reject:", error);
      toast({
        title: "Error",
        description: "Failed to reject application",
        variant: "destructive",
      });
      throw error;
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">Application not found</p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/admin/applications">Back to Applications</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/applications">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">
                Application #{application.id.slice(0, 8)}
              </h1>
              <ApplicationStatusBadge status={application.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              Submitted{" "}
              {formatDistanceToNow(new Date(application.created_at), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>

        {application.status === "pending" && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="text-red-500 hover:bg-red-500/10"
              onClick={() => setRejectDialogOpen(true)}
            >
              <X className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button
              className="bg-green-600 text-white hover:bg-green-700"
              onClick={() => setApproveDialogOpen(true)}
            >
              <Check className="mr-2 h-4 w-4" />
              Approve
            </Button>
          </div>
        )}
      </div>

      {/* Rejection Reason */}
      {application.status === "rejected" && application.rejection_reason && (
        <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
          <p className="font-medium text-red-500">Rejection Reason:</p>
          <p className="mt-1 text-sm text-red-400">
            {application.rejection_reason}
          </p>
        </div>
      )}

      <div className="space-y-6">
        {/* Personal Information */}
        <Card className="border-primary/20 bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <User className="h-5 w-5 text-primary" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="font-medium text-foreground">
                {application.full_name}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="flex items-center gap-2 font-medium text-foreground">
                <Mail className="h-4 w-4 text-primary" />
                {application.email}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="flex items-center gap-2 font-medium text-foreground">
                <Phone className="h-4 w-4 text-primary" />
                {application.phone}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Submitted</p>
              <p className="flex items-center gap-2 font-medium text-foreground">
                <Calendar className="h-4 w-4 text-primary" />
                {format(new Date(application.created_at), "PPP 'at' p")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Brokerage Information */}
        <Card className="border-primary/20 bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Building2 className="h-5 w-5 text-primary" />
              Brokerage Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Brokerage Name</p>
              <p className="font-medium text-foreground">
                {application.brokerage_name}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="whitespace-pre-line font-medium text-foreground">
                {application.brokerage_address}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="flex items-center gap-2 font-medium text-foreground">
                <Phone className="h-4 w-4 text-primary" />
                {application.brokerage_phone}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* License Information */}
        <Card className="border-primary/20 bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Award className="h-5 w-5 text-primary" />
              License Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Active Agent</p>
              <p className="font-medium text-foreground">
                {application.is_active_agent ? (
                  <span className="flex items-center gap-1 text-green-500">
                    <Check className="h-4 w-4" /> Yes
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-500">
                    <X className="h-4 w-4" /> No
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Licensed States</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {application.licensed_states.map((code) => (
                  <Badge
                    key={code}
                    variant="secondary"
                    className="bg-gold-500/20 text-primary"
                  >
                    {getStateName(code)} ({code})
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">License Numbers</p>
              <div className="mt-2 space-y-2">
                {Object.entries(application.license_numbers).map(
                  ([state, number]) => (
                    <div
                      key={state}
                      className="flex items-center gap-3 rounded-lg border border-primary/10 bg-muted/50 px-3 py-2"
                    >
                      <span className="text-sm font-medium text-primary">
                        {state}:
                      </span>
                      <span className="font-mono text-foreground">{number}</span>
                    </div>
                  )
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Years of Experience</p>
              <p className="font-medium text-foreground">
                {application.years_of_experience} years
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <ApproveDialog
        open={approveDialogOpen}
        onOpenChange={setApproveDialogOpen}
        applicationId={application.id}
        applicantName={application.full_name}
        applicantEmail={application.email}
        onConfirm={handleApprove}
      />

      <RejectDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        applicationId={application.id}
        applicantName={application.full_name}
        applicantEmail={application.email}
        onConfirm={handleReject}
      />
    </div>
  );
}
