"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApplicationStatusBadge } from "./application-status-badge";
import { Eye, Check, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Application {
  id: string;
  full_name: string;
  email: string;
  brokerage_name: string;
  licensed_states: string[];
  years_of_experience: number;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

interface ApplicationsTableProps {
  applications: Application[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export function ApplicationsTable({
  applications,
  onApprove,
  onReject,
}: ApplicationsTableProps) {
  if (applications.length === 0) {
    return (
      <div className="rounded-lg border border-primary/20 bg-muted/30 p-12 text-center">
        <p className="text-muted-foreground">No applications found</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-primary/20 bg-muted/30">
      <Table>
        <TableHeader>
          <TableRow className="border-primary/20 hover:bg-transparent">
            <TableHead className="text-muted-foreground">Applicant</TableHead>
            <TableHead className="text-muted-foreground">Brokerage</TableHead>
            <TableHead className="text-muted-foreground">
              License States
            </TableHead>
            <TableHead className="text-muted-foreground">Experience</TableHead>
            <TableHead className="text-muted-foreground">Status</TableHead>
            <TableHead className="text-muted-foreground">Submitted</TableHead>
            <TableHead className="text-right text-muted-foreground">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((application) => (
            <TableRow
              key={application.id}
              className="border-primary/10 hover:bg-primary/5"
            >
              <TableCell>
                <div>
                  <p className="font-medium text-foreground">
                    {application.full_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {application.email}
                  </p>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {application.brokerage_name}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {application.licensed_states.map((state) => (
                    <Badge
                      key={state}
                      variant="secondary"
                      className="bg-primary/10 text-primary"
                    >
                      {state}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {application.years_of_experience} years
              </TableCell>
              <TableCell>
                <ApplicationStatusBadge status={application.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDistanceToNow(new Date(application.created_at), {
                  addSuffix: true,
                })}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/applications/${application.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  {application.status === "pending" && (
                    <>
                      {onApprove && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-500 hover:bg-green-500/10 hover:text-green-500"
                          onClick={() => onApprove(application.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      {onReject && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:bg-red-500/10 hover:text-red-500"
                          onClick={() => onReject(application.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
