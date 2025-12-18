import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthState, User } from './src/types';
import Login from './components/Login';
import Register from './components/Register';
import DashboardLayout from './components/DashboardLayout';
import InventoryList from './components/InventoryList';
import BulkImport from './components/BulkImport';
import ArchitectureDocs from './components/ArchitectureDocs';
import { Loader2 } from 'lucide-react';

export const AuthContext = React.createContext<{
  auth: AuthState;
  login: (user: User) => void;
  logout: () => void;
}>({
  auth: { user: null, isAuthenticated: false },
  login: () => { },
  logout: () => { },
});

const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { auth } = React.useContext(AuthContext);
  const location = useLocation();

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const savedUser = localStorage.getItem('inventory_user');
      if (savedUser) {
        setAuth({
          user: JSON.parse(savedUser),
          isAuthenticated: true
        });
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = (user: User) => {
    localStorage.setItem('inventory_user', JSON.stringify(user));
    setAuth({ user, isAuthenticated: true });
  };

  const logout = () => {
    localStorage.removeItem('inventory_user');
    setAuth({ user: null, isAuthenticated: false });
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/inventory" replace />} />
            <Route path="inventory" element={<InventoryList />} />
            <Route path="import" element={<BulkImport />} />
            <Route path="architecture" element={<ArchitectureDocs />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthContext.Provider>
  );
};

export default App;