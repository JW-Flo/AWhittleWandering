import { useState } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/layout/Footer";
import { ArrowLeft, Download, Trash2, FileText, Shield, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type RequestType = 'access' | 'deletion' | 'portability' | 'rectification';

const DataRequest = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requestType, setRequestType] = useState<RequestType>('access');
  const [email, setEmail] = useState(user?.email || '');
  const [name, setName] = useState('');
  const [details, setDetails] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const requestTypes = {
    access: {
      title: "Data Access Request",
      description: "Request a copy of all personal data we hold about you",
      icon: FileText,
      timeline: "Within 30 days"
    },
    deletion: {
      title: "Data Deletion Request",
      description: "Request deletion of your personal data (Right to be Forgotten)",
      icon: Trash2,
      timeline: "Within 30 days"
    },
    portability: {
      title: "Data Portability Request",
      description: "Request your data in a machine-readable format for transfer",
      icon: Download,
      timeline: "Within 30 days"
    },
    rectification: {
      title: "Data Rectification Request",
      description: "Request correction of inaccurate personal data",
      icon: Shield,
      timeline: "Within 30 days"
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acknowledged) {
      toast({
        title: "Acknowledgment Required",
        description: "Please acknowledge that you understand the request process",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      // Submit DSAR request via edge function (bypasses RLS for anonymous users)
      const { data, error } = await supabase.functions.invoke('dsar-submit', {
        body: {
          request_type: requestType,
          email: email,
          name: name,
          details: details
        }
      });

      if (error) {
        console.error('Error submitting DSAR:', error);
        throw error;
      }

      setSubmitted(true);
      toast({
        title: "Request Submitted",
        description: "We'll process your request within 30 days and contact you at the provided email.",
      });
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: "Submission Error",
        description: "Please try again or contact privacy@awhittlewandering.com directly",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Logo size="sm" />
            </Link>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl flex items-center justify-center">
          <Card className="w-full card-nature">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Request Submitted Successfully</h2>
              <p className="text-muted-foreground mb-6">
                Your {requestTypes[requestType].title.toLowerCase()} has been received. 
                We'll process it within 30 days and send a response to <strong>{email}</strong>.
              </p>
              <div className="flex gap-4 justify-center">
                <Button variant="outline" asChild>
                  <Link to="/">Return Home</Link>
                </Button>
                <Button asChild>
                  <Link to="/privacy">View Privacy Policy</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>

        <Footer variant="minimal" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo size="sm" />
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/privacy">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Privacy Policy
            </Link>
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Data Subject Access Request</h1>
          <p className="text-muted-foreground text-lg">
            Exercise your privacy rights under GDPR, CCPA, and other data protection regulations.
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card className="card-nature">
            <CardContent className="p-4 flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">Your Privacy Rights</h3>
                <p className="text-sm text-muted-foreground">
                  You have the right to access, correct, delete, or export your personal data at any time.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-nature">
            <CardContent className="p-4 flex items-start gap-3">
              <Clock className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">Processing Timeline</h3>
                <p className="text-sm text-muted-foreground">
                  All requests are processed within 30 days. Complex requests may take up to 90 days.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Request Form */}
        <Card className="card-nature">
          <CardHeader>
            <CardTitle>Submit Your Request</CardTitle>
            <CardDescription>
              Select the type of request and provide your information below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Request Type */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Request Type</Label>
                <RadioGroup
                  value={requestType}
                  onValueChange={(v) => setRequestType(v as RequestType)}
                  className="grid md:grid-cols-2 gap-3"
                >
                  {Object.entries(requestTypes).map(([key, value]) => {
                    const Icon = value.icon;
                    return (
                      <label
                        key={key}
                        className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                          requestType === key 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <RadioGroupItem value={key} className="mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className="w-4 h-4 text-primary" />
                            <span className="font-medium text-sm">{value.title}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{value.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </RadioGroup>
              </div>

              {/* Contact Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your legal name"
                    required
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    maxLength={255}
                  />
                  <p className="text-xs text-muted-foreground">
                    {user ? "Pre-filled from your account" : "Must match your account email if you have one"}
                  </p>
                </div>
              </div>

              {/* Additional Details */}
              <div className="space-y-2">
                <Label htmlFor="details">Additional Details (Optional)</Label>
                <Textarea
                  id="details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Provide any additional context for your request, such as specific data you're looking for or corrections needed..."
                  rows={4}
                  maxLength={2000}
                />
              </div>

              {/* Acknowledgment */}
              <div className="flex items-start gap-3 p-4 bg-secondary/50 rounded-lg">
                <Checkbox
                  id="acknowledge"
                  checked={acknowledged}
                  onCheckedChange={(checked) => setAcknowledged(checked as boolean)}
                />
                <label htmlFor="acknowledge" className="text-sm text-muted-foreground cursor-pointer">
                  I understand that AWW may need to verify my identity before processing this request. 
                  I acknowledge that requests will be processed within 30 days, and I will receive 
                  communication at the email address provided above.
                </label>
              </div>

              {/* Submit */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Questions? Email{" "}
                  <a href="mailto:privacy@awhittlewandering.com" className="text-primary hover:underline">
                    privacy@awhittlewandering.com
                  </a>
                </p>
                <Button type="submit" disabled={submitting || !acknowledged}>
                  {submitting ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Data Categories */}
        <Card className="card-nature mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Data We May Hold About You</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Account Information</h4>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Email address and name</li>
                  <li>• Profile settings and preferences</li>
                  <li>• Authentication credentials (hashed)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Journey Data</h4>
                <ul className="text-muted-foreground space-y-1">
                  <li>• GPS coordinates and routes</li>
                  <li>• Vehicle telemetry data</li>
                  <li>• Photos and journal entries</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Communication Data</h4>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Notification preferences</li>
                  <li>• Phone number (if SMS enabled)</li>
                  <li>• Email digest history</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Technical Data</h4>
                <ul className="text-muted-foreground space-y-1">
                  <li>• API tokens (encrypted)</li>
                  <li>• Session and activity logs</li>
                  <li>• Device and browser information</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer variant="minimal" />
    </div>
  );
};

export default DataRequest;
