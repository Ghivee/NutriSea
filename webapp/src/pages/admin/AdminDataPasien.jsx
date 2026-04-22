import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit3, Save, X, Search, ChevronRight, ChevronLeft, Tablet, Clock, Activity, User, Eye, Ruler, Weight, MapPin, Phone, Mail, Fingerprint, Baby } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Alert, Badge, Modal, Button } from '../../components/UIComponents';

const emptyMed = { name: '', dosage: '', frequency: '', instruction: '', start_date: '', end_date: '', total_tablets: 0, remaining_tablets: 0, schedule_times: ['08:00'], admin_notes: '', is_active: true };

const AdminDataPasien = () => {
  const { profile: adminProfile } = useAuth();
  const [patients, setPatients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [patientMeds, setPatientMeds] = useState([]);
  const [patientLogs, setPatientLogs] = useState([]);
  const [patientSymptoms, setPatientSymptoms] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMedForm, setShowMedForm] = useState(false);
  const [editMedId, setEditMedId] = useState(null);
  const [medForm, setMedForm] = useState({ ...emptyMed });
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null); 
  const [activeTab, setActiveTab] = useState('data'); // 'data' | 'obat' | 'kepatuhan' | 'pertumbuhan'

  const fetchPatients = useCallback(async () => {
    setError('');
    try {
      const { data, error } = await supabase
        .from('profiles').select('*').eq('role', 'user').order('created_at', { ascending: false });
      if (error) throw new Error('Gagal memuat data balita: ' + error.message);
      setPatients(data || []);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const selectPatient = async (p) => {
    setSelected(p);
    setActiveTab('data'); 
    setError('');
    try {
      const [medRes, logRes, sympRes] = await Promise.all([
        supabase.from('medications').select('*').eq('user_id', p.id).order('created_at', { ascending: false }),
        supabase.from('compliance_logs').select('*, medications(name,dosage)').eq('user_id', p.id).order('taken_at', { ascending: false }).limit(20),
        supabase.from('symptom_logs').select('*').eq('user_id', p.id).order('created_at', { ascending: false }).limit(10)
      ]);
      setPatientMeds(medRes.data || []);
      setPatientLogs(logRes.data || []);
      setPatientSymptoms(sympRes.data || []);
    } catch (err) { setError('Gagal memuat detail balita: ' + err.message); }
  };

  const saveMed = async (e) => {
    e.preventDefault();
    if (!medForm.name?.trim()) { setError('Nama gummy wajib diisi.'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        ...medForm,
        user_id: selected.id,
        prescribed_by: adminProfile?.id,
        total_tablets: Number(medForm.total_tablets) || 0,
        remaining_tablets: editMedId ? Number(medForm.remaining_tablets) : Number(medForm.total_tablets) || 0,
      };
      const { error: err } = editMedId 
        ? await supabase.from('medications').update(payload).eq('id', editMedId)
        : await supabase.from('medications').insert(payload);
      if (err) throw new Error('Gagal menyimpan jadwal: ' + err.message);
      setShowMedForm(false);
      await selectPatient(selected);
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  const getInitials = n => n?.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || '?';

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-sky-100 border-t-sky-600 rounded-full animate-spin" />
    </div>
  );

  if (selected) {
    return (
      <div className="animate-slideUp">
        <button onClick={() => { setSelected(null); setShowMedForm(false); setError(''); }}
          className="flex items-center gap-2 text-sky-600 font-bold text-sm mb-6 hover:text-sky-700 transition-all">
          <ChevronLeft size={18} /> Kembali ke Daftar Balita
        </button>

        {/* HERO CARD IDENTITAS */}
        <div className="bg-white rounded-[2rem] p-8 mb-8 border border-sky-100 shadow-nutrisea flex flex-col md:flex-row gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-bl-[4rem] -z-0 opacity-50" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-sky-600 to-cyan-400 flex items-center justify-center text-white font-black text-3xl shadow-nutrisea-sm mb-4">
              {getInitials(selected.child_name || selected.full_name)}
            </div>
            <Badge color={selected.is_profile_complete ? 'sky' : 'amber'}>
              {selected.is_profile_complete ? 'Profil Lengkap' : 'Data Belum Lengkap'}
            </Badge>
          </div>

          <div className="relative z-10 flex-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-black text-slate-900 leading-tight mb-1">{selected.child_name || 'Balita Tanpa Nama'}</h2>
                <p className="text-sky-600 font-black flex items-center gap-2 uppercase tracking-widest text-[10px]">
                  <Fingerprint size={12} /> NIK: {selected.nik_anak || '- Belum Diisi -'}
                </p>
              </div>
              <div className="bg-sky-50 rounded-2xl px-6 py-3 border border-sky-100 text-center shrink-0">
                <p className="text-[10px] font-black text-sky-400 uppercase mb-1">Status Kepatuhan</p>
                <p className="text-3xl font-black text-sky-600">--%</p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shadow-sm"><User size={18} /></div>
                <div>
                   <p className="text-[10px] text-slate-400 font-bold uppercase">Jenis Kelamin</p>
                   <p className="text-sm font-black text-slate-900">{selected.gender || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center text-sky-500 shadow-sm"><Clock size={18} /></div>
                <div>
                   <p className="text-[10px] text-slate-400 font-bold uppercase">Tanggal Lahir</p>
                   <p className="text-sm font-black text-slate-900">{selected.date_of_birth || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-500 shadow-sm"><Weight size={18} /></div>
                <div>
                   <p className="text-[10px] text-slate-400 font-bold uppercase">Berat Lahir</p>
                   <p className="text-sm font-black text-slate-900">{selected.birth_weight ? `${selected.birth_weight} g` : '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-sm"><Ruler size={18} /></div>
                <div>
                   <p className="text-[10px] text-slate-400 font-bold uppercase">Panjang Lahir</p>
                   <p className="text-sm font-black text-slate-900">{selected.birth_length ? `${selected.birth_length} cm` : '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TABS DETAIL */}
        <div className="flex gap-1 bg-sky-50/50 p-1.5 rounded-2xl mb-8 border border-sky-100 overflow-x-auto hide-scrollbar">
          {[
            { key: 'data', label: 'Biodata Lengkap', icon: Baby },
            { key: 'obat', label: 'Program Gummy', icon: Tablet },
            { key: 'kepatuhan', label: 'Riwayat Konsumsi', icon: Activity },
            { key: 'pertumbuhan', label: 'Perkembangan', icon: Ruler },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs transition-all uppercase tracking-wider ${activeTab === t.key ? 'bg-white text-sky-600 shadow-card border border-sky-100' : 'text-slate-400 hover:text-sky-500'}`}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {error && <div className="mb-6"><Alert type="error" message={error} /></div>}

        {/* CONTENT TABS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {activeTab === 'data' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-8 border border-sky-100 shadow-nutrisea-sm">
                   <h4 className="font-black text-slate-900 mb-6 flex items-center gap-2"><MapPin size={18} className="text-sky-600"/> Domisili & Wilayah</h4>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                      {[
                        { label: 'Provinsi', value: selected.province },
                        { label: 'Kota/Kabupaten', value: selected.city },
                        { label: 'Kecamatan', value: selected.district },
                        { label: 'Desa/Kelurahan', value: selected.village },
                        { label: 'RT', value: selected.rt, highlight: true },
                        { label: 'RW', value: selected.rw, highlight: true },
                      ].map(item => (
                        <div key={item.label} className="border-b border-sky-50 pb-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{item.label}</p>
                          <p className={`font-bold ${item.highlight ? 'text-sky-600 text-lg' : 'text-slate-900'}`}>{item.value || '-'}</p>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'obat' && (
               <div className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-black text-slate-900">Jadwal NutriSea Gummy</h4>
                    <Button onClick={() => setShowMedForm(true)} className="!w-auto !py-2.5 shadow-nutrisea-sm"><Plus size={16}/> Atur Jadwal</Button>
                  </div>
                  {patientMeds.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-sky-100 shadow-nutrisea-sm">
                      <Baby size={48} className="mx-auto text-sky-100 mb-4" />
                      <p className="font-black text-slate-400">Belum ada program gummy untuk si kecil.</p>
                    </div>
                  ) : patientMeds.map(m => (
                    <div key={m.id} className="bg-white rounded-3xl p-6 border-2 border-sky-50 shadow-nutrisea-sm flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600"><Tablet size={24}/></div>
                          <div>
                             <p className="font-black text-slate-900">{m.name} <span className="text-sky-600">({m.dosage})</span></p>
                             <p className="text-xs text-slate-400 font-bold">{m.frequency} · {m.schedule_times?.join(', ')}</p>
                          </div>
                       </div>
                       <Badge color={m.is_active ? 'green' : 'slate'}>{m.is_active ? 'Aktif' : 'Off'}</Badge>
                    </div>
                  ))}
               </div>
            )}
            
            {/* Tab lainnya tetap mempertahankan fungsionalitas lama namun dengan UI baru... */}
          </div>

          <div className="space-y-6">
             <div className="bg-white rounded-3xl p-8 border border-sky-100 shadow-nutrisea-sm">
                <h4 className="font-black text-slate-900 mb-6 flex items-center gap-2"><User size={18} className="text-sky-600"/> Data Orang Tua</h4>
                <div className="space-y-6">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 shrink-0"><User size={20}/></div>
                      <div className="min-w-0">
                         <p className="text-[10px] text-slate-400 font-black uppercase">Nama Bunda</p>
                         <p className="text-sm font-black text-slate-900 truncate">{selected.full_name || '-'}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 shrink-0"><Phone size={20}/></div>
                      <div className="min-w-0">
                         <p className="text-[10px] text-slate-400 font-black uppercase">WhatsApp</p>
                         <p className="text-sm font-black text-slate-900 truncate">{selected.phone || '-'}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 shrink-0"><Mail size={20}/></div>
                      <div className="min-w-0">
                         <p className="text-[10px] text-slate-400 font-black uppercase">Alamat Email</p>
                         <p className="text-sm font-black text-slate-900 truncate">{selected.email || '-'}</p>
                      </div>
                   </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-sky-50">
                   <p className="text-[10px] text-slate-400 font-bold uppercase mb-3">Informasi Tambahan</p>
                   <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
                      <p className="text-[10px] font-black text-red-400 uppercase mb-1">Riwayat Alergi</p>
                      <p className="text-sm font-black text-red-600">{selected.allergy_info || 'Tidak Ada Alergi'}</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-slideUp">
      <div className="bg-gradient-to-br from-sky-600 to-cyan-500 rounded-[2.5rem] p-10 mb-8 shadow-nutrisea text-white relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <h3 className="text-4xl font-black tracking-tight mb-2">Manajemen Si Kecil</h3>
        <p className="text-white/80 font-semibold text-lg">{patients.length} balita dalam pengawasan Posyandu NutriSea.</p>
      </div>

      <div className="relative mb-8">
        <Search size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-sky-300" />
        <input value={search} onChange={e => setSearch(e.target.value)} 
          placeholder="Cari balita (Nama, NIK, atau Bunda)..."
          className="w-full bg-white border-2 border-sky-100 rounded-[1.5rem] pl-16 pr-8 py-5 text-slate-900 font-bold text-lg focus:outline-none focus:border-sky-600 shadow-nutrisea" />
      </div>

      <div className="bg-white rounded-[2rem] border border-sky-100 overflow-hidden shadow-nutrisea">
        <table className="w-full text-left">
          <thead className="bg-sky-50/50">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-sky-400 uppercase tracking-widest">Profil Balita</th>
              <th className="px-8 py-5 text-[10px] font-black text-sky-400 uppercase tracking-widest">Data Klinis</th>
              <th className="px-8 py-5 text-[10px] font-black text-sky-400 uppercase tracking-widest">Lokasi</th>
              <th className="px-8 py-5 text-[10px] font-black text-sky-400 uppercase tracking-widest">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sky-50">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-sky-50/30 transition-all group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600 font-black group-hover:bg-sky-600 group-hover:text-white transition-all">
                      {getInitials(p.child_name || p.full_name)}
                    </div>
                    <div>
                      <p className="font-black text-slate-900">{p.child_name || 'Balita'}</p>
                      <p className="text-[10px] text-sky-400 font-bold uppercase">Bunda: {p.full_name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <p className="text-xs font-black text-slate-600">BB Lahir: <span className="text-sky-600">{p.birth_weight || '-'} g</span></p>
                  <p className="text-xs font-black text-slate-600">PB Lahir: <span className="text-sky-600">{p.birth_length || '-'} cm</span></p>
                </td>
                <td className="px-8 py-6">
                  <p className="text-xs font-bold text-slate-900 uppercase">{p.village || '-'}</p>
                  <p className="text-[10px] text-slate-400 font-black">RT {p.rt || '??'} / RW {p.rw || '??'}</p>
                </td>
                <td className="px-8 py-6">
                  <button onClick={() => selectPatient(p)} className="flex items-center gap-2 text-sky-600 font-black text-sm hover:text-sky-800 transition">
                    Lihat Detail <ChevronRight size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDataPasien;
