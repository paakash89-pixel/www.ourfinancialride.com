export interface KitMetricRow {
  metric: string;
  inrValue: number;
  usdValue: number;
  note: string;
}

export interface KitFormula {
  label: string;
  formula: string;
  meaning: string;
}

export interface BlueprintKitDetail {
  slug: string;
  chartTitle: string;
  chartLabels: string[];
  chartInr: number[];
  chartUsd: number[];
  diagramSteps: string[];
  metrics: KitMetricRow[];
  formulas: KitFormula[];
}

const qLabels = ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6"];

export const familyExamples = {
  inr: {
    household: "Family of four (India)",
    annualIncome: 4800000,
    annualInvesting: 1440000,
    savingsRatePct: 30,
    currentPortfolio: 7500000
  },
  usd: {
    household: "Family of four (US)",
    annualIncome: 150000,
    annualInvesting: 45000,
    savingsRatePct: 30,
    currentPortfolio: 250000
  }
};

export const blueprintKitDetails: BlueprintKitDetail[] = [
  {
    slug: "vision-alignment-kit",
    chartTitle: "Family Alignment Score",
    chartLabels: qLabels,
    chartInr: [52, 58, 63, 71, 78, 84],
    chartUsd: [55, 61, 67, 73, 79, 86],
    diagramSteps: [
      "Shared 10-year vision",
      "Define non-negotiables",
      "Write decision rules",
      "Review quarterly as a couple"
    ],
    metrics: [
      {
        metric: "Annual household income",
        inrValue: 4500000,
        usdValue: 180000,
        note: "Core target band household"
      },
      {
        metric: "Annual investing",
        inrValue: 1350000,
        usdValue: 54000,
        note: "30% discipline baseline"
      },
      {
        metric: "Current portfolio",
        inrValue: 7500000,
        usdValue: 250000,
        note: "Starting point for FI tracking"
      },
      {
        metric: "Savings rate %",
        inrValue: 30,
        usdValue: 30,
        note: "Protection threshold"
      }
    ],
    formulas: [
      {
        label: "Savings Rate",
        formula: "=Annual_Investing/Annual_Income",
        meaning: "Tracks discipline through income changes."
      },
      {
        label: "FI Progress %",
        formula: "=Current_Portfolio/FI_Number",
        meaning: "Shows distance to work-optional target."
      },
      {
        label: "Monthly Freedom Gap",
        formula: "=(FI_Number-Current_Portfolio)/(Years_Remaining*12)",
        meaning: "Defines required monthly investing delta."
      }
    ]
  },
  {
    slug: "cashflow-autopilot-kit",
    chartTitle: "Automation Coverage %",
    chartLabels: qLabels,
    chartInr: [46, 58, 69, 78, 86, 92],
    chartUsd: [49, 61, 72, 81, 88, 93],
    diagramSteps: [
      "Income landing account",
      "Auto-transfer to investments",
      "Bills + fixed costs",
      "Joy spending cap + review"
    ],
    metrics: [
      {
        metric: "Monthly income",
        inrValue: 375000,
        usdValue: 15000,
        note: "Household inflow"
      },
      {
        metric: "Monthly investing auto-transfer",
        inrValue: 112500,
        usdValue: 4500,
        note: "30% first transfer"
      },
      {
        metric: "Monthly fixed costs",
        inrValue: 120000,
        usdValue: 4000,
        note: "Cap fixed-cost creep"
      },
      {
        metric: "Monthly variable joy",
        inrValue: 40000,
        usdValue: 1200,
        note: "Joy without fixed-cost lock-in"
      }
    ],
    formulas: [
      {
        label: "Autopilot Ratio",
        formula: "=Auto_Transfers/Monthly_Income",
        meaning: "Measures how much is automated before spending."
      },
      {
        label: "Fixed Cost Ratio",
        formula: "=Monthly_Fixed_Costs/Monthly_Income",
        meaning: "Keeps fixed costs below risk thresholds."
      },
      {
        label: "Leftover Drift",
        formula: "=Monthly_Income-(Investing+Bills+Joy+Other)",
        meaning: "Captures leakage to close each month."
      }
    ]
  },
  {
    slug: "emergency-and-risk-checklist",
    chartTitle: "Emergency Runway (Months)",
    chartLabels: qLabels,
    chartInr: [4, 6, 7, 9, 10, 12],
    chartUsd: [3, 5, 7, 8, 10, 12],
    diagramSteps: [
      "Essential expense baseline",
      "Build 12-month runway",
      "Audit insurance coverage",
      "Store claim documents"
    ],
    metrics: [
      {
        metric: "Monthly essential spend",
        inrValue: 140000,
        usdValue: 4800,
        note: "Used for runway math"
      },
      {
        metric: "Target emergency corpus",
        inrValue: 1680000,
        usdValue: 57600,
        note: "12-month safety target"
      },
      {
        metric: "Current emergency corpus",
        inrValue: 980000,
        usdValue: 28000,
        note: "Current liquidity"
      },
      {
        metric: "Risk cover score",
        inrValue: 72,
        usdValue: 75,
        note: "Policy + coverage completeness"
      }
    ],
    formulas: [
      {
        label: "Runway Months",
        formula: "=Emergency_Corpus/Monthly_Essential_Spend",
        meaning: "Primary resilience metric."
      },
      {
        label: "Coverage Gap",
        formula: "=Target_Emergency_Corpus-Current_Corpus",
        meaning: "Amount to close for full runway."
      },
      {
        label: "Monthly Safety Contribution",
        formula: "=Coverage_Gap/Months_to_Target",
        meaning: "Required transfer per month."
      }
    ]
  },
  {
    slug: "tax-efficiency-planner",
    chartTitle: "Tax-Efficient Contribution Completion %",
    chartLabels: qLabels,
    chartInr: [38, 49, 63, 74, 84, 92],
    chartUsd: [41, 53, 66, 77, 86, 94],
    diagramSteps: [
      "Priority contribution ladder",
      "Automate account sequence",
      "Track yearly limits",
      "Rebalance with tax drag in mind"
    ],
    metrics: [
      {
        metric: "Annual investing target",
        inrValue: 1350000,
        usdValue: 54000,
        note: "Total long-term investing"
      },
      {
        metric: "Tax-efficient allocation",
        inrValue: 950000,
        usdValue: 42000,
        note: "Higher priority buckets first"
      },
      {
        metric: "Tax drag estimate",
        inrValue: 85000,
        usdValue: 2100,
        note: "Potential annual drag without sequencing"
      },
      {
        metric: "Tax drag after optimization",
        inrValue: 52000,
        usdValue: 1300,
        note: "Modeled after contribution order cleanup"
      }
    ],
    formulas: [
      {
        label: "Tax Drag %",
        formula: "=(Taxes_on_Gains/Portfolio_Value)",
        meaning: "Approximates annual tax leakage."
      },
      {
        label: "Priority Completion %",
        formula: "=Priority_Accounts_Funded/Priority_Target",
        meaning: "Checks if high-impact buckets are complete."
      },
      {
        label: "Tax Savings",
        formula: "=Tax_Drag_Before-Tax_Drag_After",
        meaning: "Estimated benefit of sequencing."
      }
    ]
  },
  {
    slug: "index-policy-builder",
    chartTitle: "Policy Compliance %",
    chartLabels: qLabels,
    chartInr: [44, 57, 66, 74, 82, 90],
    chartUsd: [47, 60, 69, 76, 84, 91],
    diagramSteps: [
      "Set allocation bands",
      "Define rebalance triggers",
      "Document buy rules",
      "Execute quarterly review script"
    ],
    metrics: [
      {
        metric: "Target equity allocation %",
        inrValue: 75,
        usdValue: 80,
        note: "Growth engine"
      },
      {
        metric: "Target debt/cash allocation %",
        inrValue: 25,
        usdValue: 20,
        note: "Stability bucket"
      },
      {
        metric: "Current drift from policy %",
        inrValue: 6,
        usdValue: 5,
        note: "Distance from IPS bands"
      },
      {
        metric: "Quarterly compliance score",
        inrValue: 84,
        usdValue: 86,
        note: "Behavior consistency indicator"
      }
    ],
    formulas: [
      {
        label: "Allocation Drift %",
        formula: "=ABS(Current_Weight-Target_Weight)",
        meaning: "Signals rebalance need."
      },
      {
        label: "Rebalance Trigger",
        formula: "=IF(Drift>Band,\"REBALANCE\",\"HOLD\")",
        meaning: "Converts policy into action."
      },
      {
        label: "Compliance Score",
        formula: "=(Rules_Followed/Rules_Total)*100",
        meaning: "Tracks discipline, not returns."
      }
    ]
  },
  {
    slug: "global-allocation-planner",
    chartTitle: "Global Allocation Readiness",
    chartLabels: qLabels,
    chartInr: [42, 54, 62, 71, 80, 88],
    chartUsd: [46, 58, 66, 75, 83, 90],
    diagramSteps: [
      "Map spending currency needs",
      "Set geographic allocation ranges",
      "Track FX exposure",
      "Review annually"
    ],
    metrics: [
      {
        metric: "Domestic equity %",
        inrValue: 55,
        usdValue: 35,
        note: "Home market anchor"
      },
      {
        metric: "International equity %",
        inrValue: 35,
        usdValue: 55,
        note: "Global diversification"
      },
      {
        metric: "Debt/cash %",
        inrValue: 10,
        usdValue: 10,
        note: "Buffer bucket"
      },
      {
        metric: "Currency mismatch score",
        inrValue: 78,
        usdValue: 82,
        note: "How aligned holdings are to spending currency"
      }
    ],
    formulas: [
      {
        label: "FX Exposure %",
        formula: "=Foreign_Assets/Total_Portfolio",
        meaning: "Shows currency diversification."
      },
      {
        label: "Home Bias %",
        formula: "=Home_Equity/Total_Equity",
        meaning: "Checks overconcentration."
      },
      {
        label: "Diversification Score",
        formula: "=100-ABS(Target_FX-Actual_FX)*2",
        meaning: "Simple score for allocation fit."
      }
    ]
  },
  {
    slug: "withdrawal-guardrails-model",
    chartTitle: "Guardrail Stability Score",
    chartLabels: qLabels,
    chartInr: [58, 62, 68, 74, 81, 87],
    chartUsd: [61, 66, 71, 78, 84, 90],
    diagramSteps: [
      "Set baseline withdrawal %",
      "Model inflation step-up",
      "Define guardrail triggers",
      "Adjust spending bands in downturns"
    ],
    metrics: [
      {
        metric: "Starting portfolio",
        inrValue: 75000000,
        usdValue: 1800000,
        note: "Retirement corpus scenario"
      },
      {
        metric: "Year-1 withdrawal",
        inrValue: 2250000,
        usdValue: 72000,
        note: "3% withdrawal baseline"
      },
      {
        metric: "Inflation assumption %",
        inrValue: 5,
        usdValue: 3,
        note: "Annual step-up used in model"
      },
      {
        metric: "Guardrail threshold %",
        inrValue: 20,
        usdValue: 20,
        note: "Spend cut trigger from peak"
      }
    ],
    formulas: [
      {
        label: "Withdrawal Rate %",
        formula: "=Annual_Withdrawal/Starting_Portfolio",
        meaning: "Core sustainability input."
      },
      {
        label: "Inflation Adjusted Withdrawal",
        formula: "=Prior_Year_Withdrawal*(1+Inflation)",
        meaning: "Models spending power preservation."
      },
      {
        label: "Guardrail Trigger",
        formula: "=IF(Drawdown>=20%,\"Activate spend cut\",\"No action\")",
        meaning: "Behavior rule during stress."
      }
    ]
  },
  {
    slug: "buy-vs-rent-model",
    chartTitle: "10-Year Net Cost (Lower is Better)",
    chartLabels: qLabels,
    chartInr: [122, 118, 113, 109, 104, 99],
    chartUsd: [118, 114, 110, 107, 102, 97],
    diagramSteps: [
      "Estimate full ownership cost",
      "Estimate rent + invest difference",
      "Run 10-year scenarios",
      "Decide using math, not social pressure"
    ],
    metrics: [
      {
        metric: "Monthly housing spend cap",
        inrValue: 90000,
        usdValue: 3200,
        note: "Keeps savings rate protected"
      },
      {
        metric: "10-year buy cost",
        inrValue: 17200000,
        usdValue: 530000,
        note: "All-in ownership estimate"
      },
      {
        metric: "10-year rent cost",
        inrValue: 11800000,
        usdValue: 390000,
        note: "Rent path estimate"
      },
      {
        metric: "Investable difference",
        inrValue: 5400000,
        usdValue: 140000,
        note: "Opportunity capital"
      }
    ],
    formulas: [
      {
        label: "All-in Buy Cost",
        formula: "=EMI+Maintenance+Taxes+Insurance+Opportunity_Cost",
        meaning: "Captures true ownership cost."
      },
      {
        label: "Rent-and-Invest Value",
        formula: "=FV(Monthly_Invest_Diff,Expected_Return,Years)",
        meaning: "Compounding of rent path surplus."
      },
      {
        label: "Decision Margin",
        formula: "=Rent_Invest_Value-Buy_Equity_Value",
        meaning: "Positive favors rent path."
      }
    ]
  },
  {
    slug: "education-funding-planner",
    chartTitle: "Education Goal Funding %",
    chartLabels: qLabels,
    chartInr: [35, 44, 55, 67, 79, 90],
    chartUsd: [39, 48, 60, 71, 82, 92],
    diagramSteps: [
      "Define education goal year",
      "Estimate inflation-adjusted target",
      "Set automated monthly contribution",
      "Review annually"
    ],
    metrics: [
      {
        metric: "Goal amount (future value)",
        inrValue: 6500000,
        usdValue: 220000,
        note: "Primary education target"
      },
      {
        metric: "Current goal corpus",
        inrValue: 2100000,
        usdValue: 70000,
        note: "Current balance"
      },
      {
        metric: "Monthly contribution needed",
        inrValue: 32000,
        usdValue: 1050,
        note: "Required pace to hit target"
      },
      {
        metric: "Funding probability score",
        inrValue: 81,
        usdValue: 84,
        note: "Progress confidence indicator"
      }
    ],
    formulas: [
      {
        label: "Future Goal Value",
        formula: "=Present_Goal*(1+Education_Inflation)^Years",
        meaning: "Inflation-adjusted target amount."
      },
      {
        label: "Funding Gap",
        formula: "=Future_Goal-Current_Corpus",
        meaning: "Amount still to fund."
      },
      {
        label: "Required Monthly Contribution",
        formula: "=PMT(Expected_Return/12,Months_Left,0,-Funding_Gap)",
        meaning: "Monthly transfer needed."
      }
    ]
  },
  {
    slug: "behavior-discipline-system",
    chartTitle: "Behavior Discipline Score",
    chartLabels: qLabels,
    chartInr: [49, 58, 66, 75, 83, 91],
    chartUsd: [52, 61, 69, 78, 86, 93],
    diagramSteps: [
      "Identify emotional triggers",
      "Define pre-committed actions",
      "Use 48-hour decision buffer",
      "Review outcomes quarterly"
    ],
    metrics: [
      {
        metric: "Panic trades avoided",
        inrValue: 4,
        usdValue: 5,
        note: "Events where policy prevented mistakes"
      },
      {
        metric: "Quarterly reviews completed",
        inrValue: 4,
        usdValue: 4,
        note: "Out of 4 quarters"
      },
      {
        metric: "Policy adherence %",
        inrValue: 88,
        usdValue: 90,
        note: "Checklist completion"
      },
      {
        metric: "Behavior risk score",
        inrValue: 24,
        usdValue: 21,
        note: "Lower is better"
      }
    ],
    formulas: [
      {
        label: "Policy Adherence %",
        formula: "=Actions_Followed/Actions_Planned",
        meaning: "Measures execution quality."
      },
      {
        label: "Behavior Risk Score",
        formula: "=100-Policy_Adherence%",
        meaning: "Simple behavior risk proxy."
      },
      {
        label: "Quarterly Consistency",
        formula: "=Completed_Reviews/4",
        meaning: "Protects long-term discipline."
      }
    ]
  },
  {
    slug: "work-optional-design-canvas",
    chartTitle: "Work Optional Readiness %",
    chartLabels: qLabels,
    chartInr: [34, 45, 58, 67, 77, 86],
    chartUsd: [37, 49, 61, 71, 80, 88],
    diagramSteps: [
      "Define ideal weekly schedule",
      "Map essential vs optional income",
      "Set transition milestones",
      "Run annual life design review"
    ],
    metrics: [
      {
        metric: "Required annual spend",
        inrValue: 2200000,
        usdValue: 78000,
        note: "Work-optional baseline budget"
      },
      {
        metric: "Projected passive cashflow",
        inrValue: 1500000,
        usdValue: 52000,
        note: "Current passive trajectory"
      },
      {
        metric: "Optional work income target",
        inrValue: 700000,
        usdValue: 26000,
        note: "Gap for transition period"
      },
      {
        metric: "Time freedom score",
        inrValue: 79,
        usdValue: 82,
        note: "Lifestyle optionality indicator"
      }
    ],
    formulas: [
      {
        label: "Coverage Ratio",
        formula: "=Passive_Cashflow/Required_Annual_Spend",
        meaning: "Shows work-optional readiness."
      },
      {
        label: "Optional Work Gap",
        formula: "=Required_Annual_Spend-Passive_Cashflow",
        meaning: "Income needed from optional work."
      },
      {
        label: "Time Freedom Index",
        formula: "=(Automation_Score+Coverage_Ratio*100)/2",
        meaning: "Blend of systems and funding."
      }
    ]
  },
  {
    slug: "annual-review-and-decade-plan",
    chartTitle: "10-Year Plan Confidence Score",
    chartLabels: qLabels,
    chartInr: [51, 60, 68, 76, 84, 92],
    chartUsd: [54, 63, 71, 79, 87, 94],
    diagramSteps: [
      "Review prior year outcomes",
      "Update assumptions conservatively",
      "Reset 10-year milestones",
      "Publish next-year action plan"
    ],
    metrics: [
      {
        metric: "Annual savings rate target %",
        inrValue: 30,
        usdValue: 30,
        note: "Minimum system threshold"
      },
      {
        metric: "10-year target portfolio",
        inrValue: 68000000,
        usdValue: 2300000,
        note: "Modeled at conservative assumptions"
      },
      {
        metric: "Current projected portfolio",
        inrValue: 62000000,
        usdValue: 2100000,
        note: "Current trajectory"
      },
      {
        metric: "Plan confidence score",
        inrValue: 88,
        usdValue: 90,
        note: "Confidence under conservative returns"
      }
    ],
    formulas: [
      {
        label: "Projection Gap",
        formula: "=Target_Portfolio-Projected_Portfolio",
        meaning: "Distance from decade goal."
      },
      {
        label: "Required Annual Increase",
        formula: "=Projection_Gap/Years_Remaining",
        meaning: "Annual improvement needed."
      },
      {
        label: "Confidence Score",
        formula: "=IF(Projection_Gap<=0,95,MAX(55,95-Projection_Gap/1000000))",
        meaning: "Simple confidence proxy."
      }
    ]
  }
];

export const getBlueprintKitDetail = (slug: string): BlueprintKitDetail | null =>
  blueprintKitDetails.find((item) => item.slug === slug) ?? null;
