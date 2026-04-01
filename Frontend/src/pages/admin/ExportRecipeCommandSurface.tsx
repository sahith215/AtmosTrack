import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileDown,
  ArrowLeft,
  Plus,
  Play,
  RotateCw,
  Mail,
  Cloud,
  Database,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  Filter,
  Save,
  X,
  Smartphone,
  Layout,
  Layers,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { API_BASE } from '../../config';
import { View } from '../../types';

type ExportRecipeProps = {
  setActiveView: (view: View) => void;
};

type Recipe = {
  recipeId: string;
  name: string;
  questionText?: string;
  deviceId?: string;
  context: 'indoor' | 'outdoor' | 'all';
  timeRange: { from: string; to: string };
  fields: string[];
  format: string;
  language: string;
  delivery: {
    emailEnabled?: boolean;
    emailTo?: string;
    driveEnabled?: boolean;
    driveType?: 'gdrive' | 's3' | 'webdav' | null;
    drivePath?: string;
  };
  accessToken: string;
  createdAt: string;
  lastRunAt: string | null;
  runCount: number;
};

const FIELD_OPTIONS = [
  'temp', 'humidity', 'p25', 'p10', 'co2', 'ai_label', 'ai_confidence', 'timestamp', 'deviceId', 'anchorStatus'
];

const ExportRecipeCommandSurface: React.FC<ExportRecipeProps> = ({ setActiveView }) => {
  const { token } = useAuth();
  const { showToast } = useToast();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Partial<Recipe> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [revealedTokens, setRevealedTokens] = useState<Record<string, boolean>>({});

  const fetchRecipes = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/export-recipes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setRecipes(data.recipes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const toggleToken = (id: string) => {
    setRevealedTokens(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRun = async (recipeId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/export-recipes/${recipeId}/run`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        showToast('Recipe triggered successfully', 'success');
        fetchRecipes();
      } else {
        showToast(data.error || 'Failed to trigger run', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    }
  };

  const handleDelete = async (recipeId: string) => {
    if (!window.confirm('Are you sure you want to delete this recipe? This cannot be undone.')) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/export-recipes/${recipeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast('Recipe deleted', 'info');
        fetchRecipes();
      }
    } catch (err) {
      showToast('Deletion failed', 'error');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecipe?.name) return;

    setLoading(true);
    try {
      const url = isNew 
        ? `${API_BASE}/api/admin/export-recipes` 
        : `${API_BASE}/api/admin/export-recipes/${editingRecipe.recipeId}`;
      
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingRecipe),
      });

      if (res.ok) {
        showToast(isNew ? 'Recipe created' : 'Recipe updated', 'success');
        setShowEditor(false);
        fetchRecipes();
      }
    } catch (err) {
      showToast('Error saving recipe', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openEditor = (recipe?: Recipe) => {
    setIsNew(!recipe);
    setEditingRecipe(recipe || {
      name: '',
      context: 'all',
      fields: ['timestamp', 'co2', 'ai_label'],
      timeRange: { from: new Date().toISOString(), to: new Date().toISOString() },
      delivery: { emailEnabled: true }
    });
    setShowEditor(true);
  };

  return (
    <div className="pt-20 px-4 pb-12 min-h-screen bg-gradient-to-br from-cream-50 via-orange-50/60 to-amber-50">
      <div className="max-w-[1440px] mx-auto pl-12 pr-4 lg:pr-8">
        
        {/* Header & Stats */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <button
              onClick={() => setActiveView('admin')}
              className="inline-flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-800 font-bold uppercase tracking-wider mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Exit Command Floor
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-600 to-blue-700 flex items-center justify-center shadow-lg border border-sky-500 text-white">
                <FileDown className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  Export <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-blue-600">Recipes &amp; Automation</span>
                </h1>
                <p className="text-sm text-gray-500 font-medium italic">
                  Blueprint Floor: Configure delivery pipelines and mechanical data streams.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="bg-white rounded-2xl border border-sky-100 p-4 shadow-sm min-w-[140px]">
               <div className="text-[10px] text-gray-400 uppercase tracking-wide font-bold mb-1">Active Streams</div>
               <div className="text-2xl font-black text-gray-900">{recipes.length}</div>
             </div>
             <button 
               onClick={() => openEditor()}
               className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-slate-900 text-white font-bold shadow-xl hover:bg-slate-800 hover:scale-[1.02] active:scale-95 transition-all text-sm"
             >
                <Plus className="w-4 h-4" /> New Export Blueprint
             </button>
          </div>
        </div>

        {/* Recipe Grid */}
        {loading && recipes.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1,2,3].map(i => <div key={i} className="h-64 bg-white/50 border border-white rounded-3xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {recipes.map(recipe => (
              <motion.div
                layoutId={recipe.recipeId}
                key={recipe.recipeId}
                className="group relative bg-white rounded-3xl border border-sky-100 shadow-sm hover:shadow-xl hover:border-sky-300 transition-all duration-300 overflow-hidden flex flex-col"
              >
                {/* Visual Blueprint Header */}
                <div className="h-24 bg-slate-50 border-b border-sky-50 relative overflow-hidden">
                   <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #0284c7 0, #0284c7 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }} />
                   <div className="p-5 flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-sky-600 bg-sky-50 px-2 py-0.5 rounded uppercase font-bold tracking-wider">{recipe.recipeId}</span>
                        <h3 className="font-bold text-gray-900 truncate max-w-[200px]">{recipe.name}</h3>
                      </div>
                      <div className="flex gap-1">
                         <button onClick={() => openEditor(recipe)} className="p-2 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-sky-600 hover:border-sky-200 transition-all shadow-sm">
                           <Edit className="w-3.5 h-3.5" />
                         </button>
                         <button onClick={() => handleDelete(recipe.recipeId)} className="p-2 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm">
                           <Trash2 className="w-3.5 h-3.5" />
                         </button>
                      </div>
                   </div>
                </div>

                <div className="p-5 flex-1 space-y-4">
                  {/* Delivery Indicators */}
                  <div className="flex gap-4">
                     <div className={`flex items-center gap-2 text-xs font-semibold ${recipe.delivery.emailEnabled ? 'text-sky-600' : 'text-gray-300'}`}>
                        <Mail className="w-4 h-4" /> Email
                     </div>
                     <div className={`flex items-center gap-2 text-xs font-semibold ${recipe.delivery.driveEnabled ? 'text-violet-600' : 'text-gray-300'}`}>
                        <Cloud className="w-4 h-4" /> {recipe.delivery.driveType || 'Cloud'}
                     </div>
                  </div>

                  {/* Field Tags */}
                  <div className="flex flex-wrap gap-1.5 ">
                    {recipe.fields.slice(0, 4).map(f => (
                      <span key={f} className="text-[9px] font-bold uppercase tracking-tighter bg-gray-50 text-gray-500 border border-gray-100 px-1.5 py-0.5 rounded cursor-default">
                        {f}
                      </span>
                    ))}
                    {recipe.fields.length > 4 && <span className="text-[9px] font-bold text-gray-400">+{recipe.fields.length - 4}</span>}
                  </div>

                  <div className="pt-2 border-t border-gray-50 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                           <RotateCw className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase ">Last Run</p>
                          <p className="text-xs font-bold text-gray-700">{recipe.lastRunAt ? new Date(recipe.lastRunAt).toLocaleDateString() : 'Never'}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] text-gray-400 font-bold uppercase ">Frequency</p>
                        <p className="text-xs font-bold text-gray-700 capitalize">Daily</p>
                     </div>
                  </div>

                  {/* Access Token Section */}
                  <div className="bg-slate-900 rounded-2xl p-3 flex items-center justify-between border border-slate-800">
                     <div className="flex-1 mr-4 overflow-hidden">
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1 items-center flex gap-1"><Database className="w-2.5 h-2.5"/> External Trigger Token</p>
                        <p className="text-[10px] font-mono text-slate-300 truncate">
                          {revealedTokens[recipe.recipeId] ? recipe.accessToken : '••••••••••••••••••••••••'}
                        </p>
                     </div>
                     <button onClick={() => toggleToken(recipe.recipeId)} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors">
                        {revealedTokens[recipe.recipeId] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                     </button>
                  </div>
                </div>

                <div className="px-5 pb-5 mt-auto">
                   <button 
                     onClick={() => handleRun(recipe.recipeId)}
                     className="w-full py-3 rounded-2xl bg-sky-50 text-sky-700 border border-sky-100 font-bold text-xs hover:bg-sky-600 hover:text-white hover:border-sky-600 transition-all flex items-center justify-center gap-2"
                   >
                     <Play className="w-3.5 h-3.5" /> Execute Live Pulse
                   </button>
                </div>
              </motion.div>
            ))}
            {!loading && recipes.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-50">
                 <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                   <FileDown className="w-10 h-10 text-gray-300" />
                 </div>
                 <h3 className="text-xl font-bold text-gray-900">No blueprints archived</h3>
                 <p className="text-sm text-gray-500 mt-1">Create your first automated export recipe to begin.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Blueprint Editor Sidebar */}
      <AnimatePresence>
        {showEditor && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditor(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[60]" 
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-[70] border-l border-sky-100 flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                 <div>
                   <h2 className="text-lg font-black text-gray-900">{isNew ? 'New Blueprint Configuration' : 'Edit Technical Blueprint'}</h2>
                   <p className="text-xs text-gray-500">Configure data fields, time-frames and delivery endpoints.</p>
                 </div>
                 <button onClick={() => setShowEditor(false)} className="p-2 rounded-xl hover:bg-gray-200 transition-colors">
                    <X className="w-5 h-5 text-gray-400" />
                 </button>
              </div>

              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scroll">
                 <div className="space-y-4">
                   <div>
                     <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-1.5 block">Recipe Name</label>
                     <input 
                       required
                       value={editingRecipe?.name || ''}
                       onChange={e => setEditingRecipe({ ...editingRecipe, name: e.target.value })}
                       className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-semibold text-gray-900 transition-all shadow-inner"
                       placeholder="e.g., Daily Ground Sensor Alpha"
                     />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-1.5 block">Source Context</label>
                        <select 
                          value={editingRecipe?.context || 'all'}
                          onChange={e => setEditingRecipe({ ...editingRecipe, context: e.target.value as any })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-semibold text-gray-700 bg-white"
                        >
                          <option value="indoor">Indoor Sensors</option>
                          <option value="outdoor">Outdoor Sensors</option>
                          <option value="all">All Fleet</option>
                        </select>
                     </div>
                     <div>
                        <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-1.5 block">Export Format</label>
                        <div className="px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 font-bold text-sky-600 text-sm flex items-center justify-between">
                           Standard CSV <Smartphone className="w-4 h-4 opacity-30" />
                        </div>
                     </div>
                   </div>

                   <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-3 block">Blueprint Field Masking</label>
                      <div className="grid grid-cols-2 gap-2">
                         {FIELD_OPTIONS.map(field => {
                           const active = editingRecipe?.fields?.includes(field);
                           return (
                             <button
                               type="button"
                               key={field}
                               onClick={() => {
                                 let newFields = [...(editingRecipe?.fields || [])];
                                 if (active) newFields = newFields.filter(f => f !== field);
                                 else newFields.push(field);
                                 setEditingRecipe({ ...editingRecipe, fields: newFields });
                               }}
                               className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
                                 active ? 'bg-sky-50 border-sky-200 text-sky-700 shadow-sm' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300'
                               }`}
                             >
                               {field}
                               {active ? <CheckCircle className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-100" />}
                             </button>
                           )
                         })}
                      </div>
                   </div>

                   <div className="bg-sky-50 rounded-2xl p-5 border border-sky-100">
                      <h4 className="text-xs font-black text-sky-800 uppercase tracking-wide mb-4 flex items-center gap-2"><Mail className="w-4 h-4"/> Delivery Integration</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                           <span className="text-sm font-semibold text-gray-700">Email Automation</span>
                           <button 
                             type="button"
                             onClick={() => setEditingRecipe({ ...editingRecipe, delivery: { ...(editingRecipe?.delivery || {}), emailEnabled: !editingRecipe?.delivery?.emailEnabled } })}
                             className={`w-12 h-6 rounded-full transition-colors relative ${editingRecipe?.delivery?.emailEnabled ? 'bg-sky-500' : 'bg-gray-300'}`}
                           >
                             <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editingRecipe?.delivery?.emailEnabled ? 'left-7' : 'left-1'}`} />
                           </button>
                        </div>
                        {editingRecipe?.delivery?.emailEnabled && (
                           <input 
                             placeholder="target@atmostrack.org"
                             value={editingRecipe?.delivery?.emailTo || ''}
                             onChange={e => setEditingRecipe({ ...editingRecipe, delivery: { ...(editingRecipe?.delivery || {}), emailTo: e.target.value } })}
                             className="w-full px-4 py-2.5 rounded-xl border border-sky-200 focus:outline-none focus:ring-4 focus:ring-sky-500/10 font-mono text-xs shadow-inner"
                           />
                        )}
                      </div>
                   </div>
                 </div>
              </form>

              <div className="p-6 border-t border-gray-100 bg-slate-50 flex items-center gap-3 shrink-0">
                 <button onClick={() => setShowEditor(false)} className="flex-1 py-4 rounded-2xl border border-gray-200 font-bold text-gray-500 hover:bg-gray-100 transition-all text-sm">
                   Discard
                 </button>
                 <button onClick={handleSave} className="flex-1 py-4 rounded-2xl bg-sky-600 text-white font-black shadow-xl hover:bg-sky-700 hover:scale-[1.02] transition-all text-sm flex items-center justify-center gap-2">
                   <Save className="w-4 h-4" /> Finalize Blueprint
                 </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExportRecipeCommandSurface;
