import type { ComplianceViolation } from "@/types/session";

// Nevada Real Estate Law Compliance Rules
export const complianceRules = {
  // Disclosure Requirements
  disclosure: {
    agency_relationship: {
      pattern: /working with|represent|agent|help you/i,
      required: true,
      description: "Agent must disclose agency relationship early in conversation",
      suggestion: "Explain who you represent and your duties to the buyer",
    },
    material_facts: {
      pattern: /problem|issue|defect|damage|repair/i,
      required: true,
      description: "Material facts about properties must be disclosed",
      suggestion: "Ensure all known material defects are disclosed",
    },
  },

  // Illegal Promises
  promises: {
    appreciation: {
      patterns: [
        /home values? (will|always|definitely|guaranteed to) (go up|increase|appreciate|rise)/i,
        /guaranteed (return|profit|appreciation)/i,
        /can't lose (money|value)/i,
        /always goes? up/i,
        /never (lose|go down|depreciate)/i,
      ],
      severity: "critical" as const,
      description: "Cannot guarantee property appreciation",
      suggestion: "Never promise home values will increase. Say 'historically' or 'may' instead",
    },
    returns: {
      patterns: [
        /guaranteed (income|rental|cash flow)/i,
        /will definitely (rent|make money)/i,
        /can't fail/i,
      ],
      severity: "critical" as const,
      description: "Cannot guarantee investment returns",
      suggestion: "Use phrases like 'potential' or 'based on current market'",
    },
  },

  // Fair Housing Violations
  fair_housing: {
    protected_classes: {
      patterns: [
        /good (neighborhood|area|school) for (families like yours|people like you|your kind)/i,
        /you (probably )?would(n't)? fit in/i,
        /(not|less) safe for (you|your family|people like you)/i,
        /better suited for (different|other|certain) (people|families)/i,
      ],
      severity: "critical" as const,
      description: "Fair Housing Act prohibits discrimination",
      suggestion: "Never steer clients based on protected class characteristics",
    },
    steering: {
      patterns: [
        /you (should|might want to) (look|live) in/i,
        /this area is (mostly|predominantly|mainly)/i,
        /people like you (usually|typically|often)/i,
      ],
      severity: "warning" as const,
      description: "Avoid steering clients to specific areas",
      suggestion: "Let clients choose areas based on their stated preferences",
    },
  },

  // Licensing Issues
  licensing: {
    legal_advice: {
      patterns: [
        /you (should|must) sign/i,
        /the contract (means|says that you)/i,
        /legally (you have to|required)/i,
        /my legal advice/i,
      ],
      severity: "warning" as const,
      description: "Agents cannot provide legal advice",
      suggestion: "Recommend the client consult with an attorney for legal questions",
    },
    financial_advice: {
      patterns: [
        /you should (put|invest|save)/i,
        /best (investment|financial) (decision|choice)/i,
        /financially you should/i,
      ],
      severity: "info" as const,
      description: "Agents should not provide financial advice",
      suggestion: "Recommend the client consult with a financial advisor",
    },
  },

  // Ethics
  ethics: {
    misrepresentation: {
      patterns: [
        /don't worry about (disclosure|telling)/i,
        /no one will know/i,
        /we can skip/i,
        /between us/i,
      ],
      severity: "critical" as const,
      description: "Agents must not misrepresent or conceal material facts",
      suggestion: "Always be transparent and honest with all parties",
    },
    dual_agency: {
      patterns: [
        /represent both/i,
        /work with both/i,
        /help the seller too/i,
      ],
      severity: "info" as const,
      description: "Dual agency requires disclosure and consent",
      suggestion: "Explain dual agency implications and get written consent if applicable",
    },
  },
};

// Check a message for compliance violations
export function checkCompliance(
  message: string,
  transcriptIndex: number
): ComplianceViolation[] {
  const violations: ComplianceViolation[] = [];

  // Check promises (most critical)
  for (const [key, rule] of Object.entries(complianceRules.promises)) {
    for (const pattern of rule.patterns) {
      if (pattern.test(message)) {
        violations.push({
          id: crypto.randomUUID(),
          severity: rule.severity,
          category: "promises",
          message: rule.description,
          suggestion: rule.suggestion,
          transcriptIndex,
          timestamp: Date.now(),
        });
        break; // Only one violation per rule
      }
    }
  }

  // Check fair housing
  for (const [key, rule] of Object.entries(complianceRules.fair_housing)) {
    for (const pattern of rule.patterns) {
      if (pattern.test(message)) {
        violations.push({
          id: crypto.randomUUID(),
          severity: rule.severity,
          category: "fair_housing",
          message: rule.description,
          suggestion: rule.suggestion,
          transcriptIndex,
          timestamp: Date.now(),
        });
        break;
      }
    }
  }

  // Check licensing
  for (const [key, rule] of Object.entries(complianceRules.licensing)) {
    for (const pattern of rule.patterns) {
      if (pattern.test(message)) {
        violations.push({
          id: crypto.randomUUID(),
          severity: rule.severity,
          category: "licensing",
          message: rule.description,
          suggestion: rule.suggestion,
          transcriptIndex,
          timestamp: Date.now(),
        });
        break;
      }
    }
  }

  // Check ethics
  for (const [key, rule] of Object.entries(complianceRules.ethics)) {
    for (const pattern of rule.patterns) {
      if (pattern.test(message)) {
        violations.push({
          id: crypto.randomUUID(),
          severity: rule.severity,
          category: "ethics",
          message: rule.description,
          suggestion: rule.suggestion,
          transcriptIndex,
          timestamp: Date.now(),
        });
        break;
      }
    }
  }

  return violations;
}

// Generate AI-based compliance analysis prompt
export function generateCompliancePrompt(message: string): string {
  return `Analyze this real estate agent statement for Nevada real estate law compliance issues:

"${message}"

Check for:
1. Illegal promises about property appreciation or guaranteed returns
2. Fair Housing Act violations (steering, discrimination)
3. Practicing law without a license (giving legal advice)
4. Practicing financial advising without license
5. Failure to disclose material facts
6. Misrepresentation or concealment
7. Dual agency disclosure issues

Respond with JSON:
{
  "violations": [
    {
      "severity": "info" | "warning" | "critical",
      "category": "disclosure" | "fair_housing" | "licensing" | "promises" | "ethics",
      "message": "Brief description of the issue",
      "suggestion": "How to correct this"
    }
  ],
  "isCompliant": boolean
}

If no violations, return {"violations": [], "isCompliant": true}`;
}

// Get educational content about a compliance category
export function getComplianceEducation(category: ComplianceViolation["category"]): {
  title: string;
  description: string;
  examples: string[];
  resources: string[];
} {
  const education: Record<ComplianceViolation["category"], {
    title: string;
    description: string;
    examples: string[];
    resources: string[];
  }> = {
    disclosure: {
      title: "Disclosure Requirements",
      description: "Nevada law requires agents to disclose material facts and agency relationships.",
      examples: [
        "Disclosing your agency relationship at first substantive contact",
        "Revealing known property defects",
        "Explaining commission structures when asked",
      ],
      resources: [
        "NRS 645.252 - Duties of licensees",
        "NAC 645.637 - Agency disclosure requirements",
      ],
    },
    fair_housing: {
      title: "Fair Housing Act Compliance",
      description: "Federal and state laws prohibit discrimination based on protected classes.",
      examples: [
        "Never suggest a neighborhood based on race or religion",
        "Don't assume family needs based on protected characteristics",
        "Show all available properties regardless of client demographics",
      ],
      resources: [
        "Fair Housing Act (42 U.S.C. 3601-3619)",
        "NRS 118.010-118.120 - Nevada Fair Housing Law",
      ],
    },
    licensing: {
      title: "Scope of Practice",
      description: "Agents must stay within their licensed scope of practice.",
      examples: [
        "Refer legal questions to attorneys",
        "Refer tax questions to CPAs",
        "Refer financial planning to licensed advisors",
      ],
      resources: [
        "NRS 645.030 - Acts requiring license",
        "NAC 645.605 - Prohibited conduct",
      ],
    },
    promises: {
      title: "Prohibited Promises",
      description: "Agents cannot guarantee investment outcomes or property appreciation.",
      examples: [
        "Don't say 'values always go up'",
        "Don't promise specific rental income",
        "Use 'may,' 'historically,' or 'potential' language",
      ],
      resources: [
        "NAC 645.610 - Misrepresentation",
        "Nevada Real Estate Division guidelines",
      ],
    },
    ethics: {
      title: "Ethical Conduct",
      description: "Agents must act with honesty and integrity in all transactions.",
      examples: [
        "Always tell the truth",
        "Disclose conflicts of interest",
        "Put client interests first",
      ],
      resources: [
        "NAR Code of Ethics",
        "NRS 645.630 - Grounds for disciplinary action",
      ],
    },
  };

  return education[category];
}
