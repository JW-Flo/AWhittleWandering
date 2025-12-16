import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'primary' | 'secondary' | 'accent';
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  variant = 'default',
}: StatCardProps) {
  const variantStyles = {
    default: 'bg-card',
    primary: 'bg-gradient-sunset text-primary-foreground',
    secondary: 'bg-gradient-forest text-secondary-foreground',
    accent: 'bg-accent/20',
  };

  const iconBgStyles = {
    default: 'bg-primary/10 text-primary',
    primary: 'bg-primary-foreground/20 text-primary-foreground',
    secondary: 'bg-secondary-foreground/20 text-secondary-foreground',
    accent: 'bg-accent text-accent-foreground',
  };

  return (
    <Card className={`shadow-card hover:shadow-elevated transition-shadow ${variantStyles[variant]}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className={`text-sm font-medium ${variant === 'default' ? 'text-muted-foreground' : 'opacity-80'}`}>
              {title}
            </p>
            <p className="text-3xl font-display font-bold">{value}</p>
            {subtitle && (
              <p className={`text-sm ${variant === 'default' ? 'text-muted-foreground' : 'opacity-70'}`}>
                {subtitle}
              </p>
            )}
            {trend && trendValue && (
              <p className={`text-sm font-medium ${
                trend === 'up' ? 'text-charging' : 
                trend === 'down' ? 'text-destructive' : 
                'text-muted-foreground'
              }`}>
                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${iconBgStyles[variant]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
