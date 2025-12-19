import React, { useState, useRef, useEffect } from 'react';
import { Plus, Check, ChevronDown, Star } from 'lucide-react';
import { ShortlistItem } from '../types';
import { useShortlist } from '../contexts/ShortlistContext';
import { getColorClasses } from '../services/shortlistService';

interface AddToListDropdownProps {
  item: ShortlistItem;
  buttonClassName?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

const AddToListDropdown: React.FC<AddToListDropdownProps> = ({ 
  item, 
  buttonClassName = '',
  showLabel = true,
  size = 'md'
}) => {
  const { lists, activeListId, addToList, isInList, isInAnyList, quickAdd, createList } = useShortlist();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newListName, setNewListName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isInAny = isInAnyList(item.id);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCreateInput(false);
        setNewListName('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (showCreateInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showCreateInput]);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeListId) {
      quickAdd(item);
    } else {
      setIsOpen(true);
    }
  };

  const handleAddToList = (listId: string) => {
    addToList(listId, item);
  };

  const handleCreateAndAdd = () => {
    const trimmed = newListName.trim();
    if (!trimmed) return;
    
    const newList = createList(trimmed);
    addToList(newList.id, item);
    setNewListName('');
    setShowCreateInput(false);
    setIsOpen(false);
  };

  const sizeClasses = size === 'sm' 
    ? 'px-2 py-1 text-xs gap-1' 
    : 'px-3 py-1.5 text-sm gap-2';

  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main Button */}
      <div className="flex">
        {/* Quick Add Button */}
        <button
          onClick={handleQuickAdd}
          className={`flex items-center ${sizeClasses} rounded-l-lg font-medium transition-colors ${
            isInAny 
              ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          } ${buttonClassName}`}
          title={activeListId ? `Add to ${lists.find(l => l.id === activeListId)?.name}` : 'Add to list'}
        >
          {isInAny ? (
            <Check className={iconSize} />
          ) : (
            <Plus className={iconSize} />
          )}
          {showLabel && (
            <span>{isInAny ? 'Added' : 'Add'}</span>
          )}
        </button>
        
        {/* Dropdown Toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          className={`flex items-center px-1.5 rounded-r-lg border-l transition-colors ${
            isInAny 
              ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-emerald-500/30' 
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
          }`}
        >
          <ChevronDown className={`${iconSize} ${isOpen ? 'rotate-180' : ''} transition-transform`} />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 min-w-[200px] py-1 max-h-[300px] overflow-auto">
          {/* Active List Indicator */}
          {activeListId && (
            <div className="px-3 py-1.5 text-xs text-slate-500 border-b border-slate-700 flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-400" />
              Quick-add: {lists.find(l => l.id === activeListId)?.name}
            </div>
          )}

          {/* Existing Lists */}
          {lists.length > 0 ? (
            <div className="py-1">
              {lists.map(list => {
                const colors = getColorClasses(list.color);
                const inThisList = isInList(list.id, item.id);
                
                return (
                  <button
                    key={list.id}
                    onClick={() => {
                      if (!inThisList) handleAddToList(list.id);
                    }}
                    disabled={inThisList}
                    className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                      inThisList 
                        ? 'text-slate-500 cursor-default' 
                        : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}`}></span>
                    <span className="flex-1 truncate">{list.name}</span>
                    {inThisList && <Check className="w-4 h-4 text-emerald-400" />}
                    <span className="text-xs text-slate-500">{list.items.length}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-3 py-2 text-sm text-slate-500">
              No lists yet
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-slate-700 my-1"></div>

          {/* Create New List */}
          {showCreateInput ? (
            <div className="px-2 py-2">
              <input
                ref={inputRef}
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="List name..."
                className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateAndAdd();
                  if (e.key === 'Escape') {
                    setShowCreateInput(false);
                    setNewListName('');
                  }
                }}
              />
              <div className="flex gap-1 mt-2">
                <button
                  onClick={() => { setShowCreateInput(false); setNewListName(''); }}
                  className="flex-1 px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAndAdd}
                  disabled={!newListName.trim()}
                  className="flex-1 px-2 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create & Add
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCreateInput(true)}
              className="w-full px-3 py-2 text-left text-sm text-emerald-400 hover:bg-slate-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create new list
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AddToListDropdown;
