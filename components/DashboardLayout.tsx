import React, { useContext, useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { LayoutDashboard, Package, Upload, LogOut, Box, CheckCircle2, AlertTriangle, FileCode, ChevronLeft, ChevronRight, Moon, Sun } from 'lucide-react';

const DashboardLayout: React.FC = () => {
  const { auth, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Estado do Dark Mode (Inicializado do LocalStorage)
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // Novo estado para guardar os números que vêm do servidor
  const [stats, setStats] = useState({ ok: 0, review: 0 });

  // Sincroniza a classe 'dark' no HTML e salva no LocalStorage
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Busca os dados no servidor ao carregar a página
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:5000/inventory');
        if (response.ok) {
          const data = await response.json();
          const okCount = data.filter((item: any) => item.status === 'INVENTARIADO').length;
          const reviewCount = data.filter((item: any) => item.status === 'REVISAO').length;
          setStats({ ok: okCount, review: reviewCount });
        }
      } catch (error) {
        console.error("Ainda não consegui conectar ao backend para pegar stats:", error);
      }
    };

    fetchStats();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive
      ? 'bg-primary-50 text-primary-600 border-r-4 border-primary dark:bg-gray-800 dark:text-primary-400'
      : 'text-gray-600 hover:bg-gray-50 hover:text-primary dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-primary-400'
    } ${!isSidebarOpen ? 'justify-center px-2' : ''}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors duration-300">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} h-screen bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex-shrink-0 fixed inset-y-0 left-0 z-10 flex flex-col shadow-sm transition-all duration-300`}>
        <div className={`p-4 border-b border-gray-100 dark:border-gray-800 flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'} h-16`}>
          {/* Lógica de Troca de Logo */}
          {isSidebarOpen ? (
            <img
              src={darkMode ? "assets/Logo-prosolus-branco.png" : "assets/ProSolus_logo.png"}
              alt="Logo"
              className="h-10 object-contain"
            />
          ) : (
            <img
              src={darkMode ? "assets/Logo-prosolus-branco-menor.png" : "assets/Ícone Pro Solus.png"}
              alt="Logo"
              className="w-8 h-8 object-contain"
            />
          )}

          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors ${!isSidebarOpen && 'hidden group-hover:block absolute -right-3 top-6 shadow-md border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900'}`}>
            {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {!isSidebarOpen && (
          <button onClick={() => setIsSidebarOpen(true)} className="absolute -right-3 top-6 p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm text-gray-500 dark:text-gray-400 hover:text-primary z-50">
            <ChevronRight className="w-3 h-3" />
          </button>
        )}

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto overflow-x-hidden">
          <NavLink to="/inventory" className={navClass} title={!isSidebarOpen ? "Contagem & Itens" : ""}>
            <Package className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span>Contagem & Itens</span>}
          </NavLink>
          <NavLink to="/import" className={navClass} title={!isSidebarOpen ? "Importar / Exportar" : ""}>
            <Upload className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span>Importar / Exportar</span>}
          </NavLink>

          <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
            {isSidebarOpen && (
              <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 animated-fade-in">
                Status do Inventário
              </p>
            )}
            <div className={`space-y-3 ${!isSidebarOpen ? 'px-0' : 'px-4'}`}>
              <div className={`flex items-center ${isSidebarOpen ? 'justify-between p-2' : 'justify-center p-2'} bg-primary-50 dark:bg-teal-900/20 rounded-lg border border-primary-100 dark:border-teal-900`} title="Finalizados">
                <div className="flex items-center gap-2 text-primary-700 dark:text-teal-400 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4 text-primary-600 dark:text-teal-500 flex-shrink-0" /> {isSidebarOpen && 'Finalizados'}
                </div>
                {isSidebarOpen && <span className="font-bold text-primary-700 dark:text-teal-400">{stats.ok}</span>}
              </div>
              <div className={`flex items-center ${isSidebarOpen ? 'justify-between p-2' : 'justify-center p-2'} bg-accent-50 dark:bg-orange-900/20 rounded-lg border border-accent-100 dark:border-orange-900`} title="Para Revisão">
                <div className="flex items-center gap-2 text-accent-500 dark:text-orange-400 text-sm font-medium">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {isSidebarOpen && 'Para Revisão'}
                </div>
                {isSidebarOpen && <span className="font-bold text-accent-500 dark:text-orange-400">{stats.review}</span>}
              </div>
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleDarkMode}
            className={`w-full flex items-center gap-2 px-4 py-2 mb-3 text-sm font-medium rounded-md transition-colors ${darkMode
              ? 'bg-gray-700 text-yellow-300 hover:bg-gray-600'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              } ${!isSidebarOpen ? 'justify-center px-0' : ''}`}
            title={isSidebarOpen ? "Alternar Tema" : "Alternar Tema"}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {isSidebarOpen && <span>{darkMode ? 'Modo Claro' : 'Modo Escuro'}</span>}
          </button>

          <div className={`flex items-center gap-3 mb-4 ${!isSidebarOpen && 'justify-center'}`}>
            <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-gray-700 flex items-center justify-center text-primary dark:text-primary-400 font-bold border border-primary-100 dark:border-gray-600 flex-shrink-0">
              {auth.user?.name ? auth.user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{auth.user?.name || 'Usuário'}</p>
                <div className="flex flex-col gap-0.5 mt-0.5">
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded w-fit ${auth.user?.role === 'leader' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                    {auth.user?.role === 'leader' ? 'Líder' : 'Digitador'}
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate" title={auth.user?.sector}>
                    {auth.user?.sector || 'Sem Setor'}
                  </span>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-red-600 dark:hover:text-red-400 rounded-md transition-colors ${!isSidebarOpen ? 'justify-center' : ''}`}
            title={!isSidebarOpen ? "Sair" : ""}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {isSidebarOpen && "Sair"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 p-8 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;