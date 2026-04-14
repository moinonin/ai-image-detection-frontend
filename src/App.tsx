import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
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
import Privacy from './components/Privacy';
import Terms from './components/Terms';
import Compliance from './components/Compliance';
import AdminEmailHealth from './components/AdminEmailHealth';
import ProvenanceVerify from './components/ProvenanceVerify';
import ProvenanceIssueCertificate from './components/ProvenanceIssueCertificate';
import './App.css';
import Resources from './components/Resources';
import Footer from './components/Footer';
import SubscriptionSuccessHandler from './components/SubscriptionSuccessHandler';
import ToastContainer from './components/ToastContainer';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <div className="app">
            {/* Add SubscriptionSuccessHandler here - it will work on all routes */}
            <SubscriptionSuccessHandler />
            <ToastContainer />
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
              <Route path="/provenance/verify" element={<ProvenanceVerify />} />
              <Route path="/ns-stego/*" element={<StaticDocsRedirect />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/compliance" element={<Compliance />} />
            </Route>
            
            {/* Protected routes - require authentication */}
            <Route path="/*" element={<ProtectedLayout />} />
            </Routes>
          </div>
        </Router>
      </ToastProvider>
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
          <Route path="/provenance/verify" element={<ProvenanceVerify />} />
          <Route path="/ns-stego/*" element={<StaticDocsRedirect />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/compliance" element={<Compliance />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

const StaticDocsRedirect: React.FC = () => {
  const location = useLocation();

  React.useEffect(() => {
    let targetPath = location.pathname;

    if (targetPath.toLowerCase() === '/ns-stego/whitepaper_provenance/') {
      targetPath = '/ns-stego/WHITEPAPER_PROVENANCE/';
    }

    if (!targetPath.endsWith('/')) {
      targetPath = `${targetPath}/`;
    }

    window.location.replace(`${targetPath}index.html${location.search}${location.hash}`);
  }, [location]);

  return null;
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
          <Route path="/provenance/issue-certificate" element={<ProvenanceIssueCertificate />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/admin/email" element={<AdminEmailHealth />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;
