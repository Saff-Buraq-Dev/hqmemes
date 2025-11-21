import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Layout from './components/Layout'
import Toaster from './components/Toast'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ConfirmSignup from './pages/ConfirmSignup'
import Feed from './pages/Feed'
import AllMemes from './pages/AllMemes'
import MyMemes from './pages/MyMemes'
import Upload from './pages/Upload'
import Profile from './pages/Profile'

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <>
      <Toaster />
      <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />}
      />
      <Route
        path="/signup"
        element={!isAuthenticated ? <Signup /> : <Navigate to="/" replace />}
      />
      <Route
        path="/confirm-signup"
        element={!isAuthenticated ? <ConfirmSignup /> : <Navigate to="/" replace />}
      />

      {/* Protected routes */}
      <Route
        element={isAuthenticated ? <Layout /> : <Navigate to="/login" replace />}
      >
        <Route path="/" element={<Feed />} />
        <Route path="/memes" element={<AllMemes />} />
        <Route path="/my-memes" element={<MyMemes />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  )
}

export default App

