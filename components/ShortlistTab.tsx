import React, { useState } from 'react';
import { Plus, Download, Trash2, Star, Eye, MoreVertical } from 'lucide-react';
import { Shortlist } from '../types';
import { useShortlist } from '../contexts/ShortlistContext';
import { getColorClasses, formatDate, formatRelativeTime, getListStats } from '../services/shortlistService';
import CreateListModal from './CreateListModal';
import ListDetailPanel from './ListDetailPanel';

const ShortlistTab: React.FC = () => {
  const { lists, activeListId, setActiveList, createList, deleteList, exportAllLists } = useShortlist();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedList, setSelectedList] = useState<Shortlist | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const totalItems = lists.reduce((sum, list) => sum + list.items.length, 0);

  const handleDeleteList = (listId: string) => {
    deleteList(listId);
    setShowDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-mono text-slate-500 uppercase">Total Lists</p>
              <p className="text-3xl font-bold text-white mt-1">{lists.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-mono text-slate-500 uppercase">Total Items</p>
              <p className="text-3xl font-bold text-white mt-1">{totalItems}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-mono text-slate-500 uppercase">Quick-Add List</p>
              <p className="text-lg font-medium text-white mt-1 truncate">
                {activeListId ? lists.find(l => l.id === activeListId)?.name || 'None' : 'None selected'}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <Star className={`w-6 h-6 ${activeListId ? 'text-amber-400' : 'text-slate-600'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          New List
        </button>

        {lists.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportAllLists('csv')}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Export All (CSV)
            </button>
            <button
              onClick={() => exportAllLists('json')}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Export All (JSON)
            </button>
          </div>
        )}
      </div>

      {/* Lists Grid */}
      {lists.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-bold text-white mb-2">No Lists Yet</h3>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Create your first shortlist to start organizing influencers for campaigns, reviews, or any purpose you need.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Your First List
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lists.map((list) => {
            const colors = getColorClasses(list.color);
            const stats = getListStats(list.items);
            const isActive = activeListId === list.id;
            
            return (
              <div 
                key={list.id}
                className={`bg-slate-900 border rounded-lg overflow-hidden transition-all hover:border-slate-600 ${
                  isActive ? `${colors.border} ring-1 ring-${list.color}-500/30` : 'border-slate-800'
                }`}
              >
                {/* Card Header */}
                <div className={`p-4 border-b border-slate-800 ${colors.bg}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-3 h-3 rounded-full flex-shrink-0 ${colors.dot}`}></span>
                      <h3 className={`font-bold truncate ${colors.text}`}>{list.name}</h3>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isActive && (
                        <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-medium">
                          Quick-Add
                        </span>
                      )}
                      <div className="relative">
                        <button 
                          className="p-1 text-slate-400 hover:text-white rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(showDeleteConfirm === list.id ? null : list.id);
                          }}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {showDeleteConfirm === list.id && (
                          <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 py-1 min-w-[140px]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveList(isActive ? null : list.id);
                                setShowDeleteConfirm(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                            >
                              <Star className={`w-4 h-4 ${isActive ? 'text-amber-400' : ''}`} />
                              {isActive ? 'Unset Quick-Add' : 'Set as Quick-Add'}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteList(list.id);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete List
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {list.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">{list.description}</p>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <p className="text-xs text-slate-500 font-mono">Items</p>
                      <p className="text-xl font-bold text-white">{stats.totalItems}</p>
                    </div>
                    {stats.totalEarnings > 0 && (
                      <div>
                        <p className="text-xs text-slate-500 font-mono">Earnings</p>
                        <p className="text-xl font-bold text-emerald-400">${stats.totalEarnings.toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  {/* Type Breakdown */}
                  {stats.totalItems > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {stats.byType.deal_taker + stats.byType.enriched_deal_taker > 0 && (
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                          {stats.byType.deal_taker + stats.byType.enriched_deal_taker} Deal Takers
                        </span>
                      )}
                      {stats.byType.dormant + stats.byType.enriched_dormant > 0 && (
                        <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">
                          {stats.byType.dormant + stats.byType.enriched_dormant} Dormant
                        </span>
                      )}
                      {stats.byType.non_interactor > 0 && (
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                          {stats.byType.non_interactor} Non-Interactors
                        </span>
                      )}
                    </div>
                  )}

                  <div className="text-xs text-slate-500 mb-4">
                    Updated {formatRelativeTime(list.updatedAt)}
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => setSelectedList(list)}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create List Modal */}
      <CreateListModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateList={createList}
      />

      {/* List Detail Panel */}
      {selectedList && (
        <ListDetailPanel
          list={selectedList}
          onClose={() => setSelectedList(null)}
        />
      )}

      {/* Click outside to close dropdown */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowDeleteConfirm(null)}
        />
      )}
    </div>
  );
};

export default ShortlistTab;
