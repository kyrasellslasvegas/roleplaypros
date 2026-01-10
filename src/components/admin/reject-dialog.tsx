"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, XCircle } from "lucide-react";

interface RejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  applicantName: string;
  applicantEmail: string;
  onConfirm: (reason: string) => Promise<void>;
}

export function RejectDialog({
  open,
  onOpenChange,
  applicantName,
  applicantEmail,
  onConfirm,
}: RejectDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [reason, setReason] = useState("");

  async function handleConfirm() {
    if (!reason.trim()) return;

    setIsLoading(true);
    try {
      await onConfirm(reason);
      setReason("");
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-primary/20 bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <XCircle className="h-5 w-5 text-red-500" />
            Reject Application
          </DialogTitle>
          <DialogDescription>
            You are about to reject the application for:
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-primary/20 bg-muted/50 p-4">
          <p className="font-medium text-foreground">{applicantName}</p>
          <p className="text-sm text-muted-foreground">{applicantEmail}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason">Rejection Reason</Label>
          <Textarea
            id="reason"
            placeholder="Please provide a reason for rejection..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[100px] border-primary/30 bg-muted/50 focus:border-primary"
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || !reason.trim()}
            variant="destructive"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rejecting...
              </>
            ) : (
              "Reject Application"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
