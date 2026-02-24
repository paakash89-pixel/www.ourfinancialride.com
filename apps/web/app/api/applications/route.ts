import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { applicationSchema, type ApplicationRecord } from "../../../lib/application-schema";

export const runtime = "nodejs";

const inMemoryQueue: ApplicationRecord[] = [];
const FALLBACK_CONTACT_EMAIL = "ourfinancialride@gmail.com";

const getDevDataPath = (): string =>
  path.resolve(process.cwd(), "..", "..", "data", "applications.json");

const getContactEmail = (): string =>
  process.env.APPLICATION_TO_EMAIL?.trim() ||
  process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() ||
  FALLBACK_CONTACT_EMAIL;

const getSenderEmail = (): string =>
  process.env.RESEND_FROM_EMAIL?.trim() ||
  "OFR Applications <onboarding@resend.dev>";

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildParticipantsLabel = (record: ApplicationRecord): string =>
  record.spouse2Name?.trim()
    ? `${record.spouse1Name} + ${record.spouse2Name}`
    : record.spouse1Name;

const buildPlainTextEmail = (record: ApplicationRecord): string => {
  const spouse2 = record.spouse2Name?.trim() || "Individual application";
  return [
    "New OFR application submitted.",
    "",
    `Submitted at: ${record.submittedAt}`,
    `Fit status: ${record.fit}`,
    "",
    `Spouse 1: ${record.spouse1Name}`,
    `Spouse 2 / Partner: ${spouse2}`,
    `Email: ${record.email}`,
    `Phone / WhatsApp: ${record.phone || "N/A"}`,
    `Location: ${record.location}`,
    `Income range: ${record.incomeRange}`,
    `Current savings rate: ${record.currentSavingsRate}`,
    `Portfolio range: ${record.portfolioRange}`,
    "",
    "Biggest goal:",
    record.biggestGoal,
    "",
    "Biggest worry:",
    record.biggestWorry
  ].join("\n");
};

const buildHtmlEmail = (record: ApplicationRecord): string => {
  const spouse2 = record.spouse2Name?.trim() || "Individual application";
  return `
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.5;color:#111827">
      <h2 style="margin:0 0 12px">New OFR Application</h2>
      <p style="margin:0 0 12px"><strong>Submitted at:</strong> ${escapeHtml(record.submittedAt)}<br />
      <strong>Fit status:</strong> ${escapeHtml(record.fit)}</p>
      <p style="margin:0 0 12px">
      <strong>Spouse 1:</strong> ${escapeHtml(record.spouse1Name)}<br />
      <strong>Spouse 2 / Partner:</strong> ${escapeHtml(spouse2)}<br />
      <strong>Email:</strong> ${escapeHtml(record.email)}<br />
      <strong>Phone / WhatsApp:</strong> ${escapeHtml(record.phone || "N/A")}<br />
      <strong>Location:</strong> ${escapeHtml(record.location)}<br />
      <strong>Income range:</strong> ${escapeHtml(record.incomeRange)}<br />
      <strong>Current savings rate:</strong> ${escapeHtml(record.currentSavingsRate)}<br />
      <strong>Portfolio range:</strong> ${escapeHtml(record.portfolioRange)}
      </p>
      <p style="margin:0 0 4px"><strong>Biggest goal</strong></p>
      <p style="margin:0 0 12px">${escapeHtml(record.biggestGoal)}</p>
      <p style="margin:0 0 4px"><strong>Biggest worry</strong></p>
      <p style="margin:0">${escapeHtml(record.biggestWorry)}</p>
    </div>
  `;
};

const sendApplicationEmail = async (
  record: ApplicationRecord
): Promise<{ sent: boolean; error?: string }> => {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { sent: false, error: "RESEND_API_KEY is not configured." };
  }

  const to = getContactEmail();
  const subject = `OFR Application - ${buildParticipantsLabel(record)}`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: getSenderEmail(),
        to: [to],
        reply_to: record.email,
        subject,
        text: buildPlainTextEmail(record),
        html: buildHtmlEmail(record)
      })
    });

    if (!response.ok) {
      const details = await response.text();
      return {
        sent: false,
        error: `Resend API failed (${response.status}): ${details.slice(0, 240)}`
      };
    }

    return { sent: true };
  } catch (error) {
    return {
      sent: false,
      error: error instanceof Error ? error.message : "Unknown email delivery error."
    };
  }
};

const persistForDev = async (record: ApplicationRecord) => {
  if (process.env.NODE_ENV === "production") return;

  const filePath = getDevDataPath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  let existing: ApplicationRecord[] = [];
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    existing = JSON.parse(raw) as ApplicationRecord[];
  } catch {
    existing = [];
  }

  existing.push(record);
  await fs.writeFile(filePath, JSON.stringify(existing, null, 2), "utf-8");
};

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = applicationSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid application payload",
        issues: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  const fit = parsed.data.incomeRange === "Other" ? "out-of-fit" : "in-fit";

  const record: ApplicationRecord = {
    ...parsed.data,
    id: randomUUID(),
    fit,
    submittedAt: new Date().toISOString()
  };

  inMemoryQueue.push(record);
  await persistForDev(record);
  const emailResult = await sendApplicationEmail(record);

  return NextResponse.json({
    ok: true,
    record,
    emailSent: emailResult.sent,
    emailError: emailResult.error ?? null,
    emailTo: getContactEmail(),
    queueLength: inMemoryQueue.length,
    note:
      "Stored in in-memory queue for production safety and in /data/applications.json during local development."
  });
}

export async function GET() {
  return NextResponse.json({
    queueLength: inMemoryQueue.length,
    queue: inMemoryQueue
  });
}
