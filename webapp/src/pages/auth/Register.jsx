import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, UserCircle2, Fingerprint, Baby, MapPin, Calendar, Weight, Ruler } from 'lucide-react';
import { Button, InputField, Alert, FloatingPills } from '../../components/UIComponents';
import { useAuth } from '../../contexts/AuthContext';
import logoSrc from '../../assets/Nutrisea_Logo.PNG';

const RegisterScreen = () => {
  const [step, setStep] = useState('form'); 
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ 
    childName: '', nikAnak: '', birthWeight: '', birthLength: '', dateOfBirth: '', gender: '',
    fullName: '', email: '', password: '', confirmPassword: '', 
    province: '', provinceId: '', city: '', cityId: '', district: '', districtId: '', village: '', villageId: '',
    rt: '', rw: '' 
  });
  
  const [regions, setRegions] = useState({ provinces: [], cities: [], districts: [], villages: [] });
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then(res => res.json())
      .then(data => setRegions(p => ({ ...p, provinces: data.sort((a,b) => a.name.localeCompare(b.name)) })));
  }, []);

  const handleRegionChange = async (type, id, name) => {
    setForm(p => ({ ...p, [type]: name, [`${type}Id`]: id }));
    const endpoint = type === 'province' ? 'regencies' : type === 'city' ? 'districts' : 'villages';
    if (id) {
       setLoadingRegions(true);
       const res = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/${endpoint}/${id}.json`);
       const data = await res.json();
       const key = type === 'province' ? 'cities' : type === 'city' ? 'districts' : 'villages';
       setRegions(p => ({ ...p, [key]: data.sort((a,b) => a.name.localeCompare(b.name)) }));
       setLoadingRegions(false);
    }
  };

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const pad = (v) => v.length === 1 ? `0${v}` : v;

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.childName || !form.nikAnak || !form.email || !form.village) { setError('Mohon lengkapi data wajib.'); return; }
    if (form.password !== form.confirmPassword) { setError('Konfirmasi password tidak cocok.'); return; }
    if (!agreed) { setError('Harap setujui syarat & ketentuan.'); return; }

    setLoading(true);
    try {
      await signUp(form.email, form.password, {
        child_name: form.childName,
        nik_anak: form.nikAnak,
        birth_weight: form.birthWeight,
        birth_length: form.birthLength,
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        full_name: form.fullName,
        province: form.province,
        city: form.city,
        district: form.district,
        village: form.village,
        rt: pad(form.rt),
        rw: pad(form.rw)
      });
      setStep('confirm');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  if (step === 'confirm') return (
    <div className="auth-outer">
      <div className="auth-card p-10 text-center animate-slideUp">
         <div className="text-7xl mb-6">📬</div>
         <h2 className="text-3xl font-black text-slate-900 mb-2">Email Terkirim!</h2>
         <p className="text-slate-500 font-semibold mb-8">Verifikasi akun Anda melalui link yang dikirim ke <b>{form.email}</b>.</p>
         <Button onClick={() => navigate('/login')}>Ke Halaman Masuk</Button>
      </div>
    </div>
  );

  return (
    <div className="auth-outer">
      {/* Visual Kiri: Hero Image style sebelumnya */}
      <div className="auth-left-panel hidden lg:flex" style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0891b2 40%, #06b6d4 100%)' }}>
        <div className="relative z-10 text-white text-center max-w-sm px-8">
          <img src={logoSrc} alt="NutriSea" className="w-53 h-auto object-contain mx-auto mb-6 brightness-0 invert" />
          <h1 className="text-4xl font-black mb-4 leading-tight">Lengkapi Gizi, Cegah Stunting</h1>
          <p className="text-white/80 text-base leading-relaxed font-semibold">Pantau tumbuh kembang si kecil secara cerdas bersama NutriSea.</p>
        </div>
      </div>

      <div className="auth-card">
        <div className="flex flex-col min-h-full px-8 py-12 relative scroll-area overflow-y-auto max-h-screen">
          <FloatingPills />
          <div className="flex lg:hidden justify-center mb-8">
            <img src={logoSrc} alt="NutriSea" className="h-12" />
          </div>
          
          <div className="mb-8 lg:text-left text-center">
            <h2 className="text-4xl font-black text-slate-900 leading-tight">Daftar Akun</h2>
            <p className="text-sm text-slate-500 font-bold mt-2">Ciptakan masa depan sehat untuk balita Anda.</p>
          </div>

          {error && <div className="mb-6"><Alert type="error" message={error} /></div>}

          <form onSubmit={handleRegister} className="space-y-5">
            {/* Form Input Clean Style (Tanpa Border Header) */}
            <InputField icon={Baby} name="childName" placeholder="Nama Lengkap Balita" value={form.childName} onChange={handle} />
            <InputField icon={Fingerprint} name="nikAnak" placeholder="NIK Anak (16 Digit)" maxLength={16} value={form.nikAnak} onChange={handle} />
            
            <div className="grid grid-cols-2 gap-4">
               <InputField icon={Weight} name="birthWeight" placeholder="BB Lahir (g)" type="number" value={form.birthWeight} onChange={handle} />
               <InputField icon={Ruler} name="birthLength" placeholder="PB Lahir (cm)" type="number" value={form.birthLength} onChange={handle} />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="relative flex-1">
                 <UserCircle2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-400 pointer-events-none z-10" />
                 <select name="gender" value={form.gender} onChange={handle} className="region-select !pl-11 text-sm">
                    <option value="">Jenis Kelamin</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                 </select>
               </div>
               <div className="relative flex-1">
                 <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-400 pointer-events-none z-10" />
                 <input type="date" name="date_of_birth" value={form.date_of_birth} onChange={handle} className="region-input !pl-11 text-xs" />
               </div>
            </div>

            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <select className="region-select" onChange={e => handleRegionChange('province', e.target.selectedOptions[0].id, e.target.value)}>
                   <option>Pilih Provinsi</option>
                   {regions.provinces.map(r => <option key={r.id} id={r.id} value={r.name}>{r.name}</option>)}
                </select>
                <select className="region-select" disabled={!form.provinceId || loadingRegions} onChange={e => handleRegionChange('city', e.target.selectedOptions[0].id, e.target.value)}>
                   <option>Pilih Kab/Kota</option>
                   {regions.cities.map(r => <option key={r.id} id={r.id} value={r.name}>{r.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <select className="region-select" disabled={!form.cityId || loadingRegions} onChange={e => handleRegionChange('district', e.target.selectedOptions[0].id, e.target.value)}>
                   <option>Pilih Kecamatan</option>
                   {regions.districts.map(r => <option key={r.id} id={r.id} value={r.name}>{r.name}</option>)}
                </select>
                <select className="region-select" disabled={!form.districtId || loadingRegions} onChange={e => handleRegionChange('village', e.target.selectedOptions[0].id, e.target.value)}>
                   <option>Pilih Desa</option>
                   {regions.villages.map(r => <option key={r.id} id={r.id} value={r.name}>{r.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="relative">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">RT</span>
                   <input type="number" name="rt" placeholder="01" value={form.rt} onChange={handle} className="region-input pl-10" />
                 </div>
                 <div className="relative">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">RW</span>
                   <input type="number" name="rw" placeholder="05" value={form.rw} onChange={handle} className="region-input pl-10" />
                 </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <InputField icon={User} name="fullName" placeholder="Nama Lengkap Bunda" value={form.fullName} onChange={handle} />
              <InputField icon={Mail} name="email" type="email" placeholder="Email Aktif" value={form.email} onChange={handle} />
              <div className="grid grid-cols-2 gap-4">
                <InputField icon={Lock} name="password" type={showPass ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={handle} />
                <InputField icon={ShieldCheck} name="confirmPassword" type="password" placeholder="Konfirmasi" value={form.confirmPassword} onChange={handle} />
              </div>
            </div>

            <div className="flex items-start gap-3 py-2">
               <button type="button" onClick={() => setAgreed(!agreed)} className={`w-6 h-6 rounded-lg border-2 mt-0.5 flex-shrink-0 flex items-center justify-center transition-all ${agreed ? 'bg-sky-600 border-sky-600' : 'border-sky-100'}`}>
                 {agreed && <ArrowRight size={14} className="text-white" />}
               </button>
               <p className="text-xs text-slate-500 font-bold leading-relaxed">Saya menyetujui program intervensi gizi NutriSea.</p>
            </div>

            <Button type="submit" disabled={loading} className="py-5 shadow-nutrisea text-base">
              {loading ? 'Mendaftarkan Akun...' : 'Buat Akun Sekarang'}
            </Button>
          </form>

          <p className="text-center mt-12 text-sm text-slate-500 font-bold pb-8">
            Siap untuk mulai? <Link to="/login" className="text-sky-600 font-black hover:underline">Masuk Disini</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterScreen;