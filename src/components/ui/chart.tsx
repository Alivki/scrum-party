import * as React from "react";
import * as Recharts from "recharts";
import { cn } from "~/lib/utils";

export type ChartConfig = Record<
  string,
  { label?: React.ReactNode; color?: string }
>;

const ChartContext = React.createContext<ChartConfig | null>(null);
function useChartConfig() {
  return React.useContext(ChartContext) ?? {};
}

interface ChartContainerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  config: ChartConfig;
  children: React.ComponentProps<typeof Recharts.ResponsiveContainer>["children"];
}

export const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ config, children, className, ...props }, ref) => (
    <ChartContext.Provider value={config}>
      <div ref={ref} className={cn("h-full w-full", className)} {...props}>
        <Recharts.ResponsiveContainer>{children}</Recharts.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  ),
);
ChartContainer.displayName = "ChartContainer";

export const ChartTooltip = Recharts.Tooltip;

export const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Recharts.Tooltip> &
    React.ComponentProps<"div"> & {
      labelFormatter?: (label: any, payload: any) => React.ReactNode;
    }
>(({ active, payload, label, labelFormatter, className }, ref) => {
  const config = useChartConfig();
  if (!active || !payload?.length) return null;
  return (
    <div
      ref={ref}
      className={cn(
        "bg-paper border-2 border-ink shadow-[3px_3px_0_0_var(--ink)] px-3 py-2 text-xs",
        className,
      )}
    >
      <div className="caption-3 mb-1">
        {labelFormatter ? labelFormatter(label, payload) : String(label ?? "")}
      </div>
      {payload.map((p: any) => {
        const key = String(p.dataKey ?? p.name);
        const cfg = config[key];
        return (
          <div key={key} className="flex items-center gap-2 leading-tight py-0.5">
            <span
              aria-hidden
              className="block h-2 w-3"
              style={{ background: p.color ?? cfg?.color }}
            />
            <span className="text-ink-2">{cfg?.label ?? p.name}</span>
            <span className="num font-bold text-ink ml-auto">{p.value}</span>
          </div>
        );
      })}
    </div>
  );
});
ChartTooltipContent.displayName = "ChartTooltipContent";
