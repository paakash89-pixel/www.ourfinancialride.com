"use client";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export const useAuth = () => ({
  user: null,
  loading: false,
  firebaseReady: false,
  premium: false,
  logout: async () => {
    // no-op
  },
  activateLocalPremium: () => {
    // no-op
  }
});
