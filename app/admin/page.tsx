"use client";
import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";

interface MenuItem {
  id: number;
  name: string;
  price: number;
  image?: string;
  category: string;
  Ingredients?: Ingredient[];
}

interface Ingredient {
  id: number;
  name: string;
}

const AdminDashboard = () => {
  const { user } = useUser();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addForm, setAddForm] = useState({ name: '', category: '', price: '', image: '' });
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: '', category: '', price: '', image: '' });
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [addIngredientName, setAddIngredientName] = useState("");
  const [editIngredients, setEditIngredients] = useState<number[]>([]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  if (!API_URL) {
    return <div className="p-4 text-red-500">Error: API URL not configured</div>;
  }

  useEffect(() => {
    if (user?.role !== 'admin') return;
    fetch(`${API_URL}/menu-items`)
      .then(res => res.json())
      .then(data => setMenuItems(data))
      .catch(() => setError("Failed to load menu items"))
      .finally(() => setLoading(false));
    fetch(`${API_URL}/ingredients`)
      .then(res => res.json())
      .then(data => setIngredients(data))
      .catch(() => setError("Failed to load ingredients"));
  }, [user]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this menu item?")) return;
    try {
      const res = await fetch(`${API_URL}/menu-items/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMenuItems(items => items.filter(item => item.id !== id));
      } else {
        alert("Failed to delete item.");
      }
    } catch {
      alert("Failed to delete item.");
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/menu-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addForm.name,
          category: addForm.category,
          price: parseFloat(addForm.price),
          image: addForm.image
        })
      });
      if (res.ok) {
        const newItem = await res.json();
        setMenuItems(items => [...items, newItem]);
        setAddForm({ name: '', category: '', price: '', image: '' });
      } else {
        alert("Failed to add item.");
      }
    } catch {
      alert("Failed to add item.");
    }
  };

  const handleEdit = (item: MenuItem & { Ingredients?: Ingredient[] }) => {
    setEditId(item.id);
    setEditForm({
      name: item.name,
      category: item.category,
      price: item.price.toString(),
      image: item.image || ''
    });
    setEditIngredients(item.Ingredients ? item.Ingredients.map(ing => ing.id) : []);
  };

  const handleEditSave = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/menu-items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          category: editForm.category,
          price: parseFloat(editForm.price),
          image: editForm.image,
          ingredientIds: editIngredients
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setMenuItems(items => items.map(item => item.id === id ? updated : item));
        setEditId(null);
      } else {
        alert("Failed to update item.");
      }
    } catch {
      alert("Failed to update item.");
    }
  };

  const handleToggleIngredient = (id: number) => {
    setEditIngredients(prev =>
      prev.includes(id)
        ? prev.length > 2 ? prev.filter(i => i !== id) : prev // must keep at least 2
        : [...prev, id]
    );
  };

  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addIngredientName.trim()) return;
    try {
      const res = await fetch(`${API_URL}/ingredients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: addIngredientName.trim() })
      });
      if (res.ok) {
        const newIng = await res.json();
        setIngredients(ings => [...ings, newIng]);
        setAddIngredientName("");
      } else {
        alert("Failed to add ingredient.");
      }
    } catch {
      alert("Failed to add ingredient.");
    }
  };

  // Ingredient delete handler
  const handleDeleteIngredient = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this ingredient?")) return;
    try {
      const res = await fetch(`${API_URL}/ingredients/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setIngredients(ings => ings.filter(ing => ing.id !== id));
        // Remove from editIngredients if present
        setEditIngredients(prev => prev.filter(i => i !== id));
      } else {
        alert("Failed to delete ingredient.");
      }
    } catch {
      alert("Failed to delete ingredient.");
    }
  };

  if (!user) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Please log in to access the admin dashboard.</div>;
  }
  if (user.role !== 'admin') {
    return <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>Access Denied: Admins only.</div>;
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem', background: '#fff', minHeight: '100vh', color: '#111' }}>
      <h1 style={{ color: '#111', marginBottom: 24 }}>Admin Dashboard</h1>
      <section style={{ marginBottom: 40 }}>
        <h2>Menu Item Management</h2>
        <form onSubmit={handleAddIngredient} style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
          <input required placeholder="New Ingredient Name" value={addIngredientName} onChange={e => setAddIngredientName(e.target.value)} style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc' }} />
          <button type="submit" style={{ background: '#111', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 18px', fontWeight: 600 }}>Add Ingredient</button>
        </form>
        {/* Ingredient list with delete buttons */}
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ margin: '8px 0 8px 0' }}>All Ingredients</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {ingredients.map(ing => (
              <li key={ing.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ flex: 1 }}>{ing.name}</span>
                <button onClick={() => handleDeleteIngredient(ing.id)} style={{ background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 12px', fontWeight: 600, marginLeft: 8, cursor: 'pointer' }}>Delete</button>
              </li>
            ))}
          </ul>
        </div>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <input required placeholder="Name" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc' }} />
          <input required placeholder="Category" value={addForm.category} onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))} style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc' }} />
          <input required type="number" step="0.01" placeholder="Price" value={addForm.price} onChange={e => setAddForm(f => ({ ...f, price: e.target.value }))} style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc', width: 90 }} />
          <input placeholder="Image URL" value={addForm.image} onChange={e => setAddForm(f => ({ ...f, image: e.target.value }))} style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc', width: 180 }} />
          <button type="submit" style={{ background: '#111', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 18px', fontWeight: 600 }}>Add</button>
        </form>
        {loading ? <p>Loading menu items...</p> : error ? <p style={{ color: 'red' }}>{error}</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {menuItems.map(item => (
                <tr key={item.id}>
                  {editId === item.id ? (
                    <>
                      <td><input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} style={{ padding: 4, borderRadius: 4, border: '1px solid #ccc' }} /></td>
                      <td><input value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} style={{ padding: 4, borderRadius: 4, border: '1px solid #ccc' }} /></td>
                      <td><input type="number" step="0.01" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))} style={{ padding: 4, borderRadius: 4, border: '1px solid #ccc', width: 80 }} /></td>
                      <td>
                        <div style={{ marginBottom: 8 }}>
                          {ingredients.map(ing => (
                            <label key={ing.id} style={{ cursor: 'pointer', marginRight: 10, display: 'inline-flex', alignItems: 'center', userSelect: 'none' }}>
                              <input
                                type="checkbox"
                                checked={editIngredients.includes(ing.id)}
                                onChange={() => handleToggleIngredient(ing.id)}
                                style={{ display: 'none' }}
                              />
                              <span style={{
                                display: 'inline-block',
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                border: '2px solid #111',
                                background: editIngredients.includes(ing.id) ? '#111' : '#fff',
                                marginRight: 6,
                                transition: 'background 0.15s',
                              }} />
                              <span style={{ fontSize: 14 }}>{ing.name}</span>
                            </label>
                          ))}
                        </div>
                        <button style={{ color: '#fff', background: '#4caf50', border: 'none', borderRadius: 4, padding: '4px 12px', marginRight: 8 }} onClick={() => handleEditSave(item.id)}>Save</button>
                        <button style={{ color: '#111', background: '#eee', border: 'none', borderRadius: 4, padding: '4px 12px' }} onClick={() => setEditId(null)}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{item.name}</td>
                      <td>{item.category}</td>
                      <td>{typeof item.price === 'number' ? item.price.toFixed(2) : Number(item.price).toFixed ? Number(item.price).toFixed(2) : 'N/A'}</td>
                      <td>
                        <button style={{ color: '#111', background: '#ffc107', border: 'none', borderRadius: 4, padding: '4px 12px', marginRight: 8 }} onClick={() => handleEdit(item)}>Edit</button>
                        <button style={{ color: '#fff', background: '#d32f2f', border: 'none', borderRadius: 4, padding: '4px 12px' }} onClick={() => handleDelete(item.id)}>Delete</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      <section style={{ marginBottom: 40 }}>
        <h2>Logs</h2>
        <p>Coming soon...</p>
      </section>
      <section>
        <h2>User Management</h2>
        <p>Coming soon...</p>
      </section>
    </div>
  );
};

export default AdminDashboard; 