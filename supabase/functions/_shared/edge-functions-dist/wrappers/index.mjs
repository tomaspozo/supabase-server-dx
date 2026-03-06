import { t as withSupabase } from "../with-supabase-BA8oKB35.mjs";

//#region src/wrappers/webhook.ts
const encoder = new TextEncoder();
async function verifyWebhookSignature(payload, signature, secret) {
	const key = await crypto.subtle.importKey("raw", encoder.encode(secret), {
		name: "HMAC",
		hash: "SHA-256"
	}, false, ["sign"]);
	const expected = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
	const expectedHex = Array.from(new Uint8Array(expected)).map((b) => b.toString(16).padStart(2, "0")).join("");
	const compareKey = await crypto.subtle.importKey("raw", crypto.getRandomValues(new Uint8Array(32)), {
		name: "HMAC",
		hash: "SHA-256"
	}, false, ["sign"]);
	const [sigA, sigB] = await Promise.all([crypto.subtle.sign("HMAC", compareKey, encoder.encode(expectedHex)), crypto.subtle.sign("HMAC", compareKey, encoder.encode(signature))]);
	const viewA = new Uint8Array(sigA);
	const viewB = new Uint8Array(sigB);
	if (viewA.length !== viewB.length) return false;
	let result = 0;
	for (let i = 0; i < viewA.length; i++) result |= viewA[i] ^ viewB[i];
	return result === 0;
}

//#endregion
//#region src/wrappers/auth-hooks.ts
function createAuthHookWrapper(hookType) {
	return function(handler, config) {
		return withSupabase({
			allow: "always",
			cors: false
		}, async (req, ctx) => {
			const secret = config?.webhookSecret ?? getWebhookSecret();
			if (secret) {
				if (!await verifyWebhookSignature(await req.clone().text(), req.headers.get("x-supabase-signature") ?? "", secret)) return Response.json({ error: `Invalid ${hookType} webhook signature` }, { status: 401 });
			}
			const payload = await req.json();
			const result = await handler(req, {
				...ctx,
				userData: payload
			});
			if (result.decision === "reject") return Response.json({
				decision: "reject",
				message: result.message ?? "Request rejected"
			}, { status: 403 });
			return Response.json({ decision: "continue" });
		});
	};
}
function getWebhookSecret() {
	if (typeof Deno !== "undefined" && Deno.env?.get) return Deno.env.get("SUPABASE_WEBHOOK_SECRET");
	if (typeof process !== "undefined" && process.env) return process.env["SUPABASE_WEBHOOK_SECRET"];
}
const beforeUserCreated = createAuthHookWrapper("beforeUserCreated");
const afterUserCreated = createAuthHookWrapper("afterUserCreated");

//#endregion
export { afterUserCreated, beforeUserCreated, verifyWebhookSignature, withSupabase };