import DuckDBUploader from "@/components/DuckDBUploader";

export default function UploadPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Upload Telemetry</h1>
        <p className="text-muted-foreground">Upload your MoTeC (.duckdb converted) or CSV export files to analyze.</p>
      </div>

      <div className="w-full max-w-xl">
        <DuckDBUploader />
      </div>
    </div>
  );
}
