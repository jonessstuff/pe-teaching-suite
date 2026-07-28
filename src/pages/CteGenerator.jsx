import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, UtensilsCrossed, Landmark, Megaphone, HeartHandshake, Stethoscope, GraduationCap, Compass, Code2, Wrench, Factory, Cpu, Building2, Sprout, HardHat, Clapperboard, Scale, Shield, Scissors, Gavel, Ticket, Dumbbell, Sparkles, Loader2, Plus, X, ArrowLeft, ExternalLink, ChevronDown } from 'lucide-react'
import { generateCteLesson } from '../services/generationService'
import { createLesson } from '../services/lessonsService'
import { US_STATES } from '../constants/usStates'
import CtePlanRenderer from '../components/renderers/CtePlanRenderer'
import SecondaryToolsPanel from '../components/lesson/SecondaryToolsPanel'

const PATHWAYS = [
  {
    value: 'hospitality',
    label: 'Hospitality & Tourism',
    description: 'Lodging, travel & guest service, plus a deep culinary-arts strand — knife skills, cooking methods, the brigade system, baking & restaurant management (ProStart/FRMCA, ServSafe, ACF)',
    icon: UtensilsCrossed,
  },
  {
    value: 'finance',
    label: 'Finance',
    description: 'Personal finance, banking, accounting, investing & insurance',
    icon: Landmark,
  },
  {
    value: 'marketing',
    label: 'Marketing',
    description: 'The marketing mix, promotion, selling, branding & fashion marketing',
    icon: Megaphone,
  },
  {
    value: 'human_services',
    label: 'Human Services / FCS',
    description: 'Family & Consumer Sciences, independent living & workplace readiness',
    icon: HeartHandshake,
  },
  {
    value: 'health_science',
    label: 'Health Science',
    description: 'Anatomy & physiology, clinical skills, medical terminology, dental assisting & careers',
    icon: Stethoscope,
  },
  {
    value: 'education',
    label: 'Education & Training',
    description: 'Principles of education, instructional practices, human growth & development, and practicum',
    icon: GraduationCap,
  },
  {
    value: 'career_readiness',
    label: 'Career Readiness',
    description: 'MS foundations — career exploration, employability skills, business communication & tech',
    icon: Compass,
  },
  {
    value: 'information_technology',
    label: 'Information Technology',
    description: 'Web design & IT foundations, plus dedicated cybersecurity (CIA triad, threats, ethics — CompTIA path) and computer-programming (fundamentals, algorithms, debugging, impacts — CSTA / AP CSP & CSA) strands — conceptual & language-agnostic',
    icon: Code2,
  },
  {
    value: 'transportation',
    label: 'Transportation, Distribution & Logistics',
    description: 'Automotive maintenance & light repair (MLR) — systems, shop safety, diagnostics & the wider T&L cluster',
    icon: Wrench,
  },
  {
    value: 'manufacturing',
    label: 'Manufacturing',
    description: 'Production & machining, Smart Manufacturing / Industry 4.0 (automation, robotics, IIoT), QA & shop safety',
    icon: Factory,
  },
  {
    value: 'engineering_tech',
    label: 'STEM / Engineering & Technology',
    description: 'Career-prep engineering — design process, robotics (FIRST/RECF), electronics, aerospace, computing foundations & PLTW alignment',
    icon: Cpu,
  },
  {
    value: 'business_mgmt',
    label: 'Business Management & Administration',
    description: 'Operations, management & leadership — business structures, HR, decision-making & entrepreneurship',
    icon: Building2,
  },
  {
    value: 'agriculture',
    label: 'Agriculture, Food & Natural Resources',
    description: 'AFNR — plant & animal science, veterinary science, natural resources & conservation, agribusiness, with SAE & FFA',
    icon: Sprout,
  },
  {
    value: 'construction',
    label: 'Architecture & Construction',
    description: 'Blueprint reading & design, building systems & methods, and the construction trades — electrical, carpentry, welding, masonry, sheet metal, heavy equipment, roofing, plumbing & HVAC-R — with jobsite safety (NCCER / SkillsUSA)',
    icon: HardHat,
  },
  {
    value: 'arts_av',
    label: 'Arts, A/V Technology & Communications',
    description: 'Graphic design, video/broadcast/journalism, digital & interactive media, and print — portfolio-driven',
    icon: Clapperboard,
  },
  {
    value: 'government',
    label: 'Government & Public Administration',
    description: 'How government works — governance & policy, public administration, planning/revenue/regulation & public service',
    icon: Scale,
  },
  {
    value: 'law_safety',
    label: 'Law, Public Safety, Corrections & Security',
    description: 'Criminal justice & corrections, pre-law & the legal system, fire management, ethics & careers (exploration only)',
    icon: Shield,
  },
  {
    value: 'cosmetology',
    label: 'Cosmetology / Personal Care Services',
    description: 'Hair, skin & nail services, infection control & safety, and the path to state licensure (NIC / SkillsUSA) — hours vary by state',
    icon: Scissors,
  },
  {
    value: 'business_law',
    label: 'Business Law',
    description: 'How business & the legal system work — contracts, consumer & employment law, and business ethics (NBEA / FBLA / DECA; educational, not legal advice)',
    icon: Gavel,
  },
  {
    value: 'sports_entertainment',
    label: 'Sports & Entertainment Marketing',
    description: 'Marketing for sports & entertainment — teams, athletes, events, branding, sponsorship & endorsements (Precision Exams 416 / DECA SEM)',
    icon: Ticket,
  },
  {
    value: 'exercise_science',
    label: 'Exercise Science / Sports Medicine',
    description: 'Sports-medicine team & therapeutic careers, anatomy/kinesiology, injury prevention & care, fitness & nutrition (NASM-CPT / HOSA) — awareness-level; CPR cert needs a certified instructor',
    icon: Dumbbell,
  },
]

// The 21 pathways grouped into 6 logical categories for scannability. Career
// Readiness is pinned first as the foundational entry point. Order within each
// group is intentional. Every pathway value MUST appear in exactly one group.
const PATHWAY_GROUPS = [
  { label: 'Career Foundations', values: ['career_readiness'] },
  { label: 'Business, Finance & Marketing', values: ['finance', 'marketing', 'sports_entertainment', 'business_mgmt', 'business_law', 'hospitality'] },
  { label: 'Health & Human Services', values: ['health_science', 'exercise_science', 'human_services', 'education', 'cosmetology'] },
  { label: 'Technology & Engineering', values: ['information_technology', 'engineering_tech'] },
  { label: 'Skilled Trades & Industrial', values: ['transportation', 'manufacturing', 'construction', 'agriculture'] },
  { label: 'Arts, Government & Public Service', values: ['arts_av', 'government', 'law_safety'] },
]

const PATHWAY_BY_VALUE = Object.fromEntries(PATHWAYS.map((p) => [p.value, p]))
const GROUP_FOR_PATHWAY = Object.fromEntries(
  PATHWAY_GROUPS.flatMap((g) => g.values.map((v) => [v, g.label]))
)

const LEVELS = [
  { value: 'introductory', label: 'Introductory', description: 'Foundational — first course in the pathway' },
  { value: 'concentrator', label: 'Concentrator', description: 'Deeper technical skill & credential prep' },
  { value: 'completer', label: 'Completer', description: 'Capstone, credential attainment & WBL' },
]

const TOPIC_PLACEHOLDERS = {
  hospitality: 'e.g. Knife cuts & knife safety, Dry vs. moist heat cooking methods, Mise en place, The kitchen brigade system, Menu planning & food-cost %, Baking basics (leavening), Food safety & sanitation (ServSafe), Front desk check-in, Planning a destination tour',
  finance:     'e.g. Building a monthly budget, Comparing two credit-card offers, Simple vs. compound interest, Reading a pay stub, Insurance basics & policy types, Risk management & careers in insurance',
  marketing:   'e.g. Identify a target market, Build the marketing mix for a product, Analyze a real ad campaign, DECA role-play prep, The fashion cycle & fashion capitals, Retail buying & merchandising (fashion), Visual merchandising & social-media promotion, Fashion marketing careers',
  human_services: 'e.g. Reading a nutrition label, Building a personal budget, Age-appropriate child activities, Mock job interview & workplace readiness',
  health_science: 'e.g. Taking vital signs, The cardiovascular system, Medical terminology word parts, Infection control & PPE, Patient positioning, Dental anatomy & tooth numbering, Chairside assisting & dental instruments, Dental radiography & radiation safety',
  education: 'e.g. History & philosophy of education (Principles of Education), Writing a measurable learning objective, Instructional strategies & differentiation, Classroom management routines & procedures, Piaget/Erikson/Vygotsky applied to teaching, Designing a classroom observation & reflection (practicum)',
  career_readiness: 'e.g. Interest & strengths self-assessment, Exploring the 16 career clusters, Writing a professional email, Teamwork & communication skills, Setting a career goal, Age-appropriate resume basics, Keyboarding & touch-typing (digital literacy), Spreadsheet formulas & charts (computer applications), Digital footprint & source credibility (MS digital citizenship), Loops & conditionals in Scratch (MS coding)',
  information_technology: 'e.g. HTML/CSS & responsive design, The CIA triad & cyber threats, Network security basics, Cyber ethics & responsible disclosure, Trace a loop in pseudocode, Variables/conditionals/functions, Decomposition & debugging, Bias in algorithms (impacts of computing), AP CSP big ideas',
  transportation: 'e.g. Brake system inspection, How a 4-stroke engine works, Suspension & steering check, Reading a service manual, Shop safety & vehicle-lift operation, Intro to the transportation & logistics cluster',
  manufacturing: 'e.g. Precision measurement with calipers, Blueprint/print reading, Intro to CNC machining, Robotics & automation basics, IIoT & smart sensors, Lockout/tagout & machine safety, Materials & production processes',
  engineering_tech: 'e.g. The engineering design process, Exploring engineering fields, Build & program a robot (FIRST/VEX), Sensors & actuators, Intro to coding & computational thinking, Principles of flight & aircraft systems (aerospace), Avionics & aircraft electronics overview, Ohm\'s law & circuits / reading schematics (Electronics I), Digital electronics & troubleshooting (Electronics II)',
  business_mgmt: 'e.g. The four functions of management, Business structures (LLC vs. corporation), A management decision case, Building a basic operating budget, Org charts & workflow, Intro to entrepreneurship, Basic HR concepts, Project management & the project lifecycle (Gantt charts), Resume, portfolio & interview skills (career management), Office productivity & responsible AI tools',
  agriculture: 'e.g. Plant growth & soil basics, Crop production, Animal care & husbandry, Veterinary medical terminology, Animal handling & restraint (vet science), Vital signs (TPR) & vet nursing basics, Parasitology & disease prevention, Conservation & water quality, Agribusiness, Intro to FFA & SAE projects',
  construction: 'e.g. Reading a floor plan, Framing & layout (carpentry), Series vs. parallel circuits (electrical), Welding processes & safety, Masonry bond patterns, Sheet-metal & ductwork, Heavy-equipment awareness, Roofing systems, The refrigeration cycle (HVAC-R) & EPA 608, Plumbing supply & drainage, Fall-protection safety',
  arts_av: 'e.g. Design principles & typography, Designing a poster or logo, Shooting & editing a short video, Broadcast journalism & interviewing, Digital/interactive media basics, Print production & quality control, Page layout & grids (desktop publishing), Designing a newsletter or yearbook spread, Print-ready PDF & publication workflow',
  government: 'e.g. How a bill becomes law, Levels of government (local/state/federal), How public agencies are managed, Public budgeting & taxation basics, Analyzing a local policy issue, Intro to public-service careers',
  law_safety: 'e.g. How the justice system works, Law-enforcement career paths, Court procedures overview, Legal careers (paralegal/attorney), Corrections overview, Firefighter career path & fire behavior, Ethics & professionalism',
  cosmetology: 'e.g. Infection control & disinfection, Sectioning & parting the hair, Basic haircut/styling technique, Patch testing before color, Manicure setup & sanitation, Facial steps & skin analysis, The path to state licensure (hours vary by state)',
  business_law: 'e.g. Elements of a valid contract, Breach of contract & remedies, Consumer protection basics, Civil vs. criminal law, Court system structure, Employment at-will & agency, A business ethics case study (FBLA/DECA-style)',
  sports_entertainment: 'e.g. Build a sponsorship pitch, Athlete/celebrity endorsement deals, Promote a concert or festival, Ticket-pricing & promotion strategy, Co-branding & licensing, Event marketing plan, DECA SEM role-play prep',
  exercise_science: 'e.g. The sports-medicine team & careers, Muscles & joints in a movement, Injury prevention & RICE, Taping/wrapping awareness, Sport nutrition basics, Exercise programming concepts, HOSA Sports Medicine prep',
}

const MATERIAL_PLACEHOLDERS = {
  hospitality: [
    'e.g. Place-setting kits — 1 per pair',
    'e.g. Mock front-desk station',
    'e.g. Sanitation supplies & gloves',
    'e.g. Guest-scenario role-play cards',
    'e.g. Sample menus / property brochures',
    'e.g. ServSafe practice materials',
    'e.g. Aprons — 1 per student',
    'e.g. Tablet for reservation software',
  ],
  finance: [
    'e.g. Laptops with spreadsheet software — 1 per student',
    'e.g. Sample credit-card agreements (printed)',
    'e.g. Mock pay stubs — 1 per student',
    'e.g. Financial calculators',
    'e.g. Budget worksheet (printed)',
    'e.g. Sample bank statements',
    'e.g. FBLA event guidelines',
    'e.g. Projector for worked examples',
  ],
  marketing: [
    'e.g. Sample product packaging — 6 assorted',
    'e.g. Laptops with Canva — 1 per team',
    'e.g. Real ad examples (print or video)',
    'e.g. Poster paper & markers',
    'e.g. DECA role-play scenario cards',
    'e.g. Market-research survey template',
    'e.g. Brand logo cards for analysis',
    'e.g. Projector for campaign analysis',
  ],
  human_services: [
    'e.g. Nutrition labels / food models',
    'e.g. Measuring cups & basic foods-lab tools',
    'e.g. Budget worksheet (printed)',
    'e.g. Child-development activity supplies',
    'e.g. Mock interview question cards',
    'e.g. Sample consumer contracts / ads',
    'e.g. FCCLA STAR Event guidelines',
    'e.g. Laptops for research — 1 per pair',
  ],
  health_science: [
    'e.g. Blood pressure cuffs — 1 per pair',
    'e.g. Stethoscopes — 1 per pair',
    'e.g. Digital thermometers',
    'e.g. Anatomical models / torso',
    'e.g. PPE — gloves & masks',
    'e.g. CPR manikins',
    'e.g. Medical terminology reference sheet',
    'e.g. Patient charting templates',
  ],
  education: [
    'e.g. Whiteboard & markers for modeling',
    'e.g. Lesson-plan templates (printed)',
    "e.g. Children's books for read-aloud practice",
    'e.g. Chart paper & sticky notes',
    'e.g. Document camera / projector',
    'e.g. Classroom-management scenario cards',
    'e.g. Clipboards for field-observation notes',
    'e.g. Laptops for lesson research — 1 per pair',
  ],
  career_readiness: [
    'e.g. Laptops/Chromebooks — 1 per student',
    'e.g. Interest / career-cluster self-assessment (printed)',
    'e.g. Career cluster sorting cards (16 clusters)',
    'e.g. Professional email / resume templates',
    'e.g. Informational-interview question sheet',
    'e.g. Sticky notes & chart paper',
    'e.g. Guest-speaker / career-fair sign-up sheet',
    'e.g. Projector for presentations',
  ],
  information_technology: [
    'e.g. Laptops/Chromebooks with a code editor — 1 per student',
    'e.g. Reliable internet access',
    'e.g. HTML/CSS reference / cheat sheet (printed)',
    'e.g. Wireframe / grid paper for layout sketching',
    'e.g. Sample websites (good vs. poor UX)',
    'e.g. Build checklist / rubric',
    'e.g. Projector for live-coding demos',
    'e.g. USB drives or cloud folders for saving work',
  ],
  transportation: [
    'e.g. Safety glasses — 1 per student',
    'e.g. Wheel chocks & jack stands',
    'e.g. Basic hand-tool set / torque wrench',
    'e.g. Brake, suspension or engine cutaway/model',
    'e.g. Service manual or service-info access',
    'e.g. Shop-safety checklist (printed)',
    'e.g. Digital multimeter',
    'e.g. Shop rags & fluid-spill kit',
  ],
  manufacturing: [
    'e.g. Safety glasses & hearing protection',
    'e.g. Digital calipers / micrometers — 1 per pair',
    'e.g. Sample blueprints / prints',
    'e.g. Metal/wood/plastic stock or sample parts',
    'e.g. Machine-safety & lockout/tagout checklist',
    'e.g. CNC simulator / robotics kit (where available)',
    'e.g. Go/no-go gauges or QC check sheets',
    'e.g. Bench vise & basic hand tools',
  ],
  engineering_tech: [
    'e.g. Robotics kits (VEX / LEGO / micro:bit) — 1 per team',
    'e.g. Laptops/Chromebooks for coding — 1 per pair',
    'e.g. Engineering notebooks — 1 per student',
    'e.g. Prototyping materials (cardboard, tape, connectors)',
    'e.g. Sensors & actuators (motors, distance/light)',
    'e.g. Design-challenge constraint cards',
    'e.g. Measuring tools (rulers, calipers)',
    'e.g. Projector for design/build demos',
  ],
  business_mgmt: [
    'e.g. Business case-study handouts',
    'e.g. Laptops/Chromebooks for research — 1 per pair',
    'e.g. Budget / spreadsheet templates',
    'e.g. Org-chart & workflow templates',
    'e.g. Sticky notes & chart paper',
    'e.g. Sample job descriptions / HR forms',
    'e.g. Business-plan template (printed)',
    'e.g. Projector for worked examples',
  ],
  agriculture: [
    'e.g. Seeds, potting soil & small pots',
    'e.g. Hand lenses / magnifiers',
    'e.g. Soil or water test kits',
    'e.g. Plant or animal specimens / models',
    'e.g. Gloves & basic lab/field tools',
    'e.g. AFNR / FFA CDE reference materials',
    'e.g. SAE record book / template',
    'e.g. Chart paper & markers',
  ],
  construction: [
    'e.g. Safety glasses & work gloves',
    'e.g. Tape measures & speed squares',
    'e.g. Sample blueprints / construction drawings',
    'e.g. Scale ruler / architect scale',
    'e.g. Lumber / building-material samples',
    'e.g. Levels & framing squares',
    'e.g. Jobsite-safety & PPE checklist',
    'e.g. Grid/graph paper for layout & sketching',
  ],
  arts_av: [
    'e.g. Laptops/tablets with design or editing software — 1 per student',
    'e.g. Sketch paper & pencils for layout/storyboards',
    'e.g. Cameras or smartphones for video/photo',
    'e.g. Sample designs / news clips (good vs. weak)',
    'e.g. Design-principles & typography reference',
    'e.g. Critique / project rubric',
    'e.g. Printer or print samples (for print/imaging)',
    'e.g. Microphone / tripod (for A/V)',
  ],
  government: [
    'e.g. Public-issue / policy case handouts',
    'e.g. Laptops/Chromebooks for research — 1 per pair',
    'e.g. Levels-of-government / branches reference chart',
    'e.g. Mock-government or council role cards',
    'e.g. Sample public budget (simplified)',
    'e.g. Sticky notes & chart paper',
    'e.g. Policy-proposal / PSA template',
    'e.g. Projector for discussion & examples',
  ],
  law_safety: [
    'e.g. Case-study / scenario handouts',
    'e.g. Justice-system flow chart (arrest → court → corrections)',
    'e.g. Career-path & requirements reference cards',
    'e.g. Mock-trial role cards & script',
    'e.g. Code-of-ethics / professionalism handout',
    'e.g. Laptops/Chromebooks for career research',
    'e.g. Fire-safety / fire-behavior reference (awareness)',
    'e.g. Chart paper & markers',
  ],
  cosmetology: [
    'e.g. Mannequin / training heads & clamps',
    'e.g. Shears, combs, sectioning clips (sanitized)',
    'e.g. EPA-registered disinfectant & sanitation supplies',
    'e.g. Gloves, capes/aprons & eye protection (PPE)',
    'e.g. Manicure/nail kit & hand replica',
    'e.g. Product SDS sheets & patch-test log',
    'e.g. State-board sanitation & licensing-hours reference',
  ],
  business_law: [
    'e.g. Business-law case-study / scenario handouts',
    'e.g. Sample contract with clauses to analyze',
    'e.g. Court-system / civil-vs-criminal reference chart',
    'e.g. FBLA/DECA Business Law & Ethics case & rubric',
    'e.g. Consumer-protection / employment-rights handout',
    'e.g. Ethics decision-making framework template',
    'e.g. Laptops/Chromebooks for case research',
  ],
  sports_entertainment: [
    'e.g. DECA SEM case study / role-play scenarios',
    'e.g. Real sponsorship & endorsement examples',
    'e.g. Sponsorship / promotion plan template',
    'e.g. Sample team, event, or athlete brand kits',
    'e.g. Ticket-pricing & promotion worksheet',
    'e.g. Poster/flyer or design tool for a mock campaign',
    'e.g. Laptops/Chromebooks for market research',
  ],
  exercise_science: [
    'e.g. Skeleton / muscle anatomy models or charts',
    'e.g. Athletic tape & pre-wrap (awareness demos only)',
    'e.g. Sports-medicine team & careers reference',
    'e.g. Injury-prevention / RICE handout',
    'e.g. Sport-nutrition & MyPlate reference',
    'e.g. Manikin for supervised awareness practice (where allowed)',
    'e.g. Laptops/Chromebooks for career & HOSA research',
  ],
}

export default function CteGenerator() {
  const [view, setView] = useState('form')

  // Pathway
  const [pathway, setPathway] = useState('hospitality')
  // Which category accordion sections are expanded — open the group holding the
  // current pathway by default so the selection is always visible on load.
  const [openGroups, setOpenGroups] = useState(() => new Set([GROUP_FOR_PATHWAY.hospitality]))

  // Two-tier grade model (replaces the K–5 grade toggle for CTE)
  const [tier, setTier] = useState('ms')
  const [level, setLevel] = useState('introductory')

  // Form fields
  const [state, setState] = useState('VA')
  const [classSize, setClassSize] = useState(25)
  const [duration, setDuration] = useState(90)
  const [topic, setTopic] = useState('')
  const [targetCompetency, setTargetCompetency] = useState('')
  const [materials, setMaterials] = useState(['', ''])

  // Multi-stage project
  const [isMultiStage, setIsMultiStage] = useState(false)
  const [sessionNumber, setSessionNumber] = useState(1)
  const [totalSessions, setTotalSessions] = useState(2)

  // Result
  const [generatedLesson, setGeneratedLesson] = useState(null)
  const [savedId, setSavedId] = useState(null)

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const placeholders = MATERIAL_PLACEHOLDERS[pathway] ?? MATERIAL_PLACEHOLDERS.hospitality

  const addMaterial = () => setMaterials((prev) => [...prev, ''])
  const removeMaterial = (i) => setMaterials((prev) => prev.filter((_, idx) => idx !== i))
  const setMaterial = (i, value) =>
    setMaterials((prev) => prev.map((m, idx) => (idx === i ? value : m)))

  function handlePathwayChange(value) {
    setPathway(value)
    setMaterials(['', ''])
    setTopic('')
  }

  function toggleGroup(label) {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  async function handleGenerate(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const lessonObject = await generateCteLesson({
        pathway,
        tier,
        level: tier === 'hs' ? level : '',
        topic: topic.trim(),
        materials: materials.filter(Boolean),
        classSize,
        durationMinutes: duration,
        targetCompetency: targetCompetency.trim(),
        state,
        sessionNumber: isMultiStage ? sessionNumber : 0,
        totalSessions: isMultiStage ? totalSessions : 0,
        // ELL accommodations are disabled for CTE: the ELL-augmented schema exceeds
        // the structured-outputs grammar limit and the schema-less fallback is unreliable.
        includeELL: false,
      })

      const saved = await createLesson(lessonObject, { aiModel: 'claude-haiku-4-5' })

      setGeneratedLesson(lessonObject)
      setSavedId(saved.id)
      setView('result')
    } catch (err) {
      setError(err.message ?? 'Generation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setView('form')
    setGeneratedLesson(null)
    setSavedId(null)
    setError(null)
  }

  if (view === 'result' && generatedLesson) {
    return (
      <div>
        {/* Toolbar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <Link
              to="/cte"
              className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors"
            >
              <ArrowLeft size={16} />
              CTE
            </Link>
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors"
            >
              Generate another
            </button>
            {savedId && (
              <Link
                to={`/lessons/${savedId}`}
                className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors"
              >
                View lesson detail
                <ExternalLink size={14} />
              </Link>
            )}
          </div>
        </div>

        {savedId && (
          <p className="mb-4 text-xs text-ink-500 print:hidden">
            Saved to your lesson archive.
          </p>
        )}

        {savedId && (
          <SecondaryToolsPanel
            savedId={savedId}
            lessonObject={generatedLesson}
            subject={generatedLesson?.subject}
          />
        )}

        <div className="mt-10">
          <CtePlanRenderer lesson={generatedLesson} />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <Link
          to="/cte"
          className="mb-3 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors"
        >
          <ArrowLeft size={14} />
          CTE home
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-500/20">
            <Briefcase size={18} className="text-pink-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-50">CTE Lesson Generator</h1>
            <p className="text-xs text-ink-500">
              Middle School &amp; High School · competency &amp; credential-aligned
            </p>
          </div>
        </div>
        <p className="text-sm text-ink-400 mt-3">
          Generate a complete Career &amp; Technical Education lesson across twenty-one pathways —
          all 16 national CTE clusters: Hospitality &amp; Tourism, Finance, Marketing, Human
          Services / FCS, Health Science, Education &amp; Training, Career Readiness (MS
          foundations), Information Technology, Transportation, Distribution &amp; Logistics,
          Manufacturing, STEM / Engineering &amp; Technology, Business Management &amp;
          Administration, Agriculture, Food &amp; Natural Resources, Architecture &amp; Construction,
          Arts, A/V Technology &amp; Communications, Government &amp; Public Administration, Law,
          Public Safety, Corrections &amp; Security, Cosmetology / Personal Care Services,
          Business Law, Sports &amp; Entertainment Marketing, or Exercise Science / Sports
          Medicine — with work-based learning and career pathway context built in.
        </p>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">

        {/* Pathway selector — 21 pathways grouped into 6 collapsible categories */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-ink-200">Pathway</h2>
          <div className="space-y-2">
            {PATHWAY_GROUPS.map((group) => {
              const isOpen = openGroups.has(group.label)
              const groupHasSelected = group.values.includes(pathway)
              return (
                <div key={group.label} className="overflow-hidden rounded-xl border border-ink-800 bg-ink-900/40">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.label)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-ink-900"
                  >
                    <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className={`text-sm font-semibold ${groupHasSelected ? 'text-pink-400' : 'text-ink-200'}`}>
                        {group.label}
                      </span>
                      <span className="text-xs text-ink-600">{group.values.length}</span>
                      {groupHasSelected && !isOpen && (
                        <span className="text-xs text-ink-500">· {PATHWAY_BY_VALUE[pathway].label}</span>
                      )}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-ink-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="grid gap-2 border-t border-ink-800 p-3 sm:grid-cols-2 lg:grid-cols-3">
                      {group.values.map((value) => {
                        const { label, icon: Icon } = PATHWAY_BY_VALUE[value]
                        const selected = pathway === value
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => handlePathwayChange(value)}
                            className={`flex items-center gap-2.5 rounded-lg border p-3 text-left transition-colors ${
                              selected
                                ? 'border-pink-400/50 bg-pink-500/15'
                                : 'border-ink-800 bg-ink-900 hover:border-ink-700'
                            }`}
                          >
                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                              selected ? 'bg-pink-500/25' : 'bg-ink-800'
                            }`}>
                              <Icon size={16} className={selected ? 'text-pink-400' : 'text-ink-400'} />
                            </span>
                            <span className={`text-sm font-semibold leading-tight ${
                              selected ? 'text-ink-50' : 'text-ink-200'
                            }`}>
                              {label}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Full description of the currently selected pathway (shown once, here,
              instead of on all 17 cards) */}
          <div className="flex items-start gap-3 rounded-xl border border-pink-400/30 bg-pink-500/5 p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pink-500/20">
              {(() => {
                const Icon = PATHWAY_BY_VALUE[pathway].icon
                return <Icon size={18} className="text-pink-400" />
              })()}
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-50">{PATHWAY_BY_VALUE[pathway].label}</p>
              <p className="mt-0.5 text-xs text-ink-400 leading-snug">{PATHWAY_BY_VALUE[pathway].description}</p>
            </div>
          </div>
        </div>

        {/* Tier / level (replaces the K–5 grade toggle) */}
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink-200">Course tier &amp; level</h2>

          <div>
            <label className="mb-2 block text-sm text-ink-300">Tier</label>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setTier('ms')}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  tier === 'ms'
                    ? 'border-pink-400/50 bg-pink-500/15'
                    : 'border-ink-800 bg-ink-900 hover:border-ink-700'
                }`}
              >
                <p className={`text-sm font-semibold ${tier === 'ms' ? 'text-ink-50' : 'text-ink-200'}`}>
                  Middle School
                </p>
                <p className="mt-0.5 text-xs text-ink-500">Exploratory — career awareness &amp; rotation</p>
              </button>
              <button
                type="button"
                onClick={() => setTier('hs')}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  tier === 'hs'
                    ? 'border-pink-400/50 bg-pink-500/15'
                    : 'border-ink-800 bg-ink-900 hover:border-ink-700'
                }`}
              >
                <p className={`text-sm font-semibold ${tier === 'hs' ? 'text-ink-50' : 'text-ink-200'}`}>
                  High School
                </p>
                <p className="mt-0.5 text-xs text-ink-500">Pathway — Intro → Concentrator → Completer</p>
              </button>
            </div>
          </div>

          {/* Conditional level selector — only for High School (Pathway) */}
          {tier === 'hs' && (
            <div>
              <label className="mb-2 block text-sm text-ink-300">Pathway level</label>
              <div className="grid gap-2 sm:grid-cols-3">
                {LEVELS.map(({ value, label, description }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setLevel(value)}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      level === value
                        ? 'border-pink-400/50 bg-pink-500/15'
                        : 'border-ink-800 bg-ink-900 hover:border-ink-700'
                    }`}
                  >
                    <p className={`text-sm font-semibold ${level === value ? 'text-ink-50' : 'text-ink-200'}`}>
                      {label}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-500 leading-snug">{description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Class setup */}
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink-200">Class setup</h2>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="cte-state">
              State
            </label>
            <select
              id="cte-state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="input-field"
            >
              {US_STATES.map(({ abbr, name }) => (
                <option key={abbr} value={abbr}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="cte-classsize">
                Class size
              </label>
              <input
                id="cte-classsize"
                type="number"
                min={1}
                max={60}
                value={classSize}
                onChange={(e) => setClassSize(Number(e.target.value))}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="cte-duration">
                Duration (minutes)
              </label>
              <input
                id="cte-duration"
                type="number"
                min={30}
                max={180}
                step={5}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Lesson details */}
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink-200">Lesson details</h2>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="cte-topic">
              Lesson topic / project name
            </label>
            <input
              id="cte-topic"
              type="text"
              placeholder={TOPIC_PLACEHOLDERS[pathway]}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="cte-competency">
              Target competency / task{' '}
              <span className="text-ink-500">(optional)</span>
            </label>
            <input
              id="cte-competency"
              type="text"
              placeholder={
                pathway === 'hospitality'     ? 'e.g. Demonstrate the julienne knife cut with proper technique (ProStart / FRMCA culinary techniques)' :
                pathway === 'finance'         ? 'e.g. Calculate compound interest (Jump$tart)' :
                pathway === 'human_services'  ? 'e.g. Plan a balanced meal (AAFCS Nutrition & Wellness)' :
                pathway === 'health_science'  ? 'e.g. Measure and record blood pressure (NCHSE)' :
                pathway === 'education'       ? 'e.g. Write a measurable learning objective (InTASC Standard 7)' :
                pathway === 'career_readiness'? 'e.g. Demonstrate teamwork on a group task (Employability Skills: Effective Relationships)' :
                pathway === 'information_technology' ? 'e.g. Trace a loop to predict its output (CSTA — Algorithms & Programming) — or a cybersecurity / web-design objective' :
                pathway === 'transportation'  ? 'e.g. Inspect and measure brake pad wear (ASE MLR — Brakes)' :
                pathway === 'manufacturing'   ? 'e.g. Measure a part to tolerance with a caliper (NIMS — Measurement, Materials & Safety)' :
                pathway === 'engineering_tech'? 'e.g. Apply the engineering design process to a constraint-based challenge (PLTW / EDP)' :
                pathway === 'business_mgmt'    ? 'e.g. Apply the four functions of management to a business scenario (NBEA Management)' :
                pathway === 'agriculture'     ? 'e.g. Explain the components of a plant growth system (AFNR — Plant Systems)' :
                pathway === 'construction'    ? 'e.g. Explain the four stages of the refrigeration cycle (NCCER HVAC) — or a construction-drawings objective' :
                pathway === 'arts_av'         ? 'e.g. Apply design principles to a layout (CCTC AR-VIS / Visual Arts)' :
                pathway === 'government'      ? 'e.g. Explain how a local government makes a policy decision (CCTC GV — Governance)' :
                pathway === 'law_safety'      ? 'e.g. Trace how a case moves through the court system (CCTC LW — exploration)' :
                pathway === 'cosmetology'     ? 'e.g. Disinfect implements to state-board standard (NIC — Infection Control & Safety)' :
                pathway === 'business_law'    ? 'e.g. Identify the elements of a valid contract (NBEA Business Law — Contract Law)' :
                pathway === 'sports_entertainment' ? 'e.g. Explain how a sponsorship creates value for a sports property (Precision Exams 416 / DECA SEM)' :
                pathway === 'exercise_science' ? 'e.g. Identify the roles of the sports-medicine team (HOSA — Sports Medicine)' :
                                                'e.g. Identify a target market (DECA PI)'
              }
              value={targetCompetency}
              onChange={(e) => setTargetCompetency(e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        {/* Multi-session project */}
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-ink-200">Multi-session project</h2>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isMultiStage}
              onChange={(e) => setIsMultiStage(e.target.checked)}
              className="h-4 w-4 rounded border-ink-600 bg-ink-800 accent-pink-500"
            />
            <span className="text-sm text-ink-300">
              This lesson is part of a multi-session project
            </span>
          </label>

          {isMultiStage && (
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <label className="mb-1 block text-sm text-ink-300" htmlFor="cte-stage-num">
                  Stage number
                </label>
                <select
                  id="cte-stage-num"
                  value={sessionNumber}
                  onChange={(e) => {
                    const n = Number(e.target.value)
                    setSessionNumber(n)
                    if (n >= totalSessions) setTotalSessions(n + 1)
                  }}
                  className="input-field"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>Stage {n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-ink-300" htmlFor="cte-total-stages">
                  Total stages
                </label>
                <select
                  id="cte-total-stages"
                  value={totalSessions}
                  onChange={(e) => setTotalSessions(Number(e.target.value))}
                  className="input-field"
                >
                  {[2, 3, 4, 5].filter((n) => n >= sessionNumber).map((n) => (
                    <option key={n} value={n}>{n} stages</option>
                  ))}
                </select>
              </div>
              <p className="col-span-2 text-xs text-ink-500 -mt-2">
                The lesson will be titled &ldquo;{topic.trim() || 'Project Name'} — Stage {sessionNumber} of {totalSessions}&rdquo; and will include continuity instructions.
              </p>
            </div>
          )}
        </div>

        {/* Materials */}
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-ink-200">
            Equipment &amp; materials available{' '}
            <span className="font-normal text-ink-500">(optional)</span>
          </h2>
          <p className="text-xs text-ink-500 -mt-2">
            List specific equipment, industry props, and technology — the AI will build the lesson around what you have.
          </p>

          <div className="space-y-2">
            {materials.map((m, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={m}
                  onChange={(e) => setMaterial(i, e.target.value)}
                  placeholder={placeholders[i % placeholders.length]}
                  className="input-field flex-1"
                />
                {materials.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMaterial(i)}
                    className="text-ink-600 hover:text-ink-300 transition-colors"
                    aria-label="Remove"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {materials.length < 8 && (
            <button
              type="button"
              onClick={addMaterial}
              className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors"
            >
              <Plus size={16} />
              Add item
            </button>
          )}
        </div>


        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-ink-100">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full justify-center gap-2 py-3 text-base disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Generate CTE lesson
            </>
          )}
        </button>

        {loading && (
          <p className="text-center text-xs text-ink-500">
            This usually takes 1–3 minutes · Do not close this tab
          </p>
        )}
      </form>
    </div>
  )
}
