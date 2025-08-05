import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MaintenanceAlert,
  TripPlan
} from '@/types/enhanced-features';
import {
  Bot,
  MessageSquare,
  Navigation,
  Wrench,
  AlertTriangle,
  CheckCircle,
  MapPin,
  Clock,
  Zap
} from 'lucide-react';

interface AIJourneyAssistantProps {
  onTripPlanned?: (plan: TripPlan) => void;
  onMaintenanceAlert?: (alert: MaintenanceAlert) => void;
}

export const AIJourneyAssistant: React.FC<AIJourneyAssistantProps> = ({
  onTripPlanned: _onTripPlanned,
  onMaintenanceAlert
}) => {
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversation, setConversation] = useState<Array<{
    type: 'user' | 'assistant';
    message: string;
    timestamp: Date;
  }>>([]);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<MaintenanceAlert[]>([]);
  const [currentTripPlan] = useState<TripPlan | null>(null);

  // This will be implemented by codellama model
  const processNaturalLanguageRequest = useCallback(async (input: string) => {
    setIsProcessing(true);
    console.warn('🤖 Delegating natural language processing to codellama...');
    
    // Add user message to conversation
    setConversation(prev => [...prev, {
      type: 'user',
      message: input,
      timestamp: new Date()
    }]);

    // Simulate AI processing
    setTimeout(() => {
      const assistantResponse = generateAIResponse(input);
      setConversation(prev => [...prev, {
        type: 'assistant',
        message: assistantResponse,
        timestamp: new Date()
      }]);
      setIsProcessing(false);
    }, 1500);
  }, []);

  // This will be implemented by codellama model
  const generateAIResponse = (input: string): string => {
    console.warn('🤖 Generating AI response with codellama...');
    
    // Basic pattern matching - will be replaced with actual AI
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('plan') && (lowerInput.includes('trip') || lowerInput.includes('route'))) {
      return "I'd be happy to help plan your trip! I can optimize your route for efficiency, find the best charging stations, and even suggest scenic stops along the way. Where would you like to go?";
    }
    
    if (lowerInput.includes('charging') || lowerInput.includes('charge')) {
      return "Let me analyze the best charging options for your journey. I'll consider factors like charging speed, cost, amenities, and your arrival battery level to recommend optimal stops.";
    }
    
    if (lowerInput.includes('maintenance') || lowerInput.includes('service')) {
      return "Based on your vehicle data and driving patterns, I can predict upcoming maintenance needs and help you schedule service at the optimal time to minimize disruption to your travels.";
    }
    
    if (lowerInput.includes('efficiency') || lowerInput.includes('battery')) {
      return "I can help optimize your driving efficiency! Based on your routes and habits, I've identified several ways to improve your range and reduce charging frequency.";
    }
    
    return "I'm here to help with trip planning, route optimization, charging strategies, and vehicle maintenance. What would you like assistance with today?";
  };

  // This will be implemented by codellama model
  const predictMaintenance = useCallback(async () => {
    console.warn('🤖 Analyzing maintenance predictions with codellama...');
    
    // Mock maintenance alerts - will be replaced with AI analysis
    const mockAlerts: MaintenanceAlert[] = [
      {
        type: 'tire',
        severity: 'medium',
        description: 'Tire tread approaching replacement threshold',
        recommendedAction: 'Schedule tire inspection within 1,000 miles',
        estimatedMiles: 1200,
        confidence: 0.85
      },
      {
        type: 'service',
        severity: 'low',
        description: 'Annual service interval approaching',
        recommendedAction: 'Schedule service appointment in next 30 days',
        estimatedMiles: 2500,
        confidence: 0.95
      }
    ];
    
    setMaintenanceAlerts(mockAlerts);
    mockAlerts.forEach(alert => onMaintenanceAlert?.(alert));
  }, [onMaintenanceAlert]);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    
    const message = userInput;
    setUserInput('');
    await processNaturalLanguageRequest(message);
  };

  const getSeverityColor = (severity: MaintenanceAlert['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Chat Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Journey Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Conversation History */}
          <div className="h-64 overflow-y-auto border rounded-lg p-4 mb-4 space-y-3">
            {conversation.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <Bot className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Hi! I'm your AI Journey Assistant. Ask me about trip planning, charging strategies, or vehicle maintenance.</p>
              </div>
            ) : (
              conversation.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
            
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    <span className="text-sm">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="flex gap-2">
            <Input
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask me about your journey..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isProcessing}
            />
            <Button onClick={handleSendMessage} disabled={isProcessing || !userInput.trim()}>
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => processNaturalLanguageRequest("Plan a trip to San Francisco")}
            >
              <Navigation className="h-3 w-3 mr-1" />
              Plan Trip
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => processNaturalLanguageRequest("Find charging stations on my route")}
            >
              <Zap className="h-3 w-3 mr-1" />
              Find Charging
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={predictMaintenance}
            >
              <Wrench className="h-3 w-3 mr-1" />
              Check Maintenance
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Trip Plan */}
      {currentTripPlan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Current Trip Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Estimated Time</p>
                  <p className="font-medium">{Math.round(currentTripPlan.estimatedTime / 60)}h</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Energy Needed</p>
                  <p className="font-medium">{currentTripPlan.estimatedEnergy.toFixed(1)} kWh</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Charging Stops</p>
                  <p className="font-medium">{currentTripPlan.chargingStops.length}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Maintenance Alerts */}
      {maintenanceAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Predictive Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {maintenanceAlerts.map((alert, index) => (
                <Alert key={index} className={getSeverityColor(alert.severity)}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{alert.description}</p>
                        <p className="text-sm mt-1">{alert.recommendedAction}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {alert.estimatedMiles} miles
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {Math.round(alert.confidence * 100)}% confidence
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle>AI Assistant Capabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Trip Planning</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Natural language trip requests</li>
                <li>• Route optimization for efficiency</li>
                <li>• Smart charging station recommendations</li>
                <li>• Weather and traffic considerations</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Vehicle Intelligence</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Predictive maintenance alerts</li>
                <li>• Battery health monitoring</li>
                <li>• Efficiency optimization tips</li>
                <li>• Cost and environmental analysis</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIJourneyAssistant;
