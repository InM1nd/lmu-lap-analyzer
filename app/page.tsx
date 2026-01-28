import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowRight, BarChart2, Zap, Brain } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-12">
      <div className="text-center space-y-6 max-w-3xl">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          Master Le Mans Ultimate with <span className="text-primary">AI-Powered Insights</span>
        </h1>
        <p className="text-xl text-muted-foreground">
          Upload your telemetry data, verify your laps, and get personalized coaching from our AI agent.
          Identify where you lose time and how to fix it.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/upload">
            <Button size="lg" className="gap-2">
              Start Analysis <ArrowRight size={16} />
            </Button>
          </Link>
          <Button variant="outline" size="lg">View Demo</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl px-4">
        <FeatureCard
          icon={<BarChart2 className="h-10 w-10 text-primary" />}
          title="Advanced Telemetry"
          description="Visualize speed, throttle, brake, and steering traces with DuckDB-powered precision."
        />
        <FeatureCard
          icon={<Brain className="h-10 w-10 text-primary" />}
          title="AI Coaching"
          description="Get natural language feedback on your driving style and specific corners."
        />
        <FeatureCard
          icon={<Zap className="h-10 w-10 text-primary" />}
          title="Instant Processing"
          description="Local-first processing means your data stays private and analysis is lightning fast."
        />
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex flex-col items-center text-center p-6 space-y-4 rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="p-3 bg-secondary/50 rounded-full">
        {icon}
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
