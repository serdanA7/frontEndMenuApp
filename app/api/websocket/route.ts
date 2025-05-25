import { WebSocket, WebSocketServer } from 'ws';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const BasketItemSchema = z.object({
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

// Store connected clients and WebSocket server instance globally
declare global {
    var wss: WebSocketServer | undefined;
    var clients: Set<WebSocket>;
    var generationInterval: NodeJS.Timeout | null;
    var isGenerating: boolean;
}

if (!global.clients) {
    global.clients = new Set();
}

if (typeof global.isGenerating === 'undefined') {
    global.isGenerating = false;
}

// Function to broadcast updates to all connected clients
function broadcastUpdate(data: any) {
    const message = JSON.stringify(data);
    global.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// Function to generate random items
function generateRandomItem(): BasketItem {
    const categories = ["Breakfast", "Dinner", "Dessert"];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const randomPrice = Math.random() * 45 + 5; // Between 5 and 50
    const randomRating = Math.random() * 4 + 1; // Between 1 and 5
    const randomReviews = Math.floor(Math.random() * 50);

    return {
        id: Date.now(),
        name: `Random ${randomCategory} Item`,
        category: randomCategory,
        price: Number(randomPrice.toFixed(2)),
        quantity: 1,
        ingredients: ["Ingredient 1", "Ingredient 2"],
        image: "https://loremflickr.com/320/240/food",
        rating: Number(randomRating.toFixed(1)),
        reviews: randomReviews
    };
}

// Function to start generation
function startGeneration() {
    if (!global.isGenerating) {
        global.isGenerating = true;
        global.generationInterval = setInterval(() => {
            if (global.clients.size > 0) {
                const newItem = generateRandomItem();
                broadcastUpdate({
                    type: 'new_item',
                    item: newItem
                });
            }
        }, 5000);
        broadcastUpdate({ type: 'generation_status', isGenerating: true });
    }
}

// Function to stop generation
function stopGeneration() {
    if (global.isGenerating && global.generationInterval) {
        global.isGenerating = false;
        clearInterval(global.generationInterval);
        global.generationInterval = null;
        broadcastUpdate({ type: 'generation_status', isGenerating: false });
    }
}

// Initialize WebSocket server if it hasn't been started
if (typeof global.wss === 'undefined') {
    console.log('Initializing WebSocket server...');
    try {
        global.wss = new WebSocketServer({ 
            port: 3002,
            perMessageDeflate: false,
            clientTracking: true,
            verifyClient: (info, callback) => {
                // Allow all connections in development
                callback(true);
            }
        });

        global.wss.on('connection', (ws, req) => {
            console.log('Client connected from:', req.socket.remoteAddress);
            global.clients.add(ws);

            // Send initial data
            ws.send(JSON.stringify({ 
                type: 'connected',
                isGenerating: global.isGenerating 
            }));

            // Handle client disconnection
            ws.on('close', () => {
                console.log('Client disconnected');
                global.clients.delete(ws);
                // If no clients are connected, stop generation
                if (global.clients.size === 0) {
                    stopGeneration();
                }
            });

            // Handle client messages
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message.toString());
                    console.log('Received message:', data);
                    
                    // Handle generation control commands
                    if (data.type === 'start_generation') {
                        startGeneration();
                    } else if (data.type === 'stop_generation') {
                        stopGeneration();
                    }
                } catch (error) {
                    console.error('Error parsing message:', error);
                }
            });

            // Handle errors
            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                global.clients.delete(ws);
            });
        });

        console.log('WebSocket server initialized successfully on port 3002');
    } catch (error) {
        console.error('Failed to initialize WebSocket server:', error);
    }
}

// Export route handlers
export async function GET(req: Request) {
    // Add CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (!global.wss) {
        return NextResponse.json(
            { status: 'WebSocket server not running' }, 
            { status: 500, headers }
        );
    }
    return NextResponse.json({ 
        status: 'WebSocket server running',
        clients: global.clients.size,
        wsUrl: `ws://${req.headers.get('host')?.split(':')[0] || 'localhost'}:3002`
    }, { headers });
}

// Prevent the WebSocket server from being garbage collected
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; 