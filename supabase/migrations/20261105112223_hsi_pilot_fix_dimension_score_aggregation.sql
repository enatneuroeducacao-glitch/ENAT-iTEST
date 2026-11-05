-- Corrige a agregação dos cinco indicadores para produzir um único objeto JSON.
create or replace function public.complete_hsi_pilot_attempt(p_attempt_id uuid, p_responses jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_attempt public.hsi_pilot_attempts%rowtype;
  v_expected integer;
  v_inserted integer;
  v_scores jsonb;
begin
  select * into v_attempt from public.hsi_pilot_attempts where id = p_attempt_id for update;
  if not found or v_attempt.status <> 'in_progress' then raise exception 'Avaliação piloto não encontrada ou já concluída.'; end if;
  if jsonb_typeof(p_responses) <> 'array' then raise exception 'Formato de respostas inválido.'; end if;
  select count(*) into v_expected from public.hsi_pilot_items where instrument_version = v_attempt.instrument_version and is_active = true;
  if jsonb_array_length(p_responses) <> v_expected then raise exception 'Todas as afirmações devem ser respondidas.'; end if;
  insert into public.hsi_pilot_responses (attempt_id, item_code, response_value, scored_value)
  select p_attempt_id, r.item_code, r.response_value,
    case when i.reverse_scored then 6 - r.response_value else r.response_value end
  from jsonb_to_recordset(p_responses) as r(item_code text, response_value integer)
  join public.hsi_pilot_items i on i.item_code = r.item_code and i.instrument_version = v_attempt.instrument_version and i.is_active = true
  where r.response_value between 1 and 5;
  get diagnostics v_inserted = row_count;
  if v_inserted <> v_expected then raise exception 'Respostas incompletas, duplicadas ou inválidas.'; end if;
  select jsonb_object_agg(x.dimension, x.result) into v_scores
  from (
    select i.dimension, jsonb_build_object('mean',round(avg(r.scored_value)::numeric,2),'index',round(((avg(r.scored_value)-1)*25)::numeric,1)) as result
    from public.hsi_pilot_responses r join public.hsi_pilot_items i on i.item_code=r.item_code
    where r.attempt_id=p_attempt_id group by i.dimension
  ) x;
  update public.hsi_pilot_attempts set status='completed',dimension_scores=v_scores,completed_at=now() where id=p_attempt_id;
  return v_scores;
end;
$$;
revoke all on function public.complete_hsi_pilot_attempt(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.complete_hsi_pilot_attempt(uuid,jsonb) to service_role;
