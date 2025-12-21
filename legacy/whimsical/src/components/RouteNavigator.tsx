import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navigation, Send, Loader2, MapPin, Zap, Clock, Route, LocateFixed, Car, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import RouteExportDialog from './RouteExportDialog';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface RouteNavigatorProps {
  className?: string;
}

interface UserLocation {
  lat: number;
  lng: number;
}

interface ExtractedWaypoint {
  name: string;
  lat: number;
  lng: number;
  address?: string;
}

export default function RouteNavigator({ className = '' }: RouteNavigatorProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [extractedWaypoints, setExtractedWaypoints] = useState<ExtractedWaypoint[]>([]);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        toast.success('Location detected! You can now ask about places near you.');
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Unable to get your location. Please enable location access.');
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Check if query mentions "near me" or location-based terms
    const locationTerms = ['near me', 'around me', 'nearby', 'closest', 'nearest', 'my location', 'where i am'];
    const needsLocation = locationTerms.some(term => input.toLowerCase().includes(term));
    
    if (needsLocation && !userLocation) {
      toast.info('Please share your location first to get nearby results', {
        action: {
          label: 'Share Location',
          onClick: getUserLocation,
        },
      });
    }

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => 
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { role: 'assistant', content: assistantContent }];
      });
    };

    try {
      // Get the user's session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Please sign in to use the AI Navigator');
      }

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/route-navigator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          query: input.trim(),
          currentLocation: userLocation,
          preferences: {
            vehicleType: 'Tesla Model Y',
            preferScenic: true,
          }
        }),
      });

      if (!resp.ok || !resp.body) {
        const errorData = await resp.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to get response');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Handle any remaining buffer
      if (buffer.trim()) {
        for (let raw of buffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch { /* ignore */ }
        }
      }

    } catch (error) {
      console.error('Route navigator error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickPrompts = [
    { icon: Route, text: "Plan a route from Austin to Denver" },
    { icon: Zap, text: "Where should I charge on I-10?" },
    { icon: MapPin, text: "Charging stations near me" },
    { icon: Clock, text: "How long to drive coast to coast?" },
  ];

  return (
    <Card className={`flex flex-col overflow-hidden h-full ${className}`}>
      <CardHeader className="pb-3 px-4 sm:px-6 shrink-0 border-b border-border/50">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Navigation className="w-5 h-5 text-primary" />
          <span>AI Route Navigator</span>
          <Badge variant="outline" className="ml-auto text-xs">Beta</Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-4 p-4 sm:p-6 min-h-0 overflow-hidden">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 py-8">
            <div className="space-y-3">
              <Navigation className="w-12 h-12 text-primary/30 mx-auto" />
              <p className="text-sm text-muted-foreground max-w-sm">
                Plan your next EV adventure! Ask about routes, charging stops, scenic detours, or trip planning.
              </p>
            </div>
            
            {/* Location button */}
            <Button
              variant={userLocation ? "secondary" : "outline"}
              size="default"
              onClick={getUserLocation}
              disabled={isGettingLocation}
              className="gap-2"
            >
              {isGettingLocation ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LocateFixed className={`w-4 h-4 ${userLocation ? 'text-green-500' : ''}`} />
              )}
              {userLocation ? 'Location shared' : 'Share my location'}
            </Button>
            
            {/* Quick prompts - full width grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
              {quickPrompts.map((prompt, i) => (
                <Button
                  key={i}
                  variant="outline"
                  className="h-auto py-3 px-4 justify-start text-sm"
                  onClick={() => setInput(prompt.text)}
                >
                  <prompt.icon className="w-4 h-4 mr-3 shrink-0 text-primary" />
                  <span className="text-left">{prompt.text}</span>
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-auto pr-1" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[90%] rounded-xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">{msg.content}</div>
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-xl px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Export button when waypoints exist */}
        {messages.length > 0 && (
          <div className="flex gap-3 shrink-0 border-t border-border/50 pt-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                // Extract sample waypoints from conversation (in production, parse AI response)
                const sampleWaypoints: ExtractedWaypoint[] = userLocation 
                  ? [{ name: 'Your Location', lat: userLocation.lat, lng: userLocation.lng }]
                  : [];
                setExtractedWaypoints(sampleWaypoints);
                setShowExportDialog(true);
              }}
            >
              <Car className="w-4 h-4 mr-2" />
              Send to Vehicle
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setExtractedWaypoints([]);
                setShowExportDialog(true);
              }}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Export Route
            </Button>
          </div>
        )}

        <div className="flex gap-3 shrink-0 pt-3 border-t border-border/50">
          <Input
            placeholder="Ask about routes, charging stops, scenic drives..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-1 h-12 text-base"
          />
          <Button 
            size="lg"
            onClick={sendMessage} 
            disabled={!input.trim() || isLoading}
            className="shrink-0 px-6"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </CardContent>

      {/* Route Export Dialog */}
      <RouteExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        waypoints={extractedWaypoints}
        routeName="AI Suggested Route"
      />
    </Card>
  );
}
