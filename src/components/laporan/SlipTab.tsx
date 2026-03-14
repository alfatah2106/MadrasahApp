import React, { useState } from 'react';

export default function SlipTab({ rawData }: { rawData: any }) {
  const [email, setEmail] = useState('');
  const [startDate, setStartDate] = useState(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }));
  const [endDate, setEndDate] = useState(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }));
  const [result, setResult] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const generateSlipGuru = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59);
    if (!email) return alert("Pilih Guru!");

    const filtered = rawData.absensi.filter((r: any) =>
      r.email_guru === email && new Date(r.tanggal) >= start && new Date(r.tanggal) <= end
    );

    if (filtered.length === 0) return alert("Tidak ada data mengajar.");

    const uniqueSessions: any[] = [];
    const seen = new Set();
    const dailyHours: Record<string, number> = {};

    filtered.forEach((row: any) => {
      const key = `${row.tanggal}_${row.jam}_${row.kelas}_${row.mapel}`;
      if (!seen.has(key)) {
        seen.add(key);
        
        let durasi = 0;
        if (row.jam) {
            const jamArray = row.jam.toString().split(',').filter((j: string) => j.trim() !== "");
            durasi = jamArray.length;
        }

        const tgl = row.tanggal;
        dailyHours[tgl] = (dailyHours[tgl] || 0) + durasi;

        let pukul = "-";
        let hoursInt = -1;
        if (row.created_at) {
            // Extract time directly from string to avoid timezone conversion issues
            // Handles cases where the backend returns local time appended with 'Z'
            const timeMatch = String(row.created_at).match(/(\d{2}):(\d{2})/);
            if (timeMatch) {
                hoursInt = parseInt(timeMatch[1], 10);
                pukul = `${timeMatch[1]}:${timeMatch[2]}`;
            } else {
                const dateObj = new Date(row.created_at);
                if (!isNaN(dateObj.getTime())) {
                    hoursInt = dateObj.getHours();
                    const hours = hoursInt.toString().padStart(2, '0');
                    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
                    pukul = `${hours}:${minutes}`;
                }
            }
        }

        const isOutsideTime = hoursInt !== -1 && (hoursInt < 7 || hoursInt >= 14);

        uniqueSessions.push({
            tanggal: row.tanggal,
            mapel: row.mapel,
            kelas: row.kelas,
            materi: row.materi,
            jumlah_jam: durasi,
            pukul: pukul,
            isOutsideTime: isOutsideTime
        });
      }
    });

    uniqueSessions.forEach(sess => {
        sess.totalJamHariIni = dailyHours[sess.tanggal] || 0;
        sess.isOverLimit = sess.totalJamHariIni > 8;
    });

    uniqueSessions.sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
    setResult(uniqueSessions);
    setHasSearched(true);
  };

  const totalJam = result.reduce((acc, curr) => acc + curr.jumlah_jam, 0);

  const allEmails = [...new Set([...rawData.absensi.map((a: any) => a.email_guru).filter(Boolean), ...(rawData.emails_only || [])])].sort();

  return (
    <div className="fade-in">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Pilih Email Guru</label>
            <select
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full px-3 py-2 text-sm border-slate-300 rounded-lg border bg-slate-50 focus:ring-indigo-500"
            >
              <option value="">-- Pilih Guru --</option>
              {allEmails.map((e: any) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Periode</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full px-2 py-2 text-xs border-slate-300 rounded-lg border bg-slate-50"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="block w-full px-2 py-2 text-xs border-slate-300 rounded-lg border bg-slate-50"
              />
            </div>
          </div>
          <div>
            <button
              onClick={generateSlipGuru}
              className="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-sm flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-file-invoice"></i> Buat Slip
            </button>
          </div>
        </div>
      </div>

      {!hasSearched && (
        <div className="py-20 text-center print:hidden">
          <h3 className="text-lg font-medium text-slate-900">Belum ada slip</h3>
          <p className="text-slate-500">Pilih email guru dan periode.</p>
        </div>
      )}

      {hasSearched && (
        <div>
          <div className="flex justify-end mb-4 print:hidden">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-900 shadow-sm flex items-center gap-2"
            >
              <i className="fa-solid fa-print"></i> Cetak PDF
            </button>
          </div>
          <div className="bg-white p-8 border border-slate-200 shadow-lg max-w-4xl mx-auto slip-paper">
            <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
              <h1 className="text-2xl font-bold uppercase tracking-wider text-slate-900">SISTEM ISKA</h1>
              <p className="text-sm text-slate-600">Laporan Rekapitulasi Jam Mengajar Guru</p>
            </div>
            <div className="flex justify-between mb-6 text-sm">
              <div>
                <p className="text-slate-500">Guru:</p>
                <p className="font-bold text-slate-800 text-lg">{email}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-500">Periode:</p>
                <p className="font-semibold text-slate-800">{startDate} - {endDate}</p>
              </div>
            </div>
            <table className="w-full text-left text-sm border border-slate-300 mb-6 font-sans">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300">
                <tr>
                  <th className="px-4 py-2 border-r border-slate-300 w-12 text-center">No</th>
                  <th className="px-4 py-2 border-r border-slate-300 w-32">Tanggal</th>
                  <th className="px-4 py-2 border-r border-slate-300 w-20 text-center">Pukul</th>
                  <th className="px-4 py-2 border-r border-slate-300">Mapel / Kelas</th>
                  <th className="px-4 py-2 border-r border-slate-300">Materi</th>
                  <th className="px-4 py-2 text-center w-24">Jml Jam</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {result.map((sess, idx) => {
                  const dateFmt = new Date(sess.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
                  let rowClass = "border-b hover:bg-slate-50 transition-colors";
                  
                  if (sess.isOverLimit) {
                      rowClass = "border-b bg-rose-50 hover:bg-rose-100/80";
                  } else if (sess.isOutsideTime) {
                      rowClass = "border-b bg-amber-50 hover:bg-amber-100/80";
                  }

                  return (
                    <tr key={idx} className={rowClass}>
                      <td className="px-4 py-3 border-r border-slate-300 text-center text-slate-500 text-xs">{idx + 1}</td>
                      <td className="px-4 py-3 border-r border-slate-300 text-slate-700 text-sm whitespace-nowrap">{dateFmt}</td>
                      <td className={`px-4 py-3 border-r border-slate-300 text-center font-medium ${sess.isOutsideTime ? 'text-amber-700' : 'text-slate-600'} text-sm`}>{sess.pukul}</td>
                      <td className="px-4 py-3 border-r border-slate-300">
                          <div className="font-bold text-slate-800 text-sm">{sess.mapel}</div>
                          <div className="text-[11px] text-indigo-600 font-semibold italic">Kelas: {sess.kelas}</div>
                      </td>
                      <td className="px-4 py-3 border-r border-slate-300">
                          <div className="text-slate-600 text-xs leading-relaxed max-w-[200px] line-clamp-2">{sess.materi || '-'}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                          <div className="font-black text-slate-900 text-base">{sess.jumlah_jam}</div>
                          {sess.isOverLimit ? (
                              <div className="text-[10px] text-rose-600 font-bold mt-1 flex items-center justify-center gap-1">
                                  <i className="fa-solid fa-triangle-exclamation"></i> Total: {sess.totalJamHariIni} Jam (Limit 8)
                              </div>
                          ) : sess.isOutsideTime ? (
                              <div className="text-[10px] text-amber-600 font-bold mt-1 flex items-center justify-center gap-1">
                                  <i className="fa-solid fa-clock"></i> Diluar Jam Kerja
                              </div>
                          ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 font-bold text-slate-800 border-t-2 border-slate-300">
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-right border-r border-slate-300">Total Jam</td>
                  <td className="px-4 py-3 text-center text-lg">{totalJam}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

