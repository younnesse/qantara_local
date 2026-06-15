import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let userId = body.userId;
    const { bio, profilePhoto, servicesOffered, portfolio, category, location } = body;

    if (!userId) {
      // Fallback: Try to read userId from auth_token cookie
      const authHeader = req.headers.get("cookie")
      if (authHeader) {
        const token = authHeader.split("; ").find(c => c.startsWith("auth_token="))?.split("=")[1]
        if (token) {
          try {
            const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret")
            const { payload } = await jwtVerify(token, JWT_SECRET)
            userId = (payload as any).id || null
          } catch (jwtError) {
            console.error("JWT verification failed in complete-profile fallback:", jwtError)
          }
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ message: "User ID is required." }, { status: 400 });
    }

    const ALLOWED_CATEGORIES = ["regulated_profession", "artisan", "auto_entrepreneur"];
    if (category && !ALLOWED_CATEGORIES.includes(category)) {
      return NextResponse.json({ message: "Invalid category selection." }, { status: 400 });
    }

    // Process services: prepare data to create Service records
    const servicesToCreate = servicesOffered.map((s: any) => ({
      name: s.name || s.title || "Service",
      description: s.description || "",
      price: parseFloat(s.price) || 0,
      duration: parseInt(s.duration) || 60,
      category: category,
    }));

    await prisma.provider.update({
      where: { id: userId },
      data: {
        bio,
        profileImage: profilePhoto,
        location,
        portfolio: JSON.stringify(portfolio),
        category: category,
        isProfileComplete: true,
        services: {
          deleteMany: {}, // Delete old services and recreate
          create: servicesToCreate,
        }
      },
    });

    // Send Telegram alert
    try {
      const provider = await prisma.provider.findUnique({
        where: { id: userId },
        select: { name: true }
      });
      const { sendTelegramNotification } = await import("@/lib/telegram")
      await sendTelegramNotification(
        `🚀 <b>[Profile Completed]</b>\n` +
        `<b>Provider:</b> ${provider?.name || "Unknown"} (ID: <code>${userId}</code>)\n` +
        `<b>Location:</b> ${location || "Not specified"}\n` +
        `<b>Services Added:</b> ${servicesOffered?.length || 0}\n` +
        `<b>Time:</b> ${new Date().toLocaleString()}`
      )
    } catch (tgErr) {
      console.error("Failed to send Telegram notification:", tgErr)
    }

    return NextResponse.json({
      success: true,
      message: "Profile completed successfully."
    });

  } catch (error) {
    console.error("Profile Completion Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

