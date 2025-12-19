import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Shortlist, ShortlistItem, ShortlistState, ShortlistColor } from '../types';

// Storage key for localStorage
const STORAGE_KEY = 'scout_shortlists';

// Generate UUID
const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Context value interface
interface ShortlistContextValue {
  // State
  lists: Shortlist[];
  activeListId: string | null;
  
  // List CRUD
  createList: (name: string, color?: ShortlistColor, description?: string) => Shortlist;
  updateList: (id: string, updates: Partial<Omit<Shortlist, 'id' | 'createdAt' | 'items'>>) => void;
  deleteList: (id: string) => void;
  
  // Item operations
  addToList: (listId: string, item: ShortlistItem) => boolean;
  addManyToList: (listId: string, items: ShortlistItem[]) => number;
  removeFromList: (listId: string, itemId: string) => void;
  removeManyFromList: (listId: string, itemIds: string[]) => void;
  updateItemNotes: (listId: string, itemId: string, notes: string) => void;
  moveToList: (fromListId: string, toListId: string, itemId: string) => void;
  
  // Quick-add (uses activeListId)
  setActiveList: (id: string | null) => void;
  quickAdd: (item: ShortlistItem) => boolean;
  
  // Queries
  isInList: (listId: string, itemId: string) => boolean;
  isInAnyList: (itemId: string) => boolean;
  getListsContaining: (itemId: string) => Shortlist[];
  getListById: (id: string) => Shortlist | undefined;
  
  // Export
  exportList: (listId: string, format: 'csv' | 'json') => void;
  exportAllLists: (format: 'csv' | 'json') => void;
}

// Create context
const ShortlistContext = createContext<ShortlistContextValue | null>(null);

// Provider props
interface ShortlistProviderProps {
  children: ReactNode;
}

// Load state from localStorage
const loadFromStorage = (): ShortlistState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load shortlists from storage:', error);
  }
  return { lists: [], activeListId: null };
};

// Save state to localStorage
const saveToStorage = (state: ShortlistState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save shortlists to storage:', error);
  }
};

// Export to CSV format
const toCSV = (list: Shortlist): string => {
  const headers = ['id', 'type', 'displayName', 'xHandle', 'telegramHandle', 'xLink', 'earnings', 'followers', 'riskLevel', 'qualityScore', 'addedAt', 'notes'];
  const rows = list.items.map(item => 
    headers.map(h => {
      const value = item[h as keyof ShortlistItem];
      if (value === undefined || value === null) return '';
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return String(value);
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
};

// Export to JSON format
const toJSON = (list: Shortlist): string => {
  return JSON.stringify({
    listName: list.name,
    listDescription: list.description,
    listColor: list.color,
    exportedAt: new Date().toISOString(),
    itemCount: list.items.length,
    items: list.items
  }, null, 2);
};

// Download file helper
const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Provider component
export const ShortlistProvider: React.FC<ShortlistProviderProps> = ({ children }) => {
  const [state, setState] = useState<ShortlistState>(() => loadFromStorage());

  // Persist to localStorage on state change
  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  // Listen for storage events from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setState(JSON.parse(e.newValue));
        } catch (error) {
          console.error('Failed to sync shortlists from other tab:', error);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Create a new list
  const createList = useCallback((name: string, color: ShortlistColor = 'blue', description?: string): Shortlist => {
    const now = new Date().toISOString();
    const newList: Shortlist = {
      id: generateId(),
      name,
      description,
      color,
      createdAt: now,
      updatedAt: now,
      items: []
    };
    setState(prev => ({
      ...prev,
      lists: [...prev.lists, newList]
    }));
    return newList;
  }, []);

  // Update list metadata
  const updateList = useCallback((id: string, updates: Partial<Omit<Shortlist, 'id' | 'createdAt' | 'items'>>): void => {
    setState(prev => ({
      ...prev,
      lists: prev.lists.map(list => 
        list.id === id 
          ? { ...list, ...updates, updatedAt: new Date().toISOString() }
          : list
      )
    }));
  }, []);

  // Delete a list
  const deleteList = useCallback((id: string): void => {
    setState(prev => ({
      ...prev,
      lists: prev.lists.filter(list => list.id !== id),
      activeListId: prev.activeListId === id ? null : prev.activeListId
    }));
  }, []);

  // Add item to list (returns false if already exists)
  const addToList = useCallback((listId: string, item: ShortlistItem): boolean => {
    let added = false;
    setState(prev => {
      const list = prev.lists.find(l => l.id === listId);
      if (!list) return prev;
      
      // Check for duplicate
      if (list.items.some(i => i.id === item.id)) {
        return prev;
      }
      
      added = true;
      return {
        ...prev,
        lists: prev.lists.map(l => 
          l.id === listId
            ? { ...l, items: [...l.items, { ...item, addedAt: new Date().toISOString() }], updatedAt: new Date().toISOString() }
            : l
        )
      };
    });
    return added;
  }, []);

  // Add multiple items to list (returns count of items added)
  const addManyToList = useCallback((listId: string, items: ShortlistItem[]): number => {
    let addedCount = 0;
    setState(prev => {
      const list = prev.lists.find(l => l.id === listId);
      if (!list) return prev;
      
      const existingIds = new Set(list.items.map(i => i.id));
      const newItems = items.filter(item => !existingIds.has(item.id));
      addedCount = newItems.length;
      
      if (newItems.length === 0) return prev;
      
      const now = new Date().toISOString();
      return {
        ...prev,
        lists: prev.lists.map(l => 
          l.id === listId
            ? { ...l, items: [...l.items, ...newItems.map(i => ({ ...i, addedAt: now }))], updatedAt: now }
            : l
        )
      };
    });
    return addedCount;
  }, []);

  // Remove item from list
  const removeFromList = useCallback((listId: string, itemId: string): void => {
    setState(prev => ({
      ...prev,
      lists: prev.lists.map(list => 
        list.id === listId
          ? { ...list, items: list.items.filter(i => i.id !== itemId), updatedAt: new Date().toISOString() }
          : list
      )
    }));
  }, []);

  // Remove multiple items from list
  const removeManyFromList = useCallback((listId: string, itemIds: string[]): void => {
    const idSet = new Set(itemIds);
    setState(prev => ({
      ...prev,
      lists: prev.lists.map(list => 
        list.id === listId
          ? { ...list, items: list.items.filter(i => !idSet.has(i.id)), updatedAt: new Date().toISOString() }
          : list
      )
    }));
  }, []);

  // Update item notes
  const updateItemNotes = useCallback((listId: string, itemId: string, notes: string): void => {
    setState(prev => ({
      ...prev,
      lists: prev.lists.map(list => 
        list.id === listId
          ? {
              ...list,
              items: list.items.map(item => 
                item.id === itemId ? { ...item, notes } : item
              ),
              updatedAt: new Date().toISOString()
            }
          : list
      )
    }));
  }, []);

  // Move item between lists
  const moveToList = useCallback((fromListId: string, toListId: string, itemId: string): void => {
    setState(prev => {
      const fromList = prev.lists.find(l => l.id === fromListId);
      const toList = prev.lists.find(l => l.id === toListId);
      if (!fromList || !toList) return prev;
      
      const item = fromList.items.find(i => i.id === itemId);
      if (!item) return prev;
      
      // Check if already in target list
      if (toList.items.some(i => i.id === itemId)) return prev;
      
      const now = new Date().toISOString();
      return {
        ...prev,
        lists: prev.lists.map(list => {
          if (list.id === fromListId) {
            return { ...list, items: list.items.filter(i => i.id !== itemId), updatedAt: now };
          }
          if (list.id === toListId) {
            return { ...list, items: [...list.items, item], updatedAt: now };
          }
          return list;
        })
      };
    });
  }, []);

  // Set active list for quick-add
  const setActiveList = useCallback((id: string | null): void => {
    setState(prev => ({ ...prev, activeListId: id }));
  }, []);

  // Quick add to active list
  const quickAdd = useCallback((item: ShortlistItem): boolean => {
    if (!state.activeListId) return false;
    return addToList(state.activeListId, item);
  }, [state.activeListId, addToList]);

  // Check if item is in a specific list
  const isInList = useCallback((listId: string, itemId: string): boolean => {
    const list = state.lists.find(l => l.id === listId);
    return list ? list.items.some(i => i.id === itemId) : false;
  }, [state.lists]);

  // Check if item is in any list
  const isInAnyList = useCallback((itemId: string): boolean => {
    return state.lists.some(list => list.items.some(i => i.id === itemId));
  }, [state.lists]);

  // Get all lists containing an item
  const getListsContaining = useCallback((itemId: string): Shortlist[] => {
    return state.lists.filter(list => list.items.some(i => i.id === itemId));
  }, [state.lists]);

  // Get list by ID
  const getListById = useCallback((id: string): Shortlist | undefined => {
    return state.lists.find(l => l.id === id);
  }, [state.lists]);

  // Export single list
  const exportList = useCallback((listId: string, format: 'csv' | 'json'): void => {
    const list = state.lists.find(l => l.id === listId);
    if (!list) return;
    
    const filename = `${list.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}`;
    
    if (format === 'csv') {
      downloadFile(toCSV(list), `${filename}.csv`, 'text/csv');
    } else {
      downloadFile(toJSON(list), `${filename}.json`, 'application/json');
    }
  }, [state.lists]);

  // Export all lists
  const exportAllLists = useCallback((format: 'csv' | 'json'): void => {
    const filename = `all_shortlists_${new Date().toISOString().split('T')[0]}`;
    
    if (format === 'json') {
      const content = JSON.stringify({
        exportedAt: new Date().toISOString(),
        totalLists: state.lists.length,
        totalItems: state.lists.reduce((sum, l) => sum + l.items.length, 0),
        lists: state.lists.map(list => ({
          name: list.name,
          description: list.description,
          color: list.color,
          itemCount: list.items.length,
          items: list.items
        }))
      }, null, 2);
      downloadFile(content, `${filename}.json`, 'application/json');
    } else {
      // For CSV, combine all lists with a list name column
      const headers = ['listName', 'id', 'type', 'displayName', 'xHandle', 'telegramHandle', 'xLink', 'earnings', 'followers', 'riskLevel', 'qualityScore', 'addedAt', 'notes'];
      const rows = state.lists.flatMap(list => 
        list.items.map(item => 
          [list.name, ...headers.slice(1).map(h => {
            const value = item[h as keyof ShortlistItem];
            if (value === undefined || value === null) return '';
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return String(value);
          })].join(',')
        )
      );
      downloadFile([headers.join(','), ...rows].join('\n'), `${filename}.csv`, 'text/csv');
    }
  }, [state.lists]);

  const value: ShortlistContextValue = {
    lists: state.lists,
    activeListId: state.activeListId,
    createList,
    updateList,
    deleteList,
    addToList,
    addManyToList,
    removeFromList,
    removeManyFromList,
    updateItemNotes,
    moveToList,
    setActiveList,
    quickAdd,
    isInList,
    isInAnyList,
    getListsContaining,
    getListById,
    exportList,
    exportAllLists
  };

  return (
    <ShortlistContext.Provider value={value}>
      {children}
    </ShortlistContext.Provider>
  );
};

// Hook to use shortlist context
export const useShortlist = (): ShortlistContextValue => {
  const context = useContext(ShortlistContext);
  if (!context) {
    throw new Error('useShortlist must be used within a ShortlistProvider');
  }
  return context;
};

export default ShortlistContext;
