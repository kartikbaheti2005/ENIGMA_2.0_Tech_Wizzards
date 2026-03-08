import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const API = 'http://localhost:8000'
const AuthContext = createContext(null)

// Axios instance with a 10-second timeout — prevents infinite spinners
// when the backend is slow or unreachable
const api = axios.create({ baseURL: API, timeout: 10000 })

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null)
  const [token, setToken]     = useState(null)   // ✅ Always start null, hydrate in effect
  const [loading, setLoading] = useState(true)

  // ── On mount: verify saved token ──────────────────────────────────────────
  useEffect(() => {
    const savedToken = localStorage.getItem('dermassist_token')
    if (!savedToken) { setLoading(false); return }

    // ✅ First decode the JWT payload (no network call needed)
    let decodedPayload = null
    try { decodedPayload = JSON.parse(atob(savedToken.split('.')[1])) } catch { /* bad token */ }

    if (!decodedPayload) {
      localStorage.removeItem('dermassist_token')
      setLoading(false)
      return
    }

    if (decodedPayload.role === 'doctor') {
      // ✅ Doctor: hydrate from token payload directly — no extra /user/me call
      setUser({
        id:        decodedPayload.doctor_id,
        full_name: decodedPayload.sub,
        username:  decodedPayload.sub,
        email:     decodedPayload.sub,
        role:      'doctor',
      })
      setToken(savedToken)
      setLoading(false)
      return
    }

    // Patient / admin — verify against /user/me with timeout protection
    api.get('/user/me', { headers: { Authorization: `Bearer ${savedToken}` } })
      .then(res => {
        setUser(res.data)
        setToken(savedToken)
      })
      .catch(() => {
        // Token expired, invalid, or server unreachable — clear it
        localStorage.removeItem('dermassist_token')
        setToken(null)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  // ── Register (patient) ────────────────────────────────────────────────────
  const register = async (data) => {
    const res = await api.post('/auth/register', data)
    const newToken = res.data.access_token
    const profileRes = await api.get('/user/me', {
      headers: { Authorization: `Bearer ${newToken}` }
    })
    localStorage.setItem('dermassist_token', newToken)
    setToken(newToken)
    setUser(profileRes.data)
  }

  // ── Login — tries patient first, then doctor ──────────────────────────────
  const login = async (username, password) => {
    let userErr = null
    let docErr  = null

    // 1. Try patient / admin login
    try {
      const formData = new FormData()
      formData.append('username', username)
      formData.append('password', password)
      const res = await api.post('/auth/login', formData)
      const newToken = res.data.access_token
      const profileRes = await api.get('/user/me', {
        headers: { Authorization: `Bearer ${newToken}` }
      })
      localStorage.setItem('dermassist_token', newToken)
      setToken(newToken)
      setUser(profileRes.data)
      return
    } catch (e) {
      userErr = e
    }

    // 2. Try doctor login
    try {
      const res = await api.post('/doctors/login', { username, password })
      const newToken = res.data.access_token
      const doctor   = res.data.doctor
      localStorage.setItem('dermassist_token', newToken)
      setToken(newToken)
      setUser({
        id:           doctor.id,
        full_name:    doctor.name,
        username:     doctor.email,
        email:        doctor.email,
        phone_number: doctor.phone,
        role:         'doctor',
        doctor:       doctor,
      })
      return
    } catch (e) {
      docErr = e
    }

    // 3. Both failed — show the most relevant error
    const docMsg  = docErr?.response?.data?.detail  || ''
    const userMsg = userErr?.response?.data?.detail || ''

    if (docMsg && !docMsg.includes('No doctor account found')) throw docErr
    if (userMsg) throw userErr
    throw { response: { data: { detail: 'Invalid username or password. Please check your credentials.' } } }
  }

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem('dermassist_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      isLoggedIn: !!token && !!user,
      register, login, logout, setUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export default AuthContext