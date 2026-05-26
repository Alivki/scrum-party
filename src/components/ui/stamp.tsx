import * as React from "react";
import { cn } from "~/lib/utils";

type StampProps = React.HTMLAttributes<HTMLSpanElement> & {
  tilt?: "left" | "right";
};

export const Stamp = React.forwardRef<HTMLSpanElement, StampProps>(
  ({ className, tilt = "left", ...props }, ref) => (
    <span
      ref={ref}
      className={cn("stamp", tilt === "right" && "stamp-r", className)}
      {...props}
    />
  ),
);
Stamp.displayName = "Stamp";

type StickerProps = React.HTMLAttributes<HTMLSpanElement> & {
  tint?: boolean;
};

export const Sticker = React.forwardRef<HTMLSpanElement, StickerProps>(
  ({ className, tint, ...props }, ref) => (
    <span
      ref={ref}
      className={cn("sticker", tint && "sticker-tint", className)}
      {...props}
    />
  ),
);
Sticker.displayName = "Sticker";
