import React, { useState, useEffect } from 'react';
import { VisionTab } from './components/VisionTab';
import { GenerateTab } from './components/GenerateTab';
import { EditTab } from './components/EditTab';
import { PresetTab } from './components/PresetTab';
import { HistoryTab } from './components/HistoryTab';
import { EyeIcon } from './components/icons/EyeIcon';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { PencilIcon } from './components/icons/PencilIcon';
import { BookmarkIcon } from './components/icons/BookmarkIcon';
import { HistoryIcon } from './components/icons/HistoryIcon';

type Tab = 'vision' | 'generate' | 'edit' | 'presets' | 'history';

export interface Preset {
  title: string;
  prompt: string;
}

export interface HistoryItem {
  id: string;
  type: 'vision' | 'generate' | 'edit';
  timestamp: number;
  prompt: string;
  inputImages?: string[];
  outputImages?: string[];
  outputText?: string;
}

const initialPresets: Preset[] = [
  { title: 'Vintage', prompt: 'Make it vintage' },
  { title: 'Cinematic', prompt: 'Add cinematic lighting' },
  { title: 'High Contrast', prompt: 'Increase contrast' },
  { title: 'B&W', prompt: 'Convert to black and white' },
  { title: 'Dreamy', prompt: 'Add a dreamlike glow' },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('edit');
  const [presets, setPresets] = useState<Preset[]>(() => {
    try {
      const savedPresets = localStorage.getItem('gemini-image-presets');
      if (savedPresets) {
        const parsedPresets = JSON.parse(savedPresets);
        if (Array.isArray(parsedPresets) && parsedPresets.every(item => 
          typeof item === 'object' && item !== null && 'title' in item && 'prompt' in item
        )) {
          return parsedPresets;
        }
      }
      return initialPresets;
    } catch (error) {
      console.error("Could not parse presets from localStorage", error);
      return initialPresets;
    }
  });

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const savedHistory = localStorage.getItem('gemini-image-history');
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        if (Array.isArray(parsedHistory)) {
          return parsedHistory;
        }
      }
      return [];
    } catch (error) {
      console.error("Could not parse history from localStorage", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('gemini-image-presets', JSON.stringify(presets));
    } catch (error)
      {
      console.error("Could not save presets to localStorage", error);
    }
  }, [presets]);

  useEffect(() => {
    try {
      localStorage.setItem('gemini-image-history', JSON.stringify(history));
    } catch (error) {
      console.error("Could not save history to localStorage", error);
    }
  }, [history]);

  const addToHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newHistoryItem: HistoryItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    setHistory(prev => [newHistoryItem, ...prev]);
  };


  const renderTabContent = () => {
    switch (activeTab) {
      case 'vision':
        return <VisionTab addToHistory={addToHistory} />;
      case 'generate':
        return <GenerateTab addToHistory={addToHistory} />;
      case 'edit':
        return <EditTab presets={presets} setPresets={setPresets} addToHistory={addToHistory} />;
      case 'presets':
        return <PresetTab presets={presets} setPresets={setPresets} />;
      case 'history':
        return <HistoryTab history={history} setHistory={setHistory} />;
      default:
        return null;
    }
  };

  const TabButton = ({ tabName, label, icon }: { tabName: Tab; label: string; icon: React.ReactElement }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`flex flex-shrink-0 items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 ${
        activeTab === tabName
          ? 'bg-gray-800 text-blue-400 border-b-2 border-blue-400'
          : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
      }`}
    >
      {icon}
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Gemini Vision & Image Studio
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            Explore the creative power of multimodal AI.
          </p>
        </header>

        <main>
          <div className="border-b border-gray-700">
            <nav className="flex -mb-px space-x-2 sm:space-x-4 overflow-x-auto no-scrollbar" aria-label="Tabs">
              <TabButton tabName="edit" label="Edit" icon={<PencilIcon />} />
              <TabButton tabName="generate" label="Generate" icon={<SparklesIcon />} />
              <TabButton tabName="vision" label="Vision" icon={<EyeIcon />} />
              <TabButton tabName="presets" label="Presets" icon={<BookmarkIcon />} />
              <TabButton tabName="history" label="History" icon={<HistoryIcon />} />
            </nav>
          </div>
          <div className="mt-8">
            {renderTabContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;