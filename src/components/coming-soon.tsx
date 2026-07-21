import { Hammer, Loader2 } from "lucide-react";

export function ComingSoon({ title, description }: { title: string, description: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
      <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Hammer className="h-10 w-10 text-primary opacity-50" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight mb-2">{title}</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        {description}
      </p>
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full border border-border">
        <Loader2 className="w-4 h-4 animate-spin" />
        Scheduled for the next development stage
      </div>
    </div>
  );
}
