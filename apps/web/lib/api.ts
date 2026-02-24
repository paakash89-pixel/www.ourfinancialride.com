const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const DEV_USER_KEY = "intrinsic_dev_user";

const resolveDevUser = (): string => {
  if (typeof window === "undefined") return "dev-user";
  const stored = localStorage.getItem(DEV_USER_KEY);
  if (stored && stored.trim().length > 0) return stored.trim();

  const generated = `dev-user-${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(DEV_USER_KEY, generated);
  return generated;
};

const authHeaders = (): HeadersInit => {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("intrinsic_token");
  const devUser = resolveDevUser();

  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "x-dev-user": devUser,
    "Content-Type": "application/json"
  };
};

export const apiGet = async <T>(path: string): Promise<T> => {
  const res = await fetch(`${API_URL}${path}`, {
    method: "GET",
    headers: authHeaders(),
    cache: "no-store"
  });

  if (!res.ok) {
    let message = `${res.status}`;
    try {
      const payload = (await res.json()) as { message?: string | string[]; error?: string };
      if (Array.isArray(payload.message)) {
        message = payload.message.join(", ");
      } else if (typeof payload.message === "string") {
        message = payload.message;
      } else if (typeof payload.error === "string") {
        message = payload.error;
      }
    } catch {
      // Ignore parse errors and keep status message.
    }
    throw new Error(`GET ${path} failed: ${message}`);
  }

  return (await res.json()) as T;
};

export const apiPost = async <T>(path: string, body: unknown): Promise<T> => {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    let message = `${res.status}`;
    try {
      const payload = (await res.json()) as { message?: string | string[]; error?: string };
      if (Array.isArray(payload.message)) {
        message = payload.message.join(", ");
      } else if (typeof payload.message === "string") {
        message = payload.message;
      } else if (typeof payload.error === "string") {
        message = payload.error;
      }
    } catch {
      // Ignore parse errors and keep status message.
    }
    throw new Error(`POST ${path} failed: ${message}`);
  }

  return (await res.json()) as T;
};

export const apiPut = async <T>(path: string, body: unknown): Promise<T> => {
  const res = await fetch(`${API_URL}${path}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    let message = `${res.status}`;
    try {
      const payload = (await res.json()) as { message?: string | string[]; error?: string };
      if (Array.isArray(payload.message)) {
        message = payload.message.join(", ");
      } else if (typeof payload.message === "string") {
        message = payload.message;
      } else if (typeof payload.error === "string") {
        message = payload.error;
      }
    } catch {
      // Ignore parse errors and keep status message.
    }
    throw new Error(`PUT ${path} failed: ${message}`);
  }

  return (await res.json()) as T;
};
