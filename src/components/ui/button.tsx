import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { cn } from "~/lib/utils";

type Variant = "primary" | "secondary" | "quiet";
type Size = "default" | "sm" | "icon";

const variantClass: Record<Variant, string> = {
  primary: "btn btn-primary",
  secondary: "btn btn-secondary",
  quiet: "btn btn-quiet",
};

const sizeClass: Record<Size, string> = {
  default: "",
  sm: "btn-sm",
  icon: "btn-icon",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "default", asChild, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref as React.Ref<HTMLButtonElement>}
        className={cn(variantClass[variant], sizeClass[size], className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
