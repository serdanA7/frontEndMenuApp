"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import { useUser } from '../../context/UserContext';
import styles from '../../Home.module.css';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  image?: string;
  rating?: number;
  reviews?: number;
  ingredients?: { name: string }[];
}

const MenuCategoryPage = () => {
  // In Next.js 13 app router, useParams is used for dynamic routes
  const params = useParams();
  const category = params?.category;
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { user } = useUser();
  const [sort, setSort] = useState<string>("");
  const [order, setOrder] = useState<string>("");
  const [ingredientFilter, setIngredientFilter] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; price: string; image?: string }>({ name: '', price: '', image: '' });

  useEffect(() => {
    if (!category) return;
    setLoading(true);
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    if (!API_URL) {
      setError("API URL not configured");
      setLoading(false);
      return;
    }
    let url = `${API_URL}/menu-items?category=${category}`;
    if (sort && order) url += `&sort=${sort}&order=${order}`;
    if (ingredientFilter) url += `&ingredient=${ingredientFilter}`;
    fetch(url)
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(err => setError("Failed to fetch menu items"))
      .finally(() => setLoading(false));
  }, [category, sort, order, ingredientFilter]);

  const handleEdit = (item: MenuItem) => {
    setEditId(item.id);
    setEditForm({ name: item.name, price: item.price.toString(), image: item.image || '' });
  };

  const handleEditSave = async (id: number) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    if (!API_URL) return;
    try {
      const res = await fetch(`${API_URL}/menu-items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editForm.name, price: parseFloat(editForm.price), image: editForm.image })
      });
      if (res.ok) {
        const updated = await res.json();
        setItems(items => items.map(item => item.id === id ? updated : item));
        setEditId(null);
      } else {
        alert('Failed to update item.');
      }
    } catch {
      alert('Failed to update item.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    if (!API_URL) return;
    try {
      const res = await fetch(`${API_URL}/menu-items/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems(items => items.filter(item => item.id !== id));
      } else {
        alert('Failed to delete item.');
      }
    } catch {
      alert('Failed to delete item.');
    }
  };

  return (
    <div className={styles.container}>
      <h1 style={{ color: '#111', margin: '2rem 0 2rem 0', textAlign: 'center' }}>Menu Category: {category}</h1>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
        <label style={{ color: '#111' }}>
          Sort by:
          <select value={sort} onChange={e => setSort(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="">None</option>
            <option value="price">Price</option>
            <option value="name">Name</option>
          </select>
        </label>
        <label style={{ color: '#111' }}>
          Order:
          <select value={order} onChange={e => setOrder(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="">None</option>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </label>
        <label style={{ color: '#111' }}>
          Filter by ingredient:
          <input type="text" value={ingredientFilter} onChange={e => setIngredientFilter(e.target.value)} placeholder="e.g. Cheese" style={{ marginLeft: 8, padding: 4, borderRadius: 4, border: '1px solid #ccc' }} />
        </label>
      </div>
      {loading ? <p>Loading...</p> : (
        <div className={styles.categories}>
          {items.map(item => (
            <div key={item.id} className={styles.card}>
              <img src={item.image} alt={item.name} className={styles.cardImg} />
              <div className={styles.cardText}>{item.name}</div>
              <button style={{ position: 'absolute', right: 24, bottom: 18, zIndex: 3, background: '#111', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, fontSize: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.10)', cursor: 'pointer' }} onClick={() => addToCart({ id: item.id, name: item.name, price: item.price, image: item.image })}>
                Add to Basket
              </button>
              {user?.role === 'admin' && (
                <div style={{ position: 'absolute', left: 24, bottom: 18, zIndex: 3, display: 'flex', gap: 8 }}>
                  {editId === item.id ? (
                    <>
                      <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} style={{ padding: 4, borderRadius: 4, border: '1px solid #ccc', marginRight: 8 }} />
                      <input type="number" step="0.01" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))} style={{ padding: 4, borderRadius: 4, border: '1px solid #ccc', width: 80, marginRight: 8 }} />
                      <input value={editForm.image} onChange={e => setEditForm(f => ({ ...f, image: e.target.value }))} placeholder="Image URL" style={{ padding: 4, borderRadius: 4, border: '1px solid #ccc', width: 120, marginRight: 8 }} />
                      <button style={{ background: '#4caf50', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', fontWeight: 600, fontSize: 14, cursor: 'pointer', marginRight: 4 }} onClick={() => handleEditSave(item.id)}>Save</button>
                      <button style={{ background: '#eee', color: '#111', border: 'none', borderRadius: 4, padding: '6px 12px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }} onClick={() => setEditId(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button style={{ background: '#ffc107', color: '#111', border: 'none', borderRadius: 4, padding: '6px 12px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }} onClick={() => handleEdit(item)}>Edit</button>
                      <button style={{ background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }} onClick={() => handleDelete(item.id)}>Delete</button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MenuCategoryPage; 