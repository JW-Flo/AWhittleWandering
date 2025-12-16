import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Smartphone, Shield, Info } from 'lucide-react';

interface SMSConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phoneNumber: string;
  onConsent: (consented: boolean, timestamp: string) => void;
}

export default function SMSConsentDialog({
  open,
  onOpenChange,
  phoneNumber,
  onConsent,
}: SMSConsentDialogProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToFrequency, setAgreedToFrequency] = useState(false);

  const canSubmit = agreedToTerms && agreedToFrequency;

  const handleConsent = () => {
    if (!canSubmit) return;
    const timestamp = new Date().toISOString();
    onConsent(true, timestamp);
    onOpenChange(false);
    // Reset for next time
    setAgreedToTerms(false);
    setAgreedToFrequency(false);
  };

  const handleDecline = () => {
    onConsent(false, '');
    onOpenChange(false);
    setAgreedToTerms(false);
    setAgreedToFrequency(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" />
            SMS Notifications Consent
          </DialogTitle>
          <DialogDescription>
            Please review and agree to receive SMS notifications from A Whittle Wandering.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[300px] pr-4">
          <div className="space-y-4">
            {/* Terms Section */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">What you'll receive:</p>
                  <ul className="mt-1 space-y-1 text-muted-foreground">
                    <li>• Journey update notifications (waypoints, state crossings)</li>
                    <li>• Photo upload alerts for journeys you follow</li>
                    <li>• Charging session updates</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-sunset mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">Message frequency:</p>
                  <p className="text-muted-foreground">
                    You may receive up to 10 messages per day depending on journey activity.
                    Message and data rates may apply.
                  </p>
                </div>
              </div>
            </div>

            {/* Phone Number Display */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <p className="text-sm">
                <span className="text-muted-foreground">Phone number:</span>{' '}
                <span className="font-mono font-medium">{phoneNumber || 'Not provided'}</span>
              </p>
            </div>

            {/* Consent Checkboxes */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                  I consent to receive SMS notifications from A Whittle Wandering (AWW) 
                  at the phone number provided. I understand I can opt out at any time by 
                  replying STOP or disabling SMS in my notification settings.
                </Label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="frequency"
                  checked={agreedToFrequency}
                  onCheckedChange={(checked) => setAgreedToFrequency(checked === true)}
                />
                <Label htmlFor="frequency" className="text-sm leading-relaxed cursor-pointer">
                  I understand that message and data rates may apply, and I acknowledge 
                  the message frequency described above.
                </Label>
              </div>
            </div>

            {/* Opt-out Info */}
            <p className="text-xs text-muted-foreground">
              To stop receiving messages, reply <span className="font-mono bg-muted px-1 rounded">STOP</span> to 
              any message or disable SMS notifications in your settings. For help, 
              reply <span className="font-mono bg-muted px-1 rounded">HELP</span> or 
              contact support@awhittlewandering.com
            </p>
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleDecline} className="w-full sm:w-auto">
            No Thanks
          </Button>
          <Button 
            onClick={handleConsent} 
            disabled={!canSubmit}
            className="w-full sm:w-auto"
          >
            I Agree - Enable SMS
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
