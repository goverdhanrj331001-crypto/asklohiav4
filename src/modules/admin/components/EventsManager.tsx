'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Loader2 } from 'lucide-react';
import { adminService } from '../services/adminService';
import { authFetch } from '../services/authFetch';

export const EventsManager = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '', category: '', speakers: '', description: '', image_url: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // Display 9 events (3x3 grid) per page on admin for better view

  const loadEvents = async () => {
    try {
      const data = await adminService.getEvents();
      setEvents(data);
      setCurrentPage(1);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const init = async () => {
      await loadEvents();
    };
    init();
  }, []);

  const handleAdd = async () => {
    if (!newEvent.title || !newEvent.date) return;
    try {
      await adminService.addEvent(newEvent);
      setIsAdding(false);
      setNewEvent({ title: '', date: '', time: '', category: '', speakers: '', description: '', image_url: '' });
      loadEvents();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this event?')) {
      await adminService.deleteEvent(id);
      loadEvents();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'events'); // using generic category or folder mapping if backend supports it
      
      // Let's assume there's a generic upload API or we use the gallery upload
      const res = await authFetch('/api/gallery/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.mediaUrl) {
         setNewEvent({ ...newEvent, image_url: data.mediaUrl });
      }
    } catch (error) {
      console.error('Error uploading image', error);
    }
  };

  const totalPages = Math.ceil(events.length / itemsPerPage);
  const paginatedEvents = events.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-white">College Events & Exams</h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" /> Add Event
        </button>
      </div>

      <div className="space-y-4">
        {isAdding && (
          <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                placeholder="Event Title (e.g., Physics Midterm)"
                className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white outline-none"
                value={newEvent.title}
                onChange={e => setNewEvent({...newEvent, title: e.target.value})}
              />
              <input 
                type="date"
                className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white outline-none"
                value={newEvent.date}
                onChange={e => setNewEvent({...newEvent, date: e.target.value})}
              />
              <input 
                placeholder="Category (e.g., Seminar, Cultural)"
                className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white outline-none"
                value={newEvent.category}
                onChange={e => setNewEvent({...newEvent, category: e.target.value})}
              />
              <input 
                type="time"
                className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white outline-none"
                value={newEvent.time}
                onChange={e => setNewEvent({...newEvent, time: e.target.value})}
              />
              <input 
                placeholder="Speakers (Comma separated)"
                className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white outline-none md:col-span-2"
                value={newEvent.speakers}
                onChange={e => setNewEvent({...newEvent, speakers: e.target.value})}
              />
              <div className="md:col-span-2 border border-zinc-700 rounded-lg p-3 bg-zinc-900 space-y-2">
                <label className="text-zinc-400 text-sm font-medium">Event Poster / Image</label>
                <div className="flex items-center gap-4">
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-zinc-800 dark:file:text-zinc-300"/>
                  {newEvent.image_url && <img src={newEvent.image_url} alt="Preview" className="h-10 w-10 object-cover rounded" />}
                </div>
              </div>
              <textarea 
                placeholder="Description"
                className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white outline-none md:col-span-2 h-20"
                value={newEvent.description}
                onChange={e => setNewEvent({...newEvent, description: e.target.value})}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-zinc-400">Cancel</button>
              <button onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg">Save</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedEvents.map((e) => (
            <div key={e.id} className="bg-zinc-800 border border-zinc-700 p-4 rounded-xl relative group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-emerald-400 mb-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">{new Date(e.date).toLocaleDateString()}</span>
                </div>
                <button 
                  onClick={() => handleDelete(e.id)}
                  className="p-1 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h4 className="text-white font-semibold mb-1">{e.title}</h4>
              <div className="text-[10px] text-blue-400 font-bold uppercase mb-2">{e.category || 'Event'}</div>
              <p className="text-zinc-400 text-sm line-clamp-2">{e.description}</p>
              {e.image_url && (
                <div className="mt-3 aspect-video w-full rounded-lg overflow-hidden border border-zinc-700">
                  <img src={e.image_url} alt={e.title} className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          ))}
          {events.length === 0 && !loading && (
             <div className="md:col-span-full py-8 text-center text-zinc-500">No events found.</div>
          )}
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800/50">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-400 disabled:opacity-30 hover:text-white transition-colors border border-zinc-700 rounded-lg hover:bg-zinc-800"
            >
              Previous
            </button>
            <span className="text-xs font-medium text-zinc-500">
              Page {currentPage} of {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-400 disabled:opacity-30 hover:text-white transition-colors border border-zinc-700 rounded-lg hover:bg-zinc-800"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
