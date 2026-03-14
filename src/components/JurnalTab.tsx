import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, RefreshCw } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function JurnalTab() {
  const { jurnal, fetchJurnal, options, students } = useAppContext();
  const [fKelas, setFKelas] = useState('');
  const [fMapel, setFMapel] = useState('');

  useEffect(() => {
    fetchJurnal();
  }, [fetchJurnal]);

  const filteredJurnal = useMemo(() => {
    return jurnal.filter((item: any) => 
      (fKelas === "" || item.kelas === fKelas) &&
      (fMapel === "" || item.mapel === fMapel)
    );
  }, [jurnal, fKelas, fMapel]);

  const formatTanggalIndo = (dateString: string) => {
    const opsi: any = { weekday: "long", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" };
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("id-ID", opsi);
  };

  const kelasOptions = options.kelas.length > 0 ? options.kelas.map(k => k.nama_kelas) : [...new Set(students.map(s => s.kelas))].filter(Boolean).sort();

  return (
    <div className="p-6 md:p-8 overflow-y-auto w-full">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <BookOpen className="mr-2 text-amber-600" /> Riwayat Jurnal
          </h2>
          <button
            onClick={() => { setFKelas(''); setFMapel(''); fetchJurnal(); }}
            className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-4 py-2 rounded-lg text-sm flex items-center transition-colors font-medium"
          >
            <RefreshCw className="mr-2 w-4 h-4" /> Refresh Data
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-amber-50/50 p-4 rounded-xl border border-amber-100">
          <div>
            <label className="block text-xs font-bold text-amber-800 uppercase mb-1">Filter Kelas</label>
            <select
              value={fKelas}
              onChange={(e) => setFKelas(e.target.value)}
              className="p-2.5 rounded-lg border border-amber-200 w-full bg-white outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Semua Kelas</option>
              {kelasOptions.map((c: any) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-amber-800 uppercase mb-1">Filter Mapel</label>
            <select
              value={fMapel}
              onChange={(e) => setFMapel(e.target.value)}
              className="p-2.5 rounded-lg border border-amber-200 w-full bg-white outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Semua Mapel</option>
              {options.mapel.map((m: any) => <option key={m.nama_mapel} value={m.nama_mapel}>{m.nama_mapel}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-amber-50">
              <tr>
                <th className="p-4 text-left text-xs font-bold text-amber-800 uppercase">Tanggal</th>
                <th className="p-4 text-left text-xs font-bold text-amber-800 uppercase">Kelas</th>
                <th className="p-4 text-left text-xs font-bold text-amber-800 uppercase">Mapel</th>
                <th className="p-4 text-left text-xs font-bold text-amber-800 uppercase">Materi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredJurnal.length === 0 ? (
                <tr><td colSpan={4} className="p-10 text-center text-gray-400">Data tidak ditemukan.</td></tr>
              ) : (
                filteredJurnal.map((j: any, i) => (
                  <tr key={i} className="text-sm hover:bg-amber-50/50 transition-colors border-b border-gray-50 last:border-0">
                    <td className="p-4 text-gray-500 font-mono">{formatTanggalIndo(j.tanggal)}</td>
                    <td className="p-4 font-bold text-gray-800">{j.kelas}</td>
                    <td className="p-4 text-blue-600 font-medium">{j.mapel}</td>
                    <td className="p-4 text-gray-600 italic">{j.materi || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
