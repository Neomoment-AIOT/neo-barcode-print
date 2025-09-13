// /api/token-monitor/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pharmacyId = searchParams.get("pharmacyId"); // 👈 from frontend

    if (!pharmacyId) {
      return NextResponse.json(
        { error: "Missing pharmacyId" },
        { status: 400 }
      );
    }

    const pharmacyIdNum = parseInt(pharmacyId, 10);
    if (isNaN(pharmacyIdNum)) {
      return NextResponse.json(
        { error: "Invalid pharmacyId" },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().slice(0, 10);

    const tokens = await prisma.counter_data.findMany({
      where: {
        date: today,
        phar_id: pharmacyIdNum, // ✅ now number
      },
      orderBy: { timestamp: "asc" },
    });

    const servedTokens = tokens.filter((t) => t.Served && t.served_time);
    const unservedTokens = tokens.filter((t) => !t.Served);

    const currentUnserved = unservedTokens[0] ?? null;
    const nextUnserved = unservedTokens[1] ?? null;
    const lastServed = servedTokens.at(-1) ?? null;

    // Avg serve time (seconds)
    let avgServeTime: number | null = null;
    if (servedTokens.length > 0) {
      const diffs = servedTokens
        .map((t) =>
          t.timestamp && t.served_time
            ? ((t.served_time as Date).getTime() -
                (t.timestamp as Date).getTime()) /
              1000
            : null
        )
        .filter((d): d is number => d !== null);
      if (diffs.length > 0) {
        avgServeTime = diffs.reduce((sum, val) => sum + val, 0) / diffs.length;
      }
    }

    // Avg next gap (seconds)
    let avgNextGap: number | null = null;
    const nextDiffs = tokens
      .map((t) =>
        t.served_time && t.next_time
          ? ((t.next_time as Date).getTime() -
              (t.served_time as Date).getTime()) /
            1000
          : null
      )
      .filter((d): d is number => d !== null);
    if (nextDiffs.length > 0) {
      avgNextGap = nextDiffs.reduce((sum, val) => sum + val, 0) / nextDiffs.length;
    }

    return NextResponse.json({
      currentUnserved,
      nextUnserved,
      lastServed,
      avgServeTime,
      avgNextGap,
    });
  } catch (err) {
    console.error("❌ Token monitor error:", err);
    return NextResponse.json(
      { error: "Failed to fetch token data" },
      { status: 500 }
    );
  }
}
