import { GET, POST, PATCH, DELETE } from '../checkout/route';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { BasketItemSchema } from '../checkout/route';

// Mock NextResponse
const mockJson = jest.fn();
jest.mock('next/server', () => ({
    NextResponse: {
        json: (...args: [any, { status?: number; headers?: Record<string, string> }?]) => {
            mockJson(...args);
            return {
                status: args[1]?.status || 200,
                json: () => Promise.resolve(args[0])
            };
        }
    }
}));

// Mock Request
class MockRequest extends Request {
    private mockJson: any;

    constructor(input: string | URL, init?: RequestInit & { json?: any }) {
        const { json, ...restInit } = init || {};
        super(input, restInit);
        this.mockJson = json;
    }

    async json() {
        return this.mockJson;
    }
}

// Define the type for our global items array
declare global {
    var items: z.infer<typeof BasketItemSchema>[];
}

describe('Checkout API', () => {
    const mockItem = {
        id: 1,
        name: 'Test Item',
        category: 'Breakfast',
        price: 10.99,
        quantity: 1,
        ingredients: ['ingredient1', 'ingredient2'],
        image: 'https://example.com/image.jpg',
        rating: 4.5,
        reviews: 10
    };

    beforeEach(() => {
        // Reset the items array and mocks before each test
        global.items = [];
        mockJson.mockClear();
    });

    describe('GET /api/checkout', () => {
        it('should return all items', async () => {
            // Add test items
            global.items = [
                mockItem,
                { ...mockItem, id: 2, name: 'Test Item 2', price: 20.99 }
            ];

            const request = new MockRequest('http://localhost:3000/api/checkout');
            await GET(request);
            
            expect(mockJson).toHaveBeenCalledWith(
                { items: global.items },
                expect.objectContaining({ status: 200 })
            );
        });

        it('should filter items by category', async () => {
            // Add test items
            global.items = [
                mockItem,
                { ...mockItem, id: 2, category: 'Dinner' }
            ];

            const request = new MockRequest('http://localhost:3000/api/checkout?filterBy=Breakfast');
            await GET(request);
            
            expect(mockJson).toHaveBeenCalledWith(
                { items: [mockItem] },
                expect.objectContaining({ status: 200 })
            );
        });

        it('should sort items by price', async () => {
            global.items = [
                { ...mockItem, id: 1, price: 20 },
                { ...mockItem, id: 2, price: 10 }
            ];

            const request = new MockRequest('http://localhost:3000/api/checkout?sortOrder=asc');
            await GET(request);
            
            expect(mockJson).toHaveBeenCalledWith(
                {
                    items: [
                        { ...mockItem, id: 2, price: 10 },
                        { ...mockItem, id: 1, price: 20 }
                    ]
                },
                expect.objectContaining({ status: 200 })
            );
        });
    });

    describe('POST /api/checkout', () => {
        it('should add a new item', async () => {
            const request = new MockRequest('http://localhost:3000/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                json: mockItem
            });

            await POST(request);
            
            expect(mockJson).toHaveBeenCalledWith(
                { items: [expect.objectContaining({ name: mockItem.name })] },
                expect.objectContaining({ status: 200 })
            );
        });

        it('should validate required fields', async () => {
            const invalidItem = { ...mockItem } as Partial<typeof mockItem>;
            delete invalidItem.name;

            const request = new MockRequest('http://localhost:3000/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                json: invalidItem
            });

            await POST(request);
            
            expect(mockJson).toHaveBeenCalledWith(
                expect.objectContaining({ error: 'Invalid item data' }),
                expect.objectContaining({ status: 400 })
            );
        });
    });

    describe('PATCH /api/checkout', () => {
        it('should update an existing item', async () => {
            // Add an item first
            global.items = [mockItem];

            const updates = {
                id: 1,
                quantity: 2
            };

            const request = new MockRequest('http://localhost:3000/api/checkout', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                json: updates
            });

            await PATCH(request);
            
            expect(mockJson).toHaveBeenCalledWith(
                {
                    items: [expect.objectContaining({ id: 1, quantity: 2 })]
                },
                expect.objectContaining({ status: 200 })
            );
        });

        it('should return 404 for non-existent item', async () => {
            const updates = {
                id: 999,
                quantity: 2
            };

            const request = new MockRequest('http://localhost:3000/api/checkout', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                json: updates
            });

            await PATCH(request);
            
            expect(mockJson).toHaveBeenCalledWith(
                expect.objectContaining({ error: 'Item not found' }),
                expect.objectContaining({ status: 404 })
            );
        });
    });

    describe('DELETE /api/checkout', () => {
        it('should delete an existing item', async () => {
            // Add an item first
            global.items = [mockItem];

            const request = new MockRequest('http://localhost:3000/api/checkout?id=1', {
                method: 'DELETE'
            });

            await DELETE(request);
            
            expect(mockJson).toHaveBeenCalledWith(
                { items: [] },
                expect.objectContaining({ status: 200 })
            );
        });

        it('should return 404 for non-existent item', async () => {
            const request = new MockRequest('http://localhost:3000/api/checkout?id=999', {
                method: 'DELETE'
            });

            await DELETE(request);
            
            expect(mockJson).toHaveBeenCalledWith(
                expect.objectContaining({ error: 'Item not found' }),
                expect.objectContaining({ status: 404 })
            );
        });
    });
}); 