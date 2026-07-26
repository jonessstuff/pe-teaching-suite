/**
 * After-School Clubs prompt builder.
 *
 * Produces a ready-to-run SESSION PLAN (not a full curriculum) for a typical
 * after-school club meeting. Teacher picks a club type + grade band (K-2 / 3-5 /
 * 6-8 / 9-12); content scales in structure, independence, and tone by band —
 * younger = more scaffolding and shorter segments, older = more autonomy,
 * leadership, and student ownership.
 *
 * There is NO single national standards body for after-school clubs. The plan is
 * anchored on general best practices for extracurricular facilitation: engaging,
 * low-prep, high student choice/voice, and structured enough that a FIRST-TIME
 * sponsor with zero training in this specific club type can walk in and run it.
 */

const BANDS = {
  "k-2": { label: "K–2", context: "youngest — MAXIMUM structure and adult scaffolding; very short segments (about 5–10 minutes each) with frequent transitions and movement; simple rules with lots of modeling and demonstration; keep it playful and concrete. 'Leadership' here means small helper jobs (line leader, materials helper, timer holder). Assume short attention spans and mixed reading ability." },
  "3-5": { label: "3–5", context: "upper elementary — clear structure with a bit more independence; segments about 10–15 minutes; students can follow multi-step directions with reminders; offer simple choices and rotating helper roles; still need visible routines and adult pacing." },
  "6-8": { label: "6–8", context: "middle school — more student voice, small-group autonomy, and some student-led segments; growing independence; leadership means officer roles, leading a warm-up, and real input into what the club does; balance structure with genuine ownership; keep it age-respectful, never childish." },
  "9-12": { label: "9–12", context: "high school — HIGH student autonomy and genuine leadership; students can co-run and even lead sessions, with the sponsor acting more as facilitator/advisor than director; leadership means elected officers, student-designed activities, mentoring younger members, and real responsibility; treat members as capable young adults." },
}

// value → { label, category, guide, special? }. `special` is injected as a
// hard rule for club types that need careful handling (safety / scope / tone).
const CLUBS = {
  // 1. Sports (intramural / rec-level, for students NOT on formal school teams)
  basketball: { label: "Basketball (rec)", category: "Sports (rec-level)", guide: "low-pressure, inclusive basketball — skill stations (dribbling, passing, shooting), small-sided games, and fun challenges; everyone plays regardless of skill." },
  volleyball: { label: "Volleyball (rec)", category: "Sports (rec-level)", guide: "rec volleyball — bumping/setting/serving practice, cooperative rallies (keep-it-up challenges), and small-sided games; lower the net and use a softer ball for younger bands." },
  soccer: { label: "Soccer (rec)", category: "Sports (rec-level)", guide: "rec soccer — dribbling/passing/shooting stations and small-sided games; maximize touches with small teams; inclusive and low-pressure." },
  flag_football: { label: "Flag football", category: "Sports (rec-level)", guide: "flag (NON-contact) football — routes, throwing/catching, flag-pulling, and small-sided games; emphasize no contact and clear rules." },
  pickleball: { label: "Pickleball", category: "Sports (rec-level)", guide: "pickleball — grip and dinking basics, serving, short rallies, and mini-games; forgiving and easy to pick up; rotate players in." },
  badminton: { label: "Badminton", category: "Sports (rec-level)", guide: "badminton — grip, clears and short serves, cooperative rallies, and quick singles/doubles mini-games." },
  table_tennis: { label: "Table tennis", category: "Sports (rec-level)", guide: "table tennis / ping-pong — grip and control drills, cooperative rallies, and round-robin or 'around the world' rotation to keep everyone moving." },
  ultimate_frisbee: { label: "Ultimate frisbee", category: "Sports (rec-level)", guide: "ultimate — throwing (backhand/forehand) and catching, pivoting, and small-sided non-contact games; emphasize Spirit of the Game (self-officiating, sportsmanship)." },
  bowling: { label: "Bowling", category: "Sports (rec-level)", guide: "bowling (real lanes or hallway/gym set) — rolling technique, scoring, and friendly team frames; great equalizer, all abilities welcome." },
  archery: { label: "Archery", category: "Sports (rec-level)", guide: "rec archery — stance, nocking, aiming, and controlled shooting at short range. SAFETY-FIRST and rec-level only.", special: "ARCHERY: safety is paramount. safety_note MUST cover range rules — a single shooting line, one clear whistle/verbal command system (e.g., signals to shoot and to retrieve), never point a bow at people, shoot and retrieve only on command, equipment inspection, and constant adult supervision. Note that formal programs (e.g., NASP) set established safety standards a sponsor should follow. Keep everything short-range and beginner." },

  // 2. Academic / Enrichment
  dnd: { label: "D&D / tabletop gaming", category: "Academic & Enrichment", guide: "Dungeons & Dragons / tabletop RPGs and board games — collaborative storytelling, character creation, and running short beginner-friendly sessions; emphasize teamwork, imagination, and inclusive tables. For younger bands use simplified, one-session adventures." },
  stem: { label: "STEM club", category: "Academic & Enrichment", guide: "hands-on STEM — quick build/experiment challenges (towers, bridges, catapults, simple chemistry), the engineering design process, and low-cost materials; emphasize tinkering and iteration over 'right answers.'" },
  robotics: { label: "Robotics", category: "Academic & Enrichment", guide: "robotics — building and programming simple robots (age-appropriate kits), challenges/missions, and teamwork roles (builder, coder, tester); scaffold heavily for younger bands." },
  coding: { label: "Coding / game design", category: "Academic & Enrichment", guide: "coding and game design — block-based tools (e.g., Scratch) for younger, text-based for older; build small games/projects; emphasize creativity, sharing, and debugging as normal." },
  debate: { label: "Debate", category: "Academic & Enrichment", guide: "debate — argument basics, claim/evidence/reasoning, short practice rounds and fun low-stakes topics; build speaking confidence; formalize format (e.g., structured rebuttals) more for older bands." },
  model_un: { label: "Model UN", category: "Academic & Enrichment", guide: "Model UN — country research, position basics, and mock committee sessions with parliamentary procedure; scale procedure and prep expectations up by band." },
  quiz_bowl: { label: "Quiz bowl / academic team", category: "Academic & Enrichment", guide: "quiz bowl / academic team — buzzer practice, question categories, team strategy, and friendly scrimmages; keep it fast, fun, and inclusive of all knowledge areas." },
  book_club: { label: "Book club", category: "Academic & Enrichment", guide: "book club — choosing books together, discussion structures, and fun response activities; use read-alouds/short texts for younger bands, student-led discussion for older." },
  creative_writing: { label: "Creative writing", category: "Academic & Enrichment", guide: "creative writing — low-pressure prompts, short sharing, and playful genre challenges (flash fiction, poetry, worldbuilding); celebrate voice, not correctness." },
  chess: { label: "Chess", category: "Academic & Enrichment", guide: "chess — piece movement and basic tactics for beginners, ladder/round-robin play, and puzzles; pair new players with mentors; welcome all levels." },
  math_team: { label: "Math team", category: "Academic & Enrichment", guide: "math team — fun problem-solving, math games/puzzles, and friendly relay/scrimmage formats; emphasize curiosity and collaboration over competition pressure." },
  lego_club: { label: "Lego club", category: "Academic & Enrichment", guide: "LEGO club — building in two modes: FREE-BUILD (open creative time) and THEMED CHALLENGES (STEM-connected builds — tallest tower, working bridge, a vehicle that rolls, an earthquake-proof structure). Include collaborative/team-build formats and, importantly, a shared-brick INVENTORY and a sorting/cleanup routine so bricks don't walk off. Scale challenge complexity by band." },
  foreign_language: { label: "Foreign language club (Spanish, French…)", category: "Academic & Enrichment", guide: "foreign language club (e.g., Spanish Club, French Club) — exploring ONE target language and its cultures through conversational-practice GAMES, simple phrases, food/music, and holiday/tradition celebrations tied to that language's cultures. Low-pressure and playful; welcoming to both learners and heritage speakers. (For a broad multi-culture club, see Language & culture club.)" },
  resume_club: { label: "Resume writing (MS/HS)", category: "Academic & Enrichment", guide: "resume writing club (MS/HS) — resume and cover-letter basics, interview-skills practice (common questions, mock interviews), and professional communication (email etiquette, introductions). Practical and confidence-building; use age-appropriate examples (first jobs, clubs, volunteering). Older-band focus." },
  entrepreneurship: { label: "Entrepreneurship / young business", category: "Academic & Enrichment", guide: "entrepreneurship / young business owners club — developing a simple business concept, basic budgeting and pricing, and pitch practice (a friendly 'shark tank'); optional tie-in to a small real mini-venture (bake sale, spirit merch, a service). Emphasize creativity, teamwork, and money basics at an age-appropriate level." },

  // 3. Creative / Performing
  yearbook: { label: "Yearbook", category: "Creative & Performing", guide: "yearbook — photo assignments, page/spread layout basics, deadlines, and team roles (photographer, editor, designer); a real production workflow scaled to the band." },
  newspaper: { label: "Newspaper / journalism", category: "Creative & Performing", guide: "student newspaper / journalism — story ideas, basic reporting and interviewing, writing/editing, and simple layout; assign beats and roles; publish something real." },
  photography: { label: "Photography", category: "Creative & Performing", guide: "photography — composition basics (rule of thirds, light, angles), themed photo challenges, and sharing/critique; phone cameras are fine; emphasize seeing creatively." },
  film_video: { label: "Film / video production", category: "Creative & Performing", guide: "film/video — short-form storytelling, shot types, simple scripting/storyboarding, filming, and basic editing; team roles; make a short piece to share." },
  art: { label: "Art club", category: "Creative & Performing", guide: "art club — approachable projects across media (drawing, painting, collage, crafts), skill mini-lessons, and free-choice studio time; process over product." },
  choir: { label: "Choir", category: "Creative & Performing", guide: "choir — group singing for fun; vocal warm-ups, breathing, matching pitch, and simple part-singing; build ensemble and confidence.", special: "CHOIR: provide general vocal warm-up ideas and guidance on HOW to choose songs (age-appropriate; use public-domain, folk, or properly licensed/purchased music) — but NEVER generate, quote, print, or reproduce copyrighted song lyrics or sheet music. Describe SELECTION CRITERIA and where to source legal music, not actual lyrics or notation." },
  drama: { label: "Drama / theater", category: "Creative & Performing", guide: "drama/theater — theater games and improv, acting basics, and scene/short-play work building toward an informal share or performance; emphasize ensemble and fun." },
  step_team: { label: "Step team", category: "Creative & Performing", guide: "step team — rhythmic stepping/clapping routines, call-and-response, and building simple combos into a group routine; strong emphasis on unison, energy, and teamwork." },
  dance_team: { label: "Dance team", category: "Creative & Performing", guide: "dance team — warm-ups, learning and building simple choreography across styles, and working toward a group routine; inclusive of all experience levels." },
  digital_art: { label: "Digital art", category: "Creative & Performing", guide: "digital art club — creating on screens: logo design, poster/flyer making, and digital illustration basics with free/available tools (e.g., Canva, drawing apps, tablets). Cover simple design principles (contrast, layout, color) and let students make real, shareable pieces; experimentation over polish." },
  sewing_fiber: { label: "Sewing / fiber crafts", category: "Creative & Performing", guide: "sewing / fiber crafts club — hand-sewing basics, cross-stitch, needlepoint, latch hook, and (age/equipment permitting) basic machine sewing. Small, finishable projects; teach threading, simple stitches, and finishing. Match technique to band and available equipment.", special: "SEWING / FIBER CRAFTS: match technique to band and equipment — hand-sewing/cross-stitch/needlepoint/latch hook for most bands; basic MACHINE sewing only for older bands with adult supervision. safety_note MUST cover needle and scissor safety: blunt/plastic needles and plastic canvas for the youngest, careful handling, counting needles/pins in and out, and direct adult supervision for any machine use." },
  stained_glass: { label: "Stained glass", category: "Creative & Performing", guide: "stained glass club — the LOOK of stained glass through SAFE methods: 'faux stained glass' with tissue paper, cellophane, and black paper / contact-paper frames, or pre-cut pieces assembled by students. Emphasize design, color, and light.", special: "STAINED GLASS: real glass-cutting carries cut-injury risk. DEFAULT the plan to SAFER alternatives — faux stained glass (tissue/cellophane + black paper or contact-paper frames) or PRE-CUT pieces where an ADULT does any cutting. Do NOT have students of ANY band operate glass cutters or handle raw cut-glass edges. safety_note MUST state that student glass-cutting is out of scope and that real leaded/copper-foil glasswork requires adult-only cutting, eye protection, and proper training." },
  ceramics: { label: "Ceramics / pottery", category: "Creative & Performing", guide: "ceramics / pottery club — HAND-BUILDING clay work: pinch pots, coil, and slab techniques, plus surface decoration. Use air-dry or oven-bake clay where no kiln is available; any kiln firing is handled by a certified adult. Emphasize hands-on making and craftsmanship.", special: "CERAMICS / POTTERY: KILN FIRING is ADULT / CERTIFIED-ONLY — burn and electrical hazards; students NEVER load, operate, or open a hot kiln. Center student work on HAND-BUILDING (pinch pot, coil, slab). Where no kiln is available, DEFAULT to air-dry or oven-bake clay. safety_note MUST state kiln operation is adult/certified-only and offer the air-dry-clay alternative for programs without kiln access." },

  // 4. Physical / Wellness
  run_club: { label: "Run club", category: "Physical & Wellness", guide: "run club — easy, inclusive running/jogging/walking with a friendly, non-competitive vibe; group runs, routes, and fun goals.", special: "RUN CLUB: include a SIMPLE, easy-to-maintain lap-tracking and incentive structure — e.g., a lap punch card, a class lap chart, or cumulative mileage toward a fun milestone/reward. Keep it inclusive (walking counts) and never about speed or body image." },
  fitness_club: { label: "Fitness club", category: "Physical & Wellness", guide: "fitness club — fun, non-competitive movement: games, circuits framed as challenges, music, and variety.", special: "FITNESS CLUB: frame everything as NON-competitive, activity- and FUN-based movement. Do NOT use weight-loss, calorie, body-composition, 'toning,' or appearance/body-focused language of any kind. Focus on enjoyable movement, games, energy, and feeling good — not fitness metrics or bodies." },
  jump_rope: { label: "Jump rope", category: "Physical & Wellness", guide: "jump rope — individual and long-rope skills, simple tricks, and group games/challenges.", special: "JUMP ROPE: this club is often ADMINISTRATIVELY ASSIGNED to a teacher rather than personally chosen. Keep the tone practical, matter-of-fact, and genuinely useful — NOT falsely peppy or over-enthusiastic. Give the assigned sponsor real, low-prep structure they can lean on to run a solid, easy session." },
  cheer: { label: "Cheer", category: "Physical & Wellness", guide: "cheer — basic arm motions, voice/chants, and simple sideline choreography built into a short routine; energy, unison, and school spirit.", special: "CHEER: cover ONLY basic arm motions, chants/cheers, and simple sideline choreography. Do NOT include stunting, lifting, tosses, partner work, pyramids, or tumbling of ANY kind. safety_note MUST state clearly that any stunting, lifting, or tumbling requires a certified cheer coach and proper training/spotting and is out of scope for this club." },
  yoga: { label: "Yoga / mindfulness", category: "Physical & Wellness", guide: "yoga/mindfulness — gentle age-appropriate poses, simple breathing, and short calming/mindfulness activities; non-spiritual, relaxed, and inclusive; emphasize comfort and 'no forcing.'" },
  hiking: { label: "Hiking / outdoors", category: "Physical & Wellness", guide: "hiking/outdoors — walks, nature exploration, and outdoor skills/games; on- or near-campus for younger bands.", special: "HIKING / OUTDOORS: safety_note should cover adult supervision and ratios, staying together/head counts, water and weather/sun, appropriate footwear, route planning, and required permission/waivers for any off-campus outing. Keep younger bands on or immediately near campus." },
  golf: { label: "Golf", category: "Physical & Wellness", guide: "golf club — swing mechanics and PUTTING fundamentals, grip/stance, plus etiquette and basic rules; ACCESS-DEPENDENT (driving range, putting green, gym with foam balls, or a simulator). Inclusive and low-pressure; use plastic/foam balls indoors for safety and space, and keep swing spacing wide." },
  tennis: { label: "Tennis", category: "Physical & Wellness", guide: "tennis club — basic strokes (forehand, backhand, serve), rules/scoring basics, and rally-building drills; ACCESS-DEPENDENT (courts, gym with modified nets, or wall rallies). Use foam / low-compression balls and shorter racquets for younger bands; maximize hits and keep everyone moving." },
  swim: { label: "Swim club", category: "Physical & Wellness", guide: "swim club — DRYLAND content ONLY in this plan: dryland conditioning and mobility, stroke technique taught verbally/visually on deck, water-safety knowledge, and team-building. Any in-water activity requires certified lifeguard/instructor supervision (see safety rule).", special: "SWIM CLUB: this is a HARD safety boundary. ALL in-water activity requires a certified lifeguard AND/OR certified swim instructor physically present — this generated plan is NOT a substitute and MUST NOT provide in-water drills to be run without certified supervision. Build the actual session around DRYLAND content only: dryland conditioning/mobility, stroke technique taught VERBALLY/VISUALLY (demonstration and discussion on deck, NOT in water), water-safety knowledge, and team-building. safety_note MUST state explicitly that in-water instruction requires a certified lifeguard/instructor and is out of scope for this plan." },
  wellness: { label: "Wellness / healthy habits", category: "Physical & Wellness", guide: "wellness / healthy habits club — sleep, nutrition basics, screen-time balance, stress management, goal-setting, and building healthy routines through discussion, activities, and simple friendly challenges; supportive and non-judgmental.", special: "WELLNESS / HEALTHY HABITS: focus on sleep, nutrition basics, screen-time balance, stress management, goal-setting, and healthy routines. Do NOT use weight, calorie, body-composition, dieting, 'good/bad food,' or appearance/body-focused language of ANY kind. Frame nutrition as fueling/energy and variety, and movement as feeling good — never bodies or weight." },
  nature_club: { label: "Nature club", category: "Physical & Wellness", guide: "nature club — outdoor exploration, plant and animal identification, nature journaling, and a school-garden or schoolyard tie-in; hands-on, curious, get-outside focused. Keep younger bands on or immediately near campus." },
  gardening: { label: "Gardening", category: "Physical & Wellness", guide: "gardening club — planting and growing basics (seeds, soil, watering, light), simple seasonal planning, and caring for a garden bed or containers; hands-on stewardship. Real tools carry injury risk (see safety rule).", special: "GARDENING: real tools (trowels, shears/pruners, hand forks) carry cut/puncture injury risk. safety_note MUST cover tool handling and storage, carrying tools point-down, gloves, sun/hydration, hand-washing after soil contact, and awareness of plant/pollen allergies. Match sharp-tool use to band — youngest use child-safe tools and hand-planting; any pruning/sharp tools are adult-assisted." },
  marine_science: { label: "Marine life / ocean science", category: "Physical & Wellness", guide: "marine life / ocean science club — marine ecosystems, ocean-life identification, and conservation (plastics, reefs, watersheds); optional tie-in to classroom aquarium-tank care if one is available. Hands-on and curiosity-driven; use videos, models, and specimens where the ocean isn't nearby." },

  // 5. Leadership / Service
  student_council: { label: "Student council", category: "Leadership & Service", guide: "student council — elections/roles, running meetings, planning school events and spirit activities, and gathering student input; real ownership scaled by band." },
  honor_society: { label: "Honor society", category: "Leadership & Service", guide: "honor society — organizing service projects, peer tutoring, and recognition activities; emphasize leadership, character, and giving back (older bands primarily)." },
  kindness_club: { label: "Kindness / service club", category: "Leadership & Service", guide: "kindness/service club — planning and doing small service and kindness projects (cards, drives, school beautification), and reflecting on impact; concrete and doable." },
  environmental_club: { label: "Environmental / sustainability", category: "Leadership & Service", guide: "environmental/sustainability club — recycling/garden/waste-reduction projects, awareness campaigns, and hands-on stewardship; action-oriented and local." },
  peer_mentoring: { label: "Peer mentoring", category: "Leadership & Service", guide: "peer mentoring — training students to support younger/newer peers, relationship-building activities, and structured mentoring routines; emphasize empathy and reliability." },
  sca_sga: { label: "SCA / SGA (student government)", category: "Leadership & Service", guide: "Student Cooperative Association (SCA) / Student Government Association (SGA) — the regional-naming variant of student council, primarily for MS/HS: officer roles and elections, parliamentary-procedure basics (motions, seconding, majority vote), committee structure, and planning school-wide events (dances, spirit week, fundraisers). Real student ownership; officer-led with the sponsor as advisor at older bands." },
  beta_club: { label: "Beta Club / Junior Beta Club", category: "Leadership & Service", guide: "National Beta Club — an academic honor and service organization (Junior Beta for elementary/MS, Beta Club for MS/HS). Center the session on SERVICE-PROJECT planning, leadership development, and academic-recognition/celebration activities and meeting routines.", special: "BETA CLUB: this is ACTIVITY content ONLY — running meetings, planning service projects, and building leadership. Do NOT determine or imply membership ELIGIBILITY, GPA thresholds, or academic-standing decisions; note in the sponsor_note that membership eligibility and induction are set by the school and National Beta Club's official criteria, not by this plan." },
  mock_trial: { label: "Mock trial", category: "Leadership & Service", guide: "mock trial — the courtroom side of civic engagement: roles (attorneys, witnesses, judge, jury), building a simple case with evidence and questioning, and running a friendly practice trial. Builds public speaking, reasoning, and teamwork; scale case complexity and procedure up by band." },
  youth_in_government: { label: "Youth in Government", category: "Leadership & Service", guide: "Youth in Government / civic engagement — how local and state government works, mock legislative sessions (drafting a bill, debating it, voting), and civic-participation skills that connect students to real civic processes. Scale procedure and research expectations up by band." },
  key_club: { label: "Key Club / Interact", category: "Leadership & Service", guide: "Key Club / Interact Club — the school-based SERVICE-club model (Kiwanis Key Club / Rotary Interact): planning and carrying out community-service projects, tracking service hours, and leadership through giving back. Center the session on service-project planning and teamwork. Note that official charter/membership specifics are set by the sponsoring organization, not this plan." },

  // 6. Identity / Culture / Interest-based
  anime_manga: { label: "Anime / manga club", category: "Identity, Culture & Interest", guide: "anime/manga club — discussion, drawing in the style, themed activities, and (school-appropriate) viewing/reading picks; a welcoming space for fans; keep content age-appropriate." },
  esports: { label: "Gaming / esports", category: "Identity, Culture & Interest", guide: "gaming/esports — organized play in age-appropriate, school-approved games, team roles and strategy, and good-sportsmanship norms; include non-screen social elements too." },
  language_culture: { label: "Language & culture club", category: "Identity, Culture & Interest", guide: "language & culture club — exploring a language and culture(s) through food, music, traditions, simple phrases, and celebrations; welcoming to heritage speakers and newcomers alike." },

  // 7. Life Skills / Hands-On
  cooking_club: { label: "Cooking (baking / culinary)", category: "Life Skills & Hands-On", guide: "cooking club — hands-on food fun scaled by band: no-heat/no-knife recipes and assembly for younger students, progressing to supervised knife skills and controlled heat for the MS/HS CULINARY variant. CAKE DECORATING and CULINARY are specialty/advanced variants of this club. Emphasize following a recipe, teamwork, and cleanup (see safety rule).", special: "COOKING CLUB: scale by band — the YOUNGEST (K–5) do NO-HEAT, NO-KNIFE recipes (assembly, no-bake, plastic/wavy choppers only); the MS/HS culinary variant may progress to supervised knife skills and controlled heat. safety_note MUST cover food hygiene/handwashing, ALLERGEN awareness (check every student's food allergies before any recipe), adult-supervised heat, and knife safety only where age-appropriate." },
  boys_girls_club: { label: "Boys / Girls club (mentorship)", category: "Life Skills & Hands-On", guide: "boys club / girls club — a school-based MENTORSHIP and character group: mentorship, goal-setting, life skills, and values-based discussion in a supportive affinity space. Generic and inclusive (see handling rule); the same structure serves any such group.", special: "BOYS CLUB / GIRLS CLUB: frame as a GENERIC school-based mentorship/character group — mentorship, goal-setting, life skills, and secular values-based discussion. Do NOT assume or prescribe any religious or ideological belief system; keep it inclusive and school-appropriate. Treat it as affinity-based mentorship, with equally strong content regardless of which group it is for." },
  natural_products: { label: "Natural products / DIY (soap)", category: "Life Skills & Hands-On", guide: "natural products / DIY club — making simple personal-care and home products SAFELY: melt-and-pour soap (no lye), bath salts, sugar scrubs, lip balm, and similar. Emphasize following a recipe, measuring, and creativity with scents/colors; caustic (lye) processes are out of scope (see safety rule).", special: "NATURAL PRODUCTS / DIY (SOAP): traditional soap-making uses LYE (sodium hydroxide) — a caustic chemical-burn hazard. DEFAULT the ENTIRE plan to MELT-AND-POUR soap base (pre-made, NO lye handling) plus other no-caustic DIY (bath salts, sugar scrubs, lip balm). Do NOT write a lye / cold-process procedure for students. If lye is mentioned at all, flag it as ADULT-ONLY with proper ventilation and PPE (goggles, gloves) and out of scope for student handling. safety_note MUST cover melt-and-pour heat caution and the no-lye default." },
  candle_making: { label: "Candle making", category: "Life Skills & Hands-On", guide: "candle making club — designing and finishing candles: choosing scents and colors, prepping wicks and containers, and decorating; wax melting and pouring is adult-handled or directly supervised (see safety rule). Emphasize the safe, no-heat student steps and simple design.", special: "CANDLE MAKING: hot wax and heat sources present BURN risk. Wax MELTING and POURING is ADULT-ONLY for younger bands (K–5); older students (MS/HS) may pour ONLY under DIRECT adult supervision with a proper setup. Students safely do the no-heat steps (choosing scents/colors, prepping wicks/containers, decorating). safety_note MUST cover hot-wax burn caution, adult-handled melting, ventilation for scented wax, and a stable heat source (double-boiler/warmer) never left unattended." },
}

const PRINCIPLES = `Anchor the plan on general best practices for extracurricular facilitation (there is NO single national standards body for after-school clubs, and you should NOT invent or cite one):
- ENGAGING and fun — this is not a graded class; students choose to be here (or should feel glad they are).
- LOW-PREP — a busy sponsor with minimal time and budget; favor common, cheap, reusable materials.
- STUDENT CHOICE & VOICE — build in real choices, input, and (scaled by band) student leadership.
- RUNNABLE BY A FIRST-TIMER — assume the sponsor may have ZERO training or background in this specific club type. Tell them what to actually SAY and DO, minute by minute, so they can walk in and run it confidently.`

const JSON_ONLY = `You must return ONLY a single JSON object — no markdown fences, no commentary, no preamble.`

function schemaBlock() {
  return `{
  "subject": "After-School Clubs",
  "club_type": string,
  "club_category": string,
  "title": string,
  "band_label": string,
  "grade_bands": number[],
  "meeting_length_minutes": number,
  "group_summary": string,
  "session_overview": string,
  "session_structure": [ { "segment": string, "minutes": number, "what_to_do": string } ],
  "first_meeting": string,
  "ongoing_meeting": string,
  "materials": string[],
  "student_voice_and_choice": string[],
  "leadership_opportunities": string,
  "facilitation_tips": string[],
  "safety_note": string,
  "variations_and_extensions": string[],
  "sponsor_note": string
}`
}

function fieldNotes(meetingLength) {
  return `Field notes:
- subject: always exactly "After-School Clubs".
- club_type / club_category: echo the selected club and its category.
- grade_bands: JSON array of grade numbers (K = 0) covered by the band.
- meeting_length_minutes: ${meetingLength}.
- group_summary: one line reflecting the group (size / meeting frequency if provided; otherwise a sensible typical club).
- session_overview: 2–3 sentences framing the session AND explicitly noting how it is calibrated to this grade band (structure/independence/tone).
- session_structure: the ready-to-run spine — an OPENING/HOOK, a MAIN ACTIVITY (the bulk), and a WRAP-UP, plus transitions as needed. Segment minutes MUST sum to about ${meetingLength}. Younger bands = more, shorter segments; older bands = fewer, longer, more student-driven segments. what_to_do is concrete: what the sponsor says/does and what students do.
- first_meeting: what to do DIFFERENTLY at the very first meeting (names/icebreaker, norms, interest survey, roles/elections as appropriate to band) — a distinct variant.
- ongoing_meeting: how a typical later meeting runs once the club is established (routine, building skills, student ownership).
- materials: specific, low-cost, easy-to-source items.
- student_voice_and_choice: 3–5 concrete ways students get real choice/input; scale autonomy UP by band.
- leadership_opportunities: how students lead — scaled by band (K-2 = small helper jobs; 9-12 = officers/student-led sessions/mentoring).
- facilitation_tips: 3–5 practical tips for a FIRST-TIME sponsor with no background in this club type (management, pacing, common pitfalls, what to do if it flops).
- safety_note: populate when there are real physical/safety considerations (contact/rec sports, archery, hiking, cheer motions, etc.); otherwise a brief general supervision note. Follow any special rule below exactly.
- variations_and_extensions: 2–4 ways to vary, extend, or level the activity for mixed groups or a bigger event.
- sponsor_note: a brief, reassuring "you can run this" note, PLUS any club-specific caveat required by the special rule below.`
}

export function buildAfterSchoolClubsPrompt({ gradeBand = "3-5", clubType = "stem", clubSize = "", meetingFrequency = "", meetingLengthMinutes = 60, teacherNotes = "" }) {
  const band = BANDS[gradeBand] ?? BANDS["3-5"]
  const club = CLUBS[clubType] ?? CLUBS.stem
  const special = club.special ? `\nSPECIAL HANDLING — FOLLOW EXACTLY:\n${club.special}` : ""

  const groupBits = []
  if (clubSize) groupBits.push(`about ${clubSize} students`)
  if (meetingFrequency) groupBits.push(`meets ${meetingFrequency}`)
  const groupLine = groupBits.length ? groupBits.join(", ") : "a typical club group"

  const system = `You are an experienced after-school program coordinator writing a ready-to-run SESSION PLAN for a club sponsor. This is NOT a full curriculum — it's one solid, engaging meeting a first-time sponsor can execute with confidence.

${PRINCIPLES}

Club — ${club.label} (${club.category}): ${club.guide}
Grade band — ${band.label}: ${band.context}${special}

The plan MUST genuinely reflect this grade band's developmental level in its structure, independence level, segment length, and tone — a 9–12 plan should look and read very differently from a K–2 plan for the same club, not like a relabeled elementary version.

${JSON_ONLY} Match this schema exactly:

${schemaBlock()}

${fieldNotes(meetingLengthMinutes)}
- band_label: "${band.label}". club_type: "${club.label}". club_category: "${club.category}".

LENGTH DISCIPLINE: complete JSON (every field present) over exhaustive detail. A response cut off before the closing brace is a FAILED response.`

  const user = `Generate an after-school club session plan:

- Club: ${club.label} (${club.category})
- Grade band: ${band.label} — ${band.context}
- Group: ${groupLine}
- Meeting length: ${meetingLengthMinutes} minutes${teacherNotes ? `\n- Sponsor notes: ${teacherNotes}` : ""}

Make the structure, independence, and tone unmistakably right for ${band.label}. Return the JSON object now.`

  return { system, user }
}
