import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ExpoLinking from "expo-linking";
import { Platform } from "react-native";

const parseExpoHost = (): string | null => {
  const localUrl = ExpoLinking.createURL("/");
  const match = localUrl.match(/^[a-zA-Z]+:\/\/([^/:]+)/);
  const host = match?.[1]?.trim();
  return host || null;
};

const resolveDefaultApiUrl = (): string => {
  const host = parseExpoHost();
  if (host && host !== "localhost" && host !== "127.0.0.1") {
    return `http://${host}:4000`;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:4000";
  }

  return "http://localhost:4000";
};

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? resolveDefaultApiUrl();

const headers = async (): Promise<Record<string, string>> => {
  const token = await AsyncStorage.getItem("intrinsic_token");
  const devUser = (await AsyncStorage.getItem("intrinsic_dev_user")) ?? "mobile-dev-user";

  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "x-dev-user": devUser,
    "Content-Type": "application/json"
  };
};

export const apiGet = async <T>(path: string): Promise<T> => {
  const res = await fetch(`${API_URL}${path}`, { headers: await headers() });
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
    throw new Error(`GET ${path} failed (${message})`);
  }
  return (await res.json()) as T;
};

export const apiPost = async <T>(path: string, body: unknown): Promise<T> => {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: await headers(),
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
    throw new Error(`POST ${path} failed (${message})`);
  }
  return (await res.json()) as T;
};

export const apiPut = async <T>(path: string, body: unknown): Promise<T> => {
  const res = await fetch(`${API_URL}${path}`, {
    method: "PUT",
    headers: await headers(),
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
    throw new Error(`PUT ${path} failed (${message})`);
  }
  return (await res.json()) as T;
};
