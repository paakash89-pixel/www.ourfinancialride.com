import { createHmac, timingSafeEqual } from "crypto";

const MEMBER_COOKIE_NAME = "ofr_member_session";
const ACCOUNT_COOKIE_NAME = "ofr_account_session";
const NEWSLETTER_COOKIE_NAME = "ofr_newsletter_session";

const getSecret = (): string =>
  process.env.MEMBER_SESSION_SECRET ?? process.env.MEMBER_PASSWORD ?? "change-me";

const createSignature = (payload: string): string =>
  createHmac("sha256", getSecret()).update(payload).digest("hex");

const createSignedValue = (payload: string): string =>
  `${payload}.${createSignature(payload)}`;

const getSignedPayloadIfValid = (
  value: string | undefined,
  prefix: string
): string | null => {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature || !payload.startsWith(prefix)) return null;

  const expected = Buffer.from(createSignature(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length) return null;
  return timingSafeEqual(expected, actual) ? payload : null;
};

export const createMemberSessionValue = (): string => {
  const payload = "member-access";
  return createSignedValue(payload);
};

export const isMemberSessionValid = (value?: string): boolean => {
  return Boolean(getSignedPayloadIfValid(value, "member-access"));
};

export const createAccountSessionValue = (email: string): string => {
  const normalized = email.trim().toLowerCase();
  return createSignedValue(`account:${normalized}`);
};

export const isAccountSessionValid = (value?: string): boolean =>
  Boolean(getSignedPayloadIfValid(value, "account:"));

export const getAccountEmailFromSession = (value?: string): string | null => {
  const payload = getSignedPayloadIfValid(value, "account:");
  if (!payload) return null;
  const [, email] = payload.split(":");
  return email ?? null;
};

export const createNewsletterSessionValue = (email: string): string => {
  const normalized = email.trim().toLowerCase();
  return createSignedValue(`newsletter:${normalized}`);
};

export const isNewsletterSessionValid = (value?: string): boolean =>
  Boolean(getSignedPayloadIfValid(value, "newsletter:"));

export const memberCookieName = MEMBER_COOKIE_NAME;
export const accountCookieName = ACCOUNT_COOKIE_NAME;
export const newsletterCookieName = NEWSLETTER_COOKIE_NAME;
