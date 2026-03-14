import React, { useState, useMemo } from 'react';
import { ClipboardList, Save } from 'lucide-react';
import { useAppContext, API_URL } from '../context/AppContext';

export default function AbsensiTab() {
  const { students, options, sortMode, tenant, user, showNotify, setIsLoading } = useAppContext();
  const [kelas, setKelas] = useState('');
  const [mapel, setMapel] = useState('');
  const [materi, setMateri] = useState('');
  const [selectedJams, setSelectedJams] = useState<string[]>([]);
  const [absensiData, setAbsensiData] = useState<Record<string, { kehadiran: string, nilaiHarian: string }>>({});

  const filteredStudents = useMemo(() => {
    if (!kelas) return [];
    let filtered = students.filter(s => s.kelas === kelas);
    filtered.sort((a, b) => {
      if (sortMode === "gender" && a.gender !== b.gender) {
        return (a.gender || "").localeCompare(b.gender || "");
      }
      return a.nama.localeCompare(b.nama);
    });
    return filtered;
  }, [students, kelas, sortMode]);

  const handleJamToggle = (jam: string) => {
    setSelectedJams(prev => prev.includes(jam) ? prev.filter(j => j !== jam) : [...prev, jam]);
  };

  const handleAbsensiChange = (nisn: string, field: 'kehadiran' | 'nilaiHarian', value: string) => {
    setAbsensiData(prev => ({
      ...prev,
      [nisn]: {
        ...prev[nisn],
        [field]: value
      }
    }));
  };

  const applyDefaultNilai = (val: string) => {
    if (!val) return;
    const newData = { ...absensiData };
    filteredStudents.forEach(s => {
      newData[s.nisn] = {
        kehadiran: newData[s.nisn]?.kehadiran || 'H',
        nilaiHarian: val
      };
    });
    setAbsensiData(newData);
  };

  const saveAbsensi = async () => {
    if (!mapel || !materi || selectedJams.length === 0 || !tenant?.id) {
      return showNotify("error", "Lengkapi data absensi & pilih sekolah!");
    }

    setIsLoading(true);
    const todayWIB = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
    
    const rows = filteredStudents.map(s => ({
      nisn: s.nisn,
      nama: s.nama,
      kehadiran: absensiData[s.nisn]?.kehadiran || 'H',
      nilaiHarian: parseInt(absensiData[s.nisn]?.nilaiHarian || '100'),
      materi,
      jam: selectedJams.join(","),
      email: user.email,
      tanggal: todayWIB,
      kelas,
      mapel,
    }));

    try {
      const response = await fetch(`${API_URL}/api`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_absensi",
          rows,
          tenant_id: tenant.id,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Gagal menyimpan ke server.");

      showNotify("success", "Data absensi tersimpan!");
      setKelas('');
      setMapel('');
      setMateri('');
      setSelectedJams([]);
      setAbsensiData({});
    } catch (e: any) {
      showNotify("error", e.message || "Gagal menyimpan.");
    } finally {
      setIsLoading(false);
    }
  };

  const kelasOptions = options.kelas.length > 0 ? options.kelas.map(k => k.nama_kelas) : [...new Set(students.map(s => s.kelas))].filter(Boolean).sort();

  return (
    <div className="p-6 md:p-8 overflow-y-auto w-full">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <ClipboardList className="mr-2 text-blue-600" /> Absensi Harian
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Kelas</label>
            <select
              value={kelas}
              onChange={(e) => setKelas(e.target.value)}
              className="mt-1 p-3 rounded-lg border border-gray-200 w-full bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="">-- Pilih Kelas --</option>
              {kelasOptions.map((c: any) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Mata Pelajaran</label>
            <select
              value={mapel}
              onChange={(e) => setMapel(e.target.value)}
              className="mt-1 p-3 rounded-lg border border-gray-200 w-full bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="">-- Pilih Mapel --</option>
              {options.mapel.map((m: any) => <option key={m.nama_mapel} value={m.nama_mapel}>{m.nama_mapel}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Jam Pelajaran</label>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(jam => (
              <label key={jam} className="cursor-pointer">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={selectedJams.includes(jam.toString())}
                  onChange={() => handleJamToggle(jam.toString())}
                />
                <span className="w-10 h-10 flex items-center justify-center border rounded-lg peer-checked:bg-blue-600 peer-checked:text-white transition-all text-sm font-bold hover:bg-gray-50">
                  {jam}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <label className="text-xs font-bold text-gray-500 uppercase">Materi Pembelajaran</label>
          <input
            type="text"
            value={materi}
            onChange={(e) => setMateri(e.target.value)}
            placeholder="Contoh: Bab 1 Pendahuluan..."
            className="mt-1 w-full p-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm font-bold text-gray-600">Set Nilai Harian Otomatis:</span>
          <select
            onChange={(e) => { applyDefaultNilai(e.target.value); e.target.value = ''; }}
            className="text-sm border-blue-300 border bg-blue-50 text-blue-700 font-bold rounded-lg p-2 cursor-pointer hover:bg-blue-100"
          >
            <option value="">-- Pilih Nilai --</option>
            <option value="100">100 (Sempurna)</option>
            <option value="90">90 (Sangat Baik)</option>
            <option value="80">80 (Baik)</option>
            <option value="70">70 (Cukup)</option>
            <option value="50">50 (Kurang)</option>
            <option value="0">0 (Nol)</option>
          </select>
        </div>
      </div>

      <div className="space-y-3 pb-24">
        {kelas && filteredStudents.length === 0 && (
          <div className="text-center p-4 text-gray-500 italic bg-gray-50 rounded-lg">Tidak ada siswa di kelas ini.</div>
        )}
        {filteredStudents.map((s, idx) => (
          <div key={s.nisn} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 transition-all hover:border-blue-400">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-100">{idx + 1}</div>
              <div>
                <div className="font-bold text-gray-800">{s.nama}</div>
                <div className="text-xs text-gray-400 font-mono">{s.nisn}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <select
                value={absensiData[s.nisn]?.kehadiran || 'H'}
                onChange={(e) => handleAbsensiChange(s.nisn, 'kehadiran', e.target.value)}
                className="p-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none w-24"
              >
                <option value="H">Hadir</option>
                <option value="S">Sakit</option>
                <option value="I">Izin</option>
                <option value="A">Alpha</option>
              </select>
              <select
                value={absensiData[s.nisn]?.nilaiHarian || '100'}
                onChange={(e) => handleAbsensiChange(s.nisn, 'nilaiHarian', e.target.value)}
                className="w-20 p-2 border border-gray-300 rounded-lg text-center font-bold text-gray-700 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="100">100</option>
                <option value="90">90</option>
                <option value="80">80</option>
                <option value="70">70</option>
                <option value="50">50</option>
                <option value="0">0</option>
              </select>
            </div>
          </div>
        ))}
        {filteredStudents.length > 0 && (
          <button
            onClick={saveAbsensi}
            className="fixed bottom-6 right-6 bg-blue-600 text-white px-8 py-3 rounded-full shadow-xl font-bold hover:bg-blue-700 z-20 transition-transform active:scale-95 flex items-center gap-2"
          >
            <Save /> Simpan Absensi
          </button>
        )}
      </div>
    </div>
  );
}
