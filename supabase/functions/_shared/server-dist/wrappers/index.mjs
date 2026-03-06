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
export { verifyWebhookSignature, withSupabase };