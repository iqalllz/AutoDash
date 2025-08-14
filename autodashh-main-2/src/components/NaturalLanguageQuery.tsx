import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Loader2, Code2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NaturalLanguageQueryProps {
  columnInfo: any[];
}

export function NaturalLanguageQuery({ columnInfo }: NaturalLanguageQueryProps) {
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{sql: string, explanation: string} | null>(null);

  const handleQuery = async () => {
    if (!question.trim()) {
      toast.error("Please enter a question");
      return;
    }

    setIsLoading(true);
    
    try {
      // Manually construct URL with action parameter
      const response = await fetch(`https://xatzdkohsbuntmfgiehq.supabase.co/functions/v1/analyze-csv?action=query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhdHpka29oc2J1bnRtZmdpZWhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NjQ1NTgsImV4cCI6MjA2ODM0MDU1OH0.CvyRe2NCx7eB9RgZucPN-M5s-bEBdTXLP9ZkfjnR77Q`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.trim(),
          columnInfo
        })
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to generate query');
      }

      setResult(responseData);
      toast.success("Query generated successfully!");
      
    } catch (error) {
      console.error('Query generation error:', error);
      toast.error("Failed to generate SQL query");
    } finally {
      setIsLoading(false);
    }
  };

  const exampleQuestions = [
    "Show me the top 10 highest values",
    "What's the average by category?",
    "Count records from the last month",
    "Find outliers in the data"
  ];

  return (
    <Card className="shadow-card animate-scale-in border border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Natural Language Query
        </CardTitle>
        <CardDescription>
          Ask questions about your data in plain English and get SQL queries
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="e.g., What's the total revenue by month?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
            className="flex-1"
          />
          <Button onClick={handleQuery} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Code2 className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {exampleQuestions.map((example, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => setQuestion(example)}
            >
              {example}
            </Badge>
          ))}
        </div>

        {result && (
          <div className="space-y-3 animate-fade-in">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Generated SQL:</p>
              <code className="text-sm bg-background p-2 rounded block overflow-x-auto">
                {result.sql}
              </code>
            </div>
            <div className="p-3 bg-accent/10 rounded-lg">
              <p className="text-sm font-medium mb-1">Explanation:</p>
              <p className="text-sm text-muted-foreground">{result.explanation}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}