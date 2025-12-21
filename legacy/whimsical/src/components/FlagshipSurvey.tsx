import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Star, Send, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FlagshipSurveyProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QUESTIONS = [
  {
    id: 'experience_quality',
    question: 'How would you rate your overall experience exploring the AWW Journey?',
    type: 'rating'
  },
  {
    id: 'map_usability',
    question: 'How easy was it to navigate the interactive map?',
    options: ['Very Easy', 'Easy', 'Neutral', 'Difficult', 'Very Difficult']
  },
  {
    id: 'feature_interest',
    question: 'Which features are you most excited to use?',
    options: ['Track my own journeys', 'View vehicle telemetry', 'Share with friends/family', 'Photo galleries', 'All of the above']
  },
  {
    id: 'discovery_source',
    question: 'How did you hear about A Whittle Wandering?',
    options: ['Social Media', 'Friend/Family', 'Search Engine', 'Tesla Community', 'Other']
  }
];

export default function FlagshipSurvey({ open, onOpenChange }: FlagshipSurveyProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResponse = (questionId: string, value: string) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentStep < QUESTIONS.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('feedback_surveys')
        .insert({
          user_id: user.id,
          survey_type: 'flagship_experience',
          responses,
          rating: rating || null,
          comments: comments.trim() || null
        });

      if (error) throw error;

      toast.success('Thank you for your feedback!', {
        description: 'Your responses help us improve the experience.'
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting survey:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestion = QUESTIONS[currentStep];
  const isLastStep = currentStep >= QUESTIONS.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <DialogTitle>Quick Feedback</DialogTitle>
              <DialogDescription>
                Help us improve your experience (30 seconds)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress indicator */}
          <div className="flex gap-1">
            {[...Array(QUESTIONS.length + 1)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  i <= currentStep ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>

          {!isLastStep && currentQuestion ? (
            <div className="space-y-4">
              <p className="font-medium">{currentQuestion.question}</p>

              {currentQuestion.type === 'rating' ? (
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => {
                        setRating(star);
                        handleResponse('experience_quality', star.toString());
                      }}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={cn(
                          "w-10 h-10 transition-colors",
                          (hoveredRating || rating) >= star
                            ? "fill-sunset text-sunset"
                            : "text-muted-foreground"
                        )}
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <RadioGroup
                  value={responses[currentQuestion.id] || ''}
                  onValueChange={(value) => handleResponse(currentQuestion.id, value)}
                  className="space-y-2"
                >
                  {currentQuestion.options?.map((option) => (
                    <div
                      key={option}
                      className={cn(
                        "flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-colors",
                        responses[currentQuestion.id] === option
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => handleResponse(currentQuestion.id, option)}
                    >
                      <RadioGroupItem value={option} id={option} />
                      <Label htmlFor={option} className="cursor-pointer flex-1">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              <div className="flex justify-between pt-4">
                <Button
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="text-muted-foreground"
                >
                  Skip Survey
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!responses[currentQuestion.id] && currentQuestion.type !== 'rating'}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="font-medium">Any additional comments or suggestions?</p>
              <Textarea
                placeholder="What did you like? What could be better? (Optional)"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
                className="resize-none"
              />

              <div className="flex justify-between pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-gradient-primary"
                >
                  {isSubmitting ? (
                    <>Submitting...</>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Feedback
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
