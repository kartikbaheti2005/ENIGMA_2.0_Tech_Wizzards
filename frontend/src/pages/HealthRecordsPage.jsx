import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart, Save, Loader2, AlertCircle, CheckCircle, Activity, ScanLine, User, FileText } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const inputCls = `w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition
  bg-white dark:bg-[#091629] border-gray-200 dark:border-[#1a3260]
  text-gray-900 dark:text-white placeholder-gray-400
  focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10`

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const RISK_STYLE = {
  'High Risk':     'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  'Moderate Risk': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  'Low Risk':      'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
}

function getBMI(h, w) {
  if (!h || !w) return null
  return (parseFloat(w) / Math.pow(parseFloat(h) / 100, 2)).toFixed(1)
}
function getBMIStatus(bmi) {
  if (!bmi) return null
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-500' }
  if (bmi < 25)   return { label: 'Normal',      color: 'text-emerald-500' }
  if (bmi < 30)   return { label: 'Overweight',  color: 'text-amber-500' }
  return              { label: 'Obese',          color: 'text-red-500' }
}

export default function HealthRecordsPage() {
  const { token, user } = useAuth()
  const [tab,     setTab]    = useState('record')
  const [saving,  setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [msg,     setMsg]    = useState(null)
  const [scans,   setScans]  = useState([])
  const [form, setForm] = useState({
    blood_group: '', height_cm: '', weight_kg: '',
    allergies: '', chronic_conditions: '', current_medications: '',
    past_surgeries: '', emergency_contact_name: '', emergency_contact_phone: '', notes: '',
  })

  const authH = token ? { Authorization: `Bearer ${token}` } : {}
  const bmi       = getBMI(form.height_cm, form.weight_kg)
  const bmiStatus = getBMIStatus(parseFloat(bmi))

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const [rec, scn] = await Promise.all([
          axios.get(`${API}/user/health-record`, { headers: authH }).catch(() => null),
          axios.get(`${API}/user/scans`, { headers: authH }).catch(() => null),
        ])
        if (rec?.data?.health_record) {
          const d = rec.data.health_record
          setForm(f => ({ ...f, ...d, height_cm: d.height_cm || '', weight_kg: d.weight_kg || '' }))
        }
        if (scn?.data) setScans(scn.data.slice(0, 8))
      } finally { setLoading(false) }
    }
    fetch()
  }, [])

  const handleSave = async () => {
    setSaving(true); setMsg(null)
    try {
      const payload = { ...form }
      if (payload.height_cm) payload.height_cm = parseFloat(payload.height_cm)
      if (payload.weight_kg) payload.weight_kg = parseFloat(payload.weight_kg)
      Object.keys(payload).forEach(k => { if (!payload[k] && payload[k] !== 0) delete payload[k] })
      await axios.post(`${API}/user/health-record`, payload, { headers: authH })
      setMsg({ type: 'success', text: 'Health record saved!' })
    } catch { setMsg({ type: 'error', text: 'Failed to save. Try again.' }) }
    finally { setSaving(false) }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const highRiskScans = scans.filter(s => s.risk_level === 'High Risk').length

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Medical Passport</h1>
            <p className="text-sm text-gray-500 dark:text-[#6b8fc2]">Your complete skin health profile</p>
          </div>
        </div>
      </motion.div>

      {/* Stats row */}
      {!loading && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total Scans',      value: scans.length,    color: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: 'High Risk Flags',  value: highRiskScans,   color: 'text-red-500',     bg: 'bg-red-50 dark:bg-red-900/20'   },
            { label: 'Conditions Saved', value: [form.chronic_conditions, form.allergies].filter(Boolean).length, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
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
        {[{ key: 'record', label: 'Medical Info', icon: Heart }, { key: 'scans', label: 'Scan History', icon: ScanLine }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition ${
              tab === t.key
                ? 'text-white border-transparent'
                : 'bg-white dark:bg-[#0d1f3c] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-[#1a3260]'
            }`}
            style={tab === t.key ? { background: 'linear-gradient(135deg, #10b981, #06b6d4)' } : {}}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="w-7 h-7 animate-spin text-emerald-500" /></div>
      ) : (
        <>
          {/* Medical Info Tab */}
          {tab === 'record' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-white dark:bg-[#0d1f3c] rounded-2xl border border-gray-200 dark:border-[#1a3260] p-6 space-y-6 shadow-sm">

              {/* Vitals */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 dark:text-[#4a6a9a] uppercase tracking-wider mb-3">Vitals</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Blood Group</label>
                    <select value={form.blood_group} onChange={e => set('blood_group', e.target.value)} className={inputCls}>
                      <option value="">Select</option>
                      {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Height (cm)</label>
                    <input type="number" placeholder="170" value={form.height_cm} onChange={e => set('height_cm', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Weight (kg)</label>
                    <input type="number" placeholder="65" value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} className={inputCls} />
                  </div>
                </div>
                {bmi && (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <span className="text-gray-400 text-xs">BMI:</span>
                    <span className="font-bold text-gray-900 dark:text-white">{bmi}</span>
                    {bmiStatus && <span className={`text-xs font-medium ${bmiStatus.color}`}>— {bmiStatus.label}</span>}
                  </div>
                )}
              </div>

              {/* Emergency */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 dark:text-[#4a6a9a] uppercase tracking-wider mb-3">Emergency Contact</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Name</label>
                    <input placeholder="Contact name" value={form.emergency_contact_name} onChange={e => set('emergency_contact_name', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Phone</label>
                    <input placeholder="+91 98765 43210" value={form.emergency_contact_phone} onChange={e => set('emergency_contact_phone', e.target.value)} className={inputCls} />
                  </div>
                </div>
              </div>

              {/* Medical history */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 dark:text-[#4a6a9a] uppercase tracking-wider mb-3">Skin & Medical History</h3>
                <div className="space-y-3">
                  {[
                    { key: 'allergies',           label: 'Known Allergies',         placeholder: 'e.g. Penicillin, latex, pollen' },
                    { key: 'chronic_conditions',  label: 'Skin/Chronic Conditions', placeholder: 'e.g. Eczema, Psoriasis, Diabetes' },
                    { key: 'current_medications', label: 'Current Medications',     placeholder: 'e.g. Tretinoin, Metformin' },
                    { key: 'past_surgeries',      label: 'Past Surgeries / Biopsies', placeholder: 'e.g. Mole removal 2022' },
                    { key: 'notes',               label: 'Additional Notes',        placeholder: 'Anything else your doctor should know' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">{f.label}</label>
                      <textarea rows={2} placeholder={f.placeholder} value={form[f.key]} onChange={e => set(f.key, e.target.value)} className={`${inputCls} resize-none`} />
                    </div>
                  ))}
                </div>
              </div>

              {msg && (
                <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${msg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
                  {msg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {msg.text}
                </div>
              )}

              <button onClick={handleSave} disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm transition disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Medical Passport'}
              </button>
            </motion.div>
          )}

          {/* Scan History Tab */}
          {tab === 'scans' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {scans.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-[#0d1f3c] rounded-2xl border border-gray-200 dark:border-[#1a3260]">
                  <ScanLine className="w-10 h-10 text-gray-300 dark:text-[#1a3260] mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No scans yet. Go to AI Scan to get started.</p>
                </div>
              ) : scans.map((s, i) => (
                <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-[#0d1f3c] border border-gray-200 dark:border-[#1a3260] shadow-sm">
                  <div className="flex items-center gap-3">
                    {s.image_url
                      ? <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${s.image_url}`} alt="" className="w-12 h-12 rounded-xl object-cover" />
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