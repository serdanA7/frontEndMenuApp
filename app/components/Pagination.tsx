// src/app/components/Pagination.tsx
import React from 'react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    return (
        <div className="pagination flex justify-center items-center mt-4">
            <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className="bg-gray-300 text-black px-4 py-2 rounded-l disabled:opacity-50"
            >
                Previous
            </button>
            <span className="px-4">
                Page {currentPage} of {totalPages}
            </span>
            <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="bg-gray-300 text-black px-4 py-2 rounded-r disabled:opacity-50"
            >
                Next
            </button>
        </div>
    );
};

export default Pagination;