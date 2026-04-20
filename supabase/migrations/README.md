# Database migrations

Source of truth for the schema is `src/lib/db/schema/`. These SQL files are
generated from it via `drizzle-kit generate` — do not hand-edit them.

## Workflow

1. Edit the schema in `src/lib/db/schema/`.
2. From `sir-keith-app/`, run:
   ```bash
   npx drizzle-kit generate --name=<short_description>
   ```
3. Review the generated SQL in `supabase/migrations/`.
4. Apply it:
   ```bash
   npx drizzle-kit migrate
   ```
   (or via the Supabase dashboard in production with explicit approval).
5. Commit the schema change, the generated SQL, and the updated `meta/` files
   together.

## Rule

Never change schema via the Supabase console/MCP directly — that creates drift
between the code and the database. If you need an ad-hoc fix in prod, follow
up with a matching migration in the repo.

## Baseline

`0000_init.sql` was generated from the schema on 2026-04-20 and marked applied
in prod via `drizzle.__drizzle_migrations` without running. All 64 tables
already existed.
