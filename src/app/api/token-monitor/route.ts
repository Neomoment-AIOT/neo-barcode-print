import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const tokens = await prisma.counter_data.findMany({
      where: { date: today },
      orderBy: { timestamp: "asc" },
    });

    const servedTokens = tokens.filter((t) => t.Served && t.served_time);
    const unservedTokens = tokens.filter((t) => !t.Served);

    const currentUnserved = unservedTokens.length > 0 ? unservedTokens[0] : null;
    const nextUnserved = unservedTokens.length > 1 ? unservedTokens[1] : null;
    const lastServed =
      servedTokens.length > 0 ? servedTokens[servedTokens.length - 1] : null;

    // Avg serve time (in seconds)
    let avgServeTime: number | null = null;
    if (servedTokens.length > 0) {
      const diffs = servedTokens
        .map((t) => {
          if (!t.timestamp || !t.served_time) return null;
          return (
            ((t.served_time as Date).getTime() -
              (t.timestamp as Date).getTime()) /
            1000 // 🔥 seconds
          );
        })
        .filter((d): d is number => d !== null);

      if (diffs.length > 0) {
        avgServeTime =
          diffs.reduce((sum, val) => sum + val, 0) / diffs.length;
      }
    }

    // Avg next gap (in seconds)
    let avgNextGap: number | null = null;
    const nextDiffs = tokens
      .map((t) => {
        if (!t.served_time || !t.next_time) return null;
        return (
          ((t.next_time as Date).getTime() -
            (t.served_time as Date).getTime()) /
          1000 // 🔥 seconds
        );
      })
      .filter((d): d is number => d !== null);

    if (nextDiffs.length > 0) {
      avgNextGap =
        nextDiffs.reduce((sum, val) => sum + val, 0) / nextDiffs.length;
    }

    return NextResponse.json({
      currentUnserved,
      nextUnserved,
      lastServed,
      avgServeTime, // seconds
      avgNextGap, // seconds
      debug: {
        today,
        totalTokens: tokens.length,
        servedCount: servedTokens.length,
        unservedCount: unservedTokens.length,
        nextGapSamples: nextDiffs,
      },
    });
  } catch (err) {
    console.error("❌ Token monitor error:", err);
    return NextResponse.json(
      { error: "Failed to fetch token data" },
      { status: 500 }
    );
  }
}
