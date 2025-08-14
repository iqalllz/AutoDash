import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  Legend,
  ScatterChart,
  Scatter
} from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Activity, MessageCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

interface SimpleChartCardProps {
  title: string;
  data: ChartData[];
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'histogram' | 'boxplot' | 'kpi';
  description?: string;
  dataKey?: string;
  xAxisKey?: string;
  config?: any;
  originalData?: any[];
}

const CHART_COLORS = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#10B981'  // Emerald
];

export function SimpleChartCard({ 
  title, 
  data, 
  type, 
  description, 
  dataKey = 'value',
  xAxisKey = 'name',
  config,
  originalData = []
}: SimpleChartCardProps) {
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string>("");

  const explainInsight = async () => {
    setIsExplaining(true);
    
    try {
      const response = await fetch(`https://xatzdkohsbuntmfgiehq.supabase.co/functions/v1/analyze-csv?action=explain`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhdHpka29oc2J1bnRtZmdpZWhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NjQ1NTgsImV4cCI6MjA2ODM0MDU1OH0.CvyRe2NCx7eB9RgZucPN-M5s-bEBdTXLP9ZkfjnR77Q`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: originalData,
          chartData: data,
          chartType: type,
          title
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate explanation');
      }

      setExplanation(result.explanation);
      toast.success("Insight explained!");
      
    } catch (error) {
      console.error('Explanation error:', error);
      toast.error("Failed to explain insight");
    } finally {
      setIsExplaining(false);
    }
  };
  const getChartIcon = () => {
    switch (type) {
      case 'bar': return <BarChart3 className="w-5 h-5 text-primary" />;
      case 'line': return <Activity className="w-5 h-5 text-accent" />;
      case 'pie': return <PieChartIcon className="w-5 h-5 text-chart-3" />;
      default: return <TrendingUp className="w-5 h-5 text-primary" />;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value.toLocaleString()}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    // Ensure data is valid and not empty
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          No data available for this chart
        </div>
      );
    }

    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis 
                dataKey={xAxisKey} 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey={dataKey} 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
                className="hover:opacity-80 transition-opacity"
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis 
                dataKey={xAxisKey} 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey={dataKey} 
                stroke="hsl(var(--accent))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--accent))', r: 4 }}
                activeDot={{ r: 6, fill: 'hsl(var(--accent))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey={dataKey}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={CHART_COLORS[index % CHART_COLORS.length]} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis 
                dataKey={config?.xKey || xAxisKey} 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                name={config?.xKey || xAxisKey}
              />
              <YAxis 
                dataKey={config?.yKey || dataKey}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                name={config?.yKey || dataKey}
              />
              <Tooltip content={<CustomTooltip />} />
              <Scatter 
                dataKey={config?.yKey || dataKey} 
                fill="hsl(var(--primary))"
              />
              {config?.correlation && (
                <Legend 
                  content={() => (
                    <div className="text-center text-sm text-muted-foreground mt-2">
                      Correlation: {config.correlation}
                    </div>
                  )}
                />
              )}
            </ScatterChart>
          </ResponsiveContainer>
        );

      case 'kpi':
        const kpiData = data[0];
        return (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">
                {typeof kpiData?.value === 'number' ? kpiData.value.toLocaleString() : kpiData?.value}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {kpiData?.label || 'Total Value'}
              </div>
              {kpiData?.change && (
                <div className={`text-sm mt-2 ${kpiData.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {kpiData.change}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Chart type not supported
          </div>
        );
    }
  };

  return (
    <Card className="shadow-chart hover:shadow-upload transition-all duration-500 hover:scale-105 animate-scale-in border border-border/50 bg-gradient-to-br from-card to-card/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="animate-glow">{getChartIcon()}</span>
            <CardTitle className="text-lg animate-slide-in-right">{title}</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={explainInsight}
            disabled={isExplaining}
            className="hover:shadow-upload transition-all duration-300"
          >
            {isExplaining ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageCircle className="h-4 w-4" />
            )}
          </Button>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 animate-fade-in" style={{ animationDelay: '0.1s' }}>{description}</p>
        )}
        {explanation && (
          <div className="mt-3 p-3 bg-accent/10 rounded-lg animate-fade-in">
            <p className="text-sm font-medium mb-1">💡 AI Insight:</p>
            <p className="text-sm text-muted-foreground">{explanation}</p>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-64 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {renderChart()}
        </div>
      </CardContent>
    </Card>
  );
}