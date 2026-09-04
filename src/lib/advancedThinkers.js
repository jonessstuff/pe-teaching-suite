export const THINKING_STRANDS = [
  { id: 'logic', label: 'Logical reasoning', short: 'Notice patterns, test rules, and explain conclusions with precision.' },
  { id: 'creative', label: 'Creative thinking', short: 'Generate varied possibilities, take intellectual risks, and improve original ideas.' },
  { id: 'spatial', label: 'Visual-spatial thinking', short: 'Represent, rotate, organize, and reason with shapes, models, and systems.' },
  { id: 'evidence', label: 'Evidence & evaluation', short: 'Judge claims, weigh evidence, recognize bias, and revise a position.' },
  { id: 'inquiry', label: 'Inquiry & research', short: 'Ask productive questions, gather information, and build defensible explanations.' },
  { id: 'metacognition', label: 'Metacognition & collaboration', short: 'Name strategies, use feedback, persist, and contribute to a thinking team.' },
]

export const GRADE_PATHWAYS = {
  'K–1': {
    label: 'K–1 · Emerging thinkers', minutes: '20–30 minutes',
    approach: 'Concrete materials, movement, picture evidence, teacher read-alouds, partner talk, drawing, and oral explanation.',
    evidence: 'Photographs of models, dictated explanations, strategy picture cards, teacher observation, and brief student reflection.',
  },
  '2–3': {
    label: 'Grades 2–3 · Growing strategists', minutes: '30–45 minutes',
    approach: 'Concrete-to-visual models, short source excerpts, structured discussion, labeled diagrams, and concise written reasoning.',
    evidence: 'Workmats, annotated models, short explanations, peer feedback, and selected portfolio pieces.',
  },
  '4–5': {
    label: 'Grades 4–5 · Independent thinkers', minutes: '40–60 minutes',
    approach: 'Multi-step problems, competing evidence, source comparison, independent planning, revision, and authentic communication.',
    evidence: 'Reasoned arguments, inquiry briefs, test data, revision histories, portfolio defense, and independent transfer.',
  },
  'K–5 mixed': {
    label: 'K–5 mixed · Schoolwide or multi-age', minutes: '30–60 minutes',
    approach: 'One shared thinking target with tiered materials, flexible response modes, mixed-age roles, and age-appropriate evidence.',
    evidence: 'Common strand rubric interpreted developmentally, with oral/visual evidence for younger learners and written/independent evidence for older learners.',
  },
}

const UNIT_GRADE_MOVES = {
  'pattern-detectives': {
    'K–1': 'Build repeating and growing patterns with objects; students point, act out, or dictate the rule and create the missing clue.',
    '2–3': 'Use number, word, and visual patterns with a written rule, prediction, and partner proof.',
    '4–5': 'Require multiple possible rules, distant-case predictions, assumptions, and a student-authored mystery.',
  },
  'impossible-possibilities': {
    'K–1': 'Generate through drawing, building, and dramatic play; sort ideas as same-kind or different-kind before choosing one to improve.',
    '2–3': 'Use timed idea sprints, four perspective lenses, and a labeled sketch showing added details.',
    '4–5': 'Evaluate usefulness and originality, document discarded ideas, and defend revisions under competing constraints.',
  },
  'systems-structures': {
    'K–1': 'Use body movement, picture cards, and simple cause-and-effect chains to show how familiar parts work together.',
    '2–3': 'Map inputs, parts, and outputs in familiar systems and build a four-part working model.',
    '4–5': 'Trace indirect effects, feedback loops, stakeholders, and tradeoffs in a school-system redesign.',
  },
  'evidence-court': {
    'K–1': 'Use picture clues and oral claims; students sort “helps us know” from “does not help us know” and explain a verdict aloud.',
    '2–3': 'Use short evidence cards, source roles, and a claim-evidence-because frame.',
    '4–5': 'Rate relevance, credibility, and sufficiency; compare biased accounts and write a qualified verdict.',
  },
  'inquiry-lab': {
    'K–1': 'Investigate a shared wonder through read-aloud excerpts, observation, images, and teacher-scribed questions—no independent web research.',
    '2–3': 'Use a supplied source packet, note-picture organizer, question ladder, and short synthesis explanation.',
    '4–5': 'Evaluate authorship and purpose across sources, synthesize agreements and tensions, and create an inquiry brief.',
  },
  'design-constraints': {
    'K–1': 'Solve a story-based user need with safe building materials; test through play and explain one change.',
    '2–3': 'Name criteria and constraints, sketch options, conduct repeated tests, and keep a simple revision log.',
    '4–5': 'Analyze user evidence, weight competing criteria, collect controlled test data, and deliver a design defense.',
  },
  'perspectives-paradoxes': {
    'K–1': 'Use puppets, picture books, and role cards to name what different people know, want, and feel.',
    '2–3': 'Map stakeholder goals, practice clarifying questions, and write a fair “both sides” summary.',
    '4–5': 'Analyze competing values, omissions, conditions, and counterpoints before writing a nuanced position.',
  },
  'thinkers-showcase': {
    'K–1': 'Choose photos or artifacts, dictate a before-and-after explanation, and teach visitors one thinking move.',
    '2–3': 'Curate three artifacts, label the strategy in each, and present a short interactive challenge.',
    '4–5': 'Defend a curated portfolio with baseline/post evidence, limitations, transfer, and a specific next goal.',
  },
}

const GRADE_SESSION_TASKS = {
  'pattern-detectives': {
    'K–1': [
      'Build three color-and-shape trains. Cover the last two pieces in each train. Children predict, uncover, and point to the part that proves the repeating rule; the teacher records their words.',
      'Show a short picture sequence that could continue in two ways. Children build both endings, say “It could be ___ because ___,” and choose one new picture clue that would settle the mystery.',
      'Grow tile “steps” from one step to four. Children build the next stage, photograph or draw it, and act out what changes and what stays the same.',
      'Children create a fair pattern puzzle with objects, hide one part, test it on a partner, and dictate a clue and solution for the class mystery book.',
    ],
    '2–3': [
      'Solve one visual, one number, and one word pattern. Circle repeating or growing parts, write the rule in words, and add two terms that fit.',
      'Create two valid continuations for the same short sequence. Write the assumption behind each and add one clue that rules out one answer.',
      'Build and draw stages 1–4 of a growing figure, complete a value table, and use the pattern to predict stage 8.',
      'Design a pattern mystery with a consistent rule, enough clues, a tempting wrong answer, and a separate explanation page; revise after peer testing.',
    ],
  },
  'impossible-possibilities': {
    'K–1': [
      'Pass around a familiar object. Children draw or act out many new uses; the teacher groups answers without judging them, then the class notices which ideas are alike and different.',
      'Revisit a classroom problem through four picture lenses: a child, teacher, animal, and tiny robot. Children add one idea from each viewpoint to a shared chart.',
      'Choose one unusual idea and build or draw how it would really work. Partners ask “Who would use it?” and “What would make it easier?” before revision.',
      'Using only paper, tape, and five craft sticks, build a shelter for a small toy. Test with wind from a fan or folder and explain one change after the test.',
    ],
    '2–3': [
      'Complete three 90-second idea sprints, then mark the point where the easy ideas ended and the more interesting ideas began.',
      'Generate solutions from the viewpoints of the user, the environment, available technology, and one surprising constraint; label the lens for each.',
      'Place ideas on a common/unusual and less/more useful grid. Select one unusual-useful idea and elaborate the user, parts, and steps.',
      'Build with a fixed material budget, record two ideas not chosen, test against two success criteria, and revise one feature using evidence.',
    ],
  },
  'systems-structures': {
    'K–1': [
      'Sort picture cards into “collection” or “working together.” Assemble a school-lunch or playground system and use yarn to connect parts that need one another.',
      'Act out a familiar routine, remove one role card, and trace what happens next using first/then picture arrows.',
      'Create a four-part marble, ball, or message-passing system. Test it three times and place a sticker where it stops working.',
      'Choose a classroom routine, move or replace one part, role-play the new version, and tell who it helps and what new problem may appear.',
    ],
    '2–3': [
      'Map the purpose, input, parts, relationships, and output of a familiar system, then explain why a pile of the same parts is not yet a system.',
      'Create a ripple map showing at least two direct and two indirect effects after one system part changes.',
      'Build a four-part chain or delivery model, run three trials, and keep a simple change/result log.',
      'Draw before-and-after maps for a school routine, identify three stakeholders, and explain one benefit and one tradeoff.',
    ],
  },
  'evidence-court': {
    'K–1': [
      'Hear a claim about a mystery picture. Sort picture clues into “helps us know” and “does not help us know,” then complete the oral frame “I think ___ because ___.”',
      'Compare clues from someone who saw an event, someone who heard about it, and an unrelated fact. Children choose the most helpful clue and explain why.',
      'Listen to two puppet accounts of the same lost-object story. Place matching details in the middle and ask one question both puppets still need to answer.',
      'Choose between two playground improvements using picture evidence for cost, safety, and fun. Place a verdict token and name one clue that could change the choice.',
    ],
    '2–3': [
      'Sort short statements into claim, evidence, reason, or unrelated detail; repair one argument using a claim-evidence-because frame.',
      'Rate evidence cards for “matches the claim,” “trustworthy source,” and “enough information,” then name the missing evidence.',
      'Annotate two brief eyewitness accounts for agreement, conflict, and missing information; write two neutral follow-up questions.',
      'Review a one-page school-improvement case, rank evidence using three class criteria, and write a verdict plus one uncertainty.',
    ],
  },
  'inquiry-lab': {
    'K–1': [
      'After a picture-book excerpt or observation tray, place wonder notes on a question board. Together, turn one giant question into a focused “How/Why does ___?” question.',
      'Examine three teacher-selected picture or read-aloud sources. Match each fact to its source icon and notice when two sources agree.',
      'Sort learned facts under “same idea,” “different idea,” and “still wondering.” Children orally connect two facts while the teacher scribes.',
      'Create a one-page picture answer with the class question, two evidence drawings, an oral explanation, and one next wonder.',
    ],
    '2–3': [
      'Use a question ladder to revise a broad curiosity into a focused question about cause, effect, pattern, perspective, or choice.',
      'Read a supplied packet of three short excerpts and one image; record who made each source, why, and one fact it supports.',
      'Complete a synthesis matrix for agreements, differences, and unanswered questions; write two connected evidence sentences.',
      'Create a one-page inquiry brief with question, answer, two supplied-source details, reasoning, limitation, and next question.',
    ],
  },
  'design-constraints': {
    'K–1': [
      'Meet a toy character with a clear problem. Children ask what the character needs, draw two solutions, and explain which need each feature addresses.',
      'Sort picture criteria such as strong, easy to carry, safe, and low-material. Pick the two most important and count out a fixed building budget.',
      'Build the solution, run the same simple test three times, and record each result with a symbol or photo.',
      'Change one part because of a test result, retest, and use the oral frame “We changed ___ because ___; now ___.”',
    ],
    '2–3': [
      'Read three short user statements, distinguish needs from wishes, and write a user-needs-because problem statement.',
      'Rank four criteria, sketch three ideas, and use a simple plus/minus decision chart to select a concept.',
      'Build and run three consistent trials, recording a measurement, observation, and failure point.',
      'Revise one feature, retest, and present need, criteria, evidence, revision, and one remaining limitation.',
    ],
  },
  'perspectives-paradoxes': {
    'K–1': [
      'Use role cards to retell a familiar event from a child, caregiver, teacher, and animal viewpoint. Name what each knows, wants, and may not see.',
      'Sort story statements under two values that can both matter, such as being fair and helping someone who needs more.',
      'Use puppets to practice “I heard you say…,” “Can you tell me why…?” and “We both care about…” during a small disagreement.',
      'Create a two-sided drawing, dictate one true idea from each side, and add a “maybe when…” sentence.',
    ],
    '2–3': [
      'Map what four stakeholders value, fear, know, and need to learn in a shared school scenario.',
      'Place evidence on a tension line between two important values and identify an option that honors part of each.',
      'Use paraphrase, evidence questions, and shared-value prompts in a structured role-card dialogue.',
      'Write a position that includes a claim, another viewpoint, a condition or exception, and one unanswered question.',
    ],
  },
  'thinkers-showcase': {
    'K–1': [
      'Place an early photo and a later artifact side by side. Children point to what changed and dictate “Before I…; now I…”',
      'Choose three pieces that show different thinking moves; add a strategy picture card and one-sentence or dictated caption to each.',
      'Practice teaching a visitor one pattern, evidence, creativity, or design move using objects and a simple question.',
      'Share artifacts, receive one notice and one question, choose a next-goal picture card, and explain when to use it.',
    ],
    '2–3': [
      'Compare early and recent artifacts, tag visible strategy changes, and write one evidence-based growth statement.',
      'Select three to five pieces, explain why each belongs, and include one struggle or unfinished question.',
      'Prepare a three-minute explanation naming the challenge, strategy, turning point, and a visitor mini-challenge.',
      'Present, collect specific feedback, complete the post-task, and write a thinking-behavior next goal.',
    ],
  },
}

function pathwayTask(unitId, sessionIndex, gradeBand, baseTask) {
  if (gradeBand === '4–5') return baseTask
  if (gradeBand === 'K–5 mixed') {
    const young = GRADE_SESSION_TASKS[unitId]?.['K–1']?.[sessionIndex]
    const middle = GRADE_SESSION_TASKS[unitId]?.['2–3']?.[sessionIndex]
    return `K–1 role: ${young ?? baseTask} Grades 2–3 role: ${middle ?? baseTask} Grades 4–5 role: ${baseTask}`
  }
  return GRADE_SESSION_TASKS[unitId]?.[gradeBand]?.[sessionIndex] ?? baseTask
}

function pathwayHook(gradeBand, baseHook) {
  if (gradeBand === 'K–1') return 'Reveal the objects, pictures, or story problem one piece at a time. Ask: “What do you notice? What do you think might happen? What makes you think that?” Accept pointing, movement, drawing, or oral responses.'
  if (gradeBand === '2–3') return `Give students one quiet notice-and-wonder minute before partner talk. Then use this launch: ${baseHook}`
  if (gradeBand === 'K–5 mixed') return `Launch everyone with a shared visual or object. Younger students notice and predict orally; older students record evidence and assumptions. Core prompt: ${baseHook}`
  return baseHook
}

function pathwayMini(gradeBand, baseMini) {
  if (gradeBand === 'K–1') return 'Model one thinking move aloud with concrete materials: name what you notice, try a strategy, check what happened, and change course if needed. Post a picture cue for the strategy and rehearse one oral sentence frame together.'
  if (gradeBand === '2–3') return `Model one example, one common mistake, and one way to check the thinking. Then name the reusable strategy: ${baseMini}`
  if (gradeBand === 'K–5 mixed') return `Teach the shared strategy with a concrete model first, then add the abstract language older learners will use: ${baseMini}`
  return baseMini
}

function pathwayReflection(gradeBand, baseReflection) {
  if (gradeBand === 'K–1') return `Show, draw, or tell one thinking move you used. Teacher follow-up: “What did you try when it was not easy?” Core reflection: ${baseReflection}`
  if (gradeBand === '2–3') return `Answer with a complete sentence and point to evidence in your work: ${baseReflection}`
  if (gradeBand === 'K–5 mixed') return `Partners answer at their response level—oral/visual for younger learners and evidence-based written explanation for older learners: ${baseReflection}`
  return baseReflection
}

export const ADVANCED_UNITS = [
  {
    id: 'pattern-detectives', title: 'Pattern Detectives', icon: '🔎', color: 'amber', strand: 'Logical reasoning',
    essential: 'How can a pattern help us predict—and when can a pattern mislead us?',
    artifact: 'A student-authored pattern mystery with a defensible solution',
    materials: 'index cards, colored tiles or paper squares, graph paper, pencils, envelopes',
    sessions: [
      { title: 'The Rule Behind the Clues', target: 'I can identify a pattern rule and prove it fits every clue.', hook: 'Display 2, 6, 12, 20, __. Students silently record at least two possible rules before discussing.', mini: 'A pattern is not merely what comes next; it is a rule that accounts for every known term. Model testing a rule against all clues and rejecting a rule that only fits part of the evidence.', task: 'Teams solve three number, word, and visual pattern envelopes. For each, they record the proposed rule, evidence for it, and one new clue the rule predicts.', reflection: 'Which clue did the most work in proving your rule? Why?', artifact: 'Pattern Proof Sheet' },
      { title: 'More Than One Right Rule', target: 'I can create two valid explanations for the same evidence.', hook: 'Show 1, 2, 4, __ and invite as many defensible next terms as possible.', mini: 'Incomplete evidence may support multiple rules. Strong thinkers state assumptions instead of pretending certainty.', task: 'Pairs receive short sequences and earn one point for each genuinely different rule plus one point for a clear explanation. They then design a clue that would distinguish between two rules.', reflection: 'What additional information would make your conclusion more certain?', artifact: 'Multiple-Rules Comparison' },
      { title: 'Patterns in Systems', target: 'I can represent a growing system and predict a distant case.', hook: 'Build a three-stage tile staircase. Ask how many tiles stage 10 would require without constructing it.', mini: 'Teach tables, labeled diagrams, and verbal rules as three representations of the same relationship.', task: 'Students model a growing garden, seating plan, or block tower; create a table; describe the change; and justify a far-stage prediction.', reflection: 'Which representation made the relationship easiest to see?', artifact: 'Three-Representation Model' },
      { title: 'Create a Pattern Mystery', target: 'I can design a challenging problem that has enough evidence to solve fairly.', hook: 'Compare a fair mystery with one that has too few clues.', mini: 'Good challenge design balances surprise with solvability. Establish the criteria: consistent rule, sufficient clues, tempting misconception, and explainable answer.', task: 'Students create, peer-test, revise, and package an original number, language, or visual pattern mystery with a sealed solution.', reflection: 'What did your tester misunderstand, and how did you improve the clues?', artifact: 'Published Pattern Mystery' },
    ],
  },
  {
    id: 'impossible-possibilities', title: 'Impossible Possibilities', icon: '💡', color: 'orange', strand: 'Creative thinking',
    essential: 'How do thinkers move beyond the first obvious idea?',
    artifact: 'An original solution portfolio showing fluency, flexibility, originality, and elaboration',
    materials: 'sticky notes, chart paper, common recycled objects, markers, timer',
    sessions: [
      { title: 'Idea Fluency', target: 'I can delay judgment long enough to generate many possibilities.', hook: 'List as many uses for a paper clip as possible in 90 seconds.', mini: 'Separate idea generation from idea judging. Introduce fluency: producing many relevant possibilities so the first idea is not automatically the final idea.', task: 'Students rotate through three rapid challenges—reuse an object, improve a dull space, and solve a rainy-recess problem—before sorting ideas into ordinary and surprising.', reflection: 'What helped you continue after the easy ideas were gone?', artifact: 'Fluency Sprint Record' },
      { title: 'Flexible Categories', target: 'I can change perspective or category to produce different kinds of ideas.', hook: 'Sort a spoon in five different ways without changing the spoon.', mini: 'Flexibility means shifting categories, viewpoints, or approaches. Model switching from “things it does” to “people who use it” to “problems it could solve.”', task: 'Teams revisit one challenge using four lenses: user, environment, technology, and unexpected constraint. They label the lens that produced each idea.', reflection: 'Which lens changed your thinking the most?', artifact: 'Four-Lens Idea Map' },
      { title: 'Useful Originality', target: 'I can select an unusual idea and develop it into a useful solution.', hook: 'Rank three inventions: common/useful, unusual/not useful, and unusual/useful.', mini: 'Originality is not randomness. A strong creative solution is both uncommon and responsive to the need.', task: 'Students use a two-axis grid (useful/unhelpful and common/unusual) to evaluate ideas, choose one promising concept, and add details through a SCAMPER-style revision cycle.', reflection: 'Which revision made your idea more useful rather than merely stranger?', artifact: 'Originality Decision Grid' },
      { title: 'Constraint Challenge', target: 'I can improve an idea while working within real limits.', hook: 'Announce: build the tallest paper structure—but only three sheets and 20 cm of tape are available.', mini: 'Constraints can sharpen creativity by forcing tradeoffs. Name the need, non-negotiables, resources, and success criteria before building.', task: 'Teams plan, build, test, and revise a solution to a teacher-selected challenge. They must document at least two discarded ideas and one evidence-based revision.', reflection: 'How did the constraint improve or limit your solution?', artifact: 'Creative Solution Portfolio' },
    ],
  },
  {
    id: 'systems-structures', title: 'Systems & Structures', icon: '⚙️', color: 'cyan', strand: 'Visual-spatial & systems thinking',
    essential: 'How do parts, relationships, and rules create a working system?',
    artifact: 'A systems model that explains inputs, parts, interactions, outputs, and ripple effects',
    materials: 'building materials, string, sticky notes, chart paper, scissors, tape',
    sessions: [
      { title: 'What Makes a System?', target: 'I can distinguish a collection from a system.', hook: 'Compare a pile of bicycle parts with a working bicycle.', mini: 'A system has parts that interact for a purpose. Introduce input, process, output, boundary, and feedback using a familiar school system.', task: 'Groups sort examples/nonexamples, then map one familiar system such as dismissal, lunch, a team, or a habitat.', reflection: 'Which relationship is most essential to your system?', artifact: 'Parts-and-Relationships Map' },
      { title: 'Hidden Connections', target: 'I can trace how a change in one part affects other parts.', hook: 'Ask what happens throughout a school if buses arrive 20 minutes late.', mini: 'Systems create chains of effects. Teach direct effects, indirect effects, and feedback loops.', task: 'Students draw ripple maps for a change to a chosen system, marking likely, possible, positive, and negative consequences.', reflection: 'Which effect was least obvious at first?', artifact: 'Ripple-Effect Diagram' },
      { title: 'Model, Test, Revise', target: 'I can build a model and use failure as evidence.', hook: 'Demonstrate a simple chain-reaction model that stops before the finish.', mini: 'A model is useful when it represents important relationships, not when it looks perfect. Failure identifies where a relationship needs revision.', task: 'Teams build a tabletop delivery or chain-reaction system with at least four interacting parts, run three tests, and keep a change log.', reflection: 'What did the model reveal that your original drawing did not?', artifact: 'Test-and-Revision Log' },
      { title: 'Redesign a School System', target: 'I can propose a systems improvement and anticipate tradeoffs.', hook: 'Name one small school routine that creates a surprisingly large problem.', mini: 'Systems solutions often help one goal while creating a new cost. Strong proposals name stakeholders and tradeoffs.', task: 'Students redesign a real school routine, create a before/after systems map, identify stakeholders, and present a 60-second evidence-based pitch.', reflection: 'Who benefits, who might be burdened, and what would you monitor?', artifact: 'Systems Redesign Brief' },
    ],
  },
  {
    id: 'evidence-court', title: 'Evidence Court', icon: '⚖️', color: 'rose', strand: 'Evidence & evaluation',
    essential: 'What makes a claim believable?',
    artifact: 'A claim-evidence-reasoning case file and reasoned verdict',
    materials: 'printed claim cards, evidence cards, highlighters, folders, sticky flags',
    sessions: [
      { title: 'Claim or Evidence?', target: 'I can separate a claim from the evidence used to support it.', hook: 'Post “Longer recess improves learning.” Ask what would need to be known before agreeing.', mini: 'A claim is an answer or position; evidence is information that supports or challenges it; reasoning explains the connection.', task: 'Students sort mixed statements into claim, evidence, reasoning, and irrelevant information, then repair a weak argument.', reflection: 'Why can a true fact still be weak evidence for a particular claim?', artifact: 'CER Sorting Mat' },
      { title: 'Evidence Quality', target: 'I can evaluate evidence for relevance, credibility, and sufficiency.', hook: 'Compare “my cousin said” with a month of class data.', mini: 'Introduce the three tests: Does it relate? Can it be trusted? Is there enough? Note that credible evidence can still be incomplete.', task: 'Teams rate evidence cards for a school-based case, defend ratings, and identify what evidence is still missing.', reflection: 'Which evidence looked convincing but failed one quality test?', artifact: 'Evidence Quality Ladder' },
      { title: 'Perspective and Bias', target: 'I can recognize how perspective shapes a source without dismissing it automatically.', hook: 'Read two short accounts of the same playground disagreement.', mini: 'Perspective affects what is noticed, omitted, and emphasized. Bias is a reason to examine a source, not an automatic reason to ignore it.', task: 'Students annotate paired accounts for agreement, conflict, missing voices, and loaded language, then draft neutral follow-up questions.', reflection: 'What could both sources be missing?', artifact: 'Perspective Comparison' },
      { title: 'The Case of the Community Choice', target: 'I can reach and defend a verdict while acknowledging uncertainty.', hook: 'Introduce a fictional choice: convert an unused lot into a garden, play space, or parking area.', mini: 'A reasoned verdict weighs competing evidence and criteria; it does not merely count facts.', task: 'Teams review a complete case file, choose criteria, prepare arguments, question another team, and write an individual verdict with a limitation.', reflection: 'What evidence could make you change your verdict?', artifact: 'Evidence Court Case File' },
    ],
  },
  {
    id: 'inquiry-lab', title: 'Inquiry Lab', icon: '🧭', color: 'sky', strand: 'Inquiry & research',
    essential: 'How do worthwhile questions lead to trustworthy answers?',
    artifact: 'A concise inquiry brief using supplied source excerpts and student-generated analysis',
    materials: 'question cards, teacher-provided source packets, note cards, colored pencils',
    sessions: [
      { title: 'Questions With Mileage', target: 'I can turn a broad curiosity into a focused, investigable question.', hook: 'Compare “Why is space interesting?” with “How does microgravity change an astronaut’s daily routines?”', mini: 'A productive inquiry question is focused, open, answerable with evidence, and worth investigating.', task: 'Students revise weak questions, use a question ladder (facts → causes → effects → choices), and conference with a peer.', reflection: 'What did you remove or add to give your question more mileage?', artifact: 'Question Revision Ladder' },
      { title: 'Source Detective', target: 'I can use author, date, purpose, and evidence to judge a source.', hook: 'Show two fictional web excerpts with different authors and purposes.', mini: 'Teach lateral questions: Who created this? For what purpose? What evidence is visible? What other source could confirm it?', task: 'Students inspect a teacher-provided four-source packet and create a trust note for each source; no open-web research is required.', reflection: 'Which source is useful despite having a clear point of view?', artifact: 'Source Trust Notes' },
      { title: 'Synthesize, Don’t Stack', target: 'I can combine ideas across sources instead of listing one source at a time.', hook: 'Model a weak “Source A says… Source B says…” paragraph and improve it.', mini: 'Synthesis organizes information by idea, relationship, or tension. Color-code agreements, differences, and unanswered questions.', task: 'Students complete a synthesis matrix from supplied excerpts and write a paragraph that connects at least two sources.', reflection: 'What new understanding appeared only after you compared sources?', artifact: 'Synthesis Matrix' },
      { title: 'Inquiry Brief', target: 'I can communicate an answer, evidence, limitation, and next question.', hook: 'Examine a one-page brief and identify what makes it easy to trust and use.', mini: 'A strong brief includes the question, defensible answer, selected evidence, reasoning, limitation, and next question.', task: 'Students create and peer-review a one-page inquiry brief using the class source packet or a teacher-approved topic.', reflection: 'What part of your answer is strongest, and where are you still uncertain?', artifact: 'One-Page Inquiry Brief' },
    ],
  },
  {
    id: 'design-constraints', title: 'Design Under Constraints', icon: '🛠️', color: 'emerald', strand: 'Problem solving & design',
    essential: 'How can testing turn an idea into a better solution?',
    artifact: 'A tested prototype with user criteria, data, and documented revisions',
    materials: 'recycled building materials, tape, craft sticks, paper, measuring tools, weights',
    sessions: [
      { title: 'Find the Real Problem', target: 'I can define a need from the user’s point of view.', hook: 'Present “Design a better backpack” and ask: better for whom, doing what, under which conditions?', mini: 'Design starts with users and needs, not favorite inventions. Write a problem statement: [user] needs [need] because [insight].', task: 'Students analyze three fictional user interviews, identify needs versus wants, and choose one design problem.', reflection: 'How did the user evidence change the problem you thought you were solving?', artifact: 'User-Need Brief' },
      { title: 'Criteria and Tradeoffs', target: 'I can define success criteria and identify competing priorities.', hook: 'Can a container be strongest, lightest, cheapest, and largest all at once?', mini: 'Criteria describe success; constraints limit the solution; tradeoffs require prioritization.', task: 'Teams rank criteria, build a weighted decision matrix, sketch three concepts, and select one using evidence rather than popularity.', reflection: 'Which tradeoff was hardest to accept?', artifact: 'Decision Matrix' },
      { title: 'Prototype and Test', target: 'I can collect useful test data instead of asking only whether a design works.', hook: 'Compare “It worked” with a table recording load, time, leaks, or user ratings.', mini: 'A fair test changes one important feature, uses consistent conditions, and records observable results.', task: 'Students build a low-cost prototype, conduct at least three trials, record data, and identify a failure point.', reflection: 'What did the data show that observation alone might have missed?', artifact: 'Prototype Test Record' },
      { title: 'Revision Defense', target: 'I can explain why a revision is likely to improve the design.', hook: 'Show a before/after sketch without explanation and ask what evidence is missing.', mini: 'A revision claim should connect a test result to a specific change and predicted improvement.', task: 'Teams revise, retest, and deliver a two-minute design defense including need, criteria, test data, revision, and remaining limitation.', reflection: 'What would you test next with more time or materials?', artifact: 'Design Defense Board' },
    ],
  },
  {
    id: 'perspectives-paradoxes', title: 'Perspectives & Paradoxes', icon: '🔄', color: 'violet', strand: 'Complexity & perspective',
    essential: 'How can two conflicting ideas both contain part of the truth?',
    artifact: 'A multi-perspective dialogue and nuanced position statement',
    materials: 'scenario cards, perspective frames, chart paper, discussion tokens',
    sessions: [
      { title: 'Change the Lens', target: 'I can explain how a situation looks different from another viewpoint.', hook: 'Describe a surprise snow day from the viewpoint of a student, caregiver, bus driver, and principal.', mini: 'Perspective is shaped by role, goals, experiences, responsibilities, and information—not just opinion.', task: 'Students rotate through stakeholder lenses for a shared scenario and annotate what each person values, fears, and may not know.', reflection: 'Which perspective was hardest to represent fairly?', artifact: 'Stakeholder Lens Map' },
      { title: 'Both/And Thinking', target: 'I can hold two competing truths without forcing a false either/or choice.', hook: 'Discuss: rules can protect people, and rules can sometimes create unfair outcomes.', mini: 'A paradox or tension invites both/and thinking. Name the value on each side before choosing a response.', task: 'Pairs unpack age-appropriate tensions such as privacy vs. safety or tradition vs. change, then build a tension line with evidence on both sides.', reflection: 'What was lost when the issue was framed as only two simple choices?', artifact: 'Both/And Tension Line' },
      { title: 'Dialogue Across Difference', target: 'I can ask questions that clarify rather than corner another thinker.', hook: 'Transform “How can you believe that?” into a genuine question.', mini: 'Teach dialogue moves: paraphrase, ask for evidence, identify a shared value, and revise your own claim.', task: 'Students use role cards and discussion tokens in a structured dialogue, recording one idea they understood better and one question that remains.', reflection: 'Which conversation move made the discussion more productive?', artifact: 'Dialogue Listening Log' },
      { title: 'A Nuanced Position', target: 'I can state a position that responds to evidence and competing values.', hook: 'Compare absolute language with qualified language such as generally, when, unless, and depending on.', mini: 'Nuance is precision, not weakness. A strong position names conditions, exceptions, and unanswered questions.', task: 'Students write a claim on a familiar issue, add a counterpoint, revise with conditions, and present a multi-perspective dialogue.', reflection: 'How did acknowledging a counterpoint strengthen your position?', artifact: 'Nuanced Position Statement' },
    ],
  },
  {
    id: 'thinkers-showcase', title: 'Thinkers Showcase', icon: '🌟', color: 'yellow', strand: 'Metacognition & communication',
    essential: 'How can we make growth in thinking visible?',
    artifact: 'A curated thinking portfolio and student-led public explanation',
    materials: 'student work samples, folders, reflection sheets, display materials, feedback forms',
    sessions: [
      { title: 'Trace the Thinking', target: 'I can identify evidence of how my thinking changed.', hook: 'Show an early and revised solution and ask what growth is visible between them.', mini: 'Growth evidence is more than a high score. Look for strategy changes, better questions, productive revision, clearer evidence, and increased independence.', task: 'Students sort work samples, tag evidence by thinking strand, and choose one “before/after” pair.', reflection: 'What can you do now that was difficult at the beginning?', artifact: 'Growth Evidence Tags' },
      { title: 'Curate, Don’t Collect', target: 'I can select artifacts that tell a coherent learning story.', hook: 'Compare an overstuffed folder with a three-piece collection that has explanations.', mini: 'Curation means making purposeful choices for an audience. Each artifact should show a distinct part of the story.', task: 'Students choose three to five artifacts, write why each matters, and identify one honest struggle or unfinished question.', reflection: 'What did you leave out, and why?', artifact: 'Portfolio Curation Plan' },
      { title: 'Teach Your Thinking', target: 'I can explain a strategy so another person can use it.', hook: 'Ask a student to explain not just an answer, but the mental move that unlocked it.', mini: 'A strong explanation names the problem, strategy, turning point, evidence, and transfer to a new situation.', task: 'Students build and rehearse a three-minute interactive explanation with one question or mini-challenge for visitors.', reflection: 'Where did your audience need more context?', artifact: 'Student-Led Explanation Script' },
      { title: 'Showcase and Next Goal', target: 'I can use feedback and evidence to choose a meaningful next thinking goal.', hook: 'Distinguish praise (“great job”) from useful feedback tied to thinking.', mini: 'Feedback describes evidence, asks a question, or offers a next step. Goals should name the thinking behavior, context, and evidence to collect.', task: 'Students present, collect visitor feedback, complete a final self-assessment, and set one specific next goal.', reflection: 'Which piece of feedback will influence what you do next?', artifact: 'Portfolio, Feedback & Next-Goal Page' },
    ],
  },
]

export const STUDENT_PRINTABLES = [
  { title: 'Thinking Portfolio Cover & Contents', purpose: 'Organize selected evidence by unit and thinking strand.', prompts: ['This portfolio belongs to…', 'The thinking move I use most confidently is…', 'A thinking move I am still developing is…', 'Artifact / strand / why I selected it'] },
  { title: 'Challenge Workmat', purpose: 'Keep difficult tasks from turning into unstructured trial and error.', prompts: ['What do we know?', 'What do we need to figure out?', 'Possible strategies', 'Evidence from our attempt', 'What will we change next?'] },
  { title: 'Question Revision Ladder', purpose: 'Move from a broad topic to a focused, investigable question.', prompts: ['My first question', 'Can it be answered with yes/no?', 'What causes, effects, patterns, perspectives, or choices could I explore?', 'My revised question', 'Why this question matters'] },
  { title: 'Claim–Evidence–Reasoning Organizer', purpose: 'Make arguments visible and testable.', prompts: ['My claim', 'Best supporting evidence', 'How the evidence supports the claim', 'Evidence or perspective that complicates it', 'My revised claim'] },
  { title: 'Perspective Lens Card', purpose: 'Represent a stakeholder fairly before evaluating a position.', prompts: ['Who am I?', 'What do I value?', 'What do I know?', 'What might I be worried about?', 'What information could change my view?'] },
  { title: 'Prototype Test & Revision Log', purpose: 'Turn unsuccessful trials into usable evidence.', prompts: ['Test question', 'What stays the same?', 'What changes?', 'Results', 'Failure point', 'Revision and reason'] },
  { title: 'Peer Feedback: Notice, Ask, Suggest', purpose: 'Replace empty praise with kind, specific thinking feedback.', prompts: ['I noticed evidence of…', 'I am curious about…', 'A possible next step is…', 'The creator’s response…'] },
  { title: 'Metacognitive Exit Ticket', purpose: 'Build strategy awareness in three minutes.', prompts: ['Today’s thinking challenge was…', 'A strategy I tried…', 'Where I got stuck…', 'How I changed course…', 'Where this strategy could transfer'] },
]

export const GROWTH_RUBRIC = [
  { level: 1, label: 'Beginning', description: 'Uses a familiar approach with substantial prompting; explanation names an answer more than the thinking behind it.' },
  { level: 2, label: 'Developing', description: 'Selects a relevant strategy with some support; uses partial evidence and can describe a change after prompting.' },
  { level: 3, label: 'Independent', description: 'Chooses and applies an effective strategy; explains evidence, revises purposefully, and reflects on the process.' },
  { level: 4, label: 'Transfer & leadership', description: 'Adapts or combines strategies in a new context; weighs limitations and helps others strengthen their thinking.' },
]

const DURATION_RULES = {
  9: { unitCount: 2, extra: ['Launch & pre-thinking sample'] },
  18: { unitCount: 4, extra: ['Launch & pre-thinking sample', 'Portfolio share & post-thinking sample'] },
  36: { unitCount: 8, extra: ['Launch & pre-thinking sample', 'Midyear strategy conference', 'Independent transfer challenge', 'Portfolio showcase & post-thinking sample'] },
}

export function recommendedUnitIds(weeks) {
  if (Number(weeks) === 9) return ['pattern-detectives', 'impossible-possibilities']
  if (Number(weeks) === 18) return ['pattern-detectives', 'impossible-possibilities', 'evidence-court', 'design-constraints']
  return ADVANCED_UNITS.map((unit) => unit.id)
}

export function buildAdvancedCurriculum(input) {
  const weeks = Number(input.weeks || 18)
  const rule = DURATION_RULES[weeks] ?? DURATION_RULES[18]
  let selected = ADVANCED_UNITS.filter((unit) => (input.units ?? []).includes(unit.id))
  if (!selected.length) selected = ADVANCED_UNITS.filter((unit) => recommendedUnitIds(weeks).includes(unit.id))
  selected = selected.slice(0, rule.unitCount)

  const coreSessions = selected.flatMap((unit) => unit.sessions.map((session, index) => ({
    ...session, unitId: unit.id, unit: unit.title, unitIcon: unit.icon, sessionInUnit: index + 1,
    materials: unit.materials, essential: unit.essential,
  })))
  const launch = { unit: 'Course Launch', unitIcon: '🚀', title: 'The Unfamiliar Challenge', target: 'I can show how I approach a problem before I have been taught a strategy.', hook: 'Tell students the goal is to make their thinking visible—not to finish first.', mini: 'Introduce productive struggle, respectful intellectual risk, and the portfolio routine.', task: 'Students independently solve a multi-solution logic-and-design prompt, annotate attempts, and explain what they did when stuck.', reflection: 'What does this sample reveal about how you currently approach challenge?', artifact: 'Pre-thinking sample', materials: 'baseline prompt, blank paper, pencils', essential: 'What do I do when the answer is not obvious?' }
  const midyear = { unit: 'Growth Checkpoint', unitIcon: '📈', title: 'Strategy Conference', target: 'I can compare strategies and select one for a new challenge.', hook: 'Revisit two early artifacts without scores visible.', mini: 'Model describing growth with evidence rather than labels such as smart or good.', task: 'Students tag portfolio evidence, conference with a partner, and deliberately apply a less-used strategy to a transfer task.', reflection: 'Which strategy are you ready to use more independently?', artifact: 'Midyear strategy reflection', materials: 'portfolio, rubric, strategy cards', essential: 'How is my thinking becoming more flexible?' }
  const transfer = { unit: 'Independent Transfer', unitIcon: '🌉', title: 'The Strategy Bridge', target: 'I can transfer a thinking strategy to a new content or real-world context.', hook: 'Ask where a pattern, evidence, systems, or perspective strategy appears outside this class.', mini: 'Transfer requires recognizing what is structurally similar even when surface details differ.', task: 'Students choose a school, community, science, arts, or personal problem and document how one course strategy changes their approach.', reflection: 'What was similar enough for the strategy to transfer?', artifact: 'Independent transfer brief', materials: 'strategy menu, planning page', essential: 'How do thinking tools travel?' }
  const showcase = { unit: 'Course Finale', unitIcon: '🌟', title: 'Thinking Growth Showcase', target: 'I can demonstrate growth using artifacts, reflection, and a new performance sample.', hook: 'Compare “I got better” with a claim supported by two artifacts.', mini: 'A growth claim needs a baseline, later evidence, explanation, and an honest next step.', task: 'Students complete a parallel post-thinking sample, curate artifacts, score evidence with the common rubric, and present one strategy to an audience.', reflection: 'What is the most important change in how you respond to challenge?', artifact: 'Post-thinking sample and portfolio defense', materials: 'post prompt, portfolio, rubric, feedback form', essential: 'How can thinking growth become visible?' }

  let sessions = [launch, ...coreSessions]
  if (weeks === 18) sessions.push(showcase)
  if (weeks === 36) sessions = [launch, ...coreSessions.slice(0, 16), midyear, ...coreSessions.slice(16), transfer, showcase]
  sessions = sessions.slice(0, weeks).map((session, index) => ({
    ...session,
    week: index + 1,
    pathwayTask: session.unitId == null ? session.task : pathwayTask(session.unitId, session.sessionInUnit - 1, input.gradeBand || '4–5', session.task),
  }))

  const gradeBand = input.gradeBand || '4–5'
  const gradeGuide = GRADE_PATHWAYS[gradeBand] ?? GRADE_PATHWAYS['4–5']
  selected = selected.map((unit) => ({
    ...unit,
    sessions: unit.sessions.map((session, index) => ({
      ...session,
      task: pathwayTask(unit.id, index, gradeBand, session.task),
      hook: pathwayHook(gradeBand, session.hook),
      mini: pathwayMini(gradeBand, session.mini),
      reflection: pathwayReflection(gradeBand, session.reflection),
    })),
    selectedGradeMove: gradeBand === 'K–5 mixed'
      ? `${UNIT_GRADE_MOVES[unit.id]['K–1']} ${UNIT_GRADE_MOVES[unit.id]['2–3']} ${UNIT_GRADE_MOVES[unit.id]['4–5']}`
      : UNIT_GRADE_MOVES[unit.id][gradeBand],
    gradeMoves: UNIT_GRADE_MOVES[unit.id],
  }))

  return {
    type: 'advanced-thinkers', title: input.title || 'K–5 Thinking Lab', gradeBand,
    weeks, meetings: Number(input.meetings || 1), minutes: Number(input.minutes || 45), selected, sessions,
    strands: THINKING_STRANDS, printables: STUDENT_PRINTABLES, rubric: GROWTH_RUBRIC, gradeGuide,
    coursePromise: 'Students learn reusable thinking strategies, apply them to unfamiliar problems, and make growth visible through a curated portfolio.',
    teacherPrep: [
      'Print one portfolio cover, challenge workmat, and exit-ticket set per student.',
      'Prepare unit materials before each four-session cycle; ordinary classroom and recycled supplies are sufficient.',
      'Use the same four-level rubric for the pre-sample, selected artifacts, and post-sample—never for public ranking.',
      'Keep open-web research optional. The Inquiry Lab works with teacher-provided source excerpts so limited pull-out time is protected.',
      `Use the ${gradeGuide.label} pathway: ${gradeGuide.approach}`,
      'Offer response choices (oral, written, diagram, model) without reducing the thinking demand for 2e learners.',
    ],
  }
}
