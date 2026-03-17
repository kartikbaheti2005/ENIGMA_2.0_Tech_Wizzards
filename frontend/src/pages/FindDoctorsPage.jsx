import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, MapPin, Star, Phone, Mail, Clock, Calendar,
  ChevronRight, Stethoscope, Award, IndianRupee,
  X, Check, Loader2, Building2, Navigation, AlertCircle
} from 'lucide-react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const CITY_COORDS = {
  'Delhi':      { lat: 28.6139, lng: 77.2090 },
  'Mumbai':     { lat: 19.0760, lng: 72.8777 },
  'Chennai':    { lat: 13.0827, lng: 80.2707 },
  'Pune':       { lat: 18.5204, lng: 73.8567 },
  'Kochi':      { lat: 9.9312,  lng: 76.2673 },
  'Ahmedabad':  { lat: 23.0225, lng: 72.5714 },
  'Hyderabad':  { lat: 17.3850, lng: 78.4867 },
  'Chandigarh': { lat: 30.7333, lng: 76.7794 },
  'Nagpur':     { lat: 21.1458, lng: 79.0882 },
}

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

// ── Star Rating Display ───────────────────────────────────────────────────────
const StarDisplay = ({ rating, size = 'sm' }) => {
  const s = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5'
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`${s} ${i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-gray-600'}`} />
      ))}
      <span className={`font-bold text-gray-700 dark:text-gray-200 ml-1 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>{rating?.toFixed(1) || '0.0'}</span>
    </div>
  )
}

// ── Interactive Star Rater ────────────────────────────────────────────────────
const StarRater = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1,2,3,4,5].map(i => (
      <button key={i} type="button" onClick={() => onChange(i)}
        className="transition-transform hover:scale-110">
        <Star className={`w-7 h-7 ${i <= value ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}`} />
      </button>
    ))}
  </div>
)

// ── Doctor Drawer (side panel) ────────────────────────────────────────────────
const DoctorDrawer = ({ doctor, onClose, onBook, token, isLoggedIn }) => {
  const [selectedSlot, setSelectedSlot] = useState('')
  const [selectedDay,  setSelectedDay]  = useState('')
  const [myRating,     setMyRating]     = useState(0)
  const [ratingDone,   setRatingDone]   = useState(false)
  const [ratingLoading,setRatingLoading]= useState(false)
  const [ratingMsg,    setRatingMsg]    = useState('')

  const submitRating = async () => {
    if (!myRating) return
    if (!isLoggedIn) { setRatingMsg('Please login to rate'); return }
    setRatingLoading(true)
    try {
      const r = await axios.post(`${API}/doctors/rate`,
        { doctor_id: doctor.id, rating: myRating },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setRatingDone(true)
      setRatingMsg(`✅ Thanks! New rating: ${r.data.new_rating} (${r.data.review_count} reviews)`)
    } catch (e) {
      setRatingMsg(e?.response?.data?.detail || 'Failed to submit rating')
    }
    setRatingLoading(false)
  }

  const DAYS_FULL = { Mon:'Monday', Tue:'Tuesday', Wed:'Wednesday', Thu:'Thursday', Fri:'Friday', Sat:'Saturday', Sun:'Sunday' }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end" onClick={onClose}>
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="w-full max-w-md bg-white dark:bg-gray-900 h-full overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-5 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Doctor Profile</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition">
            <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Profile hero */}
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>
              {doctor.image_placeholder || doctor.name?.slice(0,2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight">{doctor.name}</h3>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold mt-0.5">{doctor.post} · {doctor.specialty}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{doctor.qualification}</p>
              <div className="flex items-center gap-2 mt-2">
                <StarDisplay rating={doctor.rating} />
                <span className="text-xs text-gray-400">({doctor.review_count} reviews)</span>
              </div>
              {doctor.distance_km != null && (
                <p className="text-xs text-blue-500 font-semibold mt-1 flex items-center gap-1">
                  <Navigation className="w-3 h-3" /> {doctor.distance_km} km away
                </p>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full font-semibold">
              <Award className="w-3 h-3" /> {doctor.experience_years} yrs exp
            </span>
            <span className="flex items-center gap-1 text-xs px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-full font-semibold">
              <IndianRupee className="w-3 h-3" /> ₹{doctor.consultation_fee}
            </span>
            {doctor.languages?.slice(0,3).map(l => (
              <span key={l} className="text-xs px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full font-semibold">{l}</span>
            ))}
          </div>

          {/* Bio */}
          {doctor.bio && (
            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed italic">"{doctor.bio}"</p>
            </div>
          )}

          {/* Clinic info */}
          <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Building2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-gray-800 dark:text-white">{doctor.clinic}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{doctor.address}, {doctor.city}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <a href={`tel:${doctor.phone}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">{doctor.phone}</a>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <a href={`mailto:${doctor.email}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate">{doctor.email}</a>
            </div>
          </div>

          {/* Specializes in */}
          {doctor.specializes_in?.length > 0 && (
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-white mb-2">Specializes In</p>
              <div className="flex flex-wrap gap-1.5">
                {doctor.specializes_in.map(s => (
                  <span key={s} className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 rounded-lg">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Available days */}
          {doctor.available_days?.length > 0 && (
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-500" /> Available Days
              </p>
              <div className="flex flex-wrap gap-2">
                {doctor.available_days.map(d => (
                  <button key={d} onClick={() => setSelectedDay(v => v===d ? '' : d)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition border ${selectedDay===d ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-400'}`}>
                    {DAYS_FULL[d] || d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Time slots */}
          {doctor.available_slots?.length > 0 && (
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-500" /> Time Slots
              </p>
              <div className="grid grid-cols-3 gap-2">
                {doctor.available_slots.map(s => (
                  <button key={s} onClick={() => setSelectedSlot(v => v===s ? '' : s)}
                    className={`text-xs py-2 rounded-xl font-semibold transition border flex items-center justify-center gap-1 ${selectedSlot===s ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-400'}`}>
                    {selectedSlot===s && <Check className="w-3 h-3" />}{s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Rating Section ── */}
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-2xl p-4">
            <p className="text-sm font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> Rate this Doctor
            </p>
            {ratingDone ? (
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">{ratingMsg}</p>
            ) : (
              <>
                <StarRater value={myRating} onChange={setMyRating} />
                {myRating > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2">
                      {['','Poor','Below Average','Average','Good','Excellent'][myRating]} — {myRating}/5
                    </p>
                    <button onClick={submitRating} disabled={ratingLoading}
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition disabled:opacity-60 flex items-center gap-2">
                      {ratingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                      Submit Rating
                    </button>
                  </div>
                )}
                {!isLoggedIn && <p className="text-xs text-amber-600 mt-2">Login to submit your rating</p>}
                {ratingMsg && !ratingDone && <p className="text-xs text-red-500 mt-2">{ratingMsg}</p>}
              </>
            )}
          </div>

          {/* Book button */}
          <button onClick={() => onBook(doctor, selectedSlot, selectedDay)}
            className="w-full py-4 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg transition hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>
            <Calendar className="w-5 h-5" /> Book Appointment
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Doctor Card ───────────────────────────────────────────────────────────────
const DoctorCard = ({ doctor, onSelect, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
    whileHover={{ y: -3 }}
    onClick={() => onSelect(doctor)}
    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-700 transition-all cursor-pointer group"
  >
    {/* Top row */}
    <div className="flex items-start gap-4">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black text-white shadow-md flex-shrink-0 group-hover:scale-105 transition-transform"
        style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>
        {doctor.image_placeholder || doctor.name?.slice(0,2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight truncate">{doctor.name}</h3>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-0.5">{doctor.post}</p>
          </div>
          <span className="text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-0.5 flex-shrink-0">
            <IndianRupee className="w-3 h-3" />{doctor.consultation_fee}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <StarDisplay rating={doctor.rating} />
          <span className="text-xs text-gray-400">({doctor.review_count})</span>
        </div>
      </div>
    </div>

    {/* Location + experience */}
    <div className="flex items-center gap-3 mt-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
      <span className="flex items-center gap-1">
        <MapPin className="w-3 h-3 text-blue-400" /> {doctor.city}
      </span>
      <span className="flex items-center gap-1">
        <Building2 className="w-3 h-3 text-gray-400" /> {doctor.clinic}
      </span>
      <span className="flex items-center gap-1">
        <Award className="w-3 h-3 text-emerald-400" /> {doctor.experience_years} yrs
      </span>
      {doctor.distance_km != null && (
        <span className="flex items-center gap-1 text-blue-500 font-semibold">
          <Navigation className="w-3 h-3" /> {doctor.distance_km} km
        </span>
      )}
    </div>

    {/* Tags */}
    <div className="flex items-center gap-1.5 mt-3 flex-wrap">
      {doctor.specializes_in?.slice(0,2).map(s => (
        <span key={s} className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg font-medium">{s}</span>
      ))}
      {doctor.specializes_in?.length > 2 && (
        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-400 rounded-lg">+{doctor.specializes_in.length - 2}</span>
      )}
      <span className="ml-auto text-xs text-gray-400 flex items-center gap-0.5 group-hover:text-blue-500 transition-colors">
        View <ChevronRight className="w-3 h-3" />
      </span>
    </div>
  </motion.div>
)

// ═══════════════════════════════════════════════════════════════════════════════
export default function FindDoctorsPage() {
  const { isLoggedIn, token } = useAuth()
  const navigate = useNavigate()

  const [doctors,      setDoctors]     = useState([])
  const [cities,       setCities]      = useState([])
  const [loading,      setLoading]     = useState(true)
  const [search,       setSearch]      = useState('')
  const [cityFilter,   setCityFilter]  = useState('')
  const [selected,     setSelected]    = useState(null)
  const [userLocation, setUserLoc]     = useState(null)
  const [gpsLoading,   setGpsLoading]  = useState(false)
  const [gpsError,     setGpsError]    = useState('')
  const [sortByDist,   setSortByDist]  = useState(false)

  const fetchDoctors = async (city = cityFilter, q = search) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (city) params.append('city', city)
      if (q)    params.append('search', q)
      const r = await axios.get(`${API}/doctors?${params}`)
      let docs = r.data.doctors || []

      if (userLocation) {
        docs = docs.map(d => {
          const c = CITY_COORDS[d.city]
          return { ...d, distance_km: c ? Math.round(getDistance(userLocation.lat, userLocation.lng, c.lat, c.lng)) : null }
        })
        if (sortByDist) docs.sort((a, b) => (a.distance_km ?? 9999) - (b.distance_km ?? 9999))
      }
      setDoctors(docs)
    } catch { setDoctors([]) }
    setLoading(false)
  }

  useEffect(() => {
    axios.get(`${API}/doctors/cities`).then(r => setCities(r.data.cities || [])).catch(() => {})
  }, [])

  useEffect(() => { fetchDoctors() }, [cityFilter, userLocation, sortByDist])

  const detectLocation = () => {
    if (!navigator.geolocation) { setGpsError('Geolocation not supported'); return }
    setGpsLoading(true); setGpsError('')
    navigator.geolocation.getCurrentPosition(
      pos => { setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setSortByDist(true); setGpsLoading(false) },
      ()  => { setGpsError('Could not get location. Please allow access.'); setGpsLoading(false) }
    )
  }

  const handleBook = (doctor, slot, day) => {
    if (!isLoggedIn) { navigate('/login'); return }
    navigate('/appointments/book', { state: { doctor, slot, day } })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-16">

      {/* ── Hero — NO overflow-hidden so nothing gets clipped ── */}
      <div className="relative pt-12 pb-10 px-4"
        style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #0369a1 50%, #0891b2 100%)' }}>

        {/* dot pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative max-w-2xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-4 py-1.5 rounded-full text-sm text-white mb-5 font-medium">
              <Stethoscope className="w-4 h-4" /> Verified Dermatologists Only
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-3">
              Find Your <span className="text-cyan-300">Dermatologist</span>
            </h1>
            <p className="text-blue-100 text-base max-w-md mx-auto">
              Browse verified skin specialists, check ratings &amp; availability, and book in seconds.
            </p>
          </motion.div>

          {/* Search bar */}
          <motion.form onSubmit={e => { e.preventDefault(); fetchDoctors(cityFilter, search) }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="mt-8 flex gap-2 max-w-lg mx-auto">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, specialty, condition..."
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-gray-900 text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
            </div>
            <button type="submit"
              className="px-5 py-3.5 bg-white text-blue-700 font-bold rounded-2xl shadow-lg hover:bg-blue-50 transition text-sm whitespace-nowrap">
              Search
            </button>
          </motion.form>

          {/* GPS button */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mt-4">
            <button onClick={detectLocation} disabled={gpsLoading}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition border disabled:opacity-60
                ${userLocation
                  ? 'bg-emerald-500/20 border-emerald-300/40 text-emerald-200'
                  : 'bg-white/15 border-white/30 text-white hover:bg-white/25'}`}>
              {gpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
              {userLocation ? '✓ Location detected' : 'Use My Location'}
            </button>
            {gpsError && (
              <p className="text-xs text-red-300 mt-2 flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3" />{gpsError}
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── City filter — normal flow, directly below hero, full width ── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm w-full">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2 overflow-x-auto"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <span className="text-xs font-bold text-gray-400 whitespace-nowrap flex-shrink-0 flex items-center gap-1 pr-1">
            <MapPin className="w-3 h-3" /> City:
          </span>
          {['', ...cities].map(city => (
            <button key={city || 'all'} onClick={() => setCityFilter(city)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap flex-shrink-0
                ${cityFilter === city
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-blue-50 hover:text-blue-600'}`}>
              {city || 'All Cities'}
            </button>
          ))}
          {userLocation && (
            <button onClick={() => setSortByDist(v => !v)}
              className={`ml-auto px-4 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap flex-shrink-0
                ${sortByDist ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-blue-50'}`}>
              <Navigation className="w-3 h-3" /> Nearest First
            </button>
          )}
        </div>
      </div>

      {/* ── Results area ── */}
      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            {loading
              ? 'Searching...'
              : `${doctors.length} doctor${doctors.length !== 1 ? 's' : ''} found${cityFilter ? ` in ${cityFilter}` : ''}`}
          </p>
          {doctors.length > 0 && (
            <p className="text-xs text-gray-400 hidden sm:block">Click a card to view details &amp; book</p>
          )}
        </div>

        {/* Cards */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm text-gray-400">Finding doctors...</p>
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-bold text-gray-500 dark:text-gray-400">No doctors found</p>
            <p className="text-sm text-gray-400 mt-1">Try a different search or select another city</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map((doc, i) => (
              <DoctorCard key={doc.id} doctor={doc} index={i} onSelect={setSelected} />
            ))}
          </div>
        )}
      </div>

      {/* Side drawer */}
      <AnimatePresence>
        {selected && (
          <DoctorDrawer
            doctor={selected} onClose={() => setSelected(null)}
            onBook={handleBook} token={token} isLoggedIn={isLoggedIn}
          />
        )}
      </AnimatePresence>
    </div>
  )
}