'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Trophy, Microscope, Loader2 } from 'lucide-react';
import { adminService } from '../services/adminService';

export const AchievementsManager = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({ category: 'achievement', title: '', description: '', year: '' });

  const loadData = async () => {
    try {
      const data = await adminService.getAchievements();
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadData();
    };
    init();
  }, []);

  const handleAdd = async () => {
    if (!newItem.title) return;
    try {
      await adminService.addAchievement(newItem);
      setIsAdding(false);
      setNewItem({ category: 'achievement', title: '', description: '', year: '' });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure?')) {
      await adminService.deleteAchievement(id);
      loadData();
    }
  };

  if (loading) return <div className="p-10 text-center text-zinc-500">Loading Data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          Achievements & Research
        </h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-500 transition-all font-bold text-sm"
        >
          Add New Item
        </button>
      </div>

      {isAdding && (
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-700 space-y-4 animate-in slide-in-from-top-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select 
               className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none"
               value={newItem.category}
               onChange={e => setNewItem({...newItem, category: e.target.value})}
            >
              <option value="achievement">Academic Achievement</option>
              <option value="research">Research/Publication</option>
            </select>
            <input 
              placeholder="Title (e.g. Merit in BA Exam)"
              className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none"
              value={newItem.title}
              onChange={e => setNewItem({...newItem, title: e.target.value})}
            />
          </div>
          <textarea 
            placeholder="Description / Details"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none"
            rows={3}
            value={newItem.description}
            onChange={e => setNewItem({...newItem, description: e.target.value})}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <input 
              placeholder="Year (e.g. 2023)"
              className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none"
              value={newItem.year}
              onChange={e => setNewItem({...newItem, year: e.target.value})}
            />
            <div className="flex gap-2">
              <button onClick={handleAdd} className="flex-grow bg-blue-600 text-white rounded-xl font-bold">Save</button>
              <button onClick={() => setIsAdding(false)} className="bg-zinc-800 px-4 rounded-xl">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((item) => (
          <div key={item.id} className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 relative group">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${item.category === 'achievement' ? 'bg-yellow-500/10' : 'bg-emerald-500/10'}`}>
                {item.category === 'achievement' ? <Trophy className="w-5 h-5 text-yellow-500" /> : <Microscope className="w-5 h-5 text-emerald-500" />}
              </div>
              <div className="flex-grow">
                <div className="text-[10px] uppercase font-black tracking-widest text-zinc-500 mb-1">{item.category} • {item.year}</div>
                <h4 className="text-lg font-bold text-white mb-2">{item.title}</h4>
                <p className="text-zinc-400 text-sm italic">&quot;{item.description}&quot;</p>
              </div>
            </div>
            <button 
              onClick={() => handleDelete(item.id)}
              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 text-zinc-500 hover:text-red-500 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
