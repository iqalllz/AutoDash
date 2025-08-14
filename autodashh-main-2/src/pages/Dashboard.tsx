import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, BarChart3, TrendingUp, PieChart, Activity, LogOut, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { FileUpload } from "@/components/FileUpload";
import { DataTable } from "@/components/DataTable";
import { SimpleChartCard } from "@/components/SimpleChartCard";
import { InsightCard } from "@/components/InsightCard";
import { PaymentModal } from "@/components/PaymentModal";
import { AIInsightsCard } from "@/components/AIInsightsCard";
import { KPICard } from "@/components/KPICard";
import { NaturalLanguageQuery } from "@/components/NaturalLanguageQuery";
import { ForecastCard } from "@/components/ForecastCard";
import { useAuth } from "@/contexts/AuthContext";

const generateInsights = (analyses: any[], summary: any): string[] => {
  const insights: string[] = [];
  
  if (summary) {
    insights.push(`📊 Dataset contains ${summary.totalRows?.toLocaleString()} rows and ${summary.totalColumns} columns`);
    
    if (summary.numericColumns > 0) {
      insights.push(`🔢 Found ${summary.numericColumns} numeric columns for statistical analysis`);
    }
    
    if (summary.categoricalColumns > 0) {
      insights.push(`📝 Identified ${summary.categoricalColumns} categorical columns for grouping and filtering`);
    }
    
    if (summary.dateColumns > 0) {
      insights.push(`📅 Detected ${summary.dateColumns} date columns for time-series analysis`);
    }
  }
  
  if (analyses && analyses.length > 0) {
    // Check for missing data
    const columnsWithMissing = analyses.filter(col => col.nullCount > 0);
    if (columnsWithMissing.length > 0) {
      insights.push(`⚠️ ${columnsWithMissing.length} columns contain missing values - consider data cleaning`);
    }
    
    // Check for high cardinality
    const highCardinalityColumns = analyses.filter(col => col.uniqueValues > 100);
    if (highCardinalityColumns.length > 0) {
      insights.push(`🔍 ${highCardinalityColumns.length} columns have high cardinality (>100 unique values)`);
    }
  }
  
  return insights.slice(0, 6); // Limit to 6 insights
};

const generateKPIs = (analyses: any[], summary: any, data: any[]) => {
  const kpis = [];
  
  if (!analyses || !data || data.length === 0) return kpis;
  
  // Find different types of columns for calculations
  const numericColumns = analyses.filter(col => col.type === 'number' && col.min !== undefined);
  const categoricalColumns = analyses.filter(col => col.type === 'string' || col.type === 'text');
  const dateColumns = analyses.filter(col => col.type === 'date' || col.type === 'datetime');
  
  // Total Records
  kpis.push({
    title: "Total Records",
    value: summary?.totalRows || data.length,
    subtitle: "Dataset size",
    color: "primary"
  });
  
  // Data Quality Score
  const totalCells = data.length * (summary?.totalColumns || analyses.length);
  const missingCells = analyses.reduce((sum, col) => sum + (col.nullCount || 0), 0);
  const qualityScore = totalCells > 0 ? Math.round(((totalCells - missingCells) / totalCells) * 100) : 100;
  kpis.push({
    title: "Data Quality",
    value: `${qualityScore}%`,
    subtitle: "Complete data ratio",
    trend: qualityScore >= 95 ? 5 : qualityScore >= 85 ? 0 : -10,
    trendLabel: "quality",
    color: qualityScore >= 95 ? "emerald" : qualityScore >= 85 ? "amber" : "rose"
  });
  
  // Most valuable/important numeric column
  if (numericColumns.length > 0) {
    // Find the column with highest sum or mean (most significant)
    const importantNumeric = numericColumns.reduce((max, col) => {
      const maxSum = (max.sum || max.mean || 0) * (max.count || 1);
      const colSum = (col.sum || col.mean || 0) * (col.count || 1);
      return colSum > maxSum ? col : max;
    });
    
    // Determine if it looks like currency/revenue
    const isCurrency = importantNumeric.column?.toLowerCase().includes('price') || 
                      importantNumeric.column?.toLowerCase().includes('amount') ||
                      importantNumeric.column?.toLowerCase().includes('revenue') ||
                      importantNumeric.column?.toLowerCase().includes('cost') ||
                      importantNumeric.column?.toLowerCase().includes('value') ||
                      (importantNumeric.mean && importantNumeric.mean > 100);
    
    const value = importantNumeric.sum || (importantNumeric.mean * data.length) || importantNumeric.mean || 0;
    const title = isCurrency ? `Total ${importantNumeric.column}` : `Avg ${importantNumeric.column}`;
    const displayValue = isCurrency ? value : (importantNumeric.mean || 0);
    
    kpis.push({
      title: title,
      value: displayValue,
      subtitle: isCurrency ? "Total sum" : "Average value",
      color: "blue",
      trend: importantNumeric.mean > (importantNumeric.median || 0) ? 12 : -8,
      trendLabel: "vs median"
    });
  }
  
  // Most diverse categorical column
  if (categoricalColumns.length > 0) {
    const mostDiverse = categoricalColumns.reduce((max, col) => 
      (col.uniqueValues || 0) > (max.uniqueValues || 0) ? col : max);
    
    if (mostDiverse.uniqueValues) {
      const diversityRatio = (mostDiverse.uniqueValues / data.length) * 100;
      kpis.push({
        title: `${mostDiverse.column} Diversity`,
        value: mostDiverse.uniqueValues,
        subtitle: `${diversityRatio.toFixed(1)}% unique`,
        color: "accent",
        trend: diversityRatio > 50 ? 15 : diversityRatio > 25 ? 5 : -5,
        trendLabel: "diversity"
      });
    }
  }
  
  // Time span (if date columns exist)
  if (dateColumns.length > 0) {
    const dateCol = dateColumns[0];
    if (dateCol.min && dateCol.max) {
      const startDate = new Date(dateCol.min);
      const endDate = new Date(dateCol.max);
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      kpis.push({
        title: "Time Span",
        value: daysDiff > 365 ? `${Math.round(daysDiff / 365)} years` : `${daysDiff} days`,
        subtitle: `${dateCol.column} range`,
        color: "secondary"
      });
    }
  }
  
  // Coverage Score (how complete is the most important column)
  const importantColumn = [...numericColumns, ...categoricalColumns]
    .sort((a, b) => (b.count || 0) - (a.count || 0))[0];
  
  if (importantColumn && importantColumn.count) {
    const coverage = Math.round((importantColumn.count / data.length) * 100);
    kpis.push({
      title: "Data Coverage",
      value: `${coverage}%`,
      subtitle: `${importantColumn.column} completeness`,
      color: coverage >= 90 ? "emerald" : coverage >= 70 ? "amber" : "rose",
      trend: coverage >= 90 ? 10 : coverage >= 70 ? 0 : -15,
      trendLabel: "coverage"
    });
  }
  
  return kpis.slice(0, 5); // Limit to 5 KPIs
};

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setAnalysisResults(null);
  };

  const analyzeCSV = async () => {
    if (!selectedFile) {
      toast.error("Please select a CSV file first");
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const { data, error } = await supabase.functions.invoke('analyze-csv', {
        body: formData,
      });

      if (error) {
        console.error('Analysis error:', error);
        toast.error("Failed to analyze CSV file");
        return;
      }

      console.log('Analysis results:', data);
      
      // Transform the edge function response to match component expectations
      const transformedResults = {
        insights: generateInsights(data.analyses, data.summary),
        aiInsights: data.aiInsights || [],
        kpis: generateKPIs(data.analyses, data.summary, data.data || []),
        charts: data.visualizations?.map(viz => ({
          title: viz.title,
          type: viz.type,
          data: viz.data,
          description: viz.description,
          config: viz.config
        })) || [],
        correlations: data.correlations || [],
        preview: data.data || [],
        columns: data.data?.length > 0 ? Object.keys(data.data[0]) : [],
        summary: data.summary,
        dataSize: { 
          rows: data.totalRows || 0, 
          columns: data.analyses?.length || 0 
        },
        columnTypes: {
          numeric: data.summary?.numericColumns || 0,
          text: (data.summary?.categoricalColumns || 0) + (data.summary?.dateColumns || 0),
          date: data.summary?.dateColumns || 0
        }
      };
      
      setAnalysisResults(transformedResults);
      toast.success("CSV analysis completed successfully!");
      
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error("An unexpected error occurred during analysis");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero animate-fade-in">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm shadow-card border-b animate-fade-in-up border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <BarChart3 className="h-8 w-8 text-primary animate-glow" />
              <div className="animate-slide-in-right">
                <h1 className="text-2xl font-bold text-foreground bg-gradient-primary bg-clip-text text-transparent">AutoDash</h1>
                <p className="text-sm text-muted-foreground">CSV Analysis & Insights</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <span className="text-sm text-muted-foreground">Welcome, {user?.email}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaymentModalOpen(true)}
                className="hover:shadow-upload transition-all duration-300 hover:scale-105"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Upgrade
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="hover:shadow-card transition-all duration-300 hover:scale-105"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* File Upload Section */}
        <Card className="mb-8 animate-scale-in shadow-card hover:shadow-upload transition-all duration-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload & Analyze CSV
            </CardTitle>
            <CardDescription>
              Upload your CSV file to get automated insights and visualizations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <FileUpload onFileUpload={handleFileSelect} isLoading={isAnalyzing} />
              {selectedFile && (
                <div className="flex items-center justify-between p-4 bg-gradient-chart rounded-lg border border-border/50 animate-bounce-in shadow-card">
                  <div className="animate-fade-in">
                    <p className="font-medium text-foreground">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button 
                    onClick={analyzeCSV} 
                    disabled={isAnalyzing}
                    className="bg-primary hover:bg-primary-hover transition-all duration-300 hover:scale-105 hover:shadow-upload"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                        <span className="animate-pulse-slow">Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Activity className="h-4 w-4 mr-2" />
                        Analyze CSV
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {analysisResults && (
          <div className="space-y-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            {/* KPI Cards */}
            {analysisResults.kpis && analysisResults.kpis.length > 0 && (
              <Card className="animate-scale-in shadow-card hover:shadow-upload transition-all duration-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary animate-glow" />
                    Key Metrics Overview
                  </CardTitle>
                  <CardDescription>
                    Summary statistics from your dataset
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {analysisResults.kpis.map((kpi: any, index: number) => (
                      <div
                        key={index}
                        className="animate-scale-in"
                        style={{ animationDelay: `${0.1 * index}s` }}
                      >
                        <KPICard
                          title={kpi.title}
                          value={kpi.value}
                          subtitle={kpi.subtitle}
                          trend={kpi.trend}
                          trendLabel={kpi.trendLabel}
                          color={kpi.color}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Basic Insights */}
            {analysisResults.insights && (
              <InsightCard
                insights={analysisResults.insights}
                dataSize={analysisResults.dataSize || { rows: 0, columns: 0 }}
                columnTypes={analysisResults.columnTypes || { numeric: 0, text: 0, date: 0 }}
              />
            )}

            {/* AI-Powered Insights */}
            {analysisResults.aiInsights && (
              <AIInsightsCard insights={analysisResults.aiInsights} />
            )}

            {/* AI-Powered Features */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <NaturalLanguageQuery 
                columnInfo={analysisResults.preview ? Object.keys(analysisResults.preview[0] || {}).map(col => ({
                  name: col,
                  type: 'text',
                  sampleValues: analysisResults.preview.slice(0, 3).map((row: any) => row[col])
                })) : []}
              />
              <ForecastCard 
                data={analysisResults.preview || []}
                numericColumns={Object.keys(analysisResults.columnTypes || {}).filter(type => 
                  analysisResults.columnTypes[type] > 0 && type === 'numeric'
                ).concat(
                  analysisResults.preview && analysisResults.preview.length > 0 
                    ? Object.keys(analysisResults.preview[0]).filter(col => 
                        !isNaN(Number(analysisResults.preview[0][col]))
                      )
                    : []
                )}
              />
            </div>

            {/* Charts */}
            {analysisResults.charts && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {analysisResults.charts.map((chart: any, index: number) => (
                  <div 
                    key={index}
                    className="animate-scale-in hover:scale-105 transition-transform duration-300"
                    style={{ animationDelay: `${0.1 * index}s` }}
                  >
                    <SimpleChartCard
                      title={chart.title}
                      type={chart.type}
                      data={chart.data}
                      description={chart.description}
                      config={chart.config}
                      originalData={analysisResults.preview || []}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Data Preview */}
            {analysisResults.preview && analysisResults.columns && (
              <DataTable
                data={analysisResults.preview}
                columns={analysisResults.columns}
                title="Data Preview"
                maxRows={10}
              />
            )}

          </div>
        )}

        {/* Getting Started */}
        {!analysisResults && !selectedFile && (
          <div className="text-center py-12 animate-fade-in-up">
            <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4 animate-pulse-slow" />
            <h3 className="text-lg font-medium text-foreground mb-2 animate-bounce-in">
              Ready to analyze your data?
            </h3>
            <p className="text-muted-foreground mb-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Upload a CSV file to get started with automated insights and visualizations.
            </p>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        amount={99000} // Example price in IDR
        currency="IDR"
      />
    </div>
  );
};

export default Dashboard;
