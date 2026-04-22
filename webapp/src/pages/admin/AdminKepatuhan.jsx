import React, { useState, useEffect, useCallback } from 'react';
import { Search, TrendingUp, TrendingDown, Minus, Clock, BarChart2, AlertTriangle, Map, ShieldCheck, Zap, MapPin, ChevronRight, ArrowLeftCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Alert, Badge, CircularProgress } from '../../components/UIComponents';

const groupByLevel = (data, levelKey) => {
  const groups = {};
  data.forEach(p => {
    const key = p[levelKey] || `Tidak Terdata (${levelKey})`;
    if (!groups[key]) groups[key] = { name: key, totalComp: 0, count: 0 };
    groups[key].totalComp += p.compliance;
    groups[key].count += 1;
  });
  return Object.values(groups).map(g => ({
    name: g.name,
    comp: Math.round(g.totalComp / g.count),
    count: g.count
  })).sort((a, b) => b.comp - a.comp);
};

const AdminKepatuhan = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [heatmapSearch, setHeatmapSearch] = useState('');
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ high: 0, medium: 0, low: 0, avgOverall: 0 });
  const [sortBy, setSortBy] = useState('compliance'); 
  const [sortAsc, setSortAsc] = useState(false);
  
  const [drillLevel, setDrillLevel] = useState('province'); // 'province' | 'city' | 'district'
  const [drillFilters, setDrillFilters] = useState({ province: null, city: null });

  const fetchData = useCallback(async () => {
    setError('');
    try {
      const startMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const daysIn = new Date().getDate();

      const [profilesRes, medsRes, logsRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email, phone, rt, rw, desa, province, city, district, village').eq('role', 'user').order('full_name'),
        supabase.from('medications').select('user_id').eq('is_active', true),
        supabase.from('compliance_logs').select('user_id, taken_at, medication_id').eq('status', 'taken').gte('taken_at', startMonth)
      ]);

      if (profilesRes.error) throw new Error('Gagal memuat data: ' + profilesRes.error.message);

      const users = profilesRes.data || [];
      const meds = medsRes.data || [];
      const logs = logsRes.data || [];

      const enriched = users.map(u => {
        const uMeds = meds.filter(m => m.user_id === u.id).length;
        const uLogs = logs.filter(l => l.user_id === u.id).length;
        const expected = uMeds * daysIn;
        const compliance = expected > 0 ? Math.min(Math.round((uLogs / expected) * 100), 100) : 0;
        return { ...u, compliance, taken: uLogs, expected, activeMeds: uMeds };
      });

      enriched.sort((a, b) => {
        if (sortBy === 'compliance') return sortAsc ? a.compliance - b.compliance : b.compliance - a.compliance;
        return sortAsc ? a.full_name?.localeCompare(b.full_name) : b.full_name?.localeCompare(a.full_name);
      });

      setPatients(enriched);

      const high = enriched.filter(p => p.compliance >= 80).length;
      const medium = enriched.filter(p => p.compliance >= 50 && p.compliance < 80).length;
      const low = enriched.filter(p => p.compliance < 50).length;
      const avgOverall = enriched.length > 0 ? Math.round(enriched.reduce((s, p) => s + p.compliance, 0) / enriched.length) : 0;
      setStats({ high, medium, low, avgOverall });
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }, [sortBy, sortAsc]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getHeatmapDisplayData = () => {
    if (heatmapSearch.trim()) {
      const searchLower = heatmapSearch.toLowerCase();
      const globalGroups = {};
      
      patients.forEach(p => {
        const matchProv = p.province?.toLowerCase().includes(searchLower);
        const matchCity = p.city?.toLowerCase().includes(searchLower);
        const matchDist = p.district?.toLowerCase().includes(searchLower);
        const matchVill = p.village?.toLowerCase().includes(searchLower);

        if (matchProv || matchCity || matchDist || matchVill) {
          let key = '';
          let level = '';
          if (matchVill) { key = p.village; level = 'Desa'; }
          else if (matchDist) { key = p.district; level = 'Kecamatan'; }
          else if (matchCity) { key = p.city; level = 'Kota'; }
          else { key = p.province; level = 'Provinsi'; }
          
          const fullKey = `${key} (${level})`;
          if (!globalGroups[fullKey]) globalGroups[fullKey] = { name: key, sub: level, totalComp: 0, count: 0 };
          globalGroups[fullKey].totalComp += p.compliance;
          globalGroups[fullKey].count += 1;
        }
      });

      return Object.values(globalGroups).map(g => ({
        name: g.name,
        sub: g.sub,
        comp: Math.round(g.totalComp / g.count),
        count: g.count,
        isSearchResult: true
      })).sort((a, b) => b.comp - a.comp);
    }

    const levelData = patients.filter(p => {
      if (drillLevel === 'city') return p.province === drillFilters.province;
      if (drillLevel === 'district') return p.province === drillFilters.province && p.city === drillFilters.city;
      return true;
    });

    return groupByLevel(levelData, drillLevel);
  };

  const heatmapGroups = getHeatmapDisplayData();

  const filteredPatients = patients.filter(p =>
    !search || p.full_name?.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase())
  );

  const compCategory = v => v >= 80 ? { label: 'Tinggi', color: 'sky', trend: TrendingUp, tc: 'text-sky-600', bg: 'bg-sky-50', mapBg: 'bg-sky-500' }
    : v >= 50 ? { label: 'Sedang', color: 'amber', trend: Minus, tc: 'text-amber-600', bg: 'bg-amber-50', mapBg: 'bg-amber-500' }
    : { label: 'Rendah', color: 'red', trend: TrendingDown, tc: 'text-red-600', bg: 'bg-red-50', mapBg: 'bg-red-500' };

  const handleDrillClick = (group) => {
    if (group.isSearchResult) {
        if (group.sub === 'Provinsi') { setDrillLevel('city'); setDrillFilters({ province: group.name, city: null }); }
        else if (group.sub === 'Kota') { setDrillLevel('district'); setDrillFilters({ ...drillFilters, city: group.name }); }
        setHeatmapSearch('');
        return;
    }

    if (drillLevel === 'province') {
      setDrillFilters({ ...drillFilters, province: group.name });
      setDrillLevel('city');
    } else if (drillLevel === 'city') {
      setDrillFilters({ ...drillFilters, city: group.name });
      setDrillLevel('district');
    }
  };

  const resetDrill = () => {
    setDrillLevel('province');
    setDrillFilters({ province: null, city: null });
    setHeatmapSearch('');
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-sky-100 border-t-sky-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="animate-slideUp">
      <div className="bg-gradient-to-br from-sky-600 to-cyan-500 rounded-3xl p-8 mb-6 shadow-nutrisea text-white">
        <h3 className="text-3xl font-black tracking-tight mb-1">Analisis Kepatuhan</h3>
        <p className="text-white/80 font-semibold text-sm">Monitor kedisiplinan bunda dalam memberikan NutriSea Gummy untuk si kecil.</p>
      </div>

      {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

      {/* Heatmap Wilayah (Refactored) */}
      <div className="bg-white rounded-3xl border border-sky-100 p-6 shadow-nutrisea-sm mb-6">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
               <h4 className="font-black text-slate-900 flex items-center gap-2 mb-1">
                  <Map size={20} className="text-sky-600"/> Heatmap Kepatuhan NutriSea
               </h4>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {drillLevel === 'province' ? 'Tingkat Nasional (Provinsi)' : 
                   drillLevel === 'city' ? `Kabupaten di ${drillFilters.province}` : 
                   `Kecamatan di ${drillFilters.city}`}
               </p>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
               <div className="relative flex-1 md:w-48">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-300" />
                  <input value={heatmapSearch} onChange={e => setHeatmapSearch(e.target.value)} 
                    placeholder="Cari wilayah..." 
                    className="w-full bg-sky-50/50 border border-sky-100 rounded-xl pl-9 pr-3 py-2 text-xs font-bold focus:outline-none focus:border-sky-600" />
               </div>
               {drillLevel !== 'province' && (
                  <button onClick={resetDrill} className="px-3 py-2 bg-sky-600 text-white rounded-xl text-xs font-black shadow-sm hover:bg-sky-700 transition">
                     <ArrowLeftCircle size={14} className="inline mr-1" /> Reset
                  </button>
               )}
            </div>
         </div>

         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {heatmapGroups.length > 0 ? heatmapGroups.map((r, idx) => {
               const cat = compCategory(r.comp);
               return (
                  <button key={idx} onClick={() => handleDrillClick(r)} disabled={drillLevel === 'district' && !r.isSearchResult}
                    className={`${cat.bg} rounded-3xl p-5 border border-white flex flex-col items-center justify-center text-center transition-all hover:shadow-lg group shadow-sm relative overflow-hidden`}>
                     <div className={`w-14 h-14 rounded-[1.2rem] ${cat.mapBg} text-white flex items-center justify-center font-black mb-3 shadow-nutrisea-sm border-2 border-white text-lg relative z-10`}>
                        {r.comp}%
                     </div>
                     <p className={`font-black ${cat.tc} text-[11px] uppercase tracking-wider leading-tight relative z-10 transition-transform group-hover:scale-105`}>
                        {r.name} {r.sub && <span className="opacity-40 text-[9px]">({r.sub})</span>}
                     </p>
                     <p className="text-[9px] text-slate-400 font-bold mt-1 relative z-10">{r.count} Bunda</p>
                     
                     {drillLevel !== 'district' && (
                       <ChevronRight size={14} className={`absolute bottom-2 right-2 ${cat.tc} opacity-20 group-hover:opacity-100 transition-all`} />
                     )}
                  </button>
               )
            }) : (
               <div className="col-span-full py-16 text-center">
                  <MapPin size={40} className="mx-auto mb-3 text-sky-100" />
                  <p className="text-xs font-black text-sky-400 uppercase tracking-widest">Tidak ada data wilayah ditemukan.</p>
               </div>
            )}
         </div>

         <div className="mt-8 flex flex-wrap gap-5 text-[10px] font-black justify-center border-t border-sky-50 pt-5 uppercase tracking-widest">
             <span className="flex items-center gap-1.5 text-sky-600">
               <div className="w-2.5 h-2.5 bg-sky-500 rounded-full shadow-sm"></div> Patuh (≥80%)
             </span>
             <span className="flex items-center gap-1.5 text-amber-600">
               <div className="w-2.5 h-2.5 bg-amber-500 rounded-full shadow-sm"></div> Sedang (50-79%)
             </span>
             <span className="flex items-center gap-1.5 text-red-600">
               <div className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm"></div> Rendah (&lt;50%)
             </span>
         </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Kepatuhan Tinggi', value: stats.high, sub: '≥ 80%', color: 'bg-sky-50', val: 'text-sky-600', icon: ShieldCheck },
          { label: 'Kepatuhan Sedang', value: stats.medium, sub: '50–79%', color: 'bg-amber-50', val: 'text-amber-600', icon: Minus },
          { label: 'Kepatuhan Rendah', value: stats.low, sub: '< 50%', color: 'bg-red-50', val: 'text-red-600', icon: AlertTriangle },
          { label: 'Rata-rata Global', value: `${stats.avgOverall}%`, sub: 'Seluruh Bunda', color: 'bg-sky-600', val: 'text-white', icon: Zap },
        ].map(s => {
           const Icon = s.icon;
           return (
            <div key={s.label} className={`${s.color} rounded-3xl p-5 text-center border ${s.val === 'text-white' ? 'border-sky-600 shadow-nutrisea' : 'border-sky-50 shadow-nutrisea-sm'}`}>
              <div className="flex justify-center mb-1"><Icon size={20} className={s.val === 'text-white' ? 'text-white/60' : 'text-slate-300'} /></div>
              <p className={`text-3xl font-black ${s.val}`}>{s.value}</p>
              <p className={`font-black text-[10px] uppercase tracking-wider mt-1 ${s.val === 'text-white' ? 'text-white/80' : 'text-slate-500'}`}>{s.label}</p>
              <p className={`text-[10px] font-bold ${s.val === 'text-white' ? 'text-white/40' : 'text-slate-300'}`}>{s.sub}</p>
            </div>
           )
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-sky-300" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari bunda atau si kecil..."
            className="w-full bg-white border-2 border-sky-100 rounded-2xl pl-12 pr-6 py-3.5 text-slate-900 font-semibold text-sm focus:outline-none focus:border-sky-600 shadow-nutrisea-sm" />
        </div>
        <button onClick={() => { if (sortBy === 'compliance') setSortAsc(!sortAsc); else { setSortBy('compliance'); setSortAsc(false); } }}
          className={`px-6 py-3.5 rounded-2xl font-black text-sm border-2 transition-all flex items-center justify-center gap-2 ${sortBy === 'compliance' ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-sky-600 border-sky-50 shadow-nutrisea-sm'}`}>
          <BarChart2 size={16} /> Filter Kepatuhan
        </button>
      </div>

      {stats.low > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-3xl p-5 mb-6 flex items-start gap-4 shadow-nutrisea-sm shadow-red-100">
          <div className="w-12 h-12 rounded-2xl bg-red-500 flex items-center justify-center text-white shrink-0 shadow-lg">
             <AlertTriangle size={24} />
          </div>
          <div>
            <p className="font-black text-red-700">Terdapat {stats.low} Bunda dengan Kepatuhan Rendah</p>
            <p className="text-red-500 text-sm font-semibold">Segera tindaklanjuti untuk memastikan intervensi gizi si kecil tetap berjalan optimal.</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-sky-100 overflow-hidden shadow-nutrisea">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-sky-50">
              <tr>
                {['Profil Anak', 'Gummy Aktif', 'Diminum', 'Kepatuhan %', 'Status'].map(h => (
                  <th key={h} className="text-left px-6 py-4 text-[10px] font-black text-sky-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-50">
              {filteredPatients.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-sky-300 font-black">Data tidak ditemukan.</td></tr>
              ) : filteredPatients.map(p => {
                const cat = compCategory(p.compliance);
                const TrendIcon = cat.trend;
                return (
                  <tr key={p.id} className="hover:bg-sky-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600 font-black text-xs group-hover:bg-sky-600 group-hover:text-white transition-all">
                          {p.child_name?.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-sm">{p.child_name || p.full_name}</p>
                          <p className="text-[10px] text-sky-400 font-bold uppercase">Bunda: {p.full_name || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-black text-slate-900 text-sm bg-sky-50 px-3 py-1 rounded-lg border border-sky-100">{p.activeMeds} Gummy</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-1">
                        <span className="font-black text-slate-900 text-sm">{p.taken}</span>
                        <span className="text-[10px] text-slate-400 font-bold">/ {p.expected}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2.5 bg-sky-100 rounded-full overflow-hidden shadow-inner">
                          <div className="h-full rounded-full transition-all duration-1000 shadow-nutrisea-sm" style={{ width: `${p.compliance}%`, background: p.compliance >= 80 ? '#0284c7' : p.compliance >= 50 ? '#d97706' : '#dc2626' }} />
                        </div>
                        <span className={`font-black text-sm ${cat.tc}`}>{p.compliance}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <TrendIcon size={16} className={cat.tc} />
                        <Badge color={cat.color}>{cat.label}</Badge>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminKepatuhan;
