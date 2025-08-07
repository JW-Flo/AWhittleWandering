import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { backendApi } from '@/services/backendApi';
import {
  Bot,
  MessageSquare,
  Navigation,
  Wrench,
  Zap,
  BookOpen,
  Sparkles,
  Calendar,
  MapPin,
  Cloud
} from 'lucide-react';

interface JournalEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  location?: string;
  weather?: string;
  mileage?: number;
  photos?: string[];
  mood?: 'excited' | 'relaxed' | 'adventurous' | 'tired' | 'happy';
}

interface AIJourneyManagerProps {
  onJournalEntryCreated?: (entry: JournalEntry) => void;
  currentLocation?: string;
  currentMileage?: number;
  className?: string;
}

export default function AIJourneyManager({ 
  onJournalEntryCreated, 
  currentLocation,
  currentMileage,
  className 
}: AIJourneyManagerProps) {
  // Chat/Assistant state
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversation, setConversation] = useState<Array<{
    type: 'user' | 'assistant';
    message: string;
    timestamp: Date;
  }>>([]);

  // Journal state
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<Partial<JournalEntry>>({
    date: new Date().toISOString().split('T')[0],
    location: currentLocation || '',
    mileage: currentMileage || 0
  });

  // Handle AI conversation
  const processNaturalLanguageRequest = async (input: string) => {
    if (!input.trim()) return;

    setIsProcessing(true);
    
    // Add user message to conversation
    const userMessage = {
      type: 'user' as const,
      message: input,
      timestamp: new Date()
    };
    setConversation(prev => [...prev, userMessage]);

    try {
      // Call backend AI service
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          context: 'journey_assistant',
          conversation: conversation.slice(-5) // Last 5 messages for context
        })
      });

      const data = await response.json();
      
      const assistantMessage = {
        type: 'assistant' as const,
        message: data.response || 'I apologize, but I couldn\'t process your request right now.',
        timestamp: new Date()
      };
      
      setConversation(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI chat error:', error);
      const errorMessage = {
        type: 'assistant' as const,
        message: 'I\'m having trouble connecting right now. Please try again in a moment.',
        timestamp: new Date()
      };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
      setUserInput('');
    }
  };

  // Generate AI journal entry
  const generateAIJournalEntry = async () => {
    setIsGenerating(true);
    
    try {
      const requestData = {
        date: currentEntry.date,
        location: currentEntry.location || currentLocation,
        mileage: currentEntry.mileage || currentMileage,
        weather: 'sunny', // Would be fetched from weather API
        context: 'tesla_road_trip'
      };

      const result = await backendApi.generateJournalEntry(requestData);
      
      if (result.success) {
        const generatedEntry: JournalEntry = {
          id: `entry-${Date.now()}`,
          date: result.entry.date,
          title: result.entry.title,
          content: result.entry.content,
          location: result.entry.location,
          weather: result.entry.weather,
          mileage: currentEntry.mileage,
          mood: 'excited' // Default mood
        };

        setJournalEntries(prev => [generatedEntry, ...prev]);
        setCurrentEntry({
          date: new Date().toISOString().split('T')[0],
          location: currentLocation || '',
          mileage: currentMileage || 0
        });
        
        onJournalEntryCreated?.(generatedEntry);
      }
    } catch (error) {
      console.error('Journal generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle manual journal entry
  const saveJournalEntry = () => {
    if (!currentEntry.title || !currentEntry.content) return;

    const newEntry: JournalEntry = {
      id: `entry-${Date.now()}`,
      date: currentEntry.date || new Date().toISOString().split('T')[0],
      title: currentEntry.title,
      content: currentEntry.content,
      location: currentEntry.location || currentLocation,
      mileage: currentEntry.mileage || currentMileage,
      mood: currentEntry.mood || 'happy'
    };

    setJournalEntries(prev => [newEntry, ...prev]);
    setCurrentEntry({
      date: new Date().toISOString().split('T')[0],
      location: currentLocation || '',
      mileage: currentMileage || 0
    });
    
    onJournalEntryCreated?.(newEntry);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-500" />
              AI Journey Manager
            </CardTitle>
            <Badge variant="outline" className="bg-purple-50 text-purple-700">
              AI-Powered
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="assistant" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
              <TabsTrigger value="journal">Journey Journal</TabsTrigger>
              <TabsTrigger value="entries">Past Entries</TabsTrigger>
            </TabsList>

            <TabsContent value="assistant" className="space-y-4">
              {/* Conversation Display */}
              <div className="h-96 border rounded-lg p-4 overflow-y-auto bg-slate-50">
                {conversation.length === 0 ? (
                  <div className="text-center text-muted-foreground mt-20">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4" />
                    <p>Hello! I'm your AI Journey Assistant.</p>
                    <p className="text-sm mt-2">
                      Ask me about route planning, charging stops, weather, or anything about your Tesla journey!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {conversation.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            msg.type === 'user'
                              ? 'bg-blue-500 text-white'
                              : 'bg-white border shadow-sm'
                          }`}
                        >
                          <p className="text-sm">{msg.message}</p>
                          <p className={`text-xs mt-1 ${
                            msg.type === 'user' ? 'text-blue-100' : 'text-muted-foreground'
                          }`}>
                            {msg.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="flex gap-2">
                <Input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Ask me anything about your journey..."
                  onKeyPress={(e) => e.key === 'Enter' && processNaturalLanguageRequest(userInput)}
                  disabled={isProcessing}
                />
                <Button 
                  onClick={() => processNaturalLanguageRequest(userInput)}
                  disabled={isProcessing || !userInput.trim()}
                >
                  {isProcessing ? (
                    <MessageSquare className="w-4 h-4 animate-pulse" />
                  ) : (
                    <>Send</>
                  )}
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setUserInput('Find the nearest supercharger')}
                >
                  <Zap className="w-4 h-4 mr-1" />
                  Charging
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setUserInput('What\'s the weather like ahead?')}
                >
                  <Cloud className="w-4 h-4 mr-1" />
                  Weather
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setUserInput('Optimize my route')}
                >
                  <Navigation className="w-4 h-4 mr-1" />
                  Route
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setUserInput('Check vehicle status')}
                >
                  <Wrench className="w-4 h-4 mr-1" />
                  Status
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="journal" className="space-y-4">
              {/* Current Entry Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-green-500" />
                    New Journal Entry
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">Date</label>
                      <Input
                        type="date"
                        value={currentEntry.date}
                        onChange={(e) => setCurrentEntry({ ...currentEntry, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Location</label>
                      <Input
                        placeholder="Current location"
                        value={currentEntry.location}
                        onChange={(e) => setCurrentEntry({ ...currentEntry, location: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Mileage</label>
                      <Input
                        type="number"
                        placeholder="Current mileage"
                        value={currentEntry.mileage}
                        onChange={(e) => setCurrentEntry({ ...currentEntry, mileage: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      placeholder="Entry title"
                      value={currentEntry.title}
                      onChange={(e) => setCurrentEntry({ ...currentEntry, title: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Content</label>
                    <Textarea
                      placeholder="Describe your journey, experiences, thoughts..."
                      value={currentEntry.content}
                      onChange={(e) => setCurrentEntry({ ...currentEntry, content: e.target.value })}
                      rows={6}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={generateAIJournalEntry}
                      disabled={isGenerating}
                      className="flex-1"
                    >
                      {isGenerating ? (
                        <>
                          <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                          Generating with AI...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate with AI
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={saveJournalEntry}
                      disabled={!currentEntry.title || !currentEntry.content}
                      variant="outline"
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Save Entry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="entries" className="space-y-4">
              {journalEntries.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No journal entries yet.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Start documenting your journey in the Journal tab!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {journalEntries.map((entry) => (
                    <Card key={entry.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{entry.title}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              <Calendar className="w-3 h-3 mr-1" />
                              {entry.date}
                            </Badge>
                            {entry.location && (
                              <Badge variant="outline">
                                <MapPin className="w-3 h-3 mr-1" />
                                {entry.location}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-relaxed">{entry.content}</p>
                        {entry.mileage && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Mileage: {entry.mileage.toLocaleString()} miles
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
