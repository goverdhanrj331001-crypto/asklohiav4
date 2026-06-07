'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Loader2, GraduationCap } from 'lucide-react';
import { adminService } from '../services/adminService';

export const PastPrincipalsManager = () => {
  const [principals, setPrincipals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newPrincipal, setNewPrincipal] = useState({ name: '', from_date: '', to_date: '', order_index: 0 });

  const loadPrincipals = async () => {
    try {
      const data = await adminService.getPastPrincipals();
      setPrincipals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadPrincipals();
    };
    init();
  }, []);

  const handleAdd = async () => {
    if (!newPrincipal.name) return;
    try {
      await adminService.addPastPrincipal(newPrincipal);
      setIsAdding(false);
      setNewPrincipal({ name: '', from_date: '', to_date: '', order_index: principals.length + 1 });
      loadPrincipals();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Remove this principal from history?')) {
      try {
        await adminService.deletePastPrincipal(id);
        loadPrincipals();
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading) return <div className="p-10 text-center text-zinc-500">Loading History...</div>;

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8 shadow-xl">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <GraduationCap className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-black text-white uppercase tracking-tight">Past Principals</h3>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-white text-black px-6 py-2 rounded-xl hover:bg-zinc-200 transition-all font-bold text-sm shadow-xl shadow-white/5 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Record
        </button>
      </div>

      <div className="space-y-4">
        {isAdding && (
          <div className="bg-zinc-800/50 p-6 rounded-2xl border border-blue-500/30 grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top-4">
            <input 
              placeholder="Principal Name"
              className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:border-blue-500"
              value={newPrincipal.name}
              onChange={e => setNewPrincipal({...newPrincipal, name: e.target.value})}
            />
            <input 
              placeholder="From (Year)"
              className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:border-blue-500"
              value={newPrincipal.from_date}
              onChange={e => setNewPrincipal({...newPrincipal, from_date: e.target.value})}
            />
            <input 
              placeholder="To (Year)"
              className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:border-blue-500"
              value={newPrincipal.to_date}
              onChange={e => setNewPrincipal({...newPrincipal, to_date: e.target.value})}
            />
             <div className="flex gap-2">
              <button 
                onClick={handleAdd}
                className="bg-blue-600 hover:bg-blue-500 text-white flex-grow rounded-xl font-bold transition-all"
              >Save</button>
              <button 
                onClick={() => setIsAdding(false)}
                className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 rounded-xl"
              >✕</button>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <table className="w-full text-left">
            <thead className="bg-zinc-800/50 text-[10px] uppercase font-black tracking-widest text-zinc-500">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">From</th>
                <th className="px-6 py-4">To</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-zinc-300">
              {principals.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-white">{p.name}</td>
                  <td className="px-6 py-4">{p.from_date}</td>
                  <td className="px-6 py-4">{p.to_date}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(p.id)}
                      className="text-zinc-600 hover:text-red-400 p-2 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
