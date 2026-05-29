import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { useState, useEffect, lazy, Suspense } from "react";
import type { User } from "@supabase/supabase-js";
import AppErrorBoundary from "./AppErrorBoundary";
import { supabase } from "./lib/supabase";

// Eager load — astea se încarcă mereu (pagina principală)
import HomePage from "./HomePage";
import AuthPage from "./pages/AuthPage";
import ProtectedRoute from "./components/ProtectedRoute";

// Lazy load — se încarcă doar când userul navighează la ele
const Dashboard = lazy(() => import("./pages/Dashboard"));
const PartnerManagement = lazy(() => import("./pages/PartnerManagement"));
const BalustradeConfiguratorPage = lazy(() => import("./BalustradeConfiguratorPage"));
const PergolaConfiguratorPage = lazy(() => import("./PergolaConfiguratorPage"));
const ShowerConfiguratorPage = lazy(() => import("./ShowerConfiguratorPage"));
const TerraceConfiguratorPage = lazy(() => import("./TerraceConfiguratorPage"));
const SwingDoorConfiguratorPage = lazy(() => import("./SwingDoorConfiguratorPage"));
const SlidingDoorConfiguratorPage = lazy(() => import("./SlidingDoorConfiguratorPage"));
const PartitionConfiguratorPage = lazy(() => import("./PartitionConfiguratorPage"));
const OglinziConfiguratorPage = lazy(() => import("./OglinziConfiguratorPage"));
const CopertinaConfiguratorPage = lazy(() => import("./CopertinaConfiguratorPage"));

/** Loading fallback pentru lazy components */
function PageLoader() {
  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          border: "2px solid rgba(200,169,110,0.2)", borderTopColor: "#c8a96e",
          animation: "spin 0.8s linear infinite", margin: "0 auto 16px",
        }} />
        <span style={{ color: "rgba(240,237,232,0.4)", fontSize: "0.85rem" }}>Se încarcă...</span>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const isAdmin = user?.email === 'office@glass.associates';

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        const key = `profile_created_${u.id}`;
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, '1');
        supabase.from('profiles').select('user_id,email').eq('user_id', u.id).single().then(({ data, error }) => {
          if (error) {
            supabase.from('profiles').insert({ user_id: u.id, price_multiplier: 1.0, email: u.email }).then(() => {});
          } else if (!data.email) {
            supabase.from('profiles').update({ email: u.email }).eq('user_id', u.id).then(() => {});
          }
        });
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <AppErrorBoundary>
       <div className="fixed top-20 right-4 md:right-6 z-[100] flex items-center gap-2 md:gap-3">
  {user ? (
    <>
      <Link 
        to="/dashboard" 
        className="bg-[#1a1c24] hover:bg-[#252830] text-[#c8a96e] px-3 py-2 md:px-4 md:py-2 rounded-xl text-xs md:text-sm flex items-center gap-1 md:gap-2 shadow-lg border border-[#c8a96e]/30"
      >
        📁 <span className="hidden md:inline">Proiectele mele</span><span className="md:hidden">Proiecte</span>
      </Link>

      {isAdmin && (
        <Link
          to="/admin/partners"
          className="bg-[#1a1c24] hover:bg-[#252830] text-[#c8a96e] px-3 py-2 md:px-4 md:py-2 rounded-xl text-xs md:text-sm flex items-center gap-1 md:gap-2 shadow-lg border border-[#c8a96e]/30"
        >
          👥 <span className="hidden md:inline">Parteneri</span>
        </Link>
      )}

      <button 
        onClick={async () => {
          await supabase.auth.signOut();
          window.location.href = '/auth';
        }}
        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-2 md:px-4 md:py-2 rounded-xl text-xs md:text-sm flex items-center gap-1 md:gap-2 border border-red-500/30"
      >
        <span className="hidden md:inline">Deconectare</span><span className="md:hidden">🚪</span>
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

        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/admin/partners" element={<ProtectedRoute><PartnerManagement /></ProtectedRoute>} />

            {/* Configuratoare — lazy loaded */}
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
        </Suspense>
      </AppErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
