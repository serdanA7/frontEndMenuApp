"use client"; // Enable client-side navigation

import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Checkout() {
  const { cart, updateQuantity, removeFromCart, clearCart, updateIngredients } = useCart();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [ingredientInput, setIngredientInput] = useState<string>("");
  const [defaultIngredientsMap, setDefaultIngredientsMap] = useState<{ [menuItemId: number]: string[] }>({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

  // Fetch default ingredients for all items in cart that don't have custom ingredients
  useEffect(() => {
    const fetchDefaults = async () => {
      const missing = cart.filter(item => !item.ingredients || item.ingredients.length === 0);
      const promises = missing.map(async item => {
        const res = await fetch(`${API_URL}/menu-items/${item.id}`);
        const data = await res.json();
        return { id: item.id, ingredients: (data.Ingredients || []).map((ing: any) => ing.name) };
      });
      const results = await Promise.all(promises);
      setDefaultIngredientsMap(prev => {
        const updated = { ...prev };
        results.forEach(r => { updated[r.id] = r.ingredients; });
        return updated;
      });
    };
    if (cart.length > 0) fetchDefaults();
  }, [cart]);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${API_URL}/orders/checkout`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        clearCart();
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch {}
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem', background: '#fff', minHeight: '100vh', color: '#111' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ color: '#111', margin: 0 }}>Checkout</h1>
        <button onClick={() => router.push("/")} style={{ background: '#eee', color: '#111', border: 'none', borderRadius: 4, padding: '8px 18px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>🏠 Home</button>
      </div>
      {success && (
        <div style={{ background: '#4caf50', color: '#fff', padding: 16, borderRadius: 8, marginBottom: 16, textAlign: 'center', fontWeight: 600 }}>
          Order placed successfully!
        </div>
      )}
      {cart.length === 0 ? (
        <p>Your basket is empty.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16, background: '#fff', color: '#111' }}>
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Subtotal</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cart.map(item => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>
                  <button style={{ color: '#111', background: '#f5f5f5', border: '1px solid #ccc', borderRadius: 4, padding: '2px 8px' }} onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>-</button>
                  <span style={{ margin: '0 8px', color: '#111' }}>{item.quantity}</span>
                  <button style={{ color: '#111', background: '#f5f5f5', border: '1px solid #ccc', borderRadius: 4, padding: '2px 8px' }} onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                </td>
                <td>${item.price.toFixed(2)}</td>
                <td>${(item.price * item.quantity).toFixed(2)}</td>
                <td>
                  <button onClick={() => removeFromCart(item.id)} style={{ color: 'red', background: '#fff', border: '1px solid #ccc', borderRadius: 4, padding: '2px 8px' }}>Remove</button>
                  <br />
                  {editingId === item.id ? (
                    <>
                      <input
                        type="text"
                        value={ingredientInput}
                        onChange={e => setIngredientInput(e.target.value)}
                        placeholder="Comma separated ingredients"
                        style={{ marginTop: 8, width: '100%' }}
                      />
                      <button
                        style={{ marginTop: 4, color: '#fff', background: '#111', border: 'none', borderRadius: 4, padding: '4px 12px' }}
                        onClick={() => {
                          updateIngredients(item.id, ingredientInput.split(",").map(s => s.trim()).filter(Boolean));
                          setEditingId(null);
                        }}
                      >Save</button>
                      <button
                        style={{ marginTop: 4, marginLeft: 8, color: '#111', background: '#eee', border: 'none', borderRadius: 4, padding: '4px 12px' }}
                        onClick={() => setEditingId(null)}
                      >Cancel</button>
                    </>
                  ) : (
                    <>
                      <div style={{ marginTop: 8, fontSize: 13, color: '#333' }}>
                        Ingredients: {
                          item.ingredients && item.ingredients.length > 0
                            ? item.ingredients.join(", ")
                            : (defaultIngredientsMap[item.id]?.length ? defaultIngredientsMap[item.id].join(", ") : "-")
                        }
                      </div>
                      <Link href={`/checkout/edit-ingredients/${item.id}`} style={{ marginTop: 4, color: '#111', background: '#eee', border: 'none', borderRadius: 4, padding: '4px 12px', display: 'inline-block', textDecoration: 'none' }}>
                        Edit Ingredients
                      </Link>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div style={{ marginTop: 24, fontWeight: 'bold', color: '#111' }}>Total: ${total.toFixed(2)}</div>
      <button
        style={{ marginTop: 16, color: '#fff', background: '#4caf50', border: 'none', borderRadius: 4, padding: '8px 16px', fontWeight: 600, opacity: loading || cart.length === 0 ? 0.6 : 1, cursor: loading || cart.length === 0 ? 'not-allowed' : 'pointer' }}
        onClick={handleCheckout}
        disabled={loading || cart.length === 0}
      >
        {loading ? 'Processing...' : 'Checkout'}
      </button>
    </div>
  );
}