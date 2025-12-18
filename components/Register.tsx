import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { Lock, Mail, User, ArrowRight, Loader2, Eye, EyeOff, Briefcase, Users } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [role, setRole] = useState('user');
  const [sector, setSector] = useState('SOLDA');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, sector }),
      });

      if (response.ok) {
        const newUser = await response.json();
        login(newUser);
        navigate('/inventory');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erro ao criar conta. Tente outro e-mail.');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center p-4 relative"
      style={{ backgroundImage: "url('assets/green-vegetation-field-crop-plant-sky-1609434-pxhere.com.jpg')" }}
    >
      {/* Logo no canto superior esquerdo */}
      <img src="assets/ProSolus_logo.png" alt="Pro Solus" className="absolute top-6 left-6 h-12 object-contain" />

      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Criar Conta</h1>
          <p className="text-gray-500 mt-2">Comece a usar o Inventário ProSolus agora</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
            <div className="relative">
              <input
                type="text"
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="Seu Nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <User className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <div className="relative">
              <input
                type="email"
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Novos Campos: Setor e Cargo (Lado a Lado) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Setor</label>
              <div className="relative">
                <select
                  className="w-full pl-10 pr-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none appearance-none bg-white text-sm"
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                >
                  <option value="SOLDA">Solda</option>
                  <option value="PINTURA">Pintura</option>
                  <option value="MONTAGEM">Montagem</option>
                  <option value="ALMOXARIFADO">Almoxarifado</option>
                  <option value="EXPEDICAO">Expedição</option>
                </select>
                <Briefcase className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
              <div className="relative">
                <select
                  className="w-full pl-10 pr-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none appearance-none bg-white text-sm"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="user">Digitador</option>
                  <option value="leader">Líder</option>
                </select>
                <Users className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          {/* Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 mt-6 transition-all disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Cadastrar <ArrowRight className="w-5 h-5" /></>}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Já tem uma conta?{' '}
          <Link to="/login" className="text-primary hover:text-primary-700 font-medium">
            Fazer Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;