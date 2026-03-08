import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  Calendar, Clock, User, LogOut, Phone, Mail,
  MapPin, RefreshCw, Loader2,
  Pencil, Save, X, Check, Sun, Moon,
  AlertCircle, CheckCircle, MessageSquare
} from 'lucide-react'

const API = 'http://localhost:8000'

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const SLOTS = ['08:00 AM','09:00 AM','10:00 AM','11:00 AM','12:00 PM','01:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM','06:00 PM','07:00 PM']
const SPECIALIZATIONS = ['Acne','Eczema','Psoriasis','Melanoma','Skin Cancer Screening','Mole Removal','Vitiligo','Hair Loss','Fungal Infections','Laser Therapy','Scar Treatment','Rosacea']
const LANGUAGES = ['English','Hindi','Tamil','Telugu','Kannada','Malayalam','Marathi','Bengali','Gujarati','Punjabi']

const inputCls = `w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition
  bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700
  text-gray-900 dark:text-white placeholder-gray-400
  focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10`

const PillBtn = ({ label, active, onToggle }) => (
  <button type="button" onClick={onToggle}
    className={`text-xs px-3 py-1.5 rounded-xl font-medium transition border flex items-center gap-1
      ${active ? 'bg-blue-600 text-white border-blue-600'
               : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-blue-400'}`}>
    {active && <Check className="w-3 h-3" />}{label}
  </button>
)

const StatusBadge = ({ status }) => {
  const cfg = {
    pending:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    accepted:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    rejected:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
  }
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${cfg[status] || cfg.pending}`}>
      {status}
    </span>
  )
}

export default function DoctorDashboard() {
  const { user, token, logout } = useAuth()
  const { isDark, toggle: toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [profile,      setProfile]    = useState(null)
  const [appointments, setAppts]      = useState([])
  const [loadingPro,   setLoadingPro] = useState(true)
  const [loadingApt,   setLoadingApt] = useState(false)
  const [saving,       setSaving]     = useState(false)
  const [saveMsg,      setSaveMsg]    = useState(null)
  const [activeTab,    setActiveTab]  = useState('overview')
  const [form,         setForm]       = useState({})
  const [updating,     setUpdating]   = useState(null)
  const [filterStatus, setFilter]     = useState('all')
  const [notesAppt,    setNotesAppt]  = useState(null)
  const [notesText,    setNotesText]  = useState('')

  const authH = token ? { Authorization: `Bearer ${token}` } : {}

  useEffect(() => {
    if (user && user.role !== 'doctor') navigate('/')
  }, [user])

  // ── Fetch doctor profile ──────────────────────────────────────────────────
  const fetchProfile = async () => {
    if (!token) return
    setLoadingPro(true)
    try {
      const r = await axios.get(`${API}/doctors/me`, { headers: authH })
      setProfile(r.data)
      setForm({
        full_name:        r.data.name || '',
        phone:            r.data.phone || '',
        bio:              r.data.bio || '',
        consultation_fee: r.data.consultation_fee || 500,
        clinic_name:      r.data.clinic || '',
        address:          r.data.address || '',
        city:             r.data.city || '',
        available_days:   r.data.available_days || [],
        available_slots:  r.data.available_slots || [],
        specializes_in:   r.data.specializes_in || [],
        languages:        r.data.languages || [],
        qualification:    r.data.qualification || '',
      })
    } catch (e) {
      console.error('Profile fetch error:', e?.response?.data || e.message)
    }
    setLoadingPro(false)
  }

  // ── Fetch appointments ────────────────────────────────────────────────────
  const fetchAppts = async () => {
    if (!token) return
    setLoadingApt(true)
    try {
      // Uses doctor JWT — backend returns patient names
      const r = await axios.get(`${API}/doctor/appointments`, { headers: authH })
      setAppts(r.data.appointments || [])
    } catch (e) {
      console.error('Appointments fetch error:', e?.response?.data || e.message)
      setAppts([])
    }
    setLoadingApt(false)
  }

  useEffect(() => { fetchProfile() }, [token])
  useEffect(() => { if (profile) fetchAppts() }, [profile])

  // ── Accept / Reject / Complete ────────────────────────────────────────────
  const updateStatus = async (aptId, newStatus, notes = '') => {
    setUpdating(aptId)
    try {
      await axios.put(
        `${API}/doctor/appointments/${aptId}/status`,
        { status: newStatus, notes: notes || undefined },
        { headers: authH }
      )
      setAppts(prev =>
        prev.map(a => a.id === aptId ? { ...a, status: newStatus, notes: notes || a.notes } : a)
      )
      setSaveMsg({ ok: true, text: `Appointment ${newStatus}!` })
      setTimeout(() => setSaveMsg(null), 3000)
    } catch (e) {
      setSaveMsg({ ok: false, text: e?.response?.data?.detail || 'Failed to update' })
      setTimeout(() => setSaveMsg(null), 3000)
    }
    setUpdating(null)
  }

  // ── Save profile ──────────────────────────────────────────────────────────
  const saveProfile = async () => {
    setSaving(true); setSaveMsg(null)
    try {
      const r = await axios.put(`${API}/doctors/profile`, form, { headers: authH })
      setProfile(r.data.doctor)
      setSaveMsg({ ok: true, text: 'Profile updated!' })
    } catch (e) {
      setSaveMsg({ ok: false, text: e?.response?.data?.detail || 'Failed to save' })
    }
    setSaving(false)
    setTimeout(() => setSaveMsg(null), 4000)
  }

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const toggleArr = (key, val) =>
    setForm(p => ({
      ...p,
      [key]: p[key].includes(val) ? p[key].filter(x => x !== val) : [...p[key], val]
    }))

  const initials = (profile?.name || user?.full_name || 'DR')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const pendingCount = appointments.filter(a => a.status === 'pending').length
  const filtered = filterStatus === 'all' ? appointments : appointments.filter(a => a.status === filterStatus)

  if (loadingPro) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">

      {/* Toast */}
      <AnimatePresence>
        {saveMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold
              ${saveMsg.ok ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}
          >
            {saveMsg.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {saveMsg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes modal */}
      <AnimatePresence>
        {notesAppt && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white">
                  Notes for {notesAppt.patient_name}
                </h3>
                <button onClick={() => setNotesAppt(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <textarea rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none outline-none"
                placeholder="Write notes for this patient..."
                value={notesText}
                onChange={e => setNotesText(e.target.value)}
              />
              <div className="flex gap-3 mt-4">
                <button onClick={() => setNotesAppt(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 font-medium">
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await updateStatus(notesAppt.id, notesAppt.status, notesText)
                    setNotesAppt(null)
                    setNotesText('')
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> Save Notes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm"
              style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)' }}>
              {initials}
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-sm">Dr. {profile?.name || user?.full_name}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{profile?.specialty || 'Dermatologist'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-yellow-400 transition">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={() => { logout(); navigate('/welcome') }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 flex">
          {[
            { id: 'overview',     label: 'Overview' },
            { id: 'appointments', label: `Appointments${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
            { id: 'edit',         label: 'Edit Profile' },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-3.5 text-sm font-semibold border-b-2 transition whitespace-nowrap
                ${activeTab === t.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total',     value: appointments.length,                                        color: 'text-gray-700 dark:text-gray-200',      bg: 'bg-white dark:bg-gray-900' },
                { label: 'Pending',   value: appointments.filter(a => a.status === 'pending').length,    color: 'text-amber-600',                         bg: 'bg-amber-50 dark:bg-amber-900/20' },
                { label: 'Accepted',  value: appointments.filter(a => a.status === 'accepted').length,   color: 'text-emerald-600',                       bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                { label: 'Completed', value: appointments.filter(a => a.status === 'completed').length,  color: 'text-blue-600',                          bg: 'bg-blue-50 dark:bg-blue-900/20' },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center border border-gray-100 dark:border-gray-800`}>
                  <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Profile card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
              <div className="flex items-start gap-5 flex-wrap">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black text-white"
                  style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)' }}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">Dr. {profile?.name}</h2>
                  <p className="text-emerald-600 font-semibold text-sm">{profile?.post} · {profile?.specialty}</p>
                  <p className="text-gray-500 text-sm">{profile?.qualification}</p>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-blue-400" />{profile?.clinic}, {profile?.city}</span>
                    <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-emerald-400" />{profile?.phone}</span>
                    <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-violet-400" />{profile?.email}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pending quick actions */}
            {pendingCount > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4">
                <p className="font-bold text-amber-800 dark:text-amber-400 mb-3">
                  ⏳ {pendingCount} pending request{pendingCount > 1 ? 's' : ''}
                </p>
                {appointments.filter(a => a.status === 'pending').slice(0, 3).map(a => (
                  <div key={a.id} className="flex items-center justify-between py-2 border-t border-amber-200/50 dark:border-amber-800/30">
                    <div>
                      <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">{a.patient_name}</p>
                      <p className="text-xs text-amber-700 dark:text-amber-500">{a.appointment_date} · {a.appointment_time}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => updateStatus(a.id, 'accepted')}
                        className="text-xs px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition">
                        Accept
                      </button>
                      <button onClick={() => updateStatus(a.id, 'rejected')}
                        className="text-xs px-3 py-1.5 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold hover:bg-red-200 transition">
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
                {pendingCount > 3 && (
                  <button onClick={() => setActiveTab('appointments')}
                    className="text-xs text-amber-700 dark:text-amber-400 font-semibold mt-2 hover:underline">
                    View all {pendingCount} →
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* ── APPOINTMENTS ── */}
        {activeTab === 'appointments' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">

              {/* Header + filters */}
              <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 flex-wrap gap-3">
                <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" /> Patient Appointments
                </h2>
                <div className="flex items-center gap-2 flex-wrap">
                  {['all', 'pending', 'accepted', 'completed', 'rejected'].map(s => (
                    <button key={s} onClick={() => setFilter(s)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-medium capitalize transition border
                        ${filterStatus === s
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-400'}`}>
                      {s}
                    </button>
                  ))}
                  <button onClick={fetchAppts}
                    className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1 transition ml-1">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {loadingApt ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No {filterStatus !== 'all' ? filterStatus : ''} appointments</p>
                  <p className="text-sm mt-1">Patient bookings will appear here</p>
                </div>
              ) : (
                filtered.map(a => (
                  <div key={a.id} className="flex items-start justify-between p-4 border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition flex-wrap gap-3">

                    {/* Patient info */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{a.patient_name}</p>
                        {a.patient_email && <p className="text-xs text-gray-400">{a.patient_email}</p>}
                        {a.patient_phone && <p className="text-xs text-gray-400">{a.patient_phone}</p>}
                        <p className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                          <Calendar className="w-3 h-3" />{a.appointment_date}
                          <Clock className="w-3 h-3 ml-1" />{a.appointment_time}
                        </p>
                        {a.reason && <p className="text-xs text-gray-400 italic mt-1">"{a.reason}"</p>}
                        {a.notes  && <p className="text-xs text-blue-500 mt-1 flex items-center gap-1"><MessageSquare className="w-3 h-3" />{a.notes}</p>}
                      </div>
                    </div>

                    {/* Status + actions */}
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={a.status} />

                      {updating === a.id ? (
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                      ) : (
                        <div className="flex gap-1.5 flex-wrap justify-end">
                          {a.status === 'pending' && (
                            <>
                              <button onClick={() => updateStatus(a.id, 'accepted')}
                                className="text-xs px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition">
                                ✓ Accept
                              </button>
                              <button onClick={() => updateStatus(a.id, 'rejected')}
                                className="text-xs px-3 py-1.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition">
                                ✗ Reject
                              </button>
                            </>
                          )}
                          {a.status === 'accepted' && (
                            <button onClick={() => updateStatus(a.id, 'completed')}
                              className="text-xs px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition">
                              ✓ Done
                            </button>
                          )}
                          {a.status !== 'cancelled' && (
                            <button onClick={() => { setNotesAppt(a); setNotesText(a.notes || '') }}
                              className="text-xs px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-200 transition">
                              Notes
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* ── EDIT PROFILE ── */}
        {activeTab === 'edit' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-black text-gray-900 dark:text-white text-lg flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-500" /> Edit Profile
              </h2>
              <button onClick={saveProfile} disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#06b6d4)' }}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Full Name',          key: 'full_name',        placeholder: 'Dr. Name' },
                  { label: 'Phone',              key: 'phone',            placeholder: '+91 ...' },
                  { label: 'Qualification',      key: 'qualification',    placeholder: 'MBBS, MD...' },
                  { label: 'Consultation Fee ₹', key: 'consultation_fee', placeholder: '500', type: 'number' },
                  { label: 'Clinic Name',        key: 'clinic_name',      placeholder: 'Clinic name' },
                  { label: 'City',               key: 'city',             placeholder: 'City' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{f.label}</label>
                    <input className={inputCls} type={f.type || 'text'}
                      value={form[f.key] || ''} placeholder={f.placeholder}
                      onChange={e => setF(f.key, f.type === 'number' ? Number(e.target.value) : e.target.value)} />
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Address</label>
                  <input className={inputCls} value={form.address || ''} onChange={e => setF('address', e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Bio</label>
                  <textarea rows={3} className={inputCls + ' resize-none'} value={form.bio || ''} onChange={e => setF('bio', e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Available Days</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(d => <PillBtn key={d} label={d} active={form.available_days?.includes(d)} onToggle={() => toggleArr('available_days', d)} />)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Time Slots</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {SLOTS.map(s => (
                    <button key={s} type="button" onClick={() => toggleArr('available_slots', s)}
                      className={`text-xs py-2 rounded-xl font-medium transition border
                        ${form.available_slots?.includes(s)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Specializes In</label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALIZATIONS.map(s => <PillBtn key={s} label={s} active={form.specializes_in?.includes(s)} onToggle={() => toggleArr('specializes_in', s)} />)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Languages</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(l => <PillBtn key={l} label={l} active={form.languages?.includes(l)} onToggle={() => toggleArr('languages', l)} />)}
                </div>
              </div>

              <button onClick={saveProfile} disabled={saving}
                className="w-full py-3.5 rounded-2xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)' }}>
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {saving ? 'Saving...' : 'Save All Changes'}
              </button>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  )
}