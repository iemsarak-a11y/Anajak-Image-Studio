import React, { useState, useCallback, useEffect } from 'react';
import { generateTextFromImageAndText, fileToDataUrl } from '../services/geminiService';
import { ImageUploader } from './ImageUploader';
import { Loader } from './Loader';
import { SparklesIcon } from './icons/SparklesIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { HistoryItem } from '../App';

interface VisionTabProps {
  addToHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
}

export const VisionTab: React.FC<VisionTabProps> = ({ addToHistory }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  const handleImageChange = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setImageFile(file);
      setImageUrl(URL.createObjectURL(file));
      setError('');
      setResponse('');
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!prompt || !imageFile) {
      setError('Please provide both an image and a prompt.');
      return;
    }
    setLoading(true);
    setError('');
    setResponse('');
    try {
      const result = await generateTextFromImageAndText(prompt, imageFile);
      const inputImageUrl = await fileToDataUrl(imageFile);
      addToHistory({
        type: 'vision',
        prompt,
        inputImages: [inputImageUrl],
        outputText: result,
      });
      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [prompt, imageFile, addToHistory]);

  const handleDownloadResponse = () => {
    if (!response) return;
    const blob = new Blob([response], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-vision-response.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="flex flex-col space-y-6">
        <ImageUploader onImagesChange={handleImageChange} imageUrl={imageUrl} />
        <div>
          <label htmlFor="prompt-vision" className="block text-sm font-medium text-gray-300 mb-2">
            Your Prompt
          </label>
          <textarea
            id="prompt-vision"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., What is happening in this image?"
            className="w-full h-32 p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            disabled={loading}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading || !prompt || !imageFile}
          className="w-full inline-flex justify-center items-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900 disabled:bg-gray-500 disabled:cursor-not-allowed transition"
        >
          {loading ? <Loader /> : <SparklesIcon />}
          Analyze Image
        </button>
      </div>
      <div className="bg-gray-800 rounded-lg p-6 min-h-[300px] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-200">AI Response</h3>
          {response && (
            <button
              onClick={handleDownloadResponse}
              className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-600 text-xs font-medium rounded-md shadow-sm text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900 transition"
              aria-label="Download response"
            >
              <DownloadIcon className="h-4 w-4" />
              <span>Download</span>
            </button>
          )}
        </div>
        {loading && <div className="flex-grow flex items-center justify-center"><Loader /></div>}
        {error && <div className="text-red-400 bg-red-900/50 p-4 rounded-md">{error}</div>}
        {response && <div className="text-gray-300 whitespace-pre-wrap overflow-y-auto flex-grow">{response}</div>}
        {!loading && !error && !response && (
          <div className="flex-grow flex items-center justify-center text-gray-500">
            The analysis of your image will appear here.
          </div>
        )}
      </div>
    </div>
  );
};
