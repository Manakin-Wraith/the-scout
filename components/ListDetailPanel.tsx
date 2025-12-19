import React, { useState, useMemo } from 'react';
import { X, ExternalLink, Trash2, Download, Edit2, Check, ArrowUpDown, MessageSquare } from 'lucide-react';
import { Shortlist, ShortlistItem } from '../types';
import { useShortlist } from '../contexts/ShortlistContext';
import { getColorClasses, getItemTypeLabel, getItemTypeBadgeColor, formatDate, formatRelativeTime, getListStats } from '../services/shortlistService';
import RiskBadge from './RiskBadge';

interface ListDetailPanelProps {
  list: Shortlist;
  onClose: () => void;
}

type SortField = 'displayName' | 'type' | 'earnings' | 'followers' | 'addedAt';
type SortDirection = 'asc' | 'desc';

const ListDetailPanel: React.FC<ListDetailPanelProps> = ({ list, onClose }) => {
  const { removeFromList, removeManyFromList, updateItemNotes, exportList, updateList } = useShortlist();
  
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('addedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(list.name);

  const colors = getColorClasses(list.color);
  const stats = useMemo(() => getListStats(list.items), [list.items]);

  const sortedItems = useMemo(() => {
    return [...list.items].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];
      
      // Handle undefined values
      if (aVal === undefined) aVal = sortField === 'addedAt' ? '' : 0;
      if (bVal === undefined) bVal = sortField === 'addedAt' ? '' : 0;
      
      if (typeof aVal === 'string') {
        const comparison = aVal.localeCompare(bVal);
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [list.items, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === list.items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(list.items.map(i => i.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleRemoveSelected = () => {
    if (selectedItems.size === 0) return;
    removeManyFromList(list.id, Array.from(selectedItems));
    setSelectedItems(new Set());
  };

  const handleStartEditNotes = (item: ShortlistItem) => {
    setEditingNotes(item.id);
    setNotesValue(item.notes || '');
  };

  const handleSaveNotes = (itemId: string) => {
    updateItemNotes(list.id, itemId, notesValue);
    setEditingNotes(null);
    setNotesValue('');
  };

  const handleSaveName = () => {
    const trimmed = editedName.trim();
    if (trimmed && trimmed !== list.name) {
      updateList(list.id, { name: trimmed });
    }
    setIsEditingName(false);
  };

  const renderSortHeader = (field: SortField, label: string, align: string = 'left') => (
    <th 
      className={`px-4 py-3 text-xs font-mono text-slate-500 uppercase cursor-pointer hover:text-slate-300 text-${align}`}
      onClick={() => handleSort(field)}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
        {label}
        <ArrowUpDown className={`w-3 h-3 ${sortField === field ? 'text-emerald-400' : 'opacity-50'}`} />
      </div>
    </th>
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-end z-50" onClick={onClose}>
      <div 
        className="w-full max-w-4xl bg-slate-900 border-l border-slate-700 h-full overflow-hidden flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className={`w-4 h-4 rounded-full ${colors.dot}`}></span>
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xl font-bold text-white focus:outline-none focus:border-emerald-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') setIsEditingName(false);
                    }}
                  />
                  <button onClick={handleSaveName} className="text-emerald-400 hover:text-emerald-300">
                    <Check className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">{list.name}</h2>
                  <button 
                    onClick={() => { setEditedName(list.name); setIsEditingName(true); }}
                    className="text-slate-500 hover:text-slate-300"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {list.description && (
            <p className="text-slate-400 text-sm mb-4">{list.description}</p>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-xs text-slate-500 uppercase font-mono">Items</div>
              <div className="text-xl font-bold text-white">{stats.totalItems}</div>
            </div>
            {stats.totalEarnings > 0 && (
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-xs text-slate-500 uppercase font-mono">Total Earnings</div>
                <div className="text-xl font-bold text-emerald-400">${stats.totalEarnings.toLocaleString()}</div>
              </div>
            )}
            {stats.avgFollowers > 0 && (
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-xs text-slate-500 uppercase font-mono">Avg Followers</div>
                <div className="text-xl font-bold text-blue-400">{stats.avgFollowers.toLocaleString()}</div>
              </div>
            )}
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-xs text-slate-500 uppercase font-mono">Created</div>
              <div className="text-sm font-medium text-slate-300">{formatDate(list.createdAt)}</div>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="px-6 py-3 border-b border-slate-800 flex items-center justify-between flex-shrink-0 bg-slate-950">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedItems.size === list.items.length && list.items.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-sm text-slate-400">
                {selectedItems.size > 0 ? `${selectedItems.size} selected` : 'Select all'}
              </span>
            </label>
            
            {selectedItems.size > 0 && (
              <button
                onClick={handleRemoveSelected}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Remove Selected
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportList(list.id, 'csv')}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors"
            >
              <Download className="w-3 h-3" />
              CSV
            </button>
            <button
              onClick={() => exportList(list.id, 'json')}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors"
            >
              <Download className="w-3 h-3" />
              JSON
            </button>
          </div>
        </div>

        {/* Items Table */}
        <div className="flex-1 overflow-auto">
          {list.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-lg font-medium">This list is empty</p>
              <p className="text-sm">Add items from other tabs to get started</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-900 z-10">
                <tr className="border-b border-slate-800">
                  <th className="px-4 py-3 w-10"></th>
                  {renderSortHeader('displayName', 'Name')}
                  {renderSortHeader('type', 'Type')}
                  {renderSortHeader('earnings', 'Earnings', 'right')}
                  {renderSortHeader('followers', 'Followers', 'right')}
                  <th className="px-4 py-3 text-xs font-mono text-slate-500 uppercase">Risk</th>
                  {renderSortHeader('addedAt', 'Added', 'right')}
                  <th className="px-4 py-3 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {sortedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/50 group">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-200">{item.displayName}</span>
                        {item.xLink && (
                          <a 
                            href={item.xLink} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      {/* Notes */}
                      {editingNotes === item.id ? (
                        <div className="mt-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={notesValue}
                            onChange={(e) => setNotesValue(e.target.value)}
                            placeholder="Add a note..."
                            className="flex-1 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveNotes(item.id);
                              if (e.key === 'Escape') setEditingNotes(null);
                            }}
                          />
                          <button onClick={() => handleSaveNotes(item.id)} className="text-emerald-400 hover:text-emerald-300">
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ) : item.notes ? (
                        <div 
                          className="mt-1 text-xs text-slate-500 cursor-pointer hover:text-slate-400"
                          onClick={() => handleStartEditNotes(item)}
                        >
                          📝 {item.notes}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEditNotes(item)}
                          className="mt-1 text-xs text-slate-600 hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" />
                          Add note
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${getItemTypeBadgeColor(item.type)}`}>
                        {getItemTypeLabel(item.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {item.earnings !== undefined ? (
                        <span className="text-emerald-400">${item.earnings.toLocaleString()}</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {item.followers !== undefined ? (
                        <span className="text-slate-300">{item.followers.toLocaleString()}</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {item.riskLevel ? (
                        <RiskBadge level={item.riskLevel} size="sm" showLabel={false} />
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-500">
                      {formatRelativeTime(item.addedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => removeFromList(list.id, item.id)}
                        className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                        title="Remove from list"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListDetailPanel;
