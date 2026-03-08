import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, AlertCircle, Loader2, Activity } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const LoginPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm]                 = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]               = useState('')
  const [loading, setLoading]           = useState(false)

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.password) { setError('Please fill in all fields.'); return }
    setLoading(true); setError('')
    try {
      await login(form.username, form.password)
      const stored = JSON.parse(atob(localStorage.getItem('dermassist_token').split('.')[1]))
      if (stored.role === 'doctor') navigate('/doctor/dashboard')
      else if (stored.role === 'admin') navigate('/admin')
      else navigate('/')
    } catch (err) {
      setError(err?.response?.data?.detail || 'Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>

      {/* Logo */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)' }}>
          <Activity className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">Welcome back</h1>
        <p className="text-slate-400 mt-1 text-sm">Sign in to your DermAssist AI account</p>
      </motion.div>

      {/* Card */}
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full max-w-md rounded-2xl p-8"
        style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 rounded-xl text-sm font-medium mb-6"
            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Username */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Username or Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text" name="username" value={form.username}
                onChange={handleChange}
                placeholder="Enter your username or email"
                autoComplete="username"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm font-medium outline-none transition-all placeholder-slate-600 text-white"
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                onFocus={e => e.target.style.border = '1px solid rgba(59,130,246,0.6)'}
                onBlur={e => e.target.style.border = '1px solid rgba(255,255,255,0.1)'}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-slate-300">Password</label>
              <Link to="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'} name="password" value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="w-full pl-11 pr-12 py-3.5 rounded-xl text-sm font-medium outline-none transition-all placeholder-slate-600 text-white"
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                onFocus={e => e.target.style.border = '1px solid rgba(59,130,246,0.6)'}
                onBlur={e => e.target.style.border = '1px solid rgba(255,255,255,0.1)'}
              />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-white font-bold text-sm
                       disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 mt-2"
            style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)', boxShadow: '0 6px 20px rgba(59,130,246,0.35)' }}
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
              : <><span>✦</span> Sign In</>
            }
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 text-slate-500 font-medium"
              style={{ background: 'rgba(30,41,59,0.8)' }}>
              Don't have an account?
            </span>
          </div>
        </div>

        <Link to="/welcome"
          className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl font-bold text-sm transition-all duration-200 text-slate-300 hover:text-white"
          style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
        >
          Create Free Account
        </Link>
      </motion.div>

      {/* Bottom badges */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="flex items-center justify-center gap-6 mt-6">
        {[['🔒', 'Secure Login'], ['🏥', 'Medical Grade'], ['⚡', 'Instant Access']].map(([icon, text]) => (
          <div key={text} className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span>{icon}</span>{text}
          </div>
        ))}
      </motion.div>

    </div>
  )
}

export default LoginPage