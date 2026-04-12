import { NextResponse } from "next/server";
import { seedLookupData } from "@/lib/db/seed";

// POST /api/seed — seeds all lookup tables
// Only available in development mode
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Seed endpoint is disabled in production" },
      { status: 403 }
    );
  }

  try {
    await seedLookupData();
    return NextResponse.json({ message: "Seed completed successfully" });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Seed failed", details: String(error) },
      { status: 500 }
    );
  }
}
