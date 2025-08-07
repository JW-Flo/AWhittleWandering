import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Zap, TestTube, Monitor, Camera, AlertCircle, CheckCircle, Clock } from "lucide-react";

interface TestResult {
  name: string;
  url: string;
  timestamp: string;
  steps: Array<{
    step: string;
    status: 'passed' | 'failed' | 'info';
    details: string;
  }>;
  success: boolean;
  screenshots: string[];
}

interface LogEntry {
  message: string;
  type: 'info' | 'error' | 'success';
  timestamp: string;
}

export const PuppeteerTestingComponent: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testUrl, setTestUrl] = useState('http://localhost:8080');
  const [testName, setTestName] = useState('Dev Site Test');
  const [results, setResults] = useState<TestResult[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const connectWebSocket = () => {
    try {
      const websocket = new WebSocket('ws://localhost:3001');
      
      websocket.onopen = () => {
        setIsConnected(true);
        addLog('Connected to Puppeteer UI', 'success');
      };

      websocket.onclose = () => {
        setIsConnected(false);
        addLog('Disconnected from Puppeteer UI', 'error');
        // Attempt to reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };

      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };

      setWs(websocket);
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      addLog('Failed to connect to Puppeteer UI', 'error');
    }
  };

  const addLog = (message: string, type: 'info' | 'error' | 'success') => {
    const newLog: LogEntry = {
      message,
      type,
      timestamp: new Date().toISOString()
    };
    setLogs(prev => [newLog, ...prev.slice(0, 49)]); // Keep last 50 logs
  };

  const handleWebSocketMessage = (data: Record<string, unknown>) => {
    switch (data.type) {
      case 'test-started':
        setIsTesting(true);
        addLog(`Starting test: ${data.testName}`, 'info');
        break;
      case 'test-completed':
        if (data.result && typeof data.result === 'object' && 'name' in data.result) {
          addLog(`Test completed: ${(data.result as TestResult).name}`, 'success');
          setResults(prev => [data.result as TestResult, ...prev.slice(0, 9)]); // Keep last 10 results
        }
        setIsTesting(false);
        break;
      case 'test-failed':
        addLog(`Test failed: ${data.error}`, 'error');
        setIsTesting(false);
        break;
      case 'step':
        addLog(`Step: ${data.message}`, 'info');
        break;
      case 'console':
        addLog(`Console [${data.level}]: ${data.text}`, data.level === 'error' ? 'error' : 'info');
        break;
      case 'page-error':
        addLog(`Page Error: ${data.message}`, 'error');
        break;
    }
  };

  const runTest = () => {
    if (ws && isConnected) {
      ws.send(JSON.stringify({
        type: 'run-test',
        url: testUrl,
        testName: testName
      }));
    } else {
      addLog('Not connected to Puppeteer service', 'error');
    }
  };

  const runBrowserCompatTest = async () => {
    if (!isConnected) {
      addLog('Not connected to Puppeteer service', 'error');
      return;
    }

    try {
      addLog('Starting browser compatibility test...', 'info');
      const response = await fetch('http://localhost:3001/api/browser-compat-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      if (data.success) {
        addLog('✅ Browser compatibility test initiated', 'success');
      } else {
        addLog('❌ Browser compatibility test failed', 'error');
      }
    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const quickTest = (url: string, name: string) => {
    setTestUrl(url);
    setTestName(name);
    setTimeout(() => runTest(), 100);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="w-5 h-5 text-blue-500" />
                AI Browser Testing
              </CardTitle>
              <CardDescription>
                Automated browser testing with Puppeteer and real-time results
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
              {isTesting && (
                <Badge variant="secondary" className="animate-pulse">
                  Testing...
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="controls" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="controls">Controls</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="logs">Live Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="controls" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Test URL</label>
                  <Input
                    value={testUrl}
                    onChange={(e) => setTestUrl(e.target.value)}
                    placeholder="Enter URL to test"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Test Name</label>
                  <Input
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    placeholder="Test description"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={runTest} 
                  disabled={!isConnected || isTesting}
                  className="flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Run Test
                </Button>
                <Button 
                  variant="outline" 
                  onClick={runBrowserCompatTest}
                  disabled={!isConnected || isTesting}
                  className="flex items-center gap-2 bg-purple-100 hover:bg-purple-200 text-purple-700"
                >
                  <Monitor className="w-4 h-4" />
                  Browser Test
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.open('http://localhost:3001', '_blank')}
                  className="flex items-center gap-2"
                >
                  <Monitor className="w-4 h-4" />
                  Full UI
                </Button>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Quick Tests
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => quickTest('http://localhost:8080', 'Local Dev')}
                    disabled={!isConnected || isTesting}
                  >
                    Local Dev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => quickTest('http://localhost:8080', 'Alt Port')}
                    disabled={!isConnected || isTesting}
                  >
                    Alt Port
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => quickTest('https://81e929d7.awhittlewandering-frontend.pages.dev', 'Production')}
                    disabled={!isConnected || isTesting}
                  >
                    Production
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => quickTest('https://awhittlewandering-api-dev.kd8jc7v8cd.workers.dev/api/v1/health', 'API Health')}
                    disabled={!isConnected || isTesting}
                  >
                    API Test
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="results">
              <ScrollArea className="h-96">
                {results.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No test results yet. Run a test to see results here.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {results.map((result, index) => (
                      <Card key={index} className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{result.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {formatTime(result.timestamp)} • {result.url}
                              </p>
                            </div>
                            <Badge variant={result.success ? "default" : "destructive"}>
                              {result.success ? 'PASSED' : 'FAILED'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2">
                            {result.steps.map((step, stepIndex) => (
                              <div key={stepIndex} className="flex items-center justify-between text-sm">
                                <span>{step.step}</span>
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(step.status)}
                                  <span className="text-muted-foreground">{step.details}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          {result.screenshots.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Camera className="w-4 h-4" />
                                {result.screenshots.length} screenshot(s) captured
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="logs">
              <ScrollArea className="h-96">
                <div className="space-y-1 font-mono text-sm">
                  {logs.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      Live logs will appear here when tests are running.
                    </div>
                  ) : (
                    logs.map((log, index) => (
                      <div
                        key={index}
                        className={`p-2 rounded ${
                          log.type === 'error' 
                            ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                            : log.type === 'success'
                            ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                            : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        <span className="text-xs opacity-70">
                          [{formatTime(log.timestamp)}]
                        </span>{' '}
                        {log.message}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
