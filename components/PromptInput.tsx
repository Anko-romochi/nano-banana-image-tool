
import React from 'react';

interface PromptInputProps {
    label: string;
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
}

export const PromptInput: React.FC<PromptInputProps> = ({ label, placeholder, value, onChange }) => {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={3}
                className="w-full bg-[#0D1117] border border-gray-600 rounded-md p-2 text-sm text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
        </div>
    );
};
