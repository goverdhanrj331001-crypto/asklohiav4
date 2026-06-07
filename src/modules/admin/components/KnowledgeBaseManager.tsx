'use client';

import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { Plus, Trash2, Edit2, Check, X, Search, BookOpen, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORIES = [
  'General Rules',
  'Library',
  'Canteen',
  'Hostel',
  'Sports',
  'NSS & NCC',
  'Parking & Campus',
  'Other'
];

export const KnowledgeBaseManager = () => {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // New FAQ form state
  const [newFaq, setNewFaq] = useState({
    category: 'General Rules',
    question: '',
    answer: ''
  });

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    category: '',
    question: '',
    answer: ''
  });

  const loadFaqs = async () => {
    setLoading(true);
    try {
      const data = await adminService.getKnowledgeBase();
      setFaqs(data || []);
    } catch (err) {
      console.error('Error loading FAQs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await loadFaqs();
    };
    load();
  }, []);

  const handleAdd = async () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) {
      alert('Please fill out both the question and answer.');
      return;
    }

    try {
      const added = await adminService.addKnowledgeBase(newFaq);
      if (added) {
        setNewFaq({
          category: 'General Rules',
          question: '',
          answer: ''
        });
        loadFaqs();
      }
    } catch (err) {
      console.error('Error adding FAQ:', err);
    }
  };

  const handleStartEdit = (faq: any) => {
    setEditingId(faq.id);
    setEditForm({
      category: faq.category,
      question: faq.question,
      answer: faq.answer
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editForm.question.trim() || !editForm.answer.trim()) {
      alert('Please fill out both the question and answer.');
      return;
    }

    try {
      await adminService.updateKnowledgeBase(id, editForm);
      setEditingId(null);
      loadFaqs();
    } catch (err) {
      console.error('Error saving FAQ:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fact/FAQ?')) return;
    try {
      await adminService.deleteKnowledgeBase(id);
      loadFaqs();
    } catch (err) {
      console.error('Error deleting FAQ:', err);
    }
  };

  // Filter & Search Logic
  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-500" />
          General College Knowledge Base (FAQs)
        </h2>
        <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
          Dynamic AI Context
        </div>
      </div>

      {/* Grid: Create Form & FAQ list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Create Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 shadow-xl sticky top-6">
            <h3 className="text-sm font-black text-blue-400 uppercase tracking-widest mb-4">
              Add Custom College Fact / FAQ
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Category</label>
                <select
                  value={newFaq.category}
                  onChange={(e) => setNewFaq({ ...newFaq, category: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Question / Topic</label>
                <input
                  placeholder="e.g. Canteen timings, Parking fees, NCC entry"
                  value={newFaq.question}
                  onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Detailed Answer</label>
                <textarea
                  placeholder="Write the exact details here. AI will read this word-to-word to reply to users."
                  value={newFaq.answer}
                  onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none h-40 resize-none"
                />
              </div>

              <button
                onClick={handleAdd}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Fact to Database
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: List and Filters */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Filters Bar */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
              <input
                placeholder="Search facts or categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>

            {/* Category selection Tabs */}
            <div className="flex flex-wrap gap-2 justify-end w-full md:w-auto">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all border ${
                  selectedCategory === 'All'
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-white'
                }`}
              >
                All
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all border ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* List display */}
          {loading ? (
            <div className="text-center py-12 text-zinc-500">Loading Knowledge Base...</div>
          ) : filteredFaqs.length === 0 ? (
            <div className="bg-zinc-900/20 border border-dashed border-zinc-800 rounded-[2rem] p-12 text-center text-zinc-600">
              <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              No matching facts found. Add a new fact on the left to populate your AI.
            </div>
          ) : (
            <div className="grid gap-4">
              <AnimatePresence mode="popLayout">
                {filteredFaqs.map((faq) => (
                  <motion.div
                    key={faq.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-2xl space-y-4 group transition-all hover:bg-zinc-900/60"
                  >
                    {editingId === faq.id ? (
                      /* Editing Form Mode */
                      <div className="space-y-4">
                        <div className="flex gap-4">
                          <select
                            value={editForm.category}
                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                            className="bg-black border border-zinc-800 rounded-lg p-2 text-xs text-white outline-none"
                          >
                            {CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                          <input
                            value={editForm.question}
                            onChange={(e) => setEditForm({ ...editForm, question: e.target.value })}
                            className="flex-grow bg-black border border-zinc-800 rounded-lg p-2 text-xs text-white outline-none"
                          />
                        </div>
                        <textarea
                          value={editForm.answer}
                          onChange={(e) => setEditForm({ ...editForm, answer: e.target.value })}
                          className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-xs text-white outline-none h-24"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleSaveEdit(faq.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                          >
                            <Check className="w-4 h-4" /> Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 p-2 rounded-lg transition-colors flex items-center gap-1 text-xs"
                          >
                            <X className="w-4 h-4" /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Standard Display Mode */
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] bg-blue-950/40 text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-900/30 font-black uppercase tracking-widest">
                              {faq.category}
                            </span>
                            <span className="text-zinc-600 text-xs">
                              Added: {new Date(faq.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="text-white font-bold text-lg">{faq.question}</h4>
                          <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{faq.answer}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleStartEdit(faq)}
                            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(faq.id)}
                            className="p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
