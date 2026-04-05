import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth, type User } from '../context/AuthContext';
import AnimatedPage from '../components/AnimatedPage';

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  
  const [profile, setProfile] = useState<User | null>(null);
  const [stats, setStats] = useState({ followers_count: 0, following_count: 0, is_following: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ about_me: '', insta_link: '', github_link: '' });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = async () => {
    try {
      const targetId = id || currentUser?.id;
      if (!targetId) return;

      const res = await api.get(`profile.php${id ? `?user_id=${id}` : ''}`);
      if (res.data.status === 'success') {
        const u = res.data.data;
        setProfile(u);
        setEditData({ about_me: u.about_me || '', insta_link: u.insta_link || '', github_link: u.github_link || '' });
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

  const handleSaveProfile = async () => {
    try {
      const res = await api.post('profile.php', { action: 'update_info', ...editData });
      if (res.data.status === 'success') {
        setProfile((prev) => prev ? { ...prev, ...editData } : null);
        setIsEditing(false);
      }
    } catch(err) {
      console.error(err);
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
      <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '8px', border: '1px solid var(--border)' }}>
        <div className="skeleton" style={{ height: '200px', borderRadius: 0, width: '100%' }}></div>
        <div style={{ padding: '0 3rem 4rem 3rem', textAlign: 'center', marginTop: '-60px' }}>
          <div className="skeleton" style={{ width: '120px', height: '120px', margin: '0 auto', border: '4px solid var(--surface)', borderRadius: '50%' }}></div>
          <div className="skeleton" style={{ width: '250px', height: '36px', margin: '1.5rem auto 0.5rem auto' }}></div>
          <div className="skeleton" style={{ width: '180px', height: '20px', margin: '0 auto' }}></div>
          <div style={{ display: 'flex', gap: '3rem', justifyContent: 'center', margin: '2.5rem 0', padding: '2rem 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
            <div className="skeleton" style={{ width: '90px', height: '50px' }}></div>
            <div className="skeleton" style={{ width: '90px', height: '50px' }}></div>
            <div className="skeleton" style={{ width: '90px', height: '50px' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
  
  if (error) return <div className="card animate-fade-up" style={{ color: 'red', marginTop: '4rem' }}>{error}</div>;
  if (!profile) return null;

  const isOwnProfile = !id || Number(id) === currentUser?.id;

  return (
    <AnimatedPage>
    <div className="animate-fade-up" style={{ maxWidth: '850px', margin: '0 auto', paddingBottom: '4rem' }}>
      <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '8px', border: '1px solid var(--border)' }}>
        
        {/* Banner */}
        <div className="profile-banner" style={{ height: '200px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'relative' }}>
          {isOwnProfile && (
            <div className="hoverable" style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'var(--bg-color)', color: 'var(--text-main)', padding: '0.5rem 1rem', borderRadius: '4px', fontWeight: 600, cursor: 'pointer', border: '1px solid var(--border)', fontSize: '0.85rem' }}>
              Edit Banner
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="profile-avatar-container" style={{ padding: '0 3rem 4rem 3rem', position: 'relative', textAlign: 'center', marginTop: '-60px' }}>
          
          <div className="avatar profile-avatar" style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto', fontSize: '3rem', border: '4px solid var(--surface)', overflow: 'hidden' }}>
            {profile.avatar_url ? (
              <img src={`${import.meta.env.VITE_API_URL}${profile.avatar_url}`} alt="avatar" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
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
            <div className="stat-box">
              <strong style={{ fontSize: '1.75rem', color: 'var(--text-main)', display: 'block', fontWeight: 800 }}>Batch {profile.batch}</strong>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '0.5rem', display: 'block' }}>Class Base</span>
            </div>
            <div className="stat-divider" style={{ width: '1px', background: 'var(--border)' }}></div>
            <div className="stat-box">
              <strong style={{ fontSize: '1.75rem', color: 'var(--text-main)', display: 'block', fontWeight: 800 }}>{stats.followers_count}</strong>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '0.5rem', display: 'block' }}>Followers</span>
            </div>
            <div className="stat-divider" style={{ width: '1px', background: 'var(--border)' }}></div>
            <div className="stat-box">
              <strong style={{ fontSize: '1.75rem', color: 'var(--text-main)', display: 'block', fontWeight: 800 }}>{stats.following_count}</strong>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '0.5rem', display: 'block' }}>Following</span>
            </div>
          </div>
          
          <div className="animate-fade-up delay-300" style={{ maxWidth: '650px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-main)' }}>About Me</h2>
            {isEditing ? (
              <textarea 
                value={editData.about_me} 
                onChange={(e) => setEditData({...editData, about_me: e.target.value})}
                className="input-field" 
                style={{ width: '100%', minHeight: '120px', background: 'var(--bg-color)', color: 'var(--text-main)', border: '1px solid var(--border)' }} 
                placeholder="Write something about yourself..."
              />
            ) : (
              <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
                {profile.about_me ? profile.about_me : `Passionate ${profile.department} student enthusiastically building the future.`}
              </p>
            )}

            {isEditing ? (
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'center' }}>
                <input type="text" value={editData.insta_link} onChange={e => setEditData({...editData, insta_link: e.target.value})} placeholder="Instagram URL/Username" className="input-field" style={{ background: 'var(--bg-color)', border: '1px solid var(--border)' }} />
                <input type="text" value={editData.github_link} onChange={e => setEditData({...editData, github_link: e.target.value})} placeholder="GitHub URL/Username" className="input-field" style={{ background: 'var(--bg-color)', border: '1px solid var(--border)' }} />
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                {profile.email && <a href={`mailto:${profile.email}`} className="badge" style={{ padding: '0.5rem 1rem', borderRadius: '4px', fontSize: '0.85rem', color: 'var(--text-main)', background: 'var(--surface)', border: '1px solid var(--border)', textDecoration: 'none' }}>Email</a>}
                {profile.insta_link && <a href={profile.insta_link.includes('http') ? profile.insta_link : `https://instagram.com/${profile.insta_link}`} target="_blank" rel="noopener noreferrer" className="badge" style={{ padding: '0.5rem 1rem', borderRadius: '4px', fontSize: '0.85rem', color: 'var(--text-main)', background: 'var(--surface)', border: '1px solid var(--border)', textDecoration: 'none' }}>Instagram</a>}
                {profile.github_link && <a href={profile.github_link.includes('http') ? profile.github_link : `https://github.com/${profile.github_link}`} target="_blank" rel="noopener noreferrer" className="badge" style={{ padding: '0.5rem 1rem', borderRadius: '4px', fontSize: '0.85rem', color: 'var(--text-main)', background: 'var(--surface)', border: '1px solid var(--border)', textDecoration: 'none' }}>GitHub</a>}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '3rem' }}>
            {isOwnProfile ? (
               <>
                 {isEditing ? (
                   <button className="btn" onClick={handleSaveProfile}>Save Profile</button>
                 ) : (
                   <button className="btn" onClick={() => setIsEditing(true)}>Edit Profile</button>
                 )}
               </>
            ) : (
               <button className="btn" onClick={handleFollowToggle} style={{ background: stats.is_following ? 'transparent' : 'var(--primary)', color: stats.is_following ? 'var(--text-main)' : '#111', border: stats.is_following ? '1px solid var(--border)' : 'none' }}>
                 {stats.is_following ? 'Following' : 'Follow User'}
               </button>
            )}
            <button className="btn btn-secondary">Share Link</button>
          </div>
        </div>
      </div>
    </div>
    </AnimatedPage>
  );
}
