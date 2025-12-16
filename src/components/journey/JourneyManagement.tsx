import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Archive, 
  ArchiveRestore, 
  Download, 
  Trash2, 
  Calendar,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { format as formatDate, formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileJson, FileSpreadsheet, ChevronDown } from 'lucide-react';

interface Journey {
  id: string;
  name: string;
  start_date: string;
  end_date: string | null;
  archived_at: string | null;
  archive_expires_at: string | null;
  export_generated_at: string | null;
  total_miles: number | null;
  cloudflare_d1_id: string | null;
}

interface JourneyManagementProps {
  journey: Journey;
  onUpdate: () => void;
}

export function JourneyManagement({ journey, onUpdate }: JourneyManagementProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUnarchiving, setIsUnarchiving] = useState(false);

  const isArchived = !!journey.archived_at;

  const handleExport = async (format: 'json' | 'csv' = 'json') => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('journey-storage', {
        body: { action: 'export', journeyId: journey.id },
      });

      if (error) throw error;

      let blob: Blob;
      let filename: string;

      if (format === 'csv') {
        // Convert to CSV
        const csvContent = convertToCSV(data.data);
        blob = new Blob([csvContent], { type: 'text/csv' });
        filename = `${journey.name.replace(/\s+/g, '-').toLowerCase()}-export-${formatDate(new Date(), 'yyyy-MM-dd')}.csv`;
      } else {
        blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        filename = `${journey.name.replace(/\s+/g, '-').toLowerCase()}-export-${formatDate(new Date(), 'yyyy-MM-dd')}.json`;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export Complete',
        description: `Downloaded ${data.data.drives.length} drives and ${data.data.charges.length} charging sessions as ${format.toUpperCase()}.`,
      });
    } catch (err: any) {
      toast({
        title: 'Export Failed',
        description: err.message || 'Failed to export journey data.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const convertToCSV = (data: { drives: any[]; charges: any[] }): string => {
    const lines: string[] = [];
    
    // Drives section
    if (data.drives.length > 0) {
      lines.push('# DRIVES');
      const driveHeaders = Object.keys(data.drives[0]);
      lines.push(driveHeaders.join(','));
      data.drives.forEach(drive => {
        lines.push(driveHeaders.map(h => `"${drive[h] ?? ''}"`).join(','));
      });
    }
    
    lines.push('');
    
    // Charges section
    if (data.charges.length > 0) {
      lines.push('# CHARGING SESSIONS');
      const chargeHeaders = Object.keys(data.charges[0]);
      lines.push(chargeHeaders.join(','));
      data.charges.forEach(charge => {
        lines.push(chargeHeaders.map(h => `"${charge[h] ?? ''}"`).join(','));
      });
    }
    
    return lines.join('\n');
  };

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      const { data, error } = await supabase.functions.invoke('journey-storage', {
        body: { action: 'archive', journeyId: journey.id },
      });

      if (error) throw error;

      toast({
        title: 'Journey Archived',
        description: `"${journey.name}" archived. Data expires in ${data.retentionDays} days (${data.isActiveUser ? 'active' : 'inactive'} account).`,
      });
      onUpdate();
    } catch (err: any) {
      toast({
        title: 'Archive Failed',
        description: err.message || 'Failed to archive journey.',
        variant: 'destructive',
      });
    } finally {
      setIsArchiving(false);
    }
  };

  const handleUnarchive = async () => {
    setIsUnarchiving(true);
    try {
      const { error } = await supabase.functions.invoke('journey-storage', {
        body: { action: 'unarchive', journeyId: journey.id },
      });

      if (error) throw error;

      toast({
        title: 'Journey Restored',
        description: `"${journey.name}" has been restored to active journeys.`,
      });
      onUpdate();
    } catch (err: any) {
      toast({
        title: 'Restore Failed',
        description: err.message || 'Failed to restore journey.',
        variant: 'destructive',
      });
    } finally {
      setIsUnarchiving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('journey-storage', {
        body: { action: 'delete', journeyId: journey.id },
      });

      if (error) throw error;

      toast({
        title: 'Journey Deleted',
        description: `"${journey.name}" and all associated data have been permanently deleted.`,
      });
      onUpdate();
    } catch (err: any) {
      toast({
        title: 'Delete Failed',
        description: err.message || 'Failed to delete journey.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className={isArchived ? 'border-muted bg-muted/20' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {journey.name}
              {isArchived && (
                <Badge variant="secondary" className="font-normal">
                  <Archive className="w-3 h-3 mr-1" />
                  Archived
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Calendar className="w-3 h-3" />
              {formatDate(new Date(journey.start_date), 'MMM d, yyyy')}
              {journey.end_date && ` - ${formatDate(new Date(journey.end_date), 'MMM d, yyyy')}`}
              {journey.total_miles && (
                <span className="text-muted-foreground">• {Math.round(journey.total_miles).toLocaleString()} miles</span>
              )}
            </CardDescription>
          </div>
        </div>

        {isArchived && journey.archive_expires_at && (
          <div className="flex items-center gap-2 mt-2 text-sm text-amber-600 dark:text-amber-500">
            <Clock className="w-4 h-4" />
            <span>
              Expires {formatDistanceToNow(new Date(journey.archive_expires_at), { addSuffix: true })}
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="flex flex-wrap gap-2">
          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isExporting || !journey.cloudflare_d1_id}
              >
                {isExporting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('json')}>
                <FileJson className="w-4 h-4 mr-2" />
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Archive/Unarchive Button */}
          {isArchived ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnarchive}
              disabled={isUnarchiving}
            >
              {isUnarchiving ? (
                <>
                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Restoring...
                </>
              ) : (
                <>
                  <ArchiveRestore className="w-4 h-4 mr-2" />
                  Restore
                </>
              )}
            </Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={isArchiving}>
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Archive "{journey.name}"?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p>Archiving moves this journey to cold storage and frees up a journey slot.</p>
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3 text-amber-700 dark:text-amber-400">
                      <p className="font-medium flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Retention Policy
                      </p>
                      <ul className="text-sm mt-1 ml-6 list-disc">
                        <li>Active accounts (monthly login): 1 year</li>
                        <li>Inactive accounts: 90 days</li>
                      </ul>
                      <p className="text-sm mt-2">Export your data before archiving to keep it permanently.</p>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleArchive} disabled={isArchiving}>
                    {isArchiving ? 'Archiving...' : 'Archive Journey'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Delete Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isDeleting}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Permanently Delete Journey?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>This will permanently delete "{journey.name}" and all associated data:</p>
                  <ul className="text-sm ml-4 list-disc">
                    <li>All drive telemetry data</li>
                    <li>Charging session records</li>
                    <li>Journal entries and photos</li>
                    <li>States visited records</li>
                    <li>Cloud database storage</li>
                  </ul>
                  <p className="font-medium text-destructive">This action cannot be undone.</p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete Permanently'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
