"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { RiPulseFill } from "react-icons/ri";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import styles from "./StatCard.module.css";

export function StatCard<T extends { [key: string]: number }>(props: {
  title: string;
  value: string;
  subvalue: string;
  icon: React.FC<{ className: string }>;
  data: T[];
  dataKey: keyof T & string;
}) {
  const rechartsColorId = `color${props.dataKey}`;
  const Icon = props.icon;

  return (
    <Card className="relative overflow-clip">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>{props.title}</CardTitle>
        <Icon className="text-2xl text-muted-foreground" />
      </CardHeader>

      <CardContent>
        {/* chart background */}
        <div className="absolute inset-0 z-0 h-full w-full">
          <ResponsiveContainer
            width={"100%"}
            height={"50%"}
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

        <div className={`relative z-10 ${styles["stat-card"]}`}>
          <p className="stroke stroke-card text-2xl font-bold">{props.value}</p>
          <p className="stroke stroke-card text-sm text-muted-foreground">
            {props.subvalue}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
