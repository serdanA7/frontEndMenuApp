"use client"; // Enable client-side navigation
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Checkout from './components/Checkout'
import styles from './Home.module.css';
import { useUser } from "./context/UserContext";
import UserMenu from "./components/UserMenu";

const categories = [
  { name: 'Breakfast', image: 'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&w=500' },
  { name: 'Dinner', image: 'https://images.pexels.com/photos/46239/salmon-dish-food-meal-46239.jpeg?auto=compress&w=500' },
  { name: 'Dessert', image: 'https://images.pexels.com/photos/533325/pexels-photo-533325.jpeg?auto=compress&w=500' },
  { name: 'Bar', image: 'https://images.pexels.com/photos/209594/pexels-photo-209594.jpeg?auto=compress&w=500' },
];

const HomePage = () => {
  const { user } = useUser();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, textAlign: 'center', width: '100%' }}>Serdy's Restaurant</h1>
        <div className={styles.icons}>
          <Link href="/checkout"><button className={styles.cart}>🛒</button></Link>
          {user && (
            <Link href="/orders"><button className={styles.cart} title="Previous Orders">📦</button></Link>
          )}
          {user ? (
            <UserMenu />
          ) : (
            <Link href="/login"><button className={styles.user}>👤</button></Link>
          )}
          {user?.role === 'admin' && (
            <Link href="/admin"><button className={styles.user} title="Admin Settings">⚙️</button></Link>
          )}
        </div>
      </header>
      <div className={styles.categories}>
        {categories.map(cat => (
          <Link key={cat.name} href={`/menu/${cat.name}`} className={styles.card}>
            <img src={cat.image} alt={cat.name} className={styles.cardImg} />
            <div className={styles.cardText}>{cat.name}</div>
          </Link>
        ))}
      </div>
      {user?.role === 'admin' && (
        <div style={{ marginTop: 40, padding: 24, background: '#f5f5f5', borderRadius: 12, textAlign: 'center', color: '#111', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h2 style={{ marginBottom: 12 }}>Admin Panel</h2>
          <p>Welcome, admin! Here you can manage menu items, view logs, and more.</p>
          {/* Add admin features here */}
        </div>
      )}
    </div>
  );
};

export default HomePage;