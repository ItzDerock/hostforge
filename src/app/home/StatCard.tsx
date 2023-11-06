"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { RiPulseFill } from "react-icons/ri";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import styles from "./StatCard.module.css";

const TEST_DATA = [
  { cpu: 0.05 },
  { cpu: 0.1 },
  { cpu: 0.08 },
  { cpu: 0.09 },
  { cpu: 0.2 },
  { cpu: 0.1 },
  { cpu: 0.12 },
  { cpu: 0.3 },
];

export function StatCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>CPU Usage</CardTitle>
        <RiPulseFill className="text-2xl text-muted-foreground" />
      </CardHeader>

      <CardContent className="relative">
        {/* chart background */}
        <div className="absolute inset-0 z-0 h-full w-full">
          <ResponsiveContainer width={"100%"} height={"100%"}>
            <LineChart data={TEST_DATA}>
              <Line
                type="monotone"
                dataKey={"cpu"}
                stroke="hsl(var(--border))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={`relative z-10 ${styles["stat-card"]}`}>
          <p className="stroke stroke-card text-2xl font-bold">4.5%</p>
          <p className="stroke stroke-card text-sm text-muted-foreground">
            of 8 CPUs
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
