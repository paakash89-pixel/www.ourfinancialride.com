import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { applicationSchema, type ApplicationRecord } from "../../../lib/application-schema";

export const runtime = "nodejs";

const inMemoryQueue: ApplicationRecord[] = [];

const getDevDataPath = (): string =>
  path.resolve(process.cwd(), "..", "..", "data", "applications.json");

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

  return NextResponse.json({
    ok: true,
    record,
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
