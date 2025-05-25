import { useState, useEffect } from 'react';

interface BasketItem {
    id: number;
    name: string;
    category: string;
    price: number;
    quantity: number;
    ingredients: string[];
    image: string;
    rating: number;
    reviews: number;
}

interface UseCheckoutReturn {
    basket: BasketItem[];
    menuItems: BasketItem[];
    loading: boolean;
    error: string | null;
    fetchItems: (params?: {
        sortOrder?: string;
        sortAlphabetically?: string;
        filterBy?: string;
        searchQuery?: string;
        priceSegment?: string;
    }) => Promise<void>;
    addItem: (item: BasketItem) => Promise<void>;
    updateItem: (id: number, updates: { 
        quantity?: number; 
        ingredients?: string[];
        rating?: number;
        reviews?: number;
    }) => Promise<void>;
    removeItem: (id: number) => Promise<void>;
}

export function useCheckout(): UseCheckoutReturn {
    const [basket, setBasket] = useState<BasketItem[]>([]);
    const [menuItems, setMenuItems] = useState<BasketItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchItems = async (params: {
        sortOrder?: string;
        sortAlphabetically?: string;
        filterBy?: string;
        searchQuery?: string;
        priceSegment?: string;
    } = {}) => {
        try {
            setLoading(true);
            setError(null);
            
            // Build query parameters
            const queryParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value && value !== 'none') {
                    queryParams.append(key, value);
                }
            });

            // Fetch basket items
            const basketResponse = await fetch(`/api/checkout?${queryParams.toString()}&type=basket`);
            if (!basketResponse.ok) {
                const errorData = await basketResponse.json();
                throw new Error(errorData.error || 'Failed to fetch basket items');
            }
            const basketData = await basketResponse.json();
            setBasket(basketData.items);

            // Fetch menu items
            const menuResponse = await fetch(`/api/checkout?${queryParams.toString()}&type=menu`);
            if (!menuResponse.ok) {
                const errorData = await menuResponse.json();
                throw new Error(errorData.error || 'Failed to fetch menu items');
            }
            const menuData = await menuResponse.json();
            setMenuItems(menuData.items);
        } catch (err) {
            console.error('Error fetching items:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const addItem = async (item: BasketItem) => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add item');
            }
            
            const data = await response.json();
            setBasket(data.items);
        } catch (err) {
            console.error('Error adding item:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateItem = async (id: number, updates: { 
        quantity?: number; 
        ingredients?: string[];
        rating?: number;
        reviews?: number;
    }) => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch('/api/checkout', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...updates }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update item');
            }
            
            const data = await response.json();
            setBasket(data.items);
        } catch (err) {
            console.error('Error updating item:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const removeItem = async (id: number) => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch(`/api/checkout?id=${id}`, {
                method: 'DELETE',
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to remove item');
            }
            
            const data = await response.json();
            setBasket(data.items);
        } catch (err) {
            console.error('Error removing item:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchItems();
    }, []);

    return {
        basket,
        menuItems,
        loading,
        error,
        fetchItems,
        addItem,
        updateItem,
        removeItem,
    };
} 