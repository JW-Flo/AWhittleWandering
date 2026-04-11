import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, MapPin, Activity, BarChart3, PenLine } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const features = [
  {
    icon: MapPin,
    title: "Live journey tracking",
    description:
      "Follow a Continental USA road trip in real time. See the current state, the arc of progress, and meaningful moments as they unfold.",
  },
  {
    icon: Activity,
    title: "Vehicle telemetry",
    description:
      "Battery level, range, speed, temperature, and charging status — all pulled from the Tesla via the backend API.",
  },
  {
    icon: BarChart3,
    title: "Trip analytics",
    description:
      "Efficiency trends, cost analysis, environmental impact, and charging patterns across the entire journey.",
  },
  {
    icon: PenLine,
    title: "Journey narrative",
    description:
      "AI-assisted journal entries, photo uploads with EXIF tagging, and a timeline of meaningful segments and milestones.",
  },
];

const Demo: React.FC = () => {
  useDocumentTitle("Demo");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="container mx-auto px-4 pt-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">A Whittle Wandering</p>
            <h1 className="text-2xl font-semibold tracking-tight">Platform Demo</h1>
          </div>
          <Button asChild variant="ghost">
            <Link to="/">Home</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 space-y-10">
        {/* Hero */}
        <section className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight">
            A journey platform for long-haul Tesla road trips
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Continental USA, 31 states, 55 days, Tesla Model Y "Midnight Shadow." This platform
            turns that trip into narrative moments and live presence — experienced by followers in
            real time, and held afterward as a story.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="secondary">Hono + Cloudflare Workers</Badge>
            <Badge variant="secondary">React + Vite</Badge>
            <Badge variant="secondary">D1 + KV + R2</Badge>
            <Badge variant="secondary">Mapbox GL</Badge>
          </div>
        </section>

        {/* Features */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((f) => (
            <Card key={f.title} className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <f.icon className="w-5 h-5 text-primary" />
                  {f.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* CTAs */}
        <section className="flex flex-col sm:flex-row gap-3">
          <Button asChild className="h-11 px-6">
            <Link to="/journey/continental-usa-2025">
              View live journey <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-11 px-6">
            <Link to="/dashboard">
              Open dashboard <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </section>
      </main>
    </div>
  );
};

export default Demo;
