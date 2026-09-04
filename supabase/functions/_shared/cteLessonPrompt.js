import { resolveStateName } from "./stateNames.js"
import { coreActivityDirective } from "./coreActivityDirective.js"
// NOTE: Tier 1 UDL/EF supports (udlEfDirective) are intentionally NOT wired into CTE.
// CTE runs on Haiku with a structured-output schema that already sits at Anthropic's
// compiled-grammar size limit — adding the tier1_udl_ef field overflows it (400
// "compiled grammar is too large"), and the schema-less fallback produces invalid
// JSON at this size. This is the same constraint that keeps ELL disabled for CTE.

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
  career_readiness: "Career Readiness",
  information_technology: "Information Technology",
  transportation: "Transportation, Distribution & Logistics",
  manufacturing: "Manufacturing",
  engineering_tech: "STEM / Engineering & Technology",
  business_mgmt: "Business Management & Administration",
  agriculture: "Agriculture, Food & Natural Resources",
  construction: "Architecture & Construction",
  arts_av: "Arts, A/V Technology & Communications",
  government: "Government & Public Administration",
  law_safety: "Law, Public Safety, Corrections & Security",
  cosmetology: "Cosmetology / Personal Care Services",
  business_law: "Business Law",
  sports_entertainment: "Sports & Entertainment Marketing",
  exercise_science: "Exercise Science / Sports Medicine",
  early_childhood: "Early Childhood Education & Services",
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
    hospitality: `Industry frameworks for Hospitality & Tourism — this cluster spans FOODSERVICE / CULINARY and LODGING / travel / tourism; lead with the entries below that fit the lesson.
- ProStart (National Restaurant Association Educational Foundation, NRAEF) — the dominant NATIONAL culinary & restaurant-management program for high schools, delivered through the "Foundations of Restaurant Management and Culinary Arts" (FRMCA) curriculum. It is the PRIMARY anchor for CULINARY-ARTS and foodservice-management content, and it deliberately blends BOTH culinary TECHNIQUE and restaurant/foodservice MANAGEMENT — represent BOTH dimensions, never technique alone. Framework field: "ProStart". Align culinary and restaurant-management competencies to the FRMCA content; describe the unit/competency clearly.
- ServSafe (National Restaurant Association) — food safety & sanitation competencies. KEEP this in place for any food-handling content — it COEXISTS with ProStart technique/management content, it does not replace it. Framework field: "ServSafe".
- AHLEI (American Hotel & Lodging Educational Institute) — lodging, front-desk, and guest-service competencies. Framework field: "AHLEI". Especially relevant for lodging, tourism, and guest-service content.

CULINARY CONTENT — a FIRST-CLASS, deep area of this pathway (when the lesson is culinary / foodservice, teach real culinary-arts depth, not just sanitation). Prioritize BOTH technique AND management, per ProStart: (1) Culinary techniques — knife skills (proper grip and the classic cuts: julienne, dice, brunoise, chiffonade), mise en place, and the basic COOKING METHODS — DRY heat (roast, bake, sauté, pan-fry, deep-fry, grill/broil), MOIST heat (poach, simmer, boil, steam), and COMBINATION methods (braise, stew) — plus foundational recipe execution and standardized recipes; (2) Kitchen organization & the brigade system — the professional kitchen hierarchy (the classical brigade de cuisine — executive chef, sous chef, chef de partie/station cooks, etc.), stations and workflow, and industry history/context (Escoffier); (3) Restaurant & foodservice MANAGEMENT — menu planning and menu types, food- and labor-cost management (food-cost %, portion control, yield), customer service and front-of-house/back-of-house coordination, and foodservice operations (the management half of ProStart — represent it alongside technique, not instead of it); and (4) Baking & pastry basics — foundational baking as a DISTINCT skill area from savory cooking (the science of baking, measuring by weight, basic doughs and batters, yeast vs. chemical leavening). Weave ServSafe food-safety / sanitation through everything as the safety layer, and frame any hands-on cooking, knife, or heat work as done only under proper supervision following food-safety and kitchen-safety practices.`,
    finance: `Secondary frameworks for Finance — include entries from these where the lesson content maps to them:
- Jump$tart Coalition National Standards for Personal Financial Literacy. Framework field: "Jump$tart".
- Council for Economic Education (CEE) National Standards for Economics / Financial Literacy. Framework field: "CEE".
- FBLA (Future Business Leaders of America) competitive event guidelines — align applied tasks to relevant FBLA events (e.g., Personal Finance, Banking & Financial Systems, Accounting). Framework field: "FBLA".

INSURANCE OPERATIONS CONTENT — a distinct content area within this pathway (when the lesson is about insurance or risk management, teach it as a real financial-services domain, not just personal budgeting). Cover: (1) how the insurance industry works — the basic mechanism of pooling and sharing risk, and the core vocabulary (premium, deductible, coverage limit, claim, policyholder, beneficiary), plus the role insurance plays in protecting personal and business finances; (2) major policy types — LIFE (term vs. whole, at an introductory level), HEALTH, and PROPERTY & CASUALTY (auto, homeowners/renters, liability), plus disability basics, and what each protects against; (3) risk-management concepts — identifying risk and the four basic responses (avoid, reduce, retain, transfer), with insurance as the primary risk-TRANSFER tool; (4) regulation & licensing awareness — that insurance is primarily STATE-regulated and that agents/producers must be licensed (awareness only, not exam prep); and (5) insurance career paths — agent/producer, underwriter, claims adjuster, actuary (introductory), and customer-service/operations roles. Anchor applied tasks to Jump$tart/CEE risk-management standards and relevant FBLA events (e.g., Insurance & Risk Management, Personal Finance) where they genuinely map; where no precise named standard applies, frame it as general business-education / financial-literacy best practice. Keep it conceptual and educational — never a recommendation to buy a specific policy or product.`,
    marketing: `Secondary frameworks for Marketing — include entries from these where the lesson content maps to them:
- DECA competitive event guidelines — align applied tasks to relevant DECA events and the DECA performance indicators (e.g., Principles of Marketing, Marketing Communications, Professional Selling). Framework field: "DECA".
- National Standards for Business Education (NBEA), Marketing strand. Framework field: "NBEA Marketing".
- FCCLA (Family, Career and Community Leaders of America) — a national CTSO whose STAR Events include fashion and entrepreneurship/marketing competitions; for FASHION MARKETING content specifically, align applied tasks and projects to relevant FCCLA STAR Events where they map (e.g., Entrepreneurship, Fashion). Framework field: "FCCLA".

FASHION MARKETING CONTENT — a distinct content area within this pathway: the BUSINESS and PROMOTIONAL side of the fashion industry (marketing, merchandising, retail, promotion, and careers). Keep it clearly DISTINCT from Fashion DESIGN / textiles & apparel CONSTRUCTION (the technique/construction side — garment design principles, patternmaking, sewing and garment construction, and textiles science — which belongs to the DESIGN side of the program in Arts, A/V Technology & Communications / FCS, NOT here): teach the MARKETING of fashion, never how to make a garment. Cover four areas: (1) FASHION INDUSTRY FUNDAMENTALS — the FASHION CYCLE (introduction → rise → peak → decline → obsolescence) and how trends are adopted, plus the key components of the industry (designers and brands; the major FASHION CAPITALS — New York, Paris, Milan, London — and FASHION WEEK; and the flow from designer/manufacturer to retailer to consumer); (2) RETAIL & MERCHANDISE — retail merchandise categories and classifications, and BUYING and MERCHANDISING concepts applied to fashion (the buyer's role, assortment planning, markup/markdown and pricing, inventory and the selling season, and the six-month/merchandise plan at a concept level); (3) FASHION PROMOTION & ADVERTISING — advertising methods for fashion, SOCIAL-MEDIA promotion specific to fashion (influencers, lookbooks, brand campaigns, user-generated content), fashion PR and events, and VISUAL MERCHANDISING (window and in-store display, mannequins, store layout, and the shopping experience as a promotional tool); and (4) FASHION MARKETING CAREERS — career exploration specific to fashion marketing/merchandising roles (fashion buyer, visual merchandiser, fashion marketer / brand or social-media manager, retail/store manager, fashion PR and event planner, and market/trend analyst). Anchor competencies to DECA (its fashion-specific events — e.g., the Apparel & Accessories Marketing Series and Fashion/Buying & Merchandising events — and the DECA marketing performance indicators), NBEA Marketing, and FCCLA STAR Events where they map. Keep the pathway identity on MARKETING — the marketing mix (product / price / place / promotion) applied to fashion — never garment design or construction.`,
    human_services: `Primary national framework for Human Services / Family & Consumer Sciences — lead the competency list with entries from this, and treat the state CTE task list above as the state verification layer for it:
- National Standards for Family and Consumer Sciences Education (AAFCS) — the primary content framework for this pathway (Comprehensive Standards and their Content Standards / Competencies across areas such as Consumer & Family Resources, Nutrition & Wellness, Human Development, Interpersonal Relationships, Career/Community/Family Connections, Housing & Interior Design, and Textiles, Fashion & Apparel). Framework field: "AAFCS". Use the "X.Y.Z" comprehensive/competency numbering only when confident; otherwise describe the competency and omit the code.
Then include entries from these where the lesson content maps to them:
- AAFCS Pre-PAC (Pre-Professional Assessment and Certification) — the industry-credential assessments this pathway builds toward (e.g., Leadership Essentials, Nutrition/Food/Wellness Consultant, Food Science Fundamentals, Culinary Arts, and Fashion, Textiles & Apparel). Framework field: "Pre-PAC". Especially relevant for nutrition, food, wellness, leadership, and fashion/textiles content.
- FCCLA (Family, Career and Community Leaders of America) — the pathway CTSO (national, parallel to DECA/FBLA). Align applied tasks and projects to relevant FCCLA competitive events and national programs — STAR Events (including the FASHION events: Fashion Design, Fashion Construction, and Repurpose and Redesign) and Skill Demonstration Events (including the Fashion Sketch Skill Demonstration), plus national programs like Families First and Career Connection. Framework field: "FCCLA".
Content areas to prioritize: Family & Consumer Sciences core plus Independent Living / Workplace Readiness — these map to the Virginia FCS-Development and "Career, Community and Family Connections" courses.

FASHION DESIGN & TEXTILES CONTENT — a distinct content area within this pathway (AAFCS Textiles, Fashion & Apparel), teaching the DESIGN, TECHNIQUE, and CONSTRUCTION side of fashion. It is the counterpart to — and deliberately does NOT duplicate — the FASHION MARKETING content in the Marketing pathway (which covers the BUSINESS / PROMOTIONAL side: retail, merchandising, buying, promotion, and marketing careers). Here the focus is on TEXTILES, MAKING, and DESIGN; where the two meet at the industry level, keep THIS side on design/product and leave retail / merchandising / promotion to Marketing. Cover four areas: (1) TEXTILES & FIBERS — NATURAL fibers (cotton, wool, silk, linen) vs. SYNTHETIC / manufactured fibers (polyester, nylon, rayon, acrylic), their characteristics and care/performance (absorbency, durability, wrinkle resistance, warmth, etc.), and FABRIC CONSTRUCTION — WOVEN vs. KNIT (plus non-wovens), basic weave/knit structure, and how fiber + construction together determine a fabric's best use; (2) GARMENT CONSTRUCTION — basic construction techniques and tools (accurate measuring, cutting, seams, hems, fasteners, pressing, and the SAFE use of a sewing machine, shears / rotary cutter, pins/needles, and iron) and PATTERN concepts (reading a commercial pattern, pattern symbols/markings, grainline, ease, and basic fit) — hands-on making at an introductory, SUPERVISED level, with tool/equipment safety always addressed; (3) DESIGN ELEMENTS & PRINCIPLES applied to fashion — the ELEMENTS (line, color, texture, shape/silhouette, space) and PRINCIPLES (balance, proportion, emphasis, rhythm, unity) as they apply to garments and the figure, color theory for apparel, and fashion illustration/sketching (the croquis) as a design-communication tool; and (4) FASHION INDUSTRY CONTEXT — a brief HISTORY of fashion and how styles and silhouettes evolve over time, and SUSTAINABILITY in textiles and apparel (fast fashion vs. slow fashion, textile waste, and recycling / upcycling / repurpose-and-redesign) — COMPLEMENTING, not repeating, the Marketing pathway's fashion-industry business framing. Anchor competencies to AAFCS (Textiles, Fashion & Apparel), Pre-PAC (Fashion, Textiles & Apparel) where offered, and FCCLA — the PRIMARY CTSO here — via its Fashion STAR Events (Fashion Design, Fashion Construction, Repurpose and Redesign) and the Fashion Sketch Skill Demonstration. Keep this side's identity on DESIGN, TEXTILES, and CONSTRUCTION — never the retail / merchandising / promotion business content (that is the Marketing pathway's Fashion Marketing area).

COUNSELING & MENTAL HEALTH CONTENT — a CAREER-EXPLORATION content area within this pathway (the Human Services cluster's "Counseling & Mental Health Services" pathway; real high-school courses exist under this name). CRITICAL FRAMING — READ CAREFULLY AND FOLLOW EXACTLY: this is CAREER-EXPLORATION and ACADEMIC content for HIGH-SCHOOL students who are interested in counseling / psychology / mental-health / social-work CAREERS. Every lesson is about "learning ABOUT this field as a possible future career" — it is NOT therapy, NOT clinical or counseling training, and it must NEVER teach, model, or role-play how to counsel, assess, diagnose, treat, or intervene with a real person. You must NOT include: counseling or therapeutic TECHNIQUES presented as usable skills; crisis-intervention, de-escalation, or "how to help a friend/someone in crisis" steps; SUICIDE or SELF-HARM content, methods, specifics, or warning-sign checklists framed for real-world use; self-diagnosis or diagnosing-others activities; or anything a student could apply to themselves or another person. Keep every mental-health topic ACADEMIC, textbook/clinical, and CAREER-focused — never personal, never actionable, never a self-help or peer-counseling how-to. This is DISTINCT from the separate School Counselors module (which serves PRACTICING counselors delivering guidance to students); this content is for STUDENTS exploring the field. STANDARDS: anchor to the Human Services cluster — Counseling & Mental Health Services pathway (align to the state CTE course/task list above and to CCTC Human Services performance elements where they map). Mention CACREP (Council for Accreditation of Counseling and Related Educational Programs) ONLY as context — the GRADUATE-level accreditation a student might eventually encounter after college/graduate school — NEVER as a standard for this high-school course. Cover four areas, all strictly in the career-exploration frame: (1) CAREER AWARENESS — the range of roles in counseling / mental-health / social-work (school counselor, clinical or mental-health counselor, psychologist, clinical social worker, marriage & family therapist, substance-abuse/addiction counselor, psychiatrist [a physician], and related helping roles), what each does and where they work, and the EDUCATIONAL PATHWAYS and licensure each requires (typically a bachelor's, then a master's or doctorate, then supervised hours and state licensure) — to help a student explore whether the path fits them; (2) FOUNDATIONS OF PSYCHOLOGY & THE BRAIN — a basic, TEXTBOOK / intro-psychology survey of how the brain and nervous system relate to behavior and mental health (neurons and neurotransmitters at a survey level, major brain regions, the nervous system, and how psychology studies behavior scientifically) — purely EDUCATIONAL/academic, never diagnostic and never applied to a real person; (3) ETHICS & CONFIDENTIALITY — the PROFESSIONAL ethics principles of the counseling fields, discussed as "how the profession works": that professional codes of ethics exist and why, why CONFIDENTIALITY and informed consent matter, professional boundaries, and the concept of mandated reporting — all as career-awareness ABOUT the profession using hypothetical/illustrative professional examples, NOT real client scenarios and NOT how to handle a real disclosure; and (4) MENTAL HEALTH LITERACY — general, TEXTBOOK-level education about common mental-health topics (what stress is, what anxiety is, general well-being, and reducing stigma) framed as building EMPATHY and UNDERSTANDING for a future helping career — explicitly NOT self-diagnosis, NOT diagnosing others, and NOT peer-counseling or treatment training. ADDITIONAL BOUNDARIES (apply strictly): discuss coping strategies and wellness ONLY as general awareness of what people do or what trained professionals help with — NEVER as techniques students practice, rehearse, or are told to use on themselves or peers (do NOT run "try this breathing/relaxation exercise" or similar do-it-now activities). For WORK-BASED LEARNING, keep every suggestion OBSERVATIONAL, awareness-level, and NON-CRISIS. Do NOT name, reference, or suggest crisis lines, crisis hotlines, "crisis" anything, peer-counseling or peer-support programs / coordinators, or ANY crisis-adjacent setting — not even as administrative, intake, or observational shadowing. Use ONLY genuinely safe placements, such as: shadowing or interviewing a school counselor in the counseling OFFICE during routine / non-crisis hours; general mental-health ADVOCACY, anti-stigma, or awareness organizations and campaigns; career fairs, guest speakers, and informational interviews with counseling / psychology / social-work professionals; and career research. Never suggest a placement that could put a student in contact with people in real distress. MANDATORY SAFEGUARD — the FIRST item in the safety_notes array MUST be this boundary statement, VERBATIM: "This lesson is career-exploration and academic content about the counseling and mental-health field — it is NOT therapy, NOT clinical training, and NOT instruction in how to counsel, assess, or treat anyone. It does not provide counseling techniques, crisis intervention, or mental-health guidance to use on yourself or others. If you or someone you know is struggling, talk with a trusted adult, your school counselor, or a licensed professional — or in the U.S. call or text 988, the Suicide & Crisis Lifeline. Follow your school's and district's policies." Keep the ENTIRE content area on ACADEMIC understanding and CAREER exploration of the field — never a how-to for helping real people.`,
    health_science: `Primary national framework for Health Science — lead the competency list with entries from this, and treat the state CTE task list above as the state verification layer for it:
- National Health Science Standards (NCHSE — National Consortium for Health Science Education) — the primary content framework for this pathway (foundation standards such as Academic Foundation / anatomy & physiology, Communications, Systems, Employability Skills, Legal Responsibilities, Ethics, Safety Practices, Teamwork, Health Maintenance Practices, Technical Skills, and Information Technology). Framework field: "NCHSE". Use the NCHSE standard / accountability-criterion numbering only when confident; otherwise describe the competency and omit the code.
Then include entries from these where the lesson content maps to them:
- NHA (National Healthcareer Association) — the industry-credential assessments this pathway builds toward (e.g., CCMA Certified Clinical Medical Assistant, CPT Certified Phlebotomy Technician, CET EKG Technician, CBCS Billing & Coding). Framework field: "NHA". Especially relevant for clinical, patient-care, and diagnostic content.
- DANB (Dental Assisting National Board) — the recognized NATIONAL certification body for DENTAL ASSISTING (the dental analog to NHA — anchor dental lessons to DANB, not NHA). Its flagship credential is the CDA (Certified Dental Assistant), earned through three component exams: General Chairside Assisting (GC), Radiation Health and Safety (RHS), and Infection Control (ICE); DANB also offers the NELDA (National Entry Level Dental Assistant), specifically designed to be attainable through high-school dental-assisting coursework (at least a semester of curriculum). Framework field: "DANB". Use for dental anatomy, chairside/procedures, dental radiography, and dental infection-control content.
- NNAAP (National Nurse Aide Assessment Program, administered by Credentia) — the recognized NATIONAL certification for NURSE AIDES / Certified Nursing Assistants (CNAs), used by most states for the state Nurse Aide Registry (the nurse-aide analog to how NHA serves medical assisting and DANB serves dental assisting — anchor CNA / nurse-aide lessons to NNAAP + NCHSE, NOT to NHA, and treat CNA as DISTINCT from Medical Assisting). The exam has TWO components: a WRITTEN (or oral) knowledge test AND a hands-on SKILLS-DEMONSTRATION evaluation (the candidate performs randomly selected nurse-aide skills — e.g., handwashing, measuring vital signs, positioning/transferring, ADL assistance — on a live person under an evaluator). Federal law (OBRA '87) requires nurse-aide training plus a competency evaluation for employment in Medicare/Medicaid nursing facilities. Framework field: "NNAAP". Use for nurse-aide / patient-care / ADL / geriatric-care content.
- CPR / First Aid (AHA or American Red Cross) — a common entry-level credential; align safety and medical-emergency content to it. Framework field: "CPR/First Aid".
- HOSA — Future Health Professionals — the pathway CTSO (national, parallel to DECA / FBLA / FCCLA). Align applied tasks and projects to relevant HOSA competitive events and programs. Framework field: "HOSA".
Content areas to prioritize: the Health Science I: Careers and Body Systems foundation — anatomy & physiology by body system, healthcare / medical terminology, common pathologies, diagnostic and clinical procedures, therapeutic interventions, and medical-emergency care fundamentals.

DENTAL CONTENT — a distinct clinical content area within this pathway (dental assisting is a major Health Science program of study, parallel to Medical Assisting; when the lesson is dental, teach real dental depth anchored to DANB/CDA, not generic health science). Cover across four areas: (1) DENTAL ANATOMY & PHYSIOLOGY — oral-cavity structures, tooth anatomy (enamel, dentin, pulp, cementum) and tooth types/functions, a tooth-NUMBERING system (the Universal Numbering System for permanent and primary teeth; note Palmer and FDI systems also exist), and basic oral-pathology AWARENESS (dental caries, gingivitis / periodontal disease) at an introductory level; (2) DENTAL EQUIPMENT & PROCEDURES — chairside-assisting basics, common dental instruments and their uses (mouth mirror, explorer, periodontal probe, scalers, handpieces), basic tray setups, and FOUR-HANDED DENTISTRY concepts (operator/assistant coordination, instrument transfer, and oral evacuation/isolation) — awareness and readiness, not licensed practice; (3) DENTAL RADIOGRAPHY & RADIATION SAFETY — the purpose of dental radiographs and radiation-PROTECTION principles at an AWARENESS level (ALARA — As Low As Reasonably Achievable; lead apron and thyroid collar; distance and shielding; operator monitoring/dosimetry) — actual X-ray exposure/operation requires certified training and meeting state dental-radiography requirements, so keep this conceptual (maps to the CDA's Radiation Health & Safety / RHS exam); and (4) DENTAL INFECTION CONTROL — sterilization and disinfection specific to the dental operatory (instrument sterilization/autoclaving, surface disinfection and barriers, single-use items), bloodborne-pathogen and standard/universal precautions, and PPE for dental work (gloves, mask, protective eyewear, gown) — maps to the CDA's Infection Control / ICE exam and CDC dental infection-control guidelines. Anchor competencies to DANB (the CDA components GC/RHS/ICE, and NELDA as the HS-accessible entry credential), NCHSE foundation standards, and HOSA where events map. Keep everything AWARENESS/readiness-level — classroom and simulation preparation toward a credential, never a substitute for supervised clinical training or licensure.

CNA / NURSE AIDE CONTENT — a distinct clinical content area within this pathway (nurse-aide / Certified Nursing Assistant training is a major Health Science program of study, parallel to but DISTINCT from Medical Assisting; when the lesson is nurse-aide / CNA, teach real nurse-aide depth anchored to NNAAP + NCHSE and its patient-care skills — not generic health science, and not the medical-assisting skill set). REAL-CLINICAL CAVEAT — read carefully and honor it: a nurse-aide course typically includes SUPERVISED CLINICAL HOURS with ACTUAL PATIENTS in a real healthcare setting (bathing, toileting, dressing, repositioning, feeding). A generated lesson plans the CLASSROOM / LAB, AWARENESS/readiness portion ONLY — the hands-on personal-care and direct patient-contact skills MUST be learned through certified, supervised clinical placement and can NEVER be substituted by a lesson plan; say so wherever a personal-care skill appears, and keep classroom practice to manikins/simulation and peers ONLY where school policy allows, under supervision. Cover across four areas: (1) PATIENT CARE FUNDAMENTALS — assisting with Activities of Daily Living (ADLs: bathing, dressing, grooming, toileting, eating/feeding, mobility), positioning and safe transferring/repositioning (bed positions such as Fowler's / supine / lateral, gait/transfer belt, mechanical/Hoyer-lift AWARENESS), and personal-care tasks — taught at a CONCEPTUAL/awareness level, with the actual skill reserved for supervised clinical; (2) VITAL SIGNS & BASIC CLINICAL SKILLS — measuring and recording temperature, pulse, respirations, and blood pressure (TPR + BP), plus height/weight and intake & output (I&O), point-of-care basics, accurate measurement and documentation, and reporting abnormal findings to the licensed nurse (recognize-and-report, within the aide's scope); (3) GERIATRIC CARE — the elderly / long-term-care population most CNAs serve: normal aging changes, common conditions (dementia / Alzheimer's care approaches, mobility and FALL risk, skin integrity / PRESSURE-INJURY prevention, hydration and nutrition), restorative care that promotes independence, and RESIDENTS' RIGHTS in long-term care; and (4) COMMUNICATION, DIGNITY & INFECTION CONTROL — therapeutic communication and rapport, PRESERVING PATIENT DIGNITY and privacy during personal/intimate care (draping, explaining before doing, offering choices, honoring preferences), confidentiality and residents' rights, and infection control specific to DIRECT PATIENT CONTACT (hand hygiene before/after every contact, standard precautions, gloves/PPE, isolation-precaution awareness, and bloodborne-pathogen protection). Anchor competencies to NNAAP (its written + skills-demonstration components), NCHSE foundation standards (especially Health Maintenance Practices, Communications, Legal Responsibilities, Ethics, and Safety Practices), CPR/First Aid where it maps, and HOSA where events map. Keep everything AWARENESS/readiness-level — classroom and simulation preparation toward the CNA credential, never a substitute for the supervised clinical training and state competency evaluation that certification requires.`,
    education: `Primary national frameworks for Education & Training (the national 16-cluster framework's Education & Training cluster; Advance CTE's 2024 refresh labels it simply "Education," but the content is the same) — lead the competency list with entries from these, and treat the state CTE task list above as the state verification layer for them:
- InTASC Model Core Teaching Standards (Interstate Teacher Assessment and Support Consortium, CCSSO) — the primary framework for what new teachers should know and be able to do (the 10 standards across The Learner and Learning, Content Knowledge, Instructional Practice, and Professional Responsibility). Framework field: "InTASC". Use the standard number (e.g., "InTASC Standard 3: Learning Environments") only when confident; otherwise describe the competency and omit the code.
- NBPTS Five Core Propositions (National Board for Professional Teaching Standards) — the vision of accomplished teaching this pathway orients toward (e.g., "Teachers are committed to students and their learning," "Teachers think systematically about their practice and learn from experience"). Framework field: "NBPTS".
- Teacher Cadet Program — its "Experiencing Education" curriculum (from CERRA, the Center for Educator Recruitment, Retention & Advancement) — the widely recognized NATIONAL program for the high-school future-educator pathway; anchor foundational/exploratory lessons, structured observation, and reflection to its structure. Framework field: "Teacher Cadet".
- CAEP (Council for the Accreditation of Educator Preparation — the merger of the former NCATE and TEAC; many programs and state rules still reference NCATE) — the national teacher-PREPARATION accreditation standards this pathway ultimately orients toward. Use CAEP, alongside ATE (Association of Teacher Educators) standards, as the teacher-preparation-standards anchor for practicum design, reflection protocols, and professional-disposition content. Framework field: "CAEP". (InTASC and NBPTS above remain the day-to-day teaching-practice anchors; CAEP/ATE are the preparation-program layer that practicum and portfolio work build toward.)
Then include entries from these where the lesson content maps to them:
- Educators Rising Standards — the standards of Educators Rising, the dedicated national CTSO for future-educator students (not a repurposed general-business club), developed in partnership with the National Education Association (NEA) and aligned to the NBPTS and InTASC frameworks. Align applied tasks, portfolios, and projects to relevant Educators Rising competitive events and programs (e.g., Lesson Planning, Children's Literature, Ethical Dilemma, Public Speaking). Framework field: "Educators Rising". (Educators Rising is national; some states run their own affiliate — e.g., Texas's TAFE, the Texas Association of Future Educators — but keep this lesson national-first and point teachers to their own state's affiliate rather than building to any one state.)
Content areas to prioritize: the Introduction to the Teaching Profession / Education & Training I foundation — lesson-planning basics, classroom-management fundamentals, an introduction to educational psychology and child/adolescent development, and early clinical/field experience (structured classroom observation and practicum in a real school setting).

EDUCATION & TRAINING CONTENT — the future-educator programs of study, taught with real depth (anchor teaching practice to InTASC/NBPTS, structure and reflection to the Teacher Cadet "Experiencing Education" curriculum, and the preparation-program layer to CAEP/ATE). Cover four content areas: (1) PRINCIPLES OF EDUCATION (the foundational introductory course) — the HISTORY and PHILOSOPHY of education (major movements, reformers, and philosophies at an introductory level — e.g., the common-school movement, progressive vs. traditional/essentialist views), how schools and education SYSTEMS function (school structure and governance, local/state/federal roles, funding basics, and the roles of the people within a school), and teaching AS A PROFESSION (careers in and around education, licensure/certification routes at an awareness level, and professional ethics and dispositions); (2) INSTRUCTIONAL PRACTICES — LESSON-PLANNING basics (measurable objectives/learning targets, the parts of a lesson, aligning activities and assessment to the objective), INSTRUCTIONAL STRATEGIES (direct instruction, effective questioning, cooperative/active learning, modeling, and checking for understanding), CLASSROOM-MANAGEMENT fundamentals (routines, procedures, clear expectations, and a positive learning climate), and DIFFERENTIATION basics (adjusting content, process, or product for varied learners) — tie each to the relevant InTASC standard; (3) HUMAN GROWTH & DEVELOPMENT — child and adolescent DEVELOPMENTAL STAGES (physical, cognitive, and social-emotional) AS THEY RELATE TO TEACHING, and foundational LEARNING THEORIES appropriate for aspiring educators (e.g., Piaget's cognitive stages, Erikson's psychosocial stages, Vygotsky's zone of proximal development and scaffolding, Maslow's hierarchy, and behaviorist vs. constructivist views) — always connected to instructional decisions and developmentally appropriate practice, never developmental psychology for its own sake; and (4) PRACTICUM — designing a structured CLASSROOM-OBSERVATION or ASSISTANT-TEACHING experience (what to observe, observation tools and field notes, and professionalism/confidentiality in a real classroom), structured REFLECTION protocols (e.g., description → analysis → application, or what/so-what/now-what), and explicitly CONNECTING the practicum experience to CAEP/InTASC standards while building the teaching PORTFOLIO — the on-ramp to the completer/capstone (student-teaching-style) placement. Keep all field-experience content OBSERVATIONAL / assistant-level and awareness-based toward certification — a high-school pathway builds toward, and is never a substitute for, a state-approved educator-preparation and licensure program.

CLASSROOM MANAGEMENT CONTENT — a DEEPER strand within Instructional Practices for FUTURE TEACHERS studying HOW a classroom is managed (theory and coursework toward certification), anchored to InTASC Standard 3 (Learning Environments) and the NBPTS Five Core Propositions (esp. Proposition 1 — commitment to students and their learning — and Proposition 4 — thinking systematically about practice). CRITICAL DISTINCTNESS: this is aspiring-educator COURSEWORK — the high-school student is LEARNING ABOUT classroom management as part of teacher preparation. It is DISTINCT from PlansK12's separate standalone Classroom Management module, which serves PRACTICING teachers building ready-to-use tools (behavior charts, ABC data sheets, CICO trackers, reflection forms, parent-communication templates) for their own real classrooms. Here the learner is the FUTURE teacher studying the field, so keep it conceptual, comparative, and reflective — students analyze, compare, and plan, and never deploy a behavior-tracking or discipline system on real children. Cover four areas: (1) FOUNDATIONS & BEHAVIOR THEORY — the PREVENTION-vs-REACTION principle (a well-run classroom is DESIGNED to prevent most misbehavior through structure, relationships, and engagement, not merely react to it), the behaviorist basics a future teacher must understand (positive vs. negative REINFORCEMENT; the difference between a CONSEQUENCE and a PUNISHMENT; logical and natural consequences; and shaping behavior over time), and an introduction to the FUNCTIONS OF BEHAVIOR (behavior is communication — common functions are to gain attention, obtain access to something, escape/avoid a task, or meet a sensory need — and why identifying the function should precede the response) — all at an awareness/coursework level; (2) NAMED MANAGEMENT MODELS & FRAMEWORKS — a COMPARATIVE survey of the major real-world approaches an aspiring teacher should recognize by name (compare their philosophies, from more preventive/relational to more directive, rather than endorsing one): PBIS (Positive Behavioral Interventions and Supports — the school-wide, tiered, teach-and-reinforce-expectations framework), RESPONSIVE CLASSROOM (community-building, Morning Meeting, interactive modeling, and logical consequences), Harry & Rosemary WONG's "The First Days of School" (PROCEDURES and ROUTINES as the foundation — the classic thesis that classroom management is about procedures, not discipline), CANTER's ASSERTIVE DISCIPLINE (clear expectations with a calm, firm, consistent teacher response), RESTORATIVE PRACTICES (repairing harm and rebuilding relationships through restorative conversations/circles rather than purely punitive discipline), and LOVE & LOGIC (shared control, empathy, and owning-the-problem consequences); (3) ESTABLISHING THE LEARNING ENVIRONMENT — the practical foundation InTASC Std 3 expects: designing and explicitly TEACHING classroom PROCEDURES and ROUTINES (entering, transitions, materials, attention/quiet signals), co-creating clear EXPECTATIONS and norms, arranging the physical space, and building a positive, culturally responsive climate and strong teacher-student relationships as the PRIMARY prevention strategy (the Wong / Responsive Classroom emphasis); and (4) RESPONDING TO MISBEHAVIOR — a CONTINUUM of positive, low-to-high-intensity responses (proximity, nonverbal cues, redirection, private reminders, re-teaching the expectation) escalated only as needed, the distinction between MINOR teacher-managed and MAJOR office-managed behaviors, and beginning awareness of when behavior signals a need for support beyond routine management (the referral / MTSS-behavior on-ramp) — always framed as what a REFLECTIVE new teacher considers and ties back to InTASC Std 3 and NBPTS. Keep everything at the aspiring-teacher COURSEWORK level (e.g., draft a set of classroom procedures, compare two named management models, script a positive response to a behavior scenario, or plan how to teach a routine) — an awareness- and analysis-level study of the field, never an operational behavior-management system to run on real students.`,
    career_readiness: `Primary national framework for Career Readiness (a Middle School Foundations pathway, typically 7th/8th grade, that students take BEFORE selecting a specific CTE pathway) — lead the competency list with entries from this, and treat the state CTE task list above as the state verification layer for it:
- Employability Skills Framework (U.S. Department of Education, Office of Career, Technical, and Adult Education — OCTAE) — the foundational framework for this pathway, organized around three broad categories: (1) Applied Knowledge — applied academic skills and critical thinking (reading/writing/math for work, problem-solving, critical thinking, decision-making, reasoning); (2) Effective Relationships — interpersonal skills and personal qualities (teamwork, communication, respect, responsibility, integrity, professionalism, initiative, adaptability); and (3) Workplace Skills — resource, information, technology, and systems management (time management, planning & organizing, following directions, using workplace technology, understanding how a workplace works). Framework field: "Employability Skills Framework". Anchor every entry to the established 2018 three-category structure and name the category. NOTE: the framework is undergoing a 2.0 modernization as of 2025 — treat the 2018 three-category structure as the stable anchor and a foundational field document; do not invent 2.0 sub-competency codes.
Then include entries from this where the lesson content maps to it:
- National Career Clusters Framework — the 16 Career Clusters (Advance CTE). Framework field: "Career Clusters". Because this is a career-EXPLORATION foundations course, career-exploration and self-assessment content should introduce students to the RANGE of career clusters broadly (all 16), not just one — use this to frame students' interests, strengths, and values against the breadth of clusters and the high-school pathways they lead to.
Content areas to prioritize (this pathway consolidates the common MS "Foundations" courses — Career Development, Exploring Careers, General Employability, and Business Communication and Technologies): (a) career exploration & self-assessment — interests, strengths, and values mapped to career clusters; (b) general employability skills — the three Employability Skills Framework categories; (c) business communication & technology basics — professional communication (email, presentations), basic workplace technology, and digital-literacy fundamentals; and (d) career-development planning — goal-setting, age-appropriate resume/application basics, and understanding pathways and next steps toward high-school CTE programs. Keep all content and rigor age-appropriate for middle school (awareness and exploration, not mastery). NOTE: several teacher requests referenced Texas TEKS-based courses by name (Career Development, Career Exploration); keep this lesson national-first and let the state CTE verification layer above cover state-specific course/standard alignment.

DIGITAL LITERACY & COMPUTER APPLICATIONS CONTENT (MIDDLE SCHOOL) — this is the ONE genuinely SKILLS-BUILDING strand within this otherwise awareness/exploration pathway: here middle-schoolers actually build real, transferable computer skills, going a level DEEPER than the K–5 Elementary Technology special (which is exposure/foundational) while staying MS-appropriate (NOT high-school/CTE certification prep or IT-professional framing). When a lesson targets this area, teach real skills across four areas: (1) KEYBOARDING PROFICIENCY — proper home-row TOUCH-TYPING technique, correct posture and hand position, building ACCURACY first and then speed (age-appropriate WPM growth goals), and using keyboarding as the foundation for all other application work — genuine practice, not just finger-awareness; (2) APPLICATION SKILLS (Microsoft Office AND/OR Google Workspace, taught TOOL-AGNOSTICALLY so the skill transfers across whichever suite the school runs) — WORD PROCESSING (formatting, headings, lists, inserting images, simple MLA-style basics), SPREADSHEETS (entering data, simple formulas like SUM/AVERAGE, sorting, a basic chart), and PRESENTATIONS (clear slides, layout, transitions, delivering to an audience) — describe the transferable SKILL, never one product's specific menus; (3) DIGITAL CITIZENSHIP AT MS DEPTH (deliberately deeper than the elementary version) — digital-FOOTPRINT and online reputation, online safety and privacy/password hygiene, recognizing and responding to CYBERBULLYING, evaluating SOURCE CREDIBILITY and information/media literacy (real vs. fake, bias), and responsible/ethical use including PLAGIARISM, citation, and copyright/fair-use basics; and (4) INTRO CODING CONCEPTS FOR MS (building ON the K–5 block-coding foundation, going deeper) — algorithms and sequences, LOOPS, CONDITIONALS (if/then/else), and the idea of VARIABLES and EVENTS, worked in block-based tools (e.g., Scratch) with an AWARENESS bridge toward text-based coding (what a line of Python/JavaScript looks like), plus decomposition and debugging as problem-solving habits. Anchor the technology/skills entries to the Employability Skills Framework "Workplace Skills" (technology) category, and cite ISTE Standards for Students and CSTA (for the coding and digital-citizenship pieces) where they map. MS-appropriate credentials only: typing/keyboarding certificates and IC3 Digital Literacy / IC3 Spark (the middle-school-level digital-literacy certification); name Microsoft Office Specialist (MOS) only as a longer-term high-school goal, never an MS target.`,
    information_technology: `Primary national frameworks for Information Technology (Web Design focus, with broader computing at the exploratory/MS level) — lead the competency list with entries from these, and treat the state CTE task list above as the state verification layer for them:
- ISTE Standards for Students (International Society for Technology in Education) — the primary PEDAGOGICAL framework for this pathway, especially Standard 4 (Innovative Designer — students use a deliberate design process to generate ideas, test theories, solve problems, and create original works) and Standard 5 (Computational Thinker — students develop and employ strategies for understanding and solving problems in ways that leverage technology, e.g., breaking a problem down, planning, testing). Both map directly to web design and technical problem-solving. Framework field: "ISTE". Name the standard (e.g., "ISTE Standard 4: Innovative Designer") when confident; otherwise describe the competency.
- CSTA K-12 Computer Science Standards (2017 revision, Computer Science Teachers Association) — the primary COMPUTER SCIENCE CONTENT framework and the anchor for the COMPUTER PROGRAMMING area, organized around 5 concept areas: (1) Computing Systems; (2) Networks & the Internet; (3) Data & Analysis; (4) Algorithms & Programming; and (5) Impacts of Computing (the ethical/societal dimension — a genuine standard area, not just technical skill). Framework field: "CSTA". Name the concept area, and use a CSTA identifier (e.g., "CSTA 3A-AP-13") only when confident; otherwise describe the concept clearly and omit the code.
Then include entries from this where the lesson content maps to it:
- CompTIA — the recognized industry-standard IT credentialing body this pathway builds toward. For CYBERSECURITY especially, present the REAL, sequential industry certification progression as an achievable student goal: CompTIA A+ (IT & hardware foundations) → Network+ (networking) → Security+ (security fundamentals; the recognized entry-level cybersecurity credential) — legitimate, industry-recognized credentials students can genuinely pursue, with IT Fundamentals+ / ITF+ as an entry on-ramp. Framework field: "CompTIA". Especially relevant for IT-foundations, computing-systems, networking, and cybersecurity content. (This body is parallel to how HOSA/NHA function for Health Science and ServSafe for Hospitality & Tourism.)
- NICE Cybersecurity Workforce Framework (National Initiative for Cybersecurity Education, NIST) — the national framework that maps cybersecurity work roles, tasks, and the knowledge/skills behind them; use it to ground cybersecurity competencies and career / work-role exploration. Framework field: "NICE".
- CSEC 2017 (Cybersecurity Curriculum Guidelines) — the foundational curriculum reference for cybersecurity education, covering technical areas (data, software, system, component, connection & network security) AND the human, organizational, and societal/ethical dimensions of security. Use it to ensure cybersecurity content includes the ETHICAL / human / organizational side, not just technical content. Framework field: "CSEC 2017".
AP COURSES — NEXT-STEP ONLY, NOT A FRAMEWORK: AP Computer Science Principles (CSP) and AP Computer Science A (CSA) are College-Board advanced COURSES a student can pursue after this pathway (real college-credit potential; widely available via free, standards-aligned curricula like Code.org and CodeHS). Reference them ONLY as next-step courses / career-and-course-pathway options a student may take next — NEVER as a standards framework the lesson aligns to, and NEVER as a source of competency labels (do NOT set any competency's framework field to "AP CSP" or "AP CSA"). All competency alignment for this pathway comes from the primary frameworks, ISTE and CSTA (with CompTIA / NICE / CSEC 2017 where the content maps).

CYBERSECURITY CONTENT — a FIRST-CLASS, dedicated area of this pathway (when the lesson is about cybersecurity, teach it with real depth, DEFENSIVELY framed). Prioritize: (1) Foundational security concepts — the CIA triad (confidentiality, integrity, availability), common threat TYPES at a conceptual level (malware, phishing / social engineering, weak or reused passwords, data breaches), and basic risk concepts (assets, vulnerabilities, threats, and safeguards/controls); (2) Network security basics — CONCEPTUALLY how networks are secured (firewalls, encryption in transit, authentication, secure vs. insecure connections), age-appropriate and at a concept level; (3) Ethical & legal dimensions — digital ethics, the laws and rights around technology and data use and privacy, responsible-disclosure concepts (report vulnerabilities through proper channels; never exploit them), and cybersecurity CAREER pathways (e.g., SOC/security analyst, security administrator, incident response); and (4) Certification-pathway awareness — the A+ → Network+ → Security+ progression as a concrete, achievable goal. CRITICAL FRAMING (see the SECURITY & ETHICS directive in this prompt): keep ALL cybersecurity content DEFENSIVE, conceptual, and career-exploration oriented — "understanding how security works and why it matters." Do NOT provide offensive hacking, exploitation, attack tooling, malware creation, or any step-by-step technique that could give real-world uplift for compromising actual systems; teach threats only at a "what it is and how to defend against it" level.

COMPUTER PROGRAMMING CONTENT — a FIRST-CLASS, dedicated area of this pathway (when the lesson is about programming/coding, teach it with real depth, LANGUAGE-AGNOSTIC and CONCEPTUAL). Prioritize: (1) Programming fundamentals — variables, control structures (loops, conditionals), functions/procedures, and basic data structures (e.g., lists/arrays), taught as CONCEPTS independent of any one language; (2) Algorithmic thinking & problem-solving — top-down design, decomposition (breaking a problem into smaller pieces), and DEBUGGING as a core, teachable skill; (3) Data & analysis — how programs process, store, and analyze data, and a basic understanding of data types and structures; and (4) Impacts of computing — the ethical and societal dimensions of computing (privacy, bias in algorithms, the digital divide, accessibility) — a genuine CSTA "Impacts of Computing" standard area, not just technical skill. Anchor to the CSTA Algorithms & Programming and Impacts of Computing concept areas. (AP CSP / AP CSA are next-step courses a student may pursue afterward — NOT a framework to align competencies to.) CRITICAL FRAMING: keep programming content CONCEPTUAL and PEDAGOGICAL — NOT tied to one specific language and NOT dependent on generating real executable code (which could contain actual syntax errors and mislead students). Build activities around programming CONCEPTS: tracing PSEUDOCODE by hand and predicting output, finding a described logic error ("this loop runs one time too many — why, and how would you fix it?"), planning an algorithm in plain steps or a flowchart, decomposing a problem, or writing pseudocode — rather than generating real code samples in a specific language. If example logic is unavoidable, present it as clearly-labeled PSEUDOCODE, never a real language's exact executable syntax.
Content areas to prioritize: (a) Web Design fundamentals — HTML/CSS basics, website structure & layout, user-experience/design principles, and responsive-design concepts; (b) Web Design tools & workflow — introduce design/development tools in an age-appropriate, TOOL-AGNOSTIC way wherever possible (specific software varies by school), and the plan → build → test → revise project workflow; (c) IT foundations, CYBERSECURITY & COMPUTER PROGRAMMING — basic computing concepts, digital literacy, and how the internet and web work, PLUS two deep, dedicated strands: cybersecurity (see the CYBERSECURITY CONTENT block above) and computer programming (programming fundamentals, algorithmic thinking & debugging, data & analysis, and impacts of computing — LANGUAGE-AGNOSTIC and conceptual; see the COMPUTER PROGRAMMING CONTENT block above), building toward AP CSP / AP CSA; at the MS Exploratory level keep both awareness-level and conceptual; and (d) career connections — IT / web-design / cybersecurity / computer-science career paths, portfolio-building concepts, and the industry certifications and advanced courses students can pursue (CompTIA A+/Network+/Security+; AP CSP / AP CSA). Keep tool references generalizable across schools rather than tied to one product.`,
    transportation: `Primary industry framework for Transportation, Distribution & Logistics — ANCHORED on the Automotive Maintenance & Light Repair (MLR) sub-area (the most common course), but keep the pathway broad enough to represent the wider cluster — lead the competency list with entries from this, and treat the state CTE task list above as the state verification layer for it:
- ASE Education Foundation Standards — Maintenance & Light Repair (MLR) — the recognized NATIONAL industry standards for automotive-technician training, organized by vehicle system (Engine Repair; Automatic Transmission/Transaxle; Manual Drivetrain & Axles; Suspension & Steering; Brakes; Electrical/Electronic Systems; Heating & Air Conditioning; Engine Performance). Framework field: "ASE MLR". Name the MLR area/task when confident (e.g., "ASE MLR — Brakes"); otherwise describe the competency clearly and omit the code. ASE is parallel to how HOSA/NHA function for Health Science and CompTIA for IT. The recognized entry credential students can pursue is the ASE Student Certification (via the ASE Education Foundation) — reference it as a credential goal, not as attained mid-lesson.
Then include entries from this where the lesson content maps to it:
- SkillsUSA — the CTSO most closely associated with this cluster (national, parallel to DECA/FBLA/HOSA/FCCLA). Align applied tasks, projects, and professionalism/employability content to relevant SkillsUSA competitive events (e.g., Automotive Service Technology, Diesel Equipment Technology) and the SkillsUSA Framework (personal, workplace, and technical skills grounded in academics). Framework field: "SkillsUSA".
Content areas to prioritize: (a) automotive systems fundamentals — engine repair basics, brakes, suspension/steering, and electrical systems, at a depth appropriate to the tier; (b) SHOP SAFETY as a first-class, non-negotiable focus — safe handling of tools/equipment, vehicle-lift and jack/jack-stand operation, and hazard awareness (treat with the same seriousness as clinical safety — see the SAFETY directive in this prompt); (c) diagnostic & service-information skills — reading service manuals / service information, systematic problem identification, and the basic diagnostic process; and (d) at the Introductory / MS Exploratory level, a brief overview of the WIDER Transportation, Distribution & Logistics cluster beyond automotive (aviation/aircraft maintenance, logistics & supply chain, warehousing/distribution, rail, transit) so the foundational framing is not automotive-only.`,
    manufacturing: `Primary industry framework for Manufacturing — lead the competency list with entries from this, and treat the state CTE task list above as the state verification layer for it:
- NIMS (National Institute for Metalworking Skills) — the recognized NATIONAL credentialing organization for manufacturing/machining skills, organized around competency areas such as Measurement, Materials & Safety; Job Planning, Benchwork & Layout; Drill Press; Turning (lathe); Milling; Grinding; and CNC. Framework field: "NIMS". Name the NIMS credential/standard area when confident (e.g., "NIMS — Measurement, Materials & Safety"); otherwise describe the competency clearly and omit the code. NIMS is parallel to how ASE functions for automotive, HOSA/NHA for Health Science, and CompTIA for IT, and NIMS credentials are the recognized entry credentials students can pursue.
Then include entries from these where the lesson content maps to them:
- SMART MANUFACTURING / INDUSTRY 4.0 — modern manufacturing content that MUST be well represented in this pathway (do not let the lesson be traditional-only): industrial automation and robotics, the Industrial Internet of Things (IIoT) and smart sensors, manufacturing data analytics, and CNC / computer-controlled machining. Frame these as the current direction of the field alongside traditional foundations. Framework field: "Smart Manufacturing / Industry 4.0" (or cite a specific credential such as SACA — Smart Automation Certification Alliance — where clearly relevant; otherwise describe the concept).
- MSSC (Manufacturing Skill Standards Council) Certified Production Technician (CPT) — a common production/technician credential; and SkillsUSA — the CTSO most associated with this cluster (align applied tasks and professionalism to relevant events, e.g., Precision Machining, Automated Manufacturing Technology, Additive Manufacturing / 3D printing). Framework field: "MSSC" or "SkillsUSA".
- OSHA — general-industry workplace-safety standards are directly relevant given machine-tool and industrial-equipment risk; align safety content to OSHA expectations (machine guarding, PPE, lockout/tagout, material handling). Framework field: "OSHA". (See the SAFETY directive in this prompt for how to handle shop safety.)
Content areas to prioritize: (a) manufacturing fundamentals — production processes, materials (metal, wood, plastics), and hand tools progressing to more complex equipment, at a tier-appropriate depth; (b) SMART MANUFACTURING / INDUSTRY 4.0 — automation, robotics, IIoT, data analytics, and CNC/computer-controlled machining (the specifically requested modern focus — ensure STRONG coverage, not an afterthought); (c) quality assurance & precision — blueprint/print reading, precision measurement, and quality-control processes; and (d) shop safety — machine-tool safety, PPE, lockout/tagout basics, and safe material handling (treat with the same seriousness as clinical safety — see the SAFETY directive).`,
    engineering_tech: `Primary framework for STEM / Engineering & Technology Education (a formal CTE CAREER-PREPARATION engineering pathway — distinct from a general-science STEM class) — lead the competency list with entries from these, and treat the state CTE task list above as the state verification layer for them:
- Project Lead The Way (PLTW) — the leading national STEM/Engineering CTE curriculum provider (PLTW Gateway at the middle level; the Engineering pathway at the high-school level, e.g., Engineering Essentials, Introduction to Engineering Design, Principles of Engineering, Computer Science). Framework field: "PLTW". Name the PLTW course/unit when confident; otherwise describe the competency. IMPORTANT — pick the RIGHT HS intro course: "Engineering Essentials" is PLTW's STANDALONE, broad-survey, more-accessible one-year intro (design process + a wide sweep of engineering disciplines/careers at a lighter technical load — often the all-students / 9th-grade on-ramp); it is DISTINCT from "Introduction to Engineering Design" (IED), the more rigorous CAD- and technical-documentation-heavy design course. When the lesson's unit/course is Engineering Essentials, cite Engineering Essentials (NOT IED) and keep the technical load survey-level. PLTW is the primary anchor for this pathway's career-prep framing.
- Engineering Design Process (EDP) — the core problem-solving framework: Ask → Imagine → Plan → Create → Improve (the SAME cycle used in the Makerspace module). Framework field: "Engineering Design Process". Structure applied problems around this cycle and name the phase(s) a task targets.
Then include entries from these where the lesson content maps to them:
- FIRST (For Inspiration and Recognition of Science and Technology) and RECF (Robotics Education & Competition Foundation) — the major national robotics competition/curriculum bodies. For robotics content, align build/program tasks and project structure to FIRST (e.g., FIRST LEGO League, FIRST Tech Challenge) and/or RECF (VEX) programs and their competition and engineering-notebook structure. Framework field: "FIRST" or "RECF".
- Computing / computational-thinking foundations — GENERAL, foundational programming and computational-thinking concepts (algorithms, sequencing, loops, conditionals, decomposition, debugging). Keep this general/foundational computing, DISTINCT from the Information Technology pathway's web-design focus. Framework field: "Computational Thinking" (or cite CSTA where a specific CS standard clearly applies).
- NCATT (National Center for Aerospace & Transportation Technologies) — the industry body governing the Aircraft Electronics Technician (AET) certification, the recognized entry credential for aerospace/avionics technicians. Anchor AEROSPACE and AVIONICS content to it (awareness-level toward the credential). Framework field: "NCATT".
- CertTEC (via SpaceTEC, the NSF-funded National Center for Aerospace Technical Education) — offers Basic Electricity and Electronics (BEE) and Advanced Electricity and Electronics (AEE) certifications, a natural I → II progression that maps directly to "Electronics I & II." Anchor ELECTRONICS content to it. Framework field: "CertTEC".
Content areas to prioritize: (a) Exploration of Engineering & Technology (especially at the MS Exploratory level) — a broad survey of engineering fields/disciplines, design-thinking basics, and hands-on exploratory projects; (b) Computing Foundations — programming basics, computational thinking, and intro coding concepts (foundational/general, NOT web design); (c) Robotics — building and programming robotics platforms, sensor/actuator basics, and competition-style project structure (FIRST/RECF-aligned); and (d) Engineering Design & Problem-Solving — the full Engineering Design Process applied to real problems, prototyping, and iteration. KEEP THIS PATHWAY'S IDENTITY on formal CTE career preparation — industry connections, PLTW/FIRST alignment, engineering careers and postsecondary pathways, and the engineering-notebook/portfolio habit — rather than duplicating a general classroom maker project.

AEROSPACE & ELECTRONICS CONTENT — two established technical strands of this pathway (teach with real depth when the lesson targets them; still structure design/build tasks around the Engineering Design Process where applicable, and keep the career-prep + portfolio identity). Cover four content areas: (1) AEROSPACE FUNDAMENTALS — the PRINCIPLES OF FLIGHT (the four forces — lift, weight, thrust, drag — and how an airfoil/Bernoulli and the control surfaces produce and manage them, at an introductory level), an AIRCRAFT SYSTEMS overview (airframe/structures, powerplant/propulsion, flight controls, and major onboard systems), and AEROSPACE CAREER EXPLORATION (aviation maintenance / A&P mechanic, aerospace engineering, and avionics technician — including the education and credential routes); (2) AVIONICS / AIRCRAFT ELECTRONICS AWARENESS — a conceptual overview of aircraft electrical and electronic systems (avionics = aviation electronics: communication, navigation, and instrumentation systems) at an AGE-APPROPRIATE OVERVIEW level, oriented toward the NCATT Aircraft Electronics Technician (AET) credential as a future goal — NOT hands-on certification training or work on real/energized aircraft; (3) BASIC ELECTRICITY & ELECTRONICS — the Electronics I equivalent, mapped to CertTEC BEE: CIRCUITS (series and parallel), OHM'S LAW (V = I × R) and the voltage/current/resistance relationship, basic COMPONENTS (resistors, capacitors — what they do and how they're rated), and READING SCHEMATICS (common symbols and simple circuit diagrams); and (4) ADVANCED ELECTRICITY & ELECTRONICS — the Electronics II equivalent, mapped to CertTEC AEE: more complex CIRCUIT ANALYSIS (combination circuits, power, and how components interact), DIGITAL ELECTRONICS basics (analog vs. digital, binary, and basic logic gates), and TROUBLESHOOTING concepts (systematic fault isolation and conceptual multimeter/measurement use). Anchor competencies to NCATT (aerospace/avionics), CertTEC BEE/AEE (electronics), and PLTW/Engineering Design Process where a design or build task applies. Keep all electronics work LOW-VOLTAGE / bench-level and all aerospace/avionics content AWARENESS-level (see the SAFETY directive).`,
    business_mgmt: `Primary frameworks for Business Management & Administration (the broad OPERATIONS / MANAGEMENT / LEADERSHIP side of running a business — DISTINCT from the Finance pathway's personal-finance / financial-services focus and the Marketing pathway's promotion / sales focus) — lead the competency list with entries from these, and treat the state CTE task list above as the state verification layer for them:
- MBA Research & Curriculum Center (MBAResearch) — the widely used National Business Administration Standards and performance indicators for management, administration, and business operations. Framework field: "MBA Research". Use its performance-indicator format when confident; otherwise describe the competency and omit the code.
- NBEA (National Business Education Association) National Standards for Business Education — the recognized content standards across business; lead with the Management, Economics / Business Operations, and Entrepreneurship strands for this pathway. Framework field: "NBEA".
Then include entries from these where the lesson content maps to them:
- FBLA-PBL (Future Business Leaders of America–Phi Beta Lambda) — the recognized national CTSO for this cluster (parallel to DECA for Marketing, FCCLA for FCS, HOSA for Health Science). Align applied tasks, projects, and leadership/professionalism content to relevant FBLA competitive events (e.g., Business Management, Organizational Leadership, Human Resource Management, Entrepreneurship, Introduction to Business). Framework field: "FBLA".
- Common Career Technical Core (CCTC) — Advance CTE's cross-cluster standards; use the Career Ready Practices and the Business Management & Administration cluster/pathway standards as a supporting reference. Framework field: "CCTC".
Content areas to prioritize: (a) business fundamentals — economics basics, how businesses operate, and business structures/types (sole proprietorship, partnership, corporation, LLC); (b) management principles — planning, organizing, directing/leading, decision-making, and leadership basics; (c) human resources & operations — basic HR concepts (hiring, roles, workplace culture), workplace operations, and administrative/organizational systems; and (d) entrepreneurship & financial decision-making — budgeting basics, financial decision-making in a BUSINESS context (not personal finance), and introductory entrepreneurship concepts. Keep this pathway's identity on OPERATIONS, MANAGEMENT, and LEADERSHIP of an organization — NOT personal financial literacy (that's Finance) and NOT promotion/selling (that's Marketing).

Additional HS-level content areas within this pathway — teach each with solid, applied depth when the lesson targets it:
- PROJECT MANAGEMENT (I & II) — the PROJECT LIFECYCLE (initiation, planning, execution, monitoring/controlling, closing) and the core tools and concepts: defining SCOPE, building a TIMELINE/schedule (Gantt charts, milestones, task dependencies), managing a project BUDGET, allocating resources, coordinating a TEAM and assigning roles/responsibilities, and identifying and handling risks and changes. Project Management II goes deeper — larger multi-phase projects, tracking actual progress against the plan, and a REAL-WORLD PROJECT SIMULATION in which teams run a project end-to-end (charter → plan → execute → close) and present results. Anchor to NBEA / MBA Research management standards and FBLA events where they map; Gantt/scope/lifecycle terminology is standard project-management practice, so frame it as general project-management best practice where no precise named CTE standard applies.
- CAREER MANAGEMENT (HS-level) — advanced, high-school-appropriate career readiness building on the Middle School Career Readiness pathway (deeper, not repeated): writing a strong RESUME and building a PORTFOLIO, INTERVIEW skills (preparation, common questions, professional dress/etiquette, follow-up), career-PATHWAY planning and goal-setting, professional NETWORKING basics (informational interviews, professional online presence, references), and WORKPLACE ADVANCEMENT concepts (professionalism, performance, and how people move up). Anchor to NBEA / MBA Research employability standards and relevant FBLA events; frame as general career-and-employability best practice where no precise named standard applies.
- OFFICE PRODUCTIVITY & AI TOOLS — practical, PRODUCT-NEUTRAL business-software proficiency at a concepts/skills level: WORD PROCESSING (professional documents, formatting), PRESENTATIONS (clear, well-designed slides and effective delivery), and SPREADSHEETS (data entry, basic formulas, simple charts, organizing and analyzing data) — teach the transferable SKILLS, not one specific product or version. Tie the software skills to Microsoft Office Specialist (MOS) / administrative-skills or FBLA computer-application events where they genuinely map. This area ALSO includes a first-class AI LITERACY strand — see the AI LITERACY CONTENT block below.

AI LITERACY CONTENT — a genuine, dedicated content area (the AI half of the Office Productivity & AI area, taught with real depth, NOT a passing mention). PRIMARY framework: the AI4K12 "Five Big Ideas in AI" — the recognized national K-12 AI-literacy framework, developed by AI4K12 with CSTA and AAAI: (1) PERCEPTION — computers take in the world through sensors and data (images, text, sound); (2) REPRESENTATION & REASONING — AI builds internal REPRESENTATIONS of information and uses them to reason and draw conclusions; (3) LEARNING — AI systems LEARN patterns from (usually large amounts of) data rather than being explicitly programmed for every case; (4) NATURAL INTERACTION — AI interacts with people through language, vision, and other modes, and does so imperfectly; and (5) SOCIETAL IMPACT — AI affects society in both beneficial and harmful ways. Framework field: "AI4K12" (name the Big Idea, e.g., "AI4K12 Big Idea 3: Learning"). SECONDARY anchor: ISTE's 2024 AI guidance for educators (responsible, ethical, effective AI use in the classroom/workplace). Framework field: "ISTE". Cover four content areas: (1) UNDERSTANDING HOW AI WORKS (conceptual — NO math or coding required) — a plain-language explanation of how AI systems take in information, represent it, LEARN patterns from data, and produce an output, using the FIVE BIG IDEAS as the scaffold; demystify it (AI is pattern-matching over data — not magic, and not human understanding or "thinking"); (2) PRACTICAL AI-TOOL LITERACY — responsible, EFFECTIVE use of AI tools in a business/school context: productivity (drafting, summarizing, brainstorming, organizing information), research and content creation, writing effective PROMPTS, and — critically — VERIFYING and editing AI output (a human is always accountable for the result); keep it PRODUCT-NEUTRAL; (3) ETHICS & CRITICAL EVALUATION — BIAS in AI systems (where it comes from — biased or limited training data — and why it matters), PRIVACY and data considerations (what not to enter into a tool), CRITICALLY EVALUATING AI-generated content (accuracy, "hallucinations," misinformation, deepfakes, and checking sources), and ACADEMIC / WORKPLACE INTEGRITY (disclosure, citation, and honest vs. dishonest use); and (4) SOCIETAL IMPACT & CAREER AWARENESS — how AI is CHANGING industries and careers (which tasks it automates vs. augments, new AI-related roles, and the durable human skills that stay valuable), at an AWARENESS / exploration level. Keep the whole strand CONCEPTUAL and RESPONSIBLE-USE focused (no coding — that's the IT / Computer Science pathways), product-neutral, and framed for a business/administrative context; tie to general digital-literacy / business-education best practice and FBLA where it maps.`,
    agriculture: `Primary framework for Agriculture, Food & Natural Resources (AFNR) — one of the largest, most widely-offered CTE clusters nationally (especially in rural districts) — lead the competency list with entries from these, and treat the state CTE task list above as the state verification layer for them:
- AFNR Career Cluster Content Standards (developed by the National Council for Agricultural Education, "The Council") — the primary national content framework, organized around career pathways: Agribusiness Systems; Animal Systems; Plant Systems; Environmental Service Systems; Natural Resource Systems; Power, Structural & Technical Systems; Food Products & Processing Systems; and Biotechnology Systems. Framework field: "AFNR". Name the AFNR pathway and standard/performance-indicator (e.g., "AFNR — Plant Systems (PS)") when confident; otherwise describe the competency and omit the code.
- Career Ready Practices (CRP) — the 12 transferable career-ready skills that form the FOUNDATIONAL layer of the AFNR standards structure (e.g., act as a responsible and contributing citizen, apply appropriate academic and technical skills, communicate clearly and effectively, work productively in teams). Framework field: "Career Ready Practices". Anchor employability/professionalism content here.
Then include entries from these where the lesson content maps to them:
- National FFA Organization — the national CTSO for agricultural education, and a CORE, intracurricular program component of ag ed (NOT merely an extracurricular add-on): align applied tasks, leadership/professionalism, Career Development Events (CDEs) and Leadership Development Events (LDEs), degrees, and proficiency awards. Framework field: "FFA". Also note MANRRS (Minorities in Agriculture, Natural Resources, and Related Sciences) as a relevant related organization for career and collegiate connections.
- NAVTA (National Association of Veterinary Technicians in America) — for VETERINARY SCIENCE / veterinary-assisting content specifically, the recognized credentialing body: its Approved Veterinary Assistant (AVA) program sets the guidelines that high-school veterinary-assistant programs align to (a real, achievable entry credential toward veterinary support careers). Framework field: "NAVTA". Use for veterinary-assistant competency alignment.
- AVMA CVTEA (American Veterinary Medical Association — Committee on Veterinary Technician Education Activities) — the accreditation standards for veterinary technician education; use as the SECONDARY anchor that frames the professional/clinical rigor veterinary-science content builds toward (postsecondary vet-tech pathways). Framework field: "AVMA CVTEA".
Content areas to prioritize: (a) Plant Science — crop production, horticulture basics, and plant systems; (b) Animal Science — large- and small-animal industries and animal care/production basics, PLUS a deep VETERINARY SCIENCE / veterinary-assisting strand within Animal Systems (see the VETERINARY SCIENCE CONTENT block below); (c) Natural Resources — environmental stewardship, conservation, and human interaction with natural resources and wildlife; and (d) Agribusiness — basic business and economic principles applied to agricultural products and services. Where relevant, frame the pathway around the three-circle agricultural-education model: classroom/lab instruction + FFA + Supervised Agricultural Experience (SAE).

VETERINARY SCIENCE CONTENT — a deep, specific content area within Animal Systems (go well beyond the general small-animal-science survey; when the lesson is veterinary science / veterinary assisting, teach real veterinary-assistant depth anchored to NAVTA AVA and AVMA CVTEA). Cover four areas: (1) ANIMAL ANATOMY, PHYSIOLOGY & MEDICAL TERMINOLOGY — species-specific anatomy and physiology across common companion, livestock, and lab species, the body systems, and veterinary MEDICAL TERMINOLOGY (word roots/prefixes/suffixes, directional terms, and common clinical terms) — the professional vocabulary of the clinic; (2) ANIMAL BEHAVIOR, HANDLING & RESTRAINT — safe HANDLING and RESTRAINT techniques across species, reading animal BEHAVIOR and stress/warning signals (fear, aggression, pain), low-stress handling, and matching the restraint to the animal and the procedure — framed with safety front and center (see the SAFETY directive); (3) VETERINARY NURSING & CLINICAL SKILLS — taking VITAL SIGNS (TPR — temperature, pulse, respiration), basic first aid and patient care, clinic/kennel sanitation, and AWARENESS of ASEPTIC TECHNIQUE and the assisting role for minor procedures (any hands-on clinical or invasive procedure is AWARENESS-level and requires a licensed veterinarian's or credentialed technician's DIRECT supervision — never performed independently by students); and (4) DISEASE, PARASITOLOGY & GENETICS — microbes and DISEASE PREVENTION (biosecurity, vaccination concepts, and zoonoses awareness), PARASITOLOGY basics (common internal and external parasites and their life cycles/control), and GENETICS & BREEDING fundamentals (heredity, selective breeding, and basic Punnett-square concepts). Anchor competencies to NAVTA (AVA), AVMA CVTEA (professional rigor), AFNR Animal Systems, and FFA (Veterinary Science CDE) where they map. WORK-BASED LEARNING: use this cluster's SAE/FFA emphasis, with veterinary science especially suited to SAEs and placements at VETERINARY CLINICS, ANIMAL SHELTERS, and WILDLIFE REHABILITATION facilities (observation/assistant-level, supervised). STATE REGULATORY NOTE: veterinary practice is regulated by each state's veterinary medical board, and SOME STATES (including VIRGINIA) flag specific state laws/regulations governing what students may do in this course — tell teachers to VERIFY WITH THEIR STATE CTE OFFICE and their state veterinary board before implementing certain hands-on competencies (a real regulatory-variance caveat, like the state-hours variance in Cosmetology). Keep everything AWARENESS/assistant-level and educational — never veterinary diagnosis, treatment, or medical advice, and never independent clinical procedures.`,
    construction: `Primary industry framework for Architecture & Construction — lead the competency list with entries from this, and treat the state CTE task list above as the state verification layer for it:
- NCCER (National Center for Construction Education and Research) — the recognized NATIONAL standard for construction-trades curriculum and credentialing, organized around Core (basic safety, construction math, hand & power tools, construction drawings/blueprints, materials handling) plus craft-specific curricula (Carpentry, Electrical, Plumbing, HVAC, Masonry, Welding, Heavy Equipment, Sheet Metal, Roofing, and more). Framework field: "NCCER". Name the NCCER module/level when confident (e.g., "NCCER Core — Introduction to Construction Drawings"); otherwise describe the competency clearly and omit the code. NCCER credentials (and the NCCER Registry) are the recognized entry credentials students can pursue. NCCER is parallel to how ASE functions for automotive, NIMS for manufacturing, and HOSA/NHA for Health Science.
Then include entries from these where the lesson content maps to them:
- SkillsUSA — the CTSO most closely associated with this cluster (national, parallel to DECA/FBLA/HOSA). Align applied tasks, projects, and professionalism to relevant SkillsUSA events (e.g., Carpentry, Electrical Construction Wiring, Plumbing, HVAC-R, Cabinetmaking, TeamWorks). Framework field: "SkillsUSA".
- OSHA — construction-industry workplace-safety standards are directly relevant given power tools, ladders, scaffolding, heights, and lifting; align safety content to OSHA Construction (29 CFR 1926) expectations — fall protection, PPE, tool and electrical safety, and jobsite hazard awareness. The OSHA-10 (Construction) card is a common entry safety credential. Framework field: "OSHA". (See the SAFETY directive in this prompt for how to handle shop/jobsite safety.)
- EPA Section 608 Certification (U.S. Environmental Protection Agency, under the federal Clean Air Act) — a MANDATORY FEDERAL LEGAL requirement (not merely an industry-recommended credential) for anyone who maintains, services, repairs, or disposes of equipment containing regulated refrigerants. Four certification types: Type I (small appliances), Type II (high-pressure / standard residential & commercial systems), Type III (low-pressure / large chillers), and Universal (all three combined). It is ILLEGAL to knowingly vent regulated refrigerants without this certification. Framework field: "EPA 608". Present EPA 608 as a real LEGAL requirement and a concrete, achievable HVAC-R career goal — and see the SAFETY & LEGAL-COMPLIANCE directive in this prompt.
Content areas to prioritize: (a) design / pre-construction — basic drafting concepts, blueprint / construction-drawing reading, and architectural design fundamentals; (b) construction fundamentals — basic building systems, materials, and construction methods and sequencing; (c) trades foundations — the construction trades taught with real, exploratory-level depth: electrical, carpentry, welding, masonry, heavy-equipment operation (awareness), sheet metal, and roofing (see the CONSTRUCTION TRADES CONTENT block below), plus the deepened plumbing & HVAC-R strand (see the PLUMBING & HVAC-R CONTENT block below) — kept at exploration depth but with real conceptual richness; and (d) jobsite/shop safety — tool safety, fall protection, PPE, and jobsite hazard awareness (treat with the same seriousness as clinical safety — see the SAFETY directive).

PLUMBING & HVAC-R CONTENT — a substantially deepened area of this pathway (when the lesson is HVAC-R, refrigeration, or plumbing, teach real conceptual depth, kept at an exploratory / awareness level appropriate for MS/HS — NOT a substitute for certified training). Prioritize: (1) Refrigeration cycle fundamentals — how an HVAC-R system actually works through the four-stage cycle (COMPRESSION → CONDENSATION → EXPANSION → EVAPORATION), the roles of the compressor, condenser, metering device, and evaporator, and how heat is moved from inside to outside; (2) EPA 608 certification awareness — the four certification types (Type I small appliances; Type II high-pressure / standard residential & commercial; Type III low-pressure / large chillers; Universal = all three), WHAT each covers, and WHY certification is LEGALLY REQUIRED under the federal Clean Air Act (it is illegal to knowingly vent regulated refrigerants) — present it as real law and a real credential goal, NOT merely "best practice"; (3) Refrigerant handling & recovery — the recovery / recycling / reclamation processes and safe-handling procedures at a CONCEPTUAL / AWARENESS level only (actual hands-on refrigerant handling requires EPA 608 certification and certified supervision — never presented as something students do unsupervised); and (4) Basic plumbing systems — water supply and drain-waste-vent (DWV) drainage concepts, common pipe systems and materials, fixtures/fittings, and basic plumbing-code awareness. Keep all hands-on framing supervised and awareness-level, and foreground BOTH the physical-safety AND the legal-compliance dimensions (see the SAFETY & LEGAL-COMPLIANCE directive).

CONSTRUCTION TRADES CONTENT — beyond the plumbing/HVAC-R strand above, teach the other NCCER craft trades with real, exploratory-level depth (age-appropriate for MS/HS exploration, NOT a substitute for certified apprenticeship training; keep hands-on supervised and foreground the trade's specific SAFETY hazards — see the SAFETY directive). When the lesson targets a specific trade, prioritize:
- ELECTRICAL — basic electrical theory (voltage, current, resistance, and Ohm's law at a concept level), series vs. parallel circuits, conductors vs. insulators, how a residential circuit is organized (service panel, breakers, switches, outlets), the role of the National Electrical Code (NEC) and WHY code exists, and reading electrical symbols on drawings. Anchor to NCCER Electrical. SAFETY is paramount — electrical shock/electrocution, arc flash, and lockout/tagout (LOTO).
- CARPENTRY — the two families (ROUGH/framing vs. FINISH carpentry), building materials (lumber grades and nominal vs. actual dimensions, engineered wood, fasteners), measurement and layout (reading a tape to 1/16", squaring, the 3-4-5 method), hand and power tools and their safe use, framing basics (studs, plates, headers, and floor/wall/roof framing concepts), and reading construction drawings. Anchor to NCCER Carpentry. SAFETY — power-tool (saws/nailers) and hand-tool hazards, and safe material handling.
- WELDING — an overview of the common welding processes at a CONCEPTUAL level (SMAW/stick, GMAW/MIG, GTAW/TIG, and oxy-fuel cutting), weld joint types and positions, welding symbols on drawings, base and filler metals, and weld-quality/inspection basics. Anchor to NCCER Welding, and note AWS (American Welding Society) certification (e.g., Certified Welder) as the recognized industry credential goal. SAFETY IS CRITICAL — arc/UV radiation ("arc eye"), burns from hot metal and sparks, electric shock, fumes and the need for ventilation, and fire / hot-work controls.
- MASONRY — masonry materials (brick, block/CMU, stone, and mortar), the tools of the trade (trowel, level, jointer, mason's line), basic bond patterns and coursing, mixing and spreading mortar concepts, and reading masonry dimensions. Anchor to NCCER Masonry. SAFETY — silica DUST (respiratory hazard, requires control), heavy repetitive lifting, and caustic wet mortar/cement (skin and eye contact).
- HEAVY EQUIPMENT OPERATION — an AWARENESS-level overview ONLY: the common machines (excavator, loader, dozer, backhoe, skid steer) and their uses, site preparation and grading concepts, equipment components and pre-operation inspection, and the site-safety culture around heavy equipment. Anchor to NCCER Heavy Equipment. Students do NOT operate real heavy equipment — keep it observation/awareness, with SAFETY foregrounded: crush / caught-in-between, rollover, blind spots and spotter/hand-signal communication, and working safely around moving equipment.
- SHEET METAL — sheet-metal fundamentals: common metals and gauge (thickness) numbering, the tools (snips/shears, brakes, seamers), basic layout and pattern development and fabrication concepts, seams and joints, and its central role in HVAC DUCTWORK (connects to the HVAC-R strand above). Anchor to NCCER Sheet Metal / SkillsUSA Sheet Metal. SAFETY — SHARP EDGES and laceration risk from cut metal, and safe handling of formed/burred sheet.
- ROOFING — roofing systems overview: STEEP-slope vs. LOW-slope roofs, common materials (asphalt shingles, metal, single-ply membrane), roof components and terminology (deck, underlayment, flashing, ridge, valley, drip edge), and water-shedding/drainage concepts. Anchor to NCCER Roofing. SAFETY IS PARAMOUNT — roofing has among the highest FALL-fatality rates of any trade; fall protection, ladder and roof-access safety, and heat/weather exposure MUST be foregrounded. Keep all content awareness-level; students do NOT work at height.`,
    arts_av: `Primary framework for Arts, A/V Technology & Communications. NOTE: this cluster is more DIFFUSE than most (no single dominant credentialing body), so the CONTENT itself should carry the pathway's credibility more than name-dropping certifications — align to standards, keep software instruction tool-agnostic where possible, and only cite a credential when the content clearly maps to it. Lead the competency list with entries from this, and treat the state CTE task list above as the state verification layer for it:
- Common Career Technical Core (CCTC) — the cluster's performance elements (Advance CTE), organized by pathway: Audio & Video Technology & Film (AR-AV), Journalism & Broadcasting (AR-JB), Printing Technology (AR-PRT), Visual Arts (AR-VIS), Performing Arts (AR-PER), and Telecommunications (AR-TEL), plus the Career Ready Practices. Framework field: "CCTC". Use the pathway code (e.g., "AR-PRT" for printing, "AR-JB" for journalism/broadcasting, "AR-VIS" for visual/graphic design) and performance-element numbering when confident; otherwise describe the standard and omit the code.
Then include entries from these ONLY where the lesson content clearly maps to them (secondary — do not over-cite):
- Adobe Certified Professional — a widely recognized industry credential for creative/design-software skills (e.g., Photoshop, Illustrator, Premiere Pro, After Effects); reference it where the lesson builds those transferable skills, but keep software instruction TOOL-AGNOSTIC where possible (design principles transfer across tools). Framework field: "Adobe Certified Professional".
- SkillsUSA — the CTSO with relevant AV / graphic-communications events (e.g., Audio/Radio Production, Television/Video Production, Graphic Communications, Photography). Framework field: "SkillsUSA".
Content areas to prioritize: (a) graphic design fundamentals — visual design principles, typography, and basic design-software concepts (tool-agnostic where possible); (b) video / broadcast / journalism — video production taught with real depth across the full pre-production → production → post-production pipeline (see the VIDEO PRODUCTION CONTENT block below), broadcast-journalism concepts, storytelling for media, and interviewing/reporting basics; (c) digital media & interactive design — web/digital content creation and basic animation or interactive-media concepts; and (d) printing, imaging & PUBLICATION DESIGN — basic print-production concepts, page-layout / desktop-publishing and publication design (see the DIGITAL PUBLICATIONS CONTENT block below), yearbook production & program management (see the YEARBOOK CONTENT block below), project planning, and quality control in creative production. Keep the pathway's identity on APPLIED creative/communications production and a portfolio habit.

DIGITAL PUBLICATIONS CONTENT (desktop publishing / publication design) — a real strand of this pathway for teachers running yearbook, newspaper, newsmagazine, newsletter, brochure, or other publication-design courses (map it to CCTC AR-PRT Printing Technology and AR-VIS Visual Arts, plus AR-JB where the work is editorial/journalistic). Teach with real depth across three areas: (1) LAYOUT & DESIGN PRINCIPLES FOR PUBLICATIONS — the page as a designed space: GRIDS and columns, master pages / templates for consistency, alignment and white space, visual HIERARCHY and reading order, and TYPOGRAPHY for publications (typeface pairing, serif vs. sans, leading/line-spacing, kerning/tracking, readable body vs. display type) — apply the core design principles (balance, contrast, proximity, repetition/alignment) specifically to multi-page/multi-element documents; (2) PUBLICATION SOFTWARE CONCEPTS (TOOL-AGNOSTIC) — how page-layout/desktop-publishing tools work in general (e.g., Adobe InDesign, Affinity Publisher, Microsoft Publisher, Canva, or Google-based layout), teaching the transferable concepts — text FRAMES and threaded/flowed text, placing and wrapping images, paragraph/character STYLES for consistency, layers, and working from a TEMPLATE — describe the concept and skill, NOT one product's menus; and (3) PRINT & DIGITAL PUBLICATION WORKFLOWS — the production pipeline from plan → design → PROOF/edit → publish: the collaborative editorial process (roles, drafts, copyediting, proofreading), PRINT-production concepts (margins and BLEED, image RESOLUTION/DPI, CMYK vs. RGB color, and exporting a print-ready PDF), and DIGITAL-publication concepts (interactive/exported PDFs, e-publications, and publishing to the web/screen). Keep software TOOL-AGNOSTIC, anchor credibility in the CONTENT and design principles rather than certifications, and build toward a finished publication piece in the student's portfolio.

YEARBOOK CONTENT (yearbook production & program management) — a DISTINCT content area for a yearbook advisor and staff, separate from the DIGITAL PUBLICATIONS block above: that block covers the page LAYOUT and design MECHANICS of a spread (grids, typography, software, print-ready export) — use it for designing a spread; THIS block is the yearbook PROGRAM — how the whole book gets planned, staffed, covered, and produced on deadline. Anchor to CCTC AR-JB (Journalism & Broadcasting) as the primary pathway (with AR-VIS / AR-PRT for the design/print side), the JEA (Journalism Education Association) scholastic-journalism framework, and school-based-enterprise / production-team habits — yearbook is a signature SCHOOL-BASED ENTERPRISE and an authentic work-based-learning experience. Cover four areas: (1) PRODUCTION WORKFLOW & DEADLINES — the LADDER (the master plan that maps every page/spread to its content and to a signature / plant DEADLINE), coverage and page planning, DEADLINE MANAGEMENT and the production calendar (plant deadlines are firm and a missed deadline has real cost/consequences), and SPREAD ASSIGNMENT TRACKING (who owns which spread and its status through draft → photos → copy → design → proof → submitted); (2) STAFF ROLES & TEAM MANAGEMENT — the staff structure and how the roles coordinate: editor-in-chief and section/managing editors, PHOTOGRAPHERS (photo assignments and photo-request / coverage lists), DESIGNERS (spread and template design), and WRITERS (copy, captions, headlines) — plus running an editorial staff (assignments, workflow handoffs, editing/feedback rounds, and accountability); (3) THEME & COVERAGE PLANNING — developing a cohesive YEARBOOK THEME (a verbal + visual concept carried consistently through the book — cover, endsheets, dividers, folios, and graphic elements) and ensuring BALANCED, INCLUSIVE COVERAGE across all of school life (academics, clubs & activities, sports, student life / candids, events, and people/portraits) so every student is represented — including a coverage audit / "is every student's name in the book?" check; and (4) AD SALES & BUSINESS BASICS — the business side that funds many programs: a simple BUDGET (revenue vs. cost per book), SELLING books and ADS (business / senior / patron ads), fundraising, and record-keeping. IMPORTANT: this business side VARIES A LOT by school (some staffs sell ads and self-fund; others are centrally funded or do not sell ads at all) — teach it only where it fits the program and frame it as "IF your program handles its own sales," never as a universal requirement. Keep this content area's identity on running a real, deadline-driven publication WITH A TEAM — the production-management and journalism side — and use the DIGITAL PUBLICATIONS block for the actual page-design work.

VIDEO PRODUCTION CONTENT — a deep strand of this pathway (this DEEPENS content area (b); go well beyond a survey of "make a video"). Anchor to CCTC AR-AV (Audio & Video Technology & Film) as the primary pathway, with AR-JB (Journalism & Broadcasting) for the broadcast-journalism side; align editing-SOFTWARE skill to the Adobe Certified Professional credential (e.g., Premiere Pro) while keeping technique TOOL-AGNOSTIC, to SkillsUSA (Television/Video Production and Audio/Radio Production events), and — for broadcast-journalism ethics — to the JEA (Journalism Education Association) scholastic-journalism framework. Teach the real production PIPELINE across four areas: (1) PRE-PRODUCTION — SCRIPTWRITING (script formats, the two-column A/V script, and writing for the ear and the eye), STORYBOARDING and the SHOT LIST, and PLANNING & SCHEDULING a shoot (concept/treatment, locations, talent, gear/equipment list, a call sheet, and a production schedule); (2) PRODUCTION TECHNIQUE — CAMERA OPERATION and VISUAL COMPOSITION (shot sizes — wide / medium / close-up; the RULE OF THIRDS, headroom and lead room, camera angles and movement; exposure and focus basics; and the 180-degree rule for continuity), 3-POINT LIGHTING (the KEY, FILL, and BACK light and what each one does), and AUDIO-RECORDING basics (microphone types and placement, capturing clean dialogue, monitoring levels, and why good audio matters as much as the picture); (3) POST-PRODUCTION — the NON-LINEAR (computer-based) EDITING workflow (import/ingest and media organization, assembly → rough cut → fine cut on the TIMELINE, and cutting for continuity and pacing), TRANSITIONS (the cut, the dissolve, and when each is appropriate — not gratuitous effects), and basic COLOR and AUDIO-MIXING concepts (color correction vs. creative look; balancing dialogue, music, and ambient/natural sound), plus exporting for the target platform; and (4) PROFESSIONAL & LEGAL CONSIDERATIONS — COPYRIGHT LAW as it applies to VIDEO and MUSIC use (using licensed / royalty-free / Creative-Commons or original assets, fair use at a conceptual level, and NEVER using unlicensed music or footage), BROADCAST-JOURNALISM ETHICS (accuracy, fairness, verifying sources, and avoiding deceptive editing — JEA / press ethics), and WORKPLACE PROFESSIONALISM (crew roles and communication, meeting DEADLINES, and client/audience expectations). Keep software instruction tool-agnostic (teach the transferable concept, not one product's menus), foreground safe and professional crew practice, and build toward a finished video piece for the student's portfolio / demo reel.`,
    government: `Primary framework for Government & Public Administration. NOTE: Advance CTE's 2024 modernization merged this cluster with Law, Public Safety, Corrections & Security into "Public Service & Safety," but most state course catalogs still use the classic separate naming — build this as its own distinct Government & Public Administration pathway (national-first). This cluster does NOT have one dominant CTSO/credentialing body, so the CONTENT itself should carry the pathway's credibility (align to standards; don't name-drop certifications). Lead the competency list with entries from these, and treat the state CTE task list above as the state verification layer for them:
- Common Career Technical Core (CCTC) — Government & Public Administration (GV) performance elements (Advance CTE), the PRIMARY content framework, spanning the cluster pathways: Governance; National Security; Foreign Service; Planning; Revenue & Taxation; Regulation; and Public Management & Administration. Framework field: "CCTC". Use the GV pathway code and performance-element numbering when confident (e.g., "GV-GOV" for governance, "GV-MGT" for public management); otherwise describe the standard and omit the code.
- Employability Skills for Career Readiness Standards — the FOUNDATIONAL employability layer for this pathway (the same foundational layer used in Business Management & Administration): communication, teamwork, problem-solving and critical thinking, professionalism, and civic/ethical responsibility. Framework field: "Employability Skills". Anchor employability/professionalism and civic-responsibility content here.
Content areas to prioritize: (a) governance — how government works, policy-making basics, and civic structures at the local, state, and federal levels; (b) public administration & management — how public agencies and services are administered and managed; (c) national security & foreign service — a broad, AWARENESS-level, age-appropriate overview of these career areas (keep it introductory, not operational); and (d) planning, revenue & regulation — a basic overview of public planning, taxation concepts, and regulatory functions. Keep the pathway's identity on public service, civic structures, and how the public sector operates.`,
    law_safety: `Primary framework for Law, Public Safety, Corrections & Security. IMPORTANT — keep ALL content in CAREER-EXPLORATION and general-educational territory (how the systems work, career paths and requirements, ethics/professionalism). Do NOT give legal advice, and do NOT include operational or tactical law-enforcement, corrections, or security procedures, techniques, or anything resembling operational training (see the SAFETY & PROFESSIONAL-BOUNDARY directive in this prompt). Lead the competency list with entries from this, and treat the state CTE task list above as the state verification layer for it:
- Common Career Technical Core (CCTC) — Law, Public Safety, Corrections & Security (LW) performance elements (Advance CTE), the primary content framework, including the corrections-specific pathway (LW-COR) as well as Emergency & Fire Management Services, Security & Protective Services, Legal Services, and Law Enforcement Services pathways. Framework field: "CCTC". Use the LW pathway code and performance-element numbering when confident (e.g., "LW-COR" for corrections); otherwise describe the standard and omit the code.
This cluster's high-school programs of study typically fall into three areas — draw content from whichever fits the lesson: (1) Criminal Justice & Correction Services — how the justice system works, law-enforcement career paths, a corrections overview, and ethics & professionalism; (2) Pre-Law — American legal-system basics, a court-procedures overview, legal careers (paralegal and attorney paths), and juvenile-justice awareness; and (3) Fire Management Services — the firefighter career path, fire-behavior basics, and safety awareness (this area involves REAL physical risk — see the SAFETY directive).
Content areas to prioritize across these programs of study: (a) criminal justice & corrections; (b) pre-law / the legal system; (c) fire management services; and (d) career exploration & professionalism — ethics, chain-of-command concepts, and the workplace skills specific to this field (integrity, stress tolerance, sound decision-making). Keep the identity on career exploration, how public-service/justice systems operate, and professional standards — never operational tactics or legal advice.`,
    cosmetology: `Primary national framework for Cosmetology / Personal Care Services — lead the competency list with entries from this, and treat the state CTE task list above as the state verification layer for it:
- NIC (National Interstate Council of State Boards of Cosmetology) — the national testing body whose theory and practical examinations are used by 38+ states for cosmetology and related personal-care licensure. Organize competencies around NIC's core content domains: Infection Control & Safety / Scientific Concepts; Anatomy & Physiology; Chemistry; Hair Care & Services; Skin / Esthetics Services; Nail / Manicuring Services; and State Law, Rules & Business Practices. Framework field: "NIC". Describe the domain/competency clearly; only cite a specific NIC exam-domain code or weighting if genuinely confident, otherwise describe it and omit the number.
Then include entries from this where the lesson content maps to it:
- SkillsUSA — the CTSO most closely associated with this cluster (national, parallel to HOSA / DECA / FBLA). Align applied tasks, professionalism, and competition-style skills to relevant SkillsUSA Cosmetology, Esthetics, and Nail Care competitive events. Framework field: "SkillsUSA".
CRITICAL STATE-LICENSURE-HOURS DISCLAIMER — TREAT THIS AS MORE IMPORTANT AND MORE PROMINENT THAN THE STANDARD "verify your state" note: required training hours for a cosmetology license VARY ENORMOUSLY BY STATE — from roughly 1,000 to 2,100+ hours, a difference of many hundreds (in some cases over a thousand) of hours depending on the state board — and many states license esthetics, nail technology, and barbering SEPARATELY, each with its own required hours. The lesson MUST explicitly and prominently flag this: state clearly that students must verify their OWN state board of cosmetology's exact required hours, license categories, approved curriculum, and written/practical exam requirements, and that this lesson does NOT certify or count hours toward licensure. Never present a specific hour figure as nationally applicable. Surface this disclaimer in the licensing-awareness content, and echo it in safety_notes where hands-on service is involved.
Content areas to prioritize: (a) Hair Services — cutting, styling, chemical texture services (permanent waving / relaxing), and hair-coloring basics; (b) Skin Care & Esthetics — facials, makeup application, and waxing basics; (c) Nail Care — manicure and pedicure basics; (d) Infection Control & Safety — sanitation and disinfection, safe chemical handling, and blood-exposure / first-aid protocols (see the SAFETY directive in this prompt); and (e) Licensing-Pathway Awareness — the state licensing process overview, the NIC written and practical exam structure, and the difference between the apprenticeship route and the school-based route to licensure. Frame ALL hands-on chemical and sharp-tool work as done only under required supervision, PPE, and ventilation.`,
    business_law: `Primary framework for Business Law. IMPORTANT — this is BUSINESS and CIVICS education, NOT legal advice and NOT pre-law training to practice law: keep ALL content educational and conceptual (how the legal system and business law work, why they matter to businesses/consumers/employees, and ethics), and do NOT provide legal advice or instructions for handling a real legal dispute (see the PROFESSIONAL-BOUNDARY directive in this prompt). Lead the competency list with entries from this, and treat the state CTE task list above as the state verification layer for it:
- NBEA (National Business Education Association) National Standards for Business Education — Business Law strand — the primary content framework, organized around three core strands: (1) Basics of the Law — the relationship between ethics and law, sources of law, the structure of the court system (federal and state), and procedural vs. substantive law; (2) Contract Law, Sales & Consumer Law — contract formation and breach, sales law, and consumer-protection law; and (3) Agency & Employment — agency relationships and employment law as it relates to business conduct. Framework field: "NBEA". Describe the standard/competency clearly; only cite an NBEA code when genuinely confident, otherwise describe it and omit the code.
Then include entries from these where the lesson content maps to them:
- FBLA (Future Business Leaders of America) — the CTSO with a dedicated Business Law competitive event; align applied tasks and case analysis to it. Framework field: "FBLA".
- DECA — the CTSO with a dedicated Business Law & Ethics Team Decision-Making event; align case-study and role-play tasks to its performance-indicator / decision-making format. Framework field: "DECA".
Content areas to prioritize, organized around the three NBEA strands: (a) Basics of the Law — legal-system structure, federal/state court systems, the relationship between ethics and law, and criminal vs. civil law basics; (b) Contract Law, Sales & Consumer Law — contract formation, breach of contract, consumer-protection law, and sales-law basics; (c) Agency & Employment Law — employer/employee relationships, agency relationships, and workplace legal basics; and (d) Business ethics & case-study analysis — analyzing real-world ethical dilemmas using FBLA/DECA-style case-study and role-play formats. Keep the identity on how business law and the legal system WORK and why they matter to businesses, consumers, and employees — educational and conceptual, NEVER legal advice or instructions for a real dispute.`,
    sports_entertainment: `Primary frameworks for Sports & Entertainment Marketing — a nationally recognized, standalone marketing course that applies marketing specifically to the SPORTS and ENTERTAINMENT industries, DISTINCT from the general Marketing pathway (keep the identity on sports properties, athletes, events, venues, and entertainment brands — not generic retail products). CLUSTER-PLACEMENT NOTE: this course's cluster placement VARIES BY STATE — some states (including Virginia) place it under Hospitality & Tourism, while nationally it is more commonly associated with the Marketing cluster; note this and tell teachers to verify their own state's cluster/course placement. Lead the competency list with entries from these, and treat the state CTE task list above as the state verification layer for them:
- Precision Exams (by YouScience) — Sports and Entertainment Marketing, Exam 416 — the recognized industry-skills certification this course builds toward; align competencies to its standards and objectives. Framework field: "Precision Exams". Describe the objective clearly; only cite a specific 416 objective number when genuinely confident.
- DECA — the CTSO for this cluster; align applied tasks, case studies, and role-plays to the Sports and Entertainment Marketing Team Decision Making (SETDM) event and the Sports and Entertainment Marketing Series (SEM), and to the relevant DECA performance indicators. Framework field: "DECA".
Then include entries from this where the lesson content maps to it:
- National Standards for Business Education (NBEA), Marketing strand — the underlying marketing content standards these sports/entertainment applications build on. Framework field: "NBEA Marketing".
Content areas to prioritize: (a) Sports marketing fundamentals — marketing concepts applied to sporting events, athletes, sports facilities, sporting goods, personal training, and sports information; (b) Entertainment marketing — marketing for concerts, festivals, trade shows, product launches, and the film/TV/music industries; (c) Branding, sponsorship & endorsements — logos, trademarks, co-branding, athlete/celebrity endorsement deals, and sponsorship structures; and (d) Event marketing & promotion — promotional strategy, ticket sales, event-planning basics, and publicity/public relations for sports and entertainment properties. Keep the identity on the sports and entertainment industries specifically, not generic marketing.`,
    exercise_science: `Primary frameworks for Exercise Science / Sports Medicine — a nationally recognized pathway in the health-science family, DISTINCT from the general Health Science pathway (some states nest it under Health Science, others treat it as standalone; keep the identity on movement, exercise, athletic training, and sports-medicine careers). Lead the competency list with entries from these, and treat the state CTE task list above as the state verification layer for them:
- NASM (National Academy of Sports Medicine) — the recognized industry-credential anchor for this field; the course builds toward the NASM Certified Personal Trainer (NASM-CPT) credential. Align competencies (fitness assessment, exercise programming, anatomy/kinesiology, program design) to NASM standards. Framework field: "NASM". Note NASM-CPT is typically an 18+/post-secondary certification — treat it as a career goal students build toward, not one earned in a high-school course.
- HOSA — Future Health Professionals — the pathway CTSO (the same CTSO family as Health Science); align applied tasks, projects, and career exploration to relevant HOSA competitive events (e.g., Sports Medicine, Physical Therapy, CPR/First Aid). Framework field: "HOSA".
Then include entries from this where the lesson content maps to it:
- National Health Science Standards (NCHSE) — where anatomy & physiology, medical terminology, therapeutic-career, and safety content maps to the broader health-science foundations. Framework field: "NCHSE".
CPR / FIRST AID / AED — CRITICAL FRAMING (see the SAFETY & CERTIFICATION directive in this prompt): this field commonly includes CPR/First Aid/AED, but ACTUAL hands-on certification in these life-saving skills requires a certified instructor and approved provider (American Red Cross, American Heart Association, etc.) and CANNOT be conferred by a generated lesson. Frame any CPR/First Aid/AED content as knowledge/awareness that SUPPORTS (never replaces) formal certification training.
Content areas to prioritize: (a) Sports medicine team & therapeutic careers — the roles of the sports-medicine team (coach, athletic trainer, team physician, allied health) and career exploration across Athletic Training, Physical Therapy (PT/PTA), Occupational Therapy (OT/OTA), and Exercise Physiology; (b) Anatomy, physiology & kinesiology — body systems relevant to movement and exercise, applied to sports/exercise contexts; (c) Injury prevention & care — injury-prevention principles, basic taping/wrapping AWARENESS, and the healing/rehabilitation process (knowledge-level, NOT hands-on clinical certification); and (d) Fitness, nutrition & performance — sport-nutrition basics, exercise-programming concepts, and sport-psychology / performance-enhancement awareness. Keep the identity on exercise science and sports medicine, and keep any hands-on physical or clinical skill at the awareness/supervised level.`,
    early_childhood: `CRITICAL FRAMING — READ CAREFULLY AND FOLLOW EXACTLY: this is CAREER-EXPLORATION / PRE-PROFESSIONAL content for HIGH-SCHOOL students studying early childhood education as a future career. Every lesson teaches the TEENAGE student ABOUT the early-childhood field and the knowledge and skills a future early-childhood professional needs — it is NOT a lesson plan for teaching actual young children. This pathway is DISTINCT from PlansK12's separate Early Childhood / Pre-K module, which serves PRACTICING Pre-K teachers planning developmentally appropriate lessons for their own 3–5-year-old students. Here the learner is ALWAYS the high-schooler; any "activity for young children" a student plans is a PRACTICE ARTIFACT for the CTE course — rehearsed with peers, in the school's preschool lab, or in a supervised placement — never a lesson this tool generates for real preschoolers. Keep all child-guidance content on POSITIVE GUIDANCE (redirection, positive reinforcement, clear and consistent limits) — never discipline or punishment techniques.
Primary national frameworks for Early Childhood Education & Services — lead the competency list with entries from these, and treat the state CTE task list above as the state verification layer for them:
- Child Development Associate (CDA) — Council for Professional Recognition — the flagship national early-childhood credential this pathway builds toward, and the primary competency spine. Organized as 6 Competency Standards (I. establishing a safe, healthy learning environment; II. advancing physical & intellectual competence; III. supporting social & emotional development and providing positive guidance; IV. establishing productive relationships with families; V. ensuring a well-run, purposeful program responsive to participants' needs; VI. maintaining a commitment to professionalism) across 8 CDA Subject Areas (including child growth & development and observing & recording children's behavior). Framework field: "CDA". Anchor to the relevant Competency Standard / Subject Area; use exact numbering only when confident, otherwise describe the competency.
- NASAFACS Area 4.0 — Early Childhood, Education & Services (National Standards for Family & Consumer Sciences Education) — the FCS content framework for this program of study (career paths; developmentally appropriate practices; child development principles & theories; safe and healthy learning environments; developmentally appropriate guidance; curriculum planning). Framework field: "NASAFACS". Use "4.x" numbering only when confident; otherwise describe the competency.
- NAEYC (National Association for the Education of Young Children) — the profession's standards for quality practice: developmentally appropriate practice (DAP) and the NAEYC Code of Ethical Conduct — the "what good early-childhood practice looks like" anchor. Framework field: "NAEYC".
- CCTC — Human Services cluster, Early Childhood Development & Services pathway (Common Career Technical Core, Advance CTE) — the national CTE pathway performance elements. Framework field: "CCTC".
- FCCLA (Family, Career and Community Leaders of America) — the pathway CTSO; align applied tasks and projects to relevant FCCLA competitive events (especially the Early Childhood Education and Teach and Train STAR Events) and national programs. Framework field: "FCCLA".
Content areas to prioritize — the future-early-childhood-professional program of study, taught with real depth. Cover four content areas: (1) CHILD GROWTH & DEVELOPMENT — the developmental domains (physical/motor, cognitive, language, and social-emotional) and typical milestones from birth through age 5 (infant → toddler → preschooler), and the foundational theories an aspiring early-childhood professional must know (Piaget's cognitive stages, Erikson's psychosocial stages, Vygotsky's zone of proximal development & scaffolding, Maslow's hierarchy, and attachment — Bowlby/Ainsworth) — always connected to how young children learn and to practice, never developmental psychology for its own sake (CDA Subject Area on child growth & development; NASAFACS 4.x); (2) SAFE & HEALTHY LEARNING ENVIRONMENTS — HEALTH, SAFETY & NUTRITION — designing safe indoor/outdoor early-childhood environments, active supervision, sanitation and proper handwashing/diapering-safety routines, illness and injury prevention, emergency preparedness, and child nutrition & meal planning at an awareness level (including CACFP awareness), plus licensing/health-regulation and MANDATED-REPORTER AWARENESS (as "how the field works," never real casework) (CDA Competency Standard I); (3) DEVELOPMENTALLY APPROPRIATE PRACTICE, GUIDANCE & CURRICULUM — developmentally appropriate practice (NAEYC/DAP), POSITIVE GUIDANCE strategies, play-based learning centers, planning developmentally appropriate activities across the domains for a target age, and OBSERVATION & DOCUMENTATION (authentic/anecdotal records, running records) — the knowledge a future professional needs, practiced as CTE artifacts (in the preschool lab, with peers, or in a placement), not delivered as a real teacher's lesson (CDA Subject Areas on advancing development, positive guidance, and observing & recording); and (4) THE EARLY-CHILDHOOD PROFESSION — CAREERS, FAMILIES & PROFESSIONALISM — career pathways and the education ladder (childcare aide/teacher, preschool teacher, paraeducator, center director, family childcare provider → CDA → associate/bachelor's degree → state licensure), program types (childcare centers, Head Start, preschools, family childcare), family partnerships and culturally & linguistically responsive practice, and professional ethics (the NAEYC Code of Ethical Conduct) and licensing awareness (CDA Competency Standards IV & VI; CCTC). At the MIDDLE-SCHOOL exploratory tier, keep it age-appropriate CAREER AWARENESS — basic child development, babysitting / child-care readiness and safety, and awareness of careers working with young children — never the full pre-professional CDA depth. Keep every hands-on experience SUPERVISED and appropriate (the school's preschool/childcare lab, a licensed early-childhood center or Head Start under supervision, or observation/interviews with early-childhood professionals); a high-school pathway builds toward — and is never a substitute for — the CDA credential and state early-childhood licensure.`,
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
    hospitality: ["ProStart National Certificate of Achievement (COA) — the recognized culinary / restaurant-management credential: two national exams PLUS 400 mentored work-experience hours; a real, achievable student goal", "ServSafe Food Handler / Manager (National Restaurant Association)", "ACF (American Culinary Federation) Certified Fundamentals Cook (CFC) — for students beginning professional culinary training; plus AHLEI certifications (e.g., Certified Guest Service Professional) for lodging/guest-service content"],
    finance: ["W!SE Financial Literacy Certification", "FBLA competitive event recognition", "Jump$tart-aligned personal finance certificates"],
    marketing: ["DECA competitive event certifications (incl. fashion-specific events — Apparel & Accessories Marketing, Fashion/Buying & Merchandising — for fashion-marketing content)", "NBEA Marketing-aligned recognition", "FCCLA STAR Event recognition (for fashion-marketing content)", "A*S*K / Marketing industry micro-credentials"],
    human_services: ["AAFCS Pre-PAC certifications (e.g., Leadership Essentials, Nutrition/Food/Wellness, Food Science Fundamentals, and Fashion, Textiles & Apparel for fashion-design content)", "FCCLA competitive event & national program recognition — incl. the Fashion STAR Events (Fashion Design, Fashion Construction, Repurpose and Redesign) and the Fashion Sketch Skill Demonstration for fashion-design content", "ServSafe Food Handler (for foods/nutrition content)"],
    health_science: ["NHA certifications (e.g., CCMA Clinical Medical Assistant, CPT Phlebotomy Technician)", "DANB (Dental Assisting National Board) for dental-assisting lessons — CDA (Certified Dental Assistant), earned via three component exams: General Chairside (GC), Radiation Health & Safety (RHS), and Infection Control (ICE); plus NELDA (National Entry Level Dental Assistant), designed to be attainable through high-school dental-assisting coursework", "NNAAP (National Nurse Aide Assessment Program, via Credentia) for nurse-aide / CNA lessons — the CNA certification used by most state Nurse Aide Registries; a written/oral knowledge test plus a hands-on skills-demonstration, meeting the federal OBRA '87 nurse-aide training-and-competency requirement (distinct from Medical Assisting)", "CPR / First Aid certification (AHA or American Red Cross)", "HOSA competitive event & program recognition"],
    education: ["Educators Rising Micro-credentials & competitive event recognition", "Teacher Cadet Program completion & articulated / dual college credit (CERRA 'Experiencing Education')", "ETS ParaPro Assessment (entry-level paraeducator credential)"],
    career_readiness: ["Employability-skills badges / digital-literacy micro-credentials appropriate for middle school (e.g., typing proficiency, Google/Microsoft basics)", "IC3 Digital Literacy / IC3 Spark — the middle-school-level digital-literacy certification, plus typing/keyboarding certificates (Microsoft Office Specialist / MOS named only as a longer-term high-school goal)", "FBLA-Middle Level or SkillsUSA recognition (career-readiness competitive events)", "ACT WorkKeys National Career Readiness Certificate (NCRC) — introduced as a longer-term high-school/adult goal, not attained in middle school"],
    information_technology: ["CompTIA certification pathway — the real, sequential industry progression: IT Fundamentals+ (ITF+) on-ramp → A+ → Network+ → Security+ (Security+ is the recognized entry-level CYBERSECURITY credential); achievable, industry-recognized credentials students can genuinely pursue", "AP Computer Science Principles (CSP) and AP Computer Science A (CSA) — College Board courses with real college-credit potential; the recognized advanced-standing pathway for computer programming / CS (widely available via free curricula like Code.org and CodeHS)", "Web-design / development certificates & micro-credentials (e.g., Responsive Web Design, HTML & CSS); FBLA Website Design / Introduction to Programming / Cybersecurity competitive event recognition"],
    transportation: ["ASE Student Certification (ASE Education Foundation) — the recognized entry credential", "ASE Maintenance & Light Repair (MLR) certification track — the professional-technician goal", "SkillsUSA competitive-event recognition (e.g., Automotive Service Technology); OSHA-10 / shop-safety credential where offered"],
    manufacturing: ["NIMS credentials (e.g., Measurement, Materials & Safety; Machining Level I) — the recognized entry credentials", "MSSC Certified Production Technician (CPT); SACA Smart Automation / Industry 4.0 credentials", "SkillsUSA competitive-event recognition (e.g., Precision Machining, Automated Manufacturing); OSHA-10 general-industry safety"],
    engineering_tech: ["PLTW course credentials / end-of-course assessments (e.g., Introduction to Engineering Design, Principles of Engineering)", "FIRST / RECF (VEX) robotics competition recognition & engineering-notebook awards", "CertTEC Basic Electricity & Electronics (BEE) and Advanced Electricity & Electronics (AEE) — the Electronics I → II certification progression (via SpaceTEC)", "NCATT Aircraft Electronics Technician (AET) — the aerospace/avionics technician credential, framed as a post-secondary/industry goal for aerospace pathways", "SkillsUSA (e.g., Robotics & Automation, Engineering Technology); articulated college credit where offered"],
    business_mgmt: ["FBLA competitive-event recognition (e.g., Business Management, Organizational Leadership, Entrepreneurship)", "MBAResearch / NBEA-aligned business administration assessments & certificates", "Entrepreneurship & Small Business (ESB) or Microsoft Office Specialist (administrative skills) certifications where offered"],
    agriculture: ["FFA degrees, proficiency awards & Career Development Event (CDE) recognition (incl. the Veterinary Science CDE)", "Supervised Agricultural Experience (SAE) records & National FFA SAE recognition", "AFNR industry certifications where offered — e.g., NAVTA Approved Veterinary Assistant (AVA) for veterinary-science programs (building toward AVMA-CVTEA-accredited vet-tech pathways), pesticide applicator, ServSafe for food products, welding"],
    construction: ["EPA Section 608 Certification (federal Clean Air Act) — a MANDATORY LEGAL credential to service or handle regulated refrigerants (Type I / II / III / Universal); a real, achievable HVAC-R career goal", "NCCER Core & craft-area credentials (NCCER Registry) — the recognized entry credentials across the trades; plus trade-specific credentials such as AWS (American Welding Society) certification (e.g., Certified Welder) for welding", "OSHA-10 (Construction) safety card; SkillsUSA competitive-event recognition (Carpentry, Electrical, Plumbing, HVAC-R, Welding, Masonry, Sheet Metal); pre-apprenticeship certificates (NCCER / trade-council programs)"],
    arts_av: ["A portfolio / demo reel of finished creative work (including finished publications — a yearbook spread, newsletter, or magazine layout, and a yearbook-staff role) — the primary currency of this field", "Adobe Certified Professional (e.g., Photoshop, Illustrator, InDesign, Premiere Pro) where the program teaches those tools", "SkillsUSA competitive-event recognition (e.g., Graphic Communications, Television/Video Production, Photography)", "JEA (Journalism Education Association) / scholastic-press recognition and JEA certifications (for yearbook & journalism programs)"],
    government: ["A public-service / civics portfolio and projects (this cluster has no single dominant credential — content and demonstrated civic skill carry it)", "Recognition through civics & youth-government programs (e.g., YMCA Youth & Government, We the People, Model UN)", "General workplace/administrative certificates where offered (e.g., Microsoft Office Specialist)"],
    law_safety: ["A career-exploration & professionalism/ethics portfolio (this cluster's HS programs of study vary; no single dominant student credential)", "General/entry credentials tied to a program of study where offered (e.g., CPR/First Aid for fire-service exploration; OSHA general awareness)", "Recognition through related programs — exploration only (e.g., mock trial, Explorers/cadet or fire-cadet programs)"],
    cosmetology: ["A state cosmetology (or separate esthetics / nail-technician / barbering) LICENSE — the credential required to practice, earned by completing the state-mandated training hours and passing the NIC (or state) written and practical exams", "NIC national theory & practical exam readiness (used by 38+ states)", "SkillsUSA competitive-event recognition (Cosmetology, Esthetics, Nail Care). NOTE: required license hours and license categories vary significantly by state — verify with the state board."],
    business_law: ["FBLA competitive-event recognition (Business Law)", "DECA competitive-event recognition (Business Law & Ethics Team Decision-Making)", "A business-law & ethics portfolio and case-analysis work (this content area has no single dominant student credential — demonstrated legal-literacy and ethical-reasoning skill carry it); general NBEA/MBAResearch business assessments where offered"],
    sports_entertainment: ["Precision Exams (YouScience) Sports and Entertainment Marketing (Exam 416) industry certification", "DECA competitive-event recognition (Sports and Entertainment Marketing Team Decision Making; Sports and Entertainment Marketing Series)", "A sports/entertainment marketing portfolio — a sponsorship or endorsement pitch, a promotion/event-marketing plan, or a branding concept"],
    exercise_science: ["NASM Certified Personal Trainer (NASM-CPT) — the industry credential this course builds toward (typically earned at 18+/post-secondary)", "HOSA competitive-event & program recognition (e.g., Sports Medicine, Physical Therapy)", "CPR / First Aid / AED certification — earned ONLY through a certified instructor and approved provider (American Red Cross / American Heart Association), never the generated course itself; the lesson builds supporting knowledge only"],
    early_childhood: ["Child Development Associate (CDA) credential (Council for Professional Recognition) — the flagship national early-childhood credential; HS CTE completers build the CDA Professional Portfolio and, with the required training and experience hours, sit for the exam and verification visit", "FCCLA competitive-event & national-program recognition — especially the Early Childhood Education and Teach and Train STAR Events", "AAFCS Pre-PAC (e.g., Education Fundamentals / Early Childhood) where offered", "Pediatric CPR / First Aid certification (American Red Cross / American Heart Association) — commonly required for childcare work, earned through a certified instructor", "State early-childhood / childcare entry credentials — verify against your state"],
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
    career_readiness: {
      warm_up: {
        name: "Career Hook",
        desc: "Open with a concrete, relatable career moment for a 7th/8th grader — a 'what would you do at work?' scenario, a surprising job or salary fact, a short clip of a real worker, or a quick interest poll. Students react and connect it to a real job, career cluster, or workplace situation they can picture. Keep it exploratory and awareness-level, not mastery. 5–8 minutes.",
      },
      whole_group_instruction: {
        name: "Direct Instruction",
        desc: "Teach the core career-readiness or employability concept directly using correct but middle-school-accessible vocabulary (career cluster, interests vs. skills vs. values, employability skill, professionalism, digital literacy, goal-setting). Ground it in the relevant Employability Skills Framework category (Applied Knowledge, Effective Relationships, or Workplace Skills). Address a common misconception (e.g., 'you have to know your exact career now') and check understanding before practice. 8–12 minutes.",
      },
      fitness_activities: {
        name: "Skill Model / Guided Practice",
        desc: "Model the employability or career-readiness skill step by step the way it's used at work — writing a professional email, a confident introduction and handshake, sorting careers into clusters, a short self-assessment, or basic slide/document formatting. Name each step and why it matters on the job. Students watch, then walk through it once with teacher support. 5–10 minutes.",
      },
      independent_practice: {
        name: "Hands-On Career Application",
        desc: "Students apply the skill in a realistic but age-appropriate task: complete an interest/strengths self-assessment and map results to career clusters; draft and send a professional email; build a short 'about me / my future' presentation; prepare and practice informational-interview questions; or draft an age-appropriate resume or activity/application. Describe exactly what students do, what a strong result looks like, and what the teacher observes and coaches. Include a simple checklist or rubric tied to an Employability Skills Framework category. 15–20 minutes.",
      },
      closure: {
        name: "Reflection & Next-Steps Connection",
        desc: "Students reflect on what today's activity means for their own future and name one career cluster or high-school CTE pathway they want to explore next, plus one employability skill they'll keep building. Reinforce that middle-school foundations set up their high-school CTE choices. End with a brief exit ticket. 5–8 minutes.",
      },
    },
    information_technology: {
      warm_up: {
        name: "Tech Hook",
        desc: "Open with a concrete web/IT moment — a real website shown good vs. broken/poor UX, a viral app or tech product, a 'how does this actually work?' question about the internet, or a short clip. Students react and connect it to a real site, tool, or technology career they can picture. Keep it accessible. 5–8 minutes.",
      },
      whole_group_instruction: {
        name: "Concept Instruction",
        desc: "Teach the core web-design or IT concept directly using correct vocabulary (HTML tag/element, CSS style/selector, layout, responsive design, UX, wireframe, algorithm, network, cybersecurity). Ground it in the relevant ISTE standard (Innovative Designer / Computational Thinker) or CSTA concept. Address a common misconception and check understanding before students build. 8–12 minutes.",
      },
      fitness_activities: {
        name: "Guided Build / Demonstration",
        desc: "Model the technical skill step by step the way it's done in practice — writing a small block of HTML/CSS, structuring a page, applying a style, sketching a wireframe, or running one plan→build→test cycle. Name each step and the reason for it. Students watch, then walk through it once with teacher support (live-coding or hands-on). Keep tools tool-agnostic where possible. 5–10 minutes.",
      },
      independent_practice: {
        name: "Hands-On Build",
        desc: "Students apply the skill in a realistic, tool-agnostic build: code or edit a simple web page, design a wireframe/layout, improve a page's UX, run test-and-revise against a checklist, or (at the MS Exploratory level) complete a computing / digital-literacy / cybersecurity task. Describe exactly what students do, what a strong result looks like, and what the teacher observes and coaches. Include a checklist or rubric tied to an ISTE or CSTA competency. 15–20 minutes.",
      },
      closure: {
        name: "Reflection & Career Connection",
        desc: "Students reflect on how today's skill fits real web/IT work and a technology career, share or peer-review a build, and name one thing they'd add to a portfolio or improve next time. Connect the skill to the credential it builds toward (CompTIA ITF+) and a career path. End with a brief exit ticket. 5–8 minutes.",
      },
    },
    transportation: {
      warm_up: {
        name: "Shop Hook",
        desc: "Open with a concrete automotive/transportation scenario — a real symptom ('the car pulls to one side when braking'), a viral car-repair moment, a named vehicle system, or a short clip from a real shop. Students react as a technician would: what could cause this, and what's the first SAFE thing to do? Connect to a real role or employer. 5–8 minutes.",
      },
      whole_group_instruction: {
        name: "Concept Instruction",
        desc: "Teach the core automotive/transportation concept or procedure directly using correct technician vocabulary (system/component names, tool names, service terms). Ground it in the relevant ASE MLR area. ALWAYS teach the safety point for this content to standard BEFORE any demonstration (proper lift points and jack/jack-stand use, PPE, tool inspection, disconnecting power/battery, ventilation). Address a common misconception and check understanding. 8–12 minutes.",
      },
      fitness_activities: {
        name: "Skill Demonstration",
        desc: "Model the service skill step by step the way a technician does it in a real shop — raising a vehicle to the correct lift points, inspecting brakes, checking suspension/steering play, using a meter, or reading a service procedure — narrating EACH step AND its safety control (chock the wheels, set the lift/jack stands, wear eye protection, keep the area clear). Students watch, then walk through it once with close teacher support. 5–10 minutes.",
      },
      independent_practice: {
        name: "Hands-On Shop Application",
        desc: "Students apply the skill in a realistic, tier-appropriate lab/simulation: perform or simulate an inspection or service task, use a service manual to identify a procedure, work a diagnostic case, or (at the MS Exploratory level) a hands-on component-ID or cluster-exploration station. State exactly what students do, what a competent result looks like, and what the teacher SUPERVISES. Include a checklist/rubric aligned to the ASE MLR task, and require the relevant safety steps to be checked off before and during work. Emphasize direct supervision. 15–20 minutes.",
      },
      closure: {
        name: "Reflection & Career Connection",
        desc: "Students reflect on how today's skill fits real service work and an automotive/transportation career, and name one safe-work habit and one thing they'd verify next time. Connect the skill to the credential it builds toward (ASE Student Certification) and a SkillsUSA event or apprenticeship. End with a brief exit ticket. 5–8 minutes.",
      },
    },
    manufacturing: {
      warm_up: {
        name: "Shop-Floor Hook",
        desc: "Open with a concrete manufacturing scenario — a real product and 'how is this made?', a smart-factory / robotics / 3D-printing clip, a defective vs. in-spec part, or a named process (machining, welding, additive). Students react as a technician would: what process made this, and what's the first SAFE step? Connect to a real employer or role. 5–8 minutes.",
      },
      whole_group_instruction: {
        name: "Concept Instruction",
        desc: "Teach the core manufacturing or Industry 4.0 concept/procedure directly using correct vocabulary (process and machine names, tolerance, GD&T, CNC, PLC, IIoT, robotics, automation, lockout/tagout). Ground it in the relevant NIMS area (and Smart Manufacturing / Industry 4.0 where applicable). ALWAYS teach the safety point to standard BEFORE any demonstration (machine guarding, PPE, lockout/tagout, safe material handling). Address a common misconception and check understanding. 8–12 minutes.",
      },
      fitness_activities: {
        name: "Skill Demonstration",
        desc: "Model the manufacturing skill step by step the way it's done on the shop floor — taking a precision measurement, reading a print/blueprint, setting up or simulating a machine/CNC operation, a bench task, or a robotics/automation demo — narrating EACH step AND its safety control (guards in place, PPE, lockout/tagout, clear work area, no loose clothing near rotating tools). Students watch, then walk through it once with close teacher support. 5–10 minutes.",
      },
      independent_practice: {
        name: "Hands-On Production Application",
        desc: "Students apply the skill in a realistic, tier-appropriate lab/simulation: take and record precision measurements, read a blueprint and identify features/tolerances, run a quality-control check, program or simulate a CNC / robotics / automation task, or (at the MS Exploratory level) a hands-on process-ID or Industry-4.0 exploration station. State exactly what students do, what an in-spec result looks like, and what the teacher SUPERVISES. Include a checklist/rubric aligned to a NIMS competency, and require the relevant safety steps to be checked off before and during work. Emphasize direct supervision. 15–20 minutes.",
      },
      closure: {
        name: "Reflection & Career Connection",
        desc: "Students reflect on how today's skill fits real production work and a modern (smart) manufacturing career, and name one safe-work habit and one quality/precision practice they'd carry forward. Connect the skill to the credential it builds toward (NIMS / MSSC CPT) and a SkillsUSA event or apprenticeship. End with a brief exit ticket. 5–8 minutes.",
      },
    },
    engineering_tech: {
      warm_up: {
        name: "Engineering Challenge Hook",
        desc: "Open with a concrete engineering/technology moment — a real design problem ('how would you design…?'), a robotics or engineering-fail clip, a named engineering discipline or product, or a quick design-thinking prompt. Students react as an engineer would: what's the problem, and what constraints and criteria matter? Connect to a real engineering field, employer, or role. 5–8 minutes.",
      },
      whole_group_instruction: {
        name: "Concept Instruction",
        desc: "Teach the core engineering, computing, or robotics concept directly using correct vocabulary (engineering design process, constraints/criteria, prototype, iteration, algorithm, loop/conditional, sensor/actuator, subsystem). Ground it in PLTW and the Engineering Design Process (Ask → Imagine → Plan → Create → Improve), and in FIRST/RECF for robotics. Address a common misconception (e.g., 'the first design should be perfect') and check understanding. 8–12 minutes.",
      },
      fitness_activities: {
        name: "Guided Design / Build Demonstration",
        desc: "Model the engineering skill step by step the way it's done in practice — sketching and planning a design against constraints, wiring or programming a robot subsystem, writing and testing a short algorithm, or documenting a decision in an engineering notebook. Name each step and which EDP phase it targets. Students watch, then walk through it once with teacher support. 5–10 minutes.",
      },
      independent_practice: {
        name: "Hands-On Engineering Application",
        desc: "Students apply the skill in a realistic, tier-appropriate task: run an EDP cycle on a real design/robotics/computing challenge, build and program a robot behavior, code and debug a short program, or prototype and test against defined criteria — or, at the MS Exploratory level, an engineering-field or design-thinking exploration station. State exactly what students do, what a strong result looks like, and what the teacher observes/coaches. Include a checklist or rubric aligned to the EDP and PLTW/FIRST expectations, and have students document their decisions (engineering-notebook style). 15–20 minutes.",
      },
      closure: {
        name: "Reflection & Career Connection",
        desc: "Students reflect on how today's work maps to the engineering design process and a real engineering/technology career, share or peer-review a design/build, and name one improvement for the next iteration. Connect the skill to PLTW/FIRST pathways, an engineering discipline, and postsecondary/industry options. End with a brief exit ticket. 5–8 minutes.",
      },
    },
    business_mgmt: {
      warm_up: {
        name: "Business Hook",
        desc: "Open with a concrete business/management scenario — a real company decision, a 'you're the manager, what would you do?' dilemma, a startup or leadership story, or a short clip. Students react as a manager or owner would: what's the business problem, and what are the trade-offs? Connect to a real company, role, or entrepreneur. 5–8 minutes.",
      },
      whole_group_instruction: {
        name: "Concept Instruction",
        desc: "Teach the core business-management concept directly using correct vocabulary (the management functions — planning, organizing, leading, controlling; business structures; supply & demand; HR/operations terms; profit, budget, ROI). Ground it in the relevant NBEA / MBA Research standard. Address a common misconception (e.g., 'a manager just tells people what to do') and check understanding. 8–12 minutes.",
      },
      fitness_activities: {
        name: "Applied Example / Guided Practice",
        desc: "Model the business skill step by step the way it's done in an organization — building a simple org chart or plan, working a decision-making framework, drafting a basic operating budget, writing a job description, or analyzing a short business case. Name each step and the management principle behind it. Students watch, then walk through it once with teacher support. 5–10 minutes.",
      },
      independent_practice: {
        name: "Hands-On Business Application",
        desc: "Students apply the skill in a realistic task: make and justify a management decision from a case, build a basic operating budget or plan, design an org structure or workflow, draft an HR document, or develop a mini business / entrepreneurship plan. Describe exactly what students do, what a strong result looks like, and what the teacher observes/coaches. Include a checklist or rubric aligned to an NBEA / MBA Research competency or an FBLA event, and connect it to real business operations. 15–20 minutes.",
      },
      closure: {
        name: "Reflection & Career Connection",
        desc: "Students reflect on how today's skill fits running a real organization and a business-management or entrepreneurship career, share a decision or plan, and name one management principle they'd apply. Connect the skill to an FBLA event and a business/management career pathway. End with a brief exit ticket. 5–8 minutes.",
      },
    },
    agriculture: {
      warm_up: {
        name: "Ag Hook",
        desc: "Open with a concrete agriculture / food / natural-resources scenario — a real farm, ranch, or food-system moment, a plant/animal/conservation problem ('why is this crop failing?'), a local ag product, or a short clip. Students react as an ag professional would: what's going on, and what would you check first? Connect to a real AFNR role, employer, or a possible SAE opportunity. 5–8 minutes.",
      },
      whole_group_instruction: {
        name: "Concept Instruction",
        desc: "Teach the core AFNR concept directly using correct vocabulary (plant/animal systems terms, soil, nutrients, husbandry, conservation, agribusiness/supply-chain terms). Ground it in the relevant AFNR pathway standard (Plant, Animal, Natural Resource, or Agribusiness Systems). Address a common misconception and check understanding before hands-on work. 8–12 minutes.",
      },
      fitness_activities: {
        name: "Skill Demonstration",
        desc: "Model the agricultural skill or procedure step by step the way it's done in the field, lab, or shop — a plant or soil test, an animal-handling or husbandry technique, a conservation / water-quality measurement, or an agribusiness calculation — naming each step and any safety or animal-welfare point. Students watch, then walk through it once with teacher support. 5–10 minutes.",
      },
      independent_practice: {
        name: "Hands-On Ag Application",
        desc: "Students apply the skill in a realistic, tier-appropriate lab/field task: run a plant/soil/water investigation, practice an animal-care or husbandry task (or simulation), analyze a natural-resource/conservation scenario, or work an agribusiness / marketing-of-ag-products problem. Where it fits, connect the task to a possible Supervised Agricultural Experience (SAE) project. Describe exactly what students do, what a strong result looks like, and what the teacher observes/coaches. Include a checklist or rubric aligned to an AFNR competency or an FFA CDE. 15–20 minutes.",
      },
      closure: {
        name: "Reflection & Career Connection",
        desc: "Students reflect on how today's skill fits real agriculture / natural-resources work and a career in the cluster, and name one idea they could turn into a Supervised Agricultural Experience (SAE) or explore through FFA. Connect the skill to an FFA CDE/degree and an AFNR career pathway. End with a brief exit ticket. 5–8 minutes.",
      },
    },
    construction: {
      warm_up: {
        name: "Jobsite Hook",
        desc: "Open with a concrete construction / architecture scenario — a real building or structure, a 'how was this built / how would you build it?' question, a jobsite problem, or a short clip. Students react as a tradesperson or designer would: what's the task, and what's the first SAFE step? Connect to a real trade, project, or employer. 5–8 minutes.",
      },
      whole_group_instruction: {
        name: "Concept Instruction",
        desc: "Teach the core construction / architecture concept or procedure directly using correct vocabulary (construction-drawing/blueprint terms, building systems, material and tool names, trade terms, load/structure/framing). Ground it in the relevant NCCER Core or craft module. ALWAYS teach the safety point to standard BEFORE any demonstration (fall protection, ladder/scaffold use, tool safety, PPE, electrical hazards). Address a common misconception and check understanding. 8–12 minutes.",
      },
      fitness_activities: {
        name: "Skill Demonstration",
        desc: "Model the construction skill step by step the way it's done on a jobsite or in a shop — reading/scaling a construction drawing, measuring and marking a layout, a hand/power-tool technique, or a framing / wiring / piping sequence — narrating EACH step AND its safety control (ladder/scaffold and fall protection, tool guards and inspection, PPE, keeping the area clear). Students watch, then walk through it once with close teacher support. 5–10 minutes.",
      },
      independent_practice: {
        name: "Hands-On Construction Application",
        desc: "Students apply the skill in a realistic, tier-appropriate lab/shop task: read or sketch a construction drawing, complete a measurement/layout task, build or simulate a small assembly, work a trade-specific station (electrical / plumbing / HVAC / carpentry), or (at the MS Exploratory level) a hands-on trades-exploration or design-thinking station. State exactly what students do, what a quality/in-spec result looks like, and what the teacher SUPERVISES. Include a checklist/rubric aligned to an NCCER competency, and require the relevant safety steps to be checked off before and during work. Emphasize direct supervision. 15–20 minutes.",
      },
      closure: {
        name: "Reflection & Career Connection",
        desc: "Students reflect on how today's skill fits real construction / architecture work and a career in the trades, and name one safe-work habit and one thing they'd verify next time. Connect the skill to the credential it builds toward (NCCER / OSHA-10) and a SkillsUSA event or apprenticeship. End with a brief exit ticket. 5–8 minutes.",
      },
    },
    arts_av: {
      warm_up: {
        name: "Creative Hook",
        desc: "Open with a concrete arts/media moment — a strong vs. weak design, a viral video or news clip, a real logo/poster/ad, or a 'how would you tell this story?' prompt. Students react as a creative professional or communicator would: what works, what's the message, and who's the audience? Connect to a real creative/media role, product, or employer. 5–8 minutes.",
      },
      whole_group_instruction: {
        name: "Concept Instruction",
        desc: "Teach the core design/media/communications concept directly using correct vocabulary (design principles — balance, contrast, hierarchy, alignment; typography; shot types/framing; story arc; interview/reporting terms; resolution/format). Ground it in the relevant CCTC pathway (AR-VIS, AR-AV, AR-JB, or AR-PRT). Keep any software reference tool-agnostic. Address a common misconception and check understanding. 8–12 minutes.",
      },
      fitness_activities: {
        name: "Guided Create / Demonstration",
        desc: "Model the creative skill step by step the way a pro works — sketching a layout to design principles, planning shots or a storyboard, structuring an interview or a news lede, or setting up a simple print/export — narrating each choice and the reason behind it. Keep tools tool-agnostic where possible. Students watch, then walk through it once with teacher support. 5–10 minutes.",
      },
      independent_practice: {
        name: "Hands-On Production",
        desc: "Students apply the skill in a realistic, tier-appropriate production task: design a simple layout/graphic to design principles, plan or shoot/edit a short video segment, write and structure a news/interview piece, build a small digital/interactive artifact, or plan a print project with a QC check. Have students critique and iterate, and add the piece to a portfolio. Describe exactly what students do, what a strong result looks like, and what the teacher observes/coaches. Include a checklist or rubric aligned to a CCTC performance element. 15–20 minutes.",
      },
      closure: {
        name: "Reflection & Career Connection",
        desc: "Students reflect on how today's work fits real creative/communications production and a media career, share or peer-critique a piece, and name one revision for the next iteration and one thing to add to their portfolio. Connect the skill to a SkillsUSA event, an Adobe-certification skill, and an arts/AV/communications career pathway. End with a brief exit ticket. 5–8 minutes.",
      },
    },
    government: {
      warm_up: {
        name: "Civic Hook",
        desc: "Open with a concrete government / public-service scenario — a real local issue ('should the city build a new park or fix the roads?'), a policy or news moment, a public agency at work, or a 'you're the official, what would you decide?' prompt. Students react as a public servant or citizen would: what's the problem, who does it affect, and who decides? Connect to a real level of government, agency, or role. 5–8 minutes.",
      },
      whole_group_instruction: {
        name: "Concept Instruction",
        desc: "Teach the core government / public-administration concept directly using correct vocabulary (branches and levels of government, policy, legislation, public agency, budget/revenue, regulation, jurisdiction, checks and balances). Ground it in the relevant CCTC Government & Public Administration (GV) performance element. Address a common misconception and check understanding. 8–12 minutes.",
      },
      fitness_activities: {
        name: "Applied Example / Guided Practice",
        desc: "Model the civic/administrative skill step by step the way it's done in the public sector — tracing how a bill becomes law, mapping which agency and level of government handles a problem, reading a simple public budget, drafting a policy proposal or a public-service announcement, or working a decision-making framework for a public issue. Name each step and the civic principle behind it. Students watch, then walk through it once with teacher support. 5–10 minutes.",
      },
      independent_practice: {
        name: "Hands-On Civic Application",
        desc: "Students apply the skill in a realistic task: analyze a public issue and recommend a policy, simulate a council/agency decision or a mock-government role, map a public service to the agency and level of government that provides it, draft a proposal or civic communication, or work a basic public-budget / regulation scenario. Describe exactly what students do, what a strong result looks like, and what the teacher observes/coaches. Include a checklist or rubric aligned to a CCTC GV performance element, and connect it to real public service. 15–20 minutes.",
      },
      closure: {
        name: "Reflection & Career Connection",
        desc: "Students reflect on how today's work fits real public service and a government / public-administration career, share a decision or proposal, and name one way government affects their community. Connect the skill to a public-service career pathway (governance, public management, planning, or a public-service role) and a civic program or internship. End with a brief exit ticket. 5–8 minutes.",
      },
    },
    law_safety: {
      warm_up: {
        name: "Case / Scenario Hook",
        desc: "Open with a concrete, age-appropriate scenario from the justice, legal, corrections, or fire-service world — a 'what happens next in the system?' question, a career moment, an ethics dilemma, or a short clip. Students react as a professional or informed citizen would: what's the situation, who's involved, and what does the SYSTEM do? Keep it exploratory and educational — no operational tactics. Connect to a real role or agency. 5–8 minutes.",
      },
      whole_group_instruction: {
        name: "Concept Instruction",
        desc: "Teach the core concept directly using correct vocabulary (branches of the justice system, due process, jurisdiction, corrections, court roles, legal terms, fire behavior/prevention terms, chain of command, ethics). Ground it in the relevant CCTC LW performance element. Keep content to how systems work, careers, and professionalism — NOT operational procedures or legal advice. Address a common misconception and check understanding. 8–12 minutes.",
      },
      fitness_activities: {
        name: "Applied Example / Guided Practice",
        desc: "Model the skill step by step in an educational, exploration-appropriate way — tracing a case through the court process, mapping a career path and its requirements, analyzing an ethics scenario against a code of conduct, or reviewing fire-safety/prevention concepts. Name each step and the professional principle behind it. For fire-service content, keep it awareness-level and safe. Students watch, then walk through it once with teacher support. 5–10 minutes.",
      },
      independent_practice: {
        name: "Hands-On Exploration Application",
        desc: "Students apply the skill in a realistic, EDUCATIONAL task: trace a case through the justice system, research and map a public-safety/legal career path and its requirements, run a mock-trial or mock-hearing role (exploration), analyze an ethics/professionalism scenario, or complete a fire-service career/safety-awareness activity. Keep everything exploratory — no operational tactics, no legal advice. Describe exactly what students do, what a strong result looks like, and what the teacher observes/coaches. Include a checklist or rubric aligned to a CCTC LW performance element. 15–20 minutes.",
      },
      closure: {
        name: "Reflection & Career Connection",
        desc: "Students reflect on how today's work fits a real career in law, public safety, corrections, or fire service, share a decision or finding, and name one professional value (integrity, fairness, service) that matters in this field. Connect the skill to a specific career path and its education/training requirements, and to a job-shadow, ride-along, or mentorship opportunity. End with a brief exit ticket. 5–8 minutes.",
      },
    },
    cosmetology: {
      warm_up: {
        name: "Client / Scenario Hook",
        desc: "Open with a concrete salon / personal-care scenario — a client-consultation moment, a 'what would a licensed pro check first?' sanitation or safety question, a before/after service, or a short demo clip. Students react as a licensed professional would: what does the client need, and what safety/sanitation step comes first? Connect to a real service and career. 5–8 minutes.",
      },
      whole_group_instruction: {
        name: "Concept Instruction",
        desc: "Teach the core cosmetology concept directly using correct vocabulary (e.g., disinfection vs. sanitation, patch/predisposition test, hair elasticity/porosity, pH, sectioning/partings, cuticle, viscosity). Ground it in the relevant NIC content domain. ALWAYS tie the concept to its infection-control and chemical-safety implications. Address a common misconception and check understanding before any hands-on work. 8–12 minutes.",
      },
      fitness_activities: {
        name: "Skill Demonstration",
        desc: "Model the service skill step by step the way a licensed professional performs it — draping and sanitation setup, disinfected implements, sectioning, the tool/product motion, and the safety checkpoints (PPE, patch test, ventilation). Name each step and the standard behind it, and for any chemical or sharp-tool step foreground the specific hazard and its control. Students watch, then walk through the low-risk steps once with teacher support. 5–10 minutes.",
      },
      independent_practice: {
        name: "Hands-On Application (Supervised)",
        desc: "Students apply the skill in a realistic, SUPERVISED task on a mannequin/training head, hand replica, or peer ONLY where school policy allows and under required supervision and PPE — e.g., a sectioning/parting pattern, a basic cutting or styling technique, a manicure setup and sanitation routine, a facial-step sequence, or a station-disinfection procedure. Describe exactly what students do, what a competent result looks like, what the teacher observes/coaches, and the sanitation/PPE checklist. Include a rubric aligned to a NIC domain or a SkillsUSA event. 15–20 minutes.",
      },
      closure: {
        name: "Reflection & Career / Licensing Connection",
        desc: "Students reflect on how today's skill fits a real personal-care career and the path to licensure, name one infection-control or safety practice they will always follow, and connect the skill to the NIC exam domain it supports. Remind students that required license hours, categories, and exam requirements VARY BY STATE and must be verified with their own state board. End with a brief exit ticket. 5–8 minutes.",
      },
    },
    business_law: {
      warm_up: {
        name: "Case / Scenario Hook",
        desc: "Open with a concrete, age-appropriate business-law scenario — a contract dispute, a consumer-protection situation, a workplace/employment question, or a business-ethics dilemma. Students react as an informed business person or consumer would: what's the legal or ethical issue, who's involved, and what does the law/ethics framework say? Keep it educational and conceptual — no legal advice. Connect to a real business or consumer situation. 5–8 minutes.",
      },
      whole_group_instruction: {
        name: "Concept Instruction",
        desc: "Teach the core business-law concept directly using correct vocabulary (e.g., offer/acceptance/consideration, breach, civil vs. criminal, jurisdiction, agency, at-will employment, consumer protection). Ground it in the relevant NBEA Business Law strand. Emphasize how the concept applies to real business conduct and why it matters, and keep it conceptual — how the law WORKS, not legal advice. Address a common misconception and check understanding. 8–12 minutes.",
      },
      fitness_activities: {
        name: "Applied Example / Guided Practice",
        desc: "Model the reasoning step by step in an educational way — walking a contract through formation and a possible breach, tracing a consumer-protection or employment situation against the relevant rule, or analyzing an ethics dilemma against a decision framework. Name each step and the legal/ethical principle behind it; keep it analytical and conceptual, not advice for a real dispute. Students watch, then work one example with teacher support. 5–10 minutes.",
      },
      independent_practice: {
        name: "Hands-On Case Analysis",
        desc: "Students apply the skill in a realistic, EDUCATIONAL task: analyze a business-law case or scenario, run an FBLA/DECA-style case-study or role-play (business ethics / decision-making), evaluate a sample contract clause, or map a workplace/consumer situation to the relevant rule and recommend a BUSINESS (not legal) course of action. Keep everything conceptual — no legal advice. Describe exactly what students do, what a strong result looks like, and what the teacher observes/coaches. Include a checklist or rubric aligned to an NBEA Business Law strand or an FBLA/DECA event. 15–20 minutes.",
      },
      closure: {
        name: "Reflection & Career Connection",
        desc: "Students reflect on how today's concept applies to running or working in a real business and to consumers, share a decision or finding, and name one legal-literacy or ethics principle they'd apply. Connect the skill to a business-law/ethics career pathway (paralegal, compliance, HR, business owner) and an FBLA/DECA event, and to an internship or mentorship opportunity. End with a brief exit ticket. 5–8 minutes.",
      },
    },
    sports_entertainment: {
      warm_up: {
        name: "Industry Hook",
        desc: "Open with a real sports or entertainment marketing moment — a viral sponsorship, an athlete endorsement deal, a concert/festival promotion, a team's ticket campaign, or a product-launch tie-in. Students react as a marketer would: what's the property, who's the target audience, and what's the marketing goal? Connect to a real team, brand, venue, or event. 5–8 minutes.",
      },
      whole_group_instruction: {
        name: "Concept Instruction",
        desc: "Teach the core sports/entertainment marketing concept directly using correct vocabulary (e.g., the marketing mix applied to a property, sponsorship vs. endorsement, co-branding, licensing, gate vs. media revenue, target market, promotional mix). Ground it in the relevant Precision Exams 416 objective or DECA performance indicator. Address a common misconception and check understanding. 8–12 minutes.",
      },
      fitness_activities: {
        name: "Applied Example / Guided Practice",
        desc: "Model the skill step by step with a real sports/entertainment scenario — analyzing a sponsorship fit, mapping a promotional plan for an event, positioning an athlete's personal brand, or evaluating a ticket-pricing/promotion strategy. Name each step and the marketing principle behind it. Students watch, then work one example with teacher support. 5–10 minutes.",
      },
      independent_practice: {
        name: "Hands-On Marketing Application",
        desc: "Students apply the skill in a realistic, DECA-style task: build a sponsorship or endorsement pitch, design a promotion/event-marketing plan for a real (or realistic) property, develop a branding/logo-and-licensing concept, or run an SEM role-play / case-study decision. Describe exactly what students do, what a strong result looks like, and what the teacher observes/coaches. Include a checklist or rubric aligned to a Precision Exams 416 objective or a DECA SEM event. 15–20 minutes.",
      },
      closure: {
        name: "Reflection & Career Connection",
        desc: "Students reflect on how today's skill fits a real sports/entertainment marketing career (team/league marketing, agency, venue, event promotion, brand sponsorship), share their plan or decision, and name one marketing principle they'd apply. Connect the skill to a DECA SEM event and to an internship or job-shadow opportunity with a franchise, venue, or entertainment company. End with a brief exit ticket. 5–8 minutes.",
      },
    },
    exercise_science: {
      warm_up: {
        name: "Scenario Hook",
        desc: "Open with a concrete sports-medicine or exercise scenario — an athlete's injury on the field, a personal-training client's fitness goal, a rehab milestone, or a nutrition/performance question. Students react as a member of the sports-medicine team would: what's happening in the body, who on the team responds, and what's the goal? Keep it educational and awareness-level. Connect to a real role or career. 5–8 minutes.",
      },
      whole_group_instruction: {
        name: "Concept Instruction",
        desc: "Teach the core exercise-science / sports-medicine concept directly using correct vocabulary (e.g., anatomical planes, muscle actions, RICE, range of motion, kinesiology terms, macronutrients, target heart rate, sports-medicine team roles). Ground it in the relevant NASM or HOSA/NCHSE standard. For ANY CPR/first-aid/AED or hands-on skill, frame it as knowledge that SUPPORTS formal certification — never a substitute. Address a common misconception and check understanding. 8–12 minutes.",
      },
      fitness_activities: {
        name: "Skill Demonstration / Guided Practice",
        desc: "Model the concept step by step in an educational, awareness-level way — identifying muscles/joints in a movement, walking through an injury-prevention or RICE sequence, demonstrating a taping/wrapping technique for AWARENESS (not certification), or reading a simple exercise-program or nutrition plan. Name each step and the principle behind it; any physical demonstration is supervised and low-risk. Students watch, then try a low-risk step with teacher support. 5–10 minutes.",
      },
      independent_practice: {
        name: "Hands-On Application (Supervised)",
        desc: "Students apply the skill in a realistic, SUPERVISED, awareness-level task: map the sports-medicine team's roles for a scenario, analyze a movement using anatomy/kinesiology, design a basic exercise or injury-prevention plan, evaluate a sport-nutrition choice, or practice a taping/wrapping technique for AWARENESS on a peer or manikin ONLY where school policy allows and under supervision. Keep everything knowledge/awareness-level — no clinical treatment, no certification claim. Describe exactly what students do, what a strong result looks like, and what the teacher observes/coaches. Include a checklist or rubric aligned to a NASM or HOSA standard. 15–20 minutes.",
      },
      closure: {
        name: "Reflection & Career Connection",
        desc: "Students reflect on how today's concept fits a real sports-medicine or exercise-science career (athletic trainer, PT/PTA, OT/OTA, exercise physiologist, personal trainer), share a finding or plan, and name one principle they'd apply. Connect the skill to the NASM-CPT / HOSA pathway and to a job-shadow or internship (athletic training room, clinic, fitness facility). Remind students that CPR/first-aid/AED and clinical skills require certified instruction. End with a brief exit ticket. 5–8 minutes.",
      },
    },
    early_childhood: {
      warm_up: {
        name: "Child-Focused Hook",
        desc: "Open with a concrete early-childhood scenario — a toddler's tantrum, a preschooler's endless 'why?', a safety situation in a childcare room, or a developmental-milestone moment. Students react as a future early-childhood professional would: what's developmentally going on, and what would a skilled caregiver do? Keep it career-exploration framed. Connect to a real role or setting. 5–8 minutes.",
      },
      whole_group_instruction: {
        name: "Concept Instruction",
        desc: "Teach the core early-childhood concept directly using correct professional vocabulary (developmentally appropriate practice, developmental milestone, positive guidance, learning center, anecdotal observation, scaffolding). Ground it in the relevant CDA Competency Standard / Subject Area or NASAFACS 4.0 standard. Address a common misconception about young children and check understanding before the demonstration. 8–12 minutes.",
      },
      fitness_activities: {
        name: "Skill Demonstration",
        desc: "Model the early-childhood skill step by step the way it is done in a childcare/preschool setting — setting up an age-appropriate learning center or activity, a positive-guidance move (redirection, offering limited choices), a safe-environment or handwashing routine, or writing an anecdotal observation. Name each step and the developmental reason for it. Students watch, then walk through one step with teacher support. 5–10 minutes.",
      },
      independent_practice: {
        name: "Hands-On Application",
        desc: "Students apply the skill in a realistic lab, simulation, or project: plan a developmentally appropriate activity for a specific age, set up a learning center, write an observation of a child (in the preschool lab or from a video case), build a safe-environment checklist, or complete an FCCLA-style Early Childhood project. This is a PRACTICE ARTIFACT for the high-school student, not a lesson for real preschoolers. Describe exactly what students do, what a strong result looks like, and what the teacher observes and coaches. Include a checklist or rubric aligned to a CDA competency, NASAFACS objective, or FCCLA event. 15–20 minutes.",
      },
      closure: {
        name: "Reflection & Profession Connection",
        desc: "Students reflect on how today's skill fits real early-childhood work and a career (childcare/preschool teacher, paraeducator, director, family childcare provider), and name one professional habit they would carry into a field placement. Connect the skill to the credential/competition it supports (CDA / FCCLA) and to the education ladder toward state licensure. End with a brief exit ticket. 5–8 minutes.",
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
      { level: "concentrator", course: "Culinary Arts (ProStart) / Hospitality & Lodging Operations", description: "Applied culinary TECHNIQUE (knife skills, the cooking methods, baking basics) AND restaurant/foodservice MANAGEMENT (menu planning, cost control, service, the brigade system) via the ProStart / FRMCA curriculum — with sanitation to ServSafe standard woven throughout, plus front-/back-of-house and lodging operations." },
      { level: "completer", course: "Advanced Culinary / Hospitality Capstone & Work-Based Learning", description: "Capstone project, industry-credential attainment (ProStart National Certificate of Achievement / ServSafe / ACF Certified Fundamentals Cook / AHLEI), and a restaurant, kitchen, or hospitality internship or practicum (ProStart's 400 mentored work-experience hours)." },
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
      { level: "concentrator", course: "Independent Living / Workplace Readiness (FCS-Development); or Fashion Design & Textiles", description: "Applied independent-living and employability skills — personal finance, foods & nutrition, consumer decisions, professional communication — or an applied Fashion Design & Textiles strand (textiles/fibers, garment construction, design elements & principles, fashion history & sustainability), aligned to AAFCS competencies and FCCLA fashion events." },
      { level: "completer", course: "Career, Community and Family Connections / Capstone, FCCLA & Work-Based Learning", description: "Capstone connecting FCS skills to careers and community, FCCLA leadership & competitive events, AAFCS Pre-PAC credential attainment, and work-based learning placement." },
    ],
    health_science: [
      { level: "introductory", course: "Health Science I: Careers and Body Systems", description: "Foundations — anatomy & physiology by body system, medical terminology, common pathologies, healthcare careers, safety and infection control, and introductory diagnostic/clinical procedures." },
      { level: "concentrator", course: "Health Science II / Clinical & Diagnostic Procedures", description: "Applied clinical skills — patient care, vital signs, infection control to standard, therapeutic and diagnostic procedures, CPR/First Aid, and medical-emergency fundamentals." },
      { level: "completer", course: "Advanced Health Science / Clinical Practicum, HOSA & Work-Based Learning", description: "Capstone with clinical practicum, NHA industry-credential attainment (e.g., CCMA/CPT), HOSA competitive events, and work-based learning placement in a healthcare setting." },
    ],
    education: [
      { level: "introductory", course: "Principles of Education / Introduction to the Teaching Profession (Education & Training I)", description: "Foundations — the history and philosophy of education, how schools and education systems function, teaching as a profession and careers in education, lesson-planning basics, classroom-management fundamentals, an introduction to child/adolescent development, and early structured classroom observation (often the Teacher Cadet 'Experiencing Education' course at this level)." },
      { level: "concentrator", course: "Education & Training II / Instructional Practices & Human Growth and Development", description: "Applied pedagogy — writing measurable objectives and lessons, instructional strategies and differentiation, formative assessment, child/adolescent developmental stages and learning theories (Piaget, Erikson, Vygotsky) applied to developmentally appropriate practice, and supervised field observation and practicum in a real classroom." },
      { level: "completer", course: "Practicum in Education & Training / Capstone, Educators Rising & Work-Based Learning", description: "Capstone with a clinical field placement (student-teaching-style experience), structured observation and reflection connected to CAEP/InTASC standards, a professional teaching portfolio, Educators Rising competitive events, entry-level credential attainment (ParaPro), and work-based learning in a school setting." },
    ],
    // Primarily a MIDDLE-SCHOOL Foundations pathway: the Intro/Concentrator/Completer
    // labels map to the sequence of common 7th/8th-grade foundations courses, ending at
    // the on-ramp into a specific high-school CTE pathway (rather than a HS capstone).
    career_readiness: [
      { level: "introductory", course: "Exploring Careers / Career Development (MS Foundations, 7th–8th)", description: "Middle-school career exploration and self-assessment — interests, strengths, and values mapped across the 16 career clusters, and a broad introduction to the world of work." },
      { level: "concentrator", course: "General Employability & Business Communication and Technologies (MS Foundations)", description: "Applied employability skills across the three Employability Skills Framework categories, plus professional communication (email, presentations), workplace technology, and digital-literacy fundamentals." },
      { level: "completer", course: "Career Development & Planning → High-School CTE (Foundations on-ramp)", description: "Career-development planning — goal-setting, age-appropriate resume/application basics, and choosing a high-school CTE pathway; the transition point into a specific cluster's high-school pathway sequence." },
    ],
    information_technology: [
      { level: "introductory", course: "Introduction to Information Technology / Web Design I", description: "Foundations — basic computing concepts, digital literacy, how the internet and web work, cybersecurity basics, and introductory web design (HTML/CSS structure and page layout)." },
      { level: "concentrator", course: "Web Design & Development / IT, Cybersecurity & Programming Concentration", description: "Applied web design & development — deeper HTML/CSS, responsive and user-centered design, the plan→build→test→revise workflow — PLUS two dedicated strands: cybersecurity (CIA triad, threats, network-security concepts, digital ethics & responsible disclosure) toward CompTIA A+ → Network+ → Security+ and aligned to NICE; and computer programming (fundamentals, algorithmic thinking & debugging, data & analysis, impacts of computing) toward AP CSP / AP CSA and the CSTA standards. Defensive, conceptual, and language-agnostic." },
      { level: "completer", course: "Advanced Web Design / IT Capstone, Portfolio & Work-Based Learning", description: "Capstone build and professional portfolio, industry-credential attainment (CompTIA), client/freelance-style projects, competitive events, and work-based learning in an IT / web-development setting." },
    ],
    transportation: [
      { level: "introductory", course: "Introduction to Transportation / Automotive Technology I (MLR foundations)", description: "Foundations — shop safety and tool use, an overview of major vehicle systems (engine, brakes, suspension/steering, electrical), basic service-information skills, and a broad look at the wider Transportation, Distribution & Logistics cluster." },
      { level: "concentrator", course: "Automotive Service Technology II / Maintenance & Light Repair", description: "Applied MLR service and maintenance across systems to ASE MLR standards, systematic diagnosis, service-manual use, and shop safety to standard, with SkillsUSA competition alignment." },
      { level: "completer", course: "Advanced Automotive / MLR Capstone, ASE & Work-Based Learning", description: "Capstone service work, ASE Student Certification preparation, SkillsUSA competitive events, a co-op or registered (pre-)apprenticeship, and supervised work-based learning in a real service facility." },
    ],
    manufacturing: [
      { level: "introductory", course: "Introduction to Manufacturing / Manufacturing Technology I", description: "Foundations — shop safety and tool use, production processes and materials (metal/wood/plastics), precision measurement and print reading, and an introduction to automation, robotics, and smart-manufacturing (Industry 4.0) concepts." },
      { level: "concentrator", course: "Precision Machining / Advanced (Smart) Manufacturing", description: "Applied machining and production to NIMS standards, CNC / computer-controlled machining, automation and robotics, IIoT and manufacturing data, quality control, and shop safety to OSHA standard, with SkillsUSA alignment." },
      { level: "completer", course: "Manufacturing Capstone / NIMS, Smart Manufacturing & Work-Based Learning", description: "Capstone production project, NIMS (and MSSC CPT / SACA Industry 4.0) credential attainment, SkillsUSA competitive events, a registered (pre-)apprenticeship or co-op, and supervised work-based learning in a real manufacturing facility." },
    ],
    engineering_tech: [
      { level: "introductory", course: "Exploration of Engineering & Technology (MS/PLTW Gateway) / Engineering Essentials or Introduction to Engineering Design (HS Intro)", description: "Foundations — a broad survey of engineering fields, design-thinking and the engineering design process, computing/computational-thinking basics, intro robotics, and hands-on exploratory projects. HS intro maps to PLTW Engineering Essentials (broad, standalone survey) or the more CAD/documentation-heavy Introduction to Engineering Design — match whichever the teacher's course is." },
      { level: "concentrator", course: "Principles of Engineering / Robotics, Electronics & Aerospace (PLTW pathway)", description: "Applied engineering — deeper engineering design and problem-solving, robotics build-and-program to FIRST/RECF structure, electricity & electronics (circuits, Ohm's law, schematics — CertTEC BEE/AEE Electronics I & II), aerospace fundamentals and avionics awareness (toward NCATT), computing foundations, prototyping and iteration, and engineering-notebook documentation." },
      { level: "completer", course: "Engineering Design & Development / Capstone, Competition & Work-Based Learning", description: "Capstone engineering project (student-directed design or a competition robot), a professional engineering portfolio/notebook, FIRST/RECF competition, PLTW end-of-course credential, and an internship or mentorship with an engineering employer or program." },
    ],
    business_mgmt: [
      { level: "introductory", course: "Introduction to Business / Business Management I", description: "Foundations — economics basics, how businesses operate, business structures/types, an introduction to the management functions, and business career awareness." },
      { level: "concentrator", course: "Business Management / Principles of Management & Administration", description: "Applied management — planning, organizing, leading and decision-making, human resources and operations, administrative/organizational systems, and business financial decision-making, aligned to NBEA / MBA Research and FBLA events." },
      { level: "completer", course: "Advanced Business Management / Capstone, Entrepreneurship & Work-Based Learning", description: "Capstone business/management project or venture plan, entrepreneurship, FBLA competitive events, an industry-aligned business certification, and work-based learning in a business/administrative setting." },
    ],
    agriculture: [
      { level: "introductory", course: "Introduction to Agriculture, Food & Natural Resources / Agriscience I", description: "Foundations — a survey of the AFNR pathways (plant, animal, natural resources, agribusiness), agriscience basics, an introduction to FFA and Supervised Agricultural Experience (SAE), and career awareness across the cluster." },
      { level: "concentrator", course: "Plant / Animal / Natural Resource / Agribusiness Systems (AFNR pathway course; incl. Veterinary Science)", description: "Applied pathway coursework to AFNR standards — deeper plant, animal, natural-resource, or agribusiness science and skills, including a Veterinary Science / veterinary-assisting strand (toward the NAVTA Approved Veterinary Assistant), FFA Career Development Events, and an ongoing SAE project." },
      { level: "completer", course: "Advanced AFNR / Capstone, SAE, FFA & Work-Based Learning", description: "Capstone project, an expanded Supervised Agricultural Experience (entrepreneurship / placement / research), FFA degrees and proficiency awards, industry-credential attainment, and work-based learning in an agriculture / natural-resources setting." },
    ],
    construction: [
      { level: "introductory", course: "Introduction to Architecture & Construction / NCCER Core", description: "Foundations — jobsite and tool safety (OSHA / NCCER Core), construction math and measurement, blueprint / construction-drawing reading, materials handling, and an exploratory overview of the construction trades and architectural design." },
      { level: "concentrator", course: "Construction Trades / Carpentry, Electrical, Plumbing or HVAC-R (NCCER craft)", description: "Applied craft coursework to NCCER standards in a chosen trade, construction methods and sequencing, layout and skilled tool use, and jobsite safety to OSHA standard, with SkillsUSA alignment — and for HVAC-R, the refrigeration cycle, refrigerant recovery, and awareness of the EPA Section 608 certification required by federal law." },
      { level: "completer", course: "Advanced Construction / Capstone, NCCER Credential & Work-Based Learning", description: "Capstone build or design project, NCCER craft-credential attainment, OSHA-10, SkillsUSA competitive events, a registered (pre-)apprenticeship or co-op, and supervised work-based learning on a real jobsite or with a contractor." },
    ],
    arts_av: [
      { level: "introductory", course: "Introduction to Arts, A/V Technology & Communications / Digital Media I", description: "Foundations — visual design principles and typography, an introduction to video/broadcast/journalism and digital media, printing & imaging basics, tool-agnostic software concepts, and career awareness across the cluster." },
      { level: "concentrator", course: "Graphic Design / Digital Media / Video & Broadcast Production (pathway course)", description: "Applied production in a chosen pathway (visual/graphic design, AV/film, journalism/broadcasting, or digital/interactive media) to CCTC standards, deeper software skill, media storytelling, and an ongoing portfolio." },
      { level: "completer", course: "Advanced Media Production / Capstone, Portfolio & Work-Based Learning", description: "Capstone client or personal project, a professional portfolio/demo reel, industry-credential attainment (e.g., Adobe Certified Professional), SkillsUSA competition, and an internship or freelance/mentorship experience in a creative/media setting." },
    ],
    government: [
      { level: "introductory", course: "Introduction to Government & Public Administration / Civics & Public Service", description: "Foundations — how government works and civic structures at the local, state, and federal levels, an introduction to public administration, and career awareness across governance, public management, planning, and public service." },
      { level: "concentrator", course: "Public Administration & Policy / Government Systems", description: "Applied study of how public agencies and services are administered and managed, policy-making and analysis, public planning, revenue/taxation and regulation basics, and an awareness-level overview of national security and foreign service, aligned to CCTC GV standards." },
      { level: "completer", course: "Advanced Public Administration / Capstone, Civic Project & Work-Based Learning", description: "Capstone civic or policy project, a public-service portfolio, participation in civics / youth-government programs, and work-based learning through a government/civic internship, service learning, or mentorship with a public official or agency." },
    ],
    law_safety: [
      { level: "introductory", course: "Introduction to Law, Public Safety, Corrections & Security", description: "Foundations — an overview of the justice, legal, corrections, and public-safety/fire systems, career paths and requirements across the three programs of study, ethics and professionalism, and career awareness (exploration only)." },
      { level: "concentrator", course: "Criminal Justice & Corrections / Pre-Law / Fire Management Services (program of study)", description: "Applied study within a chosen program of study — how the justice system, legal system, corrections, or fire service works; court/agency roles and processes; fire-behavior and safety awareness; and field ethics and professionalism, aligned to CCTC LW standards. Educational/exploratory, not operational." },
      { level: "completer", course: "Advanced / Capstone, Career Portfolio & Work-Based Learning", description: "Capstone career-exploration or systems project, a professionalism/ethics portfolio, participation in related programs (mock trial, Explorers/cadet or fire-cadet), and work-based learning through job shadowing, ride-alongs where available, mentorship, or an internship with a court, agency, fire department, or law office." },
    ],
    cosmetology: [
      { level: "introductory", course: "Introduction to Cosmetology / Personal Care Services", description: "Foundations — an overview of the personal-care industry and its careers (cosmetology, esthetics, nails, barbering), infection-control and safety fundamentals, professional image and client communication, an introduction to hair, skin, and nail services, and the path to state licensure (school-based vs. apprenticeship)." },
      { level: "concentrator", course: "Cosmetology I–II / Hair, Skin & Nail Services", description: "Applied services aligned to NIC content domains — hair cutting/styling plus chemical-texture and color basics; skin/esthetics (facials, makeup, waxing) and nail (manicure/pedicure) fundamentals; the chemistry and anatomy/physiology behind services; and sanitation/disinfection to state-board standard, with SkillsUSA alignment. All hands-on work supervised, with required PPE." },
      { level: "completer", course: "Cosmetology Capstone / Licensure Prep, SkillsUSA & Work-Based Learning", description: "Capstone service competency and NIC written/practical exam preparation, accumulation of state-required clinical/lab hours toward licensure (hours vary by state — verify with the state board), SkillsUSA competitive events, and work-based learning through a salon/spa apprenticeship, cooperative education, or supervised placement." },
    ],
    business_law: [
      { level: "introductory", course: "Introduction to Business Law", description: "Foundations — an overview of the legal system and court structure, the relationship between ethics and law, civil vs. criminal law, and an introduction to contracts, consumer protection, and employment basics as they affect businesses and consumers (educational, not legal advice)." },
      { level: "concentrator", course: "Business Law / Legal Environment of Business", description: "Applied business-law study to NBEA standards — contract formation and breach, sales and consumer-protection law, agency and employment law, and business-ethics case analysis, with FBLA/DECA competitive-event and case-study alignment. Conceptual and analytical, not legal advice." },
      { level: "completer", course: "Advanced Business Law / Capstone, FBLA/DECA & Work-Based Learning", description: "Capstone case-analysis or business-ethics project, a business-law/ethics portfolio, FBLA (Business Law) and DECA (Business Law & Ethics) competitive events, and work-based learning through an internship or mentorship in a law office, HR department, or business-compliance role." },
    ],
    sports_entertainment: [
      { level: "introductory", course: "Introduction to Sports & Entertainment Marketing", description: "Foundations — how marketing applies to sports and entertainment properties (teams, athletes, events, venues, entertainment brands), the marketing mix in this context, an overview of branding/sponsorship/endorsements, and career awareness across the industry." },
      { level: "concentrator", course: "Sports & Entertainment Marketing / Promotion & Sponsorship", description: "Applied study to Precision Exams (416) and DECA standards — sports and entertainment marketing strategy, branding and licensing, sponsorship and endorsement structures, and event marketing/promotion and ticket sales, with DECA SEM competitive-event and case-study alignment." },
      { level: "completer", course: "Advanced / Capstone, DECA & Work-Based Learning", description: "Capstone campaign or event-marketing project, a sports/entertainment marketing portfolio, Precision Exams (416) certification, DECA SEM competitive events, and work-based learning through an internship or job shadow with a sports franchise, event venue, or entertainment company." },
    ],
    exercise_science: [
      { level: "introductory", course: "Introduction to Exercise Science / Sports Medicine", description: "Foundations — the sports-medicine team and therapeutic careers (athletic training, PT, OT, exercise physiology), introductory anatomy/physiology/kinesiology for movement, injury-prevention awareness, and fitness/nutrition basics (knowledge-level; CPR/first aid supports but does not replace certified training)." },
      { level: "concentrator", course: "Sports Medicine / Exercise Science II", description: "Applied study to NASM and HOSA/NCHSE standards — kinesiology and body systems in exercise, injury-prevention and the rehabilitation process, taping/wrapping AWARENESS, exercise programming, and sport nutrition and psychology, with HOSA competitive-event alignment. Any hands-on skill is awareness-level and supervised." },
      { level: "completer", course: "Advanced Sports Medicine / Capstone, HOSA & Work-Based Learning", description: "Capstone project or case study, a sports-medicine/exercise-science portfolio, progress toward the NASM-CPT credential (typically 18+/post-secondary), CPR/First Aid/AED certification through a certified instructor, HOSA competitive events, and work-based learning through job shadowing (athletic trainers, PTs) or an internship in an athletic training room, clinic, or fitness facility." },
    ],
    early_childhood: [
      { level: "introductory", course: "Child Development I / Introduction to Early Childhood Education (Early Childhood, Education & Services I)", description: "Foundations — child growth & development across the domains and major theories, developmental milestones from birth through age 5, health/safety/nutrition basics, an introduction to the early-childhood profession and careers, and guided observation of young children." },
      { level: "concentrator", course: "Early Childhood Education & Services II / Teaching & Learning Environments", description: "Applied practice — developmentally appropriate practice and positive guidance, planning play-based learning-center activities across the domains, observation & documentation, and a supervised experience in a preschool lab, campus childcare, or an early-childhood placement, aligned to CDA and NASAFACS 4.0." },
      { level: "completer", course: "Practicum in Early Childhood Education / CDA Capstone & Work-Based Learning", description: "Capstone with an internship in a licensed early-childhood setting, building the CDA Professional Portfolio and logging the required training and experience hours toward the Child Development Associate (CDA) credential, FCCLA competitive events (Early Childhood, Teach and Train), and preparation for the CDA exam and verification visit." },
    ],
  }[pathway] ?? []
}

// Optional pathway-specific work-based learning guidance, appended to the WBL block.
// Human Services, Health Science, and Education & Training use Virginia's High-Quality
// Work-Based Learning (HQWBL) model, which recognizes a broader set of 12 methods than
// the internship/shadow/speaker default.
function getWblGuidance(pathway) {
  if (pathway === "human_services" || pathway === "health_science" || pathway === "education" || pathway === "career_readiness" || pathway === "information_technology" || pathway === "transportation" || pathway === "manufacturing" || pathway === "engineering_tech" || pathway === "business_mgmt" || pathway === "agriculture" || pathway === "construction" || pathway === "arts_av" || pathway === "government" || pathway === "law_safety" || pathway === "cosmetology" || pathway === "business_law" || pathway === "sports_entertainment" || pathway === "exercise_science" || pathway === "early_childhood") {
    const emphasis = pathway === "health_science"
      ? " Clinical experience is especially relevant for this pathway — prioritize clinical/hospital placements, patient-care rotations, and health-agency service learning where appropriate."
      : pathway === "education"
        ? " Clinical/field experience is especially relevant for this pathway — prioritize structured classroom observation, tutoring and cross-age mentoring placements, and student-teaching-style field experiences in a real school, plus service learning with younger students."
        : pathway === "career_readiness"
          ? " Career-AWARENESS activities are especially relevant for this pathway — for many middle-schoolers this is their earliest exposure to work-based learning, so prioritize the awareness-level methods: guest speakers, career fairs, workplace tours, and informational interviews, alongside age-appropriate service learning and job shadowing. Keep placements exploratory rather than skill-mastery internships."
          : pathway === "information_technology"
            ? " Internship, entrepreneurship, and mentorship are especially relevant for this pathway — tech work lends itself to real internships, to entrepreneurship/freelance & portfolio work (building or maintaining real websites for clients, school clubs, or community organizations), and to mentorship with industry professionals. Prioritize these, plus a school-based enterprise (e.g., running the school/club website) where it fits the lesson."
            : pathway === "transportation"
              ? " Internship, cooperative education, and registered apprenticeship are especially relevant for this pathway — the automotive/transportation trades are apprenticeship-heavy, so prioritize co-op placements in real service facilities, youth/registered (pre-)apprenticeships, and internships at dealerships, independent shops, or fleet/transit operations, alongside mentorship with a certified (e.g., ASE) technician. Any hands-on placement must be properly supervised and follow the site's safety requirements."
              : pathway === "manufacturing"
                ? " Apprenticeship, internship, and cooperative education are especially relevant for this pathway — modern manufacturing is apprenticeship-heavy, so prioritize registered (pre-)apprenticeships and co-op placements in real production facilities, internships at manufacturers or machine shops, and mentorship with a NIMS-credentialed technician or manufacturing engineer. Any hands-on placement must be properly supervised and follow the site's OSHA safety requirements."
                : pathway === "engineering_tech"
                  ? " Internship, mentorship, and entrepreneurship are especially relevant for this pathway — engineering/robotics work is project- and competition-driven, so prioritize internships with engineering employers or maker/robotics organizations, mentorship from practicing engineers and FIRST/RECF team mentors/coaches, and entrepreneurship (student design teams building and pitching a real prototype or product), alongside a school-based enterprise or robotics-team structure."
                  : pathway === "agriculture"
                    ? " Supervised Agricultural Experience (SAE) is the SIGNATURE work-based-learning component of this cluster — give it particular emphasis. An SAE is a required, ongoing, student-led project (entrepreneurship, placement/internship, research/experimental, or school-based enterprise) that ag students maintain and document in records; build ideas that connect to or launch an SAE. Treat FFA as a CORE, intracurricular program component (not just an extracurricular add-on) — its Career Development Events (CDEs), Leadership Development Events (LDEs), degrees, and proficiency awards are part of how this cluster's WBL works. Frame WBL around the three-circle model (classroom/lab + FFA + SAE), and also draw on cooperative education, job shadowing, and mentorship with agricultural producers, agencies, and agribusinesses."
                    : pathway === "construction"
                      ? " Apprenticeship and registered apprenticeship are especially relevant for this pathway — the construction trades are strongly apprenticeship-driven, so prioritize registered (pre-)apprenticeships (union and merit-shop/ABC and trade-council programs), youth apprenticeships, and co-op placements with contractors, alongside internships, job shadowing, and mentorship with journey-level tradespeople. Any hands-on jobsite placement must be properly supervised and follow OSHA jobsite-safety requirements."
                      : pathway === "arts_av"
                        ? " Internship, entrepreneurship, and mentorship are especially relevant for this pathway — creative/communications careers are portfolio- and project-driven, so prioritize internships at studios, agencies, newsrooms, or media/marketing teams; entrepreneurship (freelance/commission work and building a client portfolio or personal brand); and mentorship from working designers, videographers, or journalists. Also draw on school-based enterprise (producing the yearbook, morning announcements, school news, or design work for real clients) as authentic WBL, and emphasize building a professional portfolio/demo reel throughout."
                        : pathway === "government"
                          ? " Internship, mentorship, and service learning are especially relevant for this pathway — public service is civic and community-based, so prioritize government/civic internships (a local council, mayor's or agency office, or legislative page/intern program), mentorship from public officials and administrators, and service learning that addresses a real community need, alongside job shadowing in a public agency. Youth-government and civic programs (e.g., YMCA Youth & Government, Model UN) also serve as authentic, program-based WBL for this cluster."
                          : pathway === "law_safety"
                            ? " Job shadowing, mentorship, and internship are especially relevant for this pathway — prioritize job shadowing and, where appropriate and available, supervised ride-alongs; mentorship from professionals (officers, attorneys, corrections/probation staff, firefighters); and internships with courts, fire departments, law offices, or public-safety agencies, alongside service learning. Every placement must be age-appropriate, supervised, and OBSERVATIONAL (career exploration only — never operational participation); ride-alongs and any fire-service activity follow the agency's policies, waivers, and safety requirements."
                            : pathway === "cosmetology"
                              ? " Apprenticeship and cooperative education are especially relevant for this pathway — many states offer an APPRENTICESHIP ROUTE to a cosmetology/personal-care license alongside the school-based route, so prioritize registered/state-approved salon, spa, or barbershop apprenticeships; cooperative-education placements in a licensed salon/spa; mentorship with a licensed professional; and a school-based enterprise (a supervised student salon/clinic) where the program runs one, alongside job shadowing. Any client-facing or hands-on placement must follow the state board's supervision, sanitation, and licensing rules and the site's safety requirements. Note that the apprenticeship route's required hours and rules vary by state."
                              : pathway === "business_law"
                                ? " Internship and mentorship are especially relevant for this pathway — prioritize internships and job shadowing in law offices, HR departments, and business-compliance / regulatory roles; and mentorship from attorneys, paralegals, HR professionals, or compliance officers, alongside service learning (e.g., a consumer-education / know-your-rights project) and FBLA/DECA case-study and role-play competition as authentic, program-based WBL. Keep every placement OBSERVATIONAL and educational — career exploration only, never the practice of law or giving legal advice."
                                : pathway === "sports_entertainment"
                                  ? " Internship and job shadowing are especially relevant for this pathway — prioritize internships and job shadows with sports franchises and teams, event venues and arenas, entertainment and event-promotion companies, marketing/sponsorship agencies, and school/college athletic departments; plus mentorship from sports/entertainment marketers, and a school-based enterprise (marketing and promoting real school athletic events, spirit merchandise, or performances) as authentic WBL. DECA Sports and Entertainment Marketing competitive events also serve as program-based work-based learning."
                                  : pathway === "exercise_science"
                                    ? " Job shadowing and internship are especially relevant for this pathway — prioritize job shadows with athletic trainers, physical therapists (PT/PTA), occupational therapists, and exercise physiologists, and internships in athletic training rooms, physical-therapy/rehab clinics, fitness and performance facilities, and school/college athletic departments, alongside mentorship from sports-medicine professionals and clinical/field observation. Every placement is OBSERVATIONAL and supervised — students do not perform clinical treatment, and any CPR/first-aid/AED or clinical skill is learned only through certified instruction."
                                    : pathway === "early_childhood"
                                      ? " Clinical experience, internship, and school-based enterprise are especially relevant for this pathway — the school's on-site preschool/childcare LAB is a signature school-based-enterprise and clinical-experience WBL model, so prioritize supervised practicum hours in the campus preschool lab, plus internships and cooperative education in licensed childcare centers, Head Start programs, and community preschools, alongside job shadowing and mentorship with early-childhood professionals. These supervised hours also build toward the CDA credential's required experience hours. Every placement is supervised and appropriate — students support, and never assume sole responsibility for, the care of real young children."
                                      : ""
    return `\nThis pathway follows Virginia's High-Quality Work-Based Learning (HQWBL) model, which recognizes 12 methods: job shadowing, service learning, mentorship, externship, school-based enterprise, internship, entrepreneurship, clinical experience, cooperative education, youth registered apprenticeship, registered apprenticeship, and supervised agricultural experience. When filling the fields below, draw the most lesson-appropriate ideas from this broader set (not only internships/shadows) — e.g., service learning with a community agency, a clinical experience, a school-based enterprise, or a mentorship — and fold them into the internships and job_shadows arrays as fits this lesson's content and tier.${emphasis}`
  }
  return ""
}

// Pathway-specific SAFETY directive, injected into the system prompt. Trade
// pathways with real physical/tool risk (e.g., automotive shop work) get an
// explicit, serious directive plus a required lesson-planning-only boundary
// statement — in the spirit of the clinical/compliance boundaries used by the
// health/SLP modules. Empty for pathways without meaningful physical hazard.
function getSafetyGuidance(pathway) {
  if (pathway === "health_science") {
    return `

SAFETY & CLINICAL BOUNDARY (safety_notes field) — CRITICAL FOR THIS PATHWAY: Health-science content is educational and AWARENESS/readiness-level — it builds knowledge toward a credential but is NOT clinical training and NOT a substitute for supervised clinical instruction, certification, or licensure. Populate the safety_notes array with SPECIFIC, lesson-relevant clinical-safety controls rather than a generic "be careful": standard/universal precautions and hand hygiene; BLOODBORNE-PATHOGEN and exposure precautions; PPE appropriate to the task (gloves, mask, protective eyewear, gown); safe sharps handling and disposal; and scope-of-practice limits (students practice on manikins/simulation, or peers ONLY where school policy allows, under supervision). For DENTAL RADIOGRAPHY / X-RAY content specifically, foreground RADIATION SAFETY: the ALARA principle (As Low As Reasonably Achievable), the lead apron and thyroid collar, distance and shielding, and operator monitoring/dosimetry — and make clear that ACTUAL X-ray operation/exposure requires certified training and meeting your state's dental-radiography requirements, so classroom content stays conceptual/awareness-level (never operating live equipment on people). For DENTAL clinical content, foreground dental INFECTION CONTROL: instrument sterilization/autoclaving, surface disinfection and barriers, single-use items, and operatory PPE (per CDC dental infection-control guidance). For CNA / NURSE-AIDE / patient-care content specifically, foreground three things: (1) BODY MECHANICS & SAFE PATIENT HANDLING — protecting BOTH the aide and the patient from injury when repositioning, transferring, or lifting (wide base of support, bend the knees not the back, keep the load close, avoid twisting, use a gait/transfer belt, get help or a mechanical lift for dependent patients, and lock bed/wheelchair wheels) — musculoskeletal / back injury is the leading nurse-aide occupational hazard; (2) INFECTION CONTROL FOR DIRECT PATIENT CONTACT — hand hygiene before AND after every patient contact, gloves and standard precautions, bloodborne-pathogen protection, and safe handling of soiled linens and body fluids, because nurse-aide work is close, hands-on, and repeated across many residents; and (3) the SUPERVISED-CLINICAL BOUNDARY — real personal-care and patient-contact skills (bathing, toileting, transferring live patients) require certified, supervised clinical placement with actual patients and are NOT something classroom-only instruction or a lesson plan can substitute for (classroom practice stays on manikins/simulation and, where school policy allows, peers, under supervision). Foreground the relevant safety point inside the Concept Instruction, Skill Demonstration, and Hands-On phases. The FIRST item in safety_notes MUST be this boundary statement, verbatim: "This lesson plan supports classroom and lab PLANNING at an awareness/readiness level only. It is not clinical training and does not certify or license students. Any hands-on clinical, radiography, or patient-care skill requires proper supervision, certification, and — for dental X-ray operation — meeting your state's radiography-training requirements. Follow your school's and district's policies and applicable OSHA / CDC infection-control (bloodborne-pathogen) and radiation-safety requirements before any hands-on work."`
  }
  if (pathway === "engineering_tech") {
    return `

SAFETY (safety_notes field): Engineering / technology lab work carries real, if moderate, risk — hand and power tools, 3D printers and prototyping equipment, robotics (moving parts, pinch points, batteries / LiPo charging), and especially ELECTRICAL / ELECTRONICS work. For ELECTRONICS and AVIONICS content specifically, foreground ELECTRICAL SAFETY: shock and short-circuit risk; work ONLY with LOW-VOLTAGE battery or bench-supply circuits in a school lab (NEVER household mains or live aircraft systems); discharge capacitors before handling; correct use of tools and a multimeter; soldering-iron BURN and solder-FUME hazards (heat-resistant surface, fume extraction/ventilation, eye protection); and never work on an energized circuit. Populate the safety_notes array with SPECIFIC, lesson-relevant hazards and controls rather than a generic "be careful," and foreground the relevant point inside the Concept Instruction, Skill Demonstration, and Hands-On phases. Keep AEROSPACE / AVIONICS content at an AWARENESS level — students explore concepts but do NOT service real aircraft or energized avionics (that requires FAA / NCATT-governed certified training). The FIRST item in safety_notes MUST be this boundary statement, verbatim: "This lesson plan supports classroom and lab PLANNING at an awareness level only. It is not a substitute for your program's required lab-safety training, supervision, and equipment/PPE. Electronics work must use low-voltage / bench circuits under supervision — never live mains or energized aircraft systems — and aerospace/avionics servicing requires FAA / NCATT-governed certified training. Follow your school's and district's safety policies before any hands-on work."`
  }
  if (pathway === "agriculture") {
    return `

SAFETY (safety_notes field): Agriculture / animal-science lab and farm work carries real physical and BIOLOGICAL risk. For VETERINARY SCIENCE / animal-handling content specifically, foreground: ANIMAL-HANDLING injury — bites, scratches, kicks, and crush injuries — and the SAFE RESTRAINT and low-stress handling that prevent them (match the restraint to the species and to the animal's stress/warning signals; never force a frightened or aggressive animal); ZOONOTIC DISEASE exposure — diseases pass between animals and people, so require hand hygiene, PPE (gloves, gowns), and biosecurity/sanitation, and treat all animals and specimens as potential sources of infection; SHARPS / NEEDLE safety — safe handling and disposal of needles and blades in an approved sharps container, never recapping, with any injection or venipuncture done ONLY under licensed supervision; and ASEPTIC TECHNIQUE awareness for minor procedures (clean field, instrument handling) at an AWARENESS level. Populate the safety_notes array with SPECIFIC, lesson-relevant hazards and their controls rather than a generic "be careful," and foreground the relevant point inside the Concept Instruction, Skill Demonstration, and Hands-On phases. Keep any hands-on animal, clinical, or specimen work SUPERVISED and awareness/assistant-level — students NEVER perform independent clinical, invasive, or diagnostic procedures. The FIRST item in safety_notes MUST be this boundary statement, verbatim: "This lesson plan supports classroom and lab PLANNING at an awareness / assistant level only. It is not a substitute for a licensed veterinarian's or credentialed technician's supervision, and it is not veterinary diagnosis, treatment, or advice. Any hands-on animal handling, clinical, or laboratory work requires proper supervision, PPE, and adherence to your school's and district's policies and your state's veterinary and CTE regulations (which vary by state) before any hands-on work."`
  }
  if (pathway === "transportation") {
    return `

SAFETY (safety_notes field) — CRITICAL FOR THIS PATHWAY: Automotive/transportation shop work involves REAL physical risk — vehicle lifts and jacks/jack stands, power and hand tools, hot components and exhaust, moving vehicles, batteries and (in hybrid/EV) high-voltage systems, chemicals and fluids, and eye/hearing/entanglement hazards. Treat safety with the SAME seriousness as a health-science clinical lesson — never generic "be careful." Populate the safety_notes array with SPECIFIC, lesson-relevant hazards and their controls (e.g., correct lift points and jack-stand use, wheel chocks, PPE — safety glasses/gloves/closed-toe shoes, tool inspection, disconnecting the battery / high-voltage precautions, ventilation for exhaust and fumes, safe fluid handling and disposal), and foreground the relevant safety point inside the Concept Instruction, Skill Demonstration, and Hands-On phases. The FIRST item in safety_notes MUST be this boundary statement, verbatim: "This lesson plan supports classroom and lab PLANNING only. It is not a substitute for your program's required shop-safety training, certification, supervision, and equipment/PPE. Follow your school's and district's safety policies and any applicable OSHA / ASE Education Foundation shop-safety requirements before any hands-on work."`
  }
  if (pathway === "manufacturing") {
    return `

SAFETY (safety_notes field) — CRITICAL FOR THIS PATHWAY: Manufacturing shop-floor work involves REAL physical risk — machine tools (mills, lathes, drill presses, band saws, grinders, CNC machines), rotating and cutting equipment, pinch and entanglement points, flying chips and debris, hot work/welding, heavy and awkward material handling, pneumatics/hydraulics, and electrical hazards. Treat safety with the SAME seriousness as a health-science clinical lesson — never generic "be careful." Populate the safety_notes array with SPECIFIC, lesson-relevant hazards and their controls (e.g., machine guarding and never removing or bypassing guards; PPE — safety glasses/face shield, hearing protection, closed-toe shoes, and NO loose clothing, gloves, jewelry, or long hair near rotating tools; lockout/tagout (LOTO) before any setup, service, or clearing of a jam; safe material handling and team lifting; keeping the floor and work area clear of chips, oil, and debris; and inspecting tools and machines before use), and foreground the relevant safety point inside the Concept Instruction, Skill Demonstration, and Hands-On phases. The FIRST item in safety_notes MUST be this boundary statement, verbatim: "This lesson plan supports classroom and lab PLANNING only. It is not a substitute for your program's required shop-safety training, certification, supervision, and equipment/PPE. Follow your school's and district's safety policies and any applicable OSHA / NIMS shop-safety requirements before any hands-on work."`
  }
  if (pathway === "construction") {
    return `

SAFETY & LEGAL-COMPLIANCE (safety_notes field) — CRITICAL FOR THIS PATHWAY: Construction and construction-shop work involves REAL physical risk — falls from ladders, scaffolds, and heights (the leading cause of construction fatalities); power and hand tools (saws, nail guns, drills); electrical hazards; struck-by and caught-in/between hazards; heavy and awkward lifting and material handling; and dust, noise, and eye hazards. For HVAC-R / REFRIGERATION content specifically, add these serious hazards: HIGH-PRESSURE refrigerant systems (rupture/explosion risk), refrigerant BURNS and FROSTBITE from liquid refrigerant contact, ASPHYXIATION / oxygen-displacement risk in confined spaces from leaking refrigerant, and electrical hazards inside HVAC equipment. AND a real LEGAL-COMPLIANCE dimension: EPA Section 608 (federal Clean Air Act) certification is REQUIRED BY LAW to service or handle regulated refrigerants — knowingly VENTING regulated refrigerants is ILLEGAL and carries real federal penalties; students must NEVER handle, recover, or vent refrigerants without EPA 608 certification and certified supervision (classroom content stays awareness-level). For each OTHER trade the lesson targets, foreground THAT trade's specific hazards: ELECTRICAL — shock/electrocution, ARC FLASH, and lockout/tagout (LOTO); CARPENTRY — power tools (saws, nail guns), hand tools, and safe lifting; WELDING — arc/UV radiation ("arc eye"), burns from hot metal/sparks, electric shock, fumes/ventilation, and fire/hot-work controls; MASONRY — silica DUST (respiratory), heavy repetitive lifting, and caustic wet mortar/cement (skin/eye); HEAVY EQUIPMENT — crush/caught-in-between, rollover, blind spots and spotter communication (students observe only, never operate); SHEET METAL — sharp edges and laceration/cut risk from formed and burred metal; ROOFING — FALLS FROM HEIGHT (roofing has among the highest fall-fatality rates — fall protection is paramount), ladder/roof-access safety, and heat/weather exposure (students do not work at height). Treat safety with the SAME seriousness as a health-science clinical lesson — never generic "be careful." Populate the safety_notes array with SPECIFIC, lesson-relevant hazards and their controls (e.g., fall protection and correct ladder/scaffold use; PPE — hard hat, safety glasses/face shield, hearing protection, gloves, and closed-toe/steel-toe boots, NO loose clothing/jewelry near power tools; power-tool guards, inspection, and safe operation; electrical safety and lockout/tagout; proper lifting and team lifts; and, for HVAC-R, gloves and eye protection against refrigerant, ventilation and leak awareness, and NEVER venting refrigerant), and foreground the relevant safety point inside the Concept Instruction, Skill Demonstration, and Hands-On phases. The FIRST item in safety_notes MUST be this boundary statement, verbatim: "This lesson plan supports classroom and lab PLANNING at an awareness level only. It is not a substitute for your program's required shop-safety training, certification, and supervision. HVAC-R / refrigerant work requires EPA Section 608 certification (federal law) and certified supervision — students must never handle or vent regulated refrigerants, which is illegal without certification. Follow your school's and district's safety policies and any applicable OSHA / NCCER / EPA requirements before any hands-on work."`
  }
  if (pathway === "law_safety") {
    return `

SAFETY & PROFESSIONAL BOUNDARY (safety_notes field) — CRITICAL FOR THIS PATHWAY: Keep ALL content in career-exploration and general-educational territory — how the justice, legal, corrections, and public-safety/fire SYSTEMS work; career paths and requirements; and ethics/professionalism. Do NOT provide legal advice; do NOT provide operational or tactical law-enforcement, corrections, or security procedures, techniques, or anything resembling operational training; and do NOT include content that could be misused. For any FIRE MANAGEMENT SERVICES content specifically, there is REAL physical risk (fire behavior, live fire/heat, hazmat, and physical-training demands) — treat that with the SAME seriousness as a health-science clinical lesson and populate safety_notes with SPECIFIC controls: never conduct live-fire, smoke, or hazmat activities in a classroom; turnout gear / SCBA and any firefighting skill are used ONLY under certified fire-service instruction; physical training must be supervised, voluntary, medically cleared, and paced with hydration/rest; and hazmat is recognize-and-report only (never handle). Keep any hands-on activity to demonstration/simulation/awareness. The FIRST item in safety_notes MUST be this boundary statement, verbatim: "This lesson plan supports classroom career exploration and general educational understanding only. It is not legal advice and does not provide operational law-enforcement, corrections, security, or firefighting tactics, procedures, or training. Any hands-on public-safety or fire-service activity requires proper certification, equipment, and supervision — follow your program's and district's policies."`
  }
  if (pathway === "cosmetology") {
    return `

SAFETY (safety_notes field) — CRITICAL FOR THIS PATHWAY: Cosmetology / personal-care services involve REAL physical and health risk — chemical burns and injury from relaxers, permanent-wave solutions, and hair color/lighteners; allergic and irritant reactions that REQUIRE a patch/predisposition test before color and chemical services; infection transmission and BLOODBORNE-PATHOGEN exposure (nicks, cuts, broken skin) that demand strict sanitation, disinfection of implements in an EPA-registered disinfectant, and a defined blood-exposure/first-aid procedure; cuts from shears, razors, and nippers; burns from thermal styling tools (flat/curling irons, blow dryers) and hot wax; eye and respiratory irritation from chemical fumes, aerosols, and nail-product vapors; and slips on wet floors. Treat safety with the SAME seriousness as a health-science clinical lesson — never generic "be careful." Populate the safety_notes array with SPECIFIC, lesson-relevant hazards and their controls (e.g., always patch-test before color/chemical services; read and follow the product SDS and manufacturer directions and never over-process/over-time a chemical service; PPE — gloves, cape/apron, and eye protection for chemical work; disinfect all multi-use implements and discard single-use items; a blood-exposure procedure — stop, glove, clean, cover, then disinfect the station and follow the exposure/first-aid plan; adequate ventilation for chemical and nail services; guarded handling of shears/razors and hot tools; and keeping the floor and station clean and dry), and foreground the relevant safety point inside the Concept Instruction, Skill Demonstration, and Hands-On phases. Keep any hands-on service on mannequins/training heads (or peers ONLY where school policy allows) under required supervision and PPE. The FIRST item in safety_notes MUST be this boundary statement, verbatim: "This lesson plan supports classroom and lab PLANNING only. It is not a substitute for your program's required safety, sanitation, and supervision or its equipment/PPE, and it does not certify or count hours toward licensure. Required training hours, license categories, and exam requirements vary significantly by state — follow your school's and district's policies and your state board of cosmetology's rules and any applicable OSHA / infection-control (bloodborne-pathogen) requirements before any hands-on or client work."`
  }
  if (pathway === "business_law") {
    return `

PROFESSIONAL & EDUCATIONAL BOUNDARY (safety_notes field) — CRITICAL FOR THIS PATHWAY: This is BUSINESS and CIVICS education about how the legal system and business law WORK — it is NOT legal advice and NOT training to practice law. Keep ALL content educational and conceptual (concepts, how systems and rules work, why they matter to businesses, consumers, and employees, and ethics/case analysis). Do NOT provide legal advice, do NOT give step-by-step instructions for handling a real legal dispute or drafting binding legal documents, and make clear that a real legal question requires a licensed attorney. Frame all case studies and role-plays as EDUCATIONAL analysis, never real-world legal action. The FIRST item in safety_notes MUST be this boundary statement, verbatim: "This lesson plan supports classroom business and legal-literacy education only. It is not legal advice and does not train students to practice law or to handle real legal disputes. For any actual legal question, consult a licensed attorney, and follow your program's and district's policies."`
  }
  if (pathway === "exercise_science") {
    return `

SAFETY & CERTIFICATION BOUNDARY (safety_notes field) — CRITICAL FOR THIS PATHWAY: This is educational, awareness-level exercise-science / sports-medicine content — NOT clinical training and NOT a substitute for professional certification. CPR, First Aid, and AED are life-saving skills that can ONLY be certified through a certified instructor and an approved provider (American Red Cross, American Heart Association, etc.) — a generated lesson can build supporting knowledge but CANNOT confer certification; state this clearly wherever CPR/first-aid/AED appears. Injury care, taping/wrapping, rehabilitation, and any clinical or hands-on athletic-training skill are AWARENESS-level only and must NOT be presented as treatment students can perform on real injuries. Any physical activity, exercise, or fitness testing must be voluntary, medically cleared, properly supervised, and paced with hydration/rest (treat physical-exertion risk with the same seriousness as a PE or clinical lesson). Keep hands-on practice to demonstration/simulation on peers or manikins ONLY where school policy allows and under supervision. The FIRST item in safety_notes MUST be this boundary statement, verbatim: "This lesson plan supports classroom, awareness-level exercise-science and sports-medicine education only. It is not clinical training and does not certify students in CPR, First Aid, AED, athletic training, or any medical skill. CPR/First Aid/AED and clinical certification require a certified instructor and approved provider; any hands-on or physical activity requires proper supervision, medical clearance, and your program's and district's safety policies."`
  }
  if (pathway === "information_technology") {
    return `

SECURITY & ETHICS BOUNDARY (safety_notes field) — CRITICAL FOR THIS PATHWAY: Keep all technology content oriented toward RESPONSIBLE, ETHICAL, and LEGAL use. For any CYBERSECURITY content specifically, keep it DEFENSIVE, conceptual, and career-exploration focused — understanding how security works, why it matters, and the ethics and laws around it. Do NOT provide offensive hacking, exploitation, malware creation, attack tooling, credential- or system-compromise techniques, or any step-by-step method that could give real-world uplift for breaking into or damaging actual systems; teach threats only at a conceptual "what it is and how to defend against it" level. Emphasize digital ethics, privacy, responsible disclosure (report vulnerabilities through proper channels, never exploit them), and your school's acceptable-use policy. The FIRST item in safety_notes MUST be this boundary statement, verbatim: "This lesson supports responsible, ethical, and legal technology use. Any cybersecurity content is defensive and conceptual only — understanding how security works and why it matters — never offensive hacking, exploitation, or techniques for compromising real systems. Follow your school's acceptable-use policy and district technology policies."`
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
 * @param {'hospitality'|'finance'|'marketing'|'human_services'|'health_science'|'education'|'career_readiness'|'information_technology'|'transportation'|'manufacturing'|'engineering_tech'|'business_mgmt'|'agriculture'|'construction'|'arts_av'|'government'|'law_safety'|'cosmetology'|'business_law'|'sports_entertainment'|'exercise_science'|'early_childhood'} input.pathway
 * @param {'ms'|'hs'} input.tier
 * @param {'introductory'|'concentrator'|'completer'|''} [input.level]  required when tier === 'hs'
 * @param {string}  input.topic
 * @param {string[]} input.materials
 * @param {number}  input.classSize
 * @param {number}  input.durationMinutes
 * @param {string}  [input.courseName]
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
  courseName = "",
  targetCompetency = "",
  state = "",
  sessionNumber = 0,
  totalSessions = 0,
  priorSessionsSummary = "",
  includeELL = false,
  coreActivityOnly = false,
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
  const safetyGuidance = getSafetyGuidance(pathway)
  const exactCourse = String(courseName).trim()

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

${exactCourse ? `EXACT COURSE FIT — NON-NEGOTIABLE: The teacher selected the course "${exactCourse}". Build every part of this lesson for that exact course, not merely the broader ${pathwayLabel} pathway. Use course-appropriate vocabulary, tools/software/equipment, standards or task lists, rigor, project type, and career context. Do not drift into a neighboring course within the same pathway. For example, Desktop Publishing must focus on publication/layout work rather than generic coding; Web Design must focus on web design/development rather than general computer applications.` : `COURSE FIT: No exact course title was supplied. Infer the most appropriate course within the ${pathwayLabel} pathway from the lesson topic, and keep the entire lesson consistent with that course.`}

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

Competencies: ${competencyGuidance}${safetyGuidance}

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
- simplified_instructions: single string — 2–3 short sentences describing the core task at a lower reading level, no idioms` : ""}${coreActivityOnly ? coreActivityDirective() : ""}`

  const user = `Generate a complete ${pathwayLabel} CTE lesson${isMultiStage ? ` project stage (${stageLabel})` : ""} with these parameters:

- Pathway: ${pathwayLabel}
- Exact course / class: ${exactCourse || "Not specified — infer carefully from the topic"}
- Course tier/level: ${tierLabel} (${gradeContext})
- ${isMultiStage ? `Project name: ${topic || `(choose an appropriate ${pathwayLabel} project for this tier/level)`}` : `Lesson topic / focus: ${topic || `(choose an appropriate ${pathwayLabel} lesson for this tier/level)`}`}
- Materials / equipment available: ${materials.filter(Boolean).join(", ") || "standard CTE classroom/lab supplies for this pathway"}
- Class size: ${classSize}
- Duration: ${durationMinutes} minutes${targetCompetency ? `\n- Target competency / task: ${targetCompetency} — build the lesson specifically around this; ensure it appears in the competencies array` : ""}

Return the JSON object now.`

  const schema = buildCteLessonSchema(includeELL)

  return { system, user, schema }
}
