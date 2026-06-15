import { prisma } from "@/lib/prisma"
import { HomePageClient } from "./home-client"

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Fetch verified, complete and active providers from the database server-side
  const providersData = await prisma.provider.findMany({
    where: {
      certificateStatus: "VALID",
      isProfileComplete: true,
      deletedAt: null,
      isBanned: false,
    },
    orderBy: { rating: "desc" },
    include: {
      services: true,
    }
  });

  // Transform DB rows into the expected Provider interface shape
  const providers = providersData.map((u) => ({
    id: u.id,
    name: u.name || "",
    title: u.title || "",
    category: u.category || "",
    rating: u.rating,
    reviewCount: u.reviewCount,
    image: u.profileImage || "",
    bio: u.bio || "",
    services: u.services.map(s => ({
      name: s.name,
      price: s.price ?? 0,
      duration: `${s.duration ?? 60} min`
    })),
    verified: u.certificateStatus === "VALID",
  }));

  // Top-rated providers sorted by rating desc
  const topRatedProviders = [...providers].sort((a, b) => b.rating - a.rating);

  return (
    <HomePageClient
      initialProviders={providers as any}
      topRatedProviders={topRatedProviders as any}
    />
  );
}
