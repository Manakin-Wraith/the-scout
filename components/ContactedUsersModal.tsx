import React, { useState, useEffect } from 'react';
import { 
  X, UserPlus, MapPin, Trophy, CheckCircle, 
  ExternalLink, Clock, MessageSquare, Loader2,
  Users, ArrowRight
} from 'lucide-react';
import { getContactedUsers, updateProspectStatus, ContactedUser } from '../services/supabaseService';

interface ContactedUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewAll: () => void;
}

const ContactedUsersModal: React.FC<ContactedUsersModalProps> = ({ isOpen, onClose, onViewAll }) => {
  const [users, setUsers] = useState<ContactedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadContactedUsers();
    }
  }, [isOpen]);

  const loadContactedUsers = async () => {
    setLoading(true);
    try {
      const data = await getContactedUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load contacted users:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsActive = async (userId: string) => {
    setUpdatingId(userId);
    const success = await updateProspectStatus(userId, 'active');
    if (success) {
      setUsers(prev => prev.filter(u => u.id !== userId));
    }
    setUpdatingId(null);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <UserPlus className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Contacted Users</h2>
              <p className="text-xs text-slate-400 font-mono">Outreach in progress</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(80vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="ml-2 text-slate-400">Loading...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-slate-400">No contacted users yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Mark prospects as contacted from the Discovery tab
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {users.map((user) => (
                <div 
                  key={user.id} 
                  className="p-4 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* User Info */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-white">
                          {user.display_name || user.x_handle || 'Unknown'}
                        </span>
                        {user.verified && (
                          <CheckCircle className="w-4 h-4 text-blue-400" />
                        )}
                        {user.x_handle && (
                          <a 
                            href={`https://x.com/${user.x_handle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1"
                          >
                            @{user.x_handle}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      {/* Meta Info */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        {user.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {user.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(user.contacted_at)}
                        </span>
                        {user.followers && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {user.followers.toLocaleString()} followers
                          </span>
                        )}
                      </div>

                      {/* Rankings */}
                      {(user.kaito_rank || user.cookie_rank || user.ethos_rank) && (
                        <div className="flex items-center gap-2 mt-2">
                          {user.kaito_rank && (
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded text-xs font-mono">
                              Kaito #{user.kaito_rank}
                            </span>
                          )}
                          {user.cookie_rank && (
                            <span className="px-2 py-0.5 bg-pink-500/10 text-pink-400 rounded text-xs font-mono">
                              Cookie #{user.cookie_rank}
                            </span>
                          )}
                          {user.ethos_rank && (
                            <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded text-xs font-mono">
                              Ethos #{user.ethos_rank}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Notes */}
                      {user.notes && (
                        <div className="mt-2 flex items-start gap-1 text-xs text-slate-500">
                          <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span className="italic">{user.notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => markAsActive(user.id)}
                        disabled={updatingId === user.id}
                        className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        {updatingId === user.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          'Mark Active'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-900/50">
          <span className="text-xs text-slate-500 font-mono">
            {users.length} contacted user{users.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={onViewAll}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            View All in Discovery
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactedUsersModal;
