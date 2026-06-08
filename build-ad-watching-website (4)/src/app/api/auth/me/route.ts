import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ user: null }, { status: 200 });
  }
  return Response.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      balanceCents: user.balanceCents,
      lifetimeEarningsCents: user.lifetimeEarningsCents,
      createdAt: user.createdAt,
    },
  });
}
