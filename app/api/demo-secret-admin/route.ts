import { NextResponse } from "next/server";
import { createSupabaseContext } from "@/lib/supabase/context";

export async function GET() {
  const { data: ctx, error: ctxError } = await createSupabaseContext({
    allow: "always",
  });

  if (ctxError) {
    return NextResponse.json({ error: ctxError.message }, { status: 500 });
  }

  const { data, error } =
    await ctx.supabaseAdmin.functions.invoke("demo-secret-admin");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
