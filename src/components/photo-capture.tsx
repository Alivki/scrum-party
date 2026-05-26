import { Camera, ImagePlus, X } from "lucide-react";
import * as React from "react";
import { cn } from "~/lib/utils";

interface PhotoCaptureProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  className?: string;
  fallbackInitials?: string;
}

const OUTPUT_SIZE = 240;
const OUTPUT_QUALITY = 0.72;

export function PhotoCapture({
  value,
  onChange,
  className,
  fallbackInitials,
}: PhotoCaptureProps) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const dataUrl = await fileToSquareDataUrl(file, OUTPUT_SIZE);
      onChange(dataUrl);
    } catch (e: any) {
      setError(e?.message ?? "Klarte ikke å lese bildet.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {/* Avatar preview — passive, not clickable. */}
      <div className="relative shrink-0 h-20 w-20">
        <div className="absolute inset-0 rounded-full overflow-hidden bg-paper-2">
          {value ? (
            <img
              src={value}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span
              aria-hidden
              className="absolute inset-0 grid place-items-center font-display text-2xl text-ink/30 select-none"
            >
              {fallbackInitials || "??"}
            </span>
          )}
        </div>
        {value && (
          <button
            type="button"
            aria-label="Fjern foto"
            onClick={() => onChange(null)}
            className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-ink text-paper grid place-items-center border-2 border-paper hover:bg-hot transition-colors"
          >
            <X className="h-3 w-3" strokeWidth={2.5} />
          </button>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="caption mb-2">Passfoto</div>

        <div className="flex flex-wrap gap-2">
          <label
            className={cn(
              "btn btn-secondary btn-sm cursor-pointer",
              busy && "opacity-50 pointer-events-none",
            )}
          >
            <Camera className="h-3.5 w-3.5" strokeWidth={1.75} />
            Ta foto
            <input
              type="file"
              accept="image/*"
              capture="user"
              className="sr-only"
              disabled={busy}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </label>
          <label
            className={cn(
              "btn btn-secondary btn-sm cursor-pointer",
              busy && "opacity-50 pointer-events-none",
            )}
          >
            <ImagePlus className="h-3.5 w-3.5" strokeWidth={1.75} />
            Velg fra galleri
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={busy}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </label>
        </div>

        <p className="caption-3 mt-2 normal-case tracking-normal text-[11px] font-medium">
          {busy ? "leser…" : "valgfritt"}
        </p>

        {error && (
          <p
            role="alert"
            className="text-xs text-hot font-mono leading-tight mt-2"
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

async function fileToSquareDataUrl(file: File, size: number): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas ikke støttet.");
    const min = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - min) / 2;
    const sy = (img.naturalHeight - min) / 2;
    ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
    return canvas.toDataURL("image/jpeg", OUTPUT_QUALITY);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Klarte ikke å lese bildet."));
    img.src = src;
  });
}
