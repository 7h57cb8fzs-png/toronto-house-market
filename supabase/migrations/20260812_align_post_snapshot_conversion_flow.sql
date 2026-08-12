-- Align Phase 1 lead capture with the approved post-snapshot conversion flow.
-- Applied to Supabase production project on 2026-08-12.

alter table public.leads
  rename column buyer_intent to conversion_intent;

alter table public.leads
  drop constraint if exists leads_check;

alter table public.leads
  alter column mobile set not null,
  alter column conversion_intent set not null;

alter table public.leads
  add constraint leads_mobile_not_blank check (btrim(mobile) <> ''),
  add constraint leads_conversion_intent_check
    check (conversion_intent in ('showing_request', 'full_brief'));

insert into public.app_settings (key, value, description)
values (
  'lead_capture',
  '{"required_fields":["name","mobile"],"optional_fields":["email"],"conversion_intents":["showing_request","full_brief"],"infer_intent_from_cta":true}'::jsonb,
  'Post-snapshot lead capture rules. Conversion intent is inferred from the CTA rather than asked as a generic buyer-intent question.'
)
on conflict (key) do update
set value = excluded.value,
    description = excluded.description,
    updated_at = now();

update public.app_settings
set value = jsonb_set(value, '{placement}', '"showing_request_form"'::jsonb, true),
    description = 'Cashback remains subtle until the buyer enters the post-snapshot showing-request conversion step.',
    updated_at = now()
where key = 'cashback';
