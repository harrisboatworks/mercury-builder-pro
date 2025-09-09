"use client";
import { useRef } from 'react';
import { Camera, X } from 'lucide-react';

interface PhotoUploadProps {
  label: string;
  photo: string | null;
  onPhotoChange: (dataUrl: string | null) => void;
}

export default function PhotoUpload({ label, photo, onPhotoChange }: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onPhotoChange(result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    onPhotoChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </div>
      
      {photo ? (
        <div className="relative">
          <img 
            src={photo} 
            alt={label}
            className="w-full h-32 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
          />
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex flex-col items-center justify-center space-y-2 hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
        >
          <Camera className="w-6 h-6 text-slate-400" />
          <span className="text-sm p-quiet">Add photo</span>
        </button>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}