import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, AlertTriangle, Target, Lightbulb, BarChart3 } from 'lucide-react';

interface AIInsight {
  type: 'trend' | 'anomaly' | 'correlation' | 'pattern' | 'recommendation';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
}

interface AIInsightsCardProps {
  insights: AIInsight[];
}

export const AIInsightsCard: React.FC<AIInsightsCardProps> = ({ insights }) => {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend': return <TrendingUp className="w-4 h-4" />;
      case 'anomaly': return <AlertTriangle className="w-4 h-4" />;
      case 'correlation': return <BarChart3 className="w-4 h-4" />;
      case 'pattern': return <Target className="w-4 h-4" />;
      case 'recommendation': return <Lightbulb className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (!insights || insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>AI insights will appear here after analysis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card hover:shadow-upload transition-all duration-500 hover:scale-105 animate-scale-in border border-border/50 bg-gradient-to-br from-card to-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 animate-fade-in">
          <Brain className="w-5 h-5 text-primary animate-glow" />
          <span className="animate-slide-in-right">AI Insights</span>
          <Badge variant="secondary" className="ml-2 animate-bounce-in" style={{ animationDelay: '0.2s' }}>
            {insights.length} insights
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div
              key={index}
              className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-all duration-300 hover:scale-105 hover:shadow-card animate-fade-in-up"
              style={{ animationDelay: `${0.1 * index}s` }}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 rounded-full bg-primary/10 text-primary animate-glow">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium text-foreground">{insight.title}</h4>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getSeverityColor(insight.severity)}`}
                    >
                      {insight.severity}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {(insight.confidence * 100).toFixed(0)}% confidence
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};