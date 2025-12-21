import React from 'react';
import { Shield, Lock, Eye } from 'lucide-react';

export const SecurityNotice: React.FC = () => {
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Shield className="w-4 h-4" />
        Privacy & Security
      </div>
      
      <div className="space-y-3 text-sm text-muted-foreground">
        <div className="flex items-start gap-2">
          <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>All API keys are stored locally in your browser and never sent to our servers</span>
        </div>
        
        <div className="flex items-start gap-2">
          <Eye className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Location data is rounded to protect your privacy (~1 mile precision)</span>
        </div>
        
        <div className="flex items-start gap-2">
          <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>All requests go directly to the respective APIs (TESSIE, OpenWeather, Mapbox)</span>
        </div>
      </div>
    </div>
  );
};

export default SecurityNotice;