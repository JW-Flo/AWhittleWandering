import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  Upload, 
  Save, 
  Loader2, 
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
  Edit3,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

interface FlagshipWaypoint {
  id: string;
  waypoint_number: number;
  name: string;
  location: string;
  state_code: string;
  waypoint_type: string;
  dwell_minutes: number;
  arrived_at: string;
  description: string | null;
  people_met: string[] | null;
  is_highlight: boolean;
}

export function WaypointDetailsEditor() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [waypoints, setWaypoints] = useState<FlagshipWaypoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editPeopleMet, setEditPeopleMet] = useState('');

  const fetchWaypoints = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('flagship_waypoints')
      .select('id, waypoint_number, name, location, state_code, waypoint_type, dwell_minutes, arrived_at, description, people_met, is_highlight')
      .order('waypoint_number');
    
    if (error) {
      toast({
        title: "Error fetching waypoints",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setWaypoints(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWaypoints();
  }, []);

  const startEditing = (wp: FlagshipWaypoint) => {
    setEditingId(wp.id);
    setEditDescription(wp.description || '');
    setEditPeopleMet(wp.people_met?.join(', ') || '');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditDescription('');
    setEditPeopleMet('');
  };

  const saveWaypoint = async (id: string) => {
    setSaving(true);
    const peopleMet = editPeopleMet.trim() 
      ? editPeopleMet.split(',').map(p => p.trim()).filter(Boolean)
      : null;

    const { error } = await supabase
      .from('flagship_waypoints')
      .update({
        description: editDescription.trim() || null,
        people_met: peopleMet
      })
      .eq('id', id);

    if (error) {
      toast({
        title: "Error saving waypoint",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Waypoint updated",
        description: "Description and people saved successfully"
      });
      await fetchWaypoints();
      cancelEditing();
    }
    setSaving(false);
  };

  const exportCSV = () => {
    const headers = ['waypoint_number', 'name', 'state_code', 'waypoint_type', 'arrival_date', 'dwell_minutes', 'description', 'people_met'];
    const rows = waypoints.map(wp => [
      wp.waypoint_number,
      `"${wp.name.replace(/"/g, '""')}"`,
      wp.state_code,
      wp.waypoint_type,
      format(new Date(wp.arrived_at), 'yyyy-MM-dd'),
      wp.dwell_minutes,
      `"${(wp.description || '').replace(/"/g, '""')}"`,
      `"${(wp.people_met || []).join(', ').replace(/"/g, '""')}"`
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waypoint-details-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "CSV Exported",
      description: `${waypoints.length} waypoints exported for editing`
    });
  };

  const importCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim());
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const wpNumIdx = headers.indexOf('waypoint_number');
    const descIdx = headers.indexOf('description');
    const peopleIdx = headers.indexOf('people_met');

    if (wpNumIdx === -1 || descIdx === -1) {
      toast({
        title: "Invalid CSV format",
        description: "CSV must have waypoint_number and description columns",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    let updated = 0;
    let errors = 0;

    for (let i = 1; i < lines.length; i++) {
      // Parse CSV properly handling quoted fields
      const row = parseCSVRow(lines[i]);
      if (!row || row.length < Math.max(wpNumIdx, descIdx, peopleIdx) + 1) continue;

      const waypointNumber = parseInt(row[wpNumIdx]);
      const description = row[descIdx]?.trim() || null;
      const peopleMet = peopleIdx !== -1 && row[peopleIdx]?.trim()
        ? row[peopleIdx].split(',').map(p => p.trim()).filter(Boolean)
        : null;

      if (isNaN(waypointNumber)) continue;

      const { error } = await supabase
        .from('flagship_waypoints')
        .update({ description, people_met: peopleMet })
        .eq('waypoint_number', waypointNumber);

      if (error) {
        errors++;
        console.error(`Error updating waypoint ${waypointNumber}:`, error);
      } else {
        updated++;
      }
    }

    await fetchWaypoints();
    setSaving(false);

    toast({
      title: "CSV Import Complete",
      description: `Updated ${updated} waypoints${errors > 0 ? `, ${errors} errors` : ''}`,
      variant: errors > 0 ? "destructive" : "default"
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Parse CSV row handling quoted fields
  const parseCSVRow = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const needsDescription = waypoints.filter(w => !w.description).length;
  const hasDescription = waypoints.filter(w => w.description).length;

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats and Actions */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Waypoint Details Editor
              </CardTitle>
              <CardDescription>
                Add descriptions and people met for each waypoint
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchWaypoints}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status */}
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="outline" className="gap-1">
              <MapPin className="w-3 h-3" />
              {waypoints.length} total
            </Badge>
            {hasDescription > 0 && (
              <Badge variant="outline" className="gap-1 bg-success/10 text-success border-success/20">
                <CheckCircle2 className="w-3 h-3" />
                {hasDescription} with details
              </Badge>
            )}
            {needsDescription > 0 && (
              <Badge variant="outline" className="gap-1 bg-warning/10 text-warning border-warning/20">
                <AlertCircle className="w-3 h-3" />
                {needsDescription} need details
              </Badge>
            )}
          </div>

          {/* Export/Import Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fileInputRef.current?.click()}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Import CSV
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={importCSV}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Waypoint List */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Waypoints Needing Details</CardTitle>
          <CardDescription>
            Click edit to add description and people met
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {waypoints.map((wp) => (
                <div 
                  key={wp.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    wp.description 
                      ? 'border-success/30 bg-success/5' 
                      : 'border-border/50 bg-muted/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-muted-foreground">
                          #{wp.waypoint_number}
                        </span>
                        <span className="font-medium">{wp.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {wp.state_code}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            wp.waypoint_type === 'overnight' ? 'bg-primary/10 text-primary' :
                            wp.waypoint_type === 'destination' ? 'bg-accent/10 text-accent' :
                            ''
                          }`}
                        >
                          {wp.waypoint_type}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(new Date(wp.arrived_at), 'MMM d, yyyy')} · {wp.dwell_minutes} min
                      </div>

                      {editingId === wp.id ? (
                        <div className="mt-3 space-y-3">
                          <div>
                            <label className="text-xs text-muted-foreground">Description</label>
                            <Textarea
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              placeholder="What happened here? What made this stop memorable?"
                              className="mt-1 text-sm"
                              rows={3}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">People Met (comma-separated)</label>
                            <Input
                              value={editPeopleMet}
                              onChange={(e) => setEditPeopleMet(e.target.value)}
                              placeholder="Jack, Sarah, John"
                              className="mt-1 text-sm"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => saveWaypoint(wp.id)}
                              disabled={saving}
                            >
                              {saving ? (
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4 mr-1" />
                              )}
                              Save
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={cancelEditing}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {wp.description && (
                            <p className="text-sm mt-2 text-foreground/80">
                              {wp.description}
                            </p>
                          )}
                          {wp.people_met && wp.people_met.length > 0 && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {wp.people_met.map((person, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {person}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {editingId !== wp.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(wp)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
