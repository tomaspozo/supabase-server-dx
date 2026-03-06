import { corsHeaders } from "npm:@supabase/supabase-js@2.98.0/cors";

export function jsonResponse(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

export function notFound(message = "Not found"): Response {
  return errorResponse(message, 404);
}
