import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Database,
  MapPin,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ImportStats {
  totalRows: number;
  headers: string[];
  preview: string[][];
  dateRange: { start: string; end: string };
}

interface CSVImportProps {
  journeyId: string;
  onImportComplete?: (count: number) => void;
  className?: string;
}

export default function CSVImport({ journeyId, onImportComplete, className = '' }: CSVImportProps) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<string[][] | null>(null);
  const [stats, setStats] = useState<ImportStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{ inserted: number; skipped: number } | null>(null);

  const parseCSV = useCallback((text: string): string[][] => {
    const lines = text.split('\n');
    return lines.map(line => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    }).filter(row => row.length > 1 && row.some(cell => cell.length > 0));
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError(null);
    setImportResult(null);
    setFile(selectedFile);
    setIsLoading(true);

    try {
      const text = await selectedFile.text();
      const data = parseCSV(text);
      setParsedData(data);

      // Calculate preview stats locally
      const headers = data[0];
      const stats: ImportStats = {
        totalRows: data.length - 1,
        headers,
        preview: data.slice(1, 6),
        dateRange: {
          start: data[1]?.[0] || '',
          end: data[data.length - 1]?.[0] || ''
        }
      };
      setStats(stats);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV');
    } finally {
      setIsLoading(false);
    }
  }, [parseCSV]);

  const handleImport = useCallback(async () => {
    if (!parsedData || !user || !journeyId) {
      setError('Missing required data for import');
      return;
    }

    setIsImporting(true);
    setProgress(0);
    setError(null);

    try {
      // Split into chunks for progress tracking
      const chunkSize = 5000;
      const totalChunks = Math.ceil((parsedData.length - 1) / chunkSize);
      let totalInserted = 0;
      let totalSkipped = 0;

      for (let i = 0; i < totalChunks; i++) {
        const start = 1 + (i * chunkSize);
        const end = Math.min(start + chunkSize, parsedData.length);
        const chunk = [parsedData[0], ...parsedData.slice(start, end)];

        const { data, error: fnError } = await supabase.functions.invoke('csv-import', {
          body: {
            action: 'import_drive_data',
            data: chunk,
            journey_id: journeyId,
            user_id: user.id
          }
        });

        if (fnError) throw new Error(fnError.message);
        if (data.error) throw new Error(data.error);

        totalInserted += data.inserted || 0;
        totalSkipped += data.skipped || 0;
        setProgress(Math.round(((i + 1) / totalChunks) * 100));
      }

      setImportResult({ inserted: totalInserted, skipped: totalSkipped });
      toast.success(`Imported ${totalInserted.toLocaleString()} GPS points`);
      onImportComplete?.(totalInserted);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Import failed';
      setError(message);
      toast.error(message);
    } finally {
      setIsImporting(false);
    }
  }, [parsedData, user, journeyId, onImportComplete]);

  const resetImport = () => {
    setFile(null);
    setParsedData(null);
    setStats(null);
    setError(null);
    setImportResult(null);
    setProgress(0);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          Import GPS Data
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* File Upload */}
        {!file && (
          <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
            <Upload className="w-10 h-10 text-muted-foreground mb-3" />
            <span className="text-sm font-medium">Drop TeslaFi CSV here or click to browse</span>
            <span className="text-xs text-muted-foreground mt-1">Supports TeslaFi and TeslaMate exports</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3">Parsing CSV...</span>
          </div>
        )}

        {/* File Info & Preview */}
        {file && stats && !importResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <FileText className="w-8 h-8 text-primary" />
              <div className="flex-1">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={resetImport}>
                Change
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <MapPin className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold">{stats.totalRows.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">GPS Points</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <Calendar className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-sm font-medium">{stats.dateRange.start.split(' ')[0]}</p>
                <p className="text-xs text-muted-foreground">Start Date</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <Calendar className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-sm font-medium">{stats.dateRange.end.split(' ')[0]}</p>
                <p className="text-xs text-muted-foreground">End Date</p>
              </div>
            </div>

            {/* Detected Headers */}
            <div>
              <p className="text-sm font-medium mb-2">Detected Columns:</p>
              <div className="flex flex-wrap gap-1">
                {stats.headers.slice(0, 10).map((h, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {h.replace(/"/g, '')}
                  </Badge>
                ))}
                {stats.headers.length > 10 && (
                  <Badge variant="secondary" className="text-xs">
                    +{stats.headers.length - 10} more
                  </Badge>
                )}
              </div>
            </div>

            {/* Import Progress */}
            {isImporting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Importing...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Actions */}
            {!isImporting && (
              <div className="flex gap-3">
                <Button onClick={handleImport} className="flex-1">
                  <Database className="w-4 h-4 mr-2" />
                  Import {stats.totalRows.toLocaleString()} Points
                </Button>
                <Button variant="outline" onClick={resetImport}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Success */}
        {importResult && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Import Complete!</h3>
              <p className="text-muted-foreground">
                Successfully imported {importResult.inserted.toLocaleString()} GPS points
              </p>
              {importResult.skipped > 0 && (
                <p className="text-sm text-yellow-600">
                  {importResult.skipped.toLocaleString()} rows skipped (invalid data)
                </p>
              )}
            </div>
            <Button onClick={resetImport} variant="outline">
              Import More Data
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
