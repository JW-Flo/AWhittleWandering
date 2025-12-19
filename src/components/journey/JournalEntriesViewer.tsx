import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BookOpen, 
  Mic, 
  Play, 
  Pause, 
  MapPin, 
  Calendar, 
  Star,
  ChevronDown,
  ChevronUp,
  Volume2
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface JournalEntry {
  id: string;
  title: string | null;
  content: string | null;
  audio_url: string | null;
  location_name: string | null;
  state_code: string | null;
  entry_date: string;
  created_at: string;
  mood: string | null;
  is_highlight: boolean | null;
  transcription_source: string | null;
}

interface JournalEntriesViewerProps {
  journeyId?: string;
  className?: string;
  maxHeight?: string;
}

const JournalEntriesViewer: React.FC<JournalEntriesViewerProps> = ({
  journeyId,
  className,
  maxHeight = '600px'
}) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<{ [key: string]: number }>({});
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user, journeyId]);

  const fetchEntries = async () => {
    try {
      let query = supabase
        .from('journal_entries')
        .select('id, title, content, audio_url, location_name, state_code, entry_date, created_at, mood, is_highlight, transcription_source')
        .order('entry_date', { ascending: false });

      if (journeyId) {
        query = query.eq('journey_id', journeyId);
      }

      const { data, error } = await query.limit(50);

      if (error) {
        console.error('Error fetching journal entries:', error);
        return;
      }

      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSignedAudioUrl = async (audioPath: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('signed-url', {
        body: { path: audioPath, bucket: 'journey-photos' }
      });
      
      if (error) throw error;
      return data?.signedUrl || null;
    } catch (error) {
      console.error('Error getting signed audio URL:', error);
      return null;
    }
  };

  const handlePlayPause = async (entry: JournalEntry) => {
    if (!entry.audio_url) return;

    if (playingId === entry.id) {
      // Pause current audio
      audioRefs.current[entry.id]?.pause();
      setPlayingId(null);
      return;
    }

    // Stop any currently playing audio
    if (playingId && audioRefs.current[playingId]) {
      audioRefs.current[playingId].pause();
    }

    // Get signed URL and play
    const signedUrl = await getSignedAudioUrl(entry.audio_url);
    if (!signedUrl) return;

    if (!audioRefs.current[entry.id]) {
      const audio = new Audio(signedUrl);
      audio.addEventListener('timeupdate', () => {
        const progress = (audio.currentTime / audio.duration) * 100;
        setAudioProgress(prev => ({ ...prev, [entry.id]: progress }));
      });
      audio.addEventListener('ended', () => {
        setPlayingId(null);
        setAudioProgress(prev => ({ ...prev, [entry.id]: 0 }));
      });
      audioRefs.current[entry.id] = audio;
    } else {
      audioRefs.current[entry.id].src = signedUrl;
    }

    audioRefs.current[entry.id].play();
    setPlayingId(entry.id);
  };

  const getMoodEmoji = (mood: string | null) => {
    switch (mood) {
      case 'excited': return '🤩';
      case 'happy': return '😊';
      case 'peaceful': return '😌';
      case 'tired': return '😴';
      case 'adventurous': return '🏔️';
      case 'grateful': return '🙏';
      default: return null;
    }
  };

  const displayedEntries = expanded ? entries : entries.slice(0, 5);

  if (loading) {
    return (
      <Card className={cn("card-tesla", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Journey Memories
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card className={cn("card-tesla", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Journey Memories
          </CardTitle>
          <CardDescription>
            Your voice notes and written memories will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Mic className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No journal entries yet.</p>
            <p className="text-sm mt-2">Use the Live tab to record voice notes!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("card-tesla", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Journey Memories
          <Badge className="ml-auto bg-primary/20 text-primary border-0">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Your voice notes and written memories from the road
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea style={{ maxHeight }} className="pr-4">
          <div className="space-y-4">
            {displayedEntries.map((entry) => (
              <div
                key={entry.id}
                className={cn(
                  "p-4 rounded-lg border transition-colors",
                  entry.is_highlight 
                    ? "bg-sunset/5 border-sunset/30" 
                    : "bg-secondary/50 border-border hover:border-primary/30"
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {entry.is_highlight && (
                      <Star className="w-4 h-4 text-sunset fill-sunset" />
                    )}
                    <h4 className="font-semibold text-foreground">
                      {entry.title || 'Untitled Memory'}
                    </h4>
                    {getMoodEmoji(entry.mood) && (
                      <span>{getMoodEmoji(entry.mood)}</span>
                    )}
                    {entry.transcription_source === 'voice' && (
                      <Badge variant="outline" className="text-xs">
                        <Mic className="w-3 h-3 mr-1" />
                        Voice
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(entry.entry_date), 'MMM d, yyyy')}
                  </span>
                  {entry.location_name && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {entry.location_name}
                      {entry.state_code && `, ${entry.state_code}`}
                    </span>
                  )}
                </div>

                {/* Audio Player */}
                {entry.audio_url && (
                  <div className="mb-3 p-3 bg-background/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-full bg-primary/10 hover:bg-primary/20"
                        onClick={() => handlePlayPause(entry)}
                      >
                        {playingId === entry.id ? (
                          <Pause className="w-5 h-5 text-primary" />
                        ) : (
                          <Play className="w-5 h-5 text-primary ml-0.5" />
                        )}
                      </Button>
                      <div className="flex-1">
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-200"
                            style={{ width: `${audioProgress[entry.id] || 0}%` }}
                          />
                        </div>
                      </div>
                      <Volume2 className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                )}

                {/* Content */}
                {entry.content && (
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {entry.content}
                  </p>
                )}
              </div>
            ))}

            {entries.length > 5 && (
              <div className="text-center pt-2">
                <Button
                  variant="ghost"
                  onClick={() => setExpanded(!expanded)}
                  className="gap-2"
                >
                  {expanded ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Show all {entries.length} memories
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default JournalEntriesViewer;
