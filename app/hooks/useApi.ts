"use client";
import { useUser } from "../context/UserContext";
import { useRouter } from "next/navigation";

export function useApi() {
  const { logout } = useUser();
  const router = useRouter();

  async function apiFetch(input: RequestInfo, init?: RequestInit) {
    try {
      const res = await fetch(input, init);
      if (res.status === 401 || res.status === 403) {
        logout();
        router.push("/login");
        throw new Error("Unauthorized");
      }
      return res;
    } catch (err) {
      // Network/server error
      logout();
      router.push("/login");
      throw err;
    }
  }

  return apiFetch;
} 