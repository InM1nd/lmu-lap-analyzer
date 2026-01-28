import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Brain } from "lucide-react";

export default function AICoach() {
  return (
    <Card className="h-full border-primary/20">
      <CardHeader className="flex flex-row items-center gap-2">
        <Brain className="h-6 w-6 text-primary" />
        <CardTitle>AI Coach Insights</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Waiting for lap data to generate insights...
          </p>
          <div className="h-32 rounded bg-secondary/20 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}
