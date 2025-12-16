import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Smartphone, Shield, MessageSquare, Bell, CheckCircle2, XCircle, Clock, MapPin, Camera, Zap, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/components/Logo';

export default function SMSTerms() {
  const [showConsentPreview, setShowConsentPreview] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <Logo size="sm" />
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
            <Smartphone className="w-4 h-4" />
            <span className="text-sm font-medium">SMS Notifications</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Stay Connected to Your
            <span className="text-primary block mt-1">Adventure</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get real-time updates about the journeys you follow, delivered straight to your phone. 
            Here's everything you need to know about our SMS notification service.
          </p>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <Badge variant="secondary" className="gap-2 py-2 px-4">
            <Shield className="w-4 h-4 text-forest" />
            TCPA Compliant
          </Badge>
          <Badge variant="secondary" className="gap-2 py-2 px-4">
            <CheckCircle2 className="w-4 h-4 text-forest" />
            Explicit Consent Required
          </Badge>
          <Badge variant="secondary" className="gap-2 py-2 px-4">
            <XCircle className="w-4 h-4 text-sunset" />
            Easy Opt-Out Anytime
          </Badge>
        </div>

        {/* What You'll Receive */}
        <Card className="mb-8 border-primary/20 bg-gradient-to-br from-card to-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              What You'll Receive
            </CardTitle>
            <CardDescription>
              SMS notifications keep you in the loop with journey updates you care about
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-background/50">
                <MapPin className="w-5 h-5 text-sunset mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Waypoint Updates</p>
                  <p className="text-sm text-muted-foreground">Get notified when travelers reach new destinations</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-background/50">
                <div className="w-5 h-5 mt-0.5 shrink-0 flex items-center justify-center">
                  <span className="text-lg">🏔️</span>
                </div>
                <div>
                  <p className="font-medium">State Crossings</p>
                  <p className="text-sm text-muted-foreground">Celebrate as journeys enter new states</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-background/50">
                <Camera className="w-5 h-5 text-forest mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Photo Uploads</p>
                  <p className="text-sm text-muted-foreground">See new photos from the road as they're shared</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-background/50">
                <Zap className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Charging Sessions</p>
                  <p className="text-sm text-muted-foreground">Track EV charging stops and energy updates</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Message Frequency */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Message Frequency
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="font-medium mb-2">Expected Volume</p>
              <p className="text-muted-foreground">
                You may receive <span className="font-semibold text-foreground">up to 10 messages per day</span> depending 
                on journey activity. Active journeys with frequent waypoints may generate more notifications. 
                Quiet days may have none at all.
              </p>
            </div>
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <MessageSquare className="w-4 h-4 mt-0.5 shrink-0" />
              <p>
                <span className="font-medium text-foreground">Message and data rates may apply.</span> Check with your 
                carrier for details about SMS charges on your plan.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Consent Process */}
        <Card className="mb-8 border-forest/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-forest" />
              How We Collect Consent
            </CardTitle>
            <CardDescription>
              Your explicit permission is required before any SMS is sent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium">Navigate to Notification Settings</p>
                  <p className="text-sm text-muted-foreground">
                    In your account settings, find the Notifications tab where all communication preferences are managed.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="font-bold text-primary">2</span>
                </div>
                <div>
                  <p className="font-medium">Enter Your Phone Number</p>
                  <p className="text-sm text-muted-foreground">
                    Provide the mobile number where you'd like to receive SMS updates.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="font-bold text-primary">3</span>
                </div>
                <div>
                  <p className="font-medium">Review & Accept Terms</p>
                  <p className="text-sm text-muted-foreground">
                    A consent dialog appears requiring you to acknowledge the terms and message frequency 
                    before SMS can be enabled.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-forest/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-forest" />
                </div>
                <div>
                  <p className="font-medium">Consent Recorded</p>
                  <p className="text-sm text-muted-foreground">
                    Your consent is timestamped and logged for compliance. You're now subscribed to SMS updates!
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Consent Preview */}
            <div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowConsentPreview(!showConsentPreview)}
              >
                {showConsentPreview ? 'Hide' : 'View'} Consent Dialog Preview
              </Button>
              
              {showConsentPreview && (
                <div className="mt-4 border rounded-lg p-6 bg-background">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <Smartphone className="w-5 h-5 text-primary" />
                      SMS Notifications Consent
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Please review and agree to receive SMS notifications from A Whittle Wandering.
                    </p>
                    
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm">
                      <div className="flex items-start gap-2">
                        <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium">What you'll receive:</p>
                          <ul className="mt-1 space-y-1 text-muted-foreground">
                            <li>• Journey update notifications</li>
                            <li>• Photo upload alerts</li>
                            <li>• Charging session updates</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-4 h-4 border rounded mt-0.5" />
                        <p className="text-sm">
                          I consent to receive SMS notifications from A Whittle Wandering (AWW) 
                          at the phone number provided. I understand I can opt out at any time.
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-4 h-4 border rounded mt-0.5" />
                        <p className="text-sm">
                          I understand that message and data rates may apply.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <div className="flex-1 h-10 border rounded flex items-center justify-center text-sm text-muted-foreground">
                        No Thanks
                      </div>
                      <div className="flex-1 h-10 bg-primary rounded flex items-center justify-center text-sm text-primary-foreground">
                        I Agree - Enable SMS
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Opt-Out Instructions */}
        <Card className="mb-8 border-sunset/20 bg-gradient-to-br from-card to-sunset/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-sunset" />
              How to Opt Out
            </CardTitle>
            <CardDescription>
              You can stop receiving SMS messages at any time using these methods
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-background/50 rounded-lg p-4">
                <p className="font-medium mb-2">Reply STOP</p>
                <p className="text-sm text-muted-foreground">
                  Reply <code className="bg-muted px-1.5 py-0.5 rounded font-mono">STOP</code> to any 
                  message you receive from us to immediately unsubscribe.
                </p>
              </div>
              <div className="bg-background/50 rounded-lg p-4">
                <p className="font-medium mb-2">Account Settings</p>
                <p className="text-sm text-muted-foreground">
                  Visit your <Link to="/settings" className="text-primary hover:underline">Notification Settings</Link> and 
                  toggle SMS notifications off.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm bg-muted/30 rounded-lg p-4">
              <HelpCircle className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
              <p className="text-muted-foreground">
                For help, reply <code className="bg-muted px-1.5 py-0.5 rounded font-mono">HELP</code> to any 
                message or contact <a href="mailto:support@awhittlewandering.com" className="text-primary hover:underline">support@awhittlewandering.com</a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Is my phone number shared with third parties?</AccordionTrigger>
                <AccordionContent>
                  No. Your phone number is stored securely and used only for sending you the SMS 
                  notifications you've opted into. We never sell, share, or disclose your phone number 
                  to third parties for marketing purposes.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Can I choose which notifications I receive?</AccordionTrigger>
                <AccordionContent>
                  Yes! In your notification settings, you can enable or disable specific notification 
                  types like waypoint updates, state crossings, photo alerts, and charging sessions. 
                  Customize your experience to receive only what matters to you.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>What happens if I reply STOP?</AccordionTrigger>
                <AccordionContent>
                  When you reply STOP, you'll be immediately unsubscribed from all SMS notifications. 
                  You'll receive a confirmation message, and no further texts will be sent. You can 
                  re-enable SMS anytime in your account settings.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>Are there any charges for SMS messages?</AccordionTrigger>
                <AccordionContent>
                  A Whittle Wandering does not charge for SMS messages. However, standard message and 
                  data rates from your mobile carrier may apply. Check with your carrier about your 
                  SMS plan to understand any potential charges.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-5">
                <AccordionTrigger>How do I update my phone number?</AccordionTrigger>
                <AccordionContent>
                  Visit your notification settings and enter your new phone number. You'll need to 
                  complete the consent process again for the new number to ensure we have your 
                  explicit permission to send messages there.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Contact & Legal */}
        <div className="text-center text-sm text-muted-foreground space-y-4 py-8">
          <p>
            Questions about our SMS service? Contact us at{' '}
            <a href="mailto:support@awhittlewandering.com" className="text-primary hover:underline">
              support@awhittlewandering.com
            </a>
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>•</span>
            <Link to="/settings" className="hover:text-foreground transition-colors">Settings</Link>
            <span>•</span>
            <Link to="/explore" className="hover:text-foreground transition-colors">Explore Journeys</Link>
          </div>
          <p className="text-xs">
            © {new Date().getFullYear()} A Whittle Wandering. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
}
