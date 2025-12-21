import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';
import { AISuggestion, JourneyContext } from '@/types/advancedFeatures';

interface SmartAssistantProps {
  currentContext: JourneyContext;
  onSuggestionSelected: (suggestion: AISuggestion) => void;
}

export const SmartAssistant: React.FC<SmartAssistantProps> = ({
  currentContext: _currentContext,
  onSuggestionSelected
}) => {
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);

  const processQuery = async () => {
    if (!query.trim()) return;
    setIsProcessing(true);
    
    // Simulate codellama processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const aiSuggestions: AISuggestion[] = [
      {
        id: 'suggestion_1',
        text: 'Take Highway 101 to save 12 minutes based on current traffic',
        confidence: 0.94,
        category: 'route',
        actionable: true
      },
      {
        id: 'suggestion_2',
        text: 'Charge to 85% for optimal range vs time balance',
        confidence: 0.89,
        category: 'charging',
        actionable: true
      }
    ];

    setSuggestions(aiSuggestions);
    setQuery('');
    setIsProcessing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          🤖 TRACK 3: AI Journey Assistant (codellama)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Ask me about your journey..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={processQuery} 
              disabled={isProcessing || !query.trim()}
            >
              {isProcessing ? 'AI Thinking...' : 'Ask'}
            </Button>
          </div>

          {suggestions.length > 0 && (
            <div className="space-y-2">
              {suggestions.map(suggestion => (
                <div 
                  key={suggestion.id} 
                  className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => onSuggestionSelected(suggestion)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <Badge variant="outline">{suggestion.category}</Badge>
                    <span className="text-xs text-green-600">
                      {Math.round(suggestion.confidence * 100)}% confident
                    </span>
                  </div>
                  <p className="text-sm">{suggestion.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
