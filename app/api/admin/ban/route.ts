import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { userId, reason } = await req.json()

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required." },
        { status: 400 }
      )
    }

    let userToBan: { email: string } | null = await prisma.client.findUnique({
      where: { id: userId },
    })
    let userType: "client" | "provider" = "client"

    if (!userToBan) {
      userToBan = await prisma.provider.findUnique({
        where: { id: userId },
      })
      userType = "provider"
    }

    if (!userToBan) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      )
    }

    // Step 1: Set user as banned
    if (userType === "client") {
      await prisma.client.update({
        where: { id: userId },
        data: { isBanned: true },
      })
    } else {
      await prisma.provider.update({
        where: { id: userId },
        data: { isBanned: true },
      })
    }

    // Step 2: Extract email and add to BannedEmail permanently
    // Upsert so if they are banned again it doesn't crash on primary key conflict
    await prisma.bannedEmail.upsert({
      where: { email: userToBan.email },
      update: {
        reason: reason || "No reason provided",
        bannedAt: new Date(),
      },
      create: {
        email: userToBan.email,
        reason: reason || "No reason provided",
        bannedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, message: `Account for ${userToBan.email} was banned permanently.` }, { status: 200 })
  } catch (error) {
    console.error("Admin Ban API Error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
