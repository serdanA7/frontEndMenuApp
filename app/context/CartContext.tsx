"use client";
import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  ingredients?: string[];
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  updateIngredients: (id: number, ingredients: string[]) => void;
  clearCart: () => void;
  fetchCart: () => Promise<void>;
  syncCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  if (!API_URL) throw new Error('API URL not configured');

  // Helper to get the JWT token
  const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

  // Fetch the user's active cart from backend
  const fetchCart = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/orders/active`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.OrderItems) {
        setCart(data.OrderItems.map((oi: any) => ({
          id: oi.menu_item_id,
          name: oi.MenuItem?.name || '',
          price: oi.MenuItem?.price || 0,
          image: oi.MenuItem?.image,
          quantity: oi.quantity,
          ingredients: oi.CustomOrderIngredients?.map((ing: any) => ing.ingredient_name) || []
        })));
      } else {
        setCart([]);
      }
    } catch {
      setCart([]);
    }
  }, []);

  // Sync the current cart to backend (optional, for persistence)
  const syncCart = useCallback(async () => {
    // You can implement this to POST/PUT the cart to backend if needed
    // For now, we rely on backend to manage cart via add/remove/update
  }, [cart]);

  const addToCart = async (item: Omit<CartItem, "quantity">) => {
    const token = getToken();
    const existing = cart.find((i) => i.id === item.id);
    const quantity = existing ? existing.quantity + 1 : 1;
    await fetch(`${API_URL}/orders/cart/add`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ menu_item_id: item.id, quantity, ingredients: item.ingredients || [] })
    });
    await fetchCart();
  };

  const removeFromCart = async (id: number) => {
    const token = getToken();
    await fetch(`${API_URL}/orders/cart/remove`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ menu_item_id: id })
    });
    await fetchCart();
  };

  const updateQuantity = async (id: number, quantity: number) => {
    const token = getToken();
    const item = cart.find(i => i.id === id);
    if (!item) return;
    await fetch(`${API_URL}/orders/cart/add`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ menu_item_id: id, quantity, ingredients: item.ingredients || [] })
    });
    await fetchCart();
  };

  const updateIngredients = async (id: number, ingredients: string[]) => {
    const token = getToken();
    const item = cart.find(i => i.id === id);
    if (!item) return;
    await fetch(`${API_URL}/orders/cart/add`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ menu_item_id: id, quantity: item.quantity, ingredients })
    });
    await fetchCart();
  };

  const clearCart = async () => {
    const token = getToken();
    await fetch(`${API_URL}/orders/cart/clear`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    await fetchCart();
  };

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity, updateIngredients, clearCart, fetchCart, syncCart }}
    >
      {children}
    </CartContext.Provider>
  );
}; 