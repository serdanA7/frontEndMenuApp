"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useCart } from "../../../context/CartContext";

const EditIngredientsPage = () => {
  const router = useRouter();
  const params = useParams();
  const cartItemId = Number(params.cartItemId);
  const { cart, updateIngredients } = useCart();
  const cartItem = cart.find(i => i.id === cartItemId);
  const [allIngredients, setAllIngredients] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>(cartItem?.ingredients || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [defaultIngredients, setDefaultIngredients] = useState<string[]>([]);

  useEffect(() => {
    let ignore = false;
    async function fetchData() {
      setLoading(true);
      try {
        const [allRes, menuItemRes] = await Promise.all([
          fetch("http://localhost:3001/api/v1/ingredients"),
          fetch(`http://localhost:3001/api/v1/menu-items/${cartItemId}`)
        ]);
        const allData = await allRes.json();
        const menuItemData = await menuItemRes.json();
        if (!ignore) {
          setAllIngredients(allData.map((ing: any) => ing.name));
          const defaultIngs = (menuItemData.Ingredients || []).map((ing: any) => ing.name);
          setDefaultIngredients(defaultIngs);

          // If the cartItem has no custom selection, set selected to default
          if (!cartItem?.ingredients || cartItem.ingredients.length === 0) {
            setSelected(defaultIngs);
          }
        }
      } catch {
        setError("Failed to load ingredients");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    return () => { ignore = true; };
  }, [cartItemId]);

  if (!cartItem) return <div style={{ padding: 32 }}>Cart item not found.</div>;

  const handleToggle = (ingredient: string) => {
    if (selected.includes(ingredient)) {
      if (selected.length <= 2) return; // must keep at least 2
      setSelected(selected.filter(i => i !== ingredient));
    } else {
      setSelected([...selected, ingredient]);
    }
  };

  const handleSave = () => {
    updateIngredients(cartItemId, selected);
    router.push("/checkout");
  };

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: '2rem', background: '#fff', minHeight: '100vh', color: '#111' }}>
      <h1 style={{ color: '#111', marginBottom: 24 }}>Edit Ingredients for {cartItem.name}</h1>
      {loading ? <p>Loading ingredients...</p> : error ? <p style={{ color: 'red' }}>{error}</p> : (
        <>
          <div style={{ marginBottom: 24 }}>
            {allIngredients.map(ingredient => {
              const isSelected = selected.includes(ingredient);
              const isDefault = defaultIngredients.includes(ingredient);
              return (
                <label key={ingredient} style={{ display: 'block', marginBottom: 8, fontWeight: isSelected ? 600 : 400, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggle(ingredient)}
                    style={{ display: 'none' }}
                  />
                  <span style={{
                    display: 'inline-block',
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    border: '2px solid #111',
                    background: isSelected ? '#111' : '#fff',
                    marginRight: 10,
                    verticalAlign: 'middle',
                    transition: 'background 0.15s',
                  }} />
                  <span style={{
                    marginLeft: 0,
                    color: isDefault ? '#111' : '#aaa',
                    fontWeight: isDefault ? 700 : 400
                  }}>
                    {ingredient}
                    {isDefault && <span style={{ marginLeft: 6, fontSize: 12, color: '#4caf50' }}>(default)</span>}
                  </span>
                  {isSelected && selected.length <= 2 && <span style={{ color: 'red', marginLeft: 8 }}>(min 2)</span>}
                </label>
              );
            })}
          </div>
          <button
            onClick={handleSave}
            style={{ background: '#111', color: '#fff', border: 'none', borderRadius: 4, padding: '10px 24px', fontWeight: 600, fontSize: 16 }}
            disabled={selected.length < 2}
          >Save</button>
          <button
            onClick={() => router.push("/checkout")}
            style={{ marginLeft: 16, background: '#eee', color: '#111', border: 'none', borderRadius: 4, padding: '10px 24px', fontWeight: 500, fontSize: 16 }}
          >Cancel</button>
        </>
      )}
    </div>
  );
};

export default EditIngredientsPage; 