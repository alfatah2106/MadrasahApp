import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const API_URL = import.meta.env.VITE_API_URL || "https://madrasah-api.miqdad-alfatah.workers.dev";
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "142276774829-q7b6vicbq1hm1ltng7itehietn03l119.apps.googleusercontent.com";
export const API_SECRET = import.meta.env.VITE_API_SECRET || "your-secret-token";

interface AppContextType {
  user: any;
  tenant: { id: string; name: string; slug: string } | null;
  options: { mapel: any[]; ujian: any[]; kelas: any[] };
  students: any[];
  jurnal: any[];
  sortMode: string;
  setSortMode: (mode: string) => void;
  login: (user: any) => void;
  logout: () => void;
  setTenant: (tenant: any) => void;
  fetchOptions: () => Promise<void>;
  fetchStudents: () => Promise<void>;
  fetchJurnal: () => Promise<void>;
  showNotify: (type: 'success' | 'error' | 'info', msg: string) => void;
  notifications: { id: number; type: string; msg: string }[];
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [tenant, setTenantState] = useState<any>(null);
  const [options, setOptions] = useState({ mapel: [], ujian: [], kelas: [] });
  const [students, setStudents] = useState<any[]>([]);
  const [jurnal, setJurnal] = useState<any[]>([]);
  const [sortMode, setSortModeState] = useState('gender');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("school_user");
    if (savedUser) setUser(JSON.parse(savedUser));

    const tId = localStorage.getItem("last_tenant_id");
    const tName = localStorage.getItem("last_tenant_name");
    const tSlug = localStorage.getItem("last_tenant_slug");
    if (tId && tName && tSlug) {
      setTenantState({ id: tId, name: tName, slug: tSlug });
    }

    const sMode = localStorage.getItem("school_sort_mode") || "gender";
    setSortModeState(sMode);

    const cacheMapel = localStorage.getItem("cache_mapel");
    const cacheUjian = localStorage.getItem("cache_ujian");
    const cacheKelas = localStorage.getItem("cache_kelas");
    if (cacheMapel || cacheUjian || cacheKelas) {
      setOptions({
        mapel: cacheMapel ? JSON.parse(cacheMapel) : [],
        ujian: cacheUjian ? JSON.parse(cacheUjian) : [],
        kelas: cacheKelas ? JSON.parse(cacheKelas) : [],
      });
    }

    const cacheStudents = localStorage.getItem("cache_students");
    if (cacheStudents) setStudents(JSON.parse(cacheStudents));
  }, []);

  const setSortMode = (mode: string) => {
    localStorage.setItem("school_sort_mode", mode);
    setSortModeState(mode);
  };

  const login = (userData: any) => {
    localStorage.setItem("school_user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("school_user");
    const cacheKeys = [
      "cache_students", "cache_mapel", "cache_ujian", "cache_kelas",
      "cache_options_laporan", "cache_emails_laporan", "last_tenant_id", "last_tenant_name", "last_tenant_slug"
    ];
    cacheKeys.forEach(key => localStorage.removeItem(key));
    setUser(null);
    setTenantState(null);
    setOptions({ mapel: [], ujian: [], kelas: [] });
    setStudents([]);
    setJurnal([]);
  };

  const setTenant = (t: any) => {
    if (tenant && tenant.id !== t.id) {
      ["cache_students", "cache_mapel", "cache_ujian", "cache_kelas", "cache_options_laporan", "cache_emails_laporan"].forEach(k => localStorage.removeItem(k));
      setStudents([]);
      setOptions({ mapel: [], ujian: [], kelas: [] });
    }
    localStorage.setItem("last_tenant_id", t.id);
    localStorage.setItem("last_tenant_name", t.name);
    localStorage.setItem("last_tenant_slug", t.slug);
    setTenantState(t);
  };

  const fetchOptions = useCallback(async () => {
    if (!tenant?.id) return;
    try {
      const res = await fetch(`${API_URL}/api?action=get_options&tenant_id=${tenant.id}`);
      const data = await res.json();
      const newOpts = {
        mapel: data.mapel || [],
        ujian: data.ujian || [],
        kelas: data.kelas || []
      };
      setOptions(newOpts);
      localStorage.setItem("cache_mapel", JSON.stringify(newOpts.mapel));
      localStorage.setItem("cache_ujian", JSON.stringify(newOpts.ujian));
      localStorage.setItem("cache_kelas", JSON.stringify(newOpts.kelas));
    } catch (e) {
      console.error("Gagal memuat options", e);
      showNotify("error", "Gagal memuat daftar mapel/kelas.");
    }
  }, [tenant?.id]);

  const fetchStudents = useCallback(async () => {
    if (!tenant?.id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api?action=get_db&tenant_id=${tenant.id}`);
      const data = await res.json();
      setStudents(data);
      localStorage.setItem("cache_students", JSON.stringify(data));
    } catch (e) {
      showNotify("error", "Gagal memuat data siswa.");
    } finally {
      setIsLoading(false);
    }
  }, [tenant?.id]);

  const fetchJurnal = useCallback(async () => {
    if (!tenant?.id) return;
    try {
      const res = await fetch(`${API_URL}/api?action=get_journal&tenant_id=${tenant.id}`);
      let rawData = await res.json();
      rawData.sort((a: any, b: any) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
      
      const uniqueDataMap = new Map();
      rawData.forEach((item: any) => {
          const key = `${item.tanggal}-${item.kelas}-${item.mapel}`;
          if (!uniqueDataMap.has(key)) {
              uniqueDataMap.set(key, item);
          }
      });
      setJurnal(Array.from(uniqueDataMap.values()));
    } catch (e) {
      console.error("Gagal mengambil riwayat", e);
    }
  }, [tenant?.id]);

  const showNotify = useCallback((type: 'success' | 'error' | 'info', msg: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, msg }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  }, []);

  return (
    <AppContext.Provider value={{
      user, tenant, options, students, jurnal, sortMode, setSortMode,
      login, logout, setTenant, fetchOptions, fetchStudents, fetchJurnal,
      showNotify, notifications, isLoading, setIsLoading
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};
