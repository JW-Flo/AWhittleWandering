import React, { useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, AlertCircle, Zap, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { calculateTripStatistics } from '@/utils/stateDetection';

interface CsvUploaderProps {
  onDataImported: (data: any[]) => void;
  onMapDataAvailable?: (locations: Array<{lat: number, lng: number, timestamp: string}>) => void;
}

const AdventureCsvUploader: React.FC<CsvUploaderProps> = ({ onDataImported, onMapDataAvailable }) => {
  const [dragOver, setDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importStats, setImportStats] = useState<{
    totalRecords: number;
    statesDetected: number;
    totalMiles: number;
    dateRange: { start: string; end: string } | null;
  } | null>(null);
  const { toast } = useToast();

  const processCSV = useCallback((csvText: string) => {
    try {
      const lines = csvText.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      console.log('CSV Headers found:', headers);
      
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const record: any = {};
        headers.forEach((header, index) => {
          record[header] = values[index];
        });
        return record;
      });

      console.log('Sample data record:', data[0]);

      // Use comprehensive state detection system
      const insights = calculateTripStatistics(data);
      
      // Extract location data for map if callback provided
      if (onMapDataAvailable) {
        const locations = data
          .filter(row => row['Latitude'] && row['Longitude'] && row['Timestamp (UTC)'])
          .map(row => ({
            lat: parseFloat(row['Latitude']),
            lng: parseFloat(row['Longitude']),
            timestamp: row['Timestamp (UTC)']
          }))
          .filter(loc => !isNaN(loc.lat) && !isNaN(loc.lng));
        
        onMapDataAvailable(locations);
      }
      
      const stats = {
        totalRecords: insights.totalRecords,
        statesDetected: insights.statesDetected.length,
        totalMiles: insights.totalMiles,
        dateRange: insights.startDate && insights.endDate ? {
          start: insights.startDate,
          end: insights.endDate
        } : null
      };

      console.log('Import stats:', stats);
      setImportStats(stats);
      onDataImported(data);
      
      toast({
        title: "🎉 Tesla Adventure Data Imported!",
        description: `Loaded ${data.length} records • ${insights.statesDetected.length} states • ${insights.totalMiles} miles`,
      });
      
    } catch (error) {
      console.error('CSV parsing error:', error);
      toast({
        title: "Import Failed",
        description: "Could not parse CSV file. Please check the format.",
        variant: "destructive"
      });
    }
  }, [onDataImported, toast]);


  const handleFile = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV file",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      setTimeout(() => {
        processCSV(csvText);
        setIsProcessing(false);
      }, 1000); // Add a brief delay for better UX
    };
    
    reader.onerror = () => {
      toast({
        title: "File Read Error",
        description: "Could not read the file. Please try again.",
        variant: "destructive"
      });
      setIsProcessing(false);
    };
    
    reader.readAsText(file);
  }, [processCSV, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  return (
    <Card className="story-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gradient">
          <Upload className="w-5 h-5" />
          Import Your Adventure Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
            dragOver
              ? 'border-[hsl(var(--adventure-orange))] bg-[hsl(var(--adventure-orange)/0.05)]'
              : 'border-[hsl(var(--tesla-gray-light))] hover:border-[hsl(var(--tesla-blue))] hover:bg-[hsl(var(--tesla-blue)/0.02)]'
          } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
        >
          {isProcessing ? (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-[hsl(var(--adventure-orange)/0.1)] rounded-full flex items-center justify-center">
                <Zap className="w-8 h-8 text-[hsl(var(--adventure-orange))] animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[hsl(var(--adventure-orange))]">
                  Processing Your Adventure...
                </h3>
                <p className="text-sm text-muted-foreground">
                  Analyzing your journey data and mapping your epic travels
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-[hsl(var(--tesla-blue)/0.1)] rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-[hsl(var(--tesla-blue))]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Drop Your TESSIE CSV Here</h3>
                <p className="text-sm text-muted-foreground">
                  Or click to browse your adventure files
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Supports CSV exports from TESSIE with location and timestamp data
                </p>
              </div>
              
              <Button className="mt-4 bg-[hsl(var(--adventure-orange))] hover:bg-[hsl(var(--adventure-orange))] hover:opacity-90">
                <Upload className="w-4 h-4 mr-2" />
                Choose Adventure File
              </Button>
            </div>
          )}

          <input
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        {/* Import Stats */}
        {importStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-[hsl(var(--adventure-green)/0.05)] rounded-lg border border-[hsl(var(--adventure-green)/0.2)]">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-[hsl(var(--adventure-green))]" />
                <span className="text-2xl font-bold text-[hsl(var(--adventure-green))]">
                  {importStats.totalRecords.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Records Imported</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-[hsl(var(--adventure-orange))]" />
                <span className="text-2xl font-bold text-[hsl(var(--adventure-orange))]">
                  {importStats.statesDetected}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">States Detected</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-[hsl(var(--adventure-gold))]" />
                <span className="text-2xl font-bold text-[hsl(var(--adventure-gold))]">
                  {importStats.totalMiles.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Miles Driven</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-[hsl(var(--tesla-blue))]" />
                <span className="text-sm font-bold text-[hsl(var(--tesla-blue))]">
                  {importStats.dateRange ? `${importStats.dateRange.start} - ${importStats.dateRange.end}` : 'N/A'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Date Range</p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="space-y-3 p-4 bg-[hsl(var(--tesla-gray)/0.3)] rounded-lg">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[hsl(var(--adventure-gold))]" />
            Expected CSV Format
          </h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Expected headers: <code className="bg-[hsl(var(--tesla-gray))] px-1 rounded">Timestamp (UTC), Latitude, Longitude, Shift State, Odometer (mi), Speed (mph)</code></p>
            <p>• Location data will be automatically parsed to track your state-by-state journey</p>
            <p>• The system will calculate miles driven from odometer readings and detect states from coordinates</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdventureCsvUploader;