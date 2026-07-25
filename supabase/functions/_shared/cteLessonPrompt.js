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
  career_readiness: "Career Readiness",
  information_technology: "Information Technology",
  transportation: "Transportation, Distribution & Logistics",
  manufacturing: "Manufacturing",
  engineering_tech: "STEM / Engineering & Technology",
  business_mgmt: "Business Management & Administration",
  agriculture: "Agriculture, Food & Natural Resources",
  construction: "Architecture & Construction",
  arts_av: "Arts, A/V Technology & Communications",
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
    career_readiness: `Primary national framework for Career Readiness (a Middle School Foundations pathway, typically 7th/8th grade, that students take BEFORE selecting a specific CTE pathway) — lead the competency list with entries from this, and treat the state CTE task list above as the state verification layer for it:
- Employability Skills Framework (U.S. Department of Education, Office of Career, Technical, and Adult Education — OCTAE) — the foundational framework for this pathway, organized around three broad categories: (1) Applied Knowledge — applied academic skills and critical thinking (reading/writing/math for work, problem-solving, critical thinking, decision-making, reasoning); (2) Effective Relationships — interpersonal skills and personal qualities (teamwork, communication, respect, responsibility, integrity, professionalism, initiative, adaptability); and (3) Workplace Skills — resource, information, technology, and systems management (time management, planning & organizing, following directions, using workplace technology, understanding how a workplace works). Framework field: "Employability Skills Framework". Anchor every entry to the established 2018 three-category structure and name the category. NOTE: the framework is undergoing a 2.0 modernization as of 2025 — treat the 2018 three-category structure as the stable anchor and a foundational field document; do not invent 2.0 sub-competency codes.
Then include entries from this where the lesson content maps to it:
- National Career Clusters Framework — the 16 Career Clusters (Advance CTE). Framework field: "Career Clusters". Because this is a career-EXPLORATION foundations course, career-exploration and self-assessment content should introduce students to the RANGE of career clusters broadly (all 16), not just one — use this to frame students' interests, strengths, and values against the breadth of clusters and the high-school pathways they lead to.
Content areas to prioritize (this pathway consolidates the common MS "Foundations" courses — Career Development, Exploring Careers, General Employability, and Business Communication and Technologies): (a) career exploration & self-assessment — interests, strengths, and values mapped to career clusters; (b) general employability skills — the three Employability Skills Framework categories; (c) business communication & technology basics — professional communication (email, presentations), basic workplace technology, and digital-literacy fundamentals; and (d) career-development planning — goal-setting, age-appropriate resume/application basics, and understanding pathways and next steps toward high-school CTE programs. Keep all content and rigor age-appropriate for middle school (awareness and exploration, not mastery). NOTE: several teacher requests referenced Texas TEKS-based courses by name (Career Development, Career Exploration); keep this lesson national-first and let the state CTE verification layer above cover state-specific course/standard alignment.`,
    information_technology: `Primary national frameworks for Information Technology (Web Design focus, with broader computing at the exploratory/MS level) — lead the competency list with entries from these, and treat the state CTE task list above as the state verification layer for them:
- ISTE Standards for Students (International Society for Technology in Education) — the primary PEDAGOGICAL framework for this pathway, especially Standard 4 (Innovative Designer — students use a deliberate design process to generate ideas, test theories, solve problems, and create original works) and Standard 5 (Computational Thinker — students develop and employ strategies for understanding and solving problems in ways that leverage technology, e.g., breaking a problem down, planning, testing). Both map directly to web design and technical problem-solving. Framework field: "ISTE". Name the standard (e.g., "ISTE Standard 4: Innovative Designer") when confident; otherwise describe the competency.
- CSTA K-12 Computer Science Standards (Computer Science Teachers Association) — the primary COMPUTER SCIENCE CONTENT framework, used wherever the lesson blends into broader computing/coding (algorithms & programming, data & analysis, computing systems, networks & the internet, and impacts of computing). Framework field: "CSTA". Use the CSTA identifier (e.g., "CSTA 2-AP-13") only when confident; otherwise describe the concept clearly and omit the code.
Then include entries from this where the lesson content maps to it:
- CompTIA — the recognized industry-standard IT credentialing body this pathway builds toward (IT Fundamentals+ / ITF+ at the entry level, then A+, Network+, Security+). Framework field: "CompTIA". Especially relevant for the broader IT-foundations, computing-systems, networking, and cybersecurity content. (This body is parallel to how HOSA/NHA function for Health Science and ServSafe for Hospitality & Tourism.)
Content areas to prioritize: (a) Web Design fundamentals — HTML/CSS basics, website structure & layout, user-experience/design principles, and responsive-design concepts; (b) Web Design tools & workflow — introduce design/development tools in an age-appropriate, TOOL-AGNOSTIC way wherever possible (specific software varies by school), and the plan → build → test → revise project workflow; (c) at the Introductory / MS Exploratory level, broader IT foundations — basic computing concepts, digital literacy, how the internet and web work, and cybersecurity basics; and (d) career connections — IT/web-design career paths, portfolio-building concepts, and the industry certifications students might pursue (CompTIA). Keep tool references generalizable across schools rather than tied to one product.`,
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
- Project Lead The Way (PLTW) — the leading national STEM/Engineering CTE curriculum provider (PLTW Gateway at the middle level; the Engineering pathway at the high-school level, e.g., Introduction to Engineering Design, Principles of Engineering, Computer Science). Framework field: "PLTW". Name the PLTW course/unit when confident; otherwise describe the competency. PLTW is the primary anchor for this pathway's career-prep framing.
- Engineering Design Process (EDP) — the core problem-solving framework: Ask → Imagine → Plan → Create → Improve (the SAME cycle used in the Makerspace module). Framework field: "Engineering Design Process". Structure applied problems around this cycle and name the phase(s) a task targets.
Then include entries from these where the lesson content maps to them:
- FIRST (For Inspiration and Recognition of Science and Technology) and RECF (Robotics Education & Competition Foundation) — the major national robotics competition/curriculum bodies. For robotics content, align build/program tasks and project structure to FIRST (e.g., FIRST LEGO League, FIRST Tech Challenge) and/or RECF (VEX) programs and their competition and engineering-notebook structure. Framework field: "FIRST" or "RECF".
- Computing / computational-thinking foundations — GENERAL, foundational programming and computational-thinking concepts (algorithms, sequencing, loops, conditionals, decomposition, debugging). Keep this general/foundational computing, DISTINCT from the Information Technology pathway's web-design focus. Framework field: "Computational Thinking" (or cite CSTA where a specific CS standard clearly applies).
Content areas to prioritize: (a) Exploration of Engineering & Technology (especially at the MS Exploratory level) — a broad survey of engineering fields/disciplines, design-thinking basics, and hands-on exploratory projects; (b) Computing Foundations — programming basics, computational thinking, and intro coding concepts (foundational/general, NOT web design); (c) Robotics — building and programming robotics platforms, sensor/actuator basics, and competition-style project structure (FIRST/RECF-aligned); and (d) Engineering Design & Problem-Solving — the full Engineering Design Process applied to real problems, prototyping, and iteration. KEEP THIS PATHWAY'S IDENTITY on formal CTE career preparation — industry connections, PLTW/FIRST alignment, engineering careers and postsecondary pathways, and the engineering-notebook/portfolio habit — rather than duplicating a general classroom maker project.`,
    business_mgmt: `Primary frameworks for Business Management & Administration (the broad OPERATIONS / MANAGEMENT / LEADERSHIP side of running a business — DISTINCT from the Finance pathway's personal-finance / financial-services focus and the Marketing pathway's promotion / sales focus) — lead the competency list with entries from these, and treat the state CTE task list above as the state verification layer for them:
- MBA Research & Curriculum Center (MBAResearch) — the widely used National Business Administration Standards and performance indicators for management, administration, and business operations. Framework field: "MBA Research". Use its performance-indicator format when confident; otherwise describe the competency and omit the code.
- NBEA (National Business Education Association) National Standards for Business Education — the recognized content standards across business; lead with the Management, Economics / Business Operations, and Entrepreneurship strands for this pathway. Framework field: "NBEA".
Then include entries from these where the lesson content maps to them:
- FBLA-PBL (Future Business Leaders of America–Phi Beta Lambda) — the recognized national CTSO for this cluster (parallel to DECA for Marketing, FCCLA for FCS, HOSA for Health Science). Align applied tasks, projects, and leadership/professionalism content to relevant FBLA competitive events (e.g., Business Management, Organizational Leadership, Human Resource Management, Entrepreneurship, Introduction to Business). Framework field: "FBLA".
- Common Career Technical Core (CCTC) — Advance CTE's cross-cluster standards; use the Career Ready Practices and the Business Management & Administration cluster/pathway standards as a supporting reference. Framework field: "CCTC".
Content areas to prioritize: (a) business fundamentals — economics basics, how businesses operate, and business structures/types (sole proprietorship, partnership, corporation, LLC); (b) management principles — planning, organizing, directing/leading, decision-making, and leadership basics; (c) human resources & operations — basic HR concepts (hiring, roles, workplace culture), workplace operations, and administrative/organizational systems; and (d) entrepreneurship & financial decision-making — budgeting basics, financial decision-making in a BUSINESS context (not personal finance), and introductory entrepreneurship concepts. Keep this pathway's identity on OPERATIONS, MANAGEMENT, and LEADERSHIP of an organization — NOT personal financial literacy (that's Finance) and NOT promotion/selling (that's Marketing).`,
    agriculture: `Primary framework for Agriculture, Food & Natural Resources (AFNR) — one of the largest, most widely-offered CTE clusters nationally (especially in rural districts) — lead the competency list with entries from these, and treat the state CTE task list above as the state verification layer for them:
- AFNR Career Cluster Content Standards (developed by the National Council for Agricultural Education, "The Council") — the primary national content framework, organized around career pathways: Agribusiness Systems; Animal Systems; Plant Systems; Environmental Service Systems; Natural Resource Systems; Power, Structural & Technical Systems; Food Products & Processing Systems; and Biotechnology Systems. Framework field: "AFNR". Name the AFNR pathway and standard/performance-indicator (e.g., "AFNR — Plant Systems (PS)") when confident; otherwise describe the competency and omit the code.
- Career Ready Practices (CRP) — the 12 transferable career-ready skills that form the FOUNDATIONAL layer of the AFNR standards structure (e.g., act as a responsible and contributing citizen, apply appropriate academic and technical skills, communicate clearly and effectively, work productively in teams). Framework field: "Career Ready Practices". Anchor employability/professionalism content here.
Then include entries from these where the lesson content maps to them:
- National FFA Organization — the national CTSO for agricultural education, and a CORE, intracurricular program component of ag ed (NOT merely an extracurricular add-on): align applied tasks, leadership/professionalism, Career Development Events (CDEs) and Leadership Development Events (LDEs), degrees, and proficiency awards. Framework field: "FFA". Also note MANRRS (Minorities in Agriculture, Natural Resources, and Related Sciences) as a relevant related organization for career and collegiate connections.
Content areas to prioritize: (a) Plant Science — crop production, horticulture basics, and plant systems; (b) Animal Science — large- and small-animal industries and animal care/production basics; (c) Natural Resources — environmental stewardship, conservation, and human interaction with natural resources and wildlife; and (d) Agribusiness — basic business and economic principles applied to agricultural products and services. Where relevant, frame the pathway around the three-circle agricultural-education model: classroom/lab instruction + FFA + Supervised Agricultural Experience (SAE).`,
    construction: `Primary industry framework for Architecture & Construction — lead the competency list with entries from this, and treat the state CTE task list above as the state verification layer for it:
- NCCER (National Center for Construction Education and Research) — the recognized NATIONAL standard for construction-trades curriculum and credentialing, organized around Core (basic safety, construction math, hand & power tools, construction drawings/blueprints, materials handling) plus craft-specific curricula (Carpentry, Electrical, Plumbing, HVAC, Masonry, Welding, Heavy Equipment, and more). Framework field: "NCCER". Name the NCCER module/level when confident (e.g., "NCCER Core — Introduction to Construction Drawings"); otherwise describe the competency clearly and omit the code. NCCER credentials (and the NCCER Registry) are the recognized entry credentials students can pursue. NCCER is parallel to how ASE functions for automotive, NIMS for manufacturing, and HOSA/NHA for Health Science.
Then include entries from these where the lesson content maps to them:
- SkillsUSA — the CTSO most closely associated with this cluster (national, parallel to DECA/FBLA/HOSA). Align applied tasks, projects, and professionalism to relevant SkillsUSA events (e.g., Carpentry, Electrical Construction Wiring, Plumbing, HVAC-R, Cabinetmaking, TeamWorks). Framework field: "SkillsUSA".
- OSHA — construction-industry workplace-safety standards are directly relevant given power tools, ladders, scaffolding, heights, and lifting; align safety content to OSHA Construction (29 CFR 1926) expectations — fall protection, PPE, tool and electrical safety, and jobsite hazard awareness. The OSHA-10 (Construction) card is a common entry safety credential. Framework field: "OSHA". (See the SAFETY directive in this prompt for how to handle shop/jobsite safety.)
Content areas to prioritize: (a) design / pre-construction — basic drafting concepts, blueprint / construction-drawing reading, and architectural design fundamentals; (b) construction fundamentals — basic building systems, materials, and construction methods and sequencing; (c) trades foundations — an introductory/exploratory overview of the specific trades (electrical, HVAC, plumbing, carpentry, and related); and (d) jobsite/shop safety — tool safety, fall protection, PPE, and jobsite hazard awareness (treat with the same seriousness as clinical safety — see the SAFETY directive).`,
    arts_av: `Primary framework for Arts, A/V Technology & Communications. NOTE: this cluster is more DIFFUSE than most (no single dominant credentialing body), so the CONTENT itself should carry the pathway's credibility more than name-dropping certifications — align to standards, keep software instruction tool-agnostic where possible, and only cite a credential when the content clearly maps to it. Lead the competency list with entries from this, and treat the state CTE task list above as the state verification layer for it:
- Common Career Technical Core (CCTC) — the cluster's performance elements (Advance CTE), organized by pathway: Audio & Video Technology & Film (AR-AV), Journalism & Broadcasting (AR-JB), Printing Technology (AR-PRT), Visual Arts (AR-VIS), Performing Arts (AR-PER), and Telecommunications (AR-TEL), plus the Career Ready Practices. Framework field: "CCTC". Use the pathway code (e.g., "AR-PRT" for printing, "AR-JB" for journalism/broadcasting, "AR-VIS" for visual/graphic design) and performance-element numbering when confident; otherwise describe the standard and omit the code.
Then include entries from these ONLY where the lesson content clearly maps to them (secondary — do not over-cite):
- Adobe Certified Professional — a widely recognized industry credential for creative/design-software skills (e.g., Photoshop, Illustrator, Premiere Pro, After Effects); reference it where the lesson builds those transferable skills, but keep software instruction TOOL-AGNOSTIC where possible (design principles transfer across tools). Framework field: "Adobe Certified Professional".
- SkillsUSA — the CTSO with relevant AV / graphic-communications events (e.g., Audio/Radio Production, Television/Video Production, Graphic Communications, Photography). Framework field: "SkillsUSA".
Content areas to prioritize: (a) graphic design fundamentals — visual design principles, typography, and basic design-software concepts (tool-agnostic where possible); (b) video / broadcast / journalism — basic video production, broadcast-journalism concepts, storytelling for media, and interviewing/reporting basics; (c) digital media & interactive design — web/digital content creation and basic animation or interactive-media concepts; and (d) printing & imaging (especially at the foundational/Intro level) — basic print-production concepts, project planning, and quality control in creative production. Keep the pathway's identity on APPLIED creative/communications production and a portfolio habit.`,
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
    career_readiness: ["Employability-skills badges / digital-literacy micro-credentials appropriate for middle school (e.g., typing proficiency, Google/Microsoft basics)", "FBLA-Middle Level or SkillsUSA recognition (career-readiness competitive events)", "ACT WorkKeys National Career Readiness Certificate (NCRC) — introduced as a longer-term high-school/adult goal, not attained in middle school"],
    information_technology: ["CompTIA IT Fundamentals+ (ITF+) — entry-level IT credential (with A+ / Network+ / Security+ as later goals)", "Web-design / development certificates & micro-credentials (e.g., Responsive Web Design, HTML & CSS)", "FBLA Website Design / Introduction to Programming competitive event recognition"],
    transportation: ["ASE Student Certification (ASE Education Foundation) — the recognized entry credential", "ASE Maintenance & Light Repair (MLR) certification track — the professional-technician goal", "SkillsUSA competitive-event recognition (e.g., Automotive Service Technology); OSHA-10 / shop-safety credential where offered"],
    manufacturing: ["NIMS credentials (e.g., Measurement, Materials & Safety; Machining Level I) — the recognized entry credentials", "MSSC Certified Production Technician (CPT); SACA Smart Automation / Industry 4.0 credentials", "SkillsUSA competitive-event recognition (e.g., Precision Machining, Automated Manufacturing); OSHA-10 general-industry safety"],
    engineering_tech: ["PLTW course credentials / end-of-course assessments (e.g., Introduction to Engineering Design, Principles of Engineering)", "FIRST / RECF (VEX) robotics competition recognition & engineering-notebook awards", "SkillsUSA (e.g., Robotics & Automation, Engineering Technology); articulated college credit where offered"],
    business_mgmt: ["FBLA competitive-event recognition (e.g., Business Management, Organizational Leadership, Entrepreneurship)", "MBAResearch / NBEA-aligned business administration assessments & certificates", "Entrepreneurship & Small Business (ESB) or Microsoft Office Specialist (administrative skills) certifications where offered"],
    agriculture: ["FFA degrees, proficiency awards & Career Development Event (CDE) recognition", "Supervised Agricultural Experience (SAE) records & National FFA SAE recognition", "AFNR industry certifications where offered (e.g., Certified Veterinary Assistant, pesticide applicator, ServSafe for food products, welding)"],
    construction: ["NCCER Core & craft-area credentials (NCCER Registry) — the recognized entry credentials", "OSHA-10 (Construction) safety card", "SkillsUSA competitive-event recognition (e.g., Carpentry, Electrical, Plumbing, HVAC-R); pre-apprenticeship certificates (NCCER / trade-council programs)"],
    arts_av: ["A portfolio / demo reel of finished creative work — the primary currency of this field", "Adobe Certified Professional (e.g., Photoshop, Illustrator, Premiere Pro) where the program teaches those tools", "SkillsUSA competitive-event recognition (e.g., Graphic Communications, Television/Video Production, Photography)"],
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
      { level: "concentrator", course: "Web Design & Development / IT Concentration", description: "Applied web design & development — deeper HTML/CSS, responsive and user-centered design, the plan→build→test→revise workflow and design tools, plus CompTIA ITF+-level IT foundations (systems, networks, security)." },
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
      { level: "introductory", course: "Exploration of Engineering & Technology (MS/PLTW Gateway) / Introduction to Engineering Design (HS Intro)", description: "Foundations — a broad survey of engineering fields, design-thinking and the engineering design process, computing/computational-thinking basics, intro robotics, and hands-on exploratory projects." },
      { level: "concentrator", course: "Principles of Engineering / Robotics & Computing (PLTW pathway)", description: "Applied engineering — deeper engineering design and problem-solving, robotics build-and-program to FIRST/RECF structure, computing foundations, prototyping and iteration, and engineering-notebook documentation." },
      { level: "completer", course: "Engineering Design & Development / Capstone, Competition & Work-Based Learning", description: "Capstone engineering project (student-directed design or a competition robot), a professional engineering portfolio/notebook, FIRST/RECF competition, PLTW end-of-course credential, and an internship or mentorship with an engineering employer or program." },
    ],
    business_mgmt: [
      { level: "introductory", course: "Introduction to Business / Business Management I", description: "Foundations — economics basics, how businesses operate, business structures/types, an introduction to the management functions, and business career awareness." },
      { level: "concentrator", course: "Business Management / Principles of Management & Administration", description: "Applied management — planning, organizing, leading and decision-making, human resources and operations, administrative/organizational systems, and business financial decision-making, aligned to NBEA / MBA Research and FBLA events." },
      { level: "completer", course: "Advanced Business Management / Capstone, Entrepreneurship & Work-Based Learning", description: "Capstone business/management project or venture plan, entrepreneurship, FBLA competitive events, an industry-aligned business certification, and work-based learning in a business/administrative setting." },
    ],
    agriculture: [
      { level: "introductory", course: "Introduction to Agriculture, Food & Natural Resources / Agriscience I", description: "Foundations — a survey of the AFNR pathways (plant, animal, natural resources, agribusiness), agriscience basics, an introduction to FFA and Supervised Agricultural Experience (SAE), and career awareness across the cluster." },
      { level: "concentrator", course: "Plant / Animal / Natural Resource / Agribusiness Systems (AFNR pathway course)", description: "Applied pathway coursework to AFNR standards — deeper plant, animal, natural-resource, or agribusiness science and skills, FFA Career Development Events, and an ongoing SAE project." },
      { level: "completer", course: "Advanced AFNR / Capstone, SAE, FFA & Work-Based Learning", description: "Capstone project, an expanded Supervised Agricultural Experience (entrepreneurship / placement / research), FFA degrees and proficiency awards, industry-credential attainment, and work-based learning in an agriculture / natural-resources setting." },
    ],
    construction: [
      { level: "introductory", course: "Introduction to Architecture & Construction / NCCER Core", description: "Foundations — jobsite and tool safety (OSHA / NCCER Core), construction math and measurement, blueprint / construction-drawing reading, materials handling, and an exploratory overview of the construction trades and architectural design." },
      { level: "concentrator", course: "Construction Trades / Carpentry, Electrical, Plumbing or HVAC (NCCER craft)", description: "Applied craft coursework to NCCER standards in a chosen trade, construction methods and sequencing, layout and skilled tool use, and jobsite safety to OSHA standard, with SkillsUSA competition alignment." },
      { level: "completer", course: "Advanced Construction / Capstone, NCCER Credential & Work-Based Learning", description: "Capstone build or design project, NCCER craft-credential attainment, OSHA-10, SkillsUSA competitive events, a registered (pre-)apprenticeship or co-op, and supervised work-based learning on a real jobsite or with a contractor." },
    ],
    arts_av: [
      { level: "introductory", course: "Introduction to Arts, A/V Technology & Communications / Digital Media I", description: "Foundations — visual design principles and typography, an introduction to video/broadcast/journalism and digital media, printing & imaging basics, tool-agnostic software concepts, and career awareness across the cluster." },
      { level: "concentrator", course: "Graphic Design / Digital Media / Video & Broadcast Production (pathway course)", description: "Applied production in a chosen pathway (visual/graphic design, AV/film, journalism/broadcasting, or digital/interactive media) to CCTC standards, deeper software skill, media storytelling, and an ongoing portfolio." },
      { level: "completer", course: "Advanced Media Production / Capstone, Portfolio & Work-Based Learning", description: "Capstone client or personal project, a professional portfolio/demo reel, industry-credential attainment (e.g., Adobe Certified Professional), SkillsUSA competition, and an internship or freelance/mentorship experience in a creative/media setting." },
    ],
  }[pathway] ?? []
}

// Optional pathway-specific work-based learning guidance, appended to the WBL block.
// Human Services, Health Science, and Education & Training use Virginia's High-Quality
// Work-Based Learning (HQWBL) model, which recognizes a broader set of 12 methods than
// the internship/shadow/speaker default.
function getWblGuidance(pathway) {
  if (pathway === "human_services" || pathway === "health_science" || pathway === "education" || pathway === "career_readiness" || pathway === "information_technology" || pathway === "transportation" || pathway === "manufacturing" || pathway === "engineering_tech" || pathway === "business_mgmt" || pathway === "agriculture" || pathway === "construction" || pathway === "arts_av") {
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

SAFETY (safety_notes field) — CRITICAL FOR THIS PATHWAY: Construction and construction-shop work involves REAL physical risk — falls from ladders, scaffolds, and heights (the leading cause of construction fatalities); power and hand tools (saws, nail guns, drills); electrical hazards; struck-by and caught-in/between hazards; heavy and awkward lifting and material handling; and dust, noise, and eye hazards. Treat safety with the SAME seriousness as a health-science clinical lesson — never generic "be careful." Populate the safety_notes array with SPECIFIC, lesson-relevant hazards and their controls (e.g., fall protection and correct ladder/scaffold setup and use; PPE — hard hat, safety glasses/face shield, hearing protection, gloves, and closed-toe/steel-toe boots, with NO loose clothing or jewelry near power tools; power-tool guards, inspection, and safe operation; electrical safety and lockout/tagout where relevant; proper lifting and team lifts; and keeping the work area clear of cords, tripping hazards, and debris), and foreground the relevant safety point inside the Concept Instruction, Skill Demonstration, and Hands-On phases. The FIRST item in safety_notes MUST be this boundary statement, verbatim: "This lesson plan supports classroom and lab PLANNING only. It is not a substitute for your program's required shop-safety training, certification, supervision, and equipment/PPE. Follow your school's and district's safety policies and any applicable OSHA / NCCER shop-safety requirements before any hands-on work."`
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
 * @param {'hospitality'|'finance'|'marketing'|'human_services'|'health_science'|'education'|'career_readiness'|'information_technology'|'transportation'|'manufacturing'|'engineering_tech'|'business_mgmt'|'agriculture'|'construction'|'arts_av'} input.pathway
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
  const safetyGuidance = getSafetyGuidance(pathway)

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
