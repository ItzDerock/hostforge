"use client";

import { type LucideIcon } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { AnimatedNumber } from "~/components/AnimatedPercent";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import styles from "./StatCard.module.css";

export function StatCard(props: {
  title: string;

  icon: React.FC<{ className: string }> | LucideIcon;
  data: unknown[];
  dataKey: string;

  value: number;
  unit?: string;
  subvalue?: string;

  secondaryValue?: number;
  secondaryUnit?: string;
  secondarySubvalue?: string;

  type?: "fullscreen" | "card";
}) {
  const rechartsColorId = `color${props.dataKey}`;
  const Icon = props.icon;

  return (
    <Card
      className={`relative overflow-clip ${
        props.type === "fullscreen" ? "h-full w-full" : undefined
      }`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>{props.title}</CardTitle>
        <Icon className="text-2xl text-muted-foreground" />
      </CardHeader>

      <CardContent>
        {/* chart background */}
        <div className="absolute inset-0 z-0 h-full w-full">
          <ResponsiveContainer
            width={"100%"}
            height={"40%"}
            className="absolute bottom-0 left-0"
          >
            <AreaChart
              data={props.data}
              margin={{
                top: 0,
                right: 0,
                left: 0,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient
                  id={rechartsColorId}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.4}
                  />
                </linearGradient>
              </defs>

              <Area
                type="monotone"
                dataKey={props.dataKey}
                stroke="hsl(var(--primary))"
                fill={`url(#${rechartsColorId})`}
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="relative z-10">
          <div className="stroke flex flex-row stroke-card text-2xl font-bold">
            <div>
              <AnimatedNumber number={props.value} />
              {props.unit}

              {props.subvalue !== undefined && (
                <p
                  className={`stroke stroke-card text-sm text-foreground/80 ${styles["stat-card"]} font-normal`}
                >
                  {props.subvalue}
                </p>
              )}
            </div>

            {props.secondaryValue !== undefined && (
              <div className="ml-auto mr-0 text-right">
                <AnimatedNumber number={props.secondaryValue} />
                {props.secondaryUnit}

                {props.secondarySubvalue && (
                  <p
                    className={`stroke stroke-card text-sm text-foreground/80 ${styles["stat-card"]} text-right font-normal`}
                  >
                    {props.secondarySubvalue}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
