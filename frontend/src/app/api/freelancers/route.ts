import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const freelancers = await prisma.user.findMany({
      where: {
        role: "freelancer",
      },
      include: {
        reviewsReceived: true,
        freelancerJobs: {
          where: {
            status: "completed"
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    const formattedFreelancers = freelancers.map(fl => {
      // Calculate average rating
      const rating = fl.reviewsReceived.length > 0 
        ? fl.reviewsReceived.reduce((acc, rev) => acc + rev.rating, 0) / fl.reviewsReceived.length 
        : 5.0; // Default if no reviews

      return {
        id: fl.id,
        walletAddress: fl.walletAddress,
        name: `${fl.firstName} ${fl.lastName}`,
        title: fl.bio || "Freelancer",
        rate: "$50/hr", // Placeholder, since rate isn't in user model
        completed: fl.freelancerJobs.length,
        rating: Math.round(rating * 10) / 10, // Round to 1 decimal
        skills: fl.skills ? fl.skills.split(",").map(s => s.trim()) : [],
      };
    });

    return NextResponse.json(formattedFreelancers);
  } catch (error) {
    console.error("Error fetching freelancers:", error);
    return NextResponse.json({ error: "Failed to fetch freelancers" }, { status: 500 });
  }
}
