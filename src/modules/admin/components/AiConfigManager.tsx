'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Sparkles, Plus, Trash2, CheckCircle, Globe, Key, Cpu } from 'lucide-react';

interface AIConfig {
  id: string;
  provider_name: string;
  model_id: string;
  api_key: string;
  base_url: string | null;
  is_active: boolean;
}

export const AiConfigManager = () => {
  const [configs, setConfigs] = useState<AIConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    provider_name: '',
    model_id: '',
    api_key: '',
    base_url: ''
  });

  const providers = [
    { name: 'LC-Native',  defaultModel: 'lc-native-flash',  baseUrl: '',                             requiresBaseUrl: false },
    { name: 'LC-Engine',  defaultModel: 'lc-pro-120b',       baseUrl: '/api/openrouter',              requiresBaseUrl: false },
    { name: 'LC-Plus',    defaultModel: 'lc-plus-4o',        baseUrl: 'https://api.openai.com/v1',    requiresBaseUrl: true  },
    { name: 'LC-Turbo',   defaultModel: 'lc-turbo-1',        baseUrl: 'https://api.x.ai/v1',         requiresBaseUrl: true  },
    { name: 'Custom (OpenAI Compatible)', defaultModel: '', baseUrl: '', requiresBaseUrl: true },
  ];

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = providers.find(p => p.name === e.target.value);
    if (selected) {
      setFormData({
        ...formData,
        provider_name: selected.name,
        model_id: selected.defaultModel,
        base_url: selected.baseUrl
      });
    } else {
      setFormData({ ...formData, provider_name: e.target.value });
    }
  };

  const fetchConfigs = async () => {
    const { data, error } = await supabase
      .from('ai_configurations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[LC-Admin] Failed to load engine configurations.');
    } else {
      setConfigs(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      await fetchConfigs();
    };
    init();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('ai_configurations').insert([
      {
        provider_name: formData.provider_name,
        model_id: formData.model_id,
        api_key: formData.api_key,
        base_url: formData.base_url || null,
        is_active: configs.length === 0 // Make first one active
      }
    ]);

    if (!error) {
      setFormData({ provider_name: '', model_id: '', api_key: '', base_url: '' });
      setIsAdding(false);
      fetchConfigs();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    const { error } = await supabase.from('ai_configurations').delete().eq('id', id);
    if (!error) fetchConfigs();
  };

  const toggleActive = async (id: string) => {
    const { error } = await supabase
      .from('ai_configurations')
      .update({ is_active: true })
      .eq('id', id);
    if (!error) fetchConfigs();
  };

  if (isLoading) return <div className="p-8 text-zinc-500 animate-pulse">Loading AI Configurations...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="text-blue-400" />
            AI Provider Management
          </h2>
          <p className="text-zinc-500 text-sm mt-1">Configure and manage Lohia AI engine settings.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold transition-all"
        >
          <Plus className="w-4 h-4" />
          Add New Provider
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem] space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-500 font-bold mb-1 block">SELECT PROVIDER</label>
              <select
                required
                value={formData.provider_name}
                onChange={handleProviderChange}
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500 transition-colors cursor-pointer appearance-none"
              >
                <option value="" disabled>Select a provider</option>
                {providers.map(p => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 font-bold mb-1 block">MODEL ID</label>
              <input
                required
                placeholder="e.g. gemini-2.0-flash, gpt-4o"
                value={formData.model_id}
                onChange={e => setFormData({ ...formData, model_id: e.target.value })}
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-500 font-bold mb-1 block">API KEY</label>
            <input
              required
              type="password"
              placeholder={`Enter your ${formData.provider_name || 'AI'} API Key`}
              value={formData.api_key}
              onChange={e => setFormData({ ...formData, api_key: e.target.value })}
              className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          {/* Only show Base URL if needed */}
          {(providers.find(p => p.name === formData.provider_name)?.requiresBaseUrl || formData.provider_name.includes('Custom')) && (
            <div>
              <label className="text-xs text-zinc-500 font-bold mb-1 block">BASE URL</label>
              <input
                required
                placeholder="e.g. https://api.openai.com/v1"
                value={formData.base_url}
                onChange={e => setFormData({ ...formData, base_url: e.target.value })}
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-6 py-2 text-zinc-400 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-8 py-2 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4">
        {configs.map((config) => (
          <div 
            key={config.id}
            className={`p-6 bg-zinc-900 border ${config.is_active ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'border-zinc-800'} rounded-[2rem] flex items-center justify-between transition-all`}
          >
            <div className="flex items-center gap-6">
              <div className={`p-4 rounded-2xl ${config.is_active ? 'bg-blue-600/10' : 'bg-zinc-800'}`}>
                {config.provider_name.toLowerCase().includes('lc-native') ? <Sparkles className="text-blue-400" /> : <Cpu className="text-zinc-500" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg uppercase tracking-tight">{config.provider_name}</h3>
                  {config.is_active && (
                    <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Active
                    </span>
                  )}
                </div>
                <div className="flex gap-4 mt-1">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Globe className="w-3 h-3" />
                    {config.model_id}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Key className="w-3 h-3" />
                    ••••••••••••
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!config.is_active && (
                <button
                  onClick={() => toggleActive(config.id)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  Activate
                </button>
              )}
              <button
                onClick={() => handleDelete(config.id)}
                className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}

        {configs.length === 0 && (
          <div className="p-12 border-2 border-dashed border-zinc-800 rounded-[2rem] text-center">
            <Sparkles className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <div className="text-zinc-500 font-bold">No AI configurations found.</div>
            <p className="text-zinc-600 text-sm mt-1">Click &quot;Add New Provider&quot; to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};
