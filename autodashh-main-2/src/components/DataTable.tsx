import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Database } from 'lucide-react';

interface DataTableProps {
  data: any[];
  columns: string[];
  title?: string;
  maxRows?: number;
}

export function DataTable({ data, columns, title = "Data Preview", maxRows = 10 }: DataTableProps) {
  const displayData = data.slice(0, maxRows);
  const totalRows = data.length;

  const getColumnType = (columnName: string, data: any[]) => {
    if (data.length === 0) return 'text';
    
    const sample = data.find(row => row[columnName] !== null && row[columnName] !== '');
    if (!sample) return 'text';
    
    const value = sample[columnName];
    
    // Check if it's a number
    if (!isNaN(Number(value)) && isFinite(Number(value))) {
      return 'number';
    }
    
    // Check if it's a date
    const dateValue = new Date(value);
    if (!isNaN(dateValue.getTime()) && value.toString().match(/\d{1,4}[-\/]\d{1,2}[-\/]\d{1,4}/)) {
      return 'date';
    }
    
    return 'text';
  };

  const formatCellValue = (value: any, type: string) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-muted-foreground italic">—</span>;
    }
    
    if (type === 'number') {
      const num = Number(value);
      if (Number.isInteger(num)) {
        return num.toLocaleString();
      } else {
        return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
      }
    }
    
    if (type === 'date') {
      try {
        return new Date(value).toLocaleDateString();
      } catch {
        return value;
      }
    }
    
    // Truncate long text
    const strValue = String(value);
    if (strValue.length > 50) {
      return (
        <span title={strValue}>
          {strValue.substring(0, 47)}...
        </span>
      );
    }
    
    return strValue;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'number': return 'bg-chart-1/10 text-chart-1 border-chart-1/20';
      case 'date': return 'bg-chart-2/10 text-chart-2 border-chart-2/20';
      default: return 'bg-muted/50 text-muted-foreground border-muted';
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">
            {totalRows.toLocaleString()} rows × {columns.length} columns
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                {columns.map((column) => {
                  const type = getColumnType(column, data);
                  return (
                    <TableHead key={column} className="font-semibold">
                      <div className="flex items-center gap-2">
                        <span>{column}</span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs px-1.5 py-0.5 ${getTypeColor(type)}`}
                        >
                          {type}
                        </Badge>
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((row, index) => (
                <TableRow key={index} className="hover:bg-muted/20">
                  {columns.map((column) => {
                    const type = getColumnType(column, data);
                    return (
                      <TableCell key={`${index}-${column}`} className="py-3">
                        {formatCellValue(row[column], type)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {totalRows > maxRows && (
          <div className="p-4 text-center text-sm text-muted-foreground bg-muted/20 border-t">
            Showing {maxRows} of {totalRows.toLocaleString()} rows
          </div>
        )}
      </CardContent>
    </Card>
  );
}