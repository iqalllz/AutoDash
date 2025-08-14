import Papa from 'papaparse';

export interface ColumnInfo {
  name: string;
  type: 'number' | 'text' | 'date';
  uniqueValues: number;
  nullCount: number;
  sampleValues: any[];
}

export interface DataAnalysisResult {
  data: any[];
  columns: ColumnInfo[];
  summary: {
    totalRows: number;
    totalColumns: number;
    numericColumns: string[];
    textColumns: string[];
    dateColumns: string[];
  };
  charts: ChartConfig[];
}

export interface ChartConfig {
  id: string;
  title: string;
  type: 'bar' | 'line' | 'pie';
  data: any[];
  description: string;
  dataKey?: string;
  xAxisKey?: string;
}

export function parseCSV(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(`CSV parsing error: ${results.errors[0].message}`));
        } else {
          resolve(results.data);
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

export function analyzeColumns(data: any[]): ColumnInfo[] {
  if (data.length === 0) return [];
  
  const columns = Object.keys(data[0]);
  
  return columns.map(column => {
    const values = data.map(row => row[column]).filter(val => val !== null && val !== undefined && val !== '');
    const uniqueValues = new Set(values).size;
    const nullCount = data.length - values.length;
    
    // Determine column type
    let type: 'number' | 'text' | 'date' = 'text';
    
    // Check if numeric
    const numericValues = values.filter(val => !isNaN(Number(val)) && isFinite(Number(val)));
    if (numericValues.length / values.length > 0.8) {
      type = 'number';
    }
    
    // Check if date
    const dateValues = values.filter(val => {
      const dateVal = new Date(val);
      return !isNaN(dateVal.getTime()) && val.toString().match(/\d{1,4}[-\/]\d{1,2}[-\/]\d{1,4}/);
    });
    if (dateValues.length / values.length > 0.6) {
      type = 'date';
    }
    
    return {
      name: column,
      type,
      uniqueValues,
      nullCount,
      sampleValues: values.slice(0, 5)
    };
  });
}

export function generateChartConfigs(data: any[], columns: ColumnInfo[]): ChartConfig[] {
  const charts: ChartConfig[] = [];
  
  const numericColumns = columns.filter(col => col.type === 'number');
  const textColumns = columns.filter(col => col.type === 'text' && col.uniqueValues < 20);
  const dateColumns = columns.filter(col => col.type === 'date');
  
  // 1. Categorical bar charts (text columns with numeric aggregation)
  textColumns.forEach(textCol => {
    numericColumns.forEach(numCol => {
      const aggregatedData = aggregateByCategory(data, textCol.name, numCol.name);
      if (aggregatedData.length > 1 && aggregatedData.length <= 15) {
        charts.push({
          id: `bar_${textCol.name}_${numCol.name}`,
          title: `${numCol.name} by ${textCol.name}`,
          type: 'bar',
          data: aggregatedData,
          description: `Distribution of ${numCol.name} across different ${textCol.name} categories`,
          dataKey: 'value',
          xAxisKey: 'name'
        });
      }
    });
  });
  
  // 2. Time series line charts
  if (dateColumns.length > 0 && numericColumns.length > 0) {
    const dateCol = dateColumns[0];
    numericColumns.slice(0, 2).forEach(numCol => {
      const timeSeriesData = aggregateByTime(data, dateCol.name, numCol.name);
      if (timeSeriesData.length > 2) {
        charts.push({
          id: `line_${dateCol.name}_${numCol.name}`,
          title: `${numCol.name} over ${dateCol.name}`,
          type: 'line',
          data: timeSeriesData,
          description: `Trend of ${numCol.name} over time`,
          dataKey: 'value',
          xAxisKey: 'name'
        });
      }
    });
  }
  
  // 3. Pie charts for categorical distributions
  textColumns.slice(0, 2).forEach(textCol => {
    if (textCol.uniqueValues <= 8) {
      const pieData = getCategoryDistribution(data, textCol.name);
      charts.push({
        id: `pie_${textCol.name}`,
        title: `Distribution of ${textCol.name}`,
        type: 'pie',
        data: pieData,
        description: `Breakdown of records by ${textCol.name}`,
        dataKey: 'value'
      });
    }
  });
  
  // 4. Top N charts for high-cardinality categories
  textColumns.forEach(textCol => {
    if (textCol.uniqueValues > 8 && textCol.uniqueValues < 100) {
      const topData = getTopCategories(data, textCol.name, 10);
      charts.push({
        id: `top_${textCol.name}`,
        title: `Top 10 ${textCol.name}`,
        type: 'bar',
        data: topData,
        description: `Most frequent values in ${textCol.name}`,
        dataKey: 'value',
        xAxisKey: 'name'
      });
    }
  });
  
  return charts.slice(0, 6); // Limit to 6 charts for performance
}

interface GroupedData {
  total: number;
  count: number;
}

function aggregateByCategory(data: any[], categoryCol: string, valueCol: string): any[] {
  const grouped: Record<string, GroupedData> = {};
  
  data.forEach(row => {
    const category = row[categoryCol] || 'Unknown';
    const value = parseFloat(row[valueCol]) || 0;
    
    if (!grouped[category]) {
      grouped[category] = { total: 0, count: 0 };
    }
    grouped[category].total += value;
    grouped[category].count += 1;
  });
  
  return Object.entries(grouped)
    .map(([name, stats]) => ({
      name,
      value: Math.round(stats.total * 100) / 100 // Round to 2 decimal places
    }))
    .sort((a, b) => b.value - a.value);
}

function aggregateByTime(data: any[], dateCol: string, valueCol: string): any[] {
  const grouped: Record<string, GroupedData> = {};
  
  data.forEach(row => {
    const dateStr = row[dateCol];
    if (!dateStr) return;
    
    try {
      const date = new Date(dateStr);
      const key = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      const value = parseFloat(row[valueCol]) || 0;
      
      if (!grouped[key]) {
        grouped[key] = { total: 0, count: 0 };
      }
      grouped[key].total += value;
      grouped[key].count += 1;
    } catch (e) {
      // Skip invalid dates
    }
  });
  
  return Object.entries(grouped)
    .map(([name, stats]) => ({
      name: new Date(name).toLocaleDateString(),
      value: Math.round(stats.total * 100) / 100
    }))
    .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());
}

function getCategoryDistribution(data: any[], column: string): any[] {
  const counts: Record<string, number> = {};
  
  data.forEach(row => {
    const value = row[column] || 'Unknown';
    counts[value] = (counts[value] || 0) + 1;
  });
  
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function getTopCategories(data: any[], column: string, topN: number = 10): any[] {
  const distribution = getCategoryDistribution(data, column);
  return distribution.slice(0, topN);
}

export function generateInsights(data: any[], columns: ColumnInfo[]): string[] {
  const insights: string[] = [];
  
  // Basic stats
  insights.push(`📊 Your dataset contains ${data.length.toLocaleString()} rows and ${columns.length} columns.`);
  
  // Column type breakdown
  const numericCount = columns.filter(col => col.type === 'number').length;
  const textCount = columns.filter(col => col.type === 'text').length;
  const dateCount = columns.filter(col => col.type === 'date').length;
  
  if (numericCount > 0) {
    insights.push(`🔢 Found ${numericCount} numeric column${numericCount !== 1 ? 's' : ''} for quantitative analysis.`);
  }
  
  if (textCount > 0) {
    insights.push(`📝 Found ${textCount} categorical column${textCount !== 1 ? 's' : ''} for grouping and segmentation.`);
  }
  
  if (dateCount > 0) {
    insights.push(`📅 Found ${dateCount} date column${dateCount !== 1 ? 's' : ''} for time-based analysis.`);
  }
  
  // Data quality insights
  const columnsWithNulls = columns.filter(col => col.nullCount > 0);
  if (columnsWithNulls.length > 0) {
    insights.push(`⚠️ ${columnsWithNulls.length} column${columnsWithNulls.length !== 1 ? 's have' : ' has'} missing values that may affect analysis.`);
  }
  
  // High cardinality warning
  const highCardinalityColumns = columns.filter(col => col.uniqueValues > data.length * 0.8);
  if (highCardinalityColumns.length > 0) {
    insights.push(`🔍 ${highCardinalityColumns.length} column${highCardinalityColumns.length !== 1 ? 's appear' : ' appears'} to contain unique identifiers.`);
  }
  
  return insights;
}

export function analyzeData(data: any[]): DataAnalysisResult {
  const columns = analyzeColumns(data);
  const charts = generateChartConfigs(data, columns);
  
  const summary = {
    totalRows: data.length,
    totalColumns: columns.length,
    numericColumns: columns.filter(col => col.type === 'number').map(col => col.name),
    textColumns: columns.filter(col => col.type === 'text').map(col => col.name),
    dateColumns: columns.filter(col => col.type === 'date').map(col => col.name),
  };
  
  return {
    data,
    columns,
    summary,
    charts
  };
}