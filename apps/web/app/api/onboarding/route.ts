import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      fullName,
      phoneNumber,
      role,
      email,
    } = body as {
      fullName: string;
      phoneNumber: string;
      role: "BUYER" | "CARDHOLDER" | "BOTH";
      email: string;
    };

    if (!email) {
      return NextResponse.json(
        { message: "Missing email" },
        { status: 400 }
      );
    }

    // 1) Ensure User row exists (uniquely by email)
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name: fullName,
      },
      create: {
        email,
        name: fullName,
      },
    });

    // 2) Ensure UserProfile row exists / is updated
    await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        fullName,
        phoneNumber,
        role,
      },
      create: {
        userId: user.id,
        fullName,
        phoneNumber,
        role,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Onboarding error:", err);

    const message =
      err instanceof Error ? err.message : "Unknown server error";

    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}
