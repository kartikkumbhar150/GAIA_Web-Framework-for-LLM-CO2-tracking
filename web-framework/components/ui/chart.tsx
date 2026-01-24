"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "./utils";

/* ----------------------------------------
   THEME
----------------------------------------- */

const THEMES = { light: "", dark: ".dark" } as const;

/* ----------------------------------------
   CONFIG
----------------------------------------- */

export type ChartConfig = {
  [key: string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
    color?: string;
    theme?: Record<keyof typeof THEMES, string>;
  };
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within <ChartContainer />");
  }
  return context;
}

/* ----------------------------------------
   CONTAINER
----------------------------------------- */

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ReactNode;
}) {
  const uid = React.useId();
  const chartId = `chart-${id || uid.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={cn("flex aspect-video justify-center text-xs", className)}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

/* ----------------------------------------
   STYLE
----------------------------------------- */

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const entries = Object.entries(config).filter(
    ([, v]) => v.color || v.theme
  );

  if (!entries.length) return null;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, selector]) => `
${selector} [data-chart="${id}"] {
${entries
  .map(([key, cfg]) => {
    const color = cfg.theme?.[theme as keyof typeof THEMES] || cfg.color;
    return color ? `  --color-${key}: ${color};` : "";
  })
  .join("\n")}
}`
          )
          .join("\n"),
      }}
    />
  );
}

/* ----------------------------------------
   TOOLTIP (RECHARTS v2 SAFE)
----------------------------------------- */

const ChartTooltip = RechartsPrimitive.Tooltip;

type TooltipPayloadItem = {
  name?: string;
  value?: number | string;
  dataKey?: string;
  color?: string;
  payload?: Record<string, any>;
};

type ChartTooltipContentProps = {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: React.ReactNode;
  className?: string;
  indicator?: "dot" | "line" | "dashed";
  hideLabel?: boolean;
  hideIndicator?: boolean;
  formatter?: (
    value: any,
    name: any,
    item: any,
    index: number,
    payload: any
  ) => React.ReactNode;
};

function ChartTooltipContent({
  active,
  payload,
  label,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  formatter,
}: ChartTooltipContentProps) {
  const { config } = useChart();

  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      className={cn(
        "bg-background border border-border rounded-lg px-3 py-2 text-xs shadow-xl",
        className
      )}
    >
      {!hideLabel && label && (
        <div className="mb-1 font-medium">{label}</div>
      )}

      <div className="grid gap-1">
        {payload.map((item, index) => {
          const key = item.dataKey || item.name || "value";
          const cfg = config[key];
          const color = item.color || cfg?.color;

          return (
            <div key={index} className="flex items-center gap-2">
              {!hideIndicator && (
                <span
                  className={cn(
                    "inline-block h-2 w-2 rounded-sm",
                    indicator === "line" && "w-1 h-3",
                    indicator === "dashed" &&
                      "w-2 h-2 border border-dashed bg-transparent"
                  )}
                  style={{ backgroundColor: color }}
                />
              )}

              <span className="text-muted-foreground">
                {cfg?.label || item.name}
              </span>

              <span className="ml-auto font-mono font-medium">
                {formatter
                  ? formatter(item.value, item.name, item, index, payload)
                  : item.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ----------------------------------------
   LEGEND (SAFE)
----------------------------------------- */

const ChartLegend = RechartsPrimitive.Legend;

type LegendItem = {
  dataKey?: string;
  value?: string;
  color?: string;
};

function ChartLegendContent({
  payload,
  className,
}: {
  payload?: LegendItem[];
  className?: string;
}) {
  const { config } = useChart();

  if (!payload || payload.length === 0) return null;

  return (
    <div className={cn("flex gap-4 justify-center", className)}>
      {payload.map((item, index) => {
        const key = item.dataKey || item.value || "";
        const cfg = config[key];

        return (
          <div key={index} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-sm"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs">
              {cfg?.label || item.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ----------------------------------------
   EXPORTS
----------------------------------------- */

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
};
