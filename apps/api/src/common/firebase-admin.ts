import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const tryInitialize = (): void => {
  if (getApps().length > 0) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) return;

  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey })
  });
};

export const verifyFirebaseToken = async (
  token: string
): Promise<{ uid: string; email?: string }> => {
  tryInitialize();
  if (getApps().length === 0) {
    throw new Error("Firebase admin not initialized");
  }

  const decoded = await getAuth().verifyIdToken(token);
  return { uid: decoded.uid, email: decoded.email };
};
