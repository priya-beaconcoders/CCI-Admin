

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginService } from "../services/authServices";
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  Clock,
  CheckCircle,
  Building2, // Fallback if logo fails
  X
} from "lucide-react";
import logo from "../assets/logo-india.png"; // Importing the logo

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please enter your username and password");
      return;
    }

    try {
      setLoading(true);
      await loginService({ username, password });
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
        "Invalid login credentials. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-orange-50 via-white to-blue-50">
      {/* Left Side - Brand & Info */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden bg-gradient-to-br from-orange-600 via-orange-500 to-emerald-600 shadow-2xl z-10">

        {/* Abstract Shapes/Tricolor Feel */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-white blur-[120px]"></div>
          <div className="absolute bottom-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-emerald-800 blur-[100px]"></div>
        </div>

        <div className="relative z-20 text-center max-w-lg mx-auto">
          {/* Main Logo - Much Larger */}
          <div className="mb-12 inline-block p-8 bg-white rounded-[3rem] shadow-2xl">
            <img src={logo} alt="Constitution Club Logo" className="w-48 h-48 object-contain" />
          </div>

          <h1 className="text-5xl font-extrabold text-white mb-6 tracking-tight leading-tight drop-shadow-lg">
            Constitution Club <br />
            <span className="text-orange-100 text-2xl font-bold uppercase tracking-[0.2em] mt-3 block">Of India</span>
          </h1>

          <div className="w-32 h-1.5 bg-gradient-to-r from-orange-300 via-white to-emerald-300 mx-auto rounded-full mb-10 shadow-lg"></div>

          <p className="text-xl text-white font-medium leading-relaxed mb-12 drop-shadow-md opacity-95">
            The Centralized Digital Hub for <br /> Elite Club Management & Administration
          </p>

          {/* Feature Badges - Tricolor accents */}
          <div className="flex justify-center gap-4 flex-wrap">
            <div className="px-6 py-3 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-full border border-orange-200/30 backdrop-blur-md text-sm text-white font-bold flex items-center gap-2 shadow-lg">
              <ShieldCheck className="w-4 h-4 text-orange-200" /> Secure Portal
            </div>
            <div className="px-6 py-3 bg-gradient-to-br from-white/10 to-white/5 rounded-full border border-white/20 backdrop-blur-md text-sm text-white font-bold flex items-center gap-2 shadow-lg">
              <TrendingUp className="w-4 h-4 text-white" /> Live Analytics
            </div>
            <div className="px-6 py-3 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-full border border-emerald-200/30 backdrop-blur-md text-sm text-white font-bold flex items-center gap-2 shadow-lg">
              <Clock className="w-4 h-4 text-emerald-200" /> 24/7 Access
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="absolute bottom-8 text-xs text-white/60 uppercase tracking-widest font-medium">
          © {new Date().getFullYear()} Official Management Portal
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 lg:p-16 bg-white relative">
        {/* Decorative background elements for right side */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

        <div className="max-w-md mx-auto w-full relative z-10">
          {/* Mobile Header */}
          <div className="lg:hidden mb-10 text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="p-3 bg-white rounded-xl shadow-md border border-gray-100">
                <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-bold text-gray-900 leading-none">Constitution Club</h1>
                <p className="text-sm font-medium text-orange-600">Of India</p>
              </div>
            </div>
          </div>

          {/* Form Container */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 lg:p-10 border border-gray-100">
            {/* Header */}
            <div className="mb-8">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 border border-blue-100 mb-4">
                <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                <span className="text-xs font-semibold text-blue-700 tracking-wide uppercase">
                  Admin Portal
                </span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome Back
              </h2>
              <p className="text-gray-500 text-sm">
                Please enter your credentials to access the dashboard.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Username Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800 ml-1">
                  Username
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors">
                    <User className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 
                             focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
                             transition-all duration-200 bg-gray-50/50 hover:bg-gray-50 text-gray-900
                             placeholder-gray-400 font-medium"
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="block text-sm font-semibold text-gray-800">
                    Password
                  </label>
                  <a
                    href="#"
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Forgot Password?
                  </a>
                </div>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <Lock className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-gray-200 
                             focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
                             transition-all duration-200 bg-gray-50/50 hover:bg-gray-50 text-gray-900
                             placeholder-gray-400 font-medium"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-500" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center ml-1">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 
                           border-gray-300 cursor-pointer"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-600 cursor-pointer font-medium">
                  Remember me for 30 days
                </label>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 animate-shake">
                  <div className="p-1.5 rounded-lg bg-red-100/50">
                    <X className="w-4 h-4 text-red-600" />
                  </div>
                  <p className="text-sm font-medium text-red-700 leading-tight">
                    {error}
                  </p>
                </div>
              )}

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-xl font-bold text-white text-base
                  transition-all duration-300 transform hover:scale-[1.02]
                  ${loading
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/30"
                  } active:scale-[0.99] flex items-center justify-center space-x-2`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ShieldCheck className="w-5 h-5 opacity-90" />
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 bg-gray-50 py-2 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="font-medium">Secure SSL Connection</span>
                </div>
                <p className="text-xs text-gray-400">
                  By signing in, you agree to our Terms of Service and Privacy Policy.
                </p>
                <p className="text-xs text-gray-400">
                  Developed and managed by Beacon Coders
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}