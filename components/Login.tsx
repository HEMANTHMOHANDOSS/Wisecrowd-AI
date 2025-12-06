
import React, { useState } from 'react';
import { User, Lock, ShieldCheck, ArrowRight, Mail, UserPlus, LogIn } from 'lucide-react';

interface LoginProps {
  onLogin: (username: string, role: 'admin' | 'viewer') => void;
  onRegister: (username: string, email: string, password: string) => boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    setTimeout(() => {
      if (isRegistering) {
        if (!username || !password || !email) {
           setError("All fields are required");
           setIsLoading(false);
           return;
        }
        const success = onRegister(username, email, password);
        if (success) {
          setSuccessMsg("Account created! Please log in.");
          setIsRegistering(false);
          setPassword('');
        } else {
          setError("Username already exists.");
        }
        setIsLoading(false);
      } else {
        // Login Logic
        // In a real app, this would validate against the backend
        // Here we validate against the mock users passed via props (handled in App.tsx wrapper or directly here if passed)
        // For this mock, we rely on App.tsx to handle the validation if we pass credentials up, 
        // OR we just simulate the check here if we want to keep it simple for the requested 'admin/admin' 'user/user'
        
        // Simulating the check here for the hardcoded values as requested in prompt, 
        // BUT App.tsx also has the dynamic user list. 
        // To bridge this, we will pass the credentials up to App.tsx via onLogin.
        
        // Note: The App.tsx implementation will actually do the checking.
        // We just pass the data up.
        
        onLogin(username, password as any); // Passing password to App to validate against user list
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse-fast"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px]"></div>

      <div className="glass p-10 rounded-2xl w-full max-w-md relative z-10 border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4 group">
            <ShieldCheck className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">WiseCrowd AI</h1>
          <p className="text-blue-400 text-xs font-bold uppercase tracking-wider mt-1">Powered by WiseCrew Solutions</p>
        </div>

        <div className="flex bg-slate-900/50 p-1 rounded-xl mb-6 border border-white/5">
           <button 
             onClick={() => { setIsRegistering(false); setError(''); }}
             className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all ${!isRegistering ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
           >
             Login
           </button>
           <button 
             onClick={() => { setIsRegistering(true); setError(''); }}
             className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all ${isRegistering ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
           >
             Sign Up
           </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Username</label>
            <div className="relative group">
              <User className="absolute left-3 top-3 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                placeholder="Enter Username"
              />
            </div>
          </div>

          {isRegistering && (
            <div className="space-y-1.5 animate-in slide-in-from-top-2 fade-in">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center font-medium animate-in shake">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-xs text-center font-medium animate-in fade-in">
              {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : isRegistering ? (
              <>
                Create Account <UserPlus className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            ) : (
              <>
                Secure Access <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-slate-600">
            WiseCrowd AI • Powered by WiseCrew Solutions • v3.0.0
          </p>
          {!isRegistering && (
             <div className="mt-4 p-3 bg-slate-900/30 rounded border border-white/5 text-[10px] text-slate-500">
                <p><strong>Demo Credentials:</strong></p>
                <p>Admin: admin / admin123</p>
                <p>User: user / user123</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
