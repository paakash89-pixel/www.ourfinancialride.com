export interface LearnSection {
  heading: string;
  body: string;
}

export interface LearnArticle {
  slug: string;
  title: string;
  excerpt: string;
  audience: "India" | "US" | "India + US";
  readTime: string;
  sections: LearnSection[];
}

export const LEARN_ARTICLES: LearnArticle[] = [
  {
    slug: "what-is-the-4-percent-rule",
    title: "What Is the 4% Rule?",
    excerpt:
      "A practical framework to estimate retirement corpus and withdrawals without overcomplicating decisions.",
    audience: "India + US",
    readTime: "6 min read",
    sections: [
      {
        heading: "Simple definition",
        body:
          "The 4% rule suggests that a diversified long-term portfolio may support first-year withdrawals of 4% of your corpus, adjusted for inflation each year."
      },
      {
        heading: "How to use it",
        body:
          "Take your annual expenses and divide by 0.04. If your annual spend is $60,000, your starting FI corpus is about $1.5M before adding a margin of safety."
      },
      {
        heading: "Where people get confused",
        body:
          "The rule is not a guarantee. It is a planning baseline. Sequence of returns, valuation, and spending flexibility all matter."
      }
    ]
  },
  {
    slug: "how-index-funds-work",
    title: "How Index Funds Work",
    excerpt:
      "Why broad-market indexing remains a rational default for most working professionals.",
    audience: "India + US",
    readTime: "7 min read",
    sections: [
      {
        heading: "Core principle",
        body:
          "An index fund tracks a market index instead of trying to pick winners. You own the market at low cost and avoid manager selection risk."
      },
      {
        heading: "Why low fees matter",
        body:
          "Even a 1% fee drag compounds over decades. Low-cost index funds preserve more of your long-term returns."
      },
      {
        heading: "Behavior benefit",
        body:
          "Simple portfolios reduce decision fatigue and make it easier to keep investing through market cycles."
      }
    ]
  },
  {
    slug: "lifestyle-inflation-trap",
    title: "The Lifestyle Inflation Trap",
    excerpt:
      "Higher income does not always create wealth. Unchecked spending growth can cancel financial progress.",
    audience: "India + US",
    readTime: "5 min read",
    sections: [
      {
        heading: "The trap",
        body:
          "As salary rises, housing, dining, and convenience expenses rise too. Savings rate stays flat even with better income."
      },
      {
        heading: "A practical fix",
        body:
          "Pre-commit 50% of each raise to investing. If income goes up, your wealth rate goes up by default."
      },
      {
        heading: "How to measure",
        body:
          "Track savings rate quarterly. If your net worth growth slows while income rises, lifestyle creep is likely the reason."
      }
    ]
  },
  {
    slug: "us-vs-india-investing-basics",
    title: "US vs India Investing: A Practical Comparison",
    excerpt:
      "A clean map of common vehicles: 401(k), Roth IRA, EPF, NPS, and index mutual funds.",
    audience: "India + US",
    readTime: "8 min read",
    sections: [
      {
        heading: "US default stack",
        body:
          "A common path is 401(k) for tax-advantaged retirement contributions, Roth IRA for tax-free growth, and low-cost brokerage index funds for additional investing."
      },
      {
        heading: "India default stack",
        body:
          "A practical stack is EPF/NPS where relevant, then SIPs into diversified index funds, with emergency and debt planning handled separately."
      },
      {
        heading: "Decision framework",
        body:
          "Use tax-efficient accounts first, then optimize costs, then stay consistent. The order matters more than finding perfect products."
      }
    ]
  },
  {
    slug: "story-from-texas-to-bengaluru",
    title: "Story: Texas W2 to Bengaluru Reset",
    excerpt:
      "A relatable cross-border wealth story focused on process, not status spending.",
    audience: "US",
    readTime: "4 min read",
    sections: [
      {
        heading: "The starting point",
        body:
          "An Indian-origin engineer in Texas maximized 401(k), used a broad US index allocation, and avoided frequent strategy changes during bull markets."
      },
      {
        heading: "The shift",
        body:
          "After building a strong corpus, the family relocated to Bengaluru. They prioritized withdrawal planning, rupee budgeting, and a lower lifestyle burn rate."
      },
      {
        heading: "Lesson",
        body:
          "The same discipline worked in both countries: automate investing, keep costs low, and define withdrawal rules before emotions take over."
      }
    ]
  },
  {
    slug: "story-mumbai-dual-income-indexing",
    title: "Story: Mumbai Dual-Income, No Hype",
    excerpt:
      "How a couple built confidence through budgeting and index SIPs instead of trend chasing.",
    audience: "India",
    readTime: "4 min read",
    sections: [
      {
        heading: "The starting point",
        body:
          "A Mumbai couple with stable jobs tracked expenses for 3 months and found leakage in subscriptions, food delivery, and impulsive shopping."
      },
      {
        heading: "The plan",
        body:
          "They moved to a needs-wants-savings structure, increased SIPs every appraisal cycle, and kept a written rule to avoid changing funds often."
      },
      {
        heading: "Lesson",
        body:
          "Quiet consistency beat perfect timing. Their wealth grew because their process got simpler each year."
      }
    ]
  }
];

export const getLearnArticle = (slug: string): LearnArticle | undefined =>
  LEARN_ARTICLES.find((article) => article.slug === slug);
