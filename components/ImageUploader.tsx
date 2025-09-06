
import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons';

interface ImageUploaderProps {
    label: string;
    borderColor?: string;
    onFileChange: (file: File | null) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ label, borderColor = 'border-gray-600', onFileChange }) => {
    const [preview, setPreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFile = useCallback((file: File | null) => {
        if (file && ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            onFileChange(file);
        } else {
            setPreview(null);
            onFileChange(null);
            if (file) alert('Invalid file type. Please upload JPEG, PNG, or WebP.');
        }
    }, [onFileChange]);

    const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const containerClasses = `relative flex flex-col items-center justify-center p-4 w-full h-40 rounded-md border-2 border-dashed transition-colors duration-300 ${borderColor} ${isDragging ? 'bg-blue-900/50' : 'bg-[#0D1117] hover:bg-gray-800/50'}`;

    return (
        <label
            className={containerClasses}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {preview ? (
                <img src={preview} alt="Preview" className="w-full h-full object-contain rounded-md" />
            ) : (
                <div className="text-center text-gray-400">
                    <UploadIcon className="mx-auto h-8 w-8 text-gray-500 mb-2" />
                    <p className="text-sm">Click to upload or drag and drop</p>
                    <p className="text-xs mt-1">{label}</p>
                </div>
            )}
            <input
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleChange}
            />
        </label>
    );
};
