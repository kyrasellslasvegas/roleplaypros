"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { ApplicationsTable, ApproveDialog, RejectDialog } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Users } from "lucide-react";

interface Application {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  brokerage_name: string;
  licensed_states: string[];
  years_of_experience: number;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

type StatusFilter = "all" | "pending" | "approved" | "rejected";

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [approveDialog, setApproveDialog] = useState<{
    open: boolean;
    application: Application | null;
  }>({ open: false, application: null });
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    application: Application | null;
  }>({ open: false, application: null });

  const { toast } = useToast();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/applications${statusFilter !== "all" ? `?status=${statusFilter}` : ""}`
      );
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setApplications(data.applications || []);
    } catch (error) {
      console.error("Failed to fetch applications:", error);
      toast({
        title: "Error",
        description: "Failed to load applications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, toast]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("agent_applications_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "agent_applications",
        },
        () => {
          fetchApplications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchApplications]);

  async function handleApprove() {
    if (!approveDialog.application) return;

    try {
      const response = await fetch(
        `/api/applications/${approveDialog.application.id}/approve`,
        { method: "POST" }
      );

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      toast({
        title: "Application Approved",
        description: `${approveDialog.application.full_name} has been approved and notified.`,
      });

      fetchApplications();
    } catch (error) {
      console.error("Failed to approve application:", error);
      toast({
        title: "Error",
        description: "Failed to approve application",
        variant: "destructive",
      });
      throw error;
    }
  }

  async function handleReject(reason: string) {
    if (!rejectDialog.application) return;

    try {
      const response = await fetch(
        `/api/applications/${rejectDialog.application.id}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        }
      );

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      toast({
        title: "Application Rejected",
        description: `${rejectDialog.application.full_name}'s application has been rejected.`,
      });

      fetchApplications();
    } catch (error) {
      console.error("Failed to reject application:", error);
      toast({
        title: "Error",
        description: "Failed to reject application",
        variant: "destructive",
      });
      throw error;
    }
  }

  const pendingCount = applications.filter((a) => a.status === "pending").length;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Users className="h-6 w-6 text-primary" />
            Agent Applications
          </h1>
          <p className="mt-1 text-muted-foreground">
            Review and manage agent early access applications
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchApplications}
          disabled={isLoading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-primary/20 bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold text-foreground">
            {applications.length}
          </p>
        </div>
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
          <p className="text-sm text-yellow-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-500">{pendingCount}</p>
        </div>
        <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
          <p className="text-sm text-green-500">Approved</p>
          <p className="text-2xl font-bold text-green-500">
            {applications.filter((a) => a.status === "approved").length}
          </p>
        </div>
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-sm text-red-500">Rejected</p>
          <p className="text-2xl font-bold text-red-500">
            {applications.filter((a) => a.status === "rejected").length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        {(["all", "pending", "approved", "rejected"] as StatusFilter[]).map(
          (status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className={
                statusFilter === status ? "bg-primary text-primary-foreground" : ""
              }
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          )
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <ApplicationsTable
          applications={applications}
          onApprove={(id) => {
            const app = applications.find((a) => a.id === id);
            if (app) setApproveDialog({ open: true, application: app });
          }}
          onReject={(id) => {
            const app = applications.find((a) => a.id === id);
            if (app) setRejectDialog({ open: true, application: app });
          }}
        />
      )}

      {/* Dialogs */}
      {approveDialog.application && (
        <ApproveDialog
          open={approveDialog.open}
          onOpenChange={(open) =>
            setApproveDialog({ ...approveDialog, open })
          }
          applicationId={approveDialog.application.id}
          applicantName={approveDialog.application.full_name}
          applicantEmail={approveDialog.application.email}
          onConfirm={handleApprove}
        />
      )}

      {rejectDialog.application && (
        <RejectDialog
          open={rejectDialog.open}
          onOpenChange={(open) => setRejectDialog({ ...rejectDialog, open })}
          applicationId={rejectDialog.application.id}
          applicantName={rejectDialog.application.full_name}
          applicantEmail={rejectDialog.application.email}
          onConfirm={handleReject}
        />
      )}
    </div>
  );
}
