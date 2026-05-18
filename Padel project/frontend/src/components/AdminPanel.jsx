import { useState, useEffect } from 'react';
import { Search, Crown, ShieldAlert, CheckCircle2, X, User } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function AdminPanel({ onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('admin_get_all_users');
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error("Erreur chargement utilisateurs admin :", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleElite = async (user) => {
    try {
      const newStatus = !user.is_elite;
      const { error } = await supabase.rpc('admin_toggle_elite', {
        p_user_id: user.id,
        p_is_elite: newStatus
      });

      if (error) throw error;

      // Mise à jour de l'état local
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_elite: newStatus } : u));
      
      // Notification de succès
      const actionText = newStatus ? "est désormais membre Élite" : "n'est plus membre Élite";
      setToastMessage(`Le joueur ${user.first_name} ${user.last_name} ${actionText} !`);
      
      // Auto-hide toast
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error("Erreur bascule Élite :", err.message);
      alert("Erreur lors de la modification du statut.");
    }
  };

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    return (
      (u.first_name && u.first_name.toLowerCase().includes(q)) ||
      (u.last_name && u.last_name.toLowerCase().includes(q)) ||
      (u.player_tag && u.player_tag.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-zinc-950/90 backdrop-blur-md px-4 py-6">
      <div className="relative w-full max-w-5xl h-full max-h-[90vh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-slide-in">
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-neon-violet/10 rounded-full filter blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full filter blur-[100px] pointer-events-none" />
        
        {/* Header */}
        <div className="shrink-0 p-6 sm:px-8 border-b border-zinc-800/80 bg-zinc-900/50 backdrop-blur-sm flex justify-between items-start">
          <div>
            <h2 className="font-display font-extrabold text-2xl text-white uppercase tracking-tight flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-neon-violet" />
              Panneau d'Administration
            </h2>
            <p className="text-zinc-400 text-sm mt-1">Gestion des utilisateurs et des privilèges Élite.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar (Search) */}
        <div className="shrink-0 p-6 sm:px-8 flex flex-col sm:flex-row gap-4 justify-between items-center bg-zinc-900/20">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Rechercher par nom, email, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-700 text-white text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-neon-violet/50 focus:ring-1 focus:ring-neon-violet/50 transition-all placeholder:text-zinc-600"
            />
          </div>
          <div className="text-sm text-zinc-500 font-medium whitespace-nowrap">
            {filteredUsers.length} joueur{filteredUsers.length > 1 ? 's' : ''} trouvé{filteredUsers.length > 1 ? 's' : ''}
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:px-8 pt-0">
          {loading ? (
            <div className="h-40 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-neon-violet/20 border-t-neon-violet rounded-full animate-spin glow-violet"></div>
              <p className="text-sm text-zinc-500 uppercase tracking-widest font-semibold">Chargement...</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-zinc-800/80 bg-zinc-900/30">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-zinc-900 border-b border-zinc-800/80 text-zinc-400 uppercase tracking-wider font-bold text-[10px]">
                  <tr>
                    <th className="px-6 py-4">Joueur</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4 text-center">Statut Actuel</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-zinc-400" />
                          </div>
                          <div>
                            <p className="text-zinc-200 font-bold">{user.first_name} {user.last_name}</p>
                            <p className="text-[10px] text-zinc-500 font-mono tracking-wider">{user.player_tag || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-400">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {user.is_elite ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neon-violet/10 border border-neon-violet/30 text-neon-violet text-[10px] font-black uppercase tracking-widest glow-violet">
                            <Crown className="w-3 h-3" /> Élite
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
                            Standard
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {user.is_elite ? (
                          <button 
                            onClick={() => handleToggleElite(user)}
                            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
                          >
                            Retirer Élite
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleToggleElite(user)}
                            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-neon-violet/10 hover:bg-neon-violet/20 border border-neon-violet/50 hover:border-neon-violet text-neon-violet text-xs font-bold transition-all glow-violet cursor-pointer"
                          >
                            Passer Élite
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-zinc-500">
                        Aucun utilisateur trouvé.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-bold flex items-center gap-2 animate-slide-in backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <CheckCircle2 className="w-5 h-5" />
            {toastMessage}
          </div>
        )}

      </div>
    </div>
  );
}
