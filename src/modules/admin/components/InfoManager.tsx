'use client';

import React, { useState, useEffect } from 'react';
import { Save, Upload, Loader2, Info } from 'lucide-react';
import { adminService } from '../services/adminService';
import { authFetch } from '../services/authFetch';

export const InfoManager = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const info = await adminService.getCollegeInfo();
      // Ensure 'principal' exists
      if (!info.find(i => i.key === 'principal')) {
         info.push({ key: 'principal', value: '', image_url: '' });
      }
      setData(info);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const init = async () => {
      await loadData();
    };
    init();
  }, []);

  const handleUpdate = async (key: string, value: string, image_url: string) => {
    try {
      await adminService.updateCollegeInfo(key, value, image_url);
      alert(`${key} updated!`);
      loadData();
    } catch (err) { console.error(err); }
  };

  const handleFileUpload = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(key);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await authFetch('/api/admin/upload', { method: 'POST', body: formData });
      const resData = await res.json();
      if (resData.url) {
        const item = data.find(i => i.key === key);
        handleUpdate(key, item?.value || '', resData.url);
      }
    } catch (err) { console.error(err); }
    finally { setUploading(null); }
  };

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Info className="w-5 h-5 text-blue-400" />
        <h3 className="text-xl font-semibold text-white">General College Info</h3>
      </div>

      <div className="space-y-8">
        {data.map((item) => (
          <div key={item.key} className="bg-zinc-800/30 p-6 rounded-2xl border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-zinc-400 uppercase text-xs font-bold tracking-widest">{item.key}</label>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-grow space-y-4">
                <input 
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:ring-1 focus:ring-blue-500 transition-all font-medium text-lg"
                  value={item.value}
                  placeholder={`Enter ${item.key} name`}
                  onChange={e => {
                    const newData = [...data];
                    const idx = newData.findIndex(i => i.key === item.key);
                    newData[idx].value = e.target.value;
                    setData(newData);
                  }}
                />
                <button 
                  onClick={() => handleUpdate(item.key, item.value, item.image_url)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>

              <div className="w-full md:w-48 flex flex-col items-center gap-2">
                <div className="w-32 h-32 rounded-2xl bg-zinc-900 border-2 border-dashed border-zinc-700 overflow-hidden relative group">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.key} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600">
                      <Upload className="w-6 h-6 mb-1" />
                      <span className="text-[10px]">No Photo</span>
                    </div>
                  )}
                  {uploading === item.key && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                    </div>
                  )}
                </div>
                <label className="cursor-pointer text-xs text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 px-3 py-1.5 rounded-full font-medium">
                  {item.image_url ? 'Replace Image' : 'Upload Image'}
                  <input type="file" className="hidden" onChange={e => handleFileUpload(item.key, e)} accept="image/*" />
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
