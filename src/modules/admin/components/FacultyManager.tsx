'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Upload, Loader2, Users } from 'lucide-react';
import { adminService } from '../services/adminService';
import { authFetch } from '../services/authFetch';

export const FacultyManager = () => {
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null); // 'new' or element id
  const [newMember, setNewMember] = useState({ 
    name: '', 
    father_name: '',
    department: '', 
    designation: '', 
    image_url: '', 
    subject: '', 
    qualification: '',
    dob: '',
    seniority_no: '',
    mobile_no: '', 
    email: '',
    specialization: '',
    service_start_date: '',
    college_join_date: ''
  });
  const [editMember, setEditMember] = useState<any>(null);

  const loadFaculty = async () => {
    try {
      const data = await adminService.getFaculty();
      setFaculty(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadFaculty();
    };
    init();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'new' | string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(target);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await authFetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        if (target === 'new') {
          setNewMember({ ...newMember, image_url: data.url });
        } else {
          // AUTO-SAVE: If editing existing member, update Supabase immediately
          setEditMember({ ...editMember, image_url: data.url });
          await adminService.updateFaculty(target, {
            ...editMember,
            image_url: data.url
          });
          loadFaculty(); // Refresh UI
        }
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(null);
    }
  };

  const handleAdd = async () => {
    if (!newMember.name || !newMember.department) return;
    try {
      await adminService.addFaculty(newMember);
      setIsAdding(false);
      setNewMember({ 
        name: '', 
        father_name: '',
        department: '', 
        designation: '', 
        image_url: '', 
        subject: '', 
        qualification: '',
        dob: '',
        seniority_no: '',
        mobile_no: '', 
        email: '',
        specialization: '',
        service_start_date: '',
        college_join_date: ''
      });
      loadFaculty();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEdit = async () => {
    if (!editMember) return;
    try {
      await adminService.updateFaculty(editMember.id, {
        name: editMember.name,
        father_name: editMember.father_name,
        department: editMember.department,
        designation: editMember.designation,
        subject: editMember.subject,
        qualification: editMember.qualification,
        dob: editMember.dob,
        seniority_no: editMember.seniority_no,
        mobile_no: editMember.mobile_no,
        email: editMember.email,
        specialization: editMember.specialization,
        service_start_date: editMember.service_start_date,
        college_join_date: editMember.college_join_date,
        image_url: editMember.image_url
      });
      setEditingId(null);
      setEditMember(null);
      loadFaculty();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure?')) {
      await adminService.deleteFaculty(id);
      loadFaculty();
    }
  };

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-white">Faculty Members</h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" /> Add Faculty
        </button>
      </div>

      <div className="space-y-4">
        {isAdding && (
          <div className="bg-zinc-800/50 p-6 rounded-2xl border border-blue-500/30 space-y-4 animate-in slide-in-from-top-4">
            <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider">New Faculty Member</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <input 
                placeholder="Full Name"
                className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:border-blue-500"
                value={newMember.name}
                onChange={e => setNewMember({...newMember, name: e.target.value})}
              />
              <input 
                placeholder="Father&apos;s Name"
                className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:border-blue-500"
                value={newMember.father_name}
                onChange={e => setNewMember({...newMember, father_name: e.target.value})}
              />
              <input 
                placeholder="Department"
                className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:border-blue-500"
                value={newMember.department}
                onChange={e => setNewMember({...newMember, department: e.target.value})}
              />
              <input 
                placeholder="Designation"
                className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:border-blue-500"
                value={newMember.designation}
                onChange={e => setNewMember({...newMember, designation: e.target.value})}
              />
              <input 
                placeholder="Subject"
                className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:border-blue-500"
                value={newMember.subject || ''}
                onChange={e => setNewMember({...newMember, subject: e.target.value})}
              />
              <input 
                placeholder="Qualification"
                className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:border-blue-500"
                value={newMember.qualification || ''}
                onChange={e => setNewMember({...newMember, qualification: e.target.value})}
              />
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase ml-3">Date of Birth</span>
                <input 
                  type="date"
                  className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:border-blue-500"
                  value={newMember.dob || ''}
                  onChange={e => setNewMember({...newMember, dob: e.target.value})}
                />
              </div>
              <input 
                placeholder="Seniority No. / Year"
                className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:border-blue-500"
                value={newMember.seniority_no || ''}
                onChange={e => setNewMember({...newMember, seniority_no: e.target.value})}
              />
              <input 
                placeholder="Mobile No."
                className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:border-blue-500"
                value={newMember.mobile_no || ''}
                onChange={e => setNewMember({...newMember, mobile_no: e.target.value})}
              />
              <input 
                placeholder="Email Address"
                className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:border-blue-500"
                value={newMember.email || ''}
                onChange={e => setNewMember({...newMember, email: e.target.value})}
              />
              <input 
                placeholder="Specialization"
                className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:border-blue-500"
                value={newMember.specialization || ''}
                onChange={e => setNewMember({...newMember, specialization: e.target.value})}
              />
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase ml-3">Service Start Date</span>
                <input 
                  type="date"
                  className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:border-blue-500"
                  value={newMember.service_start_date || ''}
                  onChange={e => setNewMember({...newMember, service_start_date: e.target.value})}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase ml-3">College Join Date</span>
                <input 
                  type="date"
                  className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:border-blue-500"
                  value={newMember.college_join_date || ''}
                  onChange={e => setNewMember({...newMember, college_join_date: e.target.value})}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-3 rounded-xl cursor-pointer transition-colors flex-grow justify-center border border-zinc-600">
                  {uploading === 'new' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {newMember.image_url ? 'Change Photo' : 'Upload Photo'}
                  <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'new')} accept="image/*" />
                </label>
              </div>
            </div>
            {newMember.image_url && (
               <div className="flex items-center gap-3 p-3 bg-zinc-900 rounded-xl border border-zinc-700">
                 <img src={newMember.image_url} alt="Preview" className="w-10 h-10 rounded-full object-cover" />
                 <div className="text-[10px] text-zinc-500 truncate flex-grow">R2 URL: {newMember.image_url}</div>
               </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setIsAdding(false)}
                className="px-6 py-2 text-zinc-400 hover:text-white font-medium"
              >Cancel</button>
              <button 
                onClick={handleAdd}
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2 rounded-xl font-bold shadow-lg shadow-blue-900/20"
              >Save Member</button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-800 font-medium">
                <th className="pb-4 pt-2 px-2">Identification</th>
                <th className="pb-4 pt-2 px-2">Department</th>
                <th className="pb-4 pt-2 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {faculty.map((f) => (
                <tr key={f.id} className="group hover:bg-zinc-800/20 transition-colors">
                  <td className="py-5 px-2">
                    {editingId === f.id ? (
                      <div className="space-y-4 max-w-2xl bg-zinc-900/50 p-4 rounded-xl border border-zinc-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-zinc-500 font-bold uppercase ml-1">Full Name</label>
                            <input 
                              className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white w-full text-sm"
                              value={editMember?.name}
                              onChange={e => setEditMember({...editMember, name: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-zinc-500 font-bold uppercase ml-1">Father&apos;s Name</label>
                            <input 
                              className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white w-full text-sm"
                              value={editMember?.father_name || ''}
                              onChange={e => setEditMember({...editMember, father_name: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-zinc-500 font-bold uppercase ml-1">Department</label>
                            <input 
                              className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white w-full text-sm"
                              value={editMember?.department}
                              onChange={e => setEditMember({...editMember, department: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-zinc-500 font-bold uppercase ml-1">Designation</label>
                            <input 
                              className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white w-full text-sm"
                              value={editMember?.designation || ''}
                              onChange={e => setEditMember({...editMember, designation: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-zinc-500 font-bold uppercase ml-1">Subject</label>
                            <input 
                              className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white w-full text-sm"
                              value={editMember?.subject || ''}
                              onChange={e => setEditMember({...editMember, subject: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-zinc-500 font-bold uppercase ml-1">Qualification</label>
                            <input 
                              className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white w-full text-sm"
                              value={editMember?.qualification || ''}
                              onChange={e => setEditMember({...editMember, qualification: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-zinc-500 font-bold uppercase ml-1">Mobile</label>
                            <input 
                              className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white w-full text-sm"
                              value={editMember?.mobile_no || ''}
                              onChange={e => setEditMember({...editMember, mobile_no: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-zinc-500 font-bold uppercase ml-1">Seniority No.</label>
                            <input 
                              className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white w-full text-sm"
                              value={editMember?.seniority_no || ''}
                              onChange={e => setEditMember({...editMember, seniority_no: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-zinc-500 font-bold uppercase ml-1">DOB</label>
                            <input 
                              type="date"
                              className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white w-full text-sm"
                              value={editMember?.dob || ''}
                              onChange={e => setEditMember({...editMember, dob: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-zinc-500 font-bold uppercase ml-1">College Join Date</label>
                            <input 
                              type="date"
                              className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white w-full text-sm"
                              value={editMember?.college_join_date || ''}
                              onChange={e => setEditMember({...editMember, college_join_date: e.target.value})}
                            />
                          </div>
                        </div>
                        <label className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-400 px-3 py-1.5 rounded-lg cursor-pointer border border-zinc-700 w-fit mt-2">
                           {uploading === f.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                           {editMember?.image_url ? 'Change Photo' : 'Upload Photo'}
                           <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, f.id)} accept="image/*" />
                         </label>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 border-2 border-zinc-700 flex-shrink-0">
                          {f.image_url ? (
                            <img src={f.image_url} alt={f.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-600 bg-zinc-900">
                              <Users className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white mb-0.5">{f.name}</div>
                          <div className="text-xs text-zinc-500">{f.designation}</div>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="py-5 px-2">
                    {editingId === f.id ? null : (
                      <span className="text-zinc-400 text-sm">{f.department}</span>
                    )}
                  </td>
                  <td className="py-5 px-2 text-right">
                    <div className="flex justify-end gap-1">
                      {editingId === f.id ? (
                        <>
                          <button 
                            onClick={handleSaveEdit}
                            className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                            title="Save Changes"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => { setEditingId(null); setEditMember(null); }}
                            className="p-2 text-zinc-500 hover:bg-zinc-500/10 rounded-lg transition-colors"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => { setEditingId(f.id); setEditMember(f); }}
                            className="p-2 text-zinc-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                            title="Edit Member"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(f.id)}
                            className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                            title="Delete Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {faculty.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-500">No faculty members found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
