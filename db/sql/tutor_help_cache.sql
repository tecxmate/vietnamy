-- Shared cache for the tutor's predefined help answers. Run once in the
-- Supabase SQL editor (or your Postgres). Keyed on a hash of
-- (lessonId, help, message); the reply is the validated tutor JSON.
-- See docs/TUTOR_SPEC.md §7.

create table if not exists tutor_help_cache (
    key        text primary key,
    lesson_id  text,
    help       text,
    message    text,
    reply      jsonb not null,
    created_at timestamptz not null default now()
);
