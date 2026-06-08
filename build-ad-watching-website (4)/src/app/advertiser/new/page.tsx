import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { NewCampaignForm } from "@/components/NewCampaignForm";

export const dynamic = "force-dynamic";

export default async function NewCampaignPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/advertiser/new");
  if (user.role !== "advertiser" && user.role !== "admin") redirect("/dashboard");

  const me = { id: user.id, name: user.name, email: user.email, role: user.role, country: user.country, balanceCents: user.balanceCents, lifetimeEarningsCents: user.lifetimeEarningsCents, withdrawalActivated: user.withdrawalActivated, companyName: user.companyName, advertiserApproved: user.advertiserApproved };

  return (
    <div className="min-h-screen">
      <SiteHeader initialUser={me} />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <a href="/advertiser" className="text-sm text-[var(--text-secondary)] hover:text-white">← My campaigns</a>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">New campaign</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Submit your ad for review. Once approved and payment confirmed, it goes live immediately.
        </p>
        {!user.advertiserApproved && (
          <div className="mt-4 rounded-xl border border-[#f5a524]/30 bg-[#f5a524]/10 px-4 py-3 text-sm text-[#f5a524]">
            ⏳ Your account is pending admin approval. Campaigns submitted now will be queued.
          </div>
        )}
        <NewCampaignForm companyName={user.companyName ?? user.name} />
      </main>
      <SiteFooter />
    </div>
  );
}
