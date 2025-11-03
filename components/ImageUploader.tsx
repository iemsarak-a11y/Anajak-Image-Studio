import React, { useCallback } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface ImageUploaderProps {
  onImagesChange: (files: File[]) => void;
  className?: string;
  imageUrl?: string | null;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImagesChange, className, imageUrl }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      onImagesChange(Array.from(event.target.files));
      // Reset input value to allow re-uploading the same file(s)
      event.target.value = '';
    }
  };

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      onImagesChange(Array.from(event.dataTransfer.files));
    }
  }, [onImagesChange]);

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div
      className={`relative w-full aspect-video bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center text-gray-400 hover:border-blue-500 hover:bg-gray-800/25 transition-all duration-300 ${className}`}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        id="file-upload"
      />
      {imageUrl ? (
        <>
          <img src={imageUrl} alt="Uploaded preview" className="w-full h-full object-contain rounded-lg p-2" />
          <label htmlFor="file-upload" className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
            <span className="text-white font-semibold">Change Image</span>
          </label>
        </>
      ) : (
        <label htmlFor="file-upload" className="text-center cursor-pointer p-4">
          <UploadIcon className="mx-auto h-12 w-12 text-gray-500" />
          <p className="mt-2">Drag &amp; drop image(s) here</p>
          <p>or <span className="text-blue-400 font-semibold">click to upload</span></p>
        </label>
      )}
    </div>
  );
};
