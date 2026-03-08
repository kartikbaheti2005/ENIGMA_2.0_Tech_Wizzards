import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import {
  Stethoscope, User, Mail, Lock, Phone, Eye, EyeOff,
  GraduationCap, Building2, Calendar, Clock, IndianRupee,
  ChevronRight, ChevronLeft, AlertCircle, CheckCircle,
  Loader2, Sparkles, Check, ArrowRight
} from 'lucide-react'

const API = 'http://localhost:8000'

const inputCls = `w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none transition-all
  bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400
  focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10
  dark:bg-[#070e1c] dark:border-[#1a3260] dark:text-[#e8f0ff] dark:placeholder-[#2d4a78]
  dark:focus:bg-[#0d1f3c] dark:focus:border-emerald-500`

const Label = ({ children, required }) => (
  <label className="block text-sm font-semibold text-gray-700 dark:text-blue-200/80 mb-1.5">
    {children} {required && <span className="text-red-400">*</span>}
  </label>
)

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const SLOTS = [
  '08:00 AM','09:00 AM','10:00 AM','11:00 AM','12:00 PM',
  '01:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM','06:00 PM',
]
const SPECIALIZATIONS = [
  'Acne','Eczema','Psoriasis','Melanoma','Skin Cancer Screening',
  'Mole Removal','Vitiligo','Hair Loss','Fungal Infections',
  'Laser Therapy','Scar Treatment','Biopsy','Rosacea',
]
const LANGUAGES = [
  'English','Hindi','Tamil','Telugu','Kannada','Malayalam',
  'Marathi','Bengali','Gujarati','Punjabi',
]
const POSTS = [
  'Dermatologist','Dermato-Oncologist','Dermato-Surgeon',
  'Cosmetologist','Trichologist','Venereologist',
]

const PillBtn = ({ label, active, onToggle, color = 'emerald' }) => {
  const on  = color === 'emerald' ? 'bg-emerald-600 text-white border-emerald-600'
                                  : 'bg-blue-600 text-white border-blue-600'
  const off = 'bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-emerald-400'
  return (
    <button type="button" onClick={onToggle}
      className={`text-xs px-3 py-1.5 rounded-xl font-medium transition border ${active ? on : off}`}>
      {active && <Check className="w-3 h-3 inline mr-1" />}{label}
    </button>
  )
}

export default function DoctorRegisterPage() {
  const navigate = useNavigate()
  const [step, setStep]       = useState(0)   // 0 = account+professional, 1 = clinic+availability
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw]   = useState(false)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    // Step 0
    full_name: '', email: '', phone: '', password: '', confirm_password: '',
    post: '', qualification: '', practice_start_year: new Date().getFullYear() - 5,
    consultation_fee: 500, languages: [],
    // Step 1
    clinic_name: '', city: '', address: '',
    available_days: [], available_slots: [], specializes_in: [],
  })

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError('') }
  const toggleArr = (key, val) =>
    setForm(p => ({ ...p, [key]: p[key].includes(val) ? p[key].filter(x => x !== val) : [...p[key], val] }))

  const expYears = new Date().getFullYear() - Number(form.practice_start_year)

  const validate0 = () => {
    if (!form.full_name.trim())     return 'Full name is required'
    if (!form.email.trim())         return 'Email is required'
    if (!form.phone.trim())         return 'Phone is required'
    if (!form.password)             return 'Password is required'
    if (form.password.length < 8)   return 'Password must be at least 8 characters'
    if (form.password !== form.confirm_password) return 'Passwords do not match'
    if (!form.post)                 return 'Post is required'
    if (!form.qualification.trim()) return 'Qualification is required'
    return ''
  }
  const validate1 = () => {
    if (!form.clinic_name.trim())           return 'Clinic name is required'
    if (!form.city.trim())                  return 'City is required'
    if (form.available_days.length === 0)   return 'Select at least one available day'
    if (form.available_slots.length === 0)  return 'Select at least one time slot'
    if (form.languages.length === 0)        return 'Select at least one language'
    return ''
  }

  const next = () => {
    const err = validate0()
    if (err) { setError(err); return }
    setError(''); setStep(1)
  }

  const submit = async () => {
    const err = validate1()
    if (err) { setError(err); return }
    setLoading(true); setError('')
    // derive username from email
    const username = form.email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase() + Math.floor(Math.random() * 100)
    try {
      await axios.post(`${API}/doctors/register`, {
        full_name: form.full_name,
        username,
        email: form.email,
        password: form.password,
        phone: form.phone,
        post: form.post,
        specialty: form.post,
        qualification: form.qualification,
        practice_start_year: Number(form.practice_start_year),
        consultation_fee: Number(form.consultation_fee),
        clinic_name: form.clinic_name,
        address: form.address || form.city,
        city: form.city,
        available_days: form.available_days,
        available_slots: form.available_slots,
        specializes_in: form.specializes_in,
        languages: form.languages,
      })
      setSuccess(true)
    } catch (e) {
      setError(e?.response?.data?.detail || 'Registration failed. Please try again.')
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6
                      bg-gradient-to-br from-slate-50 via-emerald-50 to-cyan-50 dark:bg-[#060d1f]">
        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-white dark:bg-[#0d1f3c] rounded-3xl p-10 max-w-md w-full shadow-2xl text-center
                     border border-white/60 dark:border-[#1a3260]">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
            <Check className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">Application Submitted!</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-8">
            Your profile is under review. Admin will verify your credentials and approve you within <strong>24–48 hours</strong>. You'll be able to log in once approved.
          </p>
          <button onClick={() => navigate('/login')}
            className="w-full py-3.5 rounded-2xl text-white font-bold"
            style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', boxShadow: '0 8px 24px rgba(16,185,129,0.3)' }}>
            Go to Login
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12 relative overflow-hidden
                    bg-gradient-to-br from-slate-50 via-emerald-50 to-cyan-50 dark:bg-[#060d1f]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ x: [0,40,0], y: [0,-30,0] }} transition={{ duration: 9, repeat: Infinity }}
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #10b981, transparent)' }} />
        <motion.div animate={{ x: [0,-30,0], y: [0,40,0] }} transition={{ duration: 11, repeat: Infinity, delay: 3 }}
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }} />
      </div>

      <div className="w-full max-w-lg relative z-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-xl mb-3"
            style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Doctor Registration</h1>
          <p className="text-gray-500 dark:text-blue-300/60 mt-1 text-sm">
            {step === 0 ? 'Your info & credentials' : 'Clinic & availability'}
          </p>
        </motion.div>

        {/* Step dots */}
        <div className="flex items-center gap-2 mb-6 px-1">
          <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 0 ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
          <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 1 ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
          <span className="text-xs text-gray-400 font-medium ml-1">{step + 1}/2</span>
        </div>

        {/* Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-3xl p-7 shadow-2xl border bg-white/90 dark:bg-[#0d1f3c]/90 backdrop-blur-xl
                     border-white/60 dark:border-[#1a3260]"
          style={{ boxShadow: '0 24px 64px rgba(16,185,129,0.10)' }}>

          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 mb-5 rounded-xl text-sm text-red-700
                         bg-red-50 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/40">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </motion.div>
          )}

          <AnimatePresence mode="wait">

            {/* ── STEP 0 ── */}
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-4">

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label required>Full Name</Label>
                    <input className={inputCls} placeholder="Dr. Priya Sharma" value={form.full_name} onChange={e => set('full_name', e.target.value)} />
                  </div>
                  <div>
                    <Label required>Email</Label>
                    <input className={inputCls} type="email" placeholder="doctor@hospital.com" value={form.email} onChange={e => set('email', e.target.value)} />
                  </div>
                  <div>
                    <Label required>Phone</Label>
                    <input className={inputCls} type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={e => set('phone', e.target.value)} />
                  </div>
                  <div>
                    <Label required>Password</Label>
                    <div className="relative">
                      <input className={inputCls + ' pr-10'} type={showPw ? 'text' : 'password'} placeholder="Min 8 chars" value={form.password} onChange={e => set('password', e.target.value)} />
                      <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-500">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label required>Confirm Password</Label>
                    <input className={inputCls} type="password" placeholder="Repeat" value={form.confirm_password} onChange={e => set('confirm_password', e.target.value)} />
                  </div>
                </div>

                <div className="pt-1 border-t border-gray-100 dark:border-gray-700/50 space-y-3">
                  <div>
                    <Label required>Post / Title</Label>
                    <select className={inputCls} value={form.post} onChange={e => set('post', e.target.value)}>
                      <option value="">Select your post...</option>
                      {POSTS.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label required>Qualifications</Label>
                    <input className={inputCls} placeholder="e.g. MBBS, MD (Dermatology) — AIIMS Delhi" value={form.qualification} onChange={e => set('qualification', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label required>Year Started Practicing</Label>
                      <input className={inputCls} type="number" min="1970" max={new Date().getFullYear()} placeholder="e.g. 2012" value={form.practice_start_year} onChange={e => set('practice_start_year', e.target.value)} />
                      {expYears > 0 && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
                          ✓ {expYears} yr{expYears !== 1 ? 's' : ''} experience (auto-updates yearly)
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>Consultation Fee (₹)</Label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input className={inputCls + ' pl-8'} type="number" min="100" value={form.consultation_fee} onChange={e => set('consultation_fee', e.target.value)} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label required>Languages Spoken</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {LANGUAGES.map(l => <PillBtn key={l} label={l} active={form.languages.includes(l)} onToggle={() => toggleArr('languages', l)} color="emerald" />)}
                    </div>
                  </div>
                </div>

                <button onClick={next}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-bold text-sm mt-2 transition"
                  style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', boxShadow: '0 6px 20px rgba(16,185,129,0.3)' }}>
                  Next: Clinic & Availability <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-4">

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label required>Clinic / Hospital Name</Label>
                    <input className={inputCls} placeholder="e.g. Apollo Skin Institute" value={form.clinic_name} onChange={e => set('clinic_name', e.target.value)} />
                  </div>
                  <div>
                    <Label required>City</Label>
                    <input className={inputCls} placeholder="e.g. Mumbai" value={form.city} onChange={e => set('city', e.target.value)} />
                  </div>
                  <div>
                    <Label>Address / Area</Label>
                    <input className={inputCls} placeholder="Area / Landmark" value={form.address} onChange={e => set('address', e.target.value)} />
                  </div>
                </div>

                <div>
                  <Label required>Available Days</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {DAYS.map(d => <PillBtn key={d} label={d} active={form.available_days.includes(d)} onToggle={() => toggleArr('available_days', d)} />)}
                  </div>
                </div>

                <div>
                  <Label required>Time Slots</Label>
                  <div className="grid grid-cols-4 gap-1.5 mt-1">
                    {SLOTS.map(s => (
                      <button key={s} type="button" onClick={() => toggleArr('available_slots', s)}
                        className={`text-xs py-1.5 rounded-lg font-medium transition border ${form.available_slots.includes(s) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-emerald-400'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Specializes In <span className="text-xs font-normal text-gray-400">(optional)</span></Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {SPECIALIZATIONS.map(s => <PillBtn key={s} label={s} active={form.specializes_in.includes(s)} onToggle={() => toggleArr('specializes_in', s)} color="blue" />)}
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button onClick={() => { setStep(0); setError('') }}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700
                               text-gray-600 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button onClick={submit} disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm transition disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', boxShadow: '0 6px 20px rgba(16,185,129,0.3)' }}>
                    {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</> : <><Sparkles className="w-4 h-4" /> Submit Registration</>}
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>

        <p className="text-center mt-5 text-sm text-gray-500 dark:text-gray-400">
          Already registered?{' '}
          <Link to="/login" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">Sign In</Link>
          {' '}·{' '}
          <Link to="/welcome" className="text-gray-400 hover:text-blue-500 font-semibold">Back</Link>
        </p>
      </div>
    </div>
  )
}