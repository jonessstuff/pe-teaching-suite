# PE / Health Teaching Suite

A PE/Health/Family Life/Driver's Ed lesson planning suite. One AI call
per lesson produces a structured `LessonObject`; every export (Plan
Book, sub plans, and future renderers) is a template over that same
object — no repeated AI calls.

## Stack

- React + Vite + Tailwind (dark UI, subject color-coding)
- Supabase (Postgres + Auth + Edge Functions)
- Claude (Anthropic API) for lesson + sub-plan generation

## Quick preview (no setup required)

This package includes a prebuilt static preview in `dist-preview/`,
with auth disabled and Supabase calls mocked using sample data
("Kickball Day 1" + a few other lessons). To view it:

```bash
cd dist-preview
python3 -m http.server 8080
```

Then open http://localhost:8080/index.html — it's the real app UI
(Dashboard, Lesson Library, Plan Book / Sub Plan views, Generator
form), just running on canned data instead of a live Supabase project.

To rebuild this preview after making changes to the source:

```bash
npm install
npm run build:preview
```

## Setup (full app)

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

Create a project at https://supabase.com, then copy your project URL
and anon key into a `.env` file:

```bash
cp .env.example .env
# edit .env with your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

### 3. Apply the database migration

Using the Supabase CLI:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Or paste the contents of `supabase/migrations/0001_init.sql` into the
Supabase SQL editor and run it.

This creates `profiles`, `units`, `class_periods`, and `lessons`
tables with row-level security so each teacher only sees their own
data, plus a trigger that auto-creates a profile on signup.

### 4. Deploy the Edge Functions

The lesson and sub-plan generation prompts live server-side in
`supabase/functions/` so they're never exposed to the client.

```bash
supabase functions deploy generate-lesson
supabase functions deploy generate-sub-plan
```

Set your Anthropic API key as a function secret (never put this in
`.env` or anywhere client-accessible):

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

### 5. Run the app

```bash
npm run dev
```

Sign up via the Login screen (this creates a `profiles` row
automatically via the database trigger), then go to **New Lesson** to
generate your first `LessonObject`.

## Project structure

```
src/
  components/
    layout/AppShell.jsx       - sidebar/topbar shell
    lesson/LessonCard.jsx      - lesson library card
    renderers/
      PlanBookRenderer.jsx     - Renderer #1: matches district Plan Book format exactly
      SubPlanRenderer.jsx       - Renderer #2: substitute-friendly plan
  pages/
    Dashboard.jsx
    LessonGenerator.jsx        - input form -> generate-lesson Edge Function
    LessonLibrary.jsx
    LessonDetail.jsx            - Plan Book / Sub Plan toggle
    CurriculumMap.jsx           - placeholder for Phase 2
    Settings.jsx
    Login.jsx
  services/
    lessonsService.js          - Supabase CRUD for lessons
    generationService.js       - client entrypoints to Edge Functions
  types/
    lessonObject.js             - LessonObject schema + empty factory
    sampleLesson.js              - "Kickball Day 1" reference example

supabase/
  migrations/0001_init.sql
  functions/
    generate-lesson/            - ONE AI call -> full LessonObject
    generate-sub-plan/          - ONE AI call -> sub_* fields only
    _shared/
      lessonPrompt.js            - prompt-engineering moat (lesson generation)
      subPlanPrompt.js            - prompt-engineering moat (sub plan)
      anthropic.js                 - Claude API call + JSON parsing
      lessonObjectDefaults.js      - Deno-side copy of empty LessonObject
      cors.js
```

## Roadmap

See the original build spec for full Phase 1/2/3 scope. Near-term:

- Warm-up card generator
- Station signs with QR -> demo video links
- Health PowerPoint generator
- Quiz / exit ticket generator
- Parent letter generator
- Curriculum map aggregation (currently a placeholder page)
- Equipment matcher
- Fitness assessment tracker

## Strategic notes

- Build privately; polish before any reveal.
- Prompts and content libraries stay server-side (Edge Functions),
  never exposed to or documented for the client.
- UI should read as professional/high-end — this will eventually be
  demoed to district admins, not just individual teachers.
- The engine is subject-agnostic at the core; Art/Music/Library niches
  can be added later as new content libraries + prompts on the same
  engine.
