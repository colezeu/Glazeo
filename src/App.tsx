import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import AppErrorBoundary from "./AppErrorBoundary";
import { supabase } from "./lib/supabase";
// Import pagini
import HomePage from "./HomePage";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import BalustradeConfiguratorPage from "./BalustradeConfiguratorPage";
import PergolaConfiguratorPage from "./PergolaConfiguratorPage";
import ShowerConfiguratorPage from "./ShowerConfiguratorPage";
import TerraceConfiguratorPage from "./TerraceConfiguratorPage";
import SwingDoorConfiguratorPage from "./SwingDoorConfiguratorPage";
import SlidingDoorConfiguratorPage from "./SlidingDoorConfiguratorPage";
import PartitionConfiguratorPage from "./PartitionConfiguratorPage";
import OglinziConfiguratorPage from "./OglinziConfiguratorPage";
import CopertinaConfiguratorPage from "./CopertinaConfiguratorPage";
import PartnerManagement from "./pages/PartnerManagement";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const isAdmin = user?.email === 'office@glass.associates';

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      // Creează sau actualizează profilul la login (cu email)
      if (u) {
        supabase.from('profiles').select('User_id,email').eq('User_id', u.id).single().then(({ data, error }) => {
          if (error) {
            // Profil nou
            supabase.from('profiles').insert({ User_id: u.id, price_multiplier: 1.0, email: u.email }).then(() => {});
          } else if (!data.email) {
            // Profil vechi fără email — actualizează
            supabase.from('profiles').update({ email: u.email }).eq('User_id', u.id).then(() => {});
          }
        });
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <AppErrorBoundary>
       <div className="fixed top-20 right-6 z-[100] flex items-center gap-3">
  {user ? (
    <>
      {/* Buton Dashboard */}
      <Link 
        to="/dashboard" 
        className="bg-[#1a1c24] hover:bg-[#252830] text-[#c8a96e] px-4 py-2 rounded-xl text-sm flex items-center gap-2 shadow-lg border border-[#c8a96e]/30"
      >
        📁 Proiectele mele
      </Link>

      {/* Buton Admin — doar pentru admin */}
      {isAdmin && (
        <Link
          to="/admin/partners"
          className="bg-[#1a1c24] hover:bg-[#252830] text-[#c8a96e] px-4 py-2 rounded-xl text-sm flex items-center gap-2 shadow-lg border border-[#c8a96e]/30"
        >
          👥 Parteneri
        </Link>
      )}

      {/* Buton Logout */}
      <button 
        onClick={async () => {
          await supabase.auth.signOut();
          window.location.href = '/auth';
        }}
        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-xl text-sm flex items-center gap-2 border border-red-500/30"
      >
        Deconectare
      </button>
    </>
  ) : (
    <Link 
      to="/auth" 
      className="bg-[#c8a96e] hover:bg-[#d4b87a] text-black px-4 py-2 rounded-xl text-sm font-medium shadow-lg"
    >
      Autentificare
    </Link>
  )}
</div>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin/partners" element={<ProtectedRoute><PartnerManagement /></ProtectedRoute>} />

          {/* Configuratoare */}
          <Route path="/configurator/balustrade" element={<BalustradeConfiguratorPage />} />
          <Route path="/configurator/pergola" element={<PergolaConfiguratorPage />} />
          <Route path="/configurator/cabine-dus" element={<ShowerConfiguratorPage />} />
          <Route path="/configurator/inchidere-terasa" element={<TerraceConfiguratorPage />} />
          <Route path="/configurator/usi-batante" element={<SwingDoorConfiguratorPage />} />
          <Route path="/configurator/usi-culisante" element={<SlidingDoorConfiguratorPage />} />
          <Route path="/configurator/partitionari" element={<PartitionConfiguratorPage />} />
          <Route path="/configurator/oglinzi" element={<OglinziConfiguratorPage />} />
          <Route path="/configurator/copertina" element={<CopertinaConfiguratorPage />} />
        </Routes>
      </AppErrorBoundary>
    </BrowserRouter>
  );
}

export default App;