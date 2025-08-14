import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface InsightCardProps {
  insights: string[];
  dataSize: { rows: number; columns: number };
  columnTypes: { numeric: number; text: number; date: number };
}

export function InsightCard({ insights, dataSize, columnTypes }: InsightCardProps) {
  const getInsightIcon = (insight: string) => {
    if (insight.includes('⚠️') || insight.includes('missing')) {
      return <AlertTriangle className="w-4 h-4 text-warning" />;
    }
    if (insight.includes('🔢') || insight.includes('📅') || insight.includes('📝')) {
      return <CheckCircle className="w-4 h-4 text-success" />;
    }
    return <TrendingUp className="w-4 h-4 text-chart-1" />;
  };

  const formatInsight = (insight: string) => {
    // Remove emoji from the beginning if present
    return insight.replace(/^[📊🔢📝📅⚠️🔍]\s*/, '');
  };

  return (
    <Card className="shadow-card hover:shadow-upload transition-all duration-500 hover:scale-105 animate-scale-in border border-border/50 bg-gradient-to-br from-card to-card/50">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2 animate-fade-in">
          <Lightbulb className="w-5 h-5 text-accent animate-glow" />
          <CardTitle className="text-lg animate-slide-in-right">Data Insights</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-hero rounded-lg shadow-card animate-bounce-in">
          <div className="text-center animate-scale-in" style={{ animationDelay: '0.1s' }}>
            <div className="text-2xl font-bold text-foreground">{dataSize.rows.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Rows</div>
          </div>
          <div className="text-center animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <div className="text-2xl font-bold text-foreground">{dataSize.columns}</div>
            <div className="text-sm text-muted-foreground">Columns</div>
          </div>
        </div>

        {/* Column Type Breakdown */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground">Column Types</h4>
          <div className="flex flex-wrap gap-2">
            {columnTypes.numeric > 0 && (
              <Badge variant="outline" className="bg-chart-1/10 text-chart-1 border-chart-1/20 animate-fade-in hover:scale-105 transition-transform duration-300" style={{ animationDelay: '0.3s' }}>
                {columnTypes.numeric} Numeric
              </Badge>
            )}
            {columnTypes.text > 0 && (
              <Badge variant="outline" className="bg-chart-2/10 text-chart-2 border-chart-2/20 animate-fade-in hover:scale-105 transition-transform duration-300" style={{ animationDelay: '0.4s' }}>
                {columnTypes.text} Categorical
              </Badge>
            )}
            {columnTypes.date > 0 && (
              <Badge variant="outline" className="bg-chart-3/10 text-chart-3 border-chart-3/20 animate-fade-in hover:scale-105 transition-transform duration-300" style={{ animationDelay: '0.5s' }}>
                {columnTypes.date} Date
              </Badge>
            )}
          </div>
        </div>

        {/* AI-Style Insights */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">Key Findings</h4>
          <div className="space-y-2">
            {insights.map((insight, index) => (
              <div 
                key={index} 
                className="flex items-start gap-3 p-3 bg-card border border-border/50 rounded-lg hover:bg-muted/20 transition-all duration-300 hover:scale-105 hover:shadow-card animate-fade-in-up"
                style={{ animationDelay: `${0.1 * index + 0.6}s` }}
              >
                <span className="animate-glow">{getInsightIcon(insight)}</span>
                <p className="text-sm text-foreground leading-relaxed flex-1">
                  {formatInsight(insight)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="p-3 bg-accent/5 border border-accent/20 rounded-lg animate-bounce-in hover:shadow-card transition-all duration-300" style={{ animationDelay: '1s' }}>
          <h4 className="font-medium text-sm text-accent mb-2 animate-fade-in">💡 Quick Tip</h4>
          <p className="text-xs text-muted-foreground animate-fade-in" style={{ animationDelay: '1.1s' }}>
            The charts below are automatically generated based on your data patterns. 
            Look for trends in bar charts, patterns in line charts, and distributions in pie charts.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}