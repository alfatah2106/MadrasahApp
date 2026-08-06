import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext, API_URL } from '../../context/AppContext';

export default function GuruTab({ rawData }: { rawData: any }) {
  const { tenant } = useAppContext();
  
  // State untuk kontrol input
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }));
  const [pesan, setPesan] = useState('');
  const [pengirim, setPengirim] = useState('');
  
  // State untuk data API
  const [catatanList, setCatatanList] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingCatatan, setIsLoadingCatatan] = useState(false);

  // 1. Ekstrak daftar kelas yang unik dari data absensi untuk Header Tabel
  const classes = useMemo(() => {
    const clsSet = new Set<string>();
    if (rawData && rawData.absensi) {
      rawData.absensi.forEach((r: any) => {
        if (r.kelas) clsSet.add(r.kelas);
      });
    }
    return Array.from(clsSet).sort();
  }, [rawData]);

  // 2. Olah Matriks berdasarkan tanggal yang dipilih
  const matrixData = useMemo(() => {
    const targetDate = new Date(selectedDate);
    targetDate.setHours(0, 0, 0, 0);
    
    // Filter absensi khusus di tanggal yang dipilih
    const filtered = (rawData?.absensi || []).filter((r: any) => {
      const d = new Date(r.tanggal);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === targetDate.getTime();
    });

    const matrix: Record<number, Record<string, string>> = {};
    let max = 8; // Minimal render 8 jam

    filtered.forEach((r: any) => {
      if (r.jam && r.kelas) {
         // Pecah jam ("1,2" jadi [1, 2])
         const jamArray = r.jam.toString().split(',')
            .map((j: string) => parseInt(j.trim(), 10))
            .filter((j: number) => !isNaN(j));
            
         jamArray.forEach((jam: number) => {
            if (jam > max) max = jam;
            if (!matrix[jam]) matrix[jam] = {};
            // Jika ada beberapa mapel di jam & kelas yg sama, gabungkan dengan koma
            if (matrix[jam][r.kelas]) {
                if (!matrix[jam][r.kelas].includes(r.mapel)) {
                    matrix[jam][r.kelas] += `, ${r.mapel}`;
                }
            } else {
                matrix[jam][r.kelas] = r.mapel;
            }
         });
      }
    });

    return { matrix, maxJam: max };
  }, [rawData, selectedDate]);

  // 3. Fungsi Ambil Data Catatan
  const fetchCatatan = async () => {
    if (!tenant?.id) return;
    setIsLoadingCatatan(true);
    try {
      // Sesuai update index.ts, kita taruh di method GET
      const res = await fetch(`${API_URL}/api?action=get_catatan&tenant_id=${tenant.id}`);
      const data = await res.json();
      if (Array.isArray(data)) {
         setCatatanList(data);
      }
    } catch (e) {
      console.error("Gagal mengambil catatan harian", e);
    } finally {
      setIsLoadingCatatan(false);
    }
  };

  // Ambil data catatan saat komponen dimuat atau tenant berubah
  useEffect(() => {
    fetchCatatan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant]);

  // 4. Fungsi Simpan Catatan
  const handleSimpanCatatan = async () => {
    if (!pesan.trim() || !pengirim.trim()) {
       return alert("Pesan dan Pengirim harus diisi!");
    }
    setIsSaving(true);
    try {
       const res = await fetch(`${API_URL}/api`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
             action: "save_catatan",
             tenant_id: tenant?.id,
             tgl: selectedDate,
             pesan: pesan,
             pengirim: pengirim
          })
       });
       const data = await res.json();
       if (data.status === 'success') {
          setPesan('');
          setPengirim('');
          fetchCatatan(); // Refresh tabel catatan di bawah
       } else {
          alert("Gagal menyimpan catatan: " + (data.message || data.error));
       }
    } catch (e) {
       console.error(e);
       alert("Terjadi kesalahan koneksi saat menyimpan catatan.");
    } finally {
       setIsSaving(false);
    }
  };

  const formatTglIndo = (tglStr: string) => {
    const d = new Date(tglStr);
    if (isNaN(d.getTime())) return tglStr;
    return d.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  };

  const rowHours = Array.from({ length: matrixData.maxJam }, (_, i) => i + 1);

  return (
    <div className="fade-in print:bg-white print:text-black">
      
      {/* ---------------- BAGIAN ATAS: TABEL MATRIKS HARI INI ---------------- */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
            <div>
               <h2 className="text-xl font-bold text-slate-800 flex items-center">
                  <i className="fa-solid fa-table-cells mr-2 text-indigo-600"></i> Matriks Kelas Harian
               </h2>
               <p className="text-sm text-slate-500 mt-1">Pantau kekosongan dan aktivitas kelas per jam pelajaran.</p>
            </div>
            
            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-200">
               <label className="text-sm font-bold text-slate-600 uppercase tracking-wide px-2">Tanggal:</label>
               <input
                 type="date"
                 value={selectedDate}
                 onChange={(e) => setSelectedDate(e.target.value)}
                 className="px-3 py-2 text-sm border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-800"
               />
            </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-300 shadow-sm">
          <table className="min-w-full text-sm border-collapse bg-white font-sans">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="border border-slate-600 px-4 py-3 text-center w-16 uppercase text-xs font-black tracking-wider">Jam</th>
                {classes.length === 0 ? (
                   <th className="border border-slate-600 px-4 py-3 text-center uppercase text-xs">Kelas Belum Tersedia</th>
                ) : (
                   classes.map(cls => (
                     <th key={cls} className="border border-slate-600 px-4 py-3 text-center uppercase text-xs font-black tracking-wider min-w-[120px]">
                        {cls}
                     </th>
                   ))
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {classes.length === 0 ? (
                 <tr>
                    <td colSpan={2} className="p-8 text-center text-slate-400 italic">Pastikan terdapat data siswa/kelas yang aktif.</td>
                 </tr>
              ) : (
                 rowHours.map(jam => (
                   <tr key={jam} className="hover:bg-slate-50 transition-colors">
                     <td className="border border-slate-300 px-2 py-3 text-center font-bold bg-slate-100 text-slate-800">
                       {jam}
                     </td>
                     {classes.map(cls => {
                       const mapel = matrixData.matrix[jam]?.[cls];
                       return (
                         <td key={cls} className="border border-slate-300 px-2 py-3 text-center">
                            {mapel ? (
                               <span className="font-semibold text-indigo-700 text-xs leading-tight block">{mapel}</span>
                            ) : (
                               <span className="text-slate-300">-</span>
                            )}
                         </td>
                       );
                     })}
                   </tr>
                 ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------------- BAGIAN TENGAH: FORM INPUT PESAN/CATATAN ---------------- */}
      <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-xl border border-indigo-100 shadow-sm mb-6 print:hidden">
         <h3 className="font-bold text-lg text-indigo-900 mb-4 flex items-center">
             <i className="fa-solid fa-pen-to-square mr-2"></i> Tambah Catatan Piket / Harian
         </h3>
         
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
            <div className="md:col-span-1">
               <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Pengirim / Oleh</label>
               <input
                 type="text"
                 value={pengirim}
                 onChange={(e) => setPengirim(e.target.value)}
                 placeholder="Cth: Bpk. Budi / Piket"
                 className="block w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
               />
            </div>
            
            <div className="md:col-span-2">
               <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Isi Pesan / Catatan</label>
               <textarea
                 value={pesan}
                 onChange={(e) => setPesan(e.target.value)}
                 placeholder="Tuliskan catatan kejadian, tugas, sakit, atau izin hari ini..."
                 rows={2}
                 className="block w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-shadow"
               />
            </div>

            <div className="md:col-span-1 pt-6">
               <button
                 onClick={handleSimpanCatatan}
                 disabled={isSaving}
                 className="w-full px-4 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
               >
                 {isSaving ? (
                    <i className="fa-solid fa-spinner fa-spin"></i>
                 ) : (
                    <i className="fa-solid fa-paper-plane"></i>
                 )}
                 {isSaving ? "Menyimpan..." : "Simpan Pesan"}
               </button>
            </div>
         </div>
      </div>

      {/* ---------------- BAGIAN BAWAH: TABEL RIWAYAT CATATAN ---------------- */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
           <h3 className="font-bold text-slate-800">
              <i className="fa-solid fa-clock-rotate-left mr-2 text-slate-500"></i> Riwayat Catatan
           </h3>
           <button onClick={fetchCatatan} className="text-sm text-indigo-600 font-semibold hover:text-indigo-800 print:hidden">
              <i className="fa-solid fa-rotate-right"></i> Refresh
           </button>
        </div>
        
        <div className="overflow-x-auto">
           <table className="min-w-full text-left text-sm font-sans">
              <thead className="bg-slate-100 text-slate-600 uppercase text-xs tracking-wider border-b border-slate-200">
                 <tr>
                    <th className="px-6 py-3 w-48 font-black">Tanggal</th>
                    <th className="px-6 py-3 font-black">Isi Pesan</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                 {isLoadingCatatan ? (
                    <tr>
                       <td colSpan={2} className="px-6 py-8 text-center text-slate-500">
                          <i className="fa-solid fa-spinner fa-spin mr-2"></i> Memuat riwayat...
                       </td>
                    </tr>
                 ) : catatanList.length === 0 ? (
                    <tr>
                       <td colSpan={2} className="px-6 py-8 text-center text-slate-400 italic">
                          Belum ada riwayat catatan harian.
                       </td>
                    </tr>
                 ) : (
                    catatanList.map((cat, idx) => (
                       <tr key={cat.id || idx} className="hover:bg-amber-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                             <div className="font-bold text-slate-700">{formatTglIndo(cat.tgl)}</div>
                          </td>
                          <td className="px-6 py-4">
                             <span className="text-slate-800 leading-relaxed text-sm">{cat.pesan}</span>
                             <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-200 text-slate-700">
                                - {cat.pengirim}
                             </span>
                          </td>
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
