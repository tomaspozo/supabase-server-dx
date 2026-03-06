//#region src/wrappers/webhook.d.ts
declare function verifyWebhookSignature(payload: string, signature: string, secret: string): Promise<boolean>;
//#endregion
export { verifyWebhookSignature };