import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  className?: string;
}

export default function StatCard({ title, value, subtitle, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div className={cn("gradient-card rounded-xl p-5 border border-border hover:border-primary/30 transition-colors group", className)}>
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={cn("text-xs font-semibold px-2 py-1 rounded-full", trend.positive ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive")}>
            {trend.value}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{title}</p>
      {subtitle && <p className="text-xs text-muted-foreground/70 mt-0.5">{subtitle}</p>}
    </div>
  );
}
