import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { SignJWT } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret")

export async function POST(req: Request) {
  try {
    const { email, password, role } = await req.json()

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "Email, password, and role are required." },
        { status: 400 }
      )
    }

    let user = null;
    if (role.toUpperCase() === "PROVIDER") {
      user = await prisma.provider.findUnique({ where: { email } })
    } else {
      user = await prisma.client.findUnique({ where: { email } })
    }

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 401 }
      )
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 401 }
      )
    }

    if (user.isBanned) {
      return NextResponse.json(
        { error: "This account has been banned." },
        { status: 403 }
      )
    }

    // Handle soft deletion logic
    if (user.deletedAt) {
      const msIn30Days = 30 * 24 * 60 * 60 * 1000
      const now = new Date().getTime()
      const deletedTime = new Date(user.deletedAt).getTime()

      if (now - deletedTime > msIn30Days) {
        return NextResponse.json(
          { error: "Account has been permanently deleted because it surpassed the 30-day grace period." },
          { status: 403 }
        )
      } else {
        // Restore account
        if (role.toUpperCase() === "PROVIDER") {
          await prisma.provider.update({
            where: { id: user.id },
            data: { deletedAt: null },
          })
        } else {
          await prisma.client.update({
            where: { id: user.id },
            data: { deletedAt: null },
          })
        }
        user.deletedAt = null 
      }
    }

    // Convert to the context model (this keeps backwards compatibility with the existing auth context)
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

    // Sign JWT
    const token = await new SignJWT(authUser as any)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d") // valid for 30 days
      .sign(JWT_SECRET)

    const response = NextResponse.json({ user: authUser }, { status: 200 })

    // Set cookie
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Login API Error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
