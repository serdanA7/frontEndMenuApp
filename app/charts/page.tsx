"use client"; // Enable client-side navigation

import React from "react";
import Charts from "../components/Charts";

const defaultChartData = {
    labels: [],
    datasets: [{
        label: '',
        data: [],
        backgroundColor: []
    }]
};

export default function ChartsPage() {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Charts Overview</h1>
            <Charts 
                priceData={defaultChartData}
                ratingData={defaultChartData}
                categoryData={defaultChartData}
            />
        </div>
    );
}