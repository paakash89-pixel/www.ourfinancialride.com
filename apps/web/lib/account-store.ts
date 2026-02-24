import { randomUUID, scryptSync, timingSafeEqual } from "crypto";
import fs from "fs/promises";
import path from "path";

export interface AccountRecord {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  salt: string;
  subscribeNewsletter: boolean;
  createdAt: string;
}

interface CreateAccountInput {
  fullName: string;
  email: string;
  password: string;
  subscribeNewsletter: boolean;
}

let cacheLoaded = false;
let accountsCache: AccountRecord[] = [];

const getDevDataPath = (): string =>
  path.resolve(process.cwd(), "..", "..", "data", "accounts.json");

const normalizeEmail = (value: string): string => value.trim().toLowerCase();

const hashPassword = (password: string, salt: string): string =>
  scryptSync(password, salt, 64).toString("hex");

const safeEqual = (left: string, right: string): boolean => {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
};

const loadFromDevFile = async (): Promise<void> => {
  if (process.env.NODE_ENV === "production") return;

  const filePath = getDevDataPath();
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw) as AccountRecord[];
    accountsCache = Array.isArray(parsed) ? parsed : [];
  } catch {
    accountsCache = [];
  }
};

const persistForDev = async (): Promise<void> => {
  if (process.env.NODE_ENV === "production") return;

  const filePath = getDevDataPath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(accountsCache, null, 2), "utf-8");
};

const ensureLoaded = async (): Promise<void> => {
  if (cacheLoaded) return;
  await loadFromDevFile();
  cacheLoaded = true;
};

export const createAccount = async (input: CreateAccountInput): Promise<AccountRecord> => {
  await ensureLoaded();

  const normalizedEmail = normalizeEmail(input.email);
  const existing = accountsCache.find((account) => account.email === normalizedEmail);
  if (existing) {
    throw new Error("Account already exists for this email. Please log in.");
  }

  const salt = randomUUID().replace(/-/g, "");
  const passwordHash = hashPassword(input.password, salt);

  const record: AccountRecord = {
    id: randomUUID(),
    fullName: input.fullName.trim(),
    email: normalizedEmail,
    passwordHash,
    salt,
    subscribeNewsletter: input.subscribeNewsletter,
    createdAt: new Date().toISOString()
  };

  accountsCache.push(record);
  await persistForDev();
  return record;
};

export const verifyAccountCredentials = async (
  email: string,
  password: string
): Promise<AccountRecord | null> => {
  await ensureLoaded();
  const normalizedEmail = normalizeEmail(email);
  const account = accountsCache.find((candidate) => candidate.email === normalizedEmail);
  if (!account) return null;

  const candidateHash = hashPassword(password, account.salt);
  if (!safeEqual(candidateHash, account.passwordHash)) return null;
  return account;
};

export const findAccountByEmail = async (email: string): Promise<AccountRecord | null> => {
  await ensureLoaded();
  const normalizedEmail = normalizeEmail(email);
  return accountsCache.find((account) => account.email === normalizedEmail) ?? null;
};

