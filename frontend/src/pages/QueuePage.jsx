import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, User, Loader2, ScanLine, CheckCircle, AlertCircle, MapPin, Phone } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const API = 'http://localhost:8000'

const STATUS_STYLE = {
  confirmed: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  pending:   'bg-amber-100  dark:bg-amber-900/30  text-amber-700  dark:text-amber-400',
  completed: 'bg-blue-100   dark:bg-blue-900/30   text-blue-700   dark:text-blue-400',
  cancelled: 'bg-gray-100   dark:bg-gray-800       text-gray-500   dark:text-gray-400',
}

const RISK_STYLE = {
  'High Risk':     'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  'Moderate Risk': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  'Low Risk':      'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
}

export default function QueuePage() {
  const { token } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [scans,        setScans]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [tab,          setTab]          = useState('upcoming')

  const authH = token ? { Authorization: `Bearer ${token}` } : {}

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const [appt, scn] = await Promise.all([
          axios.get(`${API}/appointments/my`, { headers: authH }).catch(() => ({ data: [] })),
          axios.get(`${API}/user/scans`,       { headers: authH }).catch(() => ({ data: [] })),
        ])
        setAppointments(appt.data || [])
        setScans((scn.data || []).slice(0, 5))
      } finally { setLoading(false) }
    }
    fetch()
  }, [])

  const upcoming  = appointments.filter(a => ['confirmed', 'pending'].includes(a.status))
  const past      = appointments.filter(a => ['completed', 'cancelled'].includes(a.status))
  const highRisk  = scans.find(s => s.risk_level === 'High Risk')

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">My Appointments</h1>
            <p className="text-sm text-gray-500 dark:text-[#6b8fc2]">Track your dermatologist visits</p>
          </div>
        </div>
      </motion.div>

      {/* High risk nudge */}
      {!loading && highRisk && upcoming.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-2xl border-2 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-700 dark:text-red-400">Action needed — High Risk scan detected</p>
            <p className="text-xs text-red-600 dark:text-red-300 mt-0.5">
              Your scan showed <strong>{highRisk.diagnosis_name}</strong>. You have no upcoming appointments.{' '}
              <a href="/find-doctors" className="underline font-semibold">Book with a dermatologist now →</a>
            </p>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      {!loading && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Upcoming',    value: upcoming.length, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20'  },
            { label: 'Completed',   value: past.filter(a => a.status === 'completed').length, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Recent Scans', value: scans.length,  color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center border border-gray-100 dark:border-[#1a3260]`}>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[{ key: 'upcoming', label: 'Upcoming' }, { key: 'past', label: 'Past' }, { key: 'scans', label: 'Recent Scans' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${
              tab === t.key
                ? 'text-white border-transparent'
                : 'bg-white dark:bg-[#0d1f3c] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-[#1a3260]'
            }`}
            style={tab === t.key ? { background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' } : {}}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-7 h-7 animate-spin text-purple-500" />
        </div>
      ) : (
        <>
          {/* Upcoming */}
          {tab === 'upcoming' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {upcoming.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-[#0d1f3c] rounded-2xl border border-gray-200 dark:border-[#1a3260]">
                  <Calendar className="w-10 h-10 text-gray-300 dark:text-[#1a3260] mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-500 mb-3">No upcoming appointments</p>
                  <a href="/find-doctors"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>
                    Find a Dermatologist →
                  </a>
                </div>
              ) : upcoming.map((a, i) => <AppointmentCard key={a.id} appt={a} i={i} />)}
            </motion.div>
          )}

          {/* Past */}
          {tab === 'past' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {past.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-[#0d1f3c] rounded-2xl border border-gray-200 dark:border-[#1a3260]">
                  <CheckCircle className="w-10 h-10 text-gray-300 dark:text-[#1a3260] mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No past appointments yet</p>
                </div>
              ) : past.map((a, i) => <AppointmentCard key={a.id} appt={a} i={i} />)}
            </motion.div>
          )}

          {/* Recent Scans */}
          {tab === 'scans' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {scans.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-[#0d1f3c] rounded-2xl border border-gray-200 dark:border-[#1a3260]">
                  <ScanLine className="w-10 h-10 text-gray-300 dark:text-[#1a3260] mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No scans yet</p>
                </div>
              ) : scans.map((s, i) => (
                <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-[#0d1f3c] border border-gray-200 dark:border-[#1a3260] shadow-sm">
                  <div className="flex items-center gap-3">
                    {s.image_url
                      ? <img src={`http://localhost:8000${s.image_url}`} alt="" className="w-12 h-12 rounded-xl object-cover" />
                      : <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-[#091629] flex items-center justify-center"><ScanLine className="w-5 h-5 text-gray-400" /></div>
                    }
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{s.diagnosis_name}</p>
                      <p className="text-xs text-gray-400 dark:text-[#4a6a9a]">
                        {new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}{Math.round(s.confidence_score * 100)}% confidence
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${RISK_STYLE[s.risk_level] || 'bg-gray-100 text-gray-500'}`}>
                    {s.risk_level}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}

function AppointmentCard({ appt, i }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
      className="p-5 rounded-2xl bg-white dark:bg-[#0d1f3c] border border-gray-200 dark:border-[#1a3260] shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{appt.doctor_name || 'Dermatologist'}</p>
            <p className="text-xs text-gray-400">{appt.specialty || 'Dermatology'}</p>
          </div>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLE[appt.status] || ''}`}>
          {appt.status}
        </span>
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-[#4a6a9a]">
        {appt.appointment_date && (
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(appt.appointment_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
          </div>
        )}
        {appt.appointment_time && (
          <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{appt.appointment_time}</div>
        )}
        {appt.location && (
          <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{appt.location}</div>
        )}
      </div>
    </motion.div>
  )
}