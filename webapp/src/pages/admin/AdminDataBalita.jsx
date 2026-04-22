import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit3, Save, X, Search, ChevronRight, ChevronLeft, Clock, User, Fish, BarChart2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Alert, Badge, Modal, Button } from '../../components/UIComponents';

const emptyMed = { name: '', dosage: '', frequency: '', instruction: '', start_date: '', end_date: '', total_tablets: 0, remaining_tablets: 0, schedule_times: ['08:00'], admin_notes: '', is_active: true };

const AdminDataBalita = () => {
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
  const [deleteModal, setDeleteModal] = useState(null); // { id, type }
  const [activeTab, setActiveTab] = useState('data'); // 'data' | 'obat' | 'kepatuhan' | 'pertumbuhan'

  const fetchPatients = useCallback(async () => {
    setError('');
    try {
      const { data, error } = await supabase
        .from('profiles').select('*').eq('role', 'user').order('full_name');
      if (error) throw new Error('Gagal memuat data bunda: ' + error.message);
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
        supabase.from('symptom_logs').select('*').eq('user_id', p.id).contains('symptoms', ['tumbuh_kembang']).order('created_at', { ascending: false }).limit(10)
      ]);
      setPatientMeds(medRes.data || []);
      setPatientLogs(logRes.data || []);
      setPatientSymptoms(sympRes.data || []);
    } catch (err) { setError('Gagal memuat detail bunda: ' + err.message); }
  };

  const openMedForm = (med = null) => {
    setEditMedId(med?.id || null);
    setMedForm(med ? { ...med, schedule_times: med.schedule_times || ['08:00'] } : { ...emptyMed, start_date: new Date().toISOString().split('T')[0], name: 'NutriSea Gummy', dosage: '1 Gummy' });
    setShowMedForm(true);
  };

  const saveMed = async (e) => {
    e.preventDefault();
    
    if (!medForm.name?.trim()) { setError('Nama NutriSea Gummy wajib diisi agar bunda tidak bingung.'); return; }
    if (!medForm.dosage?.trim()) { setError('Dosis wajib diisi (misal: 1 Butir) untuk keamanan dosis balita.'); return; }
    if (!medForm.frequency?.trim()) { setError('Frekuensi wajib diisi (misal: 1x Sehari) untuk pengingat otomatis.'); return; }
    if (!medForm.start_date) { setError('Tanggal mulai program wajib ditentukan.'); return; }
    if (!medForm.total_tablets || medForm.total_tablets <= 0) { setError('Total persediaan gummy harus lebih dari 0.'); return; }

    setSaving(true); setError('');
    try {
      const payload = {
        user_id: selected.id,
        name: medForm.name,
        dosage: medForm.dosage,
        frequency: medForm.frequency,
        instruction: medForm.instruction || '',
        start_date: medForm.start_date,
        end_date: medForm.end_date || null,
        total_tablets: Number(medForm.total_tablets) || 0,
        remaining_tablets: editMedId ? Number(medForm.remaining_tablets) : Number(medForm.total_tablets) || 0,
        is_active: medForm.is_active ?? true,
        schedule_times: medForm.schedule_times || ['08:00']
      };

      if (editMedId) {
        const { error } = await supabase.from('medications').update(payload).eq('id', editMedId);
        if (error) throw new Error('Gagal memperbarui jadwal: ' + error.message);
      } else {
        const { error } = await supabase.from('medications').insert(payload);
        if (error) throw new Error('Gagal menambah jadwal: ' + error.message);
      }
      setShowMedForm(false);
      await selectPatient(selected);
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  const toggleMedStatus = async (id, isActive) => {
    try {
      const { error } = await supabase.from('medications').update({ is_active: !isActive }).eq('id', id);
      if (error) throw new Error('Gagal mengubah status: ' + error.message);
      await selectPatient(selected);
    } catch (err) { setError(err.message); }
  };

  const deleteMed = async () => {
    if (!deleteModal) return;
    try {
      const { error } = await supabase.from('medications').delete().eq('id', deleteModal.id);
      if (error) throw new Error('Gagal menghapus jadwal: ' + error.message);
      setDeleteModal(null);
      await selectPatient(selected);
    } catch (err) { setError(err.message); }
  };

  const patientCompliance = (() => {
    const startMonth = new Date(); startMonth.setDate(1); startMonth.setHours(0,0,0,0);
    const monthLogs = patientLogs.filter(l => new Date(l.taken_at) >= startMonth);
    const daysIn = new Date().getDate();
    const activeMeds = patientMeds.filter(m => m.is_active).length;
    const expected = activeMeds * daysIn;
    return expected > 0 ? Math.min(Math.round((monthLogs.length / expected) * 100), 100) : 0;
  })();

  const [regionFilter, setRegionFilter] = useState({ province: '', city: '', district: '' });

  const filtered = patients.filter(p => {
    const matchesSearch = !search || 
      p.full_name?.toLowerCase().includes(search.toLowerCase()) || 
      p.child_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase()) ||
      p.nik_anak?.includes(search);
    
    const matchesProv = !regionFilter.province || p.province === regionFilter.province;
    const matchesCity = !regionFilter.city || p.city === regionFilter.city;
    const matchesDist = !regionFilter.district || p.district === regionFilter.district;

    return matchesSearch && matchesProv && matchesCity && matchesDist;
  });

  const provinces = [...new Set(patients.map(p => p.province).filter(Boolean))].sort();
  const cities = [...new Set(patients.filter(p => !regionFilter.province || p.province === regionFilter.province).map(p => p.city).filter(Boolean))].sort();
  const districts = [...new Set(patients.filter(p => !regionFilter.city || p.city === regionFilter.city).map(p => p.district).filter(Boolean))].sort();

  const getInitials = n => n?.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || '?';

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-sky-100 border-t-sky-600 rounded-full animate-spin" />
    </div>
  );

  /* ─── Patient Detail View ─── */
  if (selected) {
    return (
      <div>
        {/* Back */}
        <button onClick={() => { setSelected(null); setShowMedForm(false); setError(''); }}
          className="flex items-center gap-2 text-sky-600 font-bold text-sm mb-6 hover:text-sky-700">
          <ChevronLeft size={18} /> Kembali ke Database
        </button>

        {/* Patient header */}
        <div className="bg-gradient-to-br from-sky-100 to-sky-50 rounded-2xl p-6 mb-6 border border-sky-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-600 to-cyan-500 flex items-center justify-center text-white font-black text-xl shadow-nutrisea-sm">
              {getInitials(selected.full_name)}
            </div>
            <div>
              <h2 className="text-2xl font-black text-sky-600">{selected.full_name || '-'}</h2>
              <p className="text-slate-600 font-semibold text-sm">{selected.email}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {selected.gender && <Badge>{selected.gender}</Badge>}
                {selected.phone && <Badge color="slate">{selected.phone}</Badge>}
              </div>
            </div>
            {/* Compliance badge */}
            <div className="ml-auto text-right">
              <p className="text-xs font-black text-slate-400 uppercase mb-1">Kepatuhan Beri Gummy</p>
              <p className={`text-3xl font-black ${patientCompliance >= 80 ? 'text-sky-600' : patientCompliance >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                {patientCompliance}%
              </p>
            </div>
          </div>
        </div>

        {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

        {/* Tabs */}
        <div className="flex gap-1 bg-sky-100 p-1 rounded-2xl mb-5 overflow-x-auto hide-scrollbar">
          {[
            { key: 'data', label: 'Rincian Profil Pengguna' },
            { key: 'pertumbuhan', label: `Pertumbuhan Anak (${patientSymptoms.length})` },
            { key: 'obat', label: `Jadwal Konsumsi (${patientMeds.length})` },
            { key: 'kepatuhan', label: `Log Kepatuhan (${patientLogs.length})` },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === t.key ? 'bg-white text-sky-600 shadow-card' : 'text-slate-500'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Data Pribadi */}
        {activeTab === 'data' && (
          <div className="bg-white rounded-2xl p-6 border border-sky-100 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 shadow-sm">
            {[
              { label: 'Nama Lengkap Bunda', value: selected.full_name },
              { label: 'Email Pengguna', value: selected.email },
              { label: 'Nomor Telepon', value: selected.phone || '-' },
              { label: 'NIK Anak', value: selected.nik_anak || '-' },
              { label: 'Nama Anak', value: selected.child_name || '-' },
              { label: 'Jenis Kelamin Anak', value: selected.gender || '-' },
              { label: 'Tanggal Lahir Anak', value: selected.date_of_birth ? new Date(selected.date_of_birth).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-' },
              { label: 'Berat Lahir', value: selected.birth_weight ? `${selected.birth_weight} kg` : '-' },
              { label: 'Panjang Lahir', value: selected.birth_length ? `${selected.birth_length} cm` : '-' },
              { label: 'Provinsi', value: selected.province || '-' },
              { label: 'Kota / Kabupaten', value: selected.city || '-' },
              { label: 'Kecamatan', value: selected.district || '-' },
              { label: 'Desa / Kelurahan', value: selected.village || '-' },
              { label: 'RT / RW', value: (selected.rt && selected.rw) ? `RT ${selected.rt} / RW ${selected.rw}` : '-' },
              { label: 'Alergi', value: selected.allergy_info || 'Tidak ada' },
              { label: 'Status Profil', value: selected.is_profile_complete ? 'Lengkap' : 'Belum Lengkap' },
              { label: 'Data Tercatat Sejak', value: new Date(selected.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center py-2.5 border-b border-sky-50 last:border-0 md:last:border-b">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">{item.label}</span>
                <span className={`text-sm font-bold text-slate-800`}>{item.value}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'pertumbuhan' && (
          <div className="space-y-3">
            {patientSymptoms.length === 0 ? (
              <div className="text-center py-8 text-slate-400 font-bold">Belum ada jurnal pertumbuhan anak yang dicatat bunda.</div>
            ) : patientSymptoms.map(log => {
               const tbMatch = log.notes?.match(/TB:\s*(\d+(\.\d+)?)\s*cm/);
               const bbMatch = log.notes?.match(/BB:\s*(\d+(\.\d+)?)\s*kg/);
               const noteDetailsMatch = log.notes?.match(/Catatan:\s*(.*)/);
               const actualNote = noteDetailsMatch ? noteDetailsMatch[1] : '';

              return (
                <div key={log.id} className={`bg-white rounded-2xl p-4 border-2 border-sky-100`}>
                  <div className="flex justify-between items-center mb-2 border-b border-sky-50 pb-2">
                     <div className="flex items-center gap-4">
                        <div className="text-center">
                           <p className="text-[10px] uppercase font-black text-slate-400">Tinggi</p>
                           <p className="font-black text-slate-900">{tbMatch ? tbMatch[1] : '-'} <span className="text-xs font-bold text-slate-500">cm</span></p>
                        </div>
                        <div className="text-center">
                           <p className="text-[10px] uppercase font-black text-slate-400">Berat</p>
                           <p className="font-black text-slate-900">{bbMatch ? bbMatch[1] : '-'} <span className="text-xs font-bold text-slate-500">kg</span></p>
                        </div>
                     </div>
                     <p className="text-[10px] text-slate-400 font-bold flex items-center justify-end gap-1">
                        <Clock size={10} />
                        {new Date(log.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year:'numeric' })}
                     </p>
                  </div>
                  {actualNote && <p className="text-xs font-semibold text-slate-600 bg-sky-50 p-2 rounded-lg inline-block text-left w-full">" {actualNote} "</p>}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'obat' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-black text-slate-900">Jadwal Konsumsi NutriSea</h4>
              <button onClick={() => openMedForm()}
                className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-xl font-bold text-sm hover:bg-sky-700 transition">
                <Plus size={14} /> Tambah Jadwal
              </button>
            </div>

            {/* Med form */}
            {showMedForm && (
              <form onSubmit={saveMed} className="bg-sky-50 rounded-2xl p-5 border border-sky-100 mb-5 space-y-4 shadow-inner">
                <div className="flex justify-between items-center">
                  <h5 className="font-black text-slate-900">{editMedId ? 'Edit Jadwal' : 'Jadwal Baru'}</h5>
                  <button type="button" onClick={() => { setShowMedForm(false); setEditMedId(null); setError(''); }} className="text-slate-400 hover:text-sky-600"><X size={18} /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Nama Gummy / Produk', name: 'name', placeholder: 'NutriSea Original', required: true },
                    { label: 'Dosis', name: 'dosage', placeholder: '1 Gummy', required: true },
                    { label: 'Frekuensi', name: 'frequency', placeholder: '1x sehari', required: true },
                    { label: 'Instruksi', name: 'instruction', placeholder: 'Setelah makan pagi' },
                    { label: 'Tanggal Mulai Diberikan', name: 'start_date', type: 'date', required: true },
                    { label: 'Tanggal Selesai Program', name: 'end_date', type: 'date' },
                    { label: 'Total Persediaan (Biji)', name: 'total_tablets', type: 'number', placeholder: '30' },
                  ].map(f => (
                    <div key={f.name}>
                      <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1 block">{f.label} {f.required && '*'}</label>
                      <input name={f.name} type={f.type || 'text'} placeholder={f.placeholder} value={medForm[f.name] || ''}
                        onChange={e => setMedForm(p => ({ ...p, [f.name]: e.target.value }))}
                        className="w-full bg-white border-2 border-sky-100 rounded-xl px-3 py-2.5 text-slate-900 font-semibold text-sm focus:outline-none focus:border-sky-600" />
                    </div>
                  ))}
                </div>
                {/* Schedule times (Modern Input) */}
                <div className="bg-white/50 p-4 rounded-xl border border-sky-100">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3 block flex justify-between items-center">
                    Jam Pengingat Otomatis
                    <button type="button" onClick={() => setMedForm(p => ({ ...p, schedule_times: [...(p.schedule_times || []), '08:00'] }))}
                      className="text-[10px] bg-sky-600 text-white px-2 py-1 rounded-lg hover:bg-sky-700 transition flex items-center gap-1">
                      <Plus size={10} /> TAMBAH JAM
                    </button>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(medForm.schedule_times || ['08:00']).map((time, idx) => (
                      <div key={idx} className="flex items-center gap-1 bg-white border border-sky-100 p-1.5 rounded-xl shadow-sm">
                        <input type="time" value={time}
                          onChange={e => {
                            const newTimes = [...(medForm.schedule_times || ['08:00'])];
                            newTimes[idx] = e.target.value;
                            setMedForm(p => ({ ...p, schedule_times: newTimes }));
                          }}
                          className="text-xs font-bold text-slate-700 focus:outline-none" />
                        {(medForm.schedule_times?.length > 1) && (
                          <button type="button" onClick={() => setMedForm(p => ({ ...p, schedule_times: p.schedule_times.filter((_, i) => i !== idx) }))}
                            className="text-red-400 hover:text-red-600 p-0.5">
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {error && <Alert type="error" message={error} />}
                <div className="flex gap-3">
                  <button type="submit" disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 text-white rounded-xl font-bold text-sm hover:bg-sky-700 disabled:opacity-50 transition">
                    <Save size={14} /> {saving ? 'Menyimpan...' : editMedId ? 'Simpan' : 'Tambahkan'}
                  </button>
                  <button type="button" onClick={() => { setShowMedForm(false); setEditMedId(null); }}
                    className="px-5 py-2.5 bg-sky-100 text-sky-600 rounded-xl font-bold text-sm hover:bg-sky-200 transition">
                    Batal
                  </button>
                </div>
              </form>
            )}

            {patientMeds.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-sky-100">
                <div className="text-4xl mb-2">🐠</div>
                <p className="font-bold text-slate-400 text-sm">Belum ada jadwal konsumsi.</p>
              </div>
            ) : patientMeds.map(med => (
              <div key={med.id} className={`bg-white rounded-2xl p-5 border-2 mb-3 shadow-card ${med.is_active ? 'border-sky-100' : 'border-slate-100 opacity-70'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${med.is_active ? 'bg-sky-100' : 'bg-slate-100'}`}>
                      <Fish size={18} className={med.is_active ? 'text-sky-600' : 'text-slate-400'} />
                    </div>
                    <div>
                      <p className="font-black text-slate-900">{med.name} <span className="text-sky-600">{med.dosage}</span></p>
                      <p className="text-xs text-slate-500 font-semibold">{med.frequency}</p>
                      {med.schedule_times?.length > 0 && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock size={10} className="text-slate-400" />
                          <span className="text-[10px] text-slate-400 font-semibold">{med.schedule_times.join(' · ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleMedStatus(med.id, med.is_active)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black ${med.is_active ? 'bg-sky-100 text-sky-600' : 'bg-slate-100 text-slate-500'}`}>
                      {med.is_active ? 'Aktif' : 'Nonaktif'}
                    </button>
                    <button onClick={() => openMedForm(med)} className="p-1.5 rounded-xl hover:bg-sky-50 transition text-slate-400 hover:text-sky-600"><Edit3 size={14} /></button>
                    <button onClick={() => setDeleteModal({ id: med.id })} className="p-1.5 rounded-xl hover:bg-red-50 transition text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 bg-sky-50 rounded-xl p-3 text-xs border border-sky-100">
                  <div><span className="text-slate-500 font-bold block">Instruksi</span><span className="font-bold text-slate-900">{med.instruction || '-'}</span></div>
                  <div><span className="text-slate-500 font-bold block">Sisa</span><span className="font-bold text-sky-600">{med.remaining_tablets} gummy</span></div>
                  <div><span className="text-slate-500 font-bold block">Selesai</span><span className="font-bold text-slate-900">{med.end_date ? new Date(med.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}</span></div>
                </div>
                {med.admin_notes && <p className="text-xs text-sky-600 font-semibold mt-2 pl-1">📝 Pesan Kader: {med.admin_notes}</p>}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'kepatuhan' && (
          <div>
            <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-2xl p-4 mb-4 border border-sky-100 flex items-center gap-4">
              <div className={`text-4xl font-black ${patientCompliance >= 80 ? 'text-sky-600' : patientCompliance >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                {patientCompliance}%
              </div>
              <div>
                <p className="font-black text-slate-900">Kepatuhan Target Bulan Ini</p>
                <p className="text-xs text-slate-500 font-semibold">{patientLogs.filter(l => new Date(l.taken_at) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)).length} laporan konsumsi anak tercatat</p>
              </div>
            </div>
            {patientLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-400 font-bold">Belum ada aktivitas.</div>
            ) : (
              <div className="space-y-2">
                {patientLogs.map(log => (
                  <div key={log.id} className="bg-white rounded-xl p-3 border border-sky-100 flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${log.status === 'taken' ? 'bg-sky-600' : 'bg-red-400'}`} />
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 text-sm">{log.medications?.name} {log.medications?.dosage}</p>
                      <p className="text-xs text-slate-400 font-semibold">{new Date(log.taken_at).toLocaleString('id-ID')}</p>
                    </div>
                    <Badge color={log.status === 'taken' ? 'sky' : 'red'}>{log.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Hapus Jadwal?"
          footer={<><Button variant="secondary" onClick={() => setDeleteModal(null)}>Batal</Button><Button variant="danger" onClick={deleteMed}>Hapus</Button></>}>
          Jadwal konsumsi gummy ini akan dihapus permanen dan tidak bisa dikembalikan.
        </Modal>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-gradient-to-br from-sky-600 to-cyan-500 rounded-2xl p-8 mb-6 shadow-nutrisea text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h3 className="text-3xl font-black text-white tracking-tight mb-1">Database Real-Time Bunda</h3>
            <p className="text-white/80 font-semibold text-sm">{patients.length} bunda terdaftar posyandu · Klik untuk detail pertumbuhan balita</p>
          </div>
        </div>
      </div>

      {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

      <div className="space-y-3 mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama bunda, nama anak, NIK, atau email..."
            className="w-full bg-white border-2 border-sky-100 rounded-2xl pl-10 pr-4 py-3.5 text-slate-900 font-bold text-sm focus:outline-none focus:border-sky-600 shadow-nutrisea-sm" />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select value={regionFilter.province} onChange={e => setRegionFilter({ province: e.target.value, city: '', district: '' })}
            className="bg-white border-2 border-sky-50 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 focus:outline-none focus:border-sky-600 shadow-sm cursor-pointer">
            <option value="">Semua Provinsi</option>
            {provinces.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={regionFilter.city} onChange={e => setRegionFilter({ ...regionFilter, city: e.target.value, district: '' })}
            disabled={!regionFilter.province}
            className="bg-white border-2 border-sky-50 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 focus:outline-none focus:border-sky-600 shadow-sm cursor-pointer disabled:opacity-50">
            <option value="">Semua Kota/Kab</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={regionFilter.district} onChange={e => setRegionFilter({ ...regionFilter, district: e.target.value })}
            disabled={!regionFilter.city}
            className="bg-white border-2 border-sky-50 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 focus:outline-none focus:border-sky-600 shadow-sm cursor-pointer disabled:opacity-50">
            <option value="">Semua Kecamatan</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      {/* Table */}
      <div className="bg-white rounded-2xl border border-sky-100 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-sky-50">
              <tr>
                {['Data Pengguna & Anak', 'Kontak WhatsApp', 'NIK & Domisili', 'Aksi'].map(h => (
                  <th key={h} className="text-left px-5 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-400 font-bold">
                  {search ? `Tidak ada pengguna dengan nama "${search}"` : 'Belum ada data pengguna.'}
                </td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="hover:bg-sky-50/50 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600 font-black text-xs shrink-0">
                        {getInitials(p.child_name || p.full_name)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{p.child_name || 'Si Kecil'}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Bunda: {p.full_name || '-'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-slate-600 font-bold">{p.phone || '-'}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">{p.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-xs text-sky-600 font-black mb-0.5">NIK: {p.nik_anak || '-'}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                      {p.desa ? `${p.desa} · RT ${p.rt}/RW ${p.rw}` : '-'}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => selectPatient(p)} className="text-sky-600 font-black text-xs hover:text-sky-700 flex items-center gap-1.5 bg-sky-50 px-3 py-2 rounded-xl transition-all">
                      BUKA PROFIL <ChevronRight size={14} />
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

export default AdminDataBalita;
