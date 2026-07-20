export function buildIncidentReportPrompt({ dateTime, location, studentName, incidentDescription, witnesses, actionsTaken, followUpNeeded, subject }) {
  const name = studentName?.trim() || 'Student (name withheld)';

  const system = `You are a school administrator generating a formal incident report for official school records. This document may be used for office referrals, disciplinary records, or legal documentation. Use formal, professional language. All content must be factual and based only on the information provided.

Return ONLY a single JSON object with this exact schema:
{
  "incident_report": string
}

The report must follow this structure (use clear paragraph breaks, no markdown):

INCIDENT REPORT

Date/Time: [from input]
Location: [from input]
Reporting Staff: [leave as: ___________________________]
Student(s) Involved: [name(s)]
Witnesses: [names or "None reported"]

DESCRIPTION OF INCIDENT
[2-4 paragraph factual account of what occurred, written in formal third-person past tense. Do not add facts not provided. Do not speculate.]

IMMEDIATE ACTIONS TAKEN
[Bulleted or paragraph list of actions taken by staff]

FOLLOW-UP REQUIRED
[What needs to happen next]

Signature / Date: ___________________________

Rules:
- Use only the facts provided. Do not embellish or add details.
- Objective, formal tone throughout.
- No markdown fences, no commentary — only the JSON object containing the full report text.`;

  const user = `Generate a formal incident report from this information:

Date/Time: ${dateTime || 'Not specified'}
Location: ${location || 'Not specified'}
Class/Subject: ${subject || 'Not specified'}
Student(s): ${name}
Witnesses: ${witnesses?.trim() || 'None reported'}

Incident description (write into formal language):
${incidentDescription}

Actions taken by staff:
${actionsTaken?.trim() || 'Not specified'}

Follow-up needed:
${followUpNeeded?.trim() || 'To be determined'}

Return the JSON object now.`;

  return { system, user };
}
