import React from 'react';
import { GraduationCap, LayoutDashboard, ClipboardList, Award, BookOpen, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

export default function Sidebar({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) {
  const { tenant, user, logout, sortMode, setSortMode } = useAppContext();
  const navigate = useNavigate();

  return (
    <aside className="md:w-64 bg-white border-r border-gray-200 flex flex-col z-10">
      <div className="p-6 border-b border-gray-100 flex items-center space-x-3">
        <div className="bg-blue-600 text-white p-2 rounded-lg shadow-blue-200 shadow-lg">
          <GraduationCap />
        </div>
        <h1 className="font-bold text-gray-800 text-lg leading-tight">
          Madrasah<br />
          {tenant ? <span className="text-blue-600 text-sm font-medium">{tenant.name}</span> : <span className="text-blue-600">App</span>}
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`nav-btn w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'active-tab-btn' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}
        >
          <LayoutDashboard className="mr-3 w-5 h-5" /> Dashboard
        </button>
        <div className="pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider pl-3">
          Menu Utama
        </div>
        <button
          onClick={() => setActiveTab('absensi')}
          className={`nav-btn w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'absensi' ? 'active-tab-btn' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}
        >
          <ClipboardList className="mr-3 w-5 h-5" /> Absensi
        </button>
        <button
          onClick={() => setActiveTab('nilai')}
          className={`nav-btn w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'nilai' ? 'active-tab-btn' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}
        >
          <Award className="mr-3 w-5 h-5" /> Input Nilai
        </button>
        <button
          onClick={() => setActiveTab('jurnal')}
          className={`nav-btn w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'jurnal' ? 'active-tab-btn' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}
        >
          <BookOpen className="mr-3 w-5 h-5" /> Jurnal Guru
        </button>
        <button
          onClick={() => navigate('/laporan')}
          className="nav-btn w-full flex items-center p-3 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
        >
          <FileText className="mr-3 w-5 h-5" /> Laporan
        </button>

        <div className="pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider pl-3">
          Pengaturan
        </div>
        <div className="px-3">
          <label className="text-[10px] text-gray-400 font-bold uppercase mb-1 block">Urutan Siswa</label>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value)}
            className="w-full p-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white outline-none"
          >
            <option value="gender">L/P & Nama</option>
            <option value="nama">Nama (A-Z)</option>
          </select>
        </div>
      </nav>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3 text-sm text-gray-600">
          {user?.picture && (
            <img src={user.picture} className="w-8 h-8 rounded-full bg-white border border-gray-200" alt="User" />
          )}
          <div className="flex flex-col truncate">
            <span className="font-bold text-gray-800 truncate">{user?.name || 'Pengguna'}</span>
            <span className="text-[10px] text-gray-500 truncate">{user?.email || 'user@email.com'}</span>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-3 w-full text-xs text-red-600 bg-red-50 hover:bg-red-100 py-2 rounded-lg font-medium transition-colors border border-red-100"
        >
          Log Out
        </button>
      </div>
    </aside>
  );
}
