-- Load the owner-provided GMS MTSS goal bank into only the owner's private
-- lesson-plan format. Other PlansK12 accounts keep their own independent banks.

do $$
declare
  v_owner_id uuid;
  v_format_id uuid;
  v_bank jsonb := $mtss_bank$[
  {
    "tier": "tier_1",
    "number": "T1-038",
    "label": "Executive-Function Supports: Provides routines, planners, visual schedules, timers, reminders, or organizational tools that help students initiate, manage, and complete learning tasks."
  },
  {
    "tier": "tier_1",
    "number": "T1-001",
    "label": "Visual and Multimodal Supports: Presents content and directions through appropriate combinations of visuals, written language, oral explanation, models, demonstrations, audio, and hands-on experiences."
  },
  {
    "tier": "tier_1",
    "number": "T1-002",
    "label": "Multiple Means of Representation: Presents content in more than one format, such as text, visuals, models, audio, or demonstrations."
  },
  {
    "tier": "tier_1",
    "number": "T1-003",
    "label": "Multiple Means of Action and Expression: Allows students varied ways to practice and demonstrate understanding while maintaining the same learning goal."
  },
  {
    "tier": "tier_1",
    "number": "T1-004",
    "label": "Multiple Response and Demonstration Options: Provides appropriate ways for students to respond or demonstrate learning through oral, written, visual, artistic, technological, or hands-on formats without changing the learning standard."
  },
  {
    "tier": "tier_1",
    "number": "T1-005",
    "label": "Flexible Grouping: Regroups students temporarily according to current data, task demands, or learning needs."
  },
  {
    "tier": "tier_1",
    "number": "T1-006",
    "label": "Purposeful Small-Group Instruction Within the Core: Provides focused instruction to a temporary group during regular Tier 1 instructional time."
  },
  {
    "tier": "tier_1",
    "number": "T1-007",
    "label": "Scaffolded Instruction: Provides temporary supports that are gradually removed as students become more independent."
  },
  {
    "tier": "tier_1",
    "number": "T1-008",
    "label": "Chunked Tasks, Text, or Directions: Breaks complex content, assignments, texts, or directions into smaller, clearly sequenced parts."
  },
  {
    "tier": "tier_1",
    "number": "T1-009",
    "label": "Additional Processing and Response Time: Provides students with additional time to process information, formulate responses, complete tasks, or demonstrate understanding."
  },
  {
    "tier": "tier_1",
    "number": "T1-010",
    "label": "Manipulatives or Concrete Representations: Uses physical or concrete models to make abstract ideas more understandable."
  },
  {
    "tier": "tier_1",
    "number": "T1-011",
    "label": "Concrete–Representational–Abstract Sequence: Moves learning from hands-on models to visual representations and then to abstract symbols or concepts."
  },
  {
    "tier": "tier_1",
    "number": "T1-012",
    "label": "Sentence Frames or Sentence Starters: Provides language structures that help students begin and organize academic speaking or writing."
  },
  {
    "tier": "tier_1",
    "number": "T1-013",
    "label": "Additional Processing and Response Time: Provides students with additional time to process information, formulate responses, complete tasks, or demonstrate understanding."
  },
  {
    "tier": "tier_1",
    "number": "T1-014",
    "label": "Chunked Text or Directions: Breaks complex text, tasks, or directions into smaller, manageable parts."
  },
  {
    "tier": "tier_1",
    "number": "T1-015",
    "label": "Organizational Learning Tools: Uses graphic organizers, guided notes, checklists, planners, visual schedules, cloze notes, or similar tools to organize information and complete multistep tasks."
  },
  {
    "tier": "tier_1",
    "number": "T1-016",
    "label": "Copies of Notes and Reference Materials: Provides access to teacher notes, models, examples, key vocabulary, or reference materials so copying demands do not interfere with learning."
  },
  {
    "tier": "tier_1",
    "number": "T1-017",
    "label": "Reduced Task Quantity Without Reducing the Standard: Reduces repetitive items, written volume, or task length when fewer items can provide sufficient evidence of the same learning expectation."
  },
  {
    "tier": "tier_1",
    "number": "T1-018",
    "label": "Assistive Technology or Accessibility Tools: Uses approved tools or features that remove barriers to accessing or demonstrating learning."
  },
  {
    "tier": "tier_1",
    "number": "T1-019",
    "label": "Copies of Notes and Reference Materials: Provides access to teacher notes, models, examples, key vocabulary, or reference materials so copying demands do not interfere with learning."
  },
  {
    "tier": "tier_1",
    "number": "T1-020",
    "label": "Extended Processing Time Within Instruction: Provides additional think, read, discuss, or response time during instruction without changing the learning goal."
  },
  {
    "tier": "tier_1",
    "number": "T1-021",
    "label": "Explicit Academic Vocabulary Instruction: Directly teaches the meaning, use, and application of essential academic or content-specific vocabulary."
  },
  {
    "tier": "tier_1",
    "number": "T1-022",
    "label": "Preteaching Essential Vocabulary: Introduces critical words before students encounter them in the lesson or text."
  },
  {
    "tier": "tier_1",
    "number": "T1-023",
    "label": "Content-Area Reading Strategies: Teaches students how to comprehend and analyze texts within a specific discipline."
  },
  {
    "tier": "tier_1",
    "number": "T1-024",
    "label": "Structured Academic Conversation: Uses prompts, roles, language supports, and accountability to guide content-focused discussion."
  },
  {
    "tier": "tier_1",
    "number": "T1-025",
    "label": "Language Objectives: Identifies how students will use speaking, listening, reading, or writing to access the lesson content."
  },
  {
    "tier": "tier_1",
    "number": "T1-026",
    "label": "Frequent Checks for Understanding: Collects brief evidence throughout the lesson to determine whether students are ready to move forward."
  },
  {
    "tier": "tier_1",
    "number": "T1-027",
    "label": "Small-Group Reteaching Within Core Instruction: Provides focused reteaching to a temporary group during regular instructional time."
  },
  {
    "tier": "tier_1",
    "number": "T1-029",
    "label": "Flexible Regrouping Based on Current Data: Changes student groups as new evidence shows different strengths or needs."
  },
  {
    "tier": "tier_1",
    "number": "T1-030",
    "label": "Additional Core Practice: Provides extra practice within Tier 1 for students who need more opportunities to reach mastery."
  },
  {
    "tier": "tier_1",
    "number": "T1-031",
    "label": "Organization and Executive-Function Supports: Provides routines, planners, visual schedules, or organizational tools that help students manage learning tasks."
  },
  {
    "tier": "tier_1",
    "number": "T1-032",
    "label": "Self-Regulation Supports Available to All Students: Provides universal strategies that help students monitor attention, emotions, effort, and behavior."
  },
  {
    "tier": "tier_1",
    "number": "T1-033",
    "label": "Reduced Task Quantity Without Reducing the Standard: Reduces repetitive items, written volume, or task length when fewer items can provide sufficient evidence of the same learning expectation."
  },
  {
    "tier": "tier_1",
    "number": "T1-034",
    "label": "Activate and Build Background Knowledge: Connects new learning to students’ existing knowledge and intentionally develops missing knowledge needed to access grade-level content."
  },
  {
    "tier": "tier_1",
    "number": "T1-037",
    "label": "Memory Aids and Mnemonic Supports: Uses rehearsal, repetition, associations, songs, rhymes, acronyms, visual cues, or other tools to strengthen retention and retriev"
  },
  {
    "tier": "tier_1",
    "number": "T1-039",
    "label": "Structured Peer Support: Purposefully pairs students for discussion, rehearsal, reading, note-taking, modeling, tutoring, or academic assistance while maintaining individual accountability."
  },
  {
    "tier": "tier_1",
    "number": "T1-040",
    "label": "Predictable Routines and Structured Expectations: Uses consistent procedures, clear directions, established routines, and predictable instructional structures to reduce cognitive load."
  },
  {
    "tier": "tier_1",
    "number": "T1-043",
    "label": "Movement Breaks and Flexible Seating: Provides planned movement opportunities or seating options that support attention, regulation, and productive participation."
  },
  {
    "tier": "tier_1",
    "number": "T1-044",
    "label": "Reduced Distractions or Alternative Work Space: Reduces unnecessary auditory or visual distractions or provides an appropriate quieter work location."
  },
  {
    "tier": "tier_2",
    "number": "T2-001",
    "label": "Targeted Support Matched to Student Need: Selects a supplemental support that directly addresses a clearly identified academic or learning need."
  },
  {
    "tier": "tier_2",
    "number": "T2-002",
    "label": "Evidence-Based Standardized Intervention: Uses a structured intervention with defined procedures and research support."
  },
  {
    "tier": "tier_2",
    "number": "T2-003",
    "label": "Targeted Small-Group Instruction: Provides supplemental instruction to a small group with a shared, identified skill need."
  },
  {
    "tier": "tier_2",
    "number": "T2-004",
    "label": "Reduced Instructional Group Size: Increases intensity by teaching fewer students at one time."
  },
  {
    "tier": "tier_2",
    "number": "T2-005",
    "label": "Increased Instructional Frequency: Provides intervention sessions more often than the support available in Tier 1 alone."
  },
  {
    "tier": "tier_2",
    "number": "T2-006",
    "label": "Increased Instructional Duration: Provides longer intervention sessions to increase instructional intensity."
  },
  {
    "tier": "tier_2",
    "number": "T2-007",
    "label": "More Explicit Instruction: Uses clearer explanation, modeling, guided practice, and feedback than students receive in core instruction alone."
  },
  {
    "tier": "tier_2",
    "number": "T2-008",
    "label": "Smaller Instructional Steps: Breaks the target skill into more precise steps and teaches them sequentially."
  },
  {
    "tier": "tier_2",
    "number": "T2-009",
    "label": "Immediate and Frequent Corrective Feedback: Corrects errors quickly and gives repeated feedback during intervention practice."
  },
  {
    "tier": "tier_2",
    "number": "T2-010",
    "label": "Additional Guided Practice: Provides extra supported practice with prompting, monitoring, and feedback."
  },
  {
    "tier": "tier_2",
    "number": "T2-011",
    "label": "Mastery-Based Practice: Continues focused practice until the student demonstrates a defined level of accuracy or independence."
  },
  {
    "tier": "tier_2",
    "number": "T2-012",
    "label": "Targeted Preteaching of Prerequisite Skills: Teaches missing foundational skills before students are expected to use them in grade-level work."
  },
  {
    "tier": "tier_2",
    "number": "T2-013",
    "label": "Targeted Preteaching of Background Knowledge: Builds essential knowledge needed to understand upcoming content or text."
  },
  {
    "tier": "tier_2",
    "number": "T2-014",
    "label": "Targeted Preteaching of Academic Vocabulary: Provides supplemental instruction in essential vocabulary before core instruction."
  },
  {
    "tier": "tier_2",
    "number": "T2-015",
    "label": "Targeted Reteaching of a Specific Skill: Provides focused, supplemental instruction on one clearly identified skill deficit."
  },
  {
    "tier": "tier_2",
    "number": "T2-016",
    "label": "Targeted Reteaching Using an Alternative Approach: Reteaches the same skill using a different model, representation, example, or instructional method."
  },
  {
    "tier": "tier_2",
    "number": "T2-017",
    "label": "Targeted Misconception Correction: Directly addresses a specific misunderstanding identified through student work or assessment data."
  },
  {
    "tier": "tier_2",
    "number": "T2-018",
    "label": "Bridging Gaps in Prerequisite Knowledge: Provides targeted instruction in missing knowledge needed for current grade-level learning."
  },
  {
    "tier": "tier_2",
    "number": "T2-019",
    "label": "Targeted Reading-Fluency Practice: Provides repeated, monitored practice to improve reading accuracy, rate, and expression."
  },
  {
    "tier": "tier_2",
    "number": "T2-020",
    "label": "Targeted Reading-Comprehension Strategy Instruction: Explicitly teaches and practices a specific comprehension strategy with a targeted group."
  },
  {
    "tier": "tier_2",
    "number": "T2-021",
    "label": "Targeted Written-Response Support: Provides structured instruction and practice for organizing and expressing ideas in writing."
  },
  {
    "tier": "tier_2",
    "number": "T2-022",
    "label": "Targeted Number-Sense Instruction: Provides supplemental instruction in quantity, magnitude, relationships, and flexible use of numbers."
  },
  {
    "tier": "tier_2",
    "number": "T2-023",
    "label": "Targeted Computation Instruction: Provides explicit, focused instruction in accurate and efficient computation procedures."
  },
  {
    "tier": "tier_2",
    "number": "T2-024",
    "label": "Targeted Problem-Solving Strategy Instruction: Explicitly teaches how to interpret, plan, solve, and check a specific type of problem."
  },
  {
    "tier": "tier_2",
    "number": "T2-025",
    "label": "Targeted Organization Support: Provides supplemental routines and tools for managing materials, assignments, and deadlines."
  },
  {
    "tier": "tier_2",
    "number": "T2-026",
    "label": "Targeted Task-Initiation Support: Provides prompts, routines, and monitoring that help students begin assigned work independently."
  },
  {
    "tier": "tier_2",
    "number": "T2-027",
    "label": "Targeted Assignment-Completion Support: Provides structured planning, checkpoints, and feedback to improve completion of assigned work."
  },
  {
    "tier": "tier_2",
    "number": "T2-028",
    "label": "Targeted Self-Monitoring Instruction: Teaches students to track their own performance, attention, behavior, or progress toward a goal."
  },
  {
    "tier": "tier_2",
    "number": "T2-029",
    "label": "Check-In/Check-Out: Provides scheduled adult contact, goal review, feedback, and progress monitoring."
  },
  {
    "tier": "tier_2",
    "number": "T2-030",
    "label": "Frequent Progress Monitoring: Collects brief, repeated data to determine whether a student is responding to the intervention."
  },
  {
    "tier": "tier_2",
    "number": "T2-031",
    "label": "Skill-Specific Progress Monitoring: Measures growth in the exact skill targeted by the intervention."
  },
  {
    "tier": "tier_2",
    "number": "T2-032",
    "label": "Student Progress Graphing: Displays progress data visually so students and staff can identify growth and trends."
  },
  {
    "tier": "tier_2",
    "number": "T2-033",
    "label": "Regular Intervention Data Review: Reviews progress and implementation data on a planned schedule to make timely decisions."
  },
  {
    "tier": "tier_2",
    "number": "T2-034",
    "label": "Data-Based Adjustment of Grouping: Uses student-response data to change intervention group membership or size."
  },
  {
    "tier": "tier_2",
    "number": "T2-035",
    "label": "Data-Based Adjustment of Frequency: Uses progress data to increase or decrease how often intervention occurs."
  },
  {
    "tier": "tier_2",
    "number": "T2-036",
    "label": "Data-Based Fading of Tier 2 Support: Gradually reduces supplemental support when data show the student can maintain success with Tier 1 alone."
  },
  {
    "tier": "tier_2",
    "number": "T2-037",
    "label": "Increased Intervention Time or Frequency: Increases the number, length, or frequency of supplemental instructional sessions."
  },
  {
    "tier": "tier_2",
    "number": "T2-038",
    "label": "Positive Reinforcement and Strength-Based Feedback: Reinforces effort, persistence, strategy use, productive risk-taking, and incremental growth."
  },
  {
    "tier": "tier_2",
    "number": "T2-039",
    "label": "Targeted Prerequisite-Skill Instruction: Provides supplemental instruction in foundational skills or knowledge needed to access current grade-level learning."
  },
  {
    "tier": "tier_2",
    "number": "T2-040",
    "label": "Targeted Background Knowledge and Vocabulary Development: Provides supplemental preparation in essential concepts, experiences, and academic language before core instruction."
  },
  {
    "tier": "tier_2",
    "number": "T2-041",
    "label": "Targeted Phonological Awareness or Decoding Instruction: Provides explicit, supplemental instruction in sound awareness, sound-symbol relationships, blending, segmenting, decoding, or word recognitio"
  },
  {
    "tier": "tier_2",
    "number": "T2-042",
    "label": "Targeted Academic Language Support: Provides supplemental instruction in vocabulary, sentence structures, oral language, or disciplinary language needed to access core content."
  },
  {
    "tier": "tier_2",
    "number": "T2-043",
    "label": "Targeted Executive-Function Support: Provides supplemental instruction and monitoring for organization, planning, time management, task initiation, or assignment completion."
  },
  {
    "tier": "tier_2",
    "number": "T2-044",
    "label": "Targeted Motivation and Persistence Support: Provides structured goals, feedback, reinforcement, and adult support to improve effort, confidence, persistence, or academic engagement."
  }
]$mtss_bank$::jsonb;
  v_sections jsonb := $sections$[
  {
    "key": "standards",
    "label": "Standards",
    "description": "Applicable state or national standards",
    "enabled": true,
    "required": true
  },
  {
    "key": "learning_targets",
    "label": "Learning targets",
    "description": "What students are expected to learn",
    "enabled": true,
    "required": true
  },
  {
    "key": "success_criteria",
    "label": "Success criteria",
    "description": "What successful learning will look like",
    "enabled": true,
    "required": true
  },
  {
    "key": "lesson_sequence",
    "label": "Lesson sequence",
    "description": "A clear, logically organized flow",
    "enabled": true,
    "required": true
  },
  {
    "key": "mtss_tier_1",
    "label": "MTSS: Tier 1 supports",
    "description": "Whole-class supports planned from the start",
    "enabled": true,
    "required": true
  },
  {
    "key": "mtss_tier_2",
    "label": "MTSS: Tier 2 evidence",
    "description": "Targeted need, grouping, strategy, or progress check when needed",
    "enabled": true,
    "required": true
  },
  {
    "key": "evidence_of_learning",
    "label": "Evidence of learning",
    "description": "How learning will be checked and used for next steps",
    "enabled": true,
    "required": true
  },
  {
    "key": "notes",
    "label": "Teacher notes",
    "description": "Vocabulary, safety, accommodations, and reminders",
    "enabled": false,
    "required": false
  },
  {
    "key": "attachments",
    "label": "Attachments & resources",
    "description": "Materials, printables, equipment, and links",
    "enabled": false,
    "required": false
  },
  {
    "key": "assignments",
    "label": "Assignments",
    "description": "Independent practice or follow-up work",
    "enabled": false,
    "required": false
  },
  {
    "key": "assessments",
    "label": "Assessments",
    "description": "Checks, rubrics, quizzes, or exit tickets",
    "enabled": false,
    "required": false
  }
]$sections$::jsonb;
begin
  select id into v_owner_id
  from auth.users
  where lower(email) = lower('staceyjonesthirtyone@gmail.com')
  limit 1;

  if v_owner_id is null then
    raise notice 'PlansK12 owner account was not found; MTSS bank was not seeded.';
    return;
  end if;

  select id into v_format_id
  from public.lesson_plan_formats
  where teacher_id = v_owner_id
  order by is_default desc, updated_at desc
  limit 1;

  if v_format_id is null then
    insert into public.lesson_plan_formats (
      teacher_id, name, detail_level, sections, mtss_goal_bank,
      requirement_notes, is_default
    ) values (
      v_owner_id,
      'GMS brief lesson plan',
      'brief',
      v_sections,
      v_bank,
      'Keep the plan brief and make the Tier 2 response or N/A visible.',
      true
    );
  else
    update public.lesson_plan_formats
    set mtss_goal_bank = v_bank,
        updated_at = now()
    where id = v_format_id;
  end if;
end
$$;

