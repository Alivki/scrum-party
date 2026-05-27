import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "~/components/ui/chart";
import type { BurndownPoint } from "~/lib/types";

const config = {
  remaining: { label: "Igjen", color: "var(--hot)" },
  ideal: { label: "Ideal", color: "var(--cobalt)" },
} satisfies ChartConfig;

interface Props {
  series: BurndownPoint[];
  totalPoints: number;
  height?: number | string;
}

export function BurndownChart({ series, totalPoints, height = 280 }: Props) {
  if (!series.length) {
    return (
      <div
        style={{ height }}
        className="grid place-items-center text-ink-3 font-mono text-sm border border-dashed border-ink-3"
      >
        ingen issues registrert
      </div>
    );
  }

  const yMax = Math.max(totalPoints, 1);

  return (
    <div style={{ height }}>
      <ChartContainer config={config}>
        <ComposedChart
          data={series}
          margin={{ top: 12, right: 20, left: 4, bottom: 4 }}
        >
          <defs>
            <linearGradient id="burndown-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--hot)" stopOpacity={0.32} />
              <stop offset="100%" stopColor="var(--hot)" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="var(--mute)"
            strokeWidth={1}
            vertical={false}
          />
          <XAxis
            dataKey="date"
            stroke="var(--ink-2)"
            strokeWidth={1}
            tickLine={false}
            tick={{
              fill: "var(--ink-3)",
              fontFamily: "JetBrains Mono",
              fontSize: 11,
            }}
            tickFormatter={(v) =>
              new Date(v).toLocaleTimeString("nb-NO", {
                hour: "2-digit",
                minute: "2-digit",
              })
            }
            minTickGap={28}
          />
          <YAxis
            domain={[0, yMax]}
            stroke="var(--ink-2)"
            strokeWidth={1}
            tickLine={false}
            tick={{
              fill: "var(--ink-3)",
              fontFamily: "JetBrains Mono",
              fontSize: 11,
            }}
            allowDecimals={false}
            width={32}
          />
          <ChartTooltip
            cursor={{ stroke: "var(--ink-3)", strokeDasharray: "2 2" }}
            content={
              <ChartTooltipContent
                labelFormatter={(v) =>
                  new Date(v as string).toLocaleString("nb-NO", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "short",
                  })
                }
              />
            }
          />
          <Area
            type="monotone"
            dataKey="remaining"
            stroke="var(--hot)"
            strokeWidth={2.5}
            fill="url(#burndown-fill)"
            dot={false}
            activeDot={{
              r: 5,
              stroke: "var(--paper)",
              strokeWidth: 2,
              fill: "var(--hot)",
            }}
            isAnimationActive
            animationDuration={420}
            animationEasing="ease-out"
          />
          <Line
            type="monotone"
            dataKey="ideal"
            stroke="var(--cobalt)"
            strokeWidth={1.5}
            strokeDasharray="5 5"
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ChartContainer>
    </div>
  );
}
