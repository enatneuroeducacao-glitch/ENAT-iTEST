-- Restrict operational tables to the trusted Edge Function service role.
create policy "service role manages question bank" on public.question_bank for all to service_role using (true) with check (true);
create policy "service role manages attempt question links" on public.attempt_questions for all to service_role using (true) with check (true);
create policy "service role manages answer records" on public.attempt_answers for all to service_role using (true) with check (true);
create index if not exists idx_assessment_attempts_user_created on public.assessment_attempts(user_id, created_at desc);
create index if not exists idx_attempt_questions_question_id on public.attempt_questions(question_id);
