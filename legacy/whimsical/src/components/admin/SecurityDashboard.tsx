import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Clock,
  Zap,
  Activity,
  ShieldAlert,
  ShieldCheck,
  History,
  Play,
  Settings
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface SecurityFinding {
  id: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  mitre_technique?: string;
  recommendation: string;
  auto_remediation_available: boolean;
  remediated?: boolean;
}

interface ScanResult {
  id: string;
  scan_type: string;
  status: string;
  trigger_source: string;
  total_findings: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  findings: SecurityFinding[];
  checks_performed: Record<string, { status: string; [key: string]: unknown }>;
  summary: { status: string; remediation_applied?: boolean; remediation_count?: number };
  remediation_applied: boolean;
  remediation_details: Array<{ finding_id: string; action: string; success: boolean; details: string }> | null;
  started_at: string;
  completed_at: string;
  created_at: string;
}

export function SecurityDashboard() {
  const { toast } = useToast();
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [autoRemediate, setAutoRemediate] = useState(false);
  const [selectedScan, setSelectedScan] = useState<ScanResult | null>(null);

  useEffect(() => {
    fetchScanResults();
  }, []);

  const fetchScanResults = async () => {
    try {
      const { data, error } = await supabase
        .from('security_scan_results')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      const typedData = (data || []).map(item => ({
        ...item,
        findings: (item.findings || []) as unknown as SecurityFinding[],
        checks_performed: (item.checks_performed || {}) as Record<string, { status: string; [key: string]: unknown }>,
        summary: (item.summary || {}) as { status: string; remediation_applied?: boolean; remediation_count?: number },
        remediation_details: item.remediation_details as Array<{ finding_id: string; action: string; success: boolean; details: string }> | null
      })) as ScanResult[];
      setScanResults(typedData);
      if (typedData.length > 0) {
        setSelectedScan(typedData[0]);
      }
    } catch (error) {
      console.error('Error fetching scan results:', error);
    } finally {
      setLoading(false);
    }
  };

  const runSecurityScan = async () => {
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke('security-audit', {
        body: { 
          trigger: 'manual',
          autoRemediate,
          scanType: 'full'
        }
      });

      if (error) throw error;

      toast({
        title: "Security Scan Complete",
        description: `Found ${data.findings?.length || 0} issues. ${autoRemediate ? `${data.remediation_actions?.filter((r: { success: boolean }) => r.success).length || 0} auto-remediated.` : ''}`,
      });

      await fetchScanResults();
    } catch (error) {
      console.error('Error running security scan:', error);
      toast({
        title: "Scan Failed",
        description: "Failed to run security scan",
        variant: "destructive"
      });
    } finally {
      setScanning(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <ShieldCheck className="w-5 h-5 text-green-500" />;
      case 'critical': return <ShieldAlert className="w-5 h-5 text-red-500" />;
      case 'high': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'medium': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default: return <Shield className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getCheckStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'fail': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const latestScan = scanResults[0];

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Security Scanner
          </h2>
          <p className="text-sm text-muted-foreground">
            Automated security monitoring with MITRE ATT&CK framework
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id="auto-remediate"
              checked={autoRemediate}
              onCheckedChange={setAutoRemediate}
            />
            <Label htmlFor="auto-remediate" className="text-sm">Auto-remediate</Label>
          </div>
          <Button onClick={runSecurityScan} disabled={scanning}>
            {scanning ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run Scan
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Current Status Overview */}
      {latestScan && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="card-nature">
            <CardContent className="p-4 text-center">
              <div className="flex justify-center mb-2">
                {getStatusIcon(latestScan.summary?.status || 'healthy')}
              </div>
              <p className="text-2xl font-bold capitalize">{latestScan.summary?.status || 'Unknown'}</p>
              <p className="text-xs text-muted-foreground">Overall Status</p>
            </CardContent>
          </Card>
          <Card className={`card-nature ${latestScan.critical_count > 0 ? 'border-red-500/50' : ''}`}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-500">{latestScan.critical_count}</p>
              <p className="text-xs text-muted-foreground">Critical</p>
            </CardContent>
          </Card>
          <Card className={`card-nature ${latestScan.high_count > 0 ? 'border-orange-500/50' : ''}`}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-orange-500">{latestScan.high_count}</p>
              <p className="text-xs text-muted-foreground">High</p>
            </CardContent>
          </Card>
          <Card className={`card-nature ${latestScan.medium_count > 0 ? 'border-yellow-500/50' : ''}`}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-500">{latestScan.medium_count}</p>
              <p className="text-xs text-muted-foreground">Medium</p>
            </CardContent>
          </Card>
          <Card className="card-nature">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-500">{latestScan.low_count}</p>
              <p className="text-xs text-muted-foreground">Low</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scan History */}
        <Card className="card-nature">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="w-4 h-4" />
              Scan History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {loading ? (
                  <div className="text-center py-4 text-muted-foreground">Loading...</div>
                ) : scanResults.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">No scans yet. Run your first scan!</div>
                ) : (
                  scanResults.map((scan) => (
                    <button
                      key={scan.id}
                      onClick={() => setSelectedScan(scan)}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        selectedScan?.id === scan.id 
                          ? 'bg-primary/10 border border-primary/30' 
                          : 'bg-secondary/50 hover:bg-secondary'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(scan.summary?.status || 'unknown')}
                          <span className="text-sm font-medium capitalize">
                            {scan.trigger_source}
                          </span>
                        </div>
                        <Badge variant={scan.status === 'completed' ? 'outline' : 'destructive'} className="text-xs">
                          {scan.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{scan.total_findings} findings</span>
                        <span>{formatDistanceToNow(new Date(scan.created_at), { addSuffix: true })}</span>
                      </div>
                      {scan.remediation_applied && (
                        <div className="mt-1">
                          <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-500">
                            <Zap className="w-3 h-3 mr-1" />
                            Auto-remediated
                          </Badge>
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Selected Scan Details */}
        <Card className="card-nature lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Scan Details
            </CardTitle>
            {selectedScan && (
              <CardDescription>
                {format(new Date(selectedScan.created_at), 'PPpp')}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {selectedScan ? (
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {/* Security Checks */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Security Checks</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(selectedScan.checks_performed || {}).map(([check, result]) => (
                        <div 
                          key={check} 
                          className="flex items-center gap-2 p-2 rounded bg-secondary/50 text-sm"
                        >
                          {getCheckStatusIcon(result.status)}
                          <span className="truncate">{check.replace(/_/g, ' ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Findings */}
                  {selectedScan.findings && selectedScan.findings.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Findings ({selectedScan.findings.length})</h4>
                      <Accordion type="single" collapsible className="space-y-2">
                        {selectedScan.findings.map((finding, idx) => (
                          <AccordionItem 
                            key={finding.id || idx} 
                            value={finding.id || String(idx)}
                            className="border rounded-lg px-3"
                          >
                            <AccordionTrigger className="py-2 hover:no-underline">
                              <div className="flex items-center gap-2 text-left">
                                <Badge className={`${getSeverityColor(finding.severity)} text-xs`}>
                                  {finding.severity}
                                </Badge>
                                <span className="text-sm font-medium">{finding.title}</span>
                                {finding.remediated && (
                                  <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-500">
                                    Fixed
                                  </Badge>
                                )}
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pb-3">
                              <div className="space-y-2 text-sm">
                                <p className="text-muted-foreground">{finding.description}</p>
                                {finding.mitre_technique && (
                                  <p className="text-xs">
                                    <span className="font-medium">MITRE:</span> {finding.mitre_technique}
                                  </p>
                                )}
                                <div className="bg-secondary/50 p-2 rounded">
                                  <p className="text-xs font-medium">Recommendation:</p>
                                  <p className="text-xs text-muted-foreground">{finding.recommendation}</p>
                                </div>
                                {finding.auto_remediation_available && !finding.remediated && (
                                  <Badge variant="outline" className="text-xs">
                                    <Zap className="w-3 h-3 mr-1" />
                                    Auto-remediation available
                                  </Badge>
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  )}

                  {/* Remediation Actions */}
                  {selectedScan.remediation_details && selectedScan.remediation_details.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Remediation Actions</h4>
                      <div className="space-y-2">
                        {selectedScan.remediation_details.map((action, idx) => (
                          <div 
                            key={idx}
                            className={`p-2 rounded text-sm ${
                              action.success ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {action.success ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                              <span className="font-medium">{action.action}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{action.details}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedScan.findings?.length === 0 && (
                    <div className="text-center py-8">
                      <ShieldCheck className="w-12 h-12 text-green-500 mx-auto mb-2" />
                      <p className="text-sm font-medium">All Clear!</p>
                      <p className="text-xs text-muted-foreground">No security issues detected in this scan.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Select a scan from the history to view details
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Schedule Info */}
      <Card className="card-nature">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Scheduled Scans</p>
              <p className="text-xs text-muted-foreground">
                Security scans run automatically every 6 hours to detect and remediate threats.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
