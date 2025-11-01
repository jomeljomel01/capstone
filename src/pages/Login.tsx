import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

// Declare electron API types
declare global {
  interface Window {
    electronAPI: {
      loginAdmin: (email: string, password: string) => Promise<{ success: boolean; user?: { id: number; email: string }; error?: string }>;
    };
  }
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await window.electronAPI.loginAdmin(email, password);
      if (!result.success) {
        setError(result.error || 'Login failed');
      } else {
        // Login successful - set user in context and redirect
        console.log('Login successful:', result.user);
        signIn(result.user!, keepLoggedIn);
        navigate('/'); // Use React Router navigation
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 to-blue-100">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex max-w-5xl w-full">
        <div className="w-1/2 p-12">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
                K
              </div>
              <h1 className="text-3xl font-bold text-gray-800">KVSHS Admin Login</h1>
            </div>
            <p className="text-gray-600">Login with your admin credentials.</p>
          </div>

          {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Your E-mail</label>
              <input
                type="email"
                placeholder="programmer.ferg@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="keepLoggedIn"
                checked={keepLoggedIn}
                onChange={(e) => setKeepLoggedIn(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="keepLoggedIn" className="ml-2 text-gray-700">
                Keep me logged in
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>

            <div className="text-center">
              <Link to="/forgot-password" className="text-blue-600 hover:text-blue-700 text-sm">
                Forgot your password?
              </Link>
            </div>
          </form>
        </div>

        <div className="w-1/2 bg-gradient-to-br from-blue-500 to-blue-700 p-12 flex flex-col items-center justify-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-transparent"></div>

          <div className="relative z-10 text-center mb-8">
            <div className="mb-12">
              <svg className="w-64 h-64 mx-auto" viewBox="0 0 200 200" fill="none">
                <rect x="50" y="80" width="100" height="100" fill="white" opacity="0.9" rx="4"/>
                <rect x="65" y="95" width="20" height="25" fill="#3B82F6" opacity="0.8"/>
                <rect x="90" y="95" width="20" height="25" fill="#3B82F6" opacity="0.8"/>
                <rect x="115" y="95" width="20" height="25" fill="#3B82F6" opacity="0.8"/>
                <rect x="75" y="130" width="50" height="50" fill="#1E40AF" opacity="0.9"/>
                <path d="M50 80 L100 40 L150 80" fill="#93C5FD" opacity="0.9"/>
              </svg>
            </div>

            <p className="text-xl mb-2">Don't have an account yet?</p>
            <p className="text-sm opacity-90">Contact us at <span className="font-semibold">jomelmarino42@gmail.com</span> and</p>
            <p className="text-sm opacity-90">we will take care of everything!!</p>
          </div>
        </div>
      </div>
    </div>
  );
}