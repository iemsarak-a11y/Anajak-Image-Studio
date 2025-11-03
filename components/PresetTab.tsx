import React, { useState } from 'react';
import { PlusIcon } from './icons/PlusIcon';
import { XIcon } from './icons/XIcon';
import { BookmarkIcon } from './icons/BookmarkIcon';
import { Preset } from '../App';

interface PresetTabProps {
  presets: Preset[];
  setPresets: React.Dispatch<React.SetStateAction<Preset[]>>;
}

export const PresetTab: React.FC<PresetTabProps> = ({ presets, setPresets }) => {
  const [newPreset, setNewPreset] = useState<Omit<Preset, ''>>({ title: '', prompt: '' });
  const [error, setError] = useState('');

  const handleAddPreset = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = newPreset.title.trim();
    const trimmedPrompt = newPreset.prompt.trim();

    if (!trimmedTitle || !trimmedPrompt) {
      setError('Both title and instructions are required.');
      return;
    }
    if (presets.some(p => p.title.toLowerCase() === trimmedTitle.toLowerCase())) {
      setError('A preset with this title already exists.');
      return;
    }
     if (presets.some(p => p.prompt === trimmedPrompt)) {
      setError('A preset with these instructions already exists.');
      return;
    }

    setPresets([{ title: trimmedTitle, prompt: trimmedPrompt }, ...presets]);
    setNewPreset({ title: '', prompt: '' });
    setError('');
  };

  const handleDeletePreset = (presetToDelete: Preset) => {
    setPresets(presets.filter(p => p.title !== presetToDelete.title));
  };
  
  return (
    <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <BookmarkIcon className="h-8 w-8 text-blue-400" />
        <h2 className="text-2xl font-bold text-gray-100">Manage Your Presets</h2>
      </div>
      
      <form onSubmit={handleAddPreset} className="space-y-4 mb-4">
        <div>
          <label htmlFor="preset-title" className="block text-sm font-medium text-gray-300 mb-1">Preset Title</label>
          <input
            id="preset-title"
            type="text"
            value={newPreset.title}
            onChange={(e) => {
              setNewPreset({ ...newPreset, title: e.target.value });
              if (error) setError('');
            }}
            placeholder="e.g., Cinematic Lighting"
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>
        <div>
          <label htmlFor="preset-prompt" className="block text-sm font-medium text-gray-300 mb-1">Instructions</label>
          <textarea
            id="preset-prompt"
            value={newPreset.prompt}
            onChange={(e) => {
              setNewPreset({ ...newPreset, prompt: e.target.value });
              if (error) setError('');
            }}
            placeholder="e.g., Add dramatic, cinematic lighting to the image."
            className="w-full h-24 p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>
        <button
          type="submit"
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-800 disabled:bg-gray-500 disabled:cursor-not-allowed transition"
          disabled={!newPreset.title.trim() || !newPreset.prompt.trim()}
        >
          <PlusIcon className="h-5 w-5" />
          <span>Add Preset</span>
        </button>
      </form>
      {error && <p className="text-red-400 text-sm mb-4 -mt-2">{error}</p>}

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-300 border-b border-gray-700 pb-2">Your Saved Presets</h3>
        {presets.length > 0 ? (
          <ul className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
            {presets.map((preset) => (
              <li
                key={preset.title}
                className="group flex items-start justify-between p-3 bg-gray-700 rounded-md transition-colors hover:bg-gray-600"
              >
                <div className="flex-1">
                  <p className="font-bold text-gray-100">{preset.title}</p>
                  <p className="text-sm text-gray-400 mt-1">{preset.prompt}</p>
                </div>
                <button
                  onClick={() => handleDeletePreset(preset)}
                  className="ml-4 p-1 rounded-full text-gray-400 hover:text-white hover:bg-red-500 opacity-50 group-hover:opacity-100 transition-opacity"
                  aria-label={`Delete preset: ${preset.title}`}
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-700 rounded-lg">
            <p>You have no saved presets.</p>
            <p className="text-sm">Use the form above to add your first one!</p>
          </div>
        )}
      </div>
    </div>
  );
};
