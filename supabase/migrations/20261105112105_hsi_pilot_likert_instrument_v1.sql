-- ENAT-iTEST | HSI-DOTH-P Pilot 1.0.0
create table if not exists public.hsi_pilot_items (
  item_code text primary key,
  instrument_version text not null default '1.0.0',
  dimension text not null check (dimension in ('decision','organization','time','humanization','psychocomportamental')),
  item_text text not null,
  reverse_scored boolean not null default false,
  display_order integer not null check (display_order between 1 and 25),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (instrument_version, display_order)
);
create table if not exists public.hsi_pilot_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  state_code text not null check (state_code in ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO')),
  instrument_version text not null default '1.0.0',
  status text not null default 'in_progress' check (status in ('in_progress','completed','cancelled')),
  dimension_scores jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create table if not exists public.hsi_pilot_responses (
  attempt_id uuid not null references public.hsi_pilot_attempts(id) on delete cascade,
  item_code text not null references public.hsi_pilot_items(item_code),
  response_value smallint not null check (response_value between 1 and 5),
  scored_value smallint not null check (scored_value between 1 and 5),
  created_at timestamptz not null default now(),
  primary key (attempt_id, item_code)
);
alter table public.hsi_pilot_items enable row level security;
alter table public.hsi_pilot_attempts enable row level security;
alter table public.hsi_pilot_responses enable row level security;
revoke all on table public.hsi_pilot_items, public.hsi_pilot_attempts, public.hsi_pilot_responses from public, anon, authenticated;
grant all on table public.hsi_pilot_items, public.hsi_pilot_attempts, public.hsi_pilot_responses to service_role;
create index if not exists idx_hsi_pilot_attempts_user_created on public.hsi_pilot_attempts(user_id, created_at desc);
create index if not exists idx_hsi_pilot_responses_attempt on public.hsi_pilot_responses(attempt_id);
insert into public.hsi_pilot_items (item_code, instrument_version, dimension, item_text, reverse_scored, display_order) values
('DEC-01','1.0.0','decision','Antes de decidir diante de uma situação inesperada, procuro compreender o que está acontecendo.',false,1),
('DEC-02','1.0.0','decision','Considero as possíveis consequências das alternativas antes de escolher.',false,2),
('DEC-03','1.0.0','decision','Quando não tenho informações suficientes, procuro esclarecê-las antes de agir.',false,3),
('DEC-04','1.0.0','decision','Reavalio uma decisão quando surgem informações relevantes que eu não tinha considerado.',false,4),
('DEC-05','1.0.0','decision','Sob pressão, costumo agir sem pensar nas consequências da minha escolha.',true,5),
('ORG-01','1.0.0','organization','Organizo as etapas necessárias antes de iniciar uma atividade importante.',false,6),
('ORG-02','1.0.0','organization','Utilizo rotinas, listas ou outros recursos para acompanhar responsabilidades.',false,7),
('ORG-03','1.0.0','organization','Defino prioridades considerando a importância e a urgência das tarefas.',false,8),
('ORG-04','1.0.0','organization','Reviso o que foi realizado para identificar o que ainda precisa de atenção.',false,9),
('ORG-05','1.0.0','organization','Frequentemente começo várias tarefas e perco o controle do que precisa ser concluído.',true,10),
('TIM-01','1.0.0','time','Reservo tempo suficiente para atividades que exigem atenção e cuidado.',false,11),
('TIM-02','1.0.0','time','Ajusto meu ritmo para evitar decisões apressadas.',false,12),
('TIM-03','1.0.0','time','Procuro cumprir prazos sem comprometer a qualidade e a segurança.',false,13),
('TIM-04','1.0.0','time','Considero possíveis atrasos e preparo alternativas quando necessário.',false,14),
('TIM-05','1.0.0','time','Costumo deixar tarefas importantes para o último momento.',true,15),
('HUM-01','1.0.0','humanization','Considero como minhas escolhas podem afetar a segurança e o bem-estar de outras pessoas.',false,16),
('HUM-02','1.0.0','humanization','Escuto com respeito pessoas que apresentam opiniões diferentes das minhas.',false,17),
('HUM-03','1.0.0','humanization','Adapto minha comunicação para favorecer a compreensão mútua.',false,18),
('HUM-04','1.0.0','humanization','Procuro manter o respeito pelas pessoas mesmo em situações de conflito.',false,19),
('HUM-05','1.0.0','humanization','Quando estou sob pressão, deixo de considerar as necessidades das outras pessoas.',true,20),
('PSY-01','1.0.0','psychocomportamental','Percebo quando minhas emoções podem influenciar minhas atitudes.',false,21),
('PSY-02','1.0.0','psychocomportamental','Quando me sinto sob estresse, procuro estratégias para recuperar a calma antes de agir.',false,22),
('PSY-03','1.0.0','psychocomportamental','Reconheço situações que costumam aumentar minha impulsividade.',false,23),
('PSY-04','1.0.0','psychocomportamental','Consigo fazer uma pausa antes de agir quando sinto uma emoção intensa.',false,24),
('PSY-05','1.0.0','psychocomportamental','Quando fico frustrado, meu comportamento muda de forma que tenho dificuldade de controlar.',true,25)
on conflict (item_code) do nothing;

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
  select jsonb_object_agg(dimension, jsonb_build_object('mean', round(avg(scored_value)::numeric, 2), 'index', round(((avg(scored_value) - 1) * 25)::numeric, 1)))
  into v_scores
  from public.hsi_pilot_responses r join public.hsi_pilot_items i on i.item_code = r.item_code
  where r.attempt_id = p_attempt_id group by dimension;
  update public.hsi_pilot_attempts set status = 'completed', dimension_scores = v_scores, completed_at = now() where id = p_attempt_id;
  return v_scores;
end;
$$;
revoke all on function public.complete_hsi_pilot_attempt(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.complete_hsi_pilot_attempt(uuid, jsonb) to service_role;
