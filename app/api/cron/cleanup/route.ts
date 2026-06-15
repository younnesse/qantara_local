import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Hard delete unverified clients whose accounts are older than 30 days
    const deletedClients = await prisma.client.deleteMany({
      where: {
        emailVerified: false,
        createdAt: {
          lt: thirtyDaysAgo
        }
      }
    })

    // Hard delete unverified providers whose accounts are older than 30 days
    const deletedProviders = await prisma.provider.deleteMany({
      where: {
        emailVerified: false,
        createdAt: {
          lt: thirtyDaysAgo
        }
      }
    })

    console.log(`[Cron Cleanup] Deleted ${deletedClients.count} unverified clients and ${deletedProviders.count} unverified providers older than 30 days.`)

    return NextResponse.json({
      success: true,
      message: `Cleaned up unverified accounts older than 30 days.`,
      deletedClients: deletedClients.count,
      deletedProviders: deletedProviders.count,
    })
  } catch (error) {
    console.error("Error executing cleanup cron job:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  return GET(req)
}
