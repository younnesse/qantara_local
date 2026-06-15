import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/providers — list all verified, complete providers
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const location = searchParams.get("location");
    const minRating = searchParams.get("minRating");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const subCategory = searchParams.get("subCategory");

    const where: any = {
      certificateStatus: "VALID",
      isProfileComplete: true,
      deletedAt: null,
      isBanned: false,
    };

    if (category) {
      where.category = { contains: category, mode: "insensitive" };
    }

    if (subCategory && subCategory !== "all") {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { regulatoryBodyId: subCategory },
          { regulatoryBody: { code: { contains: subCategory, mode: "insensitive" } } },
          { tradeId: subCategory },
          { trade: { name: { contains: subCategory, mode: "insensitive" } } },
          { autoEntrepreneurActivityId: subCategory },
          { autoEntrepreneurActivity: { name: { contains: subCategory, mode: "insensitive" } } }
        ]
      });
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
        { bio: { contains: search, mode: "insensitive" } },
      ];
    }

    if (location) {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { location: { contains: location, mode: "insensitive" } },
          { bio: { contains: location, mode: "insensitive" } },
          { title: { contains: location, mode: "insensitive" } },
          { name: { contains: location, mode: "insensitive" } },
        ]
      });
    }

    if (minRating) {
      where.rating = { gte: parseFloat(minRating) };
    }

    if (minPrice || maxPrice) {
      const priceFilter: any = {};
      if (minPrice) priceFilter.gte = parseFloat(minPrice);
      if (maxPrice) priceFilter.lte = parseFloat(maxPrice);
      where.services = {
        some: {
          price: priceFilter,
        }
      };
    }

    const providersData = await prisma.provider.findMany({
      where,
      orderBy: { rating: "desc" },
      include: {
        services: true,
        professionalCategory: true,
        regulatoryBody: true,
        trade: true,
        autoEntrepreneurActivity: true,
      }
    });

    // Transform DB rows into the Provider shape the frontend expects
    const providers = providersData.map((u) => ({
      id: u.id,
      name: u.name || "",
      title: u.title || "",
      category: u.category || "",
      rating: u.rating,
      reviewCount: u.reviewCount,
      image: u.profileImage || "",
      bio: u.bio || "",
      location: u.location || "",
      services: u.services, // Array of Service objects
      verified: u.certificateStatus === "VALID",
      professionalCategory: u.professionalCategory,
      regulatoryBody: u.regulatoryBody,
      trade: u.trade,
      autoEntrepreneurActivity: u.autoEntrepreneurActivity,
    }));

    return NextResponse.json(providers);
  } catch (error) {
    console.error("Error fetching providers:", error);
    return NextResponse.json(
      { message: "Failed to fetch providers" },
      { status: 500 }
    );
  }
}
