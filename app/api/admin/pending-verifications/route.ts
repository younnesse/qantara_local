import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAdmin } from "@/lib/admin-auth"

export async function GET() {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const pendingProviders = await prisma.provider.findMany({
      where: {
        OR: [
          { certificateStatus: "PENDING" },
          { identityStatus: "PENDING" },
          { licenseStatus: "PENDING" },
          { cnamCardStatus: "PENDING" },
          { anaeCardStatus: "PENDING" }
        ]
      },
      orderBy: { verificationSubmittedAt: "asc" }
    })

    // Fetch matching authority certificates for each provider
    const results = await Promise.all(
      pendingProviders.map(async (provider) => {
        let matchedCert = null
        if (provider.certificateId) {
          matchedCert = await prisma.authorityCertificate.findUnique({
            where: { certId: provider.certificateId }
          })
        }
        return {
          ...provider,
          matchedAuthorityCertificate: matchedCert
        }
      })
    )

    return NextResponse.json({ verifications: results }, { status: 200 })
  } catch (error) {
    console.error("GET Pending Verifications Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
