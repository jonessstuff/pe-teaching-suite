# Print consolidation plan — Option B (generator result pages)

Handoff doc for a fresh session. Goal: give the **generator result pages** the same
print treatment `/lessons/:id` already has (title header, `document.title` swap,
hedge/verification-note strip) **without** a per-generator print block — by routing
every generator's result render through one shared component.

Status of what already shipped (do NOT redo):
- `src/styles/print.css` (global, imported in `main.jsx`)
- `src/components/LessonPrintFix.jsx` (`LessonPrintFix` default, `PrintTeacherInfoToggle`,
  `getPrintTeacherInfo`, `stripHedges`)
- `LessonPrintFix` mounted once in `src/pages/LessonDetail.jsx` above the renderer
- Display-time cleaner `cleanLessonForDisplay` in `src/components/lesson/lessonBodyRenderers.jsx`
  (strips trailing hedge parentheticals on every string; drops `*_verification_note`
  fields). Applied inside `LessonBody`, and to the Adaptive PE path in `LessonDetail`.
- `phase-block` class on the 7 `InstructionBlock` wrappers; `data-no-print` on the bottom nav.

---

## ⚠️ Design decision before you start (important)

The literal "make `LessonBody` render `LessonPrintFix` + the renderer" **does not work
as-is**, because `LessonBody` is shared in three ways:

1. `LessonDetail` **already** renders `<LessonPrintFix/>` next to `<LessonBody/>` — putting
   the header inside `LessonBody` too would **double** it there.
2. `SubBinderRenderer` (FullDayCard) and `UnitRenderer` render `<LessonBody/>` **per day** —
   a header inside `LessonBody` would print a title header on **every day** of a binder/unit.

**Do this instead — add a thin wrapper** (one new file), and swap generators to it:

```jsx
// src/components/lesson/GeneratedLessonView.jsx
import LessonPrintFix from '../LessonPrintFix'
import LessonBody from './lessonBodyRenderers'

// Print-ready single-lesson view for generator RESULT pages: injects the print
// header + document.title swap, then the shared renderer/dispatch (which also runs
// the display-time hedge/verification-note cleanup). Do NOT use this per-day inside
// units/binders — use bare <LessonBody> there.
export default function GeneratedLessonView({ lesson }) {
  return (
    <>
      <LessonPrintFix lesson={lesson} />
      <LessonBody subject={lesson?.subject} lesson={lesson} />
    </>
  )
}
```

Then each generator's result render becomes a single swap:
`<XRenderer lesson={result} />`  →  `<GeneratedLessonView lesson={result} />`

`LessonBody` stays exactly as it is (still used bare, per-day, by units/binders).
`LessonDetail` stays as it is (keeps its own explicit `LessonPrintFix` + `LessonBody`).

> Note: routing generator results through `LessonBody` means freshly generated lessons
> shown in the result view now also get `cleanLessonForDisplay` — i.e. `state_verification_note`
> won't show in the result preview even before the prompt source-fix. That's fine/desired.

`LessonBody` dispatches by `lesson.subject` against the `LESSON_RENDERERS` map in
`src/components/lesson/lessonBodyRenderers.jsx`, with `mode === 'tutoring'` →
`TutoringSessionRenderer`, and any unmapped subject → `PlanBookRenderer`. So the swap is
only safe when the result object carries the right `subject` (and `mode` where relevant).

---

## Category 1 — Standard swap (safe, ~21 files)

Each renders `<XRenderer lesson={result} />`, its renderer IS in `LESSON_RENDERERS`, its
`subject` matches the map key, and it has a result-page print button. Swap to
`<GeneratedLessonView lesson={result} />`.

| File | Current renderer | result.subject (map key) |
|---|---|---|
| `AfterSchoolClubsGenerator.jsx` | AfterSchoolClubsRenderer | After-School Clubs |
| `DanceGenerator.jsx` | DanceRenderer | Dance |
| `DhhGenerator.jsx` | DhhRenderer | Teacher of the Deaf & Hard of Hearing |
| `EarlyChildhoodGenerator.jsx` | EarlyChildhoodRenderer | Early Childhood |
| `ElementaryTechGenerator.jsx` | ElementaryTechRenderer | Elementary Technology |
| `EslSpecialistGenerator.jsx` | EslSpecialistRenderer | ESL/ELL Specialist |
| `GiftedTalentedGenerator.jsx` | GiftedTalentedRenderer | Gifted & Talented |
| `InstructionalCoachingGenerator.jsx` | InstructionalCoachingRenderer | Instructional Coaching |
| `JrotcGenerator.jsx` | JrotcRenderer | JROTC |
| `MakerProjectGenerator.jsx` | MakerProjectRenderer | Makerspace |
| `OtGenerator.jsx` | OtRenderer | Occupational Therapists |
| `PtGenerator.jsx` | PtRenderer | Physical Therapists |
| `SchoolCounselorGenerator.jsx` | SchoolCounselorRenderer | School Counselors |
| `SlpGenerator.jsx` | SlpRenderer | Speech-Language Pathologists |
| `SpecialEducationGenerator.jsx` | SpecialEducationRenderer | Special Education |
| `SstActivityGenerator.jsx` | SstActivityRenderer | Student Support Team Activities |
| `StaffPdGenerator.jsx` | StaffPdRenderer | Staff PD & Meeting Planning |
| `TestPrepGenerator.jsx` | TestPrepRenderer | Test Prep |
| `TheaterGenerator.jsx` | TheaterRenderer | Theater |
| `TviGenerator.jsx` | TviRenderer | Teacher of the Visually Impaired |
| `WorldLanguagesGenerator.jsx` | WorldLanguagesRenderer | World Languages |

---

## Category 2 — Original 6 (swap, but different variable + no print button)

These render `<XRenderer lesson={generatedLesson} />` (variable is **`generatedLesson`**,
not `result`) and have **no result-page print button** (users save → print from
`/lessons/:id`, already fixed). Migrating still adds the header for browser **⌘P** from the
result page — worthwhile but lower priority. Swap to
`<GeneratedLessonView lesson={generatedLesson} />`.

| File | Renderer (line) | subject → dispatch |
|---|---|---|
| `LessonGenerator.jsx` | PlanBookRenderer (~259) | "Physical Education"/"PE"/"Health" → unmapped → **PlanBookRenderer fallback** (matches today) |
| `ArtGenerator.jsx` | ArtPlanRenderer (~183) | Art |
| `MusicGenerator.jsx` | MusicPlanRenderer (~174) | Music |
| `LibraryGenerator.jsx` | LibraryPlanRenderer (~174) | Library/Media |
| `StemGenerator.jsx` | StemPlanRenderer (~261) | STEM |
| `CteGenerator.jsx` | CtePlanRenderer (~476) | CTE |

⚠️ `LessonGenerator.jsx` also renders a **fitness-test** result (multiple `FitnessTestPrep`
lessons) and a lesson result. Only swap the **single-lesson** render path; leave the
fitness-test path alone.

---

## Category 3 — Needs care (3 files)

- **`InterventionGenerator.jsx`** — renders `<InterventionRenderer lesson={en.intervention_object} />`
  (prop source is `en.intervention_object`, not `result`). `subject` is baked as
  "Intervention Planning". Swap to `<GeneratedLessonView lesson={en.intervention_object} />`;
  confirm `en.intervention_object.subject === 'Intervention Planning'`.

- **`MathSpecialistGenerator.jsx`** and **`ReadingSpecialistGenerator.jsx`** — dual-mode.
  In the tutoring branch they render `<TutoringSessionRenderer lesson={result} />`; in the
  whole-class branch, `<MathSpecialistRenderer/>` / `<ReadingSpecialistRenderer/>`.
  `LessonBody`'s `resolveRenderer` already handles this: `mode === 'tutoring'` →
  `TutoringSessionRenderer`, else the subject renderer. So a **single**
  `<GeneratedLessonView lesson={result} />` can replace **both** branches — but only if the
  result carries `subject` ("Math Specialists"/"Reading Specialists") **and** `mode` (set to
  `'tutoring'` on tutoring results). **Verify both fields on both output shapes** before
  collapsing the conditional; if `mode` isn't reliably present on the object, keep the
  branch and wrap each renderer call individually instead.

---

## Excluded — do NOT migrate

- **`AdaptivePEGenerator.jsx`** — `AdaptivePERenderer` is **intentionally not** in
  `LESSON_RENDERERS` (LessonDetail special-cases it). Routing it through `LessonBody`/`GeneratedLessonView`
  would fall back to `PlanBookRenderer` (wrong). Handle it like `LessonDetail` does instead:
  render `<LessonPrintFix lesson={result} />` + `<AdaptivePERenderer lesson={cleanLessonForDisplay(result)} />`
  directly (import `cleanLessonForDisplay` from `lessonBodyRenderers`).
- **Not single lessons** (own print structure / non-lesson renderers): `UnitBuilder.jsx`
  (UnitRenderer — already uses LessonBody per day), `SubBinderGenerator.jsx` / `MyBinders.jsx`
  (SubBinderRenderer), `PacingGuideGenerator.jsx` / `MyPacingGuides.jsx` (PacingGuideRenderer),
  `AssessmentBank.jsx` (QuizRenderer), `ClassroomManagementGenerator.jsx` / `MyClassroomCards.jsx`
  (BehaviorChartRenderer — non-standard props), `EOYNarrativeGenerator.jsx`, `PortfolioBuilder.jsx`,
  `FieldDayPlanner.jsx`. If any of these need a print header later, it's a per-type header, not this migration.

---

## Verify each one renders identically after migration

1. **Renderer identity:** confirm `result.subject` maps to the *same* renderer the generator
   used directly (Category tables above). For Cat 2 PE, confirm it still falls back to
   `PlanBookRenderer`. For Cat 3 Math/Reading, confirm `mode` drives tutoring vs whole-class.
2. **Visual diff:** generate one lesson per migrated module and eyeball the result view —
   same sections/fields/order as before. Diff especially: unit-day nav, images/diagrams,
   any renderer that read a prop other than `lesson`.
3. **Cleaner side-effects:** the result view now runs `cleanLessonForDisplay`. Confirm it only
   removes trailing hedge parentheticals + `*_verification_note` (not real content like
   "(12)" or "(K–2)").
4. **Header fields:** print-preview (or ⌘P) one lesson per structurally-different module
   (PE, CTE, a clinical one) and confirm the header shows title + a correct bullet meta line,
   and the browser header shows the lesson title (document.title swap).
5. **No regressions elsewhere:** binders/units still render **without** a per-day header
   (they use bare `<LessonBody>`), and `/lessons/:id` still shows exactly **one** header
   (it keeps its own `LessonPrintFix`; it must NOT also be switched to `GeneratedLessonView`).

Rough size: 1 new file + ~30 one-line swaps (21 Cat-1 + 6 Cat-2 + 3 Cat-3), Adaptive PE
handled specially, ~9 pages excluded.

---

## Separate note — the 18 prompt files that emit `state_verification_note`

Source-fix pass (own task, not part of this migration). These Edge Function prompt builders
in `supabase/functions/_shared/` define/populate `state_verification_note`:

```
dancePrompt.js
dhhPrompt.js
earlyChildhoodPrompt.js
elementaryTechPrompt.js
eslSpecialistPrompt.js
giftedTalentedPrompt.js
instructionalCoachingPrompt.js
jrotcPrompt.js
mathSpecialistPrompt.js
otPrompt.js
ptPrompt.js
readingSpecialistPrompt.js
schoolCounselorPrompt.js
slpPrompt.js
sstActivityPrompt.js
testPrepPrompt.js
theaterPrompt.js
tviPrompt.js
```

Also: `(verify against official standards)`-style text comes from 10 other prompt builders —
`lessonPrompt.js`, `artLessonPrompt.js`, `musicLessonPrompt.js`, `libraryLessonPrompt.js`,
`libraryUnitPrompt.js`, `stemLessonPrompt.js`, `eslSpecialistPrompt.js`, `tutoringPrompt.js`,
`unitPrompt.js`, `yearPlanPrompt.js`. `(if applicable)` is **not** produced by any prompt
(ad-hoc model output; only the display-time `stripHedges` removes it from old lessons).
