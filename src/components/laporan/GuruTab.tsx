import React, { useState } from 'react';
import { useAppContext, API_URL } from '../../context/AppContext';

export default function GuruTab({ rawData, setRawData }: { rawData: any, setRawData: any }) {
  const { tenant } = useAppContext();
  const [startDate, setStartDate] = useState(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }));
  const [endDate, setEndDate] = useState(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }));
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ aktif: 0, total: 0, kosong: 0 });
  const [result, setResult] = useState<any[]>([]);
  const [periodLabel, setPeriodLabel] = useState('');

  const filterGuru = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);

    try {
      let absensi = rawData.absensi;
      if (absensi.length === 0) {
        const res = await fetch(`${API_URL}/api`, {
          method: "POST",
          body: JSON.stringify({ action: "admin_load_table", table: "absensi", tenant_id: tenant?.id }),
        });
        absensi = await res.json();
        setRawData((prev: any) => ({ ...prev, absensi }));
      }

      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      setPeriodLabel(`${startDate} s.d ${endDate}`);

      const statsMap: any = {};
      absensi.filter((r: any) => {
        const d = new Date(r.tanggal);
        return d >= start && d <= end;
      }).forEach((r: any) => {
        const key = `${r.tanggal}_${r.kelas}`;
        if (!statsMap[r.mapel]) statsMap[r.mapel] = new Set();
        statsMap[r.mapel].add(key);
      });

      const resList = rawData.mapel.map((m: any) => {
        const sessions = statsMap[m.nama_mapel] ? statsMap[m.nama_mapel].size : 0;
        const diffWeeks = (Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 1) / 7;
        return {
          mapel: m.nama_mapel,
          total: sessions,
          avg: diffWeeks >= 1 ? (sessions / diffWeeks).toFixed(2) : sessions.toFixed(2),
        };
      }).sort((a: any, b: any) => b.total - a.total);

      setResult(resList);
      let sA = 0, sT = 0, sK = 0;
      resList.forEach((r: any) => {
        if (r.total > 0) sA++; else sK++;
        sT += r.total;
      });
      setStats({ aktif: sA, total: sT, kosong: sK });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const exportMapelPDF = () => {
    const { jsPDF } = (window as any).jspdf;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Laporan Kehadiran Mapel", 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Periode: ${startDate} s.d ${endDate}`, 14, 28);
    
    const rows = result.map((r, i) => [
      (i + 1).toString(),
      r.mapel,
      r.total.toString(),
      r.avg.toString(),
      r.total > 0 ? "Aktif" : "Kosong"
    ]);

    doc.autoTable({
      head: [["No", "Mata Pelajaran", "Total Sesi", "Rata-rata/Mg", "Status"]],
      body: rows,
      startY: 35,
    });
    doc.save(`Laporan_Mapel_${startDate}_${endDate}.pdf`);
  };

  return (
    <div className="fade-in print:hidden">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Dari Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="block w-full px-3 py-2 text-sm border-slate-300 rounded-lg border bg-slate-50 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="block w-full px-3 py-2 text-sm border-slate-300 rounded-lg border bg-slate-50 focus:ring-indigo-500"
            />
          </div>
          <div>
            <button
              onClick={filterGuru}
              className="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-sm flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-filter"></i> Tampilkan
            </button>
          </div>
          <div className="flex justify-end">
            <button
              onClick={exportMapelPDF}
              className="w-full sm:w-auto px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 shadow-sm flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-file-pdf"></i> Export PDF
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="py-10 flex justify-center">
          <div className="loader"></div>
        </div>
      )}

      {!loading && result.length > 0 && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Mapel Aktif</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.aktif}</h3>
              </div>
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-book-open"></i>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Pertemuan</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</h3>
              </div>
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-handshake"></i>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Mapel Belum Isi</p>
                <h3 className="text-2xl font-bold text-rose-600 mt-1">{stats.kosong}</h3>
              </div>
              <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-circle-exclamation"></i>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-semibold text-slate-800">Rekapitulasi Kehadiran Mapel</h3>
              <span className="text-xs font-medium px-2 py-1 bg-indigo-50 text-indigo-700 rounded border border-indigo-100">
                Periode: {periodLabel}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 w-10">No</th>
                    <th className="px-6 py-4">Mata Pelajaran</th>
                    <th className="px-6 py-4 text-center">Total Pertemuan</th>
                    <th className="px-6 py-4 text-center">Rata-rata / Minggu</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.map((r, i) => (
                    <tr key={i} className={r.total === 0 ? "bg-rose-50/50" : "hover:bg-slate-50"}>
                      <td className="px-6 py-4 text-slate-500 font-medium">{i + 1}</td>
                      <td className="px-6 py-4 font-semibold text-slate-700">{r.mapel}</td>
                      <td className="px-6 py-4 text-center">
                        <b>{r.total}</b> <span className="text-xs text-slate-400">Sesi</span>
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600">{r.avg}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.total > 0 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                          {r.total > 0 ? "Aktif" : "Kosong"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
