import React, { useState } from 'react';

export default function SiswaTab({ rawData, loadSiswaData }: { rawData: any, loadSiswaData: (u: string) => Promise<void> }) {
  const [startDate, setStartDate] = useState(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }));
  const [endDate, setEndDate] = useState(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }));
  const [fKelas, setFKelas] = useState('');
  const [fUjian, setFUjian] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleLoad = async () => {
    if (!fUjian) return alert("Pilih Jenis Nilai!");
    setLoading(true);
    setHasSearched(true);
    await loadSiswaData(fUjian);
    processSiswaPivot();
    setLoading(false);
  };

  const processSiswaPivot = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59);

    let students = rawData.students
      .filter((s: any) => !fKelas || s.kelas === fKelas)
      .sort((a: any, b: any) => (b.kelas || "").localeCompare(a.kelas || "") || (a.nama || "").localeCompare(b.nama || ""));
    
    const pivot: any = {};
    const lookup = new Map();
    students.forEach((s: any) => {
      const key = s.nisn || s.nama;
      pivot[key] = { nama: s.nama, kelas: s.kelas, s: 0, i: 0, a: 0, nilai: {}, temp: {} };
      lookup.set(s.nama.toLowerCase().trim(), key);
    });

    rawData.absensi.forEach((abs: any) => {
      const d = new Date(abs.tanggal);
      if (d < start || d > end) return;
      const k = lookup.get((abs.nama || "").toLowerCase().trim());
      if (k && pivot[k]) {
        const st = (abs.kehadiran || "").toUpperCase();
        if (st.startsWith("S")) pivot[k].s++;
        else if (st.startsWith("I")) pivot[k].i++;
        else if (st.startsWith("A")) pivot[k].a++;
        if (fUjian === "Nilai Harian" && abs.nilai_harian) {
          const m = (abs.mapel || "").trim();
          if (!pivot[k].temp[m]) pivot[k].temp[m] = { s: 0, c: 0 };
          pivot[k].temp[m].s += parseFloat(abs.nilai_harian);
          pivot[k].temp[m].c++;
        }
      }
    });

    if (fUjian === "Nilai Harian") {
      Object.values(pivot).forEach((p: any) =>
        Object.keys(p.temp).forEach(m => p.nilai[m] = (p.temp[m].s / p.temp[m].c).toFixed(2))
      );
    } else {
      rawData.nilai.filter((n: any) => n.jenis_ujian === fUjian).forEach((n: any) => {
        const k = lookup.get((n.nama || "").toLowerCase().trim());
        if (k && pivot[k]) pivot[k].nilai[n.mapel] = n.nilai;
      });
    }

    const resList = students.map((s: any) => pivot[s.nisn || s.nama]).filter(Boolean);
    setResult(resList);
  };

  const exportSiswaCSV = () => {
    const headers = ["No", "Nama Siswa", "Kls", "S", "I", "A", ...rawData.mapel.map((m: any) => m.nama_mapel)];
    const rows = result.map((d, i) => [
      i + 1,
      `"${d.nama.replace(/"/g, '""')}"`,
      `"${d.kelas}"`,
      d.s || "-",
      d.i || "-",
      d.a || "-",
      ...rawData.mapel.map((m: any) => d.nilai[m.nama_mapel] || "")
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Laporan_Siswa.csv";
    link.click();
  };

  return (
    <div className="fade-in print:hidden">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
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
            <label className="block text-xs font-medium text-slate-500 mb-1">Pilih Kelas</label>
            <select
              value={fKelas}
              onChange={(e) => setFKelas(e.target.value)}
              className="block w-full px-3 py-2 text-sm border-slate-300 rounded-lg border bg-slate-50 focus:ring-indigo-500"
            >
              <option value="">-- Semua Kelas --</option>
              {rawData.ref_kelas.map((k: any) => <option key={k.nama_kelas} value={k.nama_kelas}>{k.nama_kelas}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Jenis Nilai</label>
            <select
              value={fUjian}
              onChange={(e) => setFUjian(e.target.value)}
              className="block w-full px-3 py-2 text-sm border-slate-300 rounded-lg border bg-slate-50 focus:ring-indigo-500"
            >
              <option value="">-- Pilih Nilai --</option>
              <option value="Nilai Harian">★ Rata-rata Nilai Harian</option>
              {rawData.ref_ujian.map((u: any) => <option key={u.jenis_ujian} value={u.jenis_ujian}>{u.jenis_ujian}</option>)}
            </select>
          </div>
          <div>
            <button
              onClick={handleLoad}
              className="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-sm flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-filter"></i> Tampilkan
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="py-10 flex justify-center">
          <div className="loader"></div>
        </div>
      )}

      {!loading && !hasSearched && (
        <div className="py-20 text-center">
          <p className="text-slate-500">Silakan pilih filter data lalu klik Tampilkan.</p>
        </div>
      )}

      {!loading && hasSearched && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50">
            <div>
              <h3 className="font-semibold text-slate-800">Rekapitulasi Nilai & Absensi Siswa</h3>
            </div>
            <button
              onClick={exportSiswaCSV}
              className="w-full sm:w-auto px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 shadow-sm flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-file-excel"></i> Export Excel
            </button>
          </div>
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <tr>
                  <th className="px-4 py-3 bg-slate-50 w-10">No</th>
                  <th className="px-4 py-3 bg-slate-50 min-w-[200px]">Nama Siswa</th>
                  <th className="px-4 py-3 bg-slate-50 text-center w-20 border-l border-slate-200">Kls</th>
                  <th className="px-2 py-3 bg-emerald-50 text-center w-12 text-emerald-700 border-l border-emerald-100 font-bold">S</th>
                  <th className="px-2 py-3 bg-amber-50 text-center w-12 text-amber-700 border-l border-amber-100 font-bold">I</th>
                  <th className="px-2 py-3 bg-rose-50 text-center w-12 text-rose-700 border-l border-rose-100 border-r border-slate-300 font-bold">A</th>
                  {rawData.mapel.map((m: any) => (
                    <th key={m.nama_mapel} className="px-4 py-3 bg-slate-50 text-center border-l border-slate-200 min-w-[100px]">
                      {m.nama_mapel}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.map((d, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 border-b border-slate-100">
                    <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{d.nama}</td>
                    <td className="px-4 py-3 text-center border-l">{d.kelas}</td>
                    <td className={`px-2 py-3 text-center font-bold ${d.s > 0 ? "text-emerald-700 bg-emerald-50" : "text-slate-300"} border-l`}>{d.s || "-"}</td>
                    <td className={`px-2 py-3 text-center font-bold ${d.i > 0 ? "text-amber-700 bg-amber-50" : "text-slate-300"} border-l`}>{d.i || "-"}</td>
                    <td className={`px-2 py-3 text-center font-bold ${d.a > 0 ? "text-rose-700 bg-rose-50" : "text-slate-300"} border-l border-r`}>{d.a || "-"}</td>
                    {rawData.mapel.map((m: any) => (
                      <td key={m.nama_mapel} className="px-4 py-3 text-center border-l">{d.nilai[m.nama_mapel] || ""}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
