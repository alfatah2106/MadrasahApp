import React, { useState, useMemo } from 'react';
import { Save } from 'lucide-react';
import { useAppContext, API_URL } from '../context/AppContext';

export default function NilaiTab() {
  const { students, options, sortMode, tenant, user, showNotify, setIsLoading } = useAppContext();
  const [kelas, setKelas] = useState('');
  const [mapel, setMapel] = useState('');
  const [ujian, setUjian] = useState('');
  const [nilaiData, setNilaiData] = useState<Record<string, string>>({});

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

  const handleNilaiChange = (nisn: string, val: string) => {
    setNilaiData(prev => ({ ...prev, [nisn]: val }));
  };

  const saveNilai = async () => {
    if (!mapel || !ujian || !kelas) return showNotify("error", "Lengkapi filter!");
    
    const rows = filteredStudents.map(s => {
      const val = nilaiData[s.nisn];
      if (!val) return null;
      return {
        nisn: s.nisn,
        nama: s.nama,
        nilai: parseInt(val),
        jenis_ujian: ujian,
        email: user.email,
        tanggal: new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }),
        kelas,
        mapel,
      };
    }).filter(r => r !== null);

    if (rows.length === 0) return showNotify("info", "Isi nilai.");

    setIsLoading(true);
    try {
      await fetch(`${API_URL}/api`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_nilai",
          rows,
          tenant_id: tenant?.id,
        }),
      });
      showNotify("success", "Berhasil menyimpan!");
      setKelas('');
      setMapel('');
      setUjian('');
      setNilaiData({});
    } catch (e) {
      showNotify("error", "Gagal.");
    } finally {
      setIsLoading(false);
    }
  };

  const kelasOptions = options.kelas.length > 0 ? options.kelas.map(k => k.nama_kelas) : [...new Set(students.map(s => s.kelas))].filter(Boolean).sort();

  return (
    <div className="p-6 md:p-8 overflow-y-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Input Nilai Siswa</h2>
          <p className="text-gray-500 text-sm">Masukkan nilai ujian secara manual</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Kelas</label>
            <select
              value={kelas}
              onChange={(e) => setKelas(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            >
              <option value="">-- Pilih Kelas --</option>
              {kelasOptions.map((c: any) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Mata Pelajaran</label>
            <select
              value={mapel}
              onChange={(e) => setMapel(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            >
              <option value="">-- Pilih Mapel --</option>
              {options.mapel.map((m: any) => <option key={m.nama_mapel} value={m.nama_mapel}>{m.nama_mapel}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Jenis Ujian</label>
            <select
              value={ujian}
              onChange={(e) => setUjian(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            >
              <option value="">-- Pilih Jenis --</option>
              {options.ujian.map((u: any) => <option key={u.jenis_ujian} value={u.jenis_ujian}>{u.jenis_ujian}</option>)}
            </select>
          </div>
        </div>
      </div>

      {kelas && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-emerald-50 border-b border-emerald-100">
                <tr>
                  <th className="p-4 text-xs font-bold text-emerald-800 uppercase w-16 text-center">No</th>
                  <th className="p-4 text-xs font-bold text-emerald-800 uppercase">Nama Siswa</th>
                  <th className="p-4 text-xs font-bold text-emerald-800 uppercase text-center w-40">NILAI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredStudents.length === 0 ? (
                  <tr><td colSpan={3} className="p-10 text-center text-gray-400 italic">Tidak ada siswa.</td></tr>
                ) : (
                  filteredStudents.map((s, index) => (
                    <tr key={s.nisn} className="hover:bg-emerald-50/30 transition-colors border-b border-gray-50 last:border-0">
                      <td className="p-4 text-center text-gray-500 font-medium">{index + 1}</td>
                      <td className="p-4"><div className="font-bold text-gray-800">{s.nama}</div></td>
                      <td className="p-4 text-center">
                        <input
                          type="number"
                          value={nilaiData[s.nisn] || ''}
                          onChange={(e) => handleNilaiChange(s.nisn, e.target.value)}
                          className="w-24 p-2.5 border border-gray-300 rounded-lg text-center font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                          min="0" max="100"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
            <button
              onClick={saveNilai}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-medium shadow-lg shadow-emerald-200 active:scale-95 transition-all flex items-center gap-2"
            >
              <Save /> Simpan Data Nilai
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
