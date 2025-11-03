import React, { useState, useCallback, useEffect } from 'react';
import { editImageWithText, fileToDataUrl } from '../services/geminiService';
import { ImageUploader } from './ImageUploader';
import { Loader } from './Loader';
import { PencilIcon } from './icons/PencilIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { PlusIcon } from './icons/PlusIcon';
import { XIcon } from './icons/XIcon';
import { CheckIcon } from './icons/CheckIcon';
import { Preset, HistoryItem } from '../App';

interface EditTabProps {
  presets: Preset[];
  setPresets: React.Dispatch<React.SetStateAction<Preset[]>>;
  addToHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
}

interface UploadedImage {
  id: string;
  file: File;
  url: string;
}

interface EditResult {
  originalUrl: string;
  editedUrls: string[];
  selectedEditedUrl: string | null;
  error?: string;
}

export const EditTab: React.FC<EditTabProps> = ({ presets, setPresets, addToHistory }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());
  const [editResults, setEditResults] = useState<Map<string, EditResult>>(new Map());
  const [loading, setLoading] = useState<boolean>(false);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    return () => {
      uploadedImages.forEach(img => URL.revokeObjectURL(img.url));
    };
  }, [uploadedImages]);

  const handleImagesChange = (files: File[]) => {
    const newImages: UploadedImage[] = files
      .filter(file => !uploadedImages.some(img => img.file.name === file.name && img.file.size === file.size))
      .map(file => ({
        id: crypto.randomUUID(),
        file,
        url: URL.createObjectURL(file),
      }));

    if (newImages.length > 0) {
      setUploadedImages(prev => [...prev, ...newImages]);
    }
  };

  const handleRemoveImage = (e: React.MouseEvent, idToRemove: string) => {
    e.stopPropagation(); 
    setUploadedImages(prev => {
        const imageToRemove = prev.find(img => img.id === idToRemove);
        if (imageToRemove) {
            URL.revokeObjectURL(imageToRemove.url);
        }
        return prev.filter(img => img.id !== idToRemove);
    });
    setSelectedImageIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(idToRemove);
        return newSet;
    });
  };

  const handleClearAllImages = () => {
    uploadedImages.forEach(img => URL.revokeObjectURL(img.url));
    setUploadedImages([]);
    setSelectedImageIds(new Set());
  }

  const handleToggleSelection = (id: string) => {
    setSelectedImageIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => setSelectedImageIds(new Set(uploadedImages.map(img => img.id)));
  const handleDeselectAll = () => setSelectedImageIds(new Set());

  const handleSubmit = useCallback(async () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || selectedImageIds.size === 0) {
      setError('Please select at least one image and provide editing instructions.');
      return;
    }

    setLoading(true);
    setError('');
    setEditResults(new Map());
    setProgressMessage('Preparing to edit...');

    const selectedImages = uploadedImages.filter(img => selectedImageIds.has(img.id));
    const newResults = new Map<string, EditResult>();
    const total = selectedImages.length;

    for (let i = 0; i < total; i++) {
        const image = selectedImages[i];
        setProgressMessage(`Editing image ${i + 1} of ${total}: ${image.file.name}`);
        try {
            const resultUrls = await editImageWithText(trimmedPrompt, image.file);
            const originalDataUrl = await fileToDataUrl(image.file);
            addToHistory({
              type: 'edit',
              prompt: trimmedPrompt,
              inputImages: [originalDataUrl],
              outputImages: resultUrls,
            });
            newResults.set(image.id, {
                originalUrl: image.url,
                editedUrls: resultUrls,
                selectedEditedUrl: resultUrls[0] || null,
            });
        } catch (err) {
            newResults.set(image.id, {
                originalUrl: image.url,
                editedUrls: [],
                selectedEditedUrl: null,
                error: err instanceof Error ? err.message : 'An unknown error occurred',
            });
        }
    }

    setEditResults(newResults);
    setLoading(false);
    setProgressMessage('');
  }, [prompt, selectedImageIds, uploadedImages, addToHistory]);
  
  const handleDownloadImage = (imageUrl: string | null) => {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = 'tac-image.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSaveAsPreset = () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) return;

    const title = window.prompt('Enter a title for this preset:');
    if (!title || !title.trim()) return;

    const trimmedTitle = title.trim();

    if (presets.some(p => p.title.toLowerCase() === trimmedTitle.toLowerCase())) {
      alert('A preset with this title already exists.');
      return;
    }

    if (presets.some(p => p.prompt === trimmedPrompt)) {
      alert('A preset with these instructions already exists.');
      return;
    }

    setPresets(prevPresets => [{ title: trimmedTitle, prompt: trimmedPrompt }, ...prevPresets]);
  };

  const handleSelectEditedResultImage = (originalId: string, imageUrl: string) => {
    setEditResults(prev => {
      const newResults = new Map(prev);
      const result = newResults.get(originalId);
      if (result) {
        result.selectedEditedUrl = imageUrl;
        newResults.set(originalId, result);
      }
      return newResults;
    });
  };

  const canSavePreset = prompt.trim() && !presets.some(p => p.prompt === prompt.trim());
  const canSubmit = !loading && prompt.trim() && selectedImageIds.size > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="flex flex-col space-y-6">
        <ImageUploader onImagesChange={handleImagesChange} className="aspect-auto py-10" />

        {uploadedImages.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-gray-200">Your Images ({selectedImageIds.size}/{uploadedImages.length} selected)</h3>
              <div className="flex items-center gap-2">
                <button onClick={handleSelectAll} className="text-xs text-blue-400 hover:text-blue-300">Select All</button>
                <button onClick={handleDeselectAll} className="text-xs text-blue-400 hover:text-blue-300">Deselect All</button>
                <button onClick={handleClearAllImages} className="text-xs text-red-400 hover:text-red-300">Clear</button>
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-60 overflow-y-auto p-2 bg-gray-900/50 rounded-lg">
              {uploadedImages.map((image) => {
                const isSelected = selectedImageIds.has(image.id);
                return (
                  <button key={image.id} onClick={() => handleToggleSelection(image.id)} className={`relative aspect-square rounded-lg overflow-hidden group focus:outline-none transition-all duration-200 ${isSelected ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-green-500' : ''}`}>
                    <img src={image.url} alt={image.file.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-green-500 rounded-full p-1 text-white">
                        <CheckIcon className="h-3 w-3" />
                      </div>
                    )}
                    <button onClick={(e) => handleRemoveImage(e, image.id)} className="absolute bottom-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all" title="Remove image">
                      <XIcon className="w-3 h-3"/>
                    </button>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div>
          <label htmlFor="prompt-edit" className="block text-sm font-medium text-gray-300 mb-2">
            Editing Instructions
          </label>
          <div className="mb-3">
            <p className="text-xs text-gray-400 mb-2">Try a preset:</p>
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <button
                  key={p.title}
                  onClick={() => setPrompt(p.prompt)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors duration-200 ${
                    prompt === p.prompt
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <textarea
              id="prompt-edit"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Add a small, friendly robot next to the person."
              className="w-full h-32 p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              disabled={loading}
            />
            <button
              onClick={handleSaveAsPreset}
              disabled={!canSavePreset}
              className="absolute bottom-3 right-3 p-1.5 rounded-full bg-gray-700 text-gray-300 hover:bg-green-600 hover:text-white disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
              title="Save current prompt as a preset"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full inline-flex justify-center items-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:ring-offset-gray-900 disabled:bg-gray-500 disabled:cursor-not-allowed transition"
        >
          {loading ? <Loader /> : <PencilIcon />}
          Apply Edits {selectedImageIds.size > 0 ? `to ${selectedImageIds.size} Image(s)` : ''}
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 min-h-[400px] flex flex-col">
        {loading && (
          <div className="m-auto text-center">
            <Loader size="lg" />
            <p className="mt-4 text-gray-300">{progressMessage}</p>
          </div>
        )}
        {error && <div className="text-red-400 bg-red-900/50 p-4 rounded-md">{error}</div>}
        
        {!loading && editResults.size > 0 && (
          <>
            <h3 className="text-xl font-bold mb-4 text-gray-100">Edit Results</h3>
            <div className="space-y-6 overflow-y-auto flex-grow pr-2">
              {Array.from(editResults.entries()).map(([id, result]) => (
                <div key={id} className="p-4 bg-gray-700/50 rounded-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-400 mb-2">Original</p>
                      <img src={result.originalUrl} className="w-full aspect-video object-contain rounded-md bg-black/20" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-400 mb-2">Edited</p>
                      {result.error ? (
                        <div className="w-full aspect-video flex items-center justify-center bg-black/20 rounded-md text-red-400 text-xs p-2">{result.error}</div>
                      ) : result.editedUrls.length > 0 && result.selectedEditedUrl ? (
                          <div className="w-full flex flex-col items-center justify-center">
                            <div className="relative mb-2 w-full aspect-video">
                              <img src={result.selectedEditedUrl} alt="Selected edited by AI" className="w-full h-full rounded-lg shadow-lg object-contain bg-black/20" />
                              <button
                                onClick={() => handleDownloadImage(result.selectedEditedUrl)}
                                className="absolute top-2 right-2 inline-flex items-center gap-2 px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-black/50 hover:bg-black/75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:ring-offset-gray-800 transition"
                                aria-label="Download edited image"
                              >
                                <DownloadIcon className="h-4 w-4" />
                              </button>
                            </div>
                            {result.editedUrls.length > 1 && (
                              <div className="flex space-x-2 overflow-x-auto p-1 w-full justify-center">
                                {result.editedUrls.map((img, index) => (
                                  <img
                                    key={index}
                                    src={img}
                                    alt={`Edited thumbnail ${index + 1}`}
                                    className={`w-12 h-12 object-cover rounded-md cursor-pointer border-2 transition-all ${result.selectedEditedUrl === img ? 'border-green-500 scale-105' : 'border-transparent hover:border-gray-500'}`}
                                    onClick={() => handleSelectEditedResultImage(id, img)}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                      ) : (
                        <div className="w-full aspect-video flex items-center justify-center bg-black/20 rounded-md text-gray-500 text-xs p-2">No image returned.</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!loading && !error && editResults.size === 0 && (
          <div className="m-auto text-center text-gray-500">
            <p>Your edited images will appear here.</p>
            <p className="text-sm">Upload images, select them, and provide instructions.</p>
          </div>
        )}
      </div>
    </div>
  );
};
