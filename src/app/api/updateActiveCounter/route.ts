// src/app/api/registerCounter/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { device_id, phar_id, status } = body;

    if (!device_id || phar_id === undefined || typeof status !== "boolean") {
      return NextResponse.json(
        { error: "Missing or invalid device_id / phar_id / status" },
        { status: 400 }
      );
    }

    const pharId = Number(phar_id);
    if (Number.isNaN(pharId)) {
      return NextResponse.json({ error: "Invalid phar_id" }, { status: 400 });
    }

    // Find if this device already exists (any pharmacy)
    const existing = await prisma.counter_devices.findFirst({
      where: { device_id },
    });

    // helper: get next counter index for a pharmacy
    const getNextCounterIndex = async (pId: number) => {
      const last = await prisma.counter_devices.findFirst({
        where: { phar_id: pId },
        orderBy: { counter_index: "desc" },
      });
      return (last?.counter_index ?? 0) + 1;
    };

    // CASE A: device already exists in DB
    if (existing) {
      // same pharmacy case
      if (existing.phar_id === pharId) {
        if (existing.status === status) {
          return NextResponse.json({
            success: true,
            message: "No change",
            counter_index: existing.counter_index,
            status: existing.status,
          });
        }

        // status changed for same pharmacy
        let counterIndexToSet = existing.counter_index ?? 0;

        await prisma.$transaction(async (tx) => {
          if (status) {
            if (!counterIndexToSet || counterIndexToSet <= 0) {
              counterIndexToSet = await getNextCounterIndex(pharId);
            }
            await tx.counter_devices.update({
              where: { id: existing.id },
              data: {
                status: true,
                counter_index: counterIndexToSet,
              },
            });
            await tx.pharmacy.update({
              where: { phar_id: pharId },
              data: { active_counters: { increment: 1 } },
            });
          } else {
            await tx.counter_devices.update({
              where: { id: existing.id },
              data: { status: false },
            });
            await tx.pharmacy.update({
              where: { phar_id: pharId },
              data: { active_counters: { decrement: 1 } },
            });
          }
        });

        const updated = await prisma.counter_devices.findUnique({
          where: { id: existing.id },
        });

        return NextResponse.json({
          success: true,
          message: "Updated device status",
          counter_index: updated?.counter_index ?? 0,
          status: updated?.status ?? status,
        });
      }

      // different pharmacy case: move device to new pharmacy
      const newCounterIndex = status ? await getNextCounterIndex(pharId) : 0;

      await prisma.$transaction(async (tx) => {
        if (existing.status) {
          await tx.pharmacy.update({
            where: { phar_id: existing.phar_id },
            data: { active_counters: { decrement: 1 } },
          });
        }

        await tx.counter_devices.update({
          where: { id: existing.id },
          data: {
            phar_id: pharId,
            counter_index: newCounterIndex, // always reset/reassign
            status,
          },
        });

        if (status) {
          await tx.pharmacy.update({
            where: { phar_id: pharId },
            data: { active_counters: { increment: 1 } },
          });
        }
      });

      const updated = await prisma.counter_devices.findUnique({
        where: { id: existing.id },
      });

      return NextResponse.json({
        success: true,
        message: "Device moved/updated",
        counter_index: updated?.counter_index ?? 0,
        status: updated?.status ?? status,
      });
    }

    // CASE B: device does NOT exist -> create new record
    const counterIndex = status ? await getNextCounterIndex(pharId) : 0;

    const created = await prisma.$transaction(async (tx) => {
      const row = await tx.counter_devices.create({
        data: {
          device_id,
          phar_id: pharId,
          counter_index: counterIndex,
          status,
        },
      });

      if (status) {
        await tx.pharmacy.update({
          where: { phar_id: pharId },
          data: { active_counters: { increment: 1 } },
        });
      }
      return row;
    });

    return NextResponse.json({
      success: true,
      message: "New device registered",
      counter_index: created.counter_index,
      status: created.status,
    });
  } catch (err) {
    console.error("❌ Register Counter Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
