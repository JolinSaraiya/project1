import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Login from './Login';
import AdminLogin from './AdminLogin';
import Dashboard from './Dashboard';
import Upload from './Upload';
import AdminDashboard from './AdminDashboard';


function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("App mounted, checking session...");
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) console.error("Error getting session:", error);
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center text-green-600 font-bold">Initializing Application...</div>;

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
          <Route path="/admin-login" element={!user ? <AdminLogin /> : <Navigate to="/admin" />} />

          <Route path="/dashboard" element={user ? <Dashboard session={{ user }} /> : <Navigate to="/login" />} />
          <Route path="/upload" element={user ? <Upload session={{ user }} /> : <Navigate to="/login" />} />
          <Route path="/admin" element={user ? <AdminDashboard session={{ user }} /> : <Navigate to="/admin-login" />} />

          <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
