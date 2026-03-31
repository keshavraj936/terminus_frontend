import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await api.post('login.php', { email, password });
      
      if (res.data.status === 'success') {
        login(res.data.data.user, res.data.data.token);
        addToast('Welcome back to the loop!', 'success');
        navigate('/feed');
      } else {
        addToast(res.data.message || 'Login failed', 'error');
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || err.message || 'Server error', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="noise-bg auth-container" style={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Left split - Image */}
      <div className="animate-fade-up auth-hero" style={{ flex: 1.2, position: 'relative', display: 'flex', flexDirection: 'column', padding: '4rem', color: 'white' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'url(/hero-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0 }}></div>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.8), rgba(0,0,0,0.95))', zIndex: 1 }}></div>
        
        <div style={{ zIndex: 2, position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ width: '60px', height: '60px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.2)' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white' }}>CC</span>
          </div>
          <h1 className="animate-slide-in delay-100" style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-1px' }}>
            Where Campus <br/> Meets the Future.
          </h1>
          <p className="animate-slide-in delay-200" style={{ fontSize: '1.25rem', opacity: 0.9, maxWidth: '500px', lineHeight: 1.6 }}>
            Join the most vibrant university network. Connect with peers, share ideas, and elevate your academic journey.
          </p>
        </div>
      </div>
      
      {/* Right split - Form */}
      <div className="animate-slide-in delay-300" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--surface)', boxShadow: '-10px 0 30px rgba(0,0,0,0.05)', position: 'relative', zIndex: 10 }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Welcome back</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '1.05rem' }}>Enter your details to access your account.</p>
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Email address</label>
              <input type="email" className="input-field" placeholder="you@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} style={{ height: '52px', fontSize: '1.05rem', background: 'var(--bg-color)', color: 'var(--text-main)' }} />
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Password</label>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 800, cursor: 'pointer' }}>Forgot?</span>
              </div>
              <input type="password" className="input-field" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} style={{ height: '52px', fontSize: '1.05rem', background: 'var(--bg-color)', color: 'var(--text-main)' }} />
            </div>
            
            <button type="submit" className="btn" disabled={loading} style={{ height: '52px', marginTop: '1rem', fontSize: '1.05rem', width: '100%', boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}>
              {loading ? 'Authenticating...' : 'Sign in to account'}
            </button>
          </form>
          
          <div style={{ textAlign: 'center', marginTop: '2.5rem', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
            Don't have an account? <Link to="/signup" style={{ color: 'var(--text-main)', fontWeight: 800 }}>Create one now</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
