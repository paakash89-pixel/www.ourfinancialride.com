"use client";

import { useRouter } from "next/navigation";

export function MemberLogoutButton() {
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={() => void logout()}
      className="ios-btn-secondary px-4 py-2 text-sm"
    >
      Logout
    </button>
  );
}
