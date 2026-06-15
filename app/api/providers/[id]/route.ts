import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/providers/[id] — get a single provider by ID
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const providerData = await prisma.provider.findUnique({
      where: { id },
      include: {
        services: true,
        professionalCategory: true,
        regulatoryBody: true,
        trade: true,
        autoEntrepreneurActivity: true,
      }
    });

    if (!providerData || providerData.certificateStatus !== "VALID" || !providerData.isProfileComplete || providerData.deletedAt || providerData.isBanned) {
      return NextResponse.json(
        { message: "Provider not found" },
        { status: 404 }
      );
    }

    // Check if requesting user is unverified
    let isRequestingUserUnverified = false
    try {
      const authHeader = req.headers.get("cookie")
      if (authHeader) {
        const token = authHeader.split("; ").find(c => c.startsWith("auth_token="))?.split("=")[1]
        if (token) {
          const { jwtVerify } = await import("jose")
          const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret")
          const { payload } = await jwtVerify(token, JWT_SECRET)
          const { id, role } = payload as any

          let requestingUser = null
          if (role === "provider") {
            requestingUser = await prisma.provider.findUnique({ where: { id } })
          } else {
            requestingUser = await prisma.client.findUnique({ where: { id } })
          }
          if (requestingUser && requestingUser.emailVerified === false) {
            isRequestingUserUnverified = true
          }
        }
      }
    } catch (err) {
      console.error("JWT verification in provider details endpoint error:", err)
    }

    const provider = {
      id: providerData.id,
      name: providerData.name || "",
      title: providerData.title || "",
      category: providerData.category || "",
      rating: providerData.rating,
      reviewCount: providerData.reviewCount,
      image: providerData.profileImage || "",
      bio: providerData.bio || "",
      location: providerData.location || "",
      services: providerData.services,
      verified: providerData.certificateStatus === "VALID",
      phoneNumber: isRequestingUserUnverified ? null : providerData.phoneNumber,
      professionalCategory: providerData.professionalCategory,
      regulatoryBody: providerData.regulatoryBody,
      trade: providerData.trade,
      autoEntrepreneurActivity: providerData.autoEntrepreneurActivity,
    };

    return NextResponse.json(provider);
  } catch (error) {
    console.error("Error fetching provider:", error);
    return NextResponse.json(
      { message: "Failed to fetch provider" },
      { status: 500 }
    );
  }
}
