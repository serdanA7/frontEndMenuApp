import React, { useState } from 'react';

interface ReviewPopupProps {
    itemId: number;
    onClose: () => void;
    onSubmit: (itemId: number, review: { rating: number; comment: string }) => void;
}

const ReviewPopup: React.FC<ReviewPopupProps> = ({ itemId, onClose, onSubmit }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');

    const handleSubmit = () => {
        onSubmit(itemId, { rating, comment });
    };

    return (
        <div className="review-popup fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-black p-8 rounded shadow-lg">
                <h2 className="text-xl text-white font-bold mb-4">Add Review</h2>
                <div className="mb-4">
                    <label className="block mb-2 text-white">Rating</label>
                    <input
                        type="number"
                        value={rating}
                        onChange={(e) => setRating(Number(e.target.value))}
                        className="bg-white text-black border-white p-2 rounded w-full"
                        min="1"
                        max="5"
                    />
                </div>
                <div className="mb-4">
                    <label className="block mb-2 text-white">Comment</label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="bg-white text-black border-white p-2 rounded w-full"
                    />
                </div>
                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="bg-gray-500 text-black px-4 py-2 rounded">Cancel</button>
                    <button onClick={handleSubmit} className="bg-blue-500 text-white px-4 py-2 rounded">Submit</button>
                </div>
            </div>
        </div>
    );
};

export default ReviewPopup;