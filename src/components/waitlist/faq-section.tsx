"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "What is Roleplay Pros?",
    answer:
      "Roleplay Pros is an AI-powered sales training platform specifically designed for real estate agents. You practice with realistic AI buyers powered by our custom realtime avatar while receiving real-time coaching from an AI sales coach. It's like having a personal trainer for your sales skills, available 24/7.",
  },
  {
    question: "When does Roleplay Pros launch?",
    answer:
      "Roleplay Pros officially launches on January 16, 2026 at 12:01 PM PST. However, waitlist members get exclusive early access starting January 9, 2026—a full 7 days before everyone else.",
  },
  {
    question: "What do I get by joining the waitlist?",
    answer:
      "Waitlist members receive: (1) 7 days early access starting January 9th, (2) 30% lifetime discount on Pro subscriptions, (3) Extended 14-day free trial instead of the standard 7 days, and (4) Access to 5 exclusive AI buyer personas only available to founding members.",
  },
  {
    question: "Is there a free plan?",
    answer:
      "Yes! Our free plan includes 3 roleplay sessions per month with beginner difficulty. It's perfect for trying out the platform. Pro subscribers get unlimited sessions, all difficulty levels, real-time coaching, and access to our full library of buyer personas.",
  },
  {
    question: "How do the AI buyers work?",
    answer:
      "Our AI buyers are powered by our custom realtime avatar—you'll see a realistic video of a person who responds in real-time to what you say. They have unique personalities, emotional states, and resistance levels. They can be skeptical, enthusiastic, aggressive negotiators, or nervous first-timers. It feels like a real conversation.",
  },
  {
    question: "What is the AI Sales Coach?",
    answer:
      "The AI Sales Coach is your personal training partner. During live sessions, it whispers suggestions through on-screen prompts—like a coach in your ear. After sessions, it provides detailed feedback on your performance, highlights areas for improvement, and tracks your progress over time.",
  },
  {
    question: "Is Roleplay Pros only for Nevada agents?",
    answer:
      "We're launching first with Nevada-specific compliance training, but the core sales training works for any real estate market. We're expanding to other states throughout 2026. If you're not in Nevada, you can still benefit from the objection handling, rapport building, and closing techniques.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Absolutely. There are no long-term contracts. You can cancel your Pro subscription at any time, and you'll retain access until the end of your billing period. We believe in earning your business every month.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5">
            <HelpCircle className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Common Questions
            </span>
          </div>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Frequently Asked <span className="text-primary font-semibold">Questions</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Everything you need to know about Roleplay Pros and the waitlist.
          </p>
        </div>

        {/* FAQ accordion */}
        <div className="mt-12 space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={cn(
                "overflow-hidden rounded-xl border transition-all duration-300",
                openIndex === index
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-card hover:border-primary/20"
              )}
            >
              <button
                className="flex w-full items-center justify-between px-6 py-4 text-left"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span
                  className={cn(
                    "font-medium transition-colors",
                    openIndex === index ? "text-primary" : "text-foreground"
                  )}
                >
                  {faq.question}
                </span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300",
                    openIndex === index && "rotate-180 text-primary"
                  )}
                />
              </button>
              <div
                className={cn(
                  "grid transition-all duration-300",
                  openIndex === index
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                )}
              >
                <div className="overflow-hidden">
                  <p className="px-6 pb-4 text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact prompt */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            Still have questions?{" "}
            <a
              href="mailto:support@roleplaypros.com"
              className="font-medium text-primary hover:text-gold-400 transition-colors"
            >
              Contact us
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
