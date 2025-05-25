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

  useEffect(() => {
    if (!category) return;
    setLoading(true);
    let url = `http://localhost:3001/api/v1/menu-items?category=${category}`;
    if (sort && order) url += `&sort=${sort}&order=${order}`;
    if (ingredientFilter) url += `&ingredient=${ingredientFilter}`;
    fetch(url)
      .then(res => res.json())
      .then(data => setItems(data))
      .finally(() => setLoading(false));
  }, [category, sort, order, ingredientFilter]);

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
                  <button style={{ background: '#ffc107', color: '#111', border: 'none', borderRadius: 4, padding: '6px 12px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }} onClick={() => alert('Edit feature coming soon!')}>Edit</button>
                  <button style={{ background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }} onClick={() => alert('Delete feature coming soon!')}>Delete</button>
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