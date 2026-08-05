import React, { useState } from 'react';

export default function SlipTab({ rawData }: { rawData: any }) {
  const [email, setEmail] = useState('');
  const [namaGuru, setNamaGuru] = useState(''); // State baru untuk nama guru
  const [startDate, setStartDate] = useState(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }));
  const [endDate, setEndDate] = useState(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }));
  const [result, setResult] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const tenantName = rawData?.tenant_name || rawData?.tenantName || "NAMA SEKOLAH / TENANT";

  const getMonday = (d: Date) => {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Format tanggal khusus untuk nama file PDF (contoh: 01-08)
  const formatShortDateFile = (dateString: string | Date) => {
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}-${month}`; 
  };

  const generateSlipGuru = () => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    if (!email) return alert("Pilih Email Guru terlebih dahulu!");

    const filtered = rawData.absensi.filter((r: any) => {
      const rowDate = new Date(r.tanggal);
      return r.email_guru === email && rowDate >= start && rowDate <= end;
    });

    if (filtered.length === 0) {
        setResult([]);
        setHasSearched(true);
        return alert("Tidak ada data mengajar pada periode tersebut.");
    }

    const weeksMap = new Map();

    filtered.forEach((row: any) => {
      const dateObj = new Date(row.tanggal);
      const dayOfWeek = dateObj.getDay(); 

      if (dayOfWeek === 0) return; 

      const monday = getMonday(dateObj);
      const weekKey = monday.getTime();

      if (!weeksMap.has(weekKey)) {
        const saturday = new Date(monday);
        saturday.setDate(monday.getDate() + 5);

        weeksMap.set(weekKey, {
          label: `${formatDate(monday)} s/d ${formatDate(saturday)}`,
          monday: monday,
          matrix: {}, 
          dailyTotals: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
          weeklyTotal: 0,
          maxJam: 8 
        });
      }

      const weekData = weeksMap.get(weekKey);
      
      if (!weekData.matrix[dayOfWeek]) {
        weekData.matrix[dayOfWeek] = {};
      }

      if (row.jam) {
        const jamArray = row.jam.toString().split(',')
          .map((j: string) => parseInt(j.trim(), 10))
          .filter((j: number) => !isNaN(j));
        
        jamArray.forEach((jam: number) => {
          if (jam > weekData.maxJam) weekData.maxJam = jam;

          if (!weekData.matrix[dayOfWeek][jam]) {
            weekData.matrix[dayOfWeek][jam] = {
              mapel: row.mapel,
              kelas: row.kelas,
              materi: row.materi
            };
            weekData.dailyTotals[dayOfWeek]++;
            weekData.weeklyTotal++;
          }
        });
      }
    });

    const sortedWeeks = Array.from(weeksMap.values()).sort((a, b) => a.monday.getTime() - b.monday.getTime());
    setResult(sortedWeeks);
    setHasSearched(true);
  };

  // Fungsi untuk handle klik tombol Cetak agar nama file otomatis berubah
  const handlePrint = () => {
    const originalTitle = document.title; // Simpan judul web asli
    
    // Siapkan nama file
    const safeName = namaGuru.trim() || email.split('@')[0] || "Guru";
    const tglMulai = formatShortDateFile(startDate);
    const tglAkhir = formatShortDateFile(endDate);
    
    // Ubah title web sementara (Browser akan pakai ini untuk nama file PDF)
    document.title = `Rekap ${safeName} ${tglMulai} sd ${tglAkhir}`;
    
    window.print();
    
    // Kembalikan ke judul web aslinya
    document.title = originalTitle;
  };

  const allEmails = [...new Set([
      ...(rawData.absensi || []).map((a: any) => a.email_guru).filter(Boolean), 
      ...(rawData.emails_only || [])
  ])].sort();

  const daysLabel = [
      { id: 1, name: "SENIN" },
      { id: 2, name: "SELASA" },
      { id: 3, name: "RABU" },
      { id: 4, name: "KAMIS" },
      { id: 5, name: "JUMAT" },
      { id: 6, name: "SABTU" }
  ];

  return (
    <div className="fade-in">
      {/* --- FORM FILTER (Disembunyikan saat di-print) --- */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-slate-500 mb-1">Pilih Email Guru</label>
            <select
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full px-3 py-2 text-sm border-slate-300 rounded-lg border bg-slate-50 focus:ring-indigo-500 outline-none"
            >
              <option value="">-- Pilih Email --</option>
              {allEmails.map((e: any) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div className="md:col-span-4">
            <label className="block text-xs font-medium text-slate-500 mb-1">Nama Guru (Ditampilkan di Cetakan)</label>
            <input
              type="text"
              value={namaGuru}
              onChange={(e) => setNamaGuru(e.target.value)}
              placeholder="Masukkan Nama Lengkap"
              className="block w-full px-3 py-2 text-sm border-slate-300 rounded-lg border bg-slate-50 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-slate-500 mb-1">Periode</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full px-2 py-2 text-xs border-slate-300 rounded-lg border bg-slate-50 outline-none"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="block w-full px-2 py-2 text-xs border-slate-300 rounded-lg border bg-slate-50 outline-none"
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <button
              onClick={generateSlipGuru}
              className="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-sm flex items-center justify-center gap-2 transition-colors"
            >
              <i className="fa-solid fa-file-invoice"></i> Buat Slip
            </button>
          </div>
        </div>
      </div>

      {!hasSearched && (
        <div className="py-20 text-center print:hidden">
          <h3 className="text-lg font-medium text-slate-900">Belum ada slip</h3>
          <p className="text-slate-500">Pilih email, isi nama guru, dan tentukan periode untuk melihat rekapitulasi matriks.</p>
        </div>
      )}

      {hasSearched && result.length > 0 && (
        <div>
          {/* Tombol Cetak yang memanggil handlePrint */}
          <div className="flex justify-end mb-4 print:hidden">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-900 shadow-sm flex items-center gap-2 transition-colors"
            >
              <i className="fa-solid fa-print"></i> Cetak PDF
            </button>
          </div>

          {/* --- KERTAS SLIP --- */}
          <div className="bg-white p-8 border border-slate-200 shadow-lg max-w-[1000px] mx-auto slip-paper text-slate-800">
            {/* Header Kop */}
            <div className="text-center border-b-[3px] border-slate-800 pb-4 mb-6">
              <h1 className="text-2xl font-black uppercase tracking-wider text-slate-900">REKAP GURU MADRASAH</h1>
              <p className="text-sm text-slate-600 uppercase font-semibold mt-1">{tenantName}</p>
            </div>

            {/* Info Guru */}
            <div className="flex justify-between mb-8 text-sm bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <p className="text-slate-500 mb-1 text-xs uppercase font-bold">Nama Guru</p>
                <p className="font-bold text-slate-900 text-lg uppercase">{namaGuru || email}</p>
                {namaGuru && <p className="text-slate-500 text-xs mt-0.5">{email}</p>}
              </div>
              <div className="text-right">
                <p className="text-slate-500 mb-1 text-xs uppercase font-bold">Periode Laporan</p>
                <p className="font-semibold text-slate-800">{formatDate(startDate)} - {formatDate(endDate)}</p>
              </div>
            </div>

            {/* Looping Tabel per Pekan */}
            {result.map((week, wIdx) => {
              const rowHours = Array.from({ length: week.maxJam }, (_, i) => i + 1);

              return (
                <div key={wIdx} className="mb-12 break-inside-avoid">
                  <div className="mb-2 flex items-center justify-between">
                     <h3 className="font-bold text-base bg-indigo-100 text-indigo-900 px-3 py-1 rounded-md">
                        PEKAN {wIdx + 1}
                     </h3>
                     <span className="text-sm font-semibold text-slate-600">{week.label}</span>
                  </div>

                  <table className="w-full text-sm border-collapse border-2 border-slate-800 font-sans">
                    <thead className="bg-slate-200 border-b-2 border-slate-800">
                      <tr>
                        <th className="border border-slate-400 p-2 w-16 text-center text-xs">JAM<br/>KE</th>
                        {daysLabel.map(day => (
                          <th key={day.id} className="border border-slate-400 p-2 w-32 text-center text-xs tracking-wider">
                            {day.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    
                    <tbody className="bg-white">
                      {rowHours.map(jam => (
                        <tr key={jam} className="hover:bg-slate-50 transition-colors">
                          <td className="border border-slate-300 p-2 text-center font-bold bg-slate-50 text-slate-700">
                             {jam}
                          </td>
                          
                          {daysLabel.map(day => {
                            const cellData = week.matrix[day.id]?.[jam];
                            return (
                              <td key={day.id} className="border border-slate-300 p-1.5 align-top h-14">
                                {cellData ? (
                                  <div className="flex flex-col items-center justify-center text-center h-full">
                                    <span className="font-bold text-xs text-slate-900 leading-tight">{cellData.mapel}</span>
                                    <span className="text-[10px] text-indigo-600 font-bold mt-0.5">{cellData.kelas}</span>
                                  </div>
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-slate-200">
                                      -
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>

                    <tfoot className="border-t-2 border-slate-800">
                      <tr className="bg-slate-100 font-bold">
                        <td className="border border-slate-400 p-2 text-center text-xs text-slate-700 tracking-wider font-bold">
                           JUMLAH JP
                        </td>
                        {daysLabel.map(day => (
                          <td key={day.id} className="border border-slate-400 p-2 text-center text-base text-slate-900">
                            {week.dailyTotals[day.id] > 0 ? week.dailyTotals[day.id] : ''}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td colSpan={6} className="text-right p-3 font-black text-sm uppercase tracking-wide border-r-0 bg-white">
                          Total JP Pekan {wIdx + 1}
                        </td>
                        <td className="border-l-2 border-slate-800 p-2 text-center font-black text-xl bg-indigo-50 text-indigo-700">
                          {week.weeklyTotal}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              );
            })}
            
            {result.length > 1 && (
               <div className="mt-8 p-4 border-2 border-slate-800 bg-slate-50 flex justify-between items-center break-inside-avoid rounded-lg">
                  <div className="font-bold text-lg uppercase text-slate-700">Grand Total Semua Pekan</div>
                  <div className="font-black text-3xl text-indigo-800">
                     {result.reduce((acc, week) => acc + week.weeklyTotal, 0)} <span className="text-lg">JP</span>
                  </div>
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
