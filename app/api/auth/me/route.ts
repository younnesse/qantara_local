import { NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { prisma } from "@/lib/prisma"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret")

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("cookie")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split("; ").find(c => c.startsWith("auth_token="))?.split("=")[1]
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify token
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const { id, role } = payload as any

    // Fetch latest user details from DB
    let user = null
    if (role === "provider") {
      user = await prisma.provider.findUnique({ where: { id } })
    } else {
      user = await prisma.client.findUnique({ where: { id } })
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Convert to context model
    const authUser = {
      id: user.id,
      username: user.name || "User",
      email: user.email,
      role: role.toLowerCase(),
      providerStatus: (user as any).certificateStatus === "VALID" ? "verified" : "pending",
      title: (user as any).title,
      profileImage: (user as any).profileImage,
      bio: (user as any).bio,
      isProfileComplete: (user as any).isProfileComplete,
    }

    return NextResponse.json({ user: authUser }, { status: 200 })
  } catch (error) {
    console.error("Auth Me API Error:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
