import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/providers/[id] — get a single provider by ID
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Parse cookie to authenticate requester
    let requestingUserId = null;
    let requestingUserRole = null;
    let isRequestingUserUnverified = false;

    try {
      const authHeader = req.headers.get("cookie");
      if (authHeader) {
        const token = authHeader.split("; ").find(c => c.startsWith("auth_token="))?.split("=")[1];
        if (token) {
          const { jwtVerify } = await import("jose");
          const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");
          const { payload } = await jwtVerify(token, JWT_SECRET);
          requestingUserId = (payload as any).id || null;
          requestingUserRole = (payload as any).role || null;

          let requestingUser = null;
          if (requestingUserRole === "provider") {
            requestingUser = await prisma.provider.findUnique({ where: { id: requestingUserId } });
          } else {
            requestingUser = await prisma.client.findUnique({ where: { id: requestingUserId } });
          }
          if (requestingUser && requestingUser.emailVerified === false) {
            isRequestingUserUnverified = true;
          }
        }
      }
    } catch (err) {
      console.error("JWT verification in provider details endpoint error:", err);
    }

    let providerData = await prisma.provider.findUnique({
      where: { id },
      include: {
        services: true,
        professionalCategory: true,
        regulatoryBody: true,
        trade: true,
        autoEntrepreneurActivity: true,
      }
    });

    if (!providerData) {
      return NextResponse.json({ message: "Provider not found" }, { status: 404 });
    }

    const isOwner = requestingUserId === id && requestingUserRole === "provider";

    // If provider is deleted or banned, hide from everyone
    if (providerData.deletedAt || providerData.isBanned) {
      return NextResponse.json({ message: "Provider not found" }, { status: 404 });
    }

    // Public users cannot see unverified/incomplete profiles
    if (!isOwner && (providerData.certificateStatus !== "VALID" || !providerData.isProfileComplete)) {
      return NextResponse.json({ message: "Provider not found" }, { status: 404 });
    }

    // Lazy check Didit status for the owner if currently PENDING
    if (isOwner && providerData.identityStatus === "PENDING" && providerData.yotiName) {
      const isSessionId = providerData.yotiName.includes("-") || providerData.yotiName.startsWith("mock-");
      if (isSessionId) {
        try {
          const { checkAndUpdateDiditStatus } = await import("@/lib/didit");
          const updated = await checkAndUpdateDiditStatus(id, providerData.yotiName);
          if (updated) {
            const reloaded = await prisma.provider.findUnique({
              where: { id },
              include: {
                services: true,
                professionalCategory: true,
                regulatoryBody: true,
                trade: true,
                autoEntrepreneurActivity: true,
              }
            });
            if (reloaded) {
              providerData = reloaded;
            }
          }
        } catch (statusError) {
          console.error("Lazy Didit status check failed:", statusError);
        }
      }
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
      
      // Owners get their verification statuses to know their progress
      ...(isOwner && {
        identityStatus: providerData.identityStatus,
        certificateStatus: providerData.certificateStatus,
        licenseStatus: providerData.licenseStatus,
        cnamCardStatus: providerData.cnamCardStatus,
        anaeCardStatus: providerData.anaeCardStatus,
        licenseRejectionReason: providerData.licenseRejectionReason,
        cnamCardRejectionReason: providerData.cnamCardRejectionReason,
        anaeCardRejectionReason: providerData.anaeCardRejectionReason,
        certificateMessage: providerData.certificateMessage,
        isProfileComplete: providerData.isProfileComplete,
      })
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
