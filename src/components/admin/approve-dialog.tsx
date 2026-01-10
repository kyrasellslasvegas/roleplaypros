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
import { Loader2, CheckCircle } from "lucide-react";

interface ApproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  applicantName: string;
  applicantEmail: string;
  onConfirm: () => Promise<void>;
}

export function ApproveDialog({
  open,
  onOpenChange,
  applicantName,
  applicantEmail,
  onConfirm,
}: ApproveDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleConfirm() {
    setIsLoading(true);
    try {
      await onConfirm();
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
            <CheckCircle className="h-5 w-5 text-green-500" />
            Approve Application
          </DialogTitle>
          <DialogDescription>
            You are about to approve the application for:
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-primary/20 bg-muted/50 p-4">
          <p className="font-medium text-foreground">{applicantName}</p>
          <p className="text-sm text-muted-foreground">{applicantEmail}</p>
        </div>

        <div className="rounded-lg bg-green-500/10 p-4 text-sm text-green-400">
          <p className="font-medium">This will:</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Create a user account for the applicant</li>
            <li>Send an approval email with magic link</li>
            <li>Send an SMS notification</li>
          </ul>
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
            disabled={isLoading}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Approving...
              </>
            ) : (
              "Approve Application"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
