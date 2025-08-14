import React, { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isLoading?: boolean;
}

export function FileUpload({ onFileUpload, isLoading = false }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles[0]);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xlsx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false,
    disabled: isLoading
  });

  return (
    <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-all duration-500 hover:shadow-upload hover:scale-105 animate-fade-in">
      <div
        {...getRootProps()}
        className={cn(
          "flex flex-col items-center justify-center p-12 text-center cursor-pointer",
          "hover:bg-gradient-hero transition-all duration-300",
          isDragActive && "border-primary bg-gradient-hero animate-pulse",
          isLoading && "cursor-not-allowed opacity-60"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-4">
          <div className={cn(
            "p-4 rounded-full bg-gradient-primary transition-all duration-300 animate-glow",
            isDragActive && "scale-110 animate-bounce-in",
            isLoading && "animate-pulse-slow"
          )}>
            {isLoading ? (
              <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Upload className="w-8 h-8 text-white animate-fade-in" />
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground animate-fade-in-up">
              {isLoading ? 'Processing your file...' : 'Upload your CSV file'}
            </h3>
            <p className="text-muted-foreground max-w-md animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              {isLoading 
                ? 'Please wait while we analyze your data and create insights.'
                : 'Drag and drop your CSV file here, or click to browse. We\'ll automatically generate charts and insights for you.'
              }
            </p>
          </div>
          
          {!isLoading && (
            <Button variant="default" size="lg" className="mt-4 animate-bounce-in hover:scale-105 transition-all duration-300 bg-primary hover:bg-primary-hover shadow-card hover:shadow-upload" style={{ animationDelay: '0.4s' }}>
              <FileSpreadsheet className="w-5 h-5 mr-2" />
              Choose File
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}