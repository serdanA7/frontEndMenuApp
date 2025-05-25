"use client";

import React from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

interface ChartData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor: string[];
    }[];
}

interface ChartsProps {
    priceData: ChartData;
    ratingData: ChartData;
    categoryData: ChartData;
}

const Charts: React.FC<ChartsProps> = ({ priceData, ratingData, categoryData }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Price Distribution Chart */}
            <div className="bg-white p-3 shadow rounded h-48">
                <h2 className="text-sm font-semibold mb-1 text-black">Price Distribution</h2>
                <div className="h-40">
                    <Bar data={priceData} options={{ 
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
                    <Pie data={ratingData} options={{ 
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
                    <Bar data={categoryData} options={{ 
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
    );
};

export default Charts;
