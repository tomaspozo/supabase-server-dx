function parseJwks(raw: string | undefined) {
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export const env = {
  publishableKeys: { "default": Deno.env.get("SB_PUBLISHABLE_KEY")! },
  secretKeys: { "default": Deno.env.get("SB_SECRET_KEY")! },
  jwks: parseJwks(Deno.env.get("SB_JWKS")),
}
