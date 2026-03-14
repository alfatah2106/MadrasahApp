import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext, API_URL } from '../context/AppContext';
import GuruTab from '../components/laporan/GuruTab';
import SiswaTab from '../components/laporan/SiswaTab';
import SlipTab from '../components/laporan/SlipTab';

export default function Laporan() {
  const { tenant } = useAppContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('guru');
  const [status, setStatus] = useState<'loading' | 'online' | 'error'>('loading');
  const [rawData, setRawData] = useState<any>({
    mapel: [], absensi: [], students: [], nilai: [], ref_kelas: [], ref_ujian: [], emails_only: []
  });

  useEffect(() => {
    if (!tenant?.id) {
      alert("Sesi berakhir atau Tenant ID tidak ditemukan. Silakan login kembali di halaman utama.");
      navigate('/');
      return;
    }
    fetchOptionsOnly();
  }, [tenant]);

  const fetchOptionsOnly = async () => {
    setStatus('loading');
    try {
      const cachedOptions = localStorage.getItem("cache_options_laporan");
      let dataOptions: any = {};
      let absensiData: any[] = [];

      if (cachedOptions) {
        dataOptions = JSON.parse(cachedOptions);
        const cachedEmails = localStorage.getItem("cache_emails_laporan");
        const emails_only = cachedEmails ? JSON.parse(cachedEmails) : [];
        setRawData(prev => ({
          ...prev,
          mapel: dataOptions.mapel || [],
          ref_kelas: dataOptions.kelas || [],
          ref_ujian: dataOptions.ujian || [],
          emails_only
        }));
      }

      const [resOptions, resAbsensi] = await Promise.all([
        fetch(`${API_URL}/api?action=get_options&tenant_id=${tenant?.id}`),
        fetch(`${API_URL}/api`, {
          method: "POST",
          body: JSON.stringify({ action: "admin_load_table", table: "absensi", tenant_id: tenant?.id }),
        }),
      ]);

      dataOptions = await resOptions.json();
      absensiData = await resAbsensi.json();

      const emails = [...new Set(absensiData.map(a => a.email_guru).filter(Boolean))];
      localStorage.setItem("cache_options_laporan", JSON.stringify(dataOptions));
      localStorage.setItem("cache_emails_laporan", JSON.stringify(emails));

      setRawData(prev => ({
        ...prev,
        mapel: dataOptions.mapel || [],
        ref_kelas: dataOptions.kelas || [],
        ref_ujian: dataOptions.ujian || [],
        absensi: absensiData,
        emails_only: emails
      }));
      setStatus('online');
    } catch (e) {
      console.error("Gagal load options/emails", e);
      setStatus('error');
    }
  };

  const fetchAllData = async () => {
    setStatus('loading');
    try {
      const [resOptions, resAbsensi, resStudents] = await Promise.all([
        fetch(`${API_URL}/api?action=get_options&tenant_id=${tenant?.id}`),
        fetch(`${API_URL}/api`, {
          method: "POST",
          body: JSON.stringify({ action: "admin_load_table", table: "absensi", tenant_id: tenant?.id }),
        }),
        fetch(`${API_URL}/api`, {
          method: "POST",
          body: JSON.stringify({ action: "admin_load_table", table: "students", tenant_id: tenant?.id }),
        }),
      ]);

      const dataOptions = await resOptions.json();
      const absensiData = await resAbsensi.json();
      const studentsData = await resStudents.json();

      localStorage.setItem("cache_options_laporan", JSON.stringify(dataOptions));
      
      setRawData(prev => ({
        ...prev,
        mapel: dataOptions.mapel || [],
        ref_kelas: dataOptions.kelas || [],
        ref_ujian: dataOptions.ujian || [],
        absensi: absensiData,
        students: studentsData
      }));
      setStatus('online');
    } catch (error) {
      console.error("Fetch Error:", error);
      setStatus('error');
    }
  };

  const loadSiswaData = async (ujian: string) => {
    if (rawData.students.length === 0 || rawData.absensi.length === 0) {
      const [resAbs, resStud] = await Promise.all([
        fetch(`${API_URL}/api`, {
          method: "POST",
          body: JSON.stringify({ action: "admin_load_table", table: "absensi", tenant_id: tenant?.id }),
        }),
        fetch(`${API_URL}/api`, {
          method: "POST",
          body: JSON.stringify({ action: "admin_load_table", table: "students", tenant_id: tenant?.id }),
        }),
      ]);
      const abs = await resAbs.json();
      const stud = await resStud.json();
      setRawData(prev => ({ ...prev, absensi: abs, students: stud }));
    }

    if (ujian !== "Nilai Harian" && rawData.nilai.length === 0) {
      const res = await fetch(`${API_URL}/api`, {
        method: "POST",
        body: JSON.stringify({ action: "admin_load_table", table: "nilai", tenant_id: tenant?.id }),
      });
      const nil = await res.json();
      setRawData(prev => ({ ...prev, nilai: nil }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-['Plus_Jakarta_Sans',sans-serif]">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50 print:hidden">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
                <i className="fa-solid fa-school"></i>
              </div>
              <div className="flex items-center gap-3 text-left">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  Madrasah App <span className="text-indigo-600 text-sm block md:inline font-medium">[{tenant?.name}]</span>
                </h1>
                <p className="text-xs text-slate-500 font-medium hidden md:block">Laporan & Rekapitulasi</p>
              </div>
            </button>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 hidden md:inline">
              <i className="fa-regular fa-calendar mr-2"></i>
              {new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </span>
            <div className={`px-2 py-1 rounded-md text-xs border flex items-center gap-1 ${
              status === 'loading' ? 'bg-blue-50 text-blue-600 border-blue-200' :
              status === 'online' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
              'bg-rose-50 text-rose-600 border-rose-200'
            }`}>
              {status === 'loading' && <div className="loader" style={{ width: 10, height: 10, borderWidth: 2 }}></div>}
              {status === 'online' && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
              {status === 'error' && <div className="w-2 h-2 rounded-full bg-rose-500"></div>}
              {status === 'loading' ? 'Syncing...' : status === 'online' ? 'Online' : 'Error'}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8 flex flex-col sm:flex-row justify-between sm:items-end gap-4 print:hidden">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Laporan Akademik</h2>
            <p className="text-slate-500 mt-1">Pusat data kehadiran, nilai siswa, dan rekapitulasi guru.</p>
          </div>
          <button
            onClick={fetchAllData}
            className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-300 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 font-medium rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-rotate-right"></i> Refresh Data
          </button>
        </div>

        <div className="flex overflow-x-auto border-b border-slate-200 mb-6 print:hidden">
          <button
            onClick={() => setActiveTab('guru')}
            className={`px-6 py-3 text-sm whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === 'guru' ? 'tab-active-btn' : 'tab-inactive-btn'}`}
          >
            <i className="fa-solid fa-chalkboard-user"></i> Data Mapel
          </button>
          <button
            onClick={() => setActiveTab('siswa')}
            className={`px-6 py-3 text-sm whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === 'siswa' ? 'tab-active-btn' : 'tab-inactive-btn'}`}
          >
            <i className="fa-solid fa-users"></i> Data Siswa & Nilai
          </button>
          <button
            onClick={() => setActiveTab('slip')}
            className={`px-6 py-3 text-sm whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === 'slip' ? 'tab-active-btn' : 'tab-inactive-btn'}`}
          >
            <i className="fa-solid fa-file-invoice-dollar"></i> Slip Guru
          </button>
        </div>

        {activeTab === 'guru' && <GuruTab rawData={rawData} setRawData={setRawData} />}
        {activeTab === 'siswa' && <SiswaTab rawData={rawData} loadSiswaData={loadSiswaData} />}
        {activeTab === 'slip' && <SlipTab rawData={rawData} />}
      </main>
    </div>
  );
}
