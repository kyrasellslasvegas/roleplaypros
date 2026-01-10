import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ApplicationStatusBadgeProps {
  status: "pending" | "approved" | "rejected";
  className?: string;
}

export function ApplicationStatusBadge({
  status,
  className,
}: ApplicationStatusBadgeProps) {
  const variants = {
    pending: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
    approved: "bg-green-500/20 text-green-500 border-green-500/30",
    rejected: "bg-red-500/20 text-red-500 border-red-500/30",
  };

  const labels = {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
  };

  return (
    <Badge
      variant="outline"
      className={cn(variants[status], "font-medium", className)}
    >
      {labels[status]}
    </Badge>
  );
}
