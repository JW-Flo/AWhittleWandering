-- Create feedback_surveys table to store user survey responses
CREATE TABLE public.feedback_surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  survey_type TEXT NOT NULL DEFAULT 'flagship_experience',
  responses JSONB NOT NULL DEFAULT '{}',
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comments TEXT,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feedback_surveys ENABLE ROW LEVEL SECURITY;

-- Users can insert their own feedback
CREATE POLICY "Users can submit their own feedback"
ON public.feedback_surveys
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback"
ON public.feedback_surveys
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback"
ON public.feedback_surveys
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create index for efficient querying
CREATE INDEX idx_feedback_surveys_user_id ON public.feedback_surveys(user_id);
CREATE INDEX idx_feedback_surveys_survey_type ON public.feedback_surveys(survey_type);
CREATE INDEX idx_feedback_surveys_completed_at ON public.feedback_surveys(completed_at DESC);