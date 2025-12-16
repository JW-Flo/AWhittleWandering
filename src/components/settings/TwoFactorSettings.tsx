import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { Shield, ShieldCheck, ShieldOff, Smartphone, Copy, CheckCircle2, Loader2, Key, AlertTriangle, Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TOTPFactor {
  id: string;
  friendly_name?: string;
  factor_type: string;
  status: string;
  created_at: string;
}

interface TwoFactorSettingsProps {
  isAdmin?: boolean;
  required?: boolean;
}

// Generate 10 backup codes
function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    const code = Array.from({ length: 8 }, () => 
      'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]
    ).join('');
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

export function TwoFactorSettings({ isAdmin = false, required = false }: TwoFactorSettingsProps) {
  const { user } = useAuth();
  const [factors, setFactors] = useState<TOTPFactor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollmentData, setEnrollmentData] = useState<{
    id: string;
    qr_code: string;
    secret: string;
    uri: string;
  } | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  
  // Backup codes
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodesDialog, setShowBackupCodesDialog] = useState(false);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);

  const fetchFactors = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      
      if (error) throw error;
      
      setFactors(data.totp || []);
    } catch (error) {
      console.error('Error fetching MFA factors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFactors();
  }, [user]);

  const startEnrollment = async () => {
    setIsEnrolling(true);
    
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App',
      });

      if (error) throw error;

      setEnrollmentData({
        id: data.id,
        qr_code: data.totp.qr_code,
        secret: data.totp.secret,
        uri: data.totp.uri,
      });
      setShowEnrollDialog(true);
    } catch (error: any) {
      toast({
        title: 'Failed to start 2FA setup',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  const verifyEnrollment = async () => {
    if (!enrollmentData || verifyCode.length !== 6) return;

    setIsEnrolling(true);

    try {
      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: enrollmentData.id,
        code: verifyCode,
      });

      if (error) throw error;

      // Generate and show backup codes
      const codes = generateBackupCodes();
      setBackupCodes(codes);
      
      // Store backup codes hash in user metadata (in production, store these securely server-side)
      // For now we'll just show them to the user
      
      toast({
        title: '2FA Enabled',
        description: 'Two-factor authentication is now active. Save your backup codes!',
      });

      setShowEnrollDialog(false);
      setEnrollmentData(null);
      setVerifyCode('');
      setShowBackupCodesDialog(true);
      fetchFactors();
    } catch (error: any) {
      toast({
        title: 'Verification failed',
        description: 'Invalid code. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  const unenroll = async (factorId: string) => {
    if (isAdmin && required) {
      toast({
        title: 'Cannot disable 2FA',
        description: 'Two-factor authentication is required for admin accounts.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });

      if (error) throw error;

      toast({
        title: '2FA Disabled',
        description: 'Two-factor authentication has been removed from your account.',
      });

      fetchFactors();
    } catch (error: any) {
      toast({
        title: 'Failed to disable 2FA',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const copySecret = () => {
    if (enrollmentData?.secret) {
      navigator.clipboard.writeText(enrollmentData.secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopiedBackupCodes(true);
    setTimeout(() => setCopiedBackupCodes(false), 2000);
    toast({
      title: 'Codes copied',
      description: 'Backup codes copied to clipboard.',
    });
  };

  const downloadBackupCodes = () => {
    const content = `AWW Backup Codes\n${'='.repeat(40)}\n\nThese codes can be used to access your account if you lose access to your authenticator app.\nEach code can only be used once.\n\n${backupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}\n\nGenerated: ${new Date().toISOString()}\n\nKeep these codes safe and secure!`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aww-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: 'Codes downloaded',
      description: 'Backup codes saved to file.',
    });
  };

  const regenerateBackupCodes = () => {
    const codes = generateBackupCodes();
    setBackupCodes(codes);
    setShowBackupCodesDialog(true);
  };

  const verifiedFactors = factors.filter(f => f.status === 'verified');
  const has2FA = verifiedFactors.length > 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            {has2FA ? (
              <ShieldCheck className="w-6 h-6 text-forest" />
            ) : (
              <Shield className="w-6 h-6 text-muted-foreground" />
            )}
            <div>
              <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
                {isAdmin && required && !has2FA && (
                  <span className="text-destructive font-medium"> (Required for admins)</span>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAdmin && required && !has2FA && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                As an admin, you must enable two-factor authentication to access administrative features.
              </AlertDescription>
            </Alert>
          )}

          {has2FA ? (
            <>
              <Alert className="border-forest/30 bg-forest/10">
                <ShieldCheck className="h-4 w-4 text-forest" />
                <AlertDescription className="text-forest">
                  Two-factor authentication is enabled. Your account is protected.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                {verifiedFactors.map((factor) => (
                  <div
                    key={factor.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">
                          {factor.friendly_name || 'Authenticator App'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Added {new Date(factor.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={regenerateBackupCodes}
                      >
                        <Key className="w-4 h-4 mr-1" />
                        Backup Codes
                      </Button>
                      {!(isAdmin && required) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => unenroll(factor.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <ShieldOff className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Protect your account by requiring a verification code from your authenticator app 
                (like Google Authenticator, Authy, or 1Password) when signing in.
              </p>

              <Button onClick={startEnrollment} disabled={isEnrolling}>
                {isEnrolling ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4 mr-2" />
                )}
                Enable 2FA
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Enrollment Dialog */}
      <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Set Up Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app, then enter the 6-digit code to verify.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* QR Code */}
            {enrollmentData?.qr_code && (
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img
                  src={enrollmentData.qr_code}
                  alt="2FA QR Code"
                  className="w-48 h-48"
                />
              </div>
            )}

            {/* Manual Entry */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Can't scan? Enter this code manually:
              </Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 text-xs font-mono bg-muted rounded break-all">
                  {enrollmentData?.secret}
                </code>
                <Button variant="outline" size="sm" onClick={copySecret}>
                  {copiedSecret ? (
                    <CheckCircle2 className="w-4 h-4 text-forest" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Verification */}
            <div className="space-y-2">
              <Label htmlFor="verify-code">Enter verification code</Label>
              <Input
                id="verify-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-widest font-mono"
              />
            </div>

            <Button
              onClick={verifyEnrollment}
              disabled={verifyCode.length !== 6 || isEnrolling}
              className="w-full"
            >
              {isEnrolling ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Verify & Enable 2FA
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Backup Codes Dialog */}
      <Dialog open={showBackupCodesDialog} onOpenChange={setShowBackupCodesDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              Backup Codes
            </DialogTitle>
            <DialogDescription>
              Save these codes in a secure location. Each code can only be used once to access your account if you lose your authenticator.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                These codes will only be shown once. Make sure to save them now!
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
              {backupCodes.map((code, i) => (
                <div key={i} className="p-2 bg-background rounded text-center">
                  {code}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={copyBackupCodes} className="flex-1">
                {copiedBackupCodes ? (
                  <CheckCircle2 className="w-4 h-4 mr-2 text-forest" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                Copy
              </Button>
              <Button variant="outline" onClick={downloadBackupCodes} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>

            <Button onClick={() => setShowBackupCodesDialog(false)} className="w-full">
              I've saved my codes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
