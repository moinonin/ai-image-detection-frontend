import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import SingleClassification from './components/SingleClassification';
import BatchClassification from './components/BatchClassification';
import VideoClassification from './components/VideoClassification';
import UserProfile from './components/UserProfile';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Pricing from './components/Pricing';
import About from './components/About';
import './App.css';
import Resources from './components/Resources';
import Footer from './components/Footer';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            {/* Public routes - accessible without authentication */}
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<Home />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/resources" element={<Resources />} />
            </Route>
            
            {/* Protected routes - require authentication */}
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

const PublicLayout: React.FC = () => {
  return (
    <div className="public-layout">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/resources" element={<Resources />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

const ProtectedLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="protected-layout">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/single" element={<SingleClassification />} />
          <Route path="/batch" element={<BatchClassification />} />
          <Route path="/videos" element={<VideoClassification />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;