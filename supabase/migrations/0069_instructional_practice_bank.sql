-- Keep school-required instructional practices separate from MTSS. The bank is
-- private to the owner's saved format, and each lesson stores only the few
-- practices selected for that lesson.

alter table public.lesson_plan_formats
  add column if not exists instructional_practice_bank jsonb not null default '[]'::jsonb;

alter table public.lesson_plan_format_values
  add column if not exists instructional_practice_ids text[] not null default '{}';

do $$
declare
  v_owner_id uuid;
  v_format_id uuid;
  v_sections jsonb;
  v_practice_section jsonb := '{
    "key": "instructional_practices",
    "label": "Instructional practices",
    "description": "School-approved practices evident in this lesson",
    "enabled": true,
    "required": true
  }'::jsonb;
  v_bank jsonb := $practice_bank$[
    {"id":"CE-ENG-AC-01","category":"CE English - Academic Conversations","label":"Follow-up questions to deepen student understanding"},
    {"id":"CE-ENG-AC-02","category":"CE English - Academic Conversations","label":"Uses inquiry-based questions to drive inquiry and academic conversations."},
    {"id":"CE-ENG-PS-01","category":"CE English - Productive Struggle","label":"Devotion of instructional time to rigorous tasks with strategic support"},
    {"id":"CE-ENG-PS-02","category":"CE English - Productive Struggle","label":"Opportunities for critical thinking, perseverence and/or productive struggle"},
    {"id":"CE-ENG-PS-03","category":"CE English - Productive Struggle","label":"Opportunities for students to use metacognitive strategies and/or ask clarifying questions."},
    {"id":"CE-ENG-PS-04","category":"CE English - Productive Struggle","label":"Opportunities to help peers and/or independently analyze text with evidence"},
    {"id":"CE-SCI-RPS-01","category":"CE Science - Reasoning / Problem Solving","label":"Collaborating to solve problems, answer questions, and explore content related to task"},
    {"id":"CE-SCI-RPS-02","category":"CE Science - Reasoning / Problem Solving","label":"Direct instruction to address gaps in student understanding"},
    {"id":"CE-SCI-RPS-03","category":"CE Science - Reasoning / Problem Solving","label":"Explain understanding using own language and/or support claims using evidence"},
    {"id":"CE-SCI-RPS-04","category":"CE Science - Reasoning / Problem Solving","label":"Inquiry-based opportunity to use data to provide evidence of conceptual understanding"},
    {"id":"CE-SCI-RPS-05","category":"CE Science - Reasoning / Problem Solving","label":"Integrates questions to prompt reflection and to revise misconceptions"},
    {"id":"CE-SCI-RPS-06","category":"CE Science - Reasoning / Problem Solving","label":"Investigating and/or researching using authentic/peer reviewed sources"},
    {"id":"CE-SCI-RPS-07","category":"CE Science - Reasoning / Problem Solving","label":"Opportunity for exploration of phenomenon or conduct an investigation"},
    {"id":"CE-SCI-RPS-08","category":"CE Science - Reasoning / Problem Solving","label":"Participating in demonstrations, simulations or discussions that leads to data based-conclusions or explanations"},
    {"id":"CE-SCI-STD-01","category":"CE Science - Sensemaking Through Discourse","label":"Discourse and reflection on theories and/or principles built upon observation and the scientific process"},
    {"id":"CE-SCI-STD-02","category":"CE Science - Sensemaking Through Discourse","label":"Extend thinking through making connections to other concepts in science"},
    {"id":"CE-SCI-STD-03","category":"CE Science - Sensemaking Through Discourse","label":"Extend thinking through making connections to the real world"},
    {"id":"CE-SCI-STD-04","category":"CE Science - Sensemaking Through Discourse","label":"Integratation of purposeful technology to support student learning / collaboration"},
    {"id":"CE-SCI-STD-05","category":"CE Science - Sensemaking Through Discourse","label":"Opportunities to provide evidence or rationale for thinking / defending claims"},
    {"id":"CE-SCI-STD-06","category":"CE Science - Sensemaking Through Discourse","label":"Record, visualize, and interpret data qualities and quantities"},
    {"id":"CE-SCI-STD-07","category":"CE Science - Sensemaking Through Discourse","label":"Student-familiar language to explain understanding of phenomena or problem"},
    {"id":"CE-SCI-STD-08","category":"CE Science - Sensemaking Through Discourse","label":"Utilizes questioning techniques to facilitate sensemaking"}
  ]$practice_bank$::jsonb;
begin
  select id into v_owner_id
  from auth.users
  where lower(email) = lower('staceyjonesthirtyone@gmail.com')
  limit 1;

  if v_owner_id is null then
    raise notice 'PlansK12 owner account was not found; instructional-practice bank was not seeded.';
    return;
  end if;

  select id, sections into v_format_id, v_sections
  from public.lesson_plan_formats
  where teacher_id = v_owner_id
  order by is_default desc, updated_at desc
  limit 1;

  if v_format_id is null then
    raise notice 'Owner lesson-plan format was not found; instructional-practice bank was not seeded.';
    return;
  end if;

  if not exists (
    select 1 from jsonb_array_elements(coalesce(v_sections, '[]'::jsonb)) item
    where item->>'key' = 'instructional_practices'
  ) then
    select jsonb_agg(item order by sort_key)
    into v_sections
    from (
      select value as item, ordinality * 2 as sort_key
      from jsonb_array_elements(coalesce(v_sections, '[]'::jsonb)) with ordinality
      union all
      select v_practice_section,
        coalesce((
          select ordinality * 2 - 1
          from jsonb_array_elements(coalesce(v_sections, '[]'::jsonb)) with ordinality
          where value->>'key' = 'mtss_tier_1'
          limit 1
        ), 9999)
    ) ordered_sections;
  end if;

  update public.lesson_plan_formats
  set instructional_practice_bank = v_bank,
      sections = v_sections,
      updated_at = now()
  where id = v_format_id;
end
$$;
