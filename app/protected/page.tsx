import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { InfoIcon } from "lucide-react";
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
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  const claims = data.claims;

  const fields = [
    { label: "Email", value: claims.email },
    { label: "User ID", value: claims.sub },
    { label: "Role", value: claims.role },
    { label: "Provider", value: claims.app_metadata?.provider ?? "email" },
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

export default function ProtectedPage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      <div className="w-full">
        <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
          <InfoIcon size="16" strokeWidth={2} />
          This is a protected page that you can only see as an authenticated
          user
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <h2 className="font-bold text-2xl">Your profile</h2>
        <Suspense fallback={<ProfileSkeleton />}>
          <UserProfile />
        </Suspense>
      </div>
    </div>
  );
}
