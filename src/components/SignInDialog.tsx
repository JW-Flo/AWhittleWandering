import React, { useState, forwardRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Car, Mail, Lock, User, AlertTriangle, Shield } from 'lucide-react';
import { checkPasswordBreach, checkPasswordStrength } from '@/lib/passwordSecurity';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SocialLoginButtons } from '@/components/social/SocialLoginButtons';
import { Separator } from '@/components/ui/separator';
interface SignInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SignInDialog = forwardRef<HTMLDivElement, SignInDialogProps>(
  ({ open, onOpenChange }, ref) => {
    const { signIn, signUp, mfaChallenge, completeMFA, cancelMFA } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
    const [passwordWarning, setPasswordWarning] = useState<string | null>(null);
    const [mfaCode, setMfaCode] = useState('');

    // Sign In form state
    const [signInEmail, setSignInEmail] = useState('');
    const [signInPassword, setSignInPassword] = useState('');

    // Sign Up form state
    const [signUpEmail, setSignUpEmail] = useState('');
    const [signUpPassword, setSignUpPassword] = useState('');
    const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
    const [signUpName, setSignUpName] = useState('');

    const handleSignIn = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);

      const { error, mfaRequired } = await signIn(signInEmail, signInPassword);

      if (mfaRequired) {
        // MFA is required, the auth context will handle showing MFA challenge
        setIsLoading(false);
        return;
      }

      if (error) {
        toast({
          title: 'Sign in failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Welcome back!',
          description: 'Successfully signed in.',
        });
        onOpenChange(false);
        resetForms();
      }

      setIsLoading(false);
    };

    const handleMFAVerify = async () => {
      if (mfaCode.length !== 6) return;
      
      setIsLoading(true);
      const { error } = await completeMFA(mfaCode);
      
      if (error) {
        toast({
          title: 'Verification failed',
          description: 'Invalid code. Please try again.',
          variant: 'destructive',
        });
        setMfaCode('');
      } else {
        toast({
          title: 'Welcome back!',
          description: 'Successfully signed in.',
        });
        onOpenChange(false);
        resetForms();
      }
      
      setIsLoading(false);
    };

    const handleCancelMFA = () => {
      cancelMFA();
      setMfaCode('');
    };

    const handleSignUp = async (e: React.FormEvent) => {
      e.preventDefault();
      setPasswordWarning(null);

      if (signUpPassword !== signUpConfirmPassword) {
        toast({
          title: 'Passwords do not match',
          description: 'Please ensure both passwords are identical.',
          variant: 'destructive',
        });
        return;
      }

      // Check password strength
      const strengthResult = checkPasswordStrength(signUpPassword);
      if (!strengthResult.isValid) {
        toast({
          title: 'Password requirements not met',
          description: strengthResult.errors[0],
          variant: 'destructive',
        });
        return;
      }

      setIsLoading(true);

      // Check for leaked password
      const breachResult = await checkPasswordBreach(signUpPassword);
      if (breachResult.isCompromised) {
        setIsLoading(false);
        setPasswordWarning(
          `This password has appeared in ${breachResult.breachCount?.toLocaleString()} data breaches. Please choose a different password for your security.`
        );
        toast({
          title: 'Compromised password detected',
          description: 'This password has been exposed in data breaches. Please choose a different one.',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await signUp(signUpEmail, signUpPassword, signUpName || undefined);

      if (error) {
        let errorMessage = error.message;
        if (error.message.includes('already registered')) {
          errorMessage = 'This email is already registered. Please sign in instead.';
          setActiveTab('signin');
          setSignInEmail(signUpEmail);
        }
        toast({
          title: 'Sign up failed',
          description: errorMessage,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Welcome to AWW!',
          description: 'Account created successfully.',
        });
        onOpenChange(false);
        resetForms();
      }

      setIsLoading(false);
    };

    const resetForms = () => {
      setSignInEmail('');
      setSignInPassword('');
      setSignUpEmail('');
      setSignUpPassword('');
      setSignUpConfirmPassword('');
      setSignUpName('');
      setPasswordWarning(null);
      setMfaCode('');
    };

    // Show MFA verification if challenge is active
    if (mfaChallenge) {
      return (
        <Dialog open={open} onOpenChange={(isOpen) => {
          if (!isOpen) handleCancelMFA();
          onOpenChange(isOpen);
        }}>
          <DialogContent ref={ref} className="sm:max-w-md">
            <DialogHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <DialogTitle className="text-2xl font-display">Two-Factor Authentication</DialogTitle>
              <DialogDescription>
                Enter the 6-digit code from your authenticator app
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="mfa-code">Verification Code</Label>
                <Input
                  id="mfa-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => e.key === 'Enter' && handleMFAVerify()}
                  className="text-center text-2xl tracking-widest font-mono"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancelMFA}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleMFAVerify}
                  disabled={mfaCode.length !== 6 || isLoading}
                  className="flex-1"
                >
                  {isLoading ? 'Verifying...' : 'Verify'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      );
    }

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent ref={ref} className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-gradient-sunset flex items-center justify-center mb-4">
              <Car className="w-6 h-6 text-primary-foreground" />
            </div>
            <DialogTitle className="text-2xl font-display">Welcome to AWW</DialogTitle>
            <DialogDescription>
              Sign in to follow the journey and track your own adventures.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'signin' | 'signup')} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4 mt-4">
              <SocialLoginButtons mode="signin" />
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                </div>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-4">
              <SocialLoginButtons mode="signup" />
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or sign up with email</span>
                </div>
              </div>

              <form onSubmit={handleSignUp} className="space-y-4">
                {/* Privacy Notice */}
                <div className="p-3 bg-muted/50 rounded-lg border border-border/50">
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                    <div className="text-xs text-muted-foreground">
                      <p className="font-medium text-foreground mb-1">Your Privacy Matters</p>
                      <p>We collect vehicle telemetry, location data, and journey information. You control what's public in your settings. <a href="/privacy" target="_blank" className="text-primary hover:underline">Read our Privacy Policy</a></p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name (optional)</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Your name"
                      value={signUpName}
                      onChange={(e) => setSignUpName(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {passwordWarning && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {passwordWarning}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="At least 6 characters"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-confirm"
                      type="password"
                      placeholder="••••••••"
                      value={signUpConfirmPassword}
                      onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  By creating an account, you agree to our <a href="/terms" target="_blank" className="text-primary hover:underline">Terms of Service</a> and <a href="/privacy" target="_blank" className="text-primary hover:underline">Privacy Policy</a>.
                </p>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    );
  }
);

SignInDialog.displayName = 'SignInDialog';

export default SignInDialog;
