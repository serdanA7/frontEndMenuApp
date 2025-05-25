import { NextResponse } from 'next/server';
import { z } from 'zod';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export const BasketItemSchema = z.object({
    id: z.number(),
    name: z.string(),
    category: z.string(),
    price: z.number(),
    quantity: z.number(),
    ingredients: z.array(z.string()),
    image: z.string(),
    rating: z.number(),
    reviews: z.number()
});

type BasketItem = z.infer<typeof BasketItemSchema>;

// Use a more reliable in-memory storage
declare global {
    var items: BasketItem[];
    var menuItems: BasketItem[];
}

// Initialize with realistic food items if empty
if (!global.menuItems) {
    global.menuItems = [
        {
            id: 1,
            name: "Classic Pancakes",
            category: "Breakfast",
            price: 8.99,
            quantity: 1,
            ingredients: ["Flour", "Eggs", "Milk", "Butter", "Maple Syrup"],
            image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=500",
            rating: 4.5,
            reviews: 128
        },
        {
            id: 2,
            name: "Avocado Toast",
            category: "Breakfast",
            price: 7.99,
            quantity: 1,
            ingredients: ["Sourdough Bread", "Avocado", "Eggs", "Cherry Tomatoes", "Microgreens"],
            image: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=500",
            rating: 4.3,
            reviews: 95
        },
        {
            id: 3,
            name: "Grilled Salmon",
            category: "Dinner",
            price: 24.99,
            quantity: 1,
            ingredients: ["Salmon Fillet", "Lemon", "Dill", "Olive Oil", "Asparagus"],
            image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500",
            rating: 4.7,
            reviews: 156
        },
        {
            id: 4,
            name: "Beef Steak",
            category: "Dinner",
            price: 29.99,
            quantity: 1,
            ingredients: ["Ribeye Steak", "Garlic", "Butter", "Rosemary", "Mashed Potatoes"],
            image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500",
            rating: 4.8,
            reviews: 203
        },
        {
            id: 5,
            name: "Chocolate Cake",
            category: "Dessert",
            price: 6.99,
            quantity: 1,
            ingredients: ["Dark Chocolate", "Flour", "Sugar", "Eggs", "Butter", "Vanilla"],
            image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500",
            rating: 4.6,
            reviews: 178
        },
        {
            id: 6,
            name: "Tiramisu",
            category: "Dessert",
            price: 7.99,
            quantity: 1,
            ingredients: ["Mascarpone", "Coffee", "Ladyfingers", "Cocoa Powder", "Eggs"],
            image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500",
            rating: 4.4,
            reviews: 142
        }
    ];
}

// Initialize basket items if empty
if (!global.items) {
    global.items = [];
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const filterBy = searchParams.get('filterBy');
        const sortOrder = searchParams.get('sortOrder');
        const sortAlphabetically = searchParams.get('sortAlphabetically');
        const searchQuery = searchParams.get('searchQuery');
        const priceSegment = searchParams.get('priceSegment');
        const type = searchParams.get('type') || 'basket';

        let items = type === 'menu' ? [...global.menuItems] : [...global.items];

        // Filter by price segment
        if (priceSegment && priceSegment !== 'none') {
            const prices = items.map(item => item.price);
            const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
            
            items = items.filter(item => {
                if (priceSegment === 'highest') {
                    return item.price > avgPrice;
                } else if (priceSegment === 'average') {
                    return item.price >= avgPrice * 0.8 && item.price <= avgPrice * 1.2;
                } else if (priceSegment === 'lowest') {
                    return item.price < avgPrice;
                }
                return true;
            });
        }

        // Filter by category
        if (filterBy && filterBy !== 'all') {
            items = items.filter(item => item.category === filterBy);
        }

        // Filter by search query
        if (searchQuery) {
            items = items.filter(item => 
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.category.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Sort by price
        if (sortOrder && sortOrder !== 'none') {
            items.sort((a, b) => {
                if (sortOrder === 'asc') {
                    return a.price - b.price;
                } else {
                    return b.price - a.price;
                }
            });
        }

        // Sort alphabetically
        if (sortAlphabetically && sortAlphabetically !== 'none') {
            items.sort((a, b) => {
                if (sortAlphabetically === 'az') {
                    return a.name.localeCompare(b.name);
                } else {
                    return b.name.localeCompare(a.name);
                }
            });
        }

        return NextResponse.json({ items }, { status: 200, headers: corsHeaders });
    } catch (error) {
        console.error('Error getting items:', error);
        return NextResponse.json(
            { error: 'Failed to get items' },
            { status: 500, headers: corsHeaders }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const result = BasketItemSchema.safeParse({ ...body, id: Date.now() });

        if (!result.success) {
            return NextResponse.json(
                { error: 'Invalid item data', details: result.error },
                { status: 400, headers: corsHeaders }
            );
        }

        global.items.push(result.data);
        return NextResponse.json({ items: global.items }, { status: 200, headers: corsHeaders });
    } catch (error) {
        console.error('Error adding item:', error);
        return NextResponse.json(
            { error: 'Failed to add item' },
            { status: 500, headers: corsHeaders }
        );
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        const itemIndex = global.items.findIndex(item => item.id === id);
        if (itemIndex === -1) {
            return NextResponse.json(
                { error: 'Item not found' },
                { status: 404, headers: corsHeaders }
            );
        }

        // Create a partial schema for updates
        const UpdateSchema = BasketItemSchema.partial().omit({ id: true });
        const result = UpdateSchema.safeParse(updates);

        if (!result.success) {
            return NextResponse.json(
                { error: 'Invalid update data', details: result.error },
                { status: 400, headers: corsHeaders }
            );
        }

        // Merge the updates with the existing item
        const updatedItem = { ...global.items[itemIndex], ...result.data };
        
        // Validate the complete updated item
        const finalValidation = BasketItemSchema.safeParse(updatedItem);
        if (!finalValidation.success) {
            return NextResponse.json(
                { error: 'Invalid item data after update', details: finalValidation.error },
                { status: 400, headers: corsHeaders }
            );
        }

        global.items[itemIndex] = finalValidation.data;
        return NextResponse.json({ items: global.items }, { status: 200, headers: corsHeaders });
    } catch (error) {
        console.error('Error updating item:', error);
        return NextResponse.json(
            { error: 'Failed to update item' },
            { status: 500, headers: corsHeaders }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = Number(searchParams.get('id'));

        const itemIndex = global.items.findIndex(item => item.id === id);
        if (itemIndex === -1) {
            return NextResponse.json(
                { error: 'Item not found' },
                { status: 404, headers: corsHeaders }
            );
        }

        global.items.splice(itemIndex, 1);
        return NextResponse.json({ items: global.items }, { status: 200, headers: corsHeaders });
    } catch (error) {
        console.error('Error deleting item:', error);
        return NextResponse.json(
            { error: 'Failed to delete item' },
            { status: 500, headers: corsHeaders }
        );
    }
} 