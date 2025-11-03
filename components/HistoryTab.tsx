import React from 'react';
import { HistoryItem } from '../App';
import { HistoryIcon } from './icons/HistoryIcon';
import { TrashIcon } from './icons/TrashIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface HistoryTabProps {
  history: HistoryItem[];
  setHistory: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
}

function formatRelativeTime(timestamp: number): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - timestamp) / 1000);

  if (seconds < 30) return "Just now";
  
  const intervals: { [key: string]: number } = {
    year: 31536000,
    month: 2592000,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const key in intervals) {
    const interval = Math.floor(seconds / intervals[key]);
    if (interval >= 1) {
      return `${interval} ${key}${interval > 1 ? 's' : ''} ago`;
    }
  }
  return "Just now";
}

const TYPE_MAP: Record<HistoryItem['type'], { title: string; color: string }> = {
  vision: { title: 'Vision Analysis', color: 'bg-blue-500' },
  generate: { title: 'Image Generation', color: 'bg-purple-500' },
  edit: { title: 'Image Edit', color: 'bg-green-500' },
};

const handleDownloadText = (text: string | undefined, filename: string) => {
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const handleDownloadImage = (imageUrl: string | undefined, filename: string) => {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

const DownloadableImage: React.FC<{ src: string; alt: string; type: 'generate' | 'edit'; index: number }> = ({ src, alt, type, index }) => (
  <div className="relative group w-24 h-24">
    <img src={src} className="w-full h-full object-cover rounded-md bg-black/20" alt={alt}/>
    <button
      onClick={() => handleDownloadImage(src, `ai-${type}-image-${index + 1}.png`)}
      className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-md"
      aria-label="Download image"
    >
      <DownloadIcon className="h-6 w-6 text-white" />
    </button>
  </div>
);


const HistoryItemCard: React.FC<{ item: HistoryItem }> = ({ item }) => {
  const { title, color } = TYPE_MAP[item.type];
  
  return (
    <div className="bg-gray-800/50 rounded-lg p-4 shadow-md overflow-hidden">
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className={`inline-block px-2 py-1 text-xs font-semibold text-white ${color} rounded-full`}>{title}</span>
          <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(item.timestamp)}</p>
        </div>
      </div>
      
      <p className="mb-3 p-2 bg-gray-900/50 rounded text-sm text-gray-300 italic">"{item.prompt}"</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {item.type === 'vision' && (
          <>
            <div>
              <p className="text-sm font-medium text-gray-400 mb-2">Input Image</p>
              <img src={item.inputImages?.[0]} className="w-full aspect-video object-contain rounded-md bg-black/20" alt="Input for vision analysis"/>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-gray-400">AI Response</p>
                {item.outputText && (
                  <button
                    onClick={() => handleDownloadText(item.outputText, `ai-vision-response.txt`)}
                    className="inline-flex items-center gap-1.5 px-2 py-1 border border-gray-600 text-xs font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-800 transition"
                    aria-label="Download response"
                  >
                    <DownloadIcon className="h-3 w-3" />
                    <span>Download</span>
                  </button>
                )}
              </div>
              <div className="w-full aspect-video bg-black/20 rounded-md p-2 text-xs text-gray-300 overflow-y-auto">
                {item.outputText || <span className="text-gray-500">No text response.</span>}
              </div>
            </div>
          </>
        )}

        {item.type === 'generate' && (
          <div className="sm:col-span-2">
            <p className="text-sm font-medium text-gray-400 mb-2">Generated Images</p>
            {item.outputImages && item.outputImages.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {item.outputImages.map((img, index) => (
                    <DownloadableImage key={index} src={img} alt={`Generated image ${index + 1}`} type="generate" index={index} />
                    ))}
                </div>
            ) : (
                <div className="text-gray-500 text-sm">No images were generated.</div>
            )}
          </div>
        )}

        {item.type === 'edit' && (
          <>
            <div>
              <p className="text-sm font-medium text-gray-400 mb-2">Original</p>
              <img src={item.inputImages?.[0]} className="w-full aspect-video object-contain rounded-md bg-black/20" alt="Original for edit"/>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400 mb-2">Edited</p>
                {item.outputImages && item.outputImages.length > 0 ? (
                    item.outputImages.length === 1 ? (
                        <div className="relative group w-full aspect-video">
                            <img src={item.outputImages[0]} className="w-full h-full object-contain rounded-md bg-black/20" alt="Edited result"/>
                            <button
                                onClick={() => handleDownloadImage(item.outputImages?.[0], `ai-edited-image.png`)}
                                className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-md"
                                aria-label="Download edited image"
                            >
                                <DownloadIcon className="h-6 w-6 text-white" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {item.outputImages.map((img, index) => (
                                <DownloadableImage key={index} src={img} alt={`Edited image ${index + 1}`} type="edit" index={index} />
                            ))}
                        </div>
                    )
                ) : (
                <div className="w-full aspect-video flex items-center justify-center bg-black/20 rounded-md text-gray-500 text-xs p-2">No edited image returned.</div>
                )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};


export const HistoryTab: React.FC<HistoryTabProps> = ({ history, setHistory }) => {
  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to delete all history? This action cannot be undone.')) {
      setHistory([]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <HistoryIcon className="h-8 w-8 text-blue-400" />
          <h2 className="text-2xl font-bold text-gray-100">Activity History</h2>
        </div>
        {history.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-gray-900 transition"
          >
            <TrashIcon className="h-4 w-4" />
            Clear History
          </button>
        )}
      </div>

      {history.length > 0 ? (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {history.map((item) => (
            <HistoryItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500 border-2 border-dashed border-gray-700 rounded-lg">
          <p>Your activity history is empty.</p>
          <p className="text-sm">Perform an action in another tab to see it here.</p>
        </div>
      )}
    </div>
  );
};