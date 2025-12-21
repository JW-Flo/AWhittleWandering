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
    primary: 'bg-card border-primary/30',
    secondary: 'bg-card border-accent/30',
    accent: 'bg-accent/10',
  };

  const iconBgStyles = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-accent/10 text-accent',
    accent: 'bg-accent/20 text-accent',
  };

  return (
    <Card className={`shadow-card hover:shadow-elevated transition-shadow ${variantStyles[variant]}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>
            <p className={`text-3xl font-display font-bold ${variant === 'primary' ? 'text-primary' : variant === 'secondary' ? 'text-accent' : 'text-foreground'}`}>{value}</p>
            {subtitle && (
              <p className="text-sm text-muted-foreground">
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
