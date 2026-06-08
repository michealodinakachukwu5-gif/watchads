import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <SiteHeader initialUser={null} />
      <main className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <div className="text-7xl">🎬</div>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight">
          Ad not found
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          The ad you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Link href="/dashboard" className="btn btn-primary mt-6">
          Back to dashboard
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
