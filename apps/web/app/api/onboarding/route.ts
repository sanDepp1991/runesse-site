import { NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { fullName, phoneNumber, role, email } = body as {
      fullName: string;
      phoneNumber: string;
      role: "BUYER" | "CARDHOLDER" | "BOTH";
      email: string;
    };
const buyerEnabled = role === "BUYER" || role === "BOTH";
const cardholderEnabled = role === "CARDHOLDER" || role === "BOTH";


    if (!email) {
      return NextResponse.json({ message: "Missing email" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!fullName || !fullName.trim()) {
      return NextResponse.json({ message: "Missing full name" }, { status: 400 });
    }

    if (!phoneNumber || !phoneNumber.trim()) {
      return NextResponse.json({ message: "Missing phone number" }, { status: 400 });
    }

    // 1) Find or create User (email unique already enforced by schema)
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { profile: true },
    });

    // If profile already exists, block repeat onboarding
    if (user?.profile) {
      return NextResponse.json(
        { ok: false, code: "ALREADY_ONBOARDED", message: "Profile already exists. Please sign in." },
        { status: 409 }
      );
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: fullName.trim(),
          role,
          buyerEnabled,
          cardholderEnabled,
        },
        include: { profile: true },
      });
    } else {
      // user exists but no profile yet – keep user row, update basics
      await prisma.user.update({
        where: { id: user.id },
        data: { name: fullName.trim(), role, buyerEnabled, cardholderEnabled },
      });
    }

    // 2) Create profile exactly once (userId is unique)
    await prisma.userProfile.create({
      data: {
        userId: user.id,
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        role,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Onboarding error:", err);

    // Race-condition safety: email unique or userId unique
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { ok: false, code: "ALREADY_REGISTERED", message: "Already registered. Please sign in." },
        { status: 409 }
      );
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
