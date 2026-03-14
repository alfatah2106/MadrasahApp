import React, { useState, useEffect } from 'react';
import AuthOverlay from '../components/AuthOverlay';
import Sidebar from '../components/Sidebar';
import DashboardTab from '../components/DashboardTab';
import AbsensiTab from '../components/AbsensiTab';
import NilaiTab from '../components/NilaiTab';
import JurnalTab from '../components/JurnalTab';
import { useAppContext } from '../context/AppContext';

export default function MainApp() {
  const { user, tenant, notifications, isLoading, fetchOptions, fetchStudents, options, students } = useAppContext();
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (user && tenant) {
      if (options.mapel.length === 0) fetchOptions();
      if (students.length === 0) fetchStudents();
    }
  }, [user, tenant]);

  return (
    <>
      <AuthOverlay />
      <div
        className={`min-h-screen flex flex-col md:flex-row max-w-7xl mx-auto shadow-2xl overflow-hidden bg-white transition-all duration-500 ${!user || !tenant ? 'blur-sm pointer-events-none opacity-50' : 'opacity-100'}`}
      >
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-gray-50">
          <div className="fixed top-4 right-4 z-[110] pointer-events-none flex flex-col gap-2">
            {notifications.map(n => (
              <div key={n.id} className={`p-4 mb-2 rounded-xl shadow-lg text-white font-medium flex items-center gap-3 animate__animated animate__fadeInRight ${n.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                <span>{n.msg}</span>
              </div>
            ))}
          </div>

          {activeTab === 'dashboard' && <DashboardTab setActiveTab={setActiveTab} />}
          {activeTab === 'absensi' && <AbsensiTab />}
          {activeTab === 'nilai' && <NilaiTab />}
          {activeTab === 'jurnal' && <JurnalTab />}

          {isLoading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50">
              <div className="flex flex-col items-center">
                <div className="loader mb-2"></div>
                <span className="text-blue-600 font-bold animate-pulse">Memproses Data...</span>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
