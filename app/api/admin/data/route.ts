import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAdmin } from "@/lib/admin-auth"

export async function GET(req: Request) {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type") // "providers" | "clients" | "services" | "reviews"

    if (type === "providers") {
      const providers = await prisma.provider.findMany({
        orderBy: { createdAt: "desc" }
      })
      return NextResponse.json({ data: providers })
    }

    if (type === "clients") {
      const clients = await prisma.client.findMany({
        orderBy: { createdAt: "desc" }
      })
      return NextResponse.json({ data: clients })
    }

    if (type === "services") {
      const services = await prisma.service.findMany({
        include: { provider: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" }
      })
      return NextResponse.json({ data: services })
    }

    if (type === "reviews") {
      const reviews = await prisma.review.findMany({
        include: {
          client: { select: { name: true, email: true } },
          service: { select: { name: true, provider: { select: { name: true } } } }
        },
        orderBy: { createdAt: "desc" }
      })
      return NextResponse.json({ data: reviews })
    }

    // Default overview stats
    const providerCount = await prisma.provider.count()
    const clientCount = await prisma.client.count()
    const serviceCount = await prisma.service.count()
    const reviewCount = await prisma.review.count()
    const pendingVerificationCount = await prisma.provider.count({
      where: { certificateStatus: "PENDING" }
    })

    return NextResponse.json({
      stats: {
        providers: providerCount,
        clients: clientCount,
        services: serviceCount,
        reviews: reviewCount,
        pendingVerifications: pendingVerificationCount
      }
    })
  } catch (error) {
    console.error("GET Admin Data Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST for toggling ban/unban or updating fields
export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { type, id, action } = await req.json() // type: "provider" | "client", action: "toggle-ban"

    if (!type || !id || !action) {
      return NextResponse.json({ error: "Missing parameters." }, { status: 400 })
    }

    if (action === "toggle-ban") {
      if (type === "provider") {
        const provider = await prisma.provider.findUnique({ where: { id } })
        if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 })
        
        const updated = await prisma.provider.update({
          where: { id },
          data: { isBanned: !provider.isBanned }
        })

        // Handle BannedEmail registry synchronization
        if (updated.isBanned) {
          await prisma.bannedEmail.upsert({
            where: { email: provider.email },
            update: { reason: "Banned by Admin", bannedAt: new Date() },
            create: { email: provider.email, reason: "Banned by Admin", bannedAt: new Date() }
          })
        } else {
          try {
            await prisma.bannedEmail.delete({ where: { email: provider.email } })
          } catch (e) {
            // Might not exist
          }
        }

        return NextResponse.json({ success: true, message: `Provider ban status set to ${updated.isBanned}` })
      }

      if (type === "client") {
        const client = await prisma.client.findUnique({ where: { id } })
        if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 })

        const updated = await prisma.client.update({
          where: { id },
          data: { isBanned: !client.isBanned }
        })

        if (updated.isBanned) {
          await prisma.bannedEmail.upsert({
            where: { email: client.email },
            update: { reason: "Banned by Admin", bannedAt: new Date() },
            create: { email: client.email, reason: "Banned by Admin", bannedAt: new Date() }
          })
        } else {
          try {
            await prisma.bannedEmail.delete({ where: { email: client.email } })
          } catch (e) {
            // Might not exist
          }
        }

        return NextResponse.json({ success: true, message: `Client ban status set to ${updated.isBanned}` })
      }
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 })
  } catch (error) {
    console.error("POST Admin Data Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// DELETE for hard deleting clients, providers, services, reviews
export async function DELETE(req: Request) {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type") // "provider" | "client" | "service" | "review"
    const id = searchParams.get("id")

    if (!type || !id) {
      return NextResponse.json({ error: "Missing type or id parameters." }, { status: 400 })
    }

    if (type === "provider") {
      await prisma.provider.delete({ where: { id } })
      return NextResponse.json({ success: true, message: "Provider deleted successfully." })
    }

    if (type === "client") {
      await prisma.client.delete({ where: { id } })
      return NextResponse.json({ success: true, message: "Client deleted successfully." })
    }

    if (type === "service") {
      await prisma.service.delete({ where: { id } })
      return NextResponse.json({ success: true, message: "Service deleted successfully." })
    }

    if (type === "review") {
      await prisma.review.delete({ where: { id } })
      return NextResponse.json({ success: true, message: "Review deleted successfully." })
    }

    return NextResponse.json({ error: "Invalid type parameter." }, { status: 400 })
  } catch (error) {
    console.error("DELETE Admin Data Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
