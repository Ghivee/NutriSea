import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ChevronRight, Edit3, Save, X, Phone, LayoutDashboard, History, HelpCircle, Info, UserCircle2, Calendar, AlertTriangle, MapPin, Fingerprint, Baby, Ruler, Weight, Mail } from 'lucide-react';
import { Header, CircularProgress, Button, InputField, Modal, Alert } from '../../components/UIComponents';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const WHATSAPP_SUPPORT = '628123456789';

const Profil = () => {
  const { profile, signOut, updateProfile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ 
    child_name: '', nik_anak: '', phone: '', gender: '', allergy_info: '', 
    date_of_birth: '', birth_weight: '', birth_length: '',
    full_name: '', rt: '', rw: '', desa: '', city: '', province: '' 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [compliance, setCompliance] = useState({ percentage: 0, taken: 0, total: 0, streak: 0 });
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        child_name: profile.child_name || '',
        nik_anak: profile.nik_anak || '',
        phone: profile.phone || '',
        gender: profile.gender || '',
        allergy_info: profile.allergy_info || '',
        date_of_birth: profile.date_of_birth || '',
        birth_weight: profile.birth_weight || '',
        birth_length: profile.birth_length || '',
        full_name: profile.full_name || '',
        rt: profile.rt || '',
        rw: profile.rw || '',
        desa: profile.desa || '',
        city: profile.city || '',
        province: profile.province || ''
      });
      fetchStats();
    }
  }, [profile]);

  const fetchStats = async () => {
    if (!profile?.id) return;
    try {
      const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
      const dayOfMonth = new Date().getDate();
      const [medRes, logsRes] = await Promise.all([
        supabase.from('medications').select('id').eq('is_active', true).eq('user_id', profile.id),
        supabase.from('compliance_logs').select('taken_at').eq('user_id', profile.id).eq('status', 'taken').gte('taken_at', startOfMonth.toISOString())
      ]);
      const totalMeds = medRes.data?.length || 0;
      const taken = logsRes.data?.length || 0;
      const totalExpected = totalMeds * dayOfMonth;
      const pct = totalExpected > 0 ? Math.min(Math.round((taken / totalExpected) * 100), 100) : 0;
      setCompliance(p => ({ ...p, percentage: pct, taken, total: totalExpected }));
    } catch (err) { console.error(err); }
  };

  const handleSave = async () => {
    if (!form.child_name.trim()) { setError('Nama Si Kecil wajib diisi.'); return; }
    setLoading(true); setError('');
    try {
      await updateProfile({ ...form, is_profile_complete: true });
      setSuccessMsg('Pembaruan Identitas Berhasil!');
      setEditing(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handleLogout = async () => {
    try { await signOut(); navigate('/login', { replace: true }); }
    catch { window.location.href = '/login'; }
  };

  const initials = (profile?.child_name || profile?.full_name || '?').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  const compColor = compliance.percentage >= 80 ? '#0284c7' : compliance.percentage >= 50 ? '#d97706' : '#dc2626';

  return (
    <div className="bg-sky-50/30 min-h-full pb-24">
      <Header title="Identitas NutriSea" />
      <div className="px-5 pt-6 space-y-6">
        
        {/* AVATAR HERO */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-sky-100 shadow-nutrisea flex flex-col items-center text-center relative overflow-hidden">
           <div className="absolute top-0 right-0 w-24 h-24 bg-sky-50 rounded-bl-[3rem] -z-0" />
           <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-sky-600 to-cyan-400 flex items-center justify-center text-white text-3xl font-black shadow-nutrisea-sm mb-4 relative z-10">
              {initials}
           </div>
           <h2 className="text-2xl font-black text-slate-900 mb-1">{profile?.child_name || 'Si Kecil'}</h2>
           <p className="text-sky-500 font-black text-xs uppercase tracking-widest flex items-center gap-1.5">
             <Fingerprint size={12} /> NIK: {profile?.nik_anak || '-'}
           </p>
        </div>

        {successMsg && <Alert type="success" message={successMsg} />}
        {error && <Alert type="error" message={error} />}

        {/* STATS CARD */}
        {!editing && (
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white rounded-3xl p-5 border border-sky-100 shadow-card">
               <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Disiplin Gizi</p>
               <p className="text-3xl font-black text-sky-600">{compliance.percentage}%</p>
               <p className="text-[10px] text-slate-400 font-bold">Bulan Ini</p>
             </div>
             <div className="bg-white rounded-3xl p-5 border border-sky-100 shadow-card">
               <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Total Gummy</p>
               <p className="text-3xl font-black text-cyan-600">{compliance.taken}</p>
               <p className="text-[10px] text-slate-400 font-bold">Butir Dikonsumsi</p>
             </div>
          </div>
        )}

        {/* IDENTITAS UTAMA CARD */}
        <div className="bg-white rounded-3xl p-6 border border-sky-100 shadow-card">
           <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-slate-900 flex items-center gap-2 text-lg">
                <Baby size={20} className="text-sky-600" /> Profil Si Kecil
              </h3>
              <button onClick={() => setEditing(!editing)} className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 hover:bg-sky-100 transition-all">
                {editing ? <X size={20} /> : <Edit3 size={20} />}
              </button>
           </div>

           {editing ? (
             <div className="space-y-4">
                <InputField label="Nama Lengkap Balita" icon={Baby} value={form.child_name} onChange={e => setForm(p => ({ ...p, child_name: e.target.value }))} />
                <InputField label="NIK Anak" icon={Fingerprint} value={form.nik_anak} onChange={e => setForm(p => ({ ...p, nik_anak: e.target.value }))} maxLength={16} />
                <div className="grid grid-cols-2 gap-4">
                   <InputField label="BB Lahir (gram)" icon={Weight} type="number" value={form.birth_weight} onChange={e => setForm(p => ({ ...p, birth_weight: e.target.value }))} />
                   <InputField label="PB Lahir (cm)" icon={Ruler} type="number" value={form.birth_length} onChange={e => setForm(p => ({ ...p, birth_length: e.target.value }))} />
                </div>
                <InputField label="Tanggal Lahir" icon={Calendar} type="date" value={form.date_of_birth} onChange={e => setForm(p => ({ ...p, date_of_birth: e.target.value }))} />
                <InputField label="Info Alergi" icon={AlertTriangle} value={form.allergy_info} onChange={e => setForm(p => ({ ...p, allergy_info: e.target.value }))} />
                
                <h4 className="font-black text-slate-900 pt-4 border-t border-sky-50 flex items-center gap-2">
                   <UserCircle2 size={18} className="text-sky-600" /> Profil Bunda
                </h4>
                <InputField label="Nama Lengkap Bunda" icon={UserCircle2} value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
                <InputField label="WhatsApp" icon={Phone} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                
                <Button onClick={handleSave} disabled={loading} className="py-4 shadow-nutrisea text-sm">
                   {loading ? 'Menyimpan...' : 'Perbarui Identitas NutriSea'}
                </Button>
             </div>
           ) : (
             <div className="space-y-4 divide-y divide-sky-50">
                <div className="flex justify-between items-center py-2">
                   <span className="text-xs font-black text-slate-400 uppercase">NIK Anak</span>
                   <span className="text-sm font-black text-slate-900">{profile?.nik_anak || '-'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                   <span className="text-xs font-black text-slate-400 uppercase">JK / Tgl Lahir</span>
                   <span className="text-sm font-black text-slate-900">{profile?.gender || '-'} / {profile?.date_of_birth || '-'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                   <span className="text-xs font-black text-slate-400 uppercase">BB / PB Lahir</span>
                   <span className="text-sm font-black text-slate-900">{profile?.birth_weight || '-'} g / {profile?.birth_length || '-'} cm</span>
                </div>
                <div className="pt-2">
                   <span className="text-xs font-black text-slate-400 uppercase block mb-1">Domisili</span>
                   <p className="text-sm font-bold text-slate-900 flex items-start gap-2">
                      <MapPin size={14} className="text-sky-600 mt-0.5 shrink-0" />
                      {profile?.desa ? `RT ${profile.rt}/RW ${profile.rw}, ${profile.desa}, ${profile.district}, ${profile.city}` : '- Alamat belum diisi -'}
                   </p>
                </div>
             </div>
           )}
        </div>

        {/* WALI CARD */}
        {!editing && (
          <div className="bg-white rounded-3xl p-6 border border-sky-100 shadow-card">
              <h3 className="font-black text-slate-900 flex items-center gap-2 mb-4">
                <UserCircle2 size={18} className="text-sky-600" /> Profil Bunda
              </h3>
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 shadow-sm"><Mail size={18} /></div>
                    <div><p className="text-[10px] font-black text-slate-400 uppercase">Email</p><p className="text-sm font-bold text-slate-900">{profile?.email}</p></div>
                 </div>
              </div>
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 shadow-sm"><Phone size={18} /></div>
                    <div><p className="text-[10px] font-black text-slate-400 uppercase">Telepon</p><p className="text-sm font-bold text-slate-900">{profile?.phone || '-'}</p></div>
                 </div>
              </div>
          </div>
        )}

        {/* ACTION MENU */}
        <div className="space-y-3 pb-4">
           {isAdmin && (
             <button onClick={() => navigate('/admin')} className="w-full bg-gradient-to-r from-sky-600 to-cyan-500 rounded-3xl p-5 text-white flex items-center justify-between shadow-nutrisea">
                <div className="flex items-center gap-3 font-black uppercase text-xs tracking-widest">
                   <div className="bg-white/20 p-2 rounded-xl"><LayoutDashboard size={18} /></div> Panel Admin Posyandu
                </div>
                <ChevronRight size={20} />
             </button>
           )}
           
           <button onClick={() => setShowAboutModal(true)} className="w-full bg-white rounded-3xl p-5 border border-sky-100 shadow-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="bg-sky-100 p-2.5 rounded-xl text-sky-600"><Info size={18} /></div>
                 <span className="font-black text-slate-700 text-sm">Tentang NutriSea</span>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
           </button>

           <button onClick={() => setShowLogoutModal(true)} className="w-full bg-red-50 rounded-3xl p-5 text-red-600 flex items-center justify-between border border-red-100 shadow-sm">
              <div className="flex items-center gap-3 font-black">
                 <div className="bg-white p-2.5 rounded-xl"><LogOut size={18} /></div> Keluar Akun
              </div>
              <ChevronRight size={20} className="text-red-300" />
           </button>
        </div>
      </div>

      {/* MODALS */}
      <Modal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} title="Konfirmasi Keluar"
        footer={<><Button variant="secondary" onClick={() => setShowLogoutModal(false)}>Batal</Button><Button variant="danger" onClick={handleLogout}>Keluar</Button></>}>
        Apakah Bunda yakin ingin keluar dari aplikasi NutriSea?
      </Modal>

      <Modal isOpen={showAboutModal} onClose={() => setShowAboutModal(false)} title="Identitas NutriSea"
        footer={<Button onClick={() => setShowAboutModal(false)}>Tutup</Button>}>
        <div className="text-center">
           <p className="text-5xl mb-4">🐠</p>
           <h4 className="font-black text-slate-900 text-lg mb-2">NutriSea App v1.2.0</h4>
           <p className="text-sm text-slate-500 leading-relaxed font-semibold">
             Inovasi Pencegahan Stunting Berbasis Gizi Fauna Laut. Membantu bunda memantau asupan NutriSea Gummy si kecil secara otomatis dan cerdas.
           </p>
        </div>
      </Modal>
    </div>
  );
};

export default Profil;