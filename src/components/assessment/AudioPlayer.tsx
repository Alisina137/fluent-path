import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pause, Play, RotateCcw, Volume2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { ListeningClip } from "@/lib/types";

export function AudioPlayer({
  clip,
  showTranscript = false,
}: {
  clip: ListeningClip;
  showTranscript?: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const ref = useRef<number | null>(null);
  useEffect(() => {
    if (!playing) return;
    ref.current = window.setInterval(() => {
      setElapsed((e) => {
        if (e + 1 >= clip.duration_seconds) {
          setPlaying(false);
          return clip.duration_seconds;
        }
        return e + 1;
      });
    }, 1000);
    return () => {
      if (ref.current) window.clearInterval(ref.current);
    };
  }, [playing, clip.duration_seconds]);
  const pct = Math.round((elapsed / clip.duration_seconds) * 100);
  const ss = String(elapsed % 60).padStart(2, "0");
  return (
    <Card className="flex flex-col gap-3 border-primary/20 bg-primary/5 p-4">
      <div className="flex items-center gap-3">
        <Button
          size="icon"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={() => {
            setElapsed(0);
            setPlaying(false);
          }}
          aria-label="Replay"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="text-sm font-medium">{clip.title}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Volume2 className="h-3 w-3" />
            <span>
              0:{ss} / 0:{String(clip.duration_seconds).padStart(2, "0")}
            </span>
            <span className="opacity-60">· sample audio</span>
          </div>
        </div>
      </div>
      <Progress value={pct} className="h-1.5" />
      {showTranscript ? (
        <details className="text-sm text-muted-foreground">
          <summary className="cursor-pointer font-medium text-foreground">Show transcript</summary>
          <p className="mt-2">{clip.transcript}</p>
        </details>
      ) : null}
    </Card>
  );
}
