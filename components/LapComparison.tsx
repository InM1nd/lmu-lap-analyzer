import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function LapComparison() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Lap Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-64 border rounded bg-secondary/10 text-muted-foreground">
          Telemetry Charts will appear here (Recharts)
        </div>
      </CardContent>
    </Card>
  );
}
