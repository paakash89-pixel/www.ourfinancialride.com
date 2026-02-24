/* eslint-disable no-console */
const path = require("path");
const ExcelJS = require("exceljs");

const OUTPUT_FILE = path.resolve(
  process.cwd(),
  "content",
  "blueprint-kits",
  "ofr-blueprint-us-master.xlsx"
);

const currencyFmt = "$#,##0";
const pctFmt = "0.0%";
const financialOrderRows = [
  [
    1,
    "Cover highest deductible and core protection",
    "Keep deductible cash and verify health, life, and disability coverage.",
    "Set aside deductible + protection buffer",
    "Keep deductible cash and verify health cover, top-up, and term insurance.",
    "Q1",
    "Q1 Emergency and Risk Checklist"
  ],
  [
    2,
    "Capture full employer match",
    "Contribute enough to secure all available 401(k)/403(b)/TSP match dollars.",
    "Capture employer retirement benefits",
    "Secure EPF and employer retirement benefits where applicable.",
    "Q1",
    "Q1 Cashflow Autopilot + Q2 Tax Efficiency"
  ],
  [
    3,
    "Eliminate high-interest debt",
    "Prioritize credit card and high-APR balances before discretionary investing.",
    "Clear high-interest debt first",
    "Prioritize credit card and personal-loan liabilities.",
    "Q1",
    "Q1 Cashflow Autopilot"
  ],
  [
    4,
    "Build emergency reserves",
    "Target 3-6 months of essentials (6-12 months if income is variable).",
    "Build emergency fund runway",
    "Target 6-12 months of essential expenses.",
    "Q1",
    "Q1 Emergency and Risk Checklist"
  ],
  [
    5,
    "Fill tax-advantaged buckets first",
    "Prioritize Roth IRA, HSA, and eligible backdoor paths before taxable investing.",
    "Use tax-efficient buckets in order",
    "Prioritize EPF/VPF, PPF, NPS, and ELSS before taxable investing.",
    "Q2",
    "Q2 Tax Efficiency Planner"
  ],
  [
    6,
    "Max retirement account contributions",
    "Increase payroll contributions toward annual retirement limits.",
    "Max retirement contributions",
    "Raise automated retirement contributions across core buckets.",
    "Q2",
    "Q2 Tax Efficiency + Q2 Index Policy"
  ],
  [
    7,
    "Reach 25%+ gross savings and investing",
    "Automate contributions before lifestyle spending.",
    "Protect 25%+ savings and investing rate",
    "Automate first and control fixed-cost creep.",
    "Q2",
    "Q1 Cashflow + Q2 Index Policy"
  ],
  [
    8,
    "Pre-fund major near-term goals",
    "Create buckets for down payment, kids, and planned transitions.",
    "Pre-fund major goals",
    "Create buckets for home down payment, child education, and family goals.",
    "Q3",
    "Q3 Buy vs Rent + Q3 Education Funding"
  ],
  [
    9,
    "Build flexible taxable wealth + optional debt paydown",
    "Direct surplus to low-cost index investing and selective low-rate debt reduction.",
    "Build optional corpus + selective debt reduction",
    "Direct surplus to diversified index/debt funds and strategic home-loan prepayment.",
    "Q4",
    "Q3 Withdrawal Guardrails + Q4 Annual Review"
  ]
];

function styleHeader(row) {
  row.font = { bold: true, color: { argb: "FF1F2A37" } };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE8EEF6" }
  };
  row.alignment = { vertical: "middle" };
}

function setCurrency(cell) {
  cell.numFmt = currencyFmt;
}

function setPercent(cell) {
  cell.numFmt = pctFmt;
}

async function generateWorkbook() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "OFR";
  workbook.lastModifiedBy = "OFR";
  workbook.created = new Date();
  workbook.modified = new Date();

  const inputs = workbook.addWorksheet("00_Inputs");
  inputs.columns = [
    { header: "Input", key: "label", width: 44 },
    { header: "Value", key: "value", width: 20 },
    { header: "Notes", key: "notes", width: 44 }
  ];
  styleHeader(inputs.getRow(1));
  inputs.addRows([
    ["Household income (annual)", 150000, "US family of four example"],
    ["Savings rate", 0.3, "Discipline target"],
    ["Annual investing", { formula: "B2*B3" }, "Auto-calculated"],
    ["Current portfolio", 250000, "Starting investments"],
    ["Annual expenses (FI target)", 90000, "Required annual spend"],
    ["FI withdrawal rate", 0.04, "Conservative default"],
    ["FI number", { formula: "B6/B7" }, "Target portfolio"],
    ["Expected nominal return", 0.075, "Long-run conservative assumption"],
    ["Inflation", 0.03, "Long-run assumption"],
    ["Real return", { formula: "(1+B9)/(1+B10)-1" }, "Inflation adjusted"],
    ["Years modeled", 20, "Planning horizon"],
    ["Starting withdrawal (annual)", 90000, "Initial retirement draw"],
    ["Housing: annual ownership cost", 36000, "Mortgage+tax+insurance+maint"],
    ["Housing: annual rent cost", 30000, "Rent + renter insurance"]
  ]);
  [2, 4, 5, 6, 8, 12, 13, 14].forEach((row) => setCurrency(inputs.getCell(`B${row}`)));
  [3, 7, 9, 10].forEach((row) => setPercent(inputs.getCell(`B${row}`)));
  setPercent(inputs.getCell("B11"));
  inputs.views = [{ state: "frozen", ySplit: 1 }];

  const cashflow = workbook.addWorksheet("01_Cashflow");
  cashflow.columns = [
    { header: "Category", key: "category", width: 36 },
    { header: "Annual", key: "annual", width: 18 },
    { header: "Monthly", key: "monthly", width: 18 },
    { header: "Ratio", key: "ratio", width: 14 },
    { header: "Notes", key: "notes", width: 34 }
  ];
  styleHeader(cashflow.getRow(1));
  cashflow.addRows([
    ["Income", { formula: "'00_Inputs'!B2" }, { formula: "B2/12" }, 1, "From inputs"],
    ["Investing", { formula: "'00_Inputs'!B4" }, { formula: "B3/12" }, { formula: "B3/B2" }, "Auto transfer"],
    ["Needs (fixed)", { formula: "B2*0.42" }, { formula: "B4/12" }, { formula: "B4/B2" }, "Mortgage, utilities, insurance"],
    ["Wants (joy)", { formula: "B2*0.18" }, { formula: "B5/12" }, { formula: "B5/B2" }, "Travel, dining, experiences"],
    ["Other", { formula: "B2-B3-B4-B5" }, { formula: "B6/12" }, { formula: "B6/B2" }, "Buffer + irregular spend"],
    ["Savings + investing rate", { formula: "B3/B2" }, "", { formula: "B3/B2" }, "Keep at or above 25%"]
  ]);
  [2, 3, 4, 5, 6].forEach((r) => {
    setCurrency(cashflow.getCell(`B${r}`));
    setCurrency(cashflow.getCell(`C${r}`));
  });
  [2, 3, 4, 5, 6, 7].forEach((r) => setPercent(cashflow.getCell(`D${r}`)));
  setPercent(cashflow.getCell("B7"));

  const fi = workbook.addWorksheet("02_FI_Tracker");
  fi.columns = [
    { header: "Year", key: "year", width: 10 },
    { header: "Starting Portfolio", key: "start", width: 20 },
    { header: "Contribution", key: "contrib", width: 16 },
    { header: "Growth", key: "growth", width: 16 },
    { header: "Ending Portfolio", key: "end", width: 20 },
    { header: "FI Number", key: "fi", width: 18 },
    { header: "FI Progress %", key: "progress", width: 16 }
  ];
  styleHeader(fi.getRow(1));
  fi.addRow([0, { formula: "'00_Inputs'!B5" }, { formula: "'00_Inputs'!B4" }, 0, { formula: "B2+C2+D2" }, { formula: "'00_Inputs'!B8" }, { formula: "E2/F2" }]);
  for (let r = 3; r <= 23; r += 1) {
    fi.addRow([
      { formula: `A${r - 1}+1` },
      { formula: `E${r - 1}` },
      { formula: `'00_Inputs'!B4` },
      { formula: `B${r}*'00_Inputs'!B9` },
      { formula: `B${r}+C${r}+D${r}` },
      { formula: `'00_Inputs'!B8` },
      { formula: `E${r}/F${r}` }
    ]);
  }
  for (let r = 2; r <= 23; r += 1) {
    ["B", "C", "D", "E", "F"].forEach((c) => setCurrency(fi.getCell(`${c}${r}`)));
    setPercent(fi.getCell(`G${r}`));
  }
  fi.views = [{ state: "frozen", ySplit: 1 }];

  const compound = workbook.addWorksheet("03_Compound_Path");
  compound.columns = [
    { header: "Year", key: "year", width: 10 },
    { header: "Starting Corpus", key: "start", width: 20 },
    { header: "Annual Contribution", key: "contrib", width: 20 },
    { header: "Growth", key: "growth", width: 16 },
    { header: "Ending Corpus", key: "end", width: 20 },
    { header: "Real Corpus", key: "real", width: 20 }
  ];
  styleHeader(compound.getRow(1));
  compound.addRow([0, { formula: "'00_Inputs'!B5" }, { formula: "'00_Inputs'!B4" }, 0, { formula: "B2+C2+D2" }, { formula: "E2" }]);
  for (let r = 3; r <= 23; r += 1) {
    compound.addRow([
      { formula: `A${r - 1}+1` },
      { formula: `E${r - 1}` },
      { formula: `'00_Inputs'!B4` },
      { formula: `B${r}*'00_Inputs'!B9` },
      { formula: `B${r}+C${r}+D${r}` },
      { formula: `E${r}/((1+'00_Inputs'!B10)^A${r})` }
    ]);
  }
  for (let r = 2; r <= 23; r += 1) {
    ["B", "C", "D", "E", "F"].forEach((c) => setCurrency(compound.getCell(`${c}${r}`)));
  }

  const withdrawal = workbook.addWorksheet("04_Withdrawal");
  withdrawal.columns = [
    { header: "Year", key: "year", width: 10 },
    { header: "Starting Portfolio", key: "start", width: 20 },
    { header: "Withdrawal", key: "withdrawal", width: 16 },
    { header: "Growth", key: "growth", width: 16 },
    { header: "Ending Portfolio", key: "end", width: 20 },
    { header: "Sustainable?", key: "sustainable", width: 16 }
  ];
  styleHeader(withdrawal.getRow(1));
  withdrawal.addRow([0, { formula: "'02_FI_Tracker'!E23" }, { formula: "'00_Inputs'!B13" }, 0, { formula: "B2-C2+D2" }, { formula: "IF(E2>0,\"Yes\",\"No\")" }]);
  for (let r = 3; r <= 33; r += 1) {
    withdrawal.addRow([
      { formula: `A${r - 1}+1` },
      { formula: `E${r - 1}` },
      { formula: `C${r - 1}*(1+'00_Inputs'!B10)` },
      { formula: `B${r}*'00_Inputs'!B9` },
      { formula: `B${r}-C${r}+D${r}` },
      { formula: `IF(E${r}>0,"Yes","No")` }
    ]);
  }
  for (let r = 2; r <= 33; r += 1) {
    ["B", "C", "D", "E"].forEach((c) => setCurrency(withdrawal.getCell(`${c}${r}`)));
  }

  const allocation = workbook.addWorksheet("05_Allocation");
  allocation.columns = [
    { header: "Bucket", key: "bucket", width: 26 },
    { header: "Target %", key: "target", width: 12 },
    { header: "Current %", key: "current", width: 12 },
    { header: "Drift %", key: "drift", width: 12 },
    { header: "Action", key: "action", width: 22 }
  ];
  styleHeader(allocation.getRow(1));
  allocation.addRows([
    ["US Total Stock", 0.55, 0.58, { formula: "C2-B2" }, { formula: "IF(ABS(D2)>0.03,\"Rebalance\",\"Hold\")" }],
    ["US Total Bond", 0.25, 0.22, { formula: "C3-B3" }, { formula: "IF(ABS(D3)>0.03,\"Rebalance\",\"Hold\")" }],
    ["International Stock", 0.20, 0.20, { formula: "C4-B4" }, { formula: "IF(ABS(D4)>0.03,\"Rebalance\",\"Hold\")" }],
    ["Portfolio Value", { formula: "'02_FI_Tracker'!E23" }, "", "", "Auto-linked from FI tracker"]
  ]);
  [2, 3, 4].forEach((r) => {
    setPercent(allocation.getCell(`B${r}`));
    setPercent(allocation.getCell(`C${r}`));
    setPercent(allocation.getCell(`D${r}`));
  });
  setCurrency(allocation.getCell("B5"));

  const housing = workbook.addWorksheet("06_Housing_Model");
  housing.columns = [
    { header: "Metric", key: "metric", width: 34 },
    { header: "Own", key: "own", width: 18 },
    { header: "Rent", key: "rent", width: 18 },
    { header: "Difference", key: "diff", width: 18 }
  ];
  styleHeader(housing.getRow(1));
  housing.addRows([
    ["Annual housing cost", { formula: "'00_Inputs'!B14" }, { formula: "'00_Inputs'!B15" }, { formula: "B2-C2" }],
    ["10-year nominal cost", { formula: "B2*10" }, { formula: "C2*10" }, { formula: "B3-C3" }],
    ["10-year invested difference", { formula: "0" }, { formula: "D2*(((1+'00_Inputs'!B9)^10-1)/'00_Inputs'!B9)" }, { formula: "C4-B4" }]
  ]);
  [2, 3, 4].forEach((r) => {
    setCurrency(housing.getCell(`B${r}`));
    setCurrency(housing.getCell(`C${r}`));
    setCurrency(housing.getCell(`D${r}`));
  });

  const review = workbook.addWorksheet("07_Quarterly_Review");
  review.columns = [
    { header: "Quarter", key: "quarter", width: 10 },
    { header: "Savings Rate", key: "savings", width: 16 },
    { header: "Policy Compliance", key: "policy", width: 18 },
    { header: "Net Worth Growth", key: "growth", width: 18 },
    { header: "Review Score", key: "score", width: 14 },
    { header: "Action", key: "action", width: 34 }
  ];
  styleHeader(review.getRow(1));
  ["Q1", "Q2", "Q3", "Q4"].forEach((q, i) => {
    const row = i + 2;
    review.addRow([
      q,
      0.3,
      0.85,
      0.1,
      { formula: `AVERAGE(B${row}:D${row})` },
      "One improvement action for next quarter"
    ]);
    setPercent(review.getCell(`B${row}`));
    setPercent(review.getCell(`C${row}`));
    setPercent(review.getCell(`D${row}`));
    setPercent(review.getCell(`E${row}`));
  });

  const dashboard = workbook.addWorksheet("08_Dashboard");
  dashboard.columns = [
    { header: "Key Metric", key: "metric", width: 34 },
    { header: "Value", key: "value", width: 24 },
    { header: "Source", key: "source", width: 32 }
  ];
  styleHeader(dashboard.getRow(1));
  dashboard.addRows([
    ["FI Number", { formula: "'00_Inputs'!B8" }, "Inputs"],
    ["Current Portfolio (Year 20)", { formula: "'02_FI_Tracker'!E23" }, "FI Tracker"],
    ["FI Progress", { formula: "'02_FI_Tracker'!G23" }, "FI Tracker"],
    ["Real Portfolio (Year 20)", { formula: "'03_Compound_Path'!F23" }, "Compound Path"],
    ["Withdrawal Sustainable at Year 30", { formula: "'04_Withdrawal'!F33" }, "Withdrawal"],
    ["Allocation Rebalances Needed", { formula: "COUNTIF('05_Allocation'!E2:E4,\"Rebalance\")" }, "Allocation"],
    ["Quarterly Review Average", { formula: "AVERAGE('07_Quarterly_Review'!E2:E5)" }, "Quarterly Review"]
  ]);
  [2, 3, 5].forEach((r) => setCurrency(dashboard.getCell(`B${r}`)));
  [4, 8].forEach((r) => setPercent(dashboard.getCell(`B${r}`)));
  dashboard.getCell("B6").numFmt = "@";
  dashboard.getCell("B7").numFmt = "0";

  const outcomeMap = workbook.addWorksheet("09_Wealth_Priority_Outcomes");
  outcomeMap.columns = [
    { header: "Quarter", key: "quarter", width: 12 },
    { header: "Focus", key: "topic", width: 34 },
    { header: "Teaching Order", key: "order", width: 56 },
    { header: "Primary Outcome", key: "outcome", width: 54 },
    { header: "Kit Bundle", key: "bundle", width: 44 },
    { header: "Action To Take", key: "action", width: 40 }
  ];
  styleHeader(outcomeMap.getRow(1));
  outcomeMap.addRows([
    [
      "Q1",
      "Foundation and downside protection",
      "1) Protection buffer  2) Employer benefits  3) High-interest debt  4) Emergency runway",
      "Vision, cashflow, and risk systems are active and documented.",
      "Vision Alignment Kit • Cashflow Autopilot Kit • Emergency and Risk Checklist",
      "Lock transfers, finalize family rules, and close safety gaps."
    ],
    [
      "Q2",
      "Tax-efficient compounding system",
      "1) Tax-efficient bucket order  2) Max retirement contributions  3) Protect 25%+ savings rate",
      "Tax drag is reduced and policy-based investing is running.",
      "Tax Efficiency Planner • Index Policy Builder • Global Allocation Planner",
      "Set annual contribution plan and rebalance rules."
    ],
    [
      "Q3",
      "Decision modeling and resilience",
      "1) Pre-fund major goals  2) Run key decision models",
      "Withdrawal guardrails and major-decision models are in place.",
      "Withdrawal Guardrails Model • Buy vs Rent Model • Education Funding Planner",
      "Model upcoming decisions before committing."
    ],
    [
      "Q4",
      "Optionality and long-range execution",
      "1) Build optional corpus  2) Selective debt reduction  3) Quarterly review reset",
      "Behavior systems are stable and the next-year roadmap is clear.",
      "Behavior Discipline System • Work Optional Design Canvas • Annual Review and Decade Plan",
      "Publish the next-year plan and review calendar."
    ]
  ]);
  outcomeMap.views = [{ state: "frozen", ySplit: 1 }];

  const financialOrder = workbook.addWorksheet("10_Wealth_Priority_Order");
  financialOrder.columns = [
    { header: "Step", key: "step", width: 8 },
    { header: "US Priority", key: "usPriority", width: 34 },
    { header: "US Action", key: "usAction", width: 44 },
    { header: "India Priority", key: "inPriority", width: 34 },
    { header: "India Action", key: "inAction", width: 44 },
    { header: "Priority Quarter", key: "quarter", width: 16 },
    { header: "Kit Tie-In", key: "kit", width: 42 }
  ];
  styleHeader(financialOrder.getRow(1));
  financialOrder.addRows(financialOrderRows);
  financialOrder.views = [{ state: "frozen", ySplit: 1 }];

  workbook.eachSheet((sheet) => {
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      row.alignment = { vertical: "middle", wrapText: true };
    });
    sheet.views = sheet.views.length ? sheet.views : [{ state: "frozen", ySplit: 1 }];
  });

  await workbook.xlsx.writeFile(OUTPUT_FILE);
  console.log(`Generated ${OUTPUT_FILE}`);
}

generateWorkbook().catch((error) => {
  console.error(error);
  process.exit(1);
});
