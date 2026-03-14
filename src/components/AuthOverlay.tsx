import React, { useState, useEffect, useRef } from 'react';
import { Lock } from 'lucide-react';
import { useAppContext, API_URL, GOOGLE_CLIENT_ID } from '../context/AppContext';

export default function AuthOverlay() {
  const { user, tenant, setTenant, login } = useAppContext();
  const [slug, setSlug] = useState(tenant?.slug || '');
  const [verifyMsg, setVerifyMsg] = useState('');
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const btnContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof google === "undefined" || !google.accounts) {
      const timer = setInterval(() => {
        if (typeof google !== "undefined" && google.accounts) {
          clearInterval(timer);
          initGoogleAuth();
        }
      }, 200);
      return () => clearInterval(timer);
    } else {
      initGoogleAuth();
    }
  }, []);

  const initGoogleAuth = () => {
    try {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleAuthResponse,
      });
      if (btnContainerRef.current) {
        google.accounts.id.renderButton(btnContainerRef.current, {
          theme: "filled_blue",
          size: "large",
          width: 250,
          shape: "pill",
        });
      }
    } catch (e) {
      console.error("Auth failed", e);
    }
  };

  const handleAuthResponse = (response: any) => {
    const payload = JSON.parse(atob(response.credential.split(".")[1]));
    login(payload);
  };

  useEffect(() => {
    const verifySlug = async () => {
      const s = slug.trim().toLowerCase();
      if (!s) {
        setVerifyMsg('');
        setVerifyStatus('idle');
        return;
      }

      setVerifyMsg('Mengecek...');
      setVerifyStatus('checking');

      try {
        const res = await fetch(`${API_URL}/api?action=get_tenants&slug=${s}`);
        const data = await res.json();

        if (data && data.id) {
          setTenant({ id: data.id, name: data.name, slug: data.slug });
          setVerifyMsg(`✅ Sekolah ditemukan: ${data.name}`);
          setVerifyStatus('success');
        } else {
          setVerifyMsg('❌ Sekolah tidak ditemukan.');
          setVerifyStatus('error');
        }
      } catch (e) {
        setVerifyMsg('⚠️ Gangguan koneksi.');
        setVerifyStatus('error');
      }
    };

    const timer = setTimeout(verifySlug, 500);
    return () => clearTimeout(timer);
  }, [slug]);

  if (user && tenant) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/90 z-[100] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center">
        <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center text-white mx-auto mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Akses Terbatas</h2>
        <p className="text-gray-500 mb-6 text-sm">
          Silakan masukkan nama Id Sekolah dan masuk dengan akun Google.
        </p>

        <div className="mb-4 text-left">
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">
            Id Sekolah
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm"
          />
          <p className={`text-[10px] mt-1 ml-1 font-medium ${
            verifyStatus === 'success' ? 'text-emerald-500' :
            verifyStatus === 'error' ? 'text-red-500' : 'text-gray-400'
          }`}>
            {verifyMsg}
          </p>
        </div>

        <div
          ref={btnContainerRef}
          className={`flex justify-center transition-opacity ${verifyStatus === 'success' ? '' : 'opacity-50 pointer-events-none'}`}
        ></div>
      </div>
    </div>
  );
}
