"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { jwtDecode } from "jwt-decode";
import { useCart } from "./CartContext";

interface User {
  email: string;
  role: string;
  [key: string]: any;
}

interface UserContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const cartCtx = useCart();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      try {
        const decoded: any = jwtDecode(storedToken);
        setUser({ email: decoded.email, role: decoded.role, ...decoded });
        cartCtx.fetchCart();
      } catch {
        setUser(null);
        cartCtx.clearCart();
      }
    } else {
      cartCtx.clearCart();
    }
    // eslint-disable-next-line
  }, []);

  const login = (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    try {
      const decoded: any = jwtDecode(newToken);
      setUser({ email: decoded.email, role: decoded.role, ...decoded });
      cartCtx.fetchCart();
    } catch {
      setUser(null);
      cartCtx.clearCart();
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    cartCtx.clearCart();
  };

  return (
    <UserContext.Provider value={{ user, token, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}; 