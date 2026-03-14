import React from 'react';
import { ClipboardList, Award, BookOpen, FileBarChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

export default function DashboardTab({ setActiveTab }: { setActiveTab: (t: string) => void }) {
  const { user } = useAppContext();
  const navigate = useNavigate();

  return (
    <div className="p-6 md:p-8 overflow-y-auto w-full">
      <div className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-3xl font-extrabold text-gray-800">
          Halo, {user?.given_name || user?.name?.split(" ")[0] || 'Pengguna'}!
        </h2>
        <p className="text-gray-500 mt-1">
          Silakan pilih menu di sebelah kiri atau pintasan di bawah ini.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div
          onClick={() => setActiveTab('absensi')}
          className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm cursor-pointer hover:shadow-md hover:border-blue-300 transition-all group"
        >
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <ClipboardList className="text-blue-600 w-6 h-6" />
          </div>
          <h3 className="font-bold text-gray-800 text-lg">Absensi Siswa</h3>
          <p className="text-sm text-gray-400 mt-1">Catat kehadiran</p>
        </div>

        <div
          onClick={() => setActiveTab('nilai')}
          className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all group"
        >
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Award className="text-emerald-600 w-6 h-6" />
          </div>
          <h3 className="font-bold text-gray-800 text-lg">Input Nilai</h3>
          <p className="text-sm text-gray-400 mt-1">Kelola nilai ujian</p>
        </div>

        <div
          onClick={() => setActiveTab('jurnal')}
          className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm cursor-pointer hover:shadow-md hover:border-amber-300 transition-all group"
        >
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <BookOpen className="text-amber-600 w-6 h-6" />
          </div>
          <h3 className="font-bold text-gray-800 text-lg">Jurnal Guru</h3>
          <p className="text-sm text-gray-400 mt-1">Riwayat mengajar</p>
        </div>

        <div
          onClick={() => navigate('/laporan')}
          className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm cursor-pointer hover:shadow-md hover:border-purple-300 transition-all group block"
        >
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FileBarChart className="text-purple-600 w-6 h-6" />
          </div>
          <h3 className="font-bold text-gray-800 text-lg">Laporan</h3>
          <p className="text-sm text-gray-400 mt-1">Rekapitulasi data</p>
        </div>
      </div>
    </div>
  );
}
