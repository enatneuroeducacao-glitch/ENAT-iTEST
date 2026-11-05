-- RLS explicitly denies direct browser access; the authenticated Edge Function uses service_role.
create policy "deny client access to HSI pilot items" on public.hsi_pilot_items for all to anon, authenticated using (false) with check (false);
create policy "deny client access to HSI pilot attempts" on public.hsi_pilot_attempts for all to anon, authenticated using (false) with check (false);
create policy "deny client access to HSI pilot responses" on public.hsi_pilot_responses for all to anon, authenticated using (false) with check (false);
create index if not exists idx_hsi_pilot_responses_item_code on public.hsi_pilot_responses(item_code);
