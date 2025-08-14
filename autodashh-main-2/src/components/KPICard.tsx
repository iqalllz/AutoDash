import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  trendLabel?: string;
  color?: string;
}

export const KPICard = ({ title, value, subtitle, trend, trendLabel, color = "primary" }: KPICardProps) => {
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `$${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `$${(val / 1000).toFixed(0)}K`;
      } else if (val % 1 !== 0) {
        return val.toFixed(2);
      }
      return val.toLocaleString();
    }
    return val;
  };

  const getTrendColor = () => {
    if (!trend) return "text-muted-foreground";
    return trend >= 0 ? "text-green-600" : "text-red-600";
  };

  const colorMap = {
    primary: "border-l-primary bg-primary/5",
    secondary: "border-l-secondary bg-secondary/5", 
    accent: "border-l-accent bg-accent/5",
    emerald: "border-l-emerald-500 bg-emerald-50",
    blue: "border-l-blue-500 bg-blue-50",
    amber: "border-l-amber-500 bg-amber-50",
    rose: "border-l-rose-500 bg-rose-50",
  };

  return (
    <Card className={`p-6 border-l-4 ${colorMap[color as keyof typeof colorMap] || colorMap.primary} animate-scale-in hover:animate-glow transition-all duration-300 hover:shadow-lg`}>
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
          {title}
        </h3>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-foreground">
              {formatValue(value)}
            </p>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 ${getTrendColor()}`}>
              {trend >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">
                {Math.abs(trend)}% {trendLabel || "vs avg"}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};