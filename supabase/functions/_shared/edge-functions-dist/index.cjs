Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
const require_with_supabase = require('./with-supabase-CmdRD4CW.cjs');
const require_create_supabase_context = require('./create-supabase-context-D31apwMv.cjs');

exports.AuthError = require_create_supabase_context.AuthError;
exports.EnvError = require_create_supabase_context.EnvError;
exports.addCorsHeaders = require_with_supabase.addCorsHeaders;
exports.buildCorsHeaders = require_with_supabase.buildCorsHeaders;
exports.createAdminClient = require_create_supabase_context.createAdminClient;
exports.createContextClient = require_create_supabase_context.createContextClient;
exports.createSupabaseContext = require_create_supabase_context.createSupabaseContext;
exports.extractCredentials = require_create_supabase_context.extractCredentials;
exports.resolveEnv = require_create_supabase_context.resolveEnv;
exports.verifyAuth = require_create_supabase_context.verifyAuth;
exports.verifyCredentials = require_create_supabase_context.verifyCredentials;
exports.withSupabase = require_with_supabase.withSupabase;