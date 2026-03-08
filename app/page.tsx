import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { EdgeFunctionDemosServer } from "@/components/edge-function-demos-server";
import { HonoDemosServer } from "@/components/hono-demos-server";
import { TestRouteDemosServer } from "@/components/test-route-demos-server";
import { createSupabaseContext } from "@/lib/supabase/context";
import { InfoIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function ProfileSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card p-6">
          <div className="h-3 w-16 rounded bg-muted animate-pulse mb-3" />
          <div className="h-4 w-32 rounded bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  );
}

async function UserProfile() {
  const { data: ctx, error } = await createSupabaseContext({ allow: "user" });

  if (error) {
    return (
      <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
        <InfoIcon size="16" strokeWidth={2} />
        <Link href="/auth/login" className="underline underline-offset-4 hover:text-primary">
          Sign in
        </Link>{" "}
        to view your profile and test authenticated demos.
      </div>
    );
  }

  const fields = [
    { label: "Email", value: ctx.user?.email },
    { label: "User ID", value: ctx.user?.id },
    { label: "Role", value: ctx.user?.role },
    { label: "Provider", value: (ctx.claims?.app_metadata as Record<string, string>)?.provider ?? "email" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => (
        <div key={field.label} className="rounded-xl border bg-card p-6">
          <p className="text-xs text-muted-foreground mb-1">{field.label}</p>
          <p className="text-sm font-medium break-all">{field.value}</p>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href="/">Showcase</Link>
            </div>
            <div className="flex items-center gap-4">
              <ThemeSwitcher />
              <Suspense>
                <AuthButton />
              </Suspense>
            </div>
          </div>
        </nav>

        <div className="flex-1 w-full flex flex-col gap-8 max-w-5xl p-5 py-10">
          <div className="flex flex-col gap-4">
            <h2 className="font-bold text-2xl">Your profile</h2>
            <Suspense fallback={<ProfileSkeleton />}>
              <UserProfile />
            </Suspense>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="font-bold text-2xl">Edge Functions</h2>
            <Suspense>
              <EdgeFunctionDemosServer />
            </Suspense>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="font-bold text-2xl">Hono</h2>
            <Suspense>
              <HonoDemosServer />
            </Suspense>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="font-bold text-2xl">Next.js SSR</h2>
            <Suspense>
              <TestRouteDemosServer />
            </Suspense>
          </div>
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-8" />
      </div>
    </main>
  );
}
