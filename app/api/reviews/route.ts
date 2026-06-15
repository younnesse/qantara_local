import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/reviews?providerId=xxx — fetch all reviews for a provider
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get("providerId");

    if (!providerId) {
      return NextResponse.json(
        { message: "providerId is required" },
        { status: 400 }
      );
    }

    const reviews = await prisma.review.findMany({
      where: { 
        service: {
          providerId: providerId
        }
      },
      orderBy: { createdAt: "desc" },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        service: {
          select: {
            name: true,
          }
        }
      },
    });

    // Transform into the shape the frontend expects
    const formatted = reviews.map((r) => ({
      id: r.id,
      authorName: r.client.name || "Anonymous",
      authorImage: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face",
      rating: r.rating,
      date: r.createdAt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      comment: r.comment,
      serviceName: r.service.name,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { message: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

// POST /api/reviews — submit a new review and recalculate service/provider ratings
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clientId, serviceId, rating, comment } = body;

    if (!clientId || !serviceId || !rating || !comment) {
      return NextResponse.json(
        { message: "clientId, serviceId, rating, and comment are required" },
        { status: 400 }
      );
    }

    // Verify reviewer account status
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    });

    if (!client || client.emailVerified === false) {
      return NextResponse.json(
        { message: "Forbidden: You must verify your email address to submit reviews." },
        { status: 403 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { message: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        clientId,
        serviceId,
        rating,
        comment,
      },
      include: {
        client: {
          select: {
            name: true,
          },
        },
        service: {
          select: {
            providerId: true,
            name: true,
          }
        }
      },
    });

    // Recalculate Service's average rating and review count
    const serviceStats = await prisma.review.aggregate({
      where: { serviceId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.service.update({
      where: { id: serviceId },
      data: {
        rating: Math.round((serviceStats._avg.rating || 0) * 10) / 10,
        reviewCount: serviceStats._count.rating,
      },
    });

    // Recalculate Provider's average rating based on all reviews for their services
    const providerStats = await prisma.review.aggregate({
      where: { 
        service: {
          providerId: review.service.providerId
        }
      },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.provider.update({
      where: { id: review.service.providerId },
      data: {
        rating: Math.round((providerStats._avg.rating || 0) * 10) / 10,
        reviewCount: providerStats._count.rating,
      },
    });

    return NextResponse.json({
      id: review.id,
      authorName: review.client.name || "Anonymous",
      authorImage: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face",
      rating: review.rating,
      date: review.createdAt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      comment: review.comment,
      serviceName: review.service.name,
      newServiceRating: serviceStats._avg.rating,
      newProviderRating: providerStats._avg.rating,
    });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { message: "Failed to create review" },
      { status: 500 }
    );
  }
}

