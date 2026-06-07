'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { authFetch } from '../services/authFetch';
import { Image as ImageIcon, Video, Trash2, Plus, Loader2, Upload, X } from 'lucide-react';

interface GalleryItem {
  id: string;
  title: string;
  category: string;
  type: 'image' | 'video';
  media_url?: string;
  media_urls?: string[];
  created_at: string;
}

export const GalleryManager = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
  });
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      await fetchItems();
    };
    init();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(e.target.files);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.category || !selectedFiles) {
      alert('Please fill title, category and select at least one file.');
      return;
    }

    setUploading(true);

    try {
      const publicUrls: string[] = [];
      const uploadPromises = Array.from(selectedFiles).map(async (file, index) => {
        const formDataPayload = new FormData();
        formDataPayload.append('file', file);
        formDataPayload.append('fileName', file.name);

        // Upload to Cloudflare R2 via our API
        const response = await authFetch('/api/gallery/upload', {
          method: 'POST',
          body: formDataPayload,
        });

        let result;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          result = await response.json();
        } else {
          const text = await response.text();
          console.error('API returned non-JSON response:', text);
          throw new Error(`Server error (${response.status}): The API returned an unexpected response format. Please check if the environment variables for R2 are correctly set.`);
        }

        if (!response.ok) {
          throw new Error(result.error || `Upload failed with status ${response.status}`);
        }

        publicUrls.push(result.publicUrl);
      });

      await Promise.all(uploadPromises);

      // Insert into Gallery table (Supabase) as a single event with multiple media URLs
      const { error: insertError } = await supabase.from('gallery').insert([{
        title: formData.title,
        category: formData.category,
        media_urls: publicUrls,
      }]);

      if (insertError) throw insertError;

      setFormData({ title: '', category: '' });
      setSelectedFiles(null);
      // Clear file input
      const fileInput = document.getElementById('media-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      fetchItems();
      alert('Media uploaded to Cloudflare successfully!');
    } catch (error: any) {
      console.error('Error uploading media:', error);
      alert(`Upload failed: ${error.message || 'Check your Cloudflare R2 configuration.'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (item: GalleryItem) => {
    if (!confirm('Are you sure you want to delete this media?')) return;

    try {
      // If it's a Cloudflare R2 URL, try to delete from there too
      const r2Domain = process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN || 'r2.dev';
      const urlsToDelete = item.media_urls || [];
      
      const deletePromises = urlsToDelete.map(async (url) => {
        if (url.includes(r2Domain) || url.includes('gallery/')) {
          const key = url.split('.dev/').pop() || url.split('.com/').pop();
          if (key) {
          await authFetch('/api/gallery/delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ key }),
            });
          }
        }
      });
      await Promise.all(deletePromises);

      const { error } = await supabase.from('gallery').delete().eq('id', item.id);
      if (!error) fetchItems();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-2xl">
        <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-6 flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 rounded-xl">
            <Upload className="w-5 h-5 text-blue-400" />
          </div>
          Batch Media Upload
        </h3>
        <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest ml-1">Album Title</label>
            <input
              type="text"
              placeholder="e.g., NCC Annual Parade"
              className="w-full bg-black border border-zinc-800 rounded-2xl px-4 py-3 text-sm focus:border-blue-500 outline-none placeholder:text-zinc-700 transition-all font-medium"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest ml-1">Media Category</label>
            <input
              type="text"
              placeholder="e.g., NCC, Sports"
              className="w-full bg-black border border-zinc-800 rounded-2xl px-4 py-3 text-sm focus:border-blue-500 outline-none placeholder:text-zinc-700 transition-all font-medium"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          </div>
          
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest ml-1">Select Media Files (Gallery Support)</label>
            <div className="relative group">
              <input
                id="media-upload"
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <label 
                htmlFor="media-upload"
                className="flex flex-col items-center justify-center w-full py-10 border-2 border-dashed border-zinc-800 rounded-3xl cursor-pointer bg-zinc-900/50 hover:bg-zinc-800/50 hover:border-blue-500/50 transition-all"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <ImageIcon className="w-10 h-10 text-zinc-600 mb-3 group-hover:text-blue-400 transition-colors" />
                  <p className="mb-2 text-sm text-zinc-400 font-bold">
                    {selectedFiles && selectedFiles.length > 0 
                      ? `${selectedFiles.length} files selected` 
                      : 'Click to select multiple Photos & Videos'}
                  </p>
                  <p className="text-xs text-zinc-500 uppercase tracking-widest font-black">Support for JPG, PNG, MP4</p>
                </div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="md:col-span-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-white font-black uppercase tracking-widest py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing Assets...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Finalize & Upload to Gallery
              </>
            )}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full py-20 flex justify-center items-center flex-col gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest animate-pulse">Syncing Library...</span>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-[1.5rem] overflow-hidden group relative shadow-xl">
              <div className="aspect-square relative flex items-center justify-center bg-black">
                {item.media_urls && item.media_urls.length > 0 && (
                  <img src={item.media_urls[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                )}
                {item.media_urls && item.media_urls.length > 1 && (
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] text-white font-bold tracking-widest">{item.media_urls.length} items</div>
                )}
                {/* Fallback to original media_url if somehow array doesn't exist or is empty */}
                {!item.media_urls?.length && item.type === 'video' && (
                  <>
                    <Video className="w-10 h-10 text-zinc-700" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="p-2 bg-white/10 backdrop-blur-md rounded-full">
                        <Video className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </>
                )}
                <button
                  onClick={() => handleDelete(item)}
                  className="absolute top-2 right-2 p-2 bg-red-600/90 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:scale-110 active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="p-3 bg-zinc-900/80 backdrop-blur-sm border-t border-zinc-800">
                <div className="text-[8px] text-blue-400 font-black uppercase tracking-tighter mb-0.5 truncate">{item.category}</div>
                <h4 className="font-extrabold text-[11px] text-zinc-200 truncate leading-tight">{item.title}</h4>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
