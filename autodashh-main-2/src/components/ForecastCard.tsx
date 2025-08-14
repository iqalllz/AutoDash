import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Loader2, Calendar } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ForecastCardProps {
  data: any[];
  numericColumns: string[];
}

export function ForecastCard({ data, numericColumns }: ForecastCardProps) {
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [periods, setPeriods] = useState("6");
  const [isLoading, setIsLoading] = useState(false);
  const [forecast, setForecast] = useState<any[]>([]);

  const generateForecast = async () => {
    if (!selectedColumn) {
      toast.error("Please select a column to forecast");
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`https://xatzdkohsbuntmfgiehq.supabase.co/functions/v1/analyze-csv?action=forecast`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhdHpka29oc2J1bnRtZmdpZWhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NjQ1NTgsImV4cCI6MjA2ODM0MDU1OH0.CvyRe2NCx7eB9RgZucPN-M5s-bEBdTXLP9ZkfjnR77Q`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data,
          column: selectedColumn,
          periods: parseInt(periods)
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate forecast');
      }

      setForecast(result.forecast || []);
      
      if (result.forecast && result.forecast.length > 0) {
        toast.success("Forecast generated successfully!");
      } else {
        toast.info("No forecast data available - insufficient historical data");
      }
      
    } catch (error) {
      console.error('Forecast error:', error);
      toast.error("Failed to generate forecast");
    } finally {
      setIsLoading(false);
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

  return (
    <Card className="shadow-card animate-scale-in border border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-accent" />
          AI Forecasting
        </CardTitle>
        <CardDescription>
          Generate predictions for future values based on historical data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Column to Forecast</label>
            <Select value={selectedColumn} onValueChange={setSelectedColumn}>
              <SelectTrigger>
                <SelectValue placeholder="Select numeric column" />
              </SelectTrigger>
              <SelectContent>
                {numericColumns.map((column) => (
                  <SelectItem key={column} value={column}>
                    {column}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Forecast Periods</label>
            <Select value={periods} onValueChange={setPeriods}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 periods</SelectItem>
                <SelectItem value="6">6 periods</SelectItem>
                <SelectItem value="12">12 periods</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={generateForecast} disabled={isLoading || !selectedColumn} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Forecast...
            </>
          ) : (
            <>
              <Calendar className="h-4 w-4 mr-2" />
              Generate Forecast
            </>
          )}
        </Button>

        {forecast.length > 0 && (
          <div className="space-y-4 animate-fade-in">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecast}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  
                  {/* Confidence interval area */}
                  <Line
                    type="monotone"
                    dataKey="upper_bound"
                    stroke="hsl(var(--accent))"
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="lower_bound"
                    stroke="hsl(var(--accent))"
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                  
                  {/* Main prediction line */}
                  <Line
                    type="monotone"
                    dataKey="predicted_value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>📈 Showing forecast for <strong>{selectedColumn}</strong> with confidence intervals</p>
              <p>• Solid line: Predicted values</p>
              <p>• Dashed lines: Upper/lower bounds (confidence range)</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}