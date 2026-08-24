import { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: ReactNode;
  change?: number;
  changeLabel?: string;
  iconBg?: string;
  className?: string;
  loading?: boolean;
  compact?: boolean;
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  change,
  changeLabel,
  iconBg = "bg-primary/10",
  className,
  loading,
  compact = false,
}: StatsCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral = change === undefined || change === 0;

  if (loading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className={cn("p-5", compact && "p-3")}>
          <div className="skeleton h-4 w-24 mb-3" />
          <div className={cn("skeleton h-8 w-32 mb-2", compact && "h-6 w-24")} />
          <div className="skeleton h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "overflow-hidden group hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200",
        className
      )}
    >
      <CardContent className={cn("p-5", compact && "p-3 sm:p-4")}>
        <div className="flex items-start justify-between gap-1">
          <div className="flex-1 min-w-0">
            <p className={cn("font-medium text-muted-foreground truncate", compact ? "text-[10px] sm:text-xs" : "text-sm")}>
              {title}
            </p>
            <div className="mt-1 sm:mt-2 flex items-baseline gap-2 flex-wrap">
              <span className={cn("font-bold text-foreground tracking-tight break-words", compact ? "text-lg sm:text-xl" : "text-2xl")}>
                {value}
              </span>
            </div>
            {(change !== undefined || description) && (
              <div className="mt-2 flex items-center gap-1.5">
                {change !== undefined && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 text-xs font-medium",
                      isPositive && "text-emerald-600 dark:text-emerald-400",
                      isNegative && "text-destructive",
                      isNeutral && "text-muted-foreground"
                    )}
                  >
                    {isPositive && <TrendingUp className="h-3 w-3" />}
                    {isNegative && <TrendingDown className="h-3 w-3" />}
                    {isNeutral && <Minus className="h-3 w-3" />}
                    {isPositive && "+"}
                    {change}%
                  </span>
                )}
                {changeLabel && (
                  <span className={cn("text-muted-foreground", compact ? "text-[9px] sm:text-[10px]" : "text-xs")}>
                    {changeLabel}
                  </span>
                )}
                {description && !changeLabel && (
                  <span className={cn("text-muted-foreground", compact ? "text-[9px] sm:text-[10px]" : "text-xs")}>
                    {description}
                  </span>
                )}
              </div>
            )}
          </div>
          <div
            className={cn(
              "flex flex-shrink-0 items-center justify-center rounded-xl",
              compact ? "h-8 w-8 sm:h-9 sm:w-9" : "h-11 w-11",
              iconBg,
              "group-hover:scale-110 transition-transform duration-200"
            )}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
