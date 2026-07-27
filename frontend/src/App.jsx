import React, { useState } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

export default function App() {
  // Simple state routing: 'login' | 'register' | 'dashboard'
  const [page, setPage] = useState('login');

  return (
    <div className="min-h-screen bg-[#050508] relative overflow-hidden flex flex-col justify-between">
      {/* Decorative Neon Blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#007bff]/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#00d2ff]/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Main Content Area */}
      <main className="flex-grow flex items-center justify-center py-10 px-4 relative z-10">
        {page === 'login' && <Login navigate={setPage} />}
        {page === 'register' && <Register navigate={setPage} />}
        {page === 'dashboard' && <Dashboard navigate={setPage} />}
      </main>

      {/* WhatsApp Support Fixed Button */}
      <a
        href="https://wa.me/5500000000000?text=Preciso%20de%20ajuda%20no%20sistema!"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 font-bold text-sm tracking-wide hover:scale-105 transition z-50 uppercase"
      >
        <i className="fab fa-whatsapp text-xl"></i> Precisa de ajuda?
      </a>
    </div>
  );
}
