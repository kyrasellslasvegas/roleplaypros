// Post-session feedback analysis prompts

export const SESSION_ANALYSIS_SYSTEM_PROMPT = `You are an expert real estate sales coach. Analyze the roleplay session and provide actionable feedback.

## SKILL AREAS (Grade A+ to F)

1. **Building Rapport** - Personal connection, active listening, making buyer comfortable
2. **Discovery Questions** - Understanding buyer needs, motivations, timeline
3. **Money Qualification** - Budget discussion, pre-approval, financing comfort
4. **Objection Handling** - Responding to concerns, staying calm, turning objections around
5. **Frame Control** - Leading conversation, maintaining authority professionally
6. **Closing Skills** - Asking for commitment, clear next steps, handling hesitation
7. **Compliance** - Nevada RE law adherence, proper disclosures, no illegal promises

## GRADING SCALE
A+/A/A- = Excellent | B+/B/B- = Good | C+/C/C- = Needs Work | D/F = Poor

## OUTPUT (JSON only)

{
  "overallGrade": "B+",
  "overallSummary": "2-3 sentence assessment of performance",
  "skillGrades": [
    {"skill": "Building Rapport", "grade": "A-", "notes": "Specific feedback with example", "trend": "improving"}
  ],
  "strengths": ["Specific strength with example from transcript"],
  "areasForImprovement": ["Specific area with actionable suggestion"],
  "complianceIssues": [
    {"severity": "minor", "description": "Issue description", "transcriptReference": 5, "suggestion": "What to do instead"}
  ],
  "keyMoments": [
    {"timestamp": 120, "type": "positive", "description": "What happened and why it matters"}
  ],
  "nextSessionFocus": "One specific thing to focus on next time"
}

Be specific. Reference exact moments from the transcript. Give actionable advice.`;

export function buildFeedbackAnalysisPrompt(
  transcript: { speaker: string; content: string; timestamp: number }[],
  buyerProfile: { experienceLevel: string; emotionalState: string; resistanceLevel: string },
  difficulty: string,
  durationMinutes: number
): string {
  // Limit transcript to prevent token overflow
  const maxEntries = 30;
  const limitedTranscript = transcript.slice(-maxEntries);

  const formattedTranscript = limitedTranscript
    .map(
      (entry, index) =>
        `[${index}] ${Math.floor(entry.timestamp / 60)}:${String(entry.timestamp % 60).padStart(2, "0")} ${entry.speaker === "user" ? "AGENT" : "BUYER"}: ${entry.content}`
    )
    .join("\n");

  return `SESSION INFO:
- Difficulty: ${difficulty}
- Duration: ${durationMinutes} min
- Buyer: ${buyerProfile.experienceLevel} buyer, ${buyerProfile.emotionalState}, ${buyerProfile.resistanceLevel} resistance

TRANSCRIPT:
${formattedTranscript}

Analyze and return JSON feedback.`;
}
