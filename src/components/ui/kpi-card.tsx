import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ReactNode } from "react";

interface KpiCardProps {
  label: string;
  value: ReactNode;
  trend?: number | null; // percentual (ex.: 12.5 = +12.5%)
  invertTrend?: boolean; // p/ despesa: queda = positivo
  hint?: string;
  highlight?: boolean; // usa acento da marca
  className?: string;
  icon?: ReactNode;
}

function formatTrend(t: number) {
  const abs = Math.abs(t);
  return `${abs.toFixed(abs >= 10 ? 0 : 1)}%`;
}

export function KpiCard({ label, value, trend, invertTrend, hint, highlight, className, icon }: KpiCardProps) {
  let trendNode: ReactNode = null;
  if (typeof trend === "number" && isFinite(trend)) {
    const isUp = trend > 0.05;
    const isDown = trend < -0.05;
    const positive = invertTrend ? isDown : isUp;
    const negative = invertTrend ? isUp : isDown;
    const cls = positive ? "kpi-trend-up" : negative ? "kpi-trend-down" : "kpi-trend-flat";
    const Icon = positive ? TrendingUp : negative ? TrendingDown : Minus;
    trendNode = (
      <span className={cls}>
        <Icon className="w-3 h-3" />
        {formatTrend(trend)}
      </span>
    );
  }

  return (
    <div
      className={cn(
        "surface-card surface-card-hover p-4 sm:p-5 flex flex-col gap-2 min-w-0",
        highlight && "bg-primary/[0.04] border-primary/15",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={cn("kpi-label truncate", highlight && "text-primary")}>{label}</span>
        {icon ? <span className="text-muted-foreground/60 shrink-0">{icon}</span> : null}
      </div>
      <div className={cn("kpi-value truncate", highlight && "text-primary")}>{value}</div>
      <div className="flex items-center gap-2 min-h-[18px]">
        {trendNode}
        {hint ? <span className="t-aux truncate">{hint}</span> : null}
      </div>
    </div>
  );
}

interface SectionCardProps {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

export function SectionCard({ title, description, actions, className, bodyClassName, children }: SectionCardProps) {
  return (
    <div className={cn("surface-card overflow-hidden", className)}>
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
          <div className="min-w-0">
            {title && <h3 className="t-section-title">{title}</h3>}
            {description && <p className="t-aux mt-0.5">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0 flex-wrap">{actions}</div>}
        </div>
      )}
      <div className={cn("px-4 sm:px-5 pb-4 sm:pb-5", bodyClassName)}>{children}</div>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-start justify-between gap-3 mb-5", className)}>
      <div className="min-w-0">
        <h1 className="t-screen-title">{title}</h1>
        {subtitle && <p className="t-aux mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>}
    </div>
  );
}
