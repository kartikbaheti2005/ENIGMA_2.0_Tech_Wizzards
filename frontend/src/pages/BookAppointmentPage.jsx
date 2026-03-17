import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import {
  Calendar, Clock, Building2, Phone,
  ChevronLeft, Check, Loader2, AlertCircle,
  FileText, IndianRupee, Star
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function getNextDates(availableDays = [], days = 14) {
  const dates = []
  const today = new Date()
  for (let i = 1; i <= days; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const weekday = d.toLocaleDateString('en-IN', { weekday: 'short' })
    if (availableDays.length === 0 || availableDays.includes(weekday)) {
      dates.push({
        iso: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
        weekday,
      })
    }
  }
  return dates
}

export default function BookAppointmentPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { token, isLoggedIn } = useAuth()  // ✅ get token from auth context
  const { doctor, slot: preSlot } = location.state || {}

  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState(preSlot || '')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [appointmentId, setAppointmentId] = useState(null)

  if (!doctor) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 gap-4">
        <p className="text-gray-500 dark:text-gray-400 text-lg">No doctor selected.</p>
        <button onClick={() => navigate('/find-doctors')}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition">
          <ChevronLeft className="w-4 h-4" /> Find Doctors
        </button>
      </div>
    )
  }

  const availableDates = getNextDates(doctor.available_days || [])

  const handleSubmit = async () => {
    if (!isLoggedIn || !token) {
      navigate('/login')
      return
    }
    if (!selectedDate) { setError('Please select a date.'); return }
    if (!selectedSlot) { setError('Please select a time slot.'); return }
    setError('')
    setLoading(true)
    try {
      // token already available from useAuth() above
      const res = await axios.post(
        `${API}/appointments`,
        {
          doctor_id: doctor.id || null,
          doctor_name: doctor.name,
          doctor_specialty: doctor.specialty,
          doctor_clinic: doctor.clinic || '',
          doctor_address: doctor.address || '',
          doctor_phone: doctor.phone || '',
          appointment_date: selectedDate,
          appointment_time: selectedSlot,
          reason,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setAppointmentId(res.data.appointment_id || res.data.id)
      setSuccess(true)
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to book appointment. Please try again.')
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-md w-full shadow-xl text-center">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
            <Check className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Appointment Booked!</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
            Your appointment with <span className="font-semibold text-gray-700 dark:text-gray-200">{doctor.name}</span> is confirmed.
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mb-6">
            Appointment ID: <span className="font-mono font-semibold text-blue-600">#{appointmentId}</span>
          </p>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mb-6 text-left space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" /> {selectedSlot}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <Building2 className="w-4 h-4 text-blue-500 flex-shrink-0" /> {doctor.clinic}
            </div>
            {doctor.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <Phone className="w-4 h-4 text-blue-500 flex-shrink-0" /> {doctor.phone}
              </div>
            )}
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-2 mb-6">
            Status is <strong>Pending</strong> — the clinic will confirm your appointment soon.
          </p>
          <div className="flex gap-3">
            <button onClick={() => navigate('/find-doctors')}
              className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-semibold hover:bg-gray-200 transition text-sm">
              Find More Doctors
            </button>
            <button onClick={() => navigate('/')}
              className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition text-sm">
              Go Home
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-16">
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 text-white pt-10 pb-14 px-4">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm mb-5 transition">
            <ChevronLeft className="w-4 h-4" /> Back to Doctors
          </button>
          <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-3xl font-extrabold">Book Appointment</motion.h1>
          <p className="text-blue-100 text-sm mt-1">Fill in the details to confirm your booking</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-6 space-y-5">
        {/* Doctor card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0 shadow">
              {doctor.image_placeholder}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-900 dark:text-white text-lg">{doctor.name}</h2>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{doctor.specialty}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{doctor.qualification}</p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{doctor.rating}</span>
                <span className="mx-2 text-gray-300 dark:text-gray-600">·</span>
                <IndianRupee className="w-3 h-3 text-gray-500" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{doctor.consultation_fee}</span>
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Building2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            {doctor.clinic} · {doctor.address}
          </div>
        </motion.div>

        {/* Date picker */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" /> Select Date
          </h3>
          <div className="flex gap-2 flex-wrap">
            {availableDates.map(d => (
              <button key={d.iso} onClick={() => setSelectedDate(d.iso)}
                className={`flex flex-col items-center px-3 py-2 rounded-xl text-xs font-medium transition border ${
                  selectedDate === d.iso
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-blue-50'
                }`}>
                <span className="font-bold">{d.weekday}</span>
                <span className="mt-0.5 opacity-80">{d.label.replace(d.weekday + ', ', '')}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Slot picker */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" /> Select Time Slot
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {doctor.available_slots.map(slot => (
              <button key={slot} onClick={() => setSelectedSlot(slot)}
                className={`py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-1 ${
                  selectedSlot === slot
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300 hover:bg-blue-50'
                }`}>
                {selectedSlot === slot && <Check className="w-3.5 h-3.5" />} {slot}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Reason */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" /> Reason for Visit
            <span className="text-xs font-normal text-gray-400">(optional)</span>
          </h3>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
            placeholder="e.g. Skin rash, follow-up after AI scan result, mole check..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
        </motion.div>

        {/* Summary & submit */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Booking Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Doctor</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">{doctor.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Date</span>
              <span className={`font-medium ${selectedDate ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400'}`}>
                {selectedDate
                  ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', month: 'long', day: 'numeric' })
                  : '— Not selected'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Time</span>
              <span className={`font-medium ${selectedSlot ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400'}`}>
                {selectedSlot || '— Not selected'}
              </span>
            </div>
            <div className="flex justify-between border-t border-gray-100 dark:border-gray-700 pt-2 mt-2">
              <span className="text-gray-500 dark:text-gray-400">Consultation Fee</span>
              <span className="font-bold text-gray-900 dark:text-white">₹{doctor.consultation_fee}</span>
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading}
            className="w-full mt-5 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-2xl hover:from-blue-700 hover:to-cyan-600 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
            {loading
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Booking...</>
              : <><Calendar className="w-5 h-5" /> Confirm Appointment</>}
          </button>
          <p className="text-xs text-center text-gray-400 mt-3">
            By confirming, you agree that the clinic will review and confirm your appointment.
          </p>
        </motion.div>
      </div>
    </div>
  )
}