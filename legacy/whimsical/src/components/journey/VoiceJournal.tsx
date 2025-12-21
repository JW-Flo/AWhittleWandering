import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Mic, MicOff, Loader2, Save, Trash2, Sparkles, MapPin, Volume2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface VoiceJournalProps {
  journeyId: string;
  currentWaypoint?: {
    id?: string;
    name: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    state_code?: string;
  } | null;
  onEntrySaved?: () => void;
  className?: string;
}

export default function VoiceJournal({ 
  journeyId, 
  currentWaypoint, 
  onEntrySaved,
  className 
}: VoiceJournalProps) {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState('');
  const [title, setTitle] = useState('');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioOnlyMode, setAudioOnlyMode] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingDuration(0);
      
      timerRef.current = setInterval(() => {
        setRecordingDuration(d => d + 1);
      }, 1000);
      
      toast.success('Recording started - speak your thoughts!');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Could not access microphone. Please check permissions.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      toast.info('Recording stopped. Processing audio...');
    }
  }, [isRecording]);

  const transcribeAudio = useCallback(async () => {
    if (!audioBlob) return;
    
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(audioBlob);
      const base64Audio = await base64Promise;
      
      const { data, error } = await supabase.functions.invoke('voice-transcribe', {
        body: { audio: base64Audio }
      });
      
      if (error) throw error;
      
      if (data?.text) {
        setTranscript(data.text);
        const firstSentence = data.text.split(/[.!?]/)[0].trim();
        setTitle(firstSentence.slice(0, 50) + (firstSentence.length > 50 ? '...' : ''));
        toast.success('Transcription complete!');
      } else {
        toast.error('No speech detected in recording');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error('Failed to transcribe audio. Try again or type manually.');
    } finally {
      setIsTranscribing(false);
    }
  }, [audioBlob]);

  const saveEntry = useCallback(async () => {
    if (!user) {
      toast.error('Please sign in to save entries');
      return;
    }

    // For audio-only mode, we just need the audio blob
    // For transcribed mode, we need transcript
    if (!audioOnlyMode && !transcript.trim()) {
      toast.error('Please add some content before saving');
      return;
    }

    if (audioOnlyMode && !audioBlob) {
      toast.error('Please record audio before saving');
      return;
    }
    
    setIsSaving(true);
    try {
      let audioUrl: string | null = null;
      if (audioBlob) {
        const fileName = `${user.id}/${journeyId}/${Date.now()}.webm`;
        const { error: uploadError } = await supabase.storage
          .from('journey-media')
          .upload(fileName, audioBlob, { contentType: audioBlob.type });
        
        if (!uploadError) {
          audioUrl = fileName;
        } else {
          console.error('Audio upload error:', uploadError);
        }
      }
      
      const { error } = await supabase.from('journal_entries').insert({
        journey_id: journeyId,
        user_id: user.id,
        entry_date: new Date().toISOString().split('T')[0],
        title: title || (audioOnlyMode ? 'Voice Memory' : 'Voice Note'),
        content: audioOnlyMode ? null : transcript,
        latitude: currentWaypoint?.latitude,
        longitude: currentWaypoint?.longitude,
        location_name: currentWaypoint?.location || currentWaypoint?.name,
        state_code: currentWaypoint?.state_code,
        audio_url: audioUrl,
        transcription_source: audioOnlyMode ? 'audio_only' : (audioBlob ? 'voice' : 'manual'),
        waypoint_id: currentWaypoint?.id
      });
      
      if (error) throw error;
      
      toast.success(audioOnlyMode ? 'Audio memory saved!' : 'Memory saved!');
      
      setTranscript('');
      setTitle('');
      setAudioBlob(null);
      setRecordingDuration(0);
      setAudioOnlyMode(false);
      
      onEntrySaved?.();
    } catch (error) {
      console.error('Error saving entry:', error);
      toast.error('Failed to save entry');
    } finally {
      setIsSaving(false);
    }
  }, [user, journeyId, currentWaypoint, transcript, title, audioBlob, audioOnlyMode, onEntrySaved]);

  const clearRecording = () => {
    setAudioBlob(null);
    setTranscript('');
    setTitle('');
    setRecordingDuration(0);
    chunksRef.current = [];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={cn("card-tesla", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mic className="w-5 h-5 text-primary" />
              Capture This Moment
            </CardTitle>
            <CardDescription>
              Record your thoughts, surprises, or daily journal
            </CardDescription>
          </div>
          {currentWaypoint && (
            <Badge variant="outline" className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {currentWaypoint.name}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Audio Only Mode Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Audio-only mode</p>
              <p className="text-xs text-muted-foreground">Save recording without transcription</p>
            </div>
          </div>
          <Switch
            checked={audioOnlyMode}
            onCheckedChange={setAudioOnlyMode}
          />
        </div>

        {/* Recording Controls */}
        <div className="flex items-center gap-3">
          <Button
            variant={isRecording ? "destructive" : "default"}
            size="lg"
            className={cn(
              "flex-1 h-14 text-base font-medium transition-all",
              isRecording && "animate-pulse"
            )}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isTranscribing || isSaving}
          >
            {isRecording ? (
              <>
                <MicOff className="w-5 h-5 mr-2" />
                Stop Recording ({formatDuration(recordingDuration)})
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 mr-2" />
                Start Voice Note
              </>
            )}
          </Button>
          
          {audioBlob && !isRecording && (
            <Button
              variant="outline"
              size="icon"
              onClick={clearRecording}
              className="h-14 w-14"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Audio recorded indicator */}
        {audioBlob && !isRecording && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-success/10 text-success text-sm">
            <Volume2 className="w-4 h-4" />
            <span>Audio recorded ({formatDuration(recordingDuration)})</span>
          </div>
        )}
        
        {/* Transcribe Button - only show if not in audio-only mode */}
        {audioBlob && !transcript && !audioOnlyMode && (
          <Button
            variant="secondary"
            className="w-full"
            onClick={transcribeAudio}
            disabled={isTranscribing}
          >
            {isTranscribing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Transcribing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Transcribe Recording
              </>
            )}
          </Button>
        )}
        
        {/* Title Input */}
        {((transcript && !audioOnlyMode) || (!audioBlob && !audioOnlyMode) || audioOnlyMode) && (
          <div className="space-y-2">
            <Label htmlFor="entry-title">Title (optional)</Label>
            <Input
              id="entry-title"
              placeholder={audioOnlyMode ? "Name this audio memory" : "What's this memory about?"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        )}
        
        {/* Transcript/Content Area - hide in audio-only mode */}
        {!audioOnlyMode && (
          <div className="space-y-2">
            <Label htmlFor="entry-content">
              {audioBlob ? 'Transcript' : 'Your thoughts'}
            </Label>
            <Textarea
              id="entry-content"
              placeholder={audioBlob 
                ? "Your transcribed words will appear here..." 
                : "Type your thoughts, or tap the mic to record..."
              }
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="min-h-[120px] resize-none"
            />
            {transcript && (
              <p className="text-xs text-muted-foreground text-right">
                {transcript.split(/\s+/).filter(Boolean).length} words
              </p>
            )}
          </div>
        )}
        
        {/* Save Button */}
        <Button
          className="w-full"
          onClick={saveEntry}
          disabled={
            (audioOnlyMode ? !audioBlob : !transcript.trim()) || isSaving
          }
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {audioOnlyMode ? 'Save Audio Memory' : 'Save Memory'}
            </>
          )}
        </Button>
        
        {/* Helpful tip */}
        <p className="text-xs text-muted-foreground text-center">
          {audioOnlyMode 
            ? '🎙️ Audio-only: Your recording will be saved as-is for later listening'
            : '💡 Tip: Describe what surprised you, who you met, or how you feel right now'
          }
        </p>
      </CardContent>
    </Card>
  );
}
