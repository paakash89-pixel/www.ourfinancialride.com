/* eslint-disable no-console */
const fs = require("fs/promises");
const path = require("path");
const XLSXChart = require("xlsx-chart");

const KIT_DIR = path.resolve(process.cwd(), "content", "blueprint-kits");

const parseCsvLine = (line) => {
  const parts = line.split(",");
  if (parts.length < 6) return null;

  const section = parts[0]?.trim() ?? "";
  const metric = parts[1]?.trim() ?? "";
  const inrValue = parts[2]?.trim() ?? "";
  const usdValue = parts[3]?.trim() ?? "";
  const usage = parts[parts.length - 1]?.trim() ?? "";
  const formula = parts.slice(4, -1).join(",").trim();

  return {
    section,
    metric,
    inrValue,
    usdValue,
    formula,
    usage
  };
};

const toNumber = (raw) => {
  if (!raw) return 0;
  const cleaned = raw.replace(/,/g, "").replace(/%/g, "").trim();
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : 0;
};

const toTitle = (slug) =>
  slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const writeXlsx = (opts) =>
  new Promise((resolve, reject) => {
    const chart = new XLSXChart();
    chart.writeFile(opts, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });

async function generateFile(csvFile) {
  const slug = path.basename(csvFile, ".csv");
  const raw = await fs.readFile(path.join(KIT_DIR, csvFile), "utf-8");
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const rows = lines.slice(1).map(parseCsvLine).filter(Boolean);

  const chartHeader = rows.find(
    (row) =>
      row.section.toLowerCase() === "chartdata" &&
      row.metric.toLowerCase() === "quarter"
  );
  const chartRows = rows.filter(
    (row) =>
      row.section.toLowerCase() === "chartdata" && /^q\d+$/i.test(row.metric)
  );

  if (chartRows.length === 0) {
    throw new Error(`No chart rows found for ${slug}`);
  }

  const inrTitle = chartHeader?.inrValue || "INR Example";
  const usdTitle = chartHeader?.usdValue || "USD Example";
  const fields = chartRows.map((row) => row.metric.toUpperCase());

  const lineData = {
    [inrTitle]: {},
    [usdTitle]: {}
  };

  for (const row of chartRows) {
    const key = row.metric.toUpperCase();
    lineData[inrTitle][key] = toNumber(row.inrValue);
    lineData[usdTitle][key] = toNumber(row.usdValue);
  }

  const outputFile = path.join(KIT_DIR, `${slug}.xlsx`);
  const chartTitleBase = toTitle(slug);

  await writeXlsx({
    file: outputFile,
    chart: "line",
    chartTitle: `${chartTitleBase} Trend`,
    titles: [inrTitle, usdTitle],
    fields,
    data: lineData
  });

  console.log(`Generated ${path.basename(outputFile)}`);
}

async function main() {
  const files = (await fs.readdir(KIT_DIR)).filter((file) => file.endsWith(".csv"));
  files.sort();

  for (const file of files) {
    await generateFile(file);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
