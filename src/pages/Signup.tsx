import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Signup() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', department: '', year: '', batch: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('signup.php', { ...formData, year: parseInt(formData.year) || null });
      if (res.data.status === 'success') {
        login(res.data.data.user, res.data.data.token);
        addToast('Account created securely! Welcome aboard 🚀', 'success');
        navigate('/feed');
      } else {
        addToast(res.data.message || 'Signup failed', 'error');
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || err.message || 'Server error', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="noise-bg auth-container" style={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>
      
      {/* Right split - Form */}
      <div className="animate-slide-in delay-100" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--surface)', boxShadow: '10px 0 30px rgba(0,0,0,0.05)', position: 'relative', zIndex: 10 }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Create Account</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.05rem' }}>Join the network and start connecting today.</p>
          
          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Full Name</label>
              <input type="text" name="name" className="input-field" onChange={handleChange} required disabled={loading} style={{ height: '48px', background: 'var(--bg-color)', color: 'var(--text-main)' }} />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Email Address</label>
              <input type="email" name="email" className="input-field" onChange={handleChange} required disabled={loading} style={{ height: '48px', background: 'var(--bg-color)', color: 'var(--text-main)' }} />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Password (6+ chars)</label>
              <input type="password" name="password" className="input-field" onChange={handleChange} required disabled={loading} style={{ height: '48px', background: 'var(--bg-color)', color: 'var(--text-main)' }} />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Dept</label>
                <input type="text" name="department" className="input-field" placeholder="CS" onChange={handleChange} required disabled={loading} style={{ height: '48px', background: 'var(--bg-color)', color: 'var(--text-main)' }} />
              </div>
              <div style={{ width: '100px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Year</label>
                <input type="number" name="year" className="input-field" placeholder="1" onChange={handleChange} required disabled={loading} style={{ height: '48px', background: 'var(--bg-color)', color: 'var(--text-main)' }} />
              </div>
              <div style={{ width: '120px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Batch</label>
                <input type="text" name="batch" className="input-field" placeholder="2028" onChange={handleChange} required disabled={loading} style={{ height: '48px', background: 'var(--bg-color)', color: 'var(--text-main)' }} />
              </div>
            </div>
            
            <button type="submit" className="btn" disabled={loading} style={{ width: '100%', height: '52px', marginTop: '1rem', fontSize: '1.05rem', boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}>
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>
          
          <div style={{ textAlign: 'center', marginTop: '2.5rem', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--text-main)', fontWeight: 800 }}>Sign in</Link>
          </div>
        </div>
      </div>

      {/* Left split - Image (Swapped to right side for visual balance) */}
      <div className="animate-fade-up delay-200 auth-hero" style={{ flex: 1.2, position: 'relative', display: 'flex', flexDirection: 'column', padding: '4rem', color: 'white' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'url(/hero-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0, transform: 'scaleX(-1)' }}></div>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(225deg, rgba(0,0,0,0.8), rgba(0,0,0,0.95))', zIndex: 1 }}></div>
        
        <div style={{ zIndex: 2, position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', textAlign: 'right' }}>
          <h1 className="animate-slide-in delay-300" style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-1px' }}>
            Unlock Your <br/> Potential.
          </h1>
          <p className="animate-slide-in delay-300" style={{ fontSize: '1.25rem', opacity: 0.9, maxWidth: '500px', lineHeight: 1.6 }}>
            Gain access to exclusive resources, form study groups, and join a vibrant community of ambitious students.
          </p>
        </div>
      </div>
    </div>
  );
}
