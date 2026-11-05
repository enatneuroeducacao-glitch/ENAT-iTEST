-- Least-privilege grants: browser participants cannot read the answer key or raw answer rows.
revoke all on table public.profiles, public.question_bank, public.assessment_attempts, public.attempt_questions, public.attempt_answers, public.state_metrics from public, anon, authenticated;
grant select on table public.profiles, public.assessment_attempts, public.state_metrics to authenticated;
grant update (full_name, state_code) on table public.profiles to authenticated;
grant all on table public.profiles, public.question_bank, public.assessment_attempts, public.attempt_questions, public.attempt_answers, public.state_metrics to service_role;
