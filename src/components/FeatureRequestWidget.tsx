import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Lightbulb, Send, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface FeatureRequestWidgetProps {
  variant?: 'floating' | 'inline';
  className?: string;
}

export default function FeatureRequestWidget({ 
  variant = 'floating',
  className = '' 
}: FeatureRequestWidgetProps) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    email: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    
    // Simulate submission - in production this would go to a database
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSubmitted(true);
    setLoading(false);
    toast.success('Feature request submitted! Thank you for your feedback.');
    
    // Reset after showing success
    setTimeout(() => {
      setOpen(false);
      setSubmitted(false);
      setFormData({ title: '', description: '', email: '' });
    }, 2000);
  };

  const triggerButton = variant === 'floating' ? (
    <Button
      size="sm"
      variant="outline"
      className="fixed bottom-6 right-6 z-50 rounded-full shadow-elevated hover:shadow-glow transition-all duration-300 gap-2"
    >
      <Lightbulb className="w-4 h-4" />
      <span className="hidden sm:inline">Request Feature</span>
    </Button>
  ) : (
    <Button variant="ghost" size="sm" className={`gap-2 ${className}`}>
      <Lightbulb className="w-4 h-4" />
      Request Feature
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            Request a Feature
          </DialogTitle>
          <DialogDescription>
            Have an idea for a new vehicle integration, feature, or improvement? Let us know!
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-forest mx-auto" />
            <p className="text-lg font-medium">Thank you!</p>
            <p className="text-muted-foreground">
              Your feature request has been submitted. We'll review it and consider it for future updates.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Feature Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Rivian R1T Integration"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the feature you'd like to see..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {formData.description.length}/1000
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                We'll notify you if your feature is implemented
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                'Submitting...'
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}