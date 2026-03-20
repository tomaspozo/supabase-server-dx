<!-- agentlink:config:start -->
# Project Configuration

This is a **local** Supabase project running in Docker.

## Local Development Commands

| Task | Command |
|------|---------|
| Start Supabase | `supabase start` |
| Apply schemas | `npx @agentlinksh/cli@latest db apply` |
| Generate migration | `npx @agentlinksh/cli@latest db migrate name` |
| Generate types | `npx @agentlinksh/cli@latest db types` |
| Run SQL | `npx @agentlinksh/cli@latest db sql "SELECT ..."` |
| Serve edge functions | `supabase functions serve` |

## Finding connection details

Run `supabase status` to get the local API URL, DB URL, publishable key, and secret key.
<!-- agentlink:config:end -->
