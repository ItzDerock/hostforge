"use client";

import { useEffect, useRef } from "react";
import { cn } from "~/utils/utils";
import styles from "./AnimatedPercent.module.css";

export type AnimatedNumberProps = {
  number: number;
  className?: string;
};

export function AnimatedNumber(props: AnimatedNumberProps) {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    divRef.current?.style.setProperty("--percent", props.number.toString());
  }, [props.number]);

  return (
    <div className={cn("relative inline-block", props.className)}>
      <div className="absolute inset-0 text-transparent">
        {props.number.toFixed(2)}
      </div>
      <div className={styles["animated-percent"]} ref={divRef} />
    </div>
  );
}
