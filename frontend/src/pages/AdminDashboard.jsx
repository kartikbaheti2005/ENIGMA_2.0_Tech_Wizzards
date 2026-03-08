import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, ScanLine, CalendarCheck, LogOut,
  CheckCircle, XCircle, Clock, AlertTriangle, Activity,
  Search, ChevronDown, RefreshCw, UserCheck, UserX,
  MessageSquare, TrendingUp, Eye, Shield, Loader2,
  Star, Phone, Mail, ClipboardList, FileText, Stethoscope, GraduationCap, Building2, X as XIcon, KeyRound
} from 'lucide-react'

const Building2Icon = () => <Building2 className="w-3 h-3" />
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = 'http://localhost:8000'

// ── Password Reset Tab ────────────────────────────────────────────────────────
const PasswordResetTab = ({ token }) => {
  const [type,    setType]    = useState('user')
  const [search,  setSearch]  = useState('')
  const [newPw,   setNewPw]   = useState('')
  const [showPw,  setShowPw]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)
  const authHeader = { Authorization: `Bearer ${token}` }

  const reset = async () => {
    if (!search.trim()) { setResult({ ok: false, message: 'Enter a username, email, or ID' }); return }
    if (newPw.length < 6) { setResult({ ok: false, message: 'New password must be at least 6 characters' }); return }
    setLoading(true); setResult(null)
    try {
      const isId = /^\d+$/.test(search.trim())
      const body = type === 'user'
        ? { ...(isId ? { user_id: Number(search) } : { username: search }), new_password: newPw }
        : { ...(isId ? { doctor_id: Number(search) } : { email: search }), new_password: newPw }
      const url = type === 'user' ? `${API}/admin/users/reset-password` : `${API}/admin/doctors/reset-password`
      const r = await axios.post(url, body, { headers: authHeader })
      setResult({ ok: true, message: r.data.message })
      setSearch(''); setNewPw('')
    } catch (e) {
      setResult({ ok: false, message: e?.response?.data?.detail || 'Reset failed' })
    }
    setLoading(false)
  }

  return (
    <motion.div key="passwords" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="max-w-lg mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">Reset Password</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Manually reset a user or doctor's password</p>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl px-4 py-3 mb-5 text-xs text-amber-700 dark:text-amber-400">
          <strong>⚠️ Note:</strong> Passwords are bcrypt hashes — they <strong>cannot be decoded</strong> back to plain text (this is by design for security). This tool lets you <strong>set a brand new password</strong> for any account.
        </div>

        <div className="flex gap-2 mb-5">
          {['user', 'doctor'].map(t => (
            <button key={t} onClick={() => { setType(t); setResult(null) }}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition border ${type === t ? 'bg-violet-600 text-white border-violet-600' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}>
              {t === 'user' ? '👤 Patient' : '🩺 Doctor'}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-blue-200/80 mb-1.5">
              {type === 'user' ? 'Username or Email' : 'Doctor Email or ID'}
            </label>
            <input value={search} onChange={e => { setSearch(e.target.value); setResult(null) }}
              placeholder={type === 'user' ? 'e.g. kartik or kartik@gmail.com' : 'e.g. doctor@clinic.com or 5'}
              className="w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none transition bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:bg-[#070e1c] dark:border-[#1a3260] dark:text-[#e8f0ff] dark:placeholder-[#2d4a78] dark:focus:bg-[#0d1f3c]" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-blue-200/80 mb-1.5">New Password</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={newPw}
                onChange={e => { setNewPw(e.target.value); setResult(null) }}
                placeholder="Min 6 characters"
                className="w-full px-4 py-3 pr-10 rounded-xl border text-sm font-medium outline-none transition bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:bg-[#070e1c] dark:border-[#1a3260] dark:text-[#e8f0ff] dark:placeholder-[#2d4a78] dark:focus:bg-[#0d1f3c]" />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-violet-500 transition">
                {showPw
                  ? <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
            {newPw.length > 0 && newPw.length < 6 && <p className="text-xs text-red-500 mt-1">Too short — min 6 characters</p>}
            {newPw.length >= 6 && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">✓ Good length</p>}
          </div>

          {result && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium border ${result.ok
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/40'
                : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/40'}`}>
              {result.ok ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
              {result.message}
            </motion.div>
          )}

          <button onClick={reset} disabled={loading}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', boxShadow: '0 6px 20px rgba(124,58,237,0.3)' }}>
            {loading
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Resetting...</>
              : <><KeyRound className="w-4 h-4" /> Reset Password</>}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ── Risk badge ────────────────────────────────────────────────────────────────
const RiskBadge = ({ risk }) => {
  const styles = {
    'High Risk':     'bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400',
    'Moderate Risk': 'bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400',
    'Low Risk':      'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[risk] || 'bg-gray-100 text-gray-600'}`}>
      {risk}
    </span>
  )
}

// ── Appointment status badge ──────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = {
    pending:   { cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',   icon: Clock },
    accepted:  { cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle },
    rejected:  { cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',           icon: XCircle },
    completed: { cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',        icon: CheckCircle },
    cancelled: { cls: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',           icon: XCircle },
  }
  const { cls, icon: Icon } = cfg[status] || cfg.pending
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium capitalize ${cls}`}>
      <Icon className="w-3 h-3" />{status}
    </span>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  </motion.div>
)

// ── Notes modal ───────────────────────────────────────────────────────────────
const NotesModal = ({ apt, token, onClose, onSaved }) => {
  const [notes, setNotes] = useState(apt.notes || '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await axios.post(`${API}/admin/appointments/${apt.id}/notes`,
        { notes },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      onSaved(apt.id, notes)
      onClose()
    } catch {
      alert('Failed to save notes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Doctor Notes</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Appointment #{apt.id} — {apt.patient_name}
        </p>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={5}
          placeholder="Add notes for the patient..."
          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            Cancel
          </button>
          <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Notes
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
const AdminDashboard = () => {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats]         = useState(null)
  const [users, setUsers]         = useState([])
  const [scans, setScans]         = useState([])
  const [appointments, setAppointments] = useState([])
  const [doctors, setDoctors]     = useState([])
  const [doctorStatusFilter, setDoctorStatusFilter] = useState('all')
  const [loading, setLoading]     = useState(false)
  const [search, setSearch]       = useState('')
  const [riskFilter, setRiskFilter]     = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [notesModal, setNotesModal]     = useState(null)
  const [actionLoading, setActionLoading] = useState({})
  const [doctorDetailModal, setDoctorDetailModal] = useState(null)

  // Guard: only admin
  useEffect(() => {
    if (user && user.role !== 'admin') navigate('/')
  }, [user, navigate])

  const authHeader = { Authorization: `Bearer ${token}` }

  const fetchStats = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/admin/stats`, { headers: authHeader })
      setStats(r.data)
    } catch { /* ignore */ }
  }, [token])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const r = await axios.get(`${API}/admin/users?limit=100&search=${search}`, { headers: authHeader })
      setUsers(r.data.users || [])
    } catch { /* ignore */ }
    setLoading(false)
  }, [token, search])

  const fetchScans = useCallback(async () => {
    setLoading(true)
    try {
      const rf = riskFilter !== 'all' ? `&risk=${riskFilter}` : ''
      const r = await axios.get(`${API}/admin/scans?limit=100${rf}`, { headers: authHeader })
      setScans(r.data.scans || [])
    } catch { /* ignore */ }
    setLoading(false)
  }, [token, riskFilter])

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    try {
      const sf = statusFilter !== 'all' ? `?status=${statusFilter}` : ''
      const r = await axios.get(`${API}/admin/appointments${sf}&limit=100`, { headers: authHeader })
      setAppointments(r.data.appointments || [])
    } catch { /* ignore */ }
    setLoading(false)
  }, [token, statusFilter])

  const fetchDoctors = useCallback(async () => {
    setLoading(true)
    try {
      const sf = doctorStatusFilter !== 'all' ? `?status=${doctorStatusFilter}` : ''
      const r = await axios.get(`${API}/admin/doctors${sf}`, { headers: authHeader })
      setDoctors(r.data.doctors || [])
    } catch { /* ignore */ }
    setLoading(false)
  }, [token, doctorStatusFilter])

  const approveDoctor = async (docId) => {
    setActionLoading(p => ({ ...p, [`doc_${docId}`]: true }))
    try {
      await axios.put(`${API}/admin/doctors/${docId}/approve`, {}, { headers: authHeader })
      setDoctors(prev => prev.map(d => d.id === docId ? { ...d, status: 'approved', is_active: true } : d))
    } catch { alert('Failed to approve doctor') }
    setActionLoading(p => ({ ...p, [`doc_${docId}`]: false }))
  }

  const rejectDoctor = async (docId, notes = '') => {
    setActionLoading(p => ({ ...p, [`doc_rej_${docId}`]: true }))
    try {
      await axios.put(`${API}/admin/doctors/${docId}/reject?notes=${encodeURIComponent(notes)}`, {}, { headers: authHeader })
      setDoctors(prev => prev.map(d => d.id === docId ? { ...d, status: 'rejected', is_active: false } : d))
    } catch { alert('Failed to reject doctor') }
    setActionLoading(p => ({ ...p, [`doc_rej_${docId}`]: false }))
  }

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    if (activeTab === 'users')        fetchUsers()
    if (activeTab === 'scans')        fetchScans()
    if (activeTab === 'appointments') fetchAppointments()
    if (activeTab === 'doctors')      fetchDoctors()
  }, [activeTab, fetchUsers, fetchScans, fetchAppointments])

  const toggleUser = async (userId, isActive) => {
    setActionLoading(p => ({ ...p, [userId]: true }))
    try {
      await axios.put(`${API}/admin/users/${userId}/activate`, {}, { headers: authHeader })
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !isActive } : u))
    } catch { /* ignore */ }
    setActionLoading(p => ({ ...p, [userId]: false }))
  }

  const updateAptStatus = async (aptId, status) => {
    setActionLoading(p => ({ ...p, [aptId]: true }))
    try {
      await axios.put(`${API}/admin/appointments/${aptId}/status`, { status }, { headers: authHeader })
      setAppointments(prev => prev.map(a => a.id === aptId ? { ...a, status } : a))
    } catch { /* ignore */ }
    setActionLoading(p => ({ ...p, [aptId]: false }))
  }

  const tabs = [
    { id: 'overview',      label: 'Overview',      icon: LayoutDashboard },
    { id: 'users',         label: 'Users',         icon: Users },
    { id: 'scans',         label: 'Scans',         icon: ScanLine },
    { id: 'appointments',  label: 'Appointments',  icon: CalendarCheck },
    { id: 'doctors',       label: 'Doctors',       icon: Stethoscope },
    { id: 'passwords',     label: 'Passwords',     icon: KeyRound },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-none">Admin Panel</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">DermAssist AI</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                Welcome, <strong className="text-gray-900 dark:text-white">{user?.full_name}</strong>
              </span>
              <button
                onClick={() => { logout(); navigate('/login') }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 overflow-x-auto pb-px">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  activeTab === id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* ── OVERVIEW ─────────────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
        {activeTab === 'overview' && stats && (
          <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 mb-6">
              <StatCard icon={Users}         label="Total Users"         value={stats.total_users}          sub={`${stats.active_users} active`}        color="bg-blue-500"    delay={0} />
              <StatCard icon={ScanLine}      label="Total Scans"         value={stats.total_scans}          sub={`${stats.recent_scans_7d} this week`}  color="bg-purple-500"  delay={0.05} />
              <StatCard icon={AlertTriangle} label="High Risk Scans"     value={stats.high_risk_scans}      sub="Need attention"                        color="bg-red-500"     delay={0.1} />
              <StatCard icon={CalendarCheck} label="Total Appointments"  value={stats.total_appointments}   sub=""                                      color="bg-cyan-500"    delay={0.15} />
              <StatCard icon={Clock}         label="Pending Appointments" value={stats.pending_appointments} sub="Awaiting review"                       color="bg-amber-500"   delay={0.2} />
              <StatCard icon={TrendingUp}    label="Active Users"        value={stats.active_users}         sub={`of ${stats.total_users} total`}       color="bg-emerald-500" delay={0.25} />
            </div>

            {/* Quick actions */}
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { label: 'Review Pending Appointments', desc: `${stats.pending_appointments} waiting for response`, action: () => setActiveTab('appointments'), color: 'border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800/50', btn: 'Review' },
                { label: 'View High Risk Scans', desc: `${stats.high_risk_scans} high risk detections`, action: () => { setRiskFilter('high'); setActiveTab('scans') }, color: 'border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800/50', btn: 'View Scans' },
                { label: 'Manage Users', desc: `${stats.total_users} registered patients`, action: () => setActiveTab('users'), color: 'border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800/50', btn: 'Manage' },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }}
                  className={`p-4 rounded-2xl border ${item.color}`}>
                  <p className="font-semibold text-gray-800 dark:text-white text-sm">{item.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-3">{item.desc}</p>
                  <button onClick={item.action} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">{item.btn} →</button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── USERS ────────────────────────────────────────────────────────────── */}
        {activeTab === 'users' && (
          <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name, email, username..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button onClick={fetchUsers} className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                      <tr>
                        {['Name', 'Email', 'Role', 'Scans', 'Status', 'Joined', 'Action'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold flex-shrink-0">
                                {u.full_name?.charAt(0)?.toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{u.full_name}</p>
                                <p className="text-xs text-gray-400">@{u.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{u.email}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-medium">{u.scan_count}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                              {u.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                            {new Date(u.created_at).toLocaleDateString('en-IN')}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleUser(u.id, u.is_active)}
                              disabled={actionLoading[u.id]}
                              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition disabled:opacity-50 ${
                                u.is_active
                                  ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400'
                                  : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400'
                              }`}
                            >
                              {actionLoading[u.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : u.is_active ? <><UserX className="w-3 h-3" /> Deactivate</> : <><UserCheck className="w-3 h-3" /> Activate</>}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {users.length === 0 && !loading && (
                    <p className="text-center text-gray-400 py-12">No users found</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── SCANS ────────────────────────────────────────────────────────────── */}
        {activeTab === 'scans' && (
          <motion.div key="scans" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex gap-3 mb-4 flex-wrap">
              {['all', 'high', 'moderate', 'low'].map(f => (
                <button key={f} onClick={() => setRiskFilter(f)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition capitalize ${
                    riskFilter === f ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {f === 'all' ? 'All Scans' : `${f.charAt(0).toUpperCase() + f.slice(1)} Risk`}
                </button>
              ))}
              <button onClick={fetchScans} className="ml-auto px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                      <tr>
                        {['#', 'Patient', 'Diagnosis', 'Risk', 'Confidence', 'Date'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                      {scans.map(s => (
                        <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                          <td className="px-4 py-3 text-gray-400 text-xs">#{s.id}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900 dark:text-white">{s.user_name}</p>
                            <p className="text-xs text-gray-400">{s.user_email}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-800 dark:text-gray-200">{s.diagnosis_name}</p>
                            <p className="text-xs text-gray-400 uppercase">{s.predicted_label}</p>
                          </td>
                          <td className="px-4 py-3"><RiskBadge risk={s.risk_level} /></td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full w-16">
                                <div className={`h-full rounded-full ${s.risk_level === 'High Risk' ? 'bg-red-500' : s.risk_level === 'Moderate Risk' ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${(s.confidence_score * 100).toFixed(0)}%` }} />
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{(s.confidence_score * 100).toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                            {new Date(s.created_at).toLocaleDateString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {scans.length === 0 && !loading && (
                    <p className="text-center text-gray-400 py-12">No scans found</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── APPOINTMENTS ─────────────────────────────────────────────────────── */}
        {activeTab === 'appointments' && (
          <motion.div key="appointments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex gap-2 mb-4 flex-wrap">
              {['all', 'pending', 'accepted', 'rejected', 'completed', 'cancelled'].map(f => (
                <button key={f} onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition capitalize ${
                    statusFilter === f ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {f === 'all' ? 'All' : f}
                </button>
              ))}
              <button onClick={fetchAppointments} className="ml-auto px-4 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map(apt => (
                  <motion.div key={apt.id} layout
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap gap-4 justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="text-xs text-gray-400">#{apt.id}</span>
                          <StatusBadge status={apt.status} />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1 text-sm">
                          <div><span className="text-gray-400 text-xs">Patient:</span> <span className="font-medium text-gray-900 dark:text-white">{apt.patient_name}</span></div>
                          <div><span className="text-gray-400 text-xs">Email:</span> <span className="text-gray-600 dark:text-gray-300">{apt.patient_email}</span></div>
                          <div><span className="text-gray-400 text-xs">Doctor:</span> <span className="font-medium text-gray-900 dark:text-white">{apt.doctor_name}</span></div>
                          <div><span className="text-gray-400 text-xs">Specialty:</span> <span className="text-gray-600 dark:text-gray-300">{apt.doctor_specialty}</span></div>
                          <div><span className="text-gray-400 text-xs">Date:</span> <span className="text-gray-700 dark:text-gray-300">{apt.appointment_date}</span></div>
                          <div><span className="text-gray-400 text-xs">Time:</span> <span className="text-gray-700 dark:text-gray-300">{apt.appointment_time}</span></div>
                        </div>
                        {apt.reason && (
                          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Reason:</span> {apt.reason}
                          </p>
                        )}
                        {apt.notes && (
                          <p className="mt-1.5 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg">
                            📋 <strong>Notes:</strong> {apt.notes}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 min-w-fit">
                        <button onClick={() => setNotesModal(apt)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> Notes
                        </button>
                        {apt.status === 'pending' && (
                          <>
                            <button onClick={() => updateAptStatus(apt.id, 'accepted')} disabled={actionLoading[apt.id]}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 transition font-medium disabled:opacity-50"
                            >
                              {actionLoading[apt.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Accept
                            </button>
                            <button onClick={() => updateAptStatus(apt.id, 'rejected')} disabled={actionLoading[apt.id]}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 transition font-medium disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </>
                        )}
                        {apt.status === 'accepted' && (
                          <button onClick={() => updateAptStatus(apt.id, 'completed')} disabled={actionLoading[apt.id]}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 transition font-medium disabled:opacity-50"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Mark Complete
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {appointments.length === 0 && (
                  <div className="text-center py-16 text-gray-400">No appointments found</div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* ── DOCTORS TAB ── */}
        {activeTab === 'doctors' && (
          <motion.div key="doctors" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-emerald-500" /> Doctor Registrations
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                {['all','pending','approved','rejected'].map(s => (
                  <button key={s} onClick={() => setDoctorStatusFilter(s)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium capitalize transition border ${doctorStatusFilter === s ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50'}`}>
                    {s}
                  </button>
                ))}
                <button onClick={fetchDoctors} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 transition">
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-emerald-500" /></div>
            ) : (
              <div className="space-y-3">
                {doctors.map((doc, i) => (
                  <motion.div key={doc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
                    <div className="flex items-start gap-4 flex-wrap">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow">
                        {doc.image_placeholder || doc.name?.slice(0,2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-bold text-gray-900 dark:text-white">{doc.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                            doc.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            doc.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}>{doc.status}</span>
                        </div>
                        <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">{doc.specialty} · {doc.post}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{doc.qualification}</p>
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><Building2Icon /> {doc.clinic}, {doc.city}</span>
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {doc.phone}</span>
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {doc.email}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(doc.specializes_in || []).slice(0,4).map(s => (
                            <span key={s} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg">{s}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <button onClick={() => setDoctorDetailModal(doc)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition font-medium">
                          <Eye className="w-3.5 h-3.5" /> View Details
                        </button>
                        {doc.status === 'pending' && (
                          <div className="flex gap-2">
                            <button onClick={() => approveDoctor(doc.id)} disabled={actionLoading[`doc_${doc.id}`]}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 transition font-medium disabled:opacity-50">
                              {actionLoading[`doc_${doc.id}`] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Approve
                            </button>
                            <button onClick={() => rejectDoctor(doc.id)} disabled={actionLoading[`doc_rej_${doc.id}`]}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 transition font-medium disabled:opacity-50">
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        )}
                        {doc.status === 'approved' && (
                          <button onClick={() => rejectDoctor(doc.id, 'Revoked by admin')} disabled={actionLoading[`doc_rej_${doc.id}`]}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 transition font-medium disabled:opacity-50">
                            <XCircle className="w-3.5 h-3.5" /> Revoke
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {doctors.length === 0 && (
                  <div className="text-center py-16 text-gray-400 flex flex-col items-center gap-3">
                    <Stethoscope className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                    <p>No doctor registrations found</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      {/* Notes modal */}
      <AnimatePresence>
        {notesModal && (
          <NotesModal
            apt={notesModal}
            token={token}
            onClose={() => setNotesModal(null)}
            onSaved={(id, notes) => setAppointments(prev => prev.map(a => a.id === id ? { ...a, notes } : a))}
          />
        )}
      </AnimatePresence>

      {/* ── PASSWORDS TAB ── */}
      <AnimatePresence>
        {activeTab === 'passwords' && (
          <PasswordResetTab token={token} />
        )}
      </AnimatePresence>

      {/* Doctor detail modal */}
      <AnimatePresence>
        {doctorDetailModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Doctor Profile</h3>
                <button onClick={() => setDoctorDetailModal(null)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 transition">
                  <XIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    {doctorDetailModal.image_placeholder}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-base">{doctorDetailModal.name}</p>
                    <p className="text-emerald-600 dark:text-emerald-400 font-medium">{doctorDetailModal.specialty}</p>
                  </div>
                </div>
                {[
                  ['Post', doctorDetailModal.post],
                  ['Qualification', doctorDetailModal.qualification],
                  ['Education', doctorDetailModal.education_details],
                  ['Practice Started', doctorDetailModal.practice_start_year],
                  ['Experience', doctorDetailModal.experience_years != null ? `${doctorDetailModal.experience_years} years` : null],
                  ['Consultation Fee', `₹${doctorDetailModal.consultation_fee}`],
                  ['Clinic', doctorDetailModal.clinic],
                  ['Address', doctorDetailModal.address],
                  ['City', doctorDetailModal.city],
                  ['Phone', doctorDetailModal.phone],
                  ['Email', doctorDetailModal.email],
                  ['Languages', (doctorDetailModal.languages || []).join(', ')],
                  ['Specializes In', (doctorDetailModal.specializes_in || []).join(', ')],
                  ['Available Days', (doctorDetailModal.available_days || []).join(', ')],
                  ['Available Slots', (doctorDetailModal.available_slots || []).join(', ')],
                  ['Status', doctorDetailModal.status],
                  ['Admin Notes', doctorDetailModal.admin_notes],
                  ['Registered', doctorDetailModal.created_at],
                ].filter(([, v]) => v).map(([label, val]) => (
                  <div key={label} className="flex gap-2">
                    <span className="text-gray-400 w-32 flex-shrink-0">{label}</span>
                    <span className="text-gray-800 dark:text-gray-200 font-medium flex-1">{val}</span>
                  </div>
                ))}
                {doctorDetailModal.bio && (
                  <div>
                    <p className="text-gray-400 mb-1">Bio</p>
                    <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-xs leading-relaxed">{doctorDetailModal.bio}</p>
                  </div>
                )}
                {doctorDetailModal.status === 'pending' && (
                  <div className="flex gap-3 pt-3">
                    <button onClick={() => { approveDoctor(doctorDetailModal.id); setDoctorDetailModal(null) }}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition flex items-center justify-center gap-1.5">
                      <CheckCircle className="w-4 h-4" /> Approve
                    </button>
                    <button onClick={() => { rejectDoctor(doctorDetailModal.id); setDoctorDetailModal(null) }}
                      className="flex-1 py-2.5 rounded-xl bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition flex items-center justify-center gap-1.5 border border-red-200">
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AdminDashboard