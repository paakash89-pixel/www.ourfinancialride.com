export interface NewsletterIssue {
  slug: string;
  title: string;
  issueNumber: number;
  publishedOn: string;
  summary: string;
  bullets: string[];
}

export const NEWSLETTER_ISSUES: NewsletterIssue[] = [
  {
    slug: "ofr-01-wealth-without-noise",
    title: "Wealth Without Noise",
    issueNumber: 1,
    publishedOn: "2026-02-01",
    summary:
      "Why process beats prediction, and how a calm money system reduces mistakes in both India and the US.",
    bullets: [
      "A two-account setup for spending and investing discipline.",
      "How to set your baseline savings rate in 20 minutes.",
      "One practical habit to stop lifestyle inflation after appraisals."
    ]
  },
  {
    slug: "ofr-02-indexing-across-borders",
    title: "Indexing Across Borders",
    issueNumber: 2,
    publishedOn: "2026-02-08",
    summary:
      "A cross-border primer on US retirement accounts and India SIP investing decisions.",
    bullets: [
      "How to think about 401(k) + Roth combinations.",
      "SIP consistency rules for volatile markets.",
      "A simple checklist before changing your investment plan."
    ]
  },
  {
    slug: "ofr-03-retirement-withdrawal-discipline",
    title: "Withdrawal Discipline",
    issueNumber: 3,
    publishedOn: "2026-02-15",
    summary:
      "How to plan withdrawals without fear, including inflation and sequence-of-return risk.",
    bullets: [
      "When the 4% rule is useful and when to be conservative.",
      "How to build a one-page annual review for retirees.",
      "A stress-test method for SWP sustainability."
    ]
  }
];
