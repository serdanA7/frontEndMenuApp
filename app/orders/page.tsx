"use client";
import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { useCart } from "../context/CartContext";

const OrdersPage = () => {
  const { user } = useUser();
  const { fetchCart } = useCart();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    fetch("http://localhost:3001/api/v1/orders/history", {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    })
      .then(res => res.json())
      .then(data => {
        console.log('Orders API response:', data); // Debug log
        if (Array.isArray(data)) {
          setOrders(data);
        } else if (data && Array.isArray(data.orders)) {
          setOrders(data.orders);
        } else {
          setOrders([]);
          setError("No orders found or invalid response.");
        }
      })
      .catch(() => {
        setOrders([]);
        setError("Failed to load orders");
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleOrderAgain = async (orderId: number) => {
    try {
      const res = await fetch(`http://localhost:3001/api/v1/orders/repeat/${orderId}`, {
        method: "POST",
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        setSuccess("Order added to your cart!");
        fetchCart();
        setTimeout(() => setSuccess(""), 2000);
      }
    } catch {
      setSuccess("");
    }
  };

  if (!user) return <div style={{ padding: 40, textAlign: 'center' }}>Please log in to view your orders.</div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem', background: '#fff', minHeight: '100vh', color: '#111' }}>
      <h1 style={{ color: '#111', marginBottom: 24 }}>Previous Orders</h1>
      {success && <div style={{ background: '#4caf50', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 16, textAlign: 'center', fontWeight: 600 }}>{success}</div>}
      {loading ? <p>Loading...</p> : error ? <p style={{ color: 'red' }}>{error}</p> : (
        <>
          {orders.length === 0 ? <p>No previous orders found.</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', color: '#111' }}>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(orders) && orders.map(order => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.created_at ? new Date(order.created_at).toLocaleString() : '-'}</td>
                    <td>
                      <ul style={{ paddingLeft: 16 }}>
                        {order.OrderItems?.map((item: any) => (
                          <li key={item.id}>
                            {item.MenuItem?.name || 'Item'} x{item.quantity}
                            {item.CustomOrderIngredients && item.CustomOrderIngredients.length > 0 && (
                              <span style={{ color: '#888', fontSize: 12 }}> ({item.CustomOrderIngredients.map((ing: any) => ing.ingredient_name).join(", ")})</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td>${order.total_amount}</td>
                    <td>
                      <button style={{ background: '#111', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 16px', fontWeight: 600 }} onClick={() => handleOrderAgain(order.id)}>Order Again</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
};

export default OrdersPage; 