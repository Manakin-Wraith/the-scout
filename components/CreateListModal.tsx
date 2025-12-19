import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ShortlistColor } from '../types';
import { LIST_COLORS, getColorClasses } from '../services/shortlistService';

interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateList: (name: string, color: ShortlistColor, description?: string) => void;
}

const CreateListModal: React.FC<CreateListModalProps> = ({ isOpen, onClose, onCreateList }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState<ShortlistColor>('blue');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('List name is required');
      return;
    }
    
    if (trimmedName.length > 50) {
      setError('List name must be 50 characters or less');
      return;
    }

    onCreateList(trimmedName, selectedColor, description.trim() || undefined);
    
    // Reset form
    setName('');
    setDescription('');
    setSelectedColor('blue');
    setError('');
    onClose();
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setSelectedColor('blue');
    setError('');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">Create New List</h3>
          <button 
            onClick={handleClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Name Input */}
          <div>
            <label className="block text-xs font-mono text-slate-500 uppercase mb-2">
              List Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="e.g., Q1 Activations, To Remove..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              autoFocus
            />
            {error && (
              <p className="text-red-400 text-xs mt-1">{error}</p>
            )}
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-xs font-mono text-slate-500 uppercase mb-2">
              Description <span className="text-slate-600">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this list for?"
              rows={2}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-xs font-mono text-slate-500 uppercase mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {LIST_COLORS.map(({ name: colorName, label }) => {
                const colors = getColorClasses(colorName);
                const isSelected = selectedColor === colorName;
                return (
                  <button
                    key={colorName}
                    type="button"
                    onClick={() => setSelectedColor(colorName)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                      isSelected 
                        ? `${colors.bg} ${colors.border} ${colors.text}` 
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${colors.dot}`}></span>
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview */}
          <div className="pt-2">
            <label className="block text-xs font-mono text-slate-500 uppercase mb-2">
              Preview
            </label>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getColorClasses(selectedColor).bg} ${getColorClasses(selectedColor).border}`}>
              <span className={`w-2 h-2 rounded-full ${getColorClasses(selectedColor).dot}`}></span>
              <span className={`text-sm font-medium ${getColorClasses(selectedColor).text}`}>
                {name.trim() || 'List Name'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Create List
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateListModal;
