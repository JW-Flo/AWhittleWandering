import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Star, MessageSquare, Calendar, User, RefreshCw, TrendingUp, Filter } from 'lucide-react';
import { format } from 'date-fns';

interface FeedbackResponse {
  id: string;
  user_id: string;
  survey_type: string;
  responses: Record<string, string>;
  rating: number | null;
  comments: string | null;
  completed_at: string;
}

interface FeedbackStats {
  totalResponses: number;
  averageRating: number;
  responsesByType: Record<string, number>;
}

export function UserFeedback() {
  const [feedback, setFeedback] = useState<FeedbackResponse[]>([]);
  const [stats, setStats] = useState<FeedbackStats>({ totalResponses: 0, averageRating: 0, responsesByType: {} });
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('feedback_surveys')
        .select('*')
        .order('completed_at', { ascending: false });

      if (error) throw error;

      const feedbackData = data as FeedbackResponse[];
      setFeedback(feedbackData);

      // Calculate stats
      const totalResponses = feedbackData.length;
      const ratingsWithValues = feedbackData.filter(f => f.rating !== null);
      const averageRating = ratingsWithValues.length > 0
        ? ratingsWithValues.reduce((sum, f) => sum + (f.rating || 0), 0) / ratingsWithValues.length
        : 0;
      
      const responsesByType: Record<string, number> = {};
      feedbackData.forEach(f => {
        responsesByType[f.survey_type] = (responsesByType[f.survey_type] || 0) + 1;
      });

      setStats({ totalResponses, averageRating, responsesByType });
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFeedback = filter === 'all' 
    ? feedback 
    : feedback.filter(f => f.survey_type === filter);

  const renderStars = (rating: number | null) => {
    if (!rating) return <span className="text-muted-foreground text-sm">No rating</span>;
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'fill-sunset text-sunset' : 'text-muted-foreground'}`}
          />
        ))}
      </div>
    );
  };

  const getResponseLabel = (key: string, value: string): { label: string; value: string } => {
    const labels: Record<string, string> = {
      experience_quality: 'Overall Rating',
      map_usability: 'Map Navigation',
      feature_interest: 'Interested Features',
      discovery_source: 'Discovery Source'
    };
    return { label: labels[key] || key, value };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalResponses}</p>
                <p className="text-sm text-muted-foreground">Total Responses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-sunset/10 flex items-center justify-center">
                <Star className="w-6 h-6 text-sunset" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Average Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-forest/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-forest" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Object.keys(stats.responsesByType).length}</p>
                <p className="text-sm text-muted-foreground">Survey Types</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Feedback</SelectItem>
              <SelectItem value="flagship_experience">Flagship Experience</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={fetchFeedback}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Feedback List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Feedback</CardTitle>
          <CardDescription>User survey responses and comments</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredFeedback.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No feedback responses yet</p>
              <p className="text-sm">Survey responses will appear here after users complete them</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {filteredFeedback.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-lg border border-border bg-card hover:bg-secondary/20 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        {/* Header */}
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="capitalize">
                            {item.survey_type.replace('_', ' ')}
                          </Badge>
                          {renderStars(item.rating)}
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(item.completed_at), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>

                        {/* Responses */}
                        {item.responses && Object.keys(item.responses).length > 0 && (
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {Object.entries(item.responses).map(([key, value]) => {
                              if (key === 'experience_quality') return null;
                              const { label } = getResponseLabel(key, value);
                              return (
                                <div key={key} className="flex flex-col">
                                  <span className="text-muted-foreground text-xs">{label}</span>
                                  <span className="font-medium">{value}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Comments */}
                        {item.comments && (
                          <div className="pt-2 border-t border-border/50">
                            <p className="text-sm text-muted-foreground mb-1">Comments:</p>
                            <p className="text-sm italic">"{item.comments}"</p>
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {item.user_id.slice(0, 8)}...
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
