import React, { useState } from 'react';

interface FileUploadProps {
    onUploadComplete: (url: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete }) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            const data = await response.json();
            onUploadComplete(data.url);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="file-upload">
            <label className="block mb-2">
                <span className="text-gray-700">Upload File</span>
                <input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="block w-full mt-1"
                />
            </label>
            {uploading && <p className="text-blue-500">Uploading...</p>}
            {error && <p className="text-red-500">{error}</p>}
        </div>
    );
};

export default FileUpload; 