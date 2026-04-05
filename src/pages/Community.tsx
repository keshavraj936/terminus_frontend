import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Classmate {
  id: number;
  name: string;
  department: string;
  section: string | null;
  avatar_url: string | null;
  is_following: boolean;
}

export default function Community() {
  const { user } = useAuth();
  const [classmates, setClassmates] = useState<Classmate[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<'local' | 'all'>('local');

  const fetchClassmates = async () => {
    setLoading(true);
    try {
      const res = await api.get(`get_users.php?scope=${scope}`);
      if (res.data.status === 'success') {
        setClassmates(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch classmates', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassmates();
  }, [scope]);

  const handleFollowToggle = async (userId: number) => {
    try {
      const res = await api.post('connections.php', { following_id: userId });
      if (res.data.status === 'success') {
        setClassmates((prev) => prev.map((c) => {
          if (c.id === userId) {
            return { ...c, is_following: res.data.data.is_following };
          }
          return c;
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const renderAvatar = (url: string | null, name: string) => {
    if (url) {
      return <img src={`${import.meta.env.VITE_API_URL}${url}`} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />;
    }
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="animate-fade-up container" style={{ maxWidth: '1200px', margin: '0 auto', paddingTop: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem', letterSpacing: '-0.5px' }}>
              {scope === 'local' ? `${user?.department || 'Unknown'} ${user?.section ? `- Sec ${user?.section}` : ''}` : 'Global'} Directory
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
              {scope === 'local' ? 'Discover and connect with peers perfectly matched to your section.' : 'Discover and connect with students across all departments and sections.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--surface)', padding: '0.25rem', borderRadius: '8px' }}>
             <button onClick={() => setScope('local')} className={`btn ${scope === 'local' ? '' : 'btn-secondary'}`} style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', background: scope === 'local' ? 'var(--primary)' : 'transparent', color: scope === 'local' ? '#111' : 'var(--text-main)', fontSize: '0.85rem' }}>My Section</button>
             <button onClick={() => setScope('all')} className={`btn ${scope === 'all' ? '' : 'btn-secondary'}`} style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', background: scope === 'all' ? 'var(--primary)' : 'transparent', color: scope === 'all' ? '#111' : 'var(--text-main)', fontSize: '0.85rem' }}>Global</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-fade-up" style={{ borderRadius: '20px', padding: '2rem', textAlign: 'center', animationDelay: `${i * 100}ms` }}>
              <div className="skeleton" style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 1rem auto' }}></div>
              <div className="skeleton" style={{ width: '120px', height: '20px', margin: '0 auto 0.5rem auto' }}></div>
              <div className="skeleton" style={{ width: '80px', height: '16px', margin: '0 auto 1.5rem auto' }}></div>
              <div className="skeleton" style={{ width: '100%', height: '44px', borderRadius: '24px' }}></div>
            </div>
          ))
        ) : classmates.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            {scope === 'local' ? 'You are the first one in your section to join! Invite your classmates!' : 'No users found.'}
          </div>
        ) : (
          classmates.map((classmate, index) => (
            <div key={classmate.id} className="card hoverable animate-fade-up" style={{ borderRadius: '8px', padding: '2rem', textAlign: 'center', animationDelay: `${(index % 6) * 100}ms` }}>
              <Link to={`/profile/${classmate.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="avatar" style={{ width: '60px', height: '60px', fontSize: '1.5rem', overflow: 'hidden', margin: '0 auto 1rem auto' }}>
                  {renderAvatar(classmate.avatar_url, classmate.name)}
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: 'var(--text-main)' }}>{classmate.name}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{classmate.department} {classmate.section ? `• Sec ${classmate.section}` : ''}</p>
              </Link>
              
              <button 
                onClick={() => handleFollowToggle(classmate.id)}
                className="btn hoverable" 
                style={{ 
                  width: '100%', 
                  padding: '0.5rem', 
                  borderRadius: '4px', 
                  background: classmate.is_following ? 'transparent' : 'var(--primary)', 
                  color: classmate.is_following ? 'var(--text-muted)' : '#111',
                  border: classmate.is_following ? '1px solid var(--border)' : 'none',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}
              >
                {classmate.is_following ? 'Following' : 'Follow'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
