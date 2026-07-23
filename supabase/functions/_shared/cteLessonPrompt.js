import { resolveStateName } from "./stateNames.js"

/**
 * CTE (Career & Technical Education) lesson prompt builder.
 *
 * Structurally mirrors buildStemLessonPrompt (5-phase engine, per-focus phase
 * descriptions, framework-labeled standards, multi-stage support) with ONE
 * deliberate difference: CTE runs MS–HS, so it replaces the K–5 grade-band model
 * with a two-tier grade model:
 *   - tier "ms"  → Middle School (Exploratory)
 *   - tier "hs"  → High School (Pathway) + level: introductory | concentrator | completer
 *
 * CTE teachers say "competencies"/"tasks", not "standards", so the standards
 * section is reframed as a competency section. Two unique blocks are added that
 * exist in no other module: Work-Based Learning and Career Pathway context.
 */

const PATHWAY_LABELS = {
  hospitality: "Hospitality & Tourism",
  finance: "Finance",
  marketing: "Marketing",
  human_services: "Human Services / Family & Consumer Sciences",
  health_science: "Health Science",
  education: "Education & Training",
}

function tierLevelLabel(tier, level) {
  if (tier === "ms") return "Middle School (Exploratory)"
  const levelLabel = { introductory: "Introductory", concentrator: "Concentrator", completer: "Completer" }[level] ?? "Introductory"
  return `High School (Pathway) — ${levelLabel}`
}

// Approximate grade span for each tier/level — used to set rigor and reading level,
// NOT as strict standards keys (CTE is course-sequence based, not grade-band based).
function tierGradeContext(tier, level) {
  if (tier === "ms") return "grades 6–8, career exploration and awareness"
  return {
    introductory: "grades 9–10, foundational pathway course",
    concentrator: "grades 10–11, second course in the sequence, deeper technical skill and credential preparation",
    completer: "grades 11–12, capstone course, industry-credential attainment and work-based learning",
  }[level] ?? "grades 9–10, foundational pathway course"
}

function getCteCompetencyGuidance(pathway, tier, level, stateName) {
  const isVirginia = stateName === "Virginia"

  const vaCte = isVirginia
    ? `Primary framework: the Virginia CTE task/competency list for this course, as published by the Virginia CTE Resource Center (cteresource.org). Reference the numbered competency/task format used in Virginia CTE curriculum frameworks (e.g., "Task 39: Describe the guest cycle", "Competency 45: Calculate simple and compound interest"). Set the framework field to "VA CTE" for each entry. If you are not certain of the exact task number, describe the competency clearly in the text field and omit the number rather than inventing one.`
    : `Primary framework: your state's CTE task/competency list for this course. Model the entries on the numbered competency/task format used by state CTE curriculum frameworks (the Virginia CTE Resource Center at cteresource.org is a good reference model for structure). Set the framework field to "State CTE" for each entry. Describe each competency clearly; do not invent task numbers you are not sure of.`

  const perPathwaySecondary = {
    hospitality: `Secondary, industry-credential frameworks for Hospitality & Tourism — include entries from these where the lesson content maps to them:
- ServSafe (National Restaurant Association) — food safety and sanitation competencies. Framework field: "ServSafe". Especially relevant for any culinary, foodservice, or sanitation content.
- AHLEI (American Hotel & Lodging Educational Institute) — lodging, front-desk, and guest-service competencies. Framework field: "AHLEI". Especially relevant for lodging, tourism, and guest-service content.`,
    finance: `Secondary frameworks for Finance — include entries from these where the lesson content maps to them:
- Jump$tart Coalition National Standards for Personal Financial Literacy. Framework field: "Jump$tart".
- Council for Economic Education (CEE) National Standards for Economics / Financial Literacy. Framework field: "CEE".
- FBLA (Future Business Leaders of America) competitive event guidelines — align applied tasks to relevant FBLA events (e.g., Personal Finance, Banking & Financial Systems, Accounting). Framework field: "FBLA".`,
    marketing: `Secondary frameworks for Marketing — include entries from these where the lesson content maps to them:
- DECA competitive event guidelines — align applied tasks to relevant DECA events and the DECA performance indicators (e.g., Principles of Marketing, Marketing Communications, Professional Selling). Framework field: "DECA".
- National Standards for Business Education (NBEA), Marketing strand. Framework field: "NBEA Marketing".`,
    human_services: `Primary national framework for Human Services / Family & Consumer Sciences — lead the competency list with entries from this, and treat the state CTE task list above as the state verification layer for it:
- National Standards for Family and Consumer Sciences Education (AAFCS) — the primary content framework for this pathway (Comprehensive Standards and their Content Standards / Competencies across areas such as Consumer & Family Resources, Nutrition & Wellness, Human Development, Interpersonal Relationships, Career/Community/Family Connections, and Housing & Interior Design). Framework field: "AAFCS". Use the "X.Y.Z" comprehensive/competency numbering only when confident; otherwise describe the competency and omit the code.
Then include entries from these where the lesson content maps to them:
- AAFCS Pre-PAC (Pre-Professional Assessment and Certification) — the industry-credential assessments this pathway builds toward (e.g., Leadership Essentials, Nutrition/Food/Wellness Consultant, Food Science Fundamentals, Culinary Arts). Framework field: "Pre-PAC". Especially relevant for nutrition, food, wellness, and leadership content.
- FCCLA (Family, Career and Community Leaders of America) — the pathway CTSO (national, parallel to DECA/FBLA). Align applied tasks and projects to relevant FCCLA competitive events and national programs (e.g., STAR Events, FCCLA national programs like Families First, Career Connection). Framework field: "FCCLA".
Content areas to prioritize: Family & Consumer Sciences core plus Independent Living / Workplace Readiness — these map to the Virginia FCS-Development and "Career, Community and Family Connections" courses.`,
    health_science: `Primary national framework for Health Science — lead the competency list with entries from this, and treat the state CTE task list above as the state verification layer for it:
- National Health Science Standards (NCHSE — National Consortium for Health Science Education) — the primary content framework for this pathway (foundation standards such as Academic Foundation / anatomy & physiology, Communications, Systems, Employability Skills, Legal Responsibilities, Ethics, Safety Practices, Teamwork, Health Maintenance Practices, Technical Skills, and Information Technology). Framework field: "NCHSE". Use the NCHSE standard / accountability-criterion numbering only when confident; otherwise describe the competency and omit the code.
Then include entries from these where the lesson content maps to them:
- NHA (National Healthcareer Association) — the industry-credential assessments this pathway builds toward (e.g., CCMA Certified Clinical Medical Assistant, CPT Certified Phlebotomy Technician, CET EKG Technician, CBCS Billing & Coding). Framework field: "NHA". Especially relevant for clinical, patient-care, and diagnostic content.
- CPR / First Aid (AHA or American Red Cross) — a common entry-level credential; align safety and medical-emergency content to it. Framework field: "CPR/First Aid".
- HOSA — Future Health Professionals — the pathway CTSO (national, parallel to DECA / FBLA / FCCLA). Align applied tasks and projects to relevant HOSA competitive events and programs. Framework field: "HOSA".
Content areas to prioritize: the Health Science I: Careers and Body Systems foundation — anatomy & physiology by body system, healthcare / medical terminology, common pathologies, diagnostic and clinical procedures, therapeutic interventions, and medical-emergency care fundamentals.`,
    education: `Primary national frameworks for Education & Training (the national 16-cluster framework's Education & Training cluster; Advance CTE's 2024 refresh labels it simply "Education," but the content is the same) — lead the competency list with entries from these, and treat the state CTE task list above as the state verification layer for them:
- InTASC Model Core Teaching Standards (Interstate Teacher Assessment and Support Consortium, CCSSO) — the primary framework for what new teachers should know and be able to do (the 10 standards across The Learner and Learning, Content Knowledge, Instructional Practice, and Professional Responsibility). Framework field: "InTASC". Use the standard number (e.g., "InTASC Standard 3: Learning Environments") only when confident; otherwise describe the competency and omit the code.
- NBPTS Five Core Propositions (National Board for Professional Teaching Standards) — the vision of accomplished teaching this pathway orients toward (e.g., "Teachers are committed to students and their learning," "Teachers think systematically about their practice and learn from experience"). Framework field: "NBPTS".
Then include entries from these where the lesson content maps to them:
- Educators Rising Standards — the standards of Educators Rising, the dedicated national CTSO for future-educator students (not a repurposed general-business club), developed in partnership with the National Education Association (NEA) and aligned to the NBPTS and InTASC frameworks. Align applied tasks, portfolios, and projects to relevant Educators Rising competitive events and programs (e.g., Lesson Planning, Children's Literature, Ethical Dilemma, Public Speaking). Framework field: "Educators Rising". (Educators Rising is national; some states run their own affiliate — e.g., Texas's TAFE, the Texas Association of Future Educators — but keep this lesson national-first and point teachers to their own state's affiliate rather than building to any one state.)
Content areas to prioritize: the Introduction to the Teaching Profession / Education & Training I foundation — lesson-planning basics, classroom-management fundamentals, an introduction to educational psychology and child/adolescent development, and early clinical/field experience (structured classroom observation and practicum in a real school setting).`,
  }[pathway] ?? ""

  const rigorNote =
    tier === "ms"
      ? `This is a Middle School Exploratory course: choose broad, awareness-level competencies. Keep the competency count small (2–4) and phrased for exploration, not mastery.`
      : level === "completer"
        ? `This is a Completer (capstone) course: choose advanced, mastery-level competencies and emphasize competencies tied to actual industry-credential attainment.`
        : level === "concentrator"
          ? `This is a Concentrator course: choose intermediate competencies that build technical depth and begin credential preparation.`
          : `This is an Introductory course: choose foundational competencies appropriate for students new to the pathway.`

  const disclaimer = `CTE competency numbering and credential alignment vary by state and by course. Only present a competency/task number or credential code if you are confident it matches the official framework. When uncertain, describe the competency in plain language and append "(verify against your state's CTE framework)" to that entry's text field — do not present an uncertain number as definitively correct.`

  return `${vaCte}\n\n${perPathwaySecondary}\n\n${rigorNote}\n\n${disclaimer}`
}

// Names of the industry-recognized credentials worth surfacing per pathway, used to
// populate the credential_focus field so teachers see which certifications this
// pathway prepares students for.
function getCredentialFocus(pathway) {
  return {
    hospitality: ["ServSafe Food Handler / Manager (National Restaurant Association)", "AHLEI certifications (e.g., Certified Guest Service Professional)"],
    finance: ["W!SE Financial Literacy Certification", "FBLA competitive event recognition", "Jump$tart-aligned personal finance certificates"],
    marketing: ["DECA competitive event certifications", "NBEA Marketing-aligned recognition", "A*S*K / Marketing industry micro-credentials"],
    human_services: ["AAFCS Pre-PAC certifications (e.g., Leadership Essentials, Nutrition/Food/Wellness, Food Science Fundamentals)", "FCCLA competitive event & national program recognition", "ServSafe Food Handler (for foods/nutrition content)"],
    health_science: ["NHA certifications (e.g., CCMA Clinical Medical Assistant, CPT Phlebotomy Technician)", "CPR / First Aid certification (AHA or American Red Cross)", "HOSA competitive event & program recognition"],
    education: ["Educators Rising Micro-credentials & competitive event recognition", "ETS ParaPro Assessment (entry-level paraeducator credential)", "Child Development Associate (CDA) credential — for early-childhood / education field placements"],
  }[pathway] ?? []
}

function getPhaseDescriptions(pathway) {
  const map = {
    hospitality: {
      warm_up: {
        name: "Industry Hook",
        desc: "Open with a concrete hospitality-industry scenario — a guest complaint, a viral restaurant/hotel moment, a real property or destination, or a short clip. Students react to a real situation front-line workers face. Connect to a named employer, brand, or role. 5–8 minutes.",
      },
      whole_group_instruction: {
        name: "Direct Instruction",
        desc: "Teach the core hospitality concept or procedure directly. Use industry vocabulary correctly (guest cycle, back-of-house, service recovery, occupancy, covers). Where the content is safety- or sanitation-related, teach it to the ServSafe standard. Check understanding before moving to demonstration. 8–12 minutes.",
      },
      fitness_activities: {
        name: "Skill Demonstration",
        desc: "Model the industry skill or procedure step by step the way it is done on the job — a place setting, a check-in sequence, a proper handwashing/sanitation routine, a phone or in-person guest interaction. Name each step. Students watch, then walk through it once with teacher support. 5–10 minutes.",
      },
      independent_practice: {
        name: "Hands-On Service Application",
        desc: "Students apply the skill in a realistic service simulation or lab: role-play a guest interaction, run a mock front desk, complete a sanitation checklist, or plate/serve. Describe exactly what students do, what an industry-appropriate result looks like, and what the teacher observes and coaches. Include a checklist or rubric aligned to how the task is evaluated in the field. 15–20 minutes.",
      },
      closure: {
        name: "Debrief & Industry Connection",
        desc: "Debrief the simulation against industry standards: what met guest expectations, what a manager would coach. Connect the day's skill to a real hospitality career and to the credential it supports (ServSafe / AHLEI). End with one professional takeaway students would put on a resume. 5–8 minutes.",
      },
    },
    finance: {
      warm_up: {
        name: "Financial Bell-Ringer",
        desc: "Open with a real, relatable financial decision or headline — a paycheck breakdown, a credit-card offer, a market move, a budgeting dilemma. Students take a position or make a quick estimate. Connect to a real dollar figure or real company. 5–8 minutes.",
      },
      whole_group_instruction: {
        name: "Concept Instruction",
        desc: "Teach the finance concept directly with correct terminology (principal, interest, liquidity, diversification, APR, opportunity cost). Use one clear worked numeric or conceptual example on the board. Address a common misconception explicitly. Check understanding before guided practice. 8–12 minutes.",
      },
      fitness_activities: {
        name: "Guided Worked Example",
        desc: "Work a second example together, students following along on their own worksheet or spreadsheet — a calculation, a form, a decision matrix. Think aloud through each step and deliberately model checking the answer for reasonableness. Describe exactly what students should have completed by the end of this phase. 8–12 minutes.",
      },
      independent_practice: {
        name: "Applied Finance Task",
        desc: "Students independently or in pairs apply the concept to a case, simulation, or calculation set — build a budget, compare loan offers, analyze a scenario, or complete an FBLA-style applied problem. Write the task prompt clearly with the required output. Include an extension for early finishers. Teacher circulates asking 'What does this number mean? Would you actually make this choice?' 12–18 minutes.",
      },
      closure: {
        name: "Reflection & Real-World Connection",
        desc: "Students state one decision they would make differently with today's knowledge and one place this shows up in adult life. Connect to a real finance career and the credential/competition it supports (Jump$tart / CEE / FBLA). End with a brief exit ticket. 5–8 minutes.",
      },
    },
    marketing: {
      warm_up: {
        name: "Marketing Hook",
        desc: "Open with a real ad, brand, product, or campaign students recognize. Ask what makes it work (or fail): who is the target, what is the message, what is the call to action. Students react before any instruction. Name real brands. 5–8 minutes.",
      },
      whole_group_instruction: {
        name: "Concept Instruction",
        desc: "Teach the marketing concept directly with correct terminology (target market, marketing mix / 4 Ps, positioning, segmentation, brand equity, promotional mix). Tie it to a DECA performance indicator where relevant. Use one clear brand example. Check understanding before analysis. 8–12 minutes.",
      },
      fitness_activities: {
        name: "Example Analysis",
        desc: "Together, analyze a real campaign or product against the concept just taught — deconstruct the target market, the mix, or the message strategy. Model the analytical language a marketer uses. Describe the graphic organizer or framework students fill in as you go. 8–12 minutes.",
      },
      independent_practice: {
        name: "Applied Marketing Task",
        desc: "Students create or analyze independently or in teams — a mini campaign, a positioning statement, a promotional plan, a market-segment profile, or a DECA-style role-play response. Write the task prompt and deliverable clearly. Provide a rubric matching how DECA evaluates the corresponding event. Include an extension for early finishers. 15–20 minutes.",
      },
      closure: {
        name: "Present & Debrief",
        desc: "Teams present or pitch briefly using a structured protocol; peers give one strength and one suggestion in marketing language. Connect the task to a real marketing career and the DECA event / NBEA standard it supports. End with one professional takeaway. 5–8 minutes.",
      },
    },
    human_services: {
      warm_up: {
        name: "Real-Life Hook",
        desc: "Open with a concrete, everyday human-services or family/consumer scenario — a household budgeting dilemma, a nutrition-label comparison, a child-development moment, a workplace-readiness situation, a real community resource. Students react to a situation they or a family they know could actually face. Connect to a real role, agency, or life decision. 5–8 minutes.",
      },
      whole_group_instruction: {
        name: "Concept Instruction",
        desc: "Teach the core FCS / human-services concept directly using correct vocabulary (e.g., nutrient density, developmentally appropriate practice, resource management, consumer rights, interpersonal communication, workplace readiness). Ground it in the AAFCS National Standards content area it belongs to. Address a common misconception and check understanding before hands-on work. 8–12 minutes.",
      },
      fitness_activities: {
        name: "Skill Demonstration",
        desc: "Model the practical FCS skill or procedure step by step the way it is done in a home, workplace, or human-services setting — a food-prep or knife-safety technique, a childcare or age-appropriate activity setup, a budgeting or resource-management process, a mock interview or professional interaction. Name each step. Students watch, then walk through it once with teacher support. 5–10 minutes.",
      },
      independent_practice: {
        name: "Hands-On Application",
        desc: "Students apply the skill in a realistic lab, simulation, or project: a foods lab, a child-development activity plan, a personal/household budget, an independent-living or workplace-readiness task, or an FCCLA-style project. Describe exactly what students do, what a competent result looks like, and what the teacher observes and coaches. Include a checklist or rubric aligned to how the task is evaluated (AAFCS competency, Pre-PAC objective, or FCCLA event). 15–20 minutes.",
      },
      closure: {
        name: "Reflection & Life/Career Connection",
        desc: "Students reflect on how today's skill applies to their own independent living, family, or future workplace, and name one thing they would do with it outside class. Connect the skill to a real human-services or FCS career and to the credential/competition it supports (AAFCS Pre-PAC / FCCLA). End with a brief exit ticket. 5–8 minutes.",
      },
    },
    health_science: {
      warm_up: {
        name: "Clinical Hook",
        desc: "Open with a concrete healthcare scenario — a patient presenting a symptom, an abnormal vital sign, a diagnostic image, a medical case or headline. Students react to a real situation a healthcare worker faces. Connect to a named role, body system, or setting. 5–8 minutes.",
      },
      whole_group_instruction: {
        name: "Concept Instruction",
        desc: "Teach the core health-science concept directly using correct medical terminology (anatomy & physiology by body system, pathology, procedure names, root/prefix/suffix word parts). Ground it in the relevant NCHSE standard. Address a common misconception and check understanding before hands-on work. 8–12 minutes.",
      },
      fitness_activities: {
        name: "Skill Demonstration",
        desc: "Model the clinical skill or procedure step by step the way it is performed in a healthcare setting — proper handwashing and PPE, taking a blood pressure or pulse, patient positioning, a terminology breakdown, a charting entry. Name each step and the safety/infection-control point. Students watch, then walk through it once with teacher support. 5–10 minutes.",
      },
      independent_practice: {
        name: "Hands-On Clinical Application",
        desc: "Students apply the skill in a realistic lab or simulation: take and record vital signs on a partner, practice a procedure on a manikin, work a patient case study, chart findings, or complete a HOSA-style task. Describe exactly what students do, what a competent clinical result looks like, and what the teacher observes and coaches. Include a checklist or rubric aligned to how the task is evaluated (NCHSE competency, NHA skill, or CPR/First Aid standard). 15–20 minutes.",
      },
      closure: {
        name: "Reflection & Career Connection",
        desc: "Students reflect on how today's skill fits into patient care and a real healthcare career, and name one professional habit they would carry forward. Connect the skill to the credential/competition it supports (NHA / CPR-First Aid / HOSA). End with a brief exit ticket. 5–8 minutes.",
      },
    },
    education: {
      warm_up: {
        name: "Classroom Scenario Hook",
        desc: "Open with a concrete teaching scenario — a classroom-management moment, a common student misconception, a lesson that went sideways, or a short clip of a real teacher. Students react as the teacher would: what would you do next? Connect to a real grade level, subject, or school setting. 5–8 minutes.",
      },
      whole_group_instruction: {
        name: "Concept Instruction",
        desc: "Teach the core education / pedagogy concept directly using correct professional vocabulary (learning objective, scaffolding, formative assessment, differentiation, classroom management, developmentally appropriate practice, wait time). Ground it in the relevant InTASC standard. Address a common misconception about teaching and check understanding before the demonstration. 8–12 minutes.",
      },
      fitness_activities: {
        name: "Teaching Skill Demonstration",
        desc: "Model the teaching skill step by step the way it is done in a real classroom — writing a measurable objective, delivering a clear set of directions, using an attention signal, a think-aloud, or a questioning technique. Name each step and the pedagogical reason for it. Students watch, then walk through it once with teacher support. 5–10 minutes.",
      },
      independent_practice: {
        name: "Hands-On Teaching Application",
        desc: "Students apply the skill in a realistic micro-teaching or field task: write and deliver a short mini-lesson segment to peers, practice a classroom routine, design a formative check, script higher-order questions, or complete an Educators Rising-style task. Describe exactly what students do, what a strong result looks like, and what the teacher observes and coaches. Include a checklist or rubric aligned to how teaching is evaluated (InTASC competency or Educators Rising event criteria). 15–20 minutes.",
      },
      closure: {
        name: "Reflection & Profession Connection",
        desc: "Students reflect on how today's skill fits real teaching and a career in education, and name one professional habit they would carry into a field placement. Connect the skill to the credential/competition it supports (Educators Rising / ParaPro / clinical field experience). End with a brief exit ticket. 5–8 minutes.",
      },
    },
  }
  return map[pathway] ?? map.hospitality
}

// Career pathway course sequence per pathway — powers the Career Pathway context
// block so teachers see where this lesson's course sits (Intro → Concentrator → Completer).
function getPathwaySequence(pathway) {
  return {
    hospitality: [
      { level: "introductory", course: "Introduction to Hospitality & Tourism", description: "Industry overview, guest service fundamentals, career awareness across lodging, foodservice, and travel." },
      { level: "concentrator", course: "Hospitality & Tourism Management / Culinary or Lodging Operations", description: "Applied operations, sanitation and safety to ServSafe standard, front-of-house and back-of-house skills." },
      { level: "completer", course: "Advanced Hospitality / Capstone & Work-Based Learning", description: "Capstone project, industry credential attainment (ServSafe / AHLEI), internship or practicum." },
    ],
    finance: [
      { level: "introductory", course: "Introduction to Finance / Personal Finance", description: "Foundational personal financial literacy — budgeting, banking, saving, credit basics." },
      { level: "concentrator", course: "Banking & Financial Services / Accounting", description: "Financial systems, accounting principles, investing, financial-services operations." },
      { level: "completer", course: "Advanced Finance / Capstone & Work-Based Learning", description: "Capstone, industry credential, FBLA competition, internship in a financial institution." },
    ],
    marketing: [
      { level: "introductory", course: "Introduction to Marketing / Principles of Marketing", description: "Marketing foundations — the marketing mix, target markets, the marketing concept." },
      { level: "concentrator", course: "Marketing Management / Advertising & Promotion", description: "Promotion, selling, market research, brand strategy, applied campaigns." },
      { level: "completer", course: "Advanced Marketing / Capstone, DECA & Work-Based Learning", description: "Capstone project, DECA competitive events, entrepreneurship, internship in a marketing role." },
    ],
    human_services: [
      { level: "introductory", course: "Introduction to Family & Consumer Sciences / FCS Exploratory", description: "Broad FCS foundations — nutrition & wellness, human development, relationships, resource management, and career awareness across the Human Services cluster." },
      { level: "concentrator", course: "Independent Living / Workplace Readiness (FCS-Development)", description: "Applied independent-living and employability skills — personal finance, foods & nutrition, consumer decisions, professional communication, aligned to AAFCS competencies." },
      { level: "completer", course: "Career, Community and Family Connections / Capstone, FCCLA & Work-Based Learning", description: "Capstone connecting FCS skills to careers and community, FCCLA leadership & competitive events, AAFCS Pre-PAC credential attainment, and work-based learning placement." },
    ],
    health_science: [
      { level: "introductory", course: "Health Science I: Careers and Body Systems", description: "Foundations — anatomy & physiology by body system, medical terminology, common pathologies, healthcare careers, safety and infection control, and introductory diagnostic/clinical procedures." },
      { level: "concentrator", course: "Health Science II / Clinical & Diagnostic Procedures", description: "Applied clinical skills — patient care, vital signs, infection control to standard, therapeutic and diagnostic procedures, CPR/First Aid, and medical-emergency fundamentals." },
      { level: "completer", course: "Advanced Health Science / Clinical Practicum, HOSA & Work-Based Learning", description: "Capstone with clinical practicum, NHA industry-credential attainment (e.g., CCMA/CPT), HOSA competitive events, and work-based learning placement in a healthcare setting." },
    ],
    education: [
      { level: "introductory", course: "Introduction to the Teaching Profession / Education & Training I", description: "Foundations — the teaching profession and careers in education, lesson-planning basics, classroom-management fundamentals, an introduction to educational psychology and child/adolescent development, and early structured classroom observation." },
      { level: "concentrator", course: "Education & Training II / Instructional Practices & Human Growth and Development", description: "Applied pedagogy — writing objectives and lessons, differentiation and formative assessment, developmentally appropriate practice, and supervised field observation and practicum in a real classroom." },
      { level: "completer", course: "Practicum in Education & Training / Capstone, Educators Rising & Work-Based Learning", description: "Capstone with a clinical field placement (student-teaching-style experience), a professional teaching portfolio, Educators Rising competitive events, entry-level credential attainment (ParaPro / CDA), and work-based learning in a school setting." },
    ],
  }[pathway] ?? []
}

// Optional pathway-specific work-based learning guidance, appended to the WBL block.
// Human Services, Health Science, and Education & Training use Virginia's High-Quality
// Work-Based Learning (HQWBL) model, which recognizes a broader set of 12 methods than
// the internship/shadow/speaker default.
function getWblGuidance(pathway) {
  if (pathway === "human_services" || pathway === "health_science" || pathway === "education") {
    const emphasis = pathway === "health_science"
      ? " Clinical experience is especially relevant for this pathway — prioritize clinical/hospital placements, patient-care rotations, and health-agency service learning where appropriate."
      : pathway === "education"
        ? " Clinical/field experience is especially relevant for this pathway — prioritize structured classroom observation, tutoring and cross-age mentoring placements, and student-teaching-style field experiences in a real school, plus service learning with younger students."
        : ""
    return `\nThis pathway follows Virginia's High-Quality Work-Based Learning (HQWBL) model, which recognizes 12 methods: job shadowing, service learning, mentorship, externship, school-based enterprise, internship, entrepreneurship, clinical experience, cooperative education, youth registered apprenticeship, registered apprenticeship, and supervised agricultural experience. When filling the fields below, draw the most lesson-appropriate ideas from this broader set (not only internships/shadows) — e.g., service learning with a community agency, a clinical experience, a school-based enterprise, or a mentorship — and fold them into the internships and job_shadows arrays as fits this lesson's content and tier.${emphasis}`
  }
  return ""
}

// JSON Schema for structured outputs — forces the model to emit valid, schema-
// conforming JSON (no preamble/commentary, no bad escaping). Mirrors the schema
// documented in the system prompt. Every object needs additionalProperties:false
// and all non-optional properties listed in required (structured-outputs rules).
// Shape depends only on includeELL, so at most two schema variants exist (good for
// the API's per-schema compile cache).
export function buildCteLessonSchema(includeELL = false) {
  const strArr = { type: "array", items: { type: "string" } }
  const schema = {
    type: "object",
    additionalProperties: false,
    required: [
      "title", "subject", "pathway", "pathway_label", "tier", "level", "tier_label",
      "unit", "duration_minutes", "class_size", "stage_label", "competencies",
      "credential_focus", "learning_target", "success_criteria", "skill_focus",
      "assessment_type", "teacher_prep", "equipment_needed", "equipment_alternatives",
      "tools_and_platforms", "location", "setup_diagram", "warm_up",
      "whole_group_instruction", "fitness_activities", "independent_practice", "closure",
      "modifications", "known_vocabulary", "new_vocabulary", "safety_notes",
      "work_based_learning", "career_pathway_context", "suggested_video_searches",
    ],
    properties: {
      title: { type: "string" },
      subject: { const: "CTE" },
      pathway: { type: "string" },
      pathway_label: { type: "string" },
      tier: { type: "string" },
      level: { type: "string" },
      tier_label: { type: "string" },
      unit: { type: "string" },
      duration_minutes: { type: "number" },
      class_size: { type: "number" },
      stage_label: { type: "string" },
      competencies: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["framework", "code", "text"],
          properties: {
            framework: { type: "string" },
            code: { type: "string" },
            text: { type: "string" },
          },
        },
      },
      credential_focus: strArr,
      learning_target: { type: "string" },
      success_criteria: strArr,
      skill_focus: strArr,
      assessment_type: { type: "string", enum: ["formative", "summative", "self-assessment"] },
      teacher_prep: { type: "string" },
      equipment_needed: strArr,
      equipment_alternatives: strArr,
      tools_and_platforms: strArr,
      location: { type: "string" },
      setup_diagram: { type: "string" },
      warm_up: { type: "string" },
      whole_group_instruction: { type: "string" },
      fitness_activities: { type: "string" },
      independent_practice: { type: "string" },
      closure: { type: "string" },
      modifications: { type: "string" },
      known_vocabulary: strArr,
      new_vocabulary: strArr,
      safety_notes: strArr,
      work_based_learning: {
        type: "object",
        additionalProperties: false,
        required: ["internships", "guest_speakers", "job_shadows"],
        properties: { internships: strArr, guest_speakers: strArr, job_shadows: strArr },
      },
      career_pathway_context: {
        type: "object",
        additionalProperties: false,
        required: ["sequence", "note"],
        properties: {
          sequence: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["level", "course", "description", "is_current"],
              properties: {
                level: { type: "string" },
                course: { type: "string" },
                description: { type: "string" },
                is_current: { type: "boolean" },
              },
            },
          },
          note: { type: "string" },
        },
      },
      suggested_video_searches: strArr,
    },
  }

  if (includeELL) {
    schema.required.push("ell_accommodations")
    schema.properties.ell_accommodations = {
      type: "object",
      additionalProperties: false,
      required: ["language_objectives", "tiered_vocabulary", "sentence_frames", "visual_supports", "simplified_instructions"],
      properties: {
        language_objectives: strArr,
        tiered_vocabulary: {
          type: "object",
          additionalProperties: false,
          required: ["tier_1", "tier_2", "tier_3"],
          properties: { tier_1: strArr, tier_2: strArr, tier_3: strArr },
        },
        sentence_frames: strArr,
        visual_supports: strArr,
        simplified_instructions: { type: "string" },
      },
    }
  }

  return schema
}

/**
 * @param {Object} input
 * @param {'hospitality'|'finance'|'marketing'|'human_services'|'health_science'|'education'} input.pathway
 * @param {'ms'|'hs'} input.tier
 * @param {'introductory'|'concentrator'|'completer'|''} [input.level]  required when tier === 'hs'
 * @param {string}  input.topic
 * @param {string[]} input.materials
 * @param {number}  input.classSize
 * @param {number}  input.durationMinutes
 * @param {string}  [input.targetCompetency]
 * @param {string}  [input.state]
 * @param {number}  [input.sessionNumber]
 * @param {number}  [input.totalSessions]
 * @param {string}  [input.priorSessionsSummary]
 * @param {boolean} [input.includeELL]
 * @returns {{ system: string, user: string }}
 */
export function buildCteLessonPrompt({
  pathway = "hospitality",
  tier = "ms",
  level = "",
  topic = "",
  materials = [],
  classSize = 25,
  durationMinutes = 90,
  targetCompetency = "",
  state = "",
  sessionNumber = 0,
  totalSessions = 0,
  priorSessionsSummary = "",
  includeELL = false,
}) {
  const stateName = resolveStateName(state)
  const pathwayLabel = PATHWAY_LABELS[pathway] ?? "Career & Technical Education"
  const effectiveLevel = tier === "hs" ? (level || "introductory") : ""
  const tierLabel = tierLevelLabel(tier, effectiveLevel)
  const gradeContext = tierGradeContext(tier, effectiveLevel)
  const competencyGuidance = getCteCompetencyGuidance(pathway, tier, effectiveLevel, stateName)
  const credentialFocus = getCredentialFocus(pathway)
  const phases = getPhaseDescriptions(pathway)
  const sequence = getPathwaySequence(pathway)
  const wblGuidance = getWblGuidance(pathway)

  const isMultiStage = sessionNumber > 0
  const stageLabel = isMultiStage ? `Stage ${sessionNumber} of ${totalSessions}` : ""

  const sequenceForPrompt = sequence
    .map((s) => `- ${s.level === "introductory" ? "Introductory" : s.level === "concentrator" ? "Concentrator" : "Completer"}: ${s.course} — ${s.description}`)
    .join("\n")

  const currentLevelName =
    tier === "ms"
      ? "Middle School Exploratory (precedes the High School pathway sequence below)"
      : effectiveLevel === "introductory"
        ? "Introductory"
        : effectiveLevel === "concentrator"
          ? "Concentrator"
          : "Completer"

  const system = `You are an experienced Career & Technical Education (CTE) instructor and industry professional writing a ${pathwayLabel} lesson plan for a CTE teacher in ${stateName}. You understand how real CTE classrooms work: industry-aligned skills, hands-on labs and simulations, career awareness, competency-based instruction, industry credentials, and work-based learning. You write like someone who has worked in the ${pathwayLabel} industry, not just taught it.

Pathway: ${pathwayLabel}
Course tier/level: ${tierLabel} (${gradeContext})
Class size: ${classSize}
Duration: ${durationMinutes} minutes

Calibrate rigor, vocabulary, and independence to the tier/level above. Middle School Exploratory = broad career awareness, high engagement, hands-on rotation, low technical prerequisite. High School Introductory = foundational skills. Concentrator = deeper technical skill and credential preparation. Completer = capstone-level mastery, industry-credential attainment, and work-based learning.

Lesson structure — 5 required phases:

1. ${phases.warm_up.name} (warm_up field): ${phases.warm_up.desc}

2. ${phases.whole_group_instruction.name} (whole_group_instruction field): ${phases.whole_group_instruction.desc}

3. ${phases.fitness_activities.name} (fitness_activities field): ${phases.fitness_activities.desc}

4. ${phases.independent_practice.name} (independent_practice field): ${phases.independent_practice.desc}

5. ${phases.closure.name} (closure field): ${phases.closure.desc}

Teacher Prep (teacher_prep field): Everything the teacher must do BEFORE students arrive. Be specific: what industry materials/props to set up, what simulation stations to arrange, what handouts/rubrics to copy, what technology or equipment to test, what industry examples to queue. Write as a practical pre-class checklist.

Competencies: ${competencyGuidance}

WORK-BASED LEARNING (work_based_learning field): CTE lessons connect to the workplace. Provide realistic, pathway- and tier-appropriate work-based learning ideas tied to THIS lesson's content:
- internships: 2–3 internship or practicum ideas relevant to this pathway and this lesson's skill (scale to tier — MS = short job-exploration visits; Completer = semester-long placements).
- guest_speakers: 2–3 specific types of industry guest speakers plus 2–3 questions students should ask each.
- job_shadows: 2–3 concrete job-shadow suggestions naming the role and what students should observe.${wblGuidance}

CAREER PATHWAY CONTEXT (career_pathway_context field): Show teachers where this lesson sits in the course sequence. The pathway course sequence is:
${sequenceForPrompt}
This lesson is in the ${currentLevelName} course. Populate career_pathway_context.sequence with one object per level ({ level, course, description, is_current }) marking the current course, and career_pathway_context.note with one sentence on what students who complete this pathway are prepared to do next (next course, credential, postsecondary, or entry-level role).

LENGTH DISCIPLINE — IMPORTANT: Producing a COMPLETE lesson (every field present, JSON closed) matters more than exhaustive detail in any one field. Be specific and practical, but concise — do not pad or repeat content across fields. Aim for each of the five phase fields to be one to two focused paragraphs (roughly 120–180 words each), teacher_prep to be a tight numbered checklist, and list fields to hold the counts requested (no more). A response that runs long and gets cut off before the closing brace is a FAILED response — keep the entire lesson within budget.

You must return ONLY a single JSON object — no markdown fences, no commentary, no preamble — matching this exact schema:

{
  "title": string,
  "subject": "CTE",
  "pathway": "${pathway}",
  "pathway_label": "${pathwayLabel}",
  "tier": "${tier}",
  "level": "${effectiveLevel}",
  "tier_label": "${tierLabel}",
  "unit": string,
  "duration_minutes": number,
  "class_size": number,
  "stage_label": string,
  "competencies": [{ "framework": string, "code": string, "text": string }],
  "credential_focus": string[],
  "learning_target": string,
  "success_criteria": string[],
  "skill_focus": string[],
  "assessment_type": "formative" | "summative" | "self-assessment",
  "teacher_prep": string,
  "equipment_needed": string[],
  "equipment_alternatives": string[],
  "tools_and_platforms": string[],
  "location": string,
  "setup_diagram": string,
  "warm_up": string,
  "whole_group_instruction": string,
  "fitness_activities": string,
  "independent_practice": string,
  "closure": string,
  "modifications": string,
  "known_vocabulary": string[],
  "new_vocabulary": string[],
  "safety_notes": string[],
  "work_based_learning": {
    "internships": string[],
    "guest_speakers": string[],
    "job_shadows": string[]
  },
  "career_pathway_context": {
    "sequence": [{ "level": string, "course": string, "description": string, "is_current": boolean }],
    "note": string
  },
  "suggested_video_searches": string[]
}

Field notes:
- title: specific and industry-flavored (e.g., "Service Recovery: Turning a Guest Complaint Into Loyalty", "Compare the Offer: Analyzing Two Credit-Card Agreements", "Build the Pitch: Positioning a New Energy Drink for Gen Z")
- subject: always exactly "CTE"
- pathway: always exactly "${pathway}"
- tier: always exactly "${tier}"; level: always exactly "${effectiveLevel}"
- unit: the broader CTE unit this lesson belongs to (e.g., "Guest Service & Front Office", "Credit & Borrowing", "The Marketing Mix")
- stage_label: ${isMultiStage ? `"${stageLabel}" — required exactly as shown` : `"" (empty string — standalone lesson)`}
- competencies: framework field must match the framework name exactly ("VA CTE" / "State CTE", "ServSafe", "AHLEI", "Jump$tart", "CEE", "FBLA", "DECA", "NBEA Marketing", "AAFCS", "Pre-PAC", "FCCLA", "NCHSE", "NHA", "CPR/First Aid", "HOSA"). If unsure of a code, leave code as "" and describe the competency in text.
- credential_focus: the industry-recognized credentials this pathway prepares students toward. Suggested for ${pathwayLabel}: ${credentialFocus.join("; ")}. Adjust to the lesson.
- learning_target: a single "Today I will…" statement for this tier/level (NOT keyed by grade).
- success_criteria: exactly 3 "I can…" statements for this tier/level.
- skill_focus: 2–4 specific, industry-relevant, employable skills (e.g., "Guest service recovery", "Reading an APR disclosure", "Target-market segmentation").
- modifications: a single paragraph of differentiation — both scaffolds for students who need support and extensions/challenge for advanced students. (NOT keyed by grade.)
- equipment_needed: specific with quantities (e.g., "Place-setting kits — 1 per pair", "Laptops with spreadsheet software — 1 per student", "Sample product packaging — 6 assorted").
- equipment_alternatives: lower-cost or lower-tech substitutes that still meet the objective.
- tools_and_platforms: 2–4 named industry or classroom tools with their role (e.g., "Google Sheets — loan-comparison calculator", "Canva — mock promotional flyer", "ServSafe practice portal").
- location: how the CTE lab / classroom should be arranged for this lesson.
- safety_notes: real considerations (kitchen/lab safety, equipment, food handling). Leave [] only if genuinely none.
- suggested_video_searches: exactly 2–3 specific queries a teacher can paste into YouTube (e.g., "hotel front desk check-in procedure training", "how compound interest works explained", "DECA role play marketing example").
- known_vocabulary: industry terms students should already know; new_vocabulary: industry terms taught this lesson.${isMultiStage ? `

MULTI-STAGE PROJECT CONTEXT — ${stageLabel} in the project "${topic || "(see topic below)"}":
${sessionNumber === 1
  ? `This is Stage 1. Introduce the foundational concept or skill. Establish key industry vocabulary. The ${phases.independent_practice.name} work must produce something students build on in Stage 2. End closure with a specific preview of the next session.`
  : priorSessionsSummary
    ? `Prior stages in this project:\n\n${priorSessionsSummary}`
    : `This is Stage ${sessionNumber}.`
}

CRITICAL requirements for this stage:
- "title" MUST follow: "${topic || "Project Name"} — ${stageLabel}"
- "unit" MUST be exactly: "${topic || "Project Name"}"
- "subject" MUST be: "CTE"; "pathway" MUST be: "${pathway}"; "stage_label" MUST be: "${stageLabel}"${sessionNumber > 1 ? `
- Do NOT re-introduce concepts already covered in prior stages
- The ${phases.warm_up.name} phase MUST reference what students did in the prior stage` : ""}${sessionNumber === totalSessions && totalSessions > 1 ? `
- FINAL stage: closure brings the project to a conclusion (presentation, industry-style review, credential check — not a preview)` : sessionNumber > 0 && sessionNumber < totalSessions ? `
- Closure must preview specifically what students do in Stage ${sessionNumber + 1}` : ""}` : ""}${includeELL ? `\n\nELL ACCOMMODATIONS: This lesson includes English Language Learners. In addition to all fields above, add an "ell_accommodations" object to the JSON with:
- language_objectives: 2–3 strings, format "Students will [language skill] in order to [content purpose]"
- tiered_vocabulary: { tier_1: [...], tier_2: [...], tier_3: [...] } — tier_3 = pathway-specific industry vocabulary
- sentence_frames: 4–6 strings labeled with this lesson's CTE context (e.g., "When greeting a guest: 'Welcome to ___, how may I ___?'")
- visual_supports: 4–6 concrete suggestions tied to this lesson's actual tasks and industry materials
- simplified_instructions: single string — 2–3 short sentences describing the core task at a lower reading level, no idioms` : ""}`

  const user = `Generate a complete ${pathwayLabel} CTE lesson${isMultiStage ? ` project stage (${stageLabel})` : ""} with these parameters:

- Pathway: ${pathwayLabel}
- Course tier/level: ${tierLabel} (${gradeContext})
- ${isMultiStage ? `Project name: ${topic || `(choose an appropriate ${pathwayLabel} project for this tier/level)`}` : `Lesson topic / focus: ${topic || `(choose an appropriate ${pathwayLabel} lesson for this tier/level)`}`}
- Materials / equipment available: ${materials.filter(Boolean).join(", ") || "standard CTE classroom/lab supplies for this pathway"}
- Class size: ${classSize}
- Duration: ${durationMinutes} minutes${targetCompetency ? `\n- Target competency / task: ${targetCompetency} — build the lesson specifically around this; ensure it appears in the competencies array` : ""}

Return the JSON object now.`

  const schema = buildCteLessonSchema(includeELL)

  return { system, user, schema }
}
