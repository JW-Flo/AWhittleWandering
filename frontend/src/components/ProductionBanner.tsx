import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Users } from 'lucide-react';

const ProductionBanner = () => {
  return (
    <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-tesla-cyan/5">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-primary text-background">
                Live Journey
              </Badge>
              <Badge variant="outline" className="border-tesla-cyan text-tesla-cyan">
                Day 67 of 90
              </Badge>
            </div>
            <h2 className="text-xl font-bold mb-1">
              Following the Epic Cross-Country Adventure
            </h2>
            <p className="text-muted-foreground text-sm">
              Track our real-time progress through all 48 contiguous states in a Tesla Model 3
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span>Currently in Kansas</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span>Started June 1, 2025</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span>Public Journey Tracker</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductionBanner;