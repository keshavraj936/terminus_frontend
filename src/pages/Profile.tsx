import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth, type User } from '../context/AuthContext';

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  
  const [profile, setProfile] = useState<User | null>(null);
  const [stats, setStats] = useState({ followers_count: 0, following_count: 0, is_following: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = async () => {
    try {
      const targetId = id || currentUser?.id;
      if (!targetId) return;

      const res = await api.get(`profile.php${id ? `?user_id=${id}` : ''}`);
      if (res.data.status === 'success') {
        setProfile(res.data.data);
      } else {
        setError(res.data.message || 'Failed to load profile');
      }

      // Fetch connection stats
      const connRes = await api.get(`connections.php?user_id=${targetId}`);
      if (connRes.data.status === 'success') {
        setStats(connRes.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('media', file);
      const uploadRes = await api.post('upload.php', formData);
      
      if (uploadRes.data.status === 'success') {
        const media_url = uploadRes.data.data.media_url;
        await api.post('profile.php', { avatar_url: media_url });
        fetchProfile(); // refresh
      }
    } catch (err) {
      console.error('Failed to upload avatar', err);
    }
  };

  const handleFollowToggle = async () => {
    if (!profile) return;
    try {
      const res = await api.post('connections.php', { following_id: profile.id });
      if (res.data.status === 'success') {
        setStats({
          ...stats,
          followers_count: res.data.data.followers_count,
          is_following: res.data.data.is_following
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return (
    <div className="animate-fade-up" style={{ maxWidth: '850px', margin: '0 auto', paddingBottom: '4rem' }}>
      <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '32px', border: 'none', boxShadow: 'var(--shadow-hover)' }}>
        <div className="skeleton" style={{ height: '280px', borderRadius: 0, width: '100%' }}></div>
        <div style={{ padding: '0 3rem 4rem 3rem', textAlign: 'center', marginTop: '-80px' }}>
          <div className="skeleton" style={{ width: '160px', height: '160px', margin: '0 auto', border: '8px solid var(--surface)', borderRadius: '50%' }}></div>
          <div className="skeleton" style={{ width: '250px', height: '36px', margin: '1.5rem auto 0.5rem auto' }}></div>
          <div className="skeleton" style={{ width: '180px', height: '20px', margin: '0 auto' }}></div>
          <div style={{ display: 'flex', gap: '3rem', justifyContent: 'center', margin: '2.5rem 0', padding: '2rem 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
            <div className="skeleton" style={{ width: '90px', height: '50px' }}></div>
            <div className="skeleton" style={{ width: '90px', height: '50px' }}></div>
            <div className="skeleton" style={{ width: '90px', height: '50px' }}></div>
          </div>
          <div className="skeleton" style={{ width: '100%', height: '100px', maxWidth: '650px', margin: '0 auto' }}></div>
        </div>
      </div>
    </div>
  );
  
  if (error) return <div className="card animate-fade-up" style={{ color: 'red', marginTop: '4rem' }}>{error}</div>;
  if (!profile) return null;

  const isOwnProfile = !id || Number(id) === currentUser?.id;

  return (
    <div className="animate-fade-up" style={{ maxWidth: '850px', margin: '0 auto', paddingBottom: '4rem' }}>
      <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '32px', border: 'none', boxShadow: 'var(--shadow-hover)' }}>
        
        {/* Banner */}
        <div className="profile-banner" style={{ height: '280px', background: 'var(--text-main)', position: 'relative' }}>
          {isOwnProfile && (
            <div className="hoverable" style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', color: 'white', padding: '0.6rem 1.5rem', borderRadius: '24px', fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.3)' }}>
              Edit Banner
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="profile-avatar-container" style={{ padding: '0 3rem 4rem 3rem', position: 'relative', textAlign: 'center', marginTop: '-80px' }}>
          
          <div className="avatar profile-avatar" style={{ position: 'relative', width: '160px', height: '160px', margin: '0 auto', fontSize: '4rem', border: '8px solid var(--surface)', boxShadow: '0 8px 30px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
            {profile.avatar_url ? (
              <img src={`http://${window.location.hostname}:8000${profile.avatar_url}`} alt="avatar" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
            ) : (
              profile.name.charAt(0).toUpperCase()
            )}
            {isOwnProfile && (
              <div 
                className="hoverable"
                onClick={() => fileInputRef.current?.click()}
                style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', cursor: 'pointer', color: 'white', fontSize: '0.9rem', padding: '0.5rem 0' }}
              >
                📸 Edit
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} hidden accept="image/*" />
          </div>
          
          <h1 className="animate-slide-in delay-100" style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '1.5rem', letterSpacing: '-0.5px' }}>{profile.name}</h1>
          <p className="animate-slide-in delay-200" style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontWeight: 500 }}>{profile.department} Maven • Year {profile.year}</p>
          
          <div className="animate-fade-up delay-300 profile-stats" style={{ display: 'flex', gap: '3rem', justifyContent: 'center', margin: '2.5rem 0', padding: '2rem 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
            <div>
              <strong style={{ fontSize: '1.75rem', color: 'var(--text-main)', display: 'block', fontWeight: 800 }}>Batch {profile.batch}</strong>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '0.5rem', display: 'block' }}>Class Base</span>
            </div>
            <div style={{ width: '1px', background: 'var(--border)' }}></div>
            <div>
              <strong style={{ fontSize: '1.75rem', color: 'var(--text-main)', display: 'block', fontWeight: 800 }}>{stats.followers_count}</strong>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '0.5rem', display: 'block' }}>Followers</span>
            </div>
            <div style={{ width: '1px', background: 'var(--border)' }}></div>
            <div>
              <strong style={{ fontSize: '1.75rem', color: 'var(--text-main)', display: 'block', fontWeight: 800 }}>{stats.following_count}</strong>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '0.5rem', display: 'block' }}>Following</span>
            </div>
          </div>
          
          <div className="animate-fade-up delay-300" style={{ maxWidth: '650px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-main)' }}>About Me</h2>
            <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
              Passionate <strong>{profile.department}</strong> student enthusiastically building the future. I love connecting with ambitious minds and discussing deep tech, design, and innovation. Always open to collaborate on projects or chat over a virtual coffee!
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '3.5rem' }}>
            {isOwnProfile ? (
               <button className="btn" onClick={() => fileInputRef.current?.click()} style={{ padding: '1rem 3rem', borderRadius: '32px', fontSize: '1.1rem', boxShadow: '0 8px 25px rgba(0,0,0,0.15)', alignSelf: 'center' }}>Update Avatar</button>
            ) : (
               <button className="btn" onClick={handleFollowToggle} style={{ padding: '1rem 3rem', borderRadius: '32px', fontSize: '1.1rem', boxShadow: '0 8px 25px rgba(0,0,0,0.15)', alignSelf: 'center', background: stats.is_following ? 'var(--surface)' : 'var(--primary)', color: stats.is_following ? 'var(--primary)' : 'white' }}>
                 {stats.is_following ? 'Following' : 'Follow User'}
               </button>
            )}
            <button className="btn-secondary hoverable" style={{ padding: '1rem 3rem', borderRadius: '32px', fontSize: '1.1rem', border: '2px solid var(--border)' }}>Share Link</button>
          </div>
        </div>
      </div>
    </div>
  );
}
