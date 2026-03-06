import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href="/">Home</Link>
              <Link href="/protected" className="text-foreground/60 hover:text-foreground transition-colors">Protected</Link>
            </div>
            <div className="flex items-center gap-4">
              <ThemeSwitcher />
              <Suspense>
                <AuthButton />
              </Suspense>
            </div>
          </div>
        </nav>

        <section className="flex-1 flex flex-col items-center justify-center gap-8 max-w-3xl p-5 py-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Your App Starts Here
          </h1>
          <p className="text-lg text-foreground/60 max-w-xl">
            Authentication, database, and API layer — all wired up and ready to
            build on.
          </p>
          <div className="flex gap-4">
            <Button asChild size="lg">
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/protected">Dashboard</Link>
            </Button>
          </div>
        </section>

        <section className="w-full max-w-5xl px-5 pb-20">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold mb-2">Authentication</h3>
              <p className="text-sm text-muted-foreground">
                Email/password sign-up, login, password reset — all configured
                with Supabase Auth.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold mb-2">Database</h3>
              <p className="text-sm text-muted-foreground">
                Postgres with Row Level Security, schema isolation, and
                migration workflow ready to go.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold mb-2">API Layer</h3>
              <p className="text-sm text-muted-foreground">
                RPC-first architecture with typed Supabase client and
                server-side rendering support.
              </p>
            </div>
          </div>
        </section>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-8">
          <p className="text-foreground/40">
            Edit{" "}
            <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">
              app/page.tsx
            </code>{" "}
            to get started
          </p>
        </footer>
      </div>
    </main>
  );
}
