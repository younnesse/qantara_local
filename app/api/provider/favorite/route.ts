import { NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { prisma } from "@/lib/prisma"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret")

async function getAuthUser(req: Request) {
  try {
    const authHeader = req.headers.get("cookie")
    if (!authHeader) return null

    const token = authHeader.split("; ").find(c => c.startsWith("auth_token="))?.split("=")[1]
    if (!token) return null

    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as { id: string; role: string }
  } catch (error) {
    return null
  }
}

export async function GET(req: Request) {
  try {
    const user = await getAuthUser(req)
    if (!user || user.role !== "consumer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const providerId = searchParams.get("providerId")

    if (providerId) {
      // Check if this provider is favorited by the client
      const favorite = await prisma.favorite.findUnique({
        where: {
          clientId_providerId: {
            clientId: user.id,
            providerId: providerId,
          },
        },
      })
      return NextResponse.json({ isLiked: !!favorite }, { status: 200 })
    }

    // Get all favorites for this client
    const favorites = await prisma.favorite.findMany({
      where: { clientId: user.id },
      include: {
        provider: {
          include: {
            services: true,
            professionalCategory: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Map to provider objects directly
    const providers = favorites.map(f => f.provider)
    return NextResponse.json(providers, { status: 200 })
  } catch (error) {
    console.error("GET /api/provider/favorite error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req)
    if (!user || user.role !== "consumer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { providerId } = body

    if (!providerId) {
      return NextResponse.json({ error: "Missing providerId" }, { status: 400 })
    }

    // Check if provider exists
    const providerExists = await prisma.provider.findUnique({
      where: { id: providerId },
    })
    if (!providerExists) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 })
    }

    // Toggle favorite
    const existing = await prisma.favorite.findUnique({
      where: {
        clientId_providerId: {
          clientId: user.id,
          providerId: providerId,
        },
      },
    })

    if (existing) {
      await prisma.favorite.delete({
        where: {
          clientId_providerId: {
            clientId: user.id,
            providerId: providerId,
          },
        },
      })
      return NextResponse.json({ isLiked: false }, { status: 200 })
    } else {
      await prisma.favorite.create({
        data: {
          clientId: user.id,
          providerId: providerId,
        },
      })
      return NextResponse.json({ isLiked: true }, { status: 200 })
    }
  } catch (error) {
    console.error("POST /api/provider/favorite error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
