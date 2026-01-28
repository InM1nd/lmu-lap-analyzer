import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  className?: string;
  size?: number;
  text?: string;
}

export default function Loading({ className, size = 24, text }: LoadingProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <Loader2 className="animate-spin text-primary" size={size} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}
