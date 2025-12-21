import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Car, Zap } from 'lucide-react';

interface VehicleMake {
  id: string;
  name: string;
  logo_url: string | null;
  is_active: boolean;
}

interface VehicleMakeSelectorProps {
  selectedMake: string | null;
  onSelectMake: (make: string) => void;
}

// Tesla models for initial support
const TESLA_MODELS = [
  { name: 'Model S', type: 'Sedan' },
  { name: 'Model 3', type: 'Sedan' },
  { name: 'Model X', type: 'SUV' },
  { name: 'Model Y', type: 'SUV' },
  { name: 'Cybertruck', type: 'Truck' },
];

// EV models by make for Smartcar support
const EV_MODELS: Record<string, { name: string; type: string }[]> = {
  Tesla: TESLA_MODELS,
  Rivian: [
    { name: 'R1T', type: 'Truck' },
    { name: 'R1S', type: 'SUV' },
  ],
  Ford: [
    { name: 'Mustang Mach-E', type: 'SUV' },
    { name: 'F-150 Lightning', type: 'Truck' },
    { name: 'E-Transit', type: 'Van' },
  ],
  Chevrolet: [
    { name: 'Bolt EV', type: 'Hatchback' },
    { name: 'Bolt EUV', type: 'SUV' },
    { name: 'Equinox EV', type: 'SUV' },
    { name: 'Silverado EV', type: 'Truck' },
  ],
  BMW: [
    { name: 'i4', type: 'Sedan' },
    { name: 'iX', type: 'SUV' },
    { name: 'i7', type: 'Sedan' },
  ],
  Mercedes: [
    { name: 'EQS', type: 'Sedan' },
    { name: 'EQE', type: 'Sedan' },
    { name: 'EQB', type: 'SUV' },
  ],
  Volkswagen: [
    { name: 'ID.4', type: 'SUV' },
    { name: 'ID.Buzz', type: 'Van' },
  ],
  Audi: [
    { name: 'e-tron', type: 'SUV' },
    { name: 'e-tron GT', type: 'Sedan' },
    { name: 'Q4 e-tron', type: 'SUV' },
  ],
  Porsche: [
    { name: 'Taycan', type: 'Sedan' },
  ],
  Hyundai: [
    { name: 'Ioniq 5', type: 'SUV' },
    { name: 'Ioniq 6', type: 'Sedan' },
  ],
  Kia: [
    { name: 'EV6', type: 'SUV' },
    { name: 'EV9', type: 'SUV' },
  ],
  Lucid: [
    { name: 'Air', type: 'Sedan' },
  ],
  Polestar: [
    { name: 'Polestar 2', type: 'Sedan' },
    { name: 'Polestar 3', type: 'SUV' },
  ],
};

export function VehicleMakeSelector({ selectedMake, onSelectMake }: VehicleMakeSelectorProps) {
  const [makes, setMakes] = useState<VehicleMake[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMakes() {
      const { data, error } = await supabase
        .from('vehicle_makes')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (!error && data) {
        setMakes(data);
      }
      setIsLoading(false);
    }
    fetchMakes();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {makes.map((make) => (
        <Card
          key={make.id}
          className={cn(
            'p-4 cursor-pointer transition-all hover:shadow-md flex flex-col items-center justify-center gap-2 h-24',
            selectedMake === make.name 
              ? 'ring-2 ring-primary bg-primary/5' 
              : 'hover:bg-muted/50'
          )}
          onClick={() => onSelectMake(make.name)}
        >
          {make.name === 'Tesla' ? (
            <Zap className="w-8 h-8 text-primary" />
          ) : (
            <Car className="w-8 h-8 text-muted-foreground" />
          )}
          <span className="font-medium text-sm">{make.name}</span>
        </Card>
      ))}
    </div>
  );
}

export function VehicleModelSelector({ 
  make, 
  selectedModel, 
  onSelectModel 
}: { 
  make: string; 
  selectedModel: string | null; 
  onSelectModel: (model: string) => void;
}) {
  const models = EV_MODELS[make] || [];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {models.map((model) => (
        <Card
          key={model.name}
          className={cn(
            'p-4 cursor-pointer transition-all hover:shadow-md',
            selectedModel === model.name 
              ? 'ring-2 ring-primary bg-primary/5' 
              : 'hover:bg-muted/50'
          )}
          onClick={() => onSelectModel(model.name)}
        >
          <div className="font-medium">{model.name}</div>
          <div className="text-sm text-muted-foreground">{model.type}</div>
        </Card>
      ))}
    </div>
  );
}

export { EV_MODELS };
