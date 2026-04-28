"use client";

import { useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const perf = window.performance;
    if (!perf || typeof perf.measure !== "function") return;

    const original = perf.measure.bind(perf);

    // Dev-only mitigation: Turbopack/Next dev instrumentation can occasionally call
    // `performance.measure()` with invalid mark timing, causing a hard runtime error.
    // We swallow ONLY that specific failure to avoid crashing the app.
    perf.measure = ((name: string, startMark?: string, endMark?: string) => {
      try {
        return original(name, startMark as any, endMark as any);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("cannot have a negative time stamp")) {
          return;
        }
        throw e;
      }
    }) as Performance["measure"];

    return () => {
      perf.measure = original as Performance["measure"];
    };
  }, []);

  return children;
}
