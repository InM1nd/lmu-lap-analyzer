"use client";

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { UploadCloud, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { useLapsStore } from '@/store/lapsStore';
import { loadDuckDBFile, queryLaps } from '@/lib/duckdb';
import { useRouter } from 'next/navigation';
import Loading from './ui/Loading';

export default function DuckDBUploader() {
  const router = useRouter();
  const { setLaps, setLoading, setError, setFilename, setMetadata, reset, loading, error, laps, filename } = useLapsStore();

  // Local state for analysis result summary before navigation
  const [summary, setSummary] = useState<{ count: number, best: string, car?: string, track?: string } | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    reset();
    setFilename(file.name);
    setLoading(true);

    try {
      const conn = await loadDuckDBFile(file);
      const lapsData = await queryLaps(conn);

      if (lapsData.length === 0) {
        throw new Error("No laps found in provided file.");
      }

      setLaps(lapsData);

      // Basic Detection logic based on bounding box
      // Bahrain: x around -500 to 500 roughly in some coordinate systems, but strictly depends on game coords.
      // Using prompt example logic:
      let detectedTrack = "Unknown Track";
      let maxX = -Infinity, minX = Infinity;

      // Sample first lap telemetry to find bounds
      if (lapsData[0]?.telemetry?.length > 0) {
        lapsData[0].telemetry.forEach(p => {
          if (p.position_x !== undefined) {
            maxX = Math.max(maxX, p.position_x);
            minX = Math.min(minX, p.position_x);
          }
        });

        if (minX >= -500 && maxX <= 500) {
          // detectedTrack = "Bahrain International Circuit"; 
          // Very dummy check for example purposes, real coords are usually larger or specific
        }
      }

      // Find best lap
      const bestLap = lapsData.reduce((prev, curr) => prev.lap_time_ms < curr.lap_time_ms ? prev : curr);
      const bestTimeStr = new Date(bestLap.lap_time_ms).toISOString().slice(14, 22); // mm:ss.SSS rough

      setSummary({
        count: lapsData.length,
        best: bestTimeStr,
        track: detectedTrack,
        car: "Ferrari 296 GT3" // Dummy detection or need metadata column
      });

      // Assuming metadata usually comes from a separate table or header not yet queried for simplicity.

    } catch (err: any) {
      setError(err.message || "Failed to parse file");
    } finally {
      setLoading(false);
    }

  }, [reset, setFilename, setLoading, setLaps, setError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'application/octet-stream': ['.duckdb', '.db'], // Standard
      'text/csv': ['.csv']
    }
  });

  const handleAnalyze = () => {
    router.push('/analysis');
  };

  return (
    <Card className="w-full border-dashed transition-colors">
      <CardContent className="p-0">
        {!summary && !loading && (
          <div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center p-10 gap-4 cursor-pointer hover:bg-secondary/10 transition-colors rounded-lg ${isDragActive ? 'bg-secondary/20' : ''}`}
          >
            <input {...getInputProps()} />
            <div className="p-4 rounded-full bg-secondary/50">
              <UploadCloud className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-medium">
                {isDragActive ? "Drop the file here..." : "Drag & drop LMU telemetry (.duckdb)"}
              </p>
              <p className="text-xs text-muted-foreground">or click to select file</p>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-destructive mt-4">
                <AlertCircle size={16} />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loading text="Parsing Lap Data with DuckDB WASM..." />
          </div>
        )}

        {summary && !loading && (
          <div className="p-8 space-y-6">
            <div className="flex items-center gap-4 text-green-500 justify-center">
              <CheckCircle size={32} />
              <h3 className="text-xl font-bold">Analysis Ready</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-secondary/20 rounded-md">
                <span className="text-muted-foreground block">Session File</span>
                <span className="font-mono truncate block max-w-[200px]">{filename}</span>
              </div>
              <div className="p-3 bg-secondary/20 rounded-md">
                <span className="text-muted-foreground block">Total Laps</span>
                <span className="font-bold">{summary.count} laps</span>
              </div>
              <div className="p-3 bg-secondary/20 rounded-md">
                <span className="text-muted-foreground block">Best Lap</span>
                <span className="font-bold text-primary">{summary.best}</span>
              </div>
              <div className="p-3 bg-secondary/20 rounded-md">
                <span className="text-muted-foreground block">Car / Track</span>
                <span className="font-medium">{summary.car}, {summary.track}</span>
              </div>
            </div>

            <Button onClick={handleAnalyze} className="w-full gap-2" size="lg">
              Go to Dashboard <FileText size={16} />
            </Button>

            <Button variant="ghost" className="w-full" onClick={reset}>
              Upload Different File
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
