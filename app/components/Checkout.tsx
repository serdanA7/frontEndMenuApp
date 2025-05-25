"use client";

import React, { useState, useEffect, useMemo } from "react";
import Pagination from "../components/Pagination";
import ReviewPopup from "../components/ReviewPopup";
import Link from "next/link";
import { Bar, Pie } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import { faker } from '@faker-js/faker';
import { useCheckout } from "../hooks/useCheckout";
import { useWebSocket } from '../hooks/useWebSocket';
import FileUpload from './FileUpload';

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

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const tolerance = 0.5;

const CheckoutPage = () => {
    const {
        basket,
        menuItems,
        loading,
        error,
        fetchItems,
        addItem,
        updateItem,
        removeItem
    } = useCheckout();

    const [sortOrder, setSortOrder] = useState<string>("none");
    const [sortAlphabetically, setSortAlphabetically] = useState<string>("none");
    const [filterBy, setFilterBy] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [showReviewPopup, setShowReviewPopup] = useState(false);
    const [reviewItemId, setReviewItemId] = useState<number>(0);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [priceSegmentFilter, setPriceSegmentFilter] = useState<'none' | 'highest' | 'average' | 'lowest'>('none');
    const [isClient, setIsClient] = useState(false);
    const [editingIngredients, setEditingIngredients] = useState<{ [key: number]: string }>({});

    // Add WebSocket connection with generation control
    const { isConnected, isGenerating, toggleGeneration } = useWebSocket((message) => {
        if (message.type === 'new_item' && message.item) {
            // Add the new item to the basket
            addItem(message.item);
        }
    });

    // Set isClient on mount
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Initialize editing ingredients from basket items
    useEffect(() => {
        const initialIngredients = basket.reduce((acc, item) => {
            acc[item.id] = item.ingredients.join(", ");
            return acc;
        }, {} as { [key: number]: string });
        setEditingIngredients(initialIngredients);
    }, [basket]);

    const mostExpensive = useMemo(() => 
        basket.length > 0 ? Math.max(...basket.map(item => item.price)) : 0,
        [basket]
    );

    const leastExpensive = useMemo(() => 
        basket.length > 0 ? Math.min(...basket.map(item => item.price)) : 0,
        [basket]
    );

    const averagePrice = useMemo(() => 
        basket.length > 0 ? basket.reduce((total, item) => total + item.price, 0) / basket.length : 0,
        [basket]
    );

    const priceDistribution = useMemo(() => {
        const ranges = { "0-10": 0, "11-20": 0, "21-30": 0, "31-40": 0, "41+": 0 };
        basket.forEach((item) => {
            if (item.price <= 10) ranges["0-10"]++;
            else if (item.price <= 20) ranges["11-20"]++;
            else if (item.price <= 30) ranges["21-30"]++;
            else if (item.price <= 40) ranges["31-40"]++;
            else ranges["41+"]++;
        });
        return ranges;
    }, [basket]);

    const ratingDistribution = useMemo(() => {
        const ratings: { [key: string]: number } = { "1⭐": 0, "2⭐": 0, "3⭐": 0, "4⭐": 0, "5⭐": 0 };
        basket.forEach((item) => {
            const roundedRating = Math.round(item.rating);
            ratings[`${roundedRating}⭐`]++;
        });
        return ratings;
    }, [basket]);

    const categoryPopularity = useMemo(() => {
        const categoryCounts: Record<string, number> = {};
        let totalReviews = 0;

        basket.forEach((item) => {
            categoryCounts[item.category] = (categoryCounts[item.category] || 0) + item.reviews;
            totalReviews += item.reviews;
        });

        return { categoryCounts, totalReviews };
    }, [basket]);

    const chartData = useMemo(() => {
        if (!isClient || basket.length === 0) return {
            priceData: {
                labels: [],
                datasets: []
            },
            ratingData: {
                labels: [],
                datasets: []
            },
            categoryData: {
                labels: [],
                datasets: []
            }
        };

        const priceData = {
            labels: ['Low', 'Medium', 'High'],
            datasets: [{
                label: 'Price Distribution',
                data: [
                    basket.filter(item => item.price < averagePrice - 0.5).length,
                    basket.filter(item => Math.abs(item.price - averagePrice) <= 0.5).length,
                    basket.filter(item => item.price > averagePrice + 0.5).length
                ],
                backgroundColor: ['#4CAF50', '#FFC107', '#F44336']
            }]
        };

        const ratingData = {
            labels: ['1-2 ⭐', '2-3 ⭐', '3-4 ⭐', '4-5 ⭐'],
            datasets: [{
                label: 'Rating Distribution',
                data: [
                    basket.filter(item => item.rating >= 1 && item.rating < 2).length,
                    basket.filter(item => item.rating >= 2 && item.rating < 3).length,
                    basket.filter(item => item.rating >= 3 && item.rating < 4).length,
                    basket.filter(item => item.rating >= 4 && item.rating <= 5).length
                ],
                backgroundColor: ['#F44336', '#FFC107', '#4CAF50', '#2196F3']
            }]
        };

        const categoryData = {
            labels: ['Breakfast', 'Lunch', 'Dinner', 'Dessert'],
            datasets: [{
                label: 'Category Distribution',
                data: [
                    basket.filter(item => item.category === 'Breakfast').length,
                    basket.filter(item => item.category === 'Lunch').length,
                    basket.filter(item => item.category === 'Dinner').length,
                    basket.filter(item => item.category === 'Dessert').length
                ],
                backgroundColor: ['#2196F3', '#4CAF50', '#FFC107', '#F44336']
            }]
        };

        return { priceData, ratingData, categoryData };
    }, [basket, averagePrice, isClient]);

    const handleEditIngredients = async (id: number, newValue: string) => {
        try {
            // Update local state immediately
            setEditingIngredients(prev => ({
                ...prev,
                [id]: newValue
            }));
        } catch (error) {
            console.error('Error updating ingredients:', error);
        }
    };

    const handleSaveIngredients = async (id: number) => {
        try {
            const newIngredients = editingIngredients[id].split(",").map(ing => ing.trim()).filter(ing => ing);
            await updateItem(id, { ingredients: newIngredients });
        } catch (error) {
            console.error('Error saving ingredients:', error);
        }
    };

    const handlePriceSegmentClick = (segment: 'highest' | 'average' | 'lowest') => {
        setPriceSegmentFilter(priceSegmentFilter === segment ? 'none' : segment);
        setCurrentPage(1);
    };

    const filteredItems = useMemo(() => {
        // Always start with basket items only
        let items = [...basket];

        // Filter by price segment (only for basket items)
        if (priceSegmentFilter !== 'none') {
            const prices = basket.map(item => item.price);
            const avgPrice = prices.length > 0 
                ? prices.reduce((sum, price) => sum + price, 0) / prices.length 
                : 0;
            
            items = items.filter(item => {
                if (priceSegmentFilter === 'highest') {
                    return item.price === mostExpensive;
                } else if (priceSegmentFilter === 'average') {
                    return Math.abs(item.price - avgPrice) <= 0.5;
                } else if (priceSegmentFilter === 'lowest') {
                    return item.price === leastExpensive;
                }
                return true;
            });
        }

        // Filter by category
        if (filterBy !== 'all') {
            items = items.filter(item => item.category === filterBy);
        }

        // Filter by search query
        if (debouncedSearchQuery) {
            items = items.filter(item => 
                item.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                item.category.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
            );
        }

        // Sort by price
        if (sortOrder !== 'none') {
            items.sort((a, b) => {
                if (sortOrder === 'asc') {
                    return a.price - b.price;
                } else {
                    return b.price - a.price;
                }
            });
        }

        // Sort alphabetically
        if (sortAlphabetically !== 'none') {
            items.sort((a, b) => {
                if (sortAlphabetically === 'az') {
                    return a.name.localeCompare(b.name);
                } else {
                    return b.name.localeCompare(a.name);
                }
            });
        }

        return items;
    }, [basket, priceSegmentFilter, filterBy, debouncedSearchQuery, sortOrder, sortAlphabetically, mostExpensive, leastExpensive]);

    const paginatedItems = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredItems.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredItems, currentPage, itemsPerPage]);

    // Add debounce effect for search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300); // 300ms delay

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Update the fetchData effect to use debouncedSearchQuery
    useEffect(() => {
        const fetchData = async () => {
            await fetchItems({
                sortOrder: sortOrder !== 'none' ? sortOrder : undefined,
                sortAlphabetically: sortAlphabetically !== 'none' ? sortAlphabetically : undefined,
                filterBy: filterBy !== 'all' ? filterBy : undefined,
                searchQuery: debouncedSearchQuery || undefined,
                priceSegment: priceSegmentFilter !== 'none' ? priceSegmentFilter : undefined
            });
        };
        
        fetchData();
    }, [sortOrder, sortAlphabetically, filterBy, debouncedSearchQuery]);

    const isApproximatelyEqual = (price: number, avgPrice: number) => {
        return Math.abs(price - avgPrice) <= tolerance;
    };

    const getBackgroundColor = (price: number) => {
        if (basket.length === 0) return '';
        if (price === mostExpensive) return 'bg-red-200 text-black';
        if (price === leastExpensive) return 'bg-green-200 text-black';
        if (Math.abs(price - averagePrice) <= 0.5) return 'bg-yellow-200 text-black';
        return '';
    };

    const handleIncreaseQuantity = async (id: number) => {
        try {
            const item = basket.find(item => item.id === id);
            if (item) {
                await updateItem(id, { quantity: item.quantity + 1 });
            }
        } catch (error) {
            console.error('Error increasing quantity:', error);
        }
    };

    const handleDecreaseQuantity = async (id: number) => {
        try {
            const item = basket.find(item => item.id === id);
            if (item) {
                if (item.quantity > 1) {
                    await updateItem(id, { quantity: item.quantity - 1 });
                } else {
                    await removeItem(id);
                }
            }
        } catch (error) {
            console.error('Error decreasing quantity:', error);
        }
    };

    const handleAddItemToBasket = async (item: BasketItem) => {
        try {
            await addItem({ ...item, quantity: 1 });
        } catch (error) {
            console.error('Error adding item to basket:', error);
        }
    };

    const calculateTotalPrice = () => {
        return basket.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleAddReview = (id: number) => {
        setReviewItemId(id);
        setShowReviewPopup(true);
    };

    const handleReviewSubmit = async (id: number, review: { rating: number, comment: string }) => {
        try {
            const item = basket.find(item => item.id === id);
            if (item) {
                const newRating = (item.rating * item.reviews + review.rating) / (item.reviews + 1);
                await updateItem(id, {
                    rating: newRating,
                    reviews: item.reviews + 1
                });
            }
            setShowReviewPopup(false);
        } catch (error) {
            console.error('Error submitting review:', error);
        }
    };

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

    const handleFileUpload = (url: string) => {
        // You can handle the uploaded file URL here
        console.log('File uploaded:', url);
    };

    if (loading) {
        return <div className="p-8">Loading...</div>;
    }

    if (error) {
        return <div className="p-8 text-red-500">Error: {error}</div>;
    }

    return (
        <div className="checkout-container p-8">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Your Order</h1>
                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
                        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                    </div>
                    {isClient && (
                        <button
                            onClick={toggleGeneration}
                            className={`px-4 py-2 rounded text-white font-semibold ${
                                isGenerating ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                            }`}
                        >
                            {isGenerating ? "Stop Generating Items" : "Start Generating Items"}
                        </button>
                    )}
                </div>
            </div>

            {/* Add File Upload Component */}
            <div className="mb-4 p-4 border rounded">
                <h2 className="text-lg font-semibold mb-2">Upload Files</h2>
                <FileUpload onUploadComplete={handleFileUpload} />
            </div>

            {/* Charts Section */}
            {isClient && chartData && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* Price Distribution Chart */}
                    <div className="bg-white p-3 shadow rounded h-48">
                        <h2 className="text-sm font-semibold mb-1 text-black">Price Distribution</h2>
                        <div className="h-40">
                            <Bar data={chartData.priceData} options={{ 
                                responsive: true, 
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        display: false
                                    }
                                }
                            }} />
                        </div>
                    </div>

                    {/* Rating Distribution Chart */}
                    <div className="bg-white p-3 shadow rounded h-48">
                        <h2 className="text-sm font-semibold mb-1 text-black">Rating Distribution</h2>
                        <div className="h-40">
                            <Pie data={chartData.ratingData} options={{ 
                                responsive: true, 
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'right' as const,
                                        labels: {
                                            boxWidth: 10,
                                            font: {
                                                size: 10
                                            }
                                        }
                                    }
                                }
                            }} />
                        </div>
                    </div>

                    {/* Category Distribution Chart */}
                    <div className="bg-white p-3 shadow rounded h-48">
                        <h2 className="text-sm font-semibold mb-1 text-black">Category Distribution</h2>
                        <div className="h-40">
                            <Bar data={chartData.categoryData} options={{ 
                                responsive: true, 
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        display: false
                                    }
                                }
                            }} />
                        </div>
                    </div>
                </div>
            )}

            {/* Price Indicators */}
            <div className="flex gap-4 mb-4">
                <div 
                    data-testid="highest-price-indicator"
                    className={`flex-1 p-4 rounded bg-red-200 text-black cursor-pointer transition-opacity hover:opacity-100 ${priceSegmentFilter === 'highest' ? 'opacity-100' : 'opacity-70'}`}
                    onClick={() => handlePriceSegmentClick('highest')}
                >
                    <div className="font-semibold">Highest in Basket</div>
                    <div>${mostExpensive.toFixed(2)}</div>
                </div>
                <div 
                    data-testid="average-price-indicator"
                    className={`flex-1 p-4 rounded bg-yellow-200 text-black cursor-pointer transition-opacity hover:opacity-100 ${priceSegmentFilter === 'average' ? 'opacity-100' : 'opacity-70'}`}
                    onClick={() => handlePriceSegmentClick('average')}
                >
                    <div className="font-semibold">Average in Basket</div>
                    <div>${averagePrice.toFixed(2)}</div>
                </div>
                <div 
                    data-testid="lowest-price-indicator"
                    className={`flex-1 p-4 rounded bg-green-200 text-black cursor-pointer transition-opacity hover:opacity-100 ${priceSegmentFilter === 'lowest' ? 'opacity-100' : 'opacity-70'}`}
                    onClick={() => handlePriceSegmentClick('lowest')}
                >
                    <div className="font-semibold">Cheapest in Basket</div>
                    <div>${leastExpensive.toFixed(2)}</div>
                </div>
            </div>

            {/* Update the search input */}
            <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => {
                    e.preventDefault();
                    setSearchQuery(e.target.value);
                }}
                className="w-full p-2 border rounded mb-4"
            />

            <div className="mt-4 flex gap-4">
                <select
                    onChange={(e) => setSortOrder(e.target.value)}
                    value={sortOrder}
                    className="border p-2 rounded bg-blue-500 text-white cursor-pointer"
                    aria-label="Sort by Price"
                >
                    <option value="none">Sort by Price</option>
                    <option value="asc">Lowest to Highest</option>
                    <option value="desc">Highest to Lowest</option>
                </select>

                <select
                    onChange={(e) => setSortAlphabetically(e.target.value)}
                    value={sortAlphabetically}
                    className="border p-2 rounded bg-purple-500 text-white cursor-pointer"
                    aria-label="Sort Alphabetically"
                >
                    <option value="none">Sort Alphabetically</option>
                    <option value="az">A - Z</option>
                    <option value="za">Z - A</option>
                </select>

                <select
                    onChange={(e) => setFilterBy(e.target.value)}
                    value={filterBy}
                    className="border p-2 rounded bg-green-500 text-white cursor-pointer"
                    aria-label="Filter by Category"
                >
                    <option value="all">All Categories</option>
                    <option value="Breakfast">Breakfast</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Dessert">Dessert</option>
                </select>

                <select
                    onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                    }}
                    value={itemsPerPage}
                    className="border p-2 rounded bg-orange-500 text-white cursor-pointer"
                    aria-label="Items per Page"
                >
                    <option value="1">1 items</option>
                    <option value="2">2 items</option>
                    <option value="3">3 items</option>
                    <option value="4">4 items</option>
                    <option value="5">5 items</option>
                    <option value="10">10 items</option>
                </select>
            </div>

            <div className="basket mt-4">
                {paginatedItems.map((item) => (
                    <div
                        key={item.id}
                        className={`basket-item flex items-center gap-4 p-4 border rounded ${getBackgroundColor(item.price)}`}
                        data-testid="basket-item"
                    >
                        <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded" />
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold">
                                {item.name} - ${(item.price * item.quantity).toFixed(2)} | {item.rating}⭐ ({item.reviews} reviews)
                            </h3>
                            <p className="text-sm text-gray-600">Category: {item.category}</p>
                            <div className="mt-2 flex gap-2">
                                <input
                                    type="text"
                                    value={editingIngredients[item.id] || ''}
                                    onChange={(e) => handleEditIngredients(item.id, e.target.value)}
                                    onBlur={() => handleSaveIngredients(item.id)}
                                    className="border p-2 flex-1 rounded"
                                    placeholder="Enter ingredients separated by commas"
                                />
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <button
                                    className="bg-red-500 text-white px-2 py-1 rounded cursor-pointer decrease-btn"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleDecreaseQuantity(item.id);
                                    }}
                                >
                                    -
                                </button>
                                <span>{item.quantity}</span>
                                <button
                                    className="bg-green-500 text-white px-2 py-1 rounded cursor-pointer increase-btn"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleIncreaseQuantity(item.id);
                                    }}
                                >
                                    +
                                </button>
                                <button
                                    className="bg-blue-500 text-white px-4 py-1 rounded mt-2 cursor-pointer"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleAddReview(item.id);
                                    }}
                                >
                                    Add Review
                                </button>
                                <button
                                    className="bg-red-500 text-white px-4 py-1 rounded mt-2 cursor-pointer"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        removeItem(item.id);
                                    }}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />

            <h2 className="text-xl font-bold mt-6">Menu Items</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {menuItems.map((item) => (
                    <div key={item.id} className="menu-item flex flex-col p-4 border rounded">
                        <img src={item.image} alt={item.name} className="w-full h-48 object-cover rounded mb-2" />
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold">{item.name} - ${item.price.toFixed(2)}</h3>
                            <p className="text-sm text-gray-600">Category: {item.category}</p>
                            <p className="text-sm text-gray-600">Rating: {item.rating}⭐ ({item.reviews} reviews)</p>
                            <button
                                onClick={() => handleAddItemToBasket(item)}
                                className="bg-blue-500 text-white px-4 py-1 rounded mt-2 cursor-pointer w-full"
                            >
                                Add to Basket
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <h2 className="text-xl font-bold mt-4">Total: ${calculateTotalPrice()}</h2>
            <button className="checkout-btn bg-blue-500 text-white px-6 py-2 rounded mt-4">Checkout</button>

            {showReviewPopup && (
                <ReviewPopup
                    itemId={reviewItemId}
                    onClose={() => setShowReviewPopup(false)}
                    onSubmit={handleReviewSubmit}
                />
            )}

        </div>
    );
};

export default CheckoutPage;