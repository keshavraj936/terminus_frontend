import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE = `${import.meta.env.VITE_API_URL}/admin_panel.php`;
const ADMIN_SECRET = 'cc_admin_secret_2024_keshav';
const SESSION_KEY = 'admin_unlocked';

const adminApi = axios.create({ baseURL: API_BASE });
adminApi.defaults.headers.common['X-Admin-Key'] = ADMIN_SECRET;

// ─── Types ────────────────────────────────────────────────────────────────────
interface Stats {
  users: number; posts: number; comments: number; likes: number;
  top_dept: string; recent_posts: RecentPost[];
}
interface RecentPost { id: number; content: string; created_at: string; author: string; department: string; }
interface UserRow { id: number; name: string; email: string; department: string; section: string; year: number; batch: string; created_at: string; }
interface PostRow { id: number; content: string; media_url: string | null; created_at: string; author_name: string; author_email: string; department: string; likes_count: number; comments_count: number; }

// ─── Lock Screen ─────────────────────────────────────────────────────────────
function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTimeout(() => {
      if (email === 'keshav@admin.com' && pass === 'keshav@admin') {
        sessionStorage.setItem(SESSION_KEY, 'true');
        onUnlock();
      } else {
        setError('Invalid credentials. Access denied.');
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0a0a0a', fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        width: '100%', maxWidth: '420px', padding: '0 1.5rem'
      }}>
        <div style={{
          background: '#111', border: '1px solid #1f1f1f', borderRadius: '20px',
          padding: '3rem 2.5rem', boxShadow: '0 25px 60px rgba(0,0,0,0.8)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{
              width: '64px', height: '64px', background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)', borderRadius: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem', fontSize: '1.8rem'
            }}>🛡️</div>
            <h1 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 800, margin: '0 0 0.5rem' }}>Admin Console</h1>
            <p style={{ color: '#555', fontSize: '0.9rem', margin: 0 }}>Restricted Access — Authorized Personnel Only</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', color: '#888', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="admin@example.com"
                style={{
                  width: '100%', padding: '0.85rem 1rem', background: '#1a1a1a',
                  border: '1px solid #2a2a2a', borderRadius: '10px', color: '#fff',
                  fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#888', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
              <input
                type="password" value={pass} onChange={e => setPass(e.target.value)} required
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '0.85rem 1rem', background: '#1a1a1a',
                  border: '1px solid #2a2a2a', borderRadius: '10px', color: '#fff',
                  fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#ef4444', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              marginTop: '0.5rem', padding: '0.9rem', background: loading ? '#333' : '#ef4444',
              color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700,
              fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              transition: 'background 0.2s'
            }}>
              {loading ? 'Verifying...' : 'Access Console'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color }: { label: string; value: number | string; icon: string; color: string }) {
  return (
    <div style={{
      background: '#111', border: '1px solid #1f1f1f', borderRadius: '16px',
      padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem'
    }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '12px',
        background: `${color}20`, border: `1px solid ${color}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0
      }}>{icon}</div>
      <div>
        <div style={{ color: '#555', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 800 }}>{value}</div>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function useToastAdmin() {
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const show = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };
  return { toast, show };
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────
function DashboardTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.get('', { params: { action: 'stats' } })
      .then(r => { if (r.data.status === 'success') setStats(r.data.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (!stats) return <div style={{ color: '#555' }}>Failed to load stats.</div>;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="Total Users" value={stats.users} icon="👥" color="#6366f1" />
        <StatCard label="Total Posts" value={stats.posts} icon="📝" color="#f59e0b" />
        <StatCard label="Comments" value={stats.comments} icon="💬" color="#10b981" />
        <StatCard label="Likes" value={stats.likes} icon="❤️" color="#ef4444" />
      </div>

      <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: '16px', padding: '1.5rem' }}>
        <h3 style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 1.25rem', fontWeight: 600 }}>Recent Activity</h3>
        {stats.recent_posts.length === 0 ? (
          <p style={{ color: '#555' }}>No posts yet.</p>
        ) : (
          stats.recent_posts.map(p => (
            <div key={p.id} style={{ padding: '0.85rem 0', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div>
                <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>{p.author}</span>
                <span style={{ color: '#555', fontSize: '0.85rem' }}> · {p.department}</span>
                <p style={{ color: '#aaa', fontSize: '0.9rem', margin: '0.25rem 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '400px' }}>{p.content}</p>
              </div>
              <span style={{ color: '#555', fontSize: '0.8rem', whiteSpace: 'nowrap', flexShrink: 0 }}>{new Date(p.created_at).toLocaleDateString()}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab({ showToast }: { showToast: (m: string, t: 'success' | 'error') => void }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback((q = '') => {
    setLoading(true);
    adminApi.get('', { params: { action: 'users', search: q } })
      .then(r => { if (r.data.status === 'success') setUsers(r.data.data); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchUsers(search); };

  const deleteUser = async (id: number, name: string) => {
    if (!confirm(`Permanently delete "${name}"?\nAll their posts will also be deleted.`)) return;
    try {
      const r = await adminApi.post('', { action: 'delete_user', id });
      if (r.data.status === 'success') {
        showToast(r.data.message, 'success');
        setUsers(users.filter(u => u.id !== id));
      } else { showToast(r.data.message, 'error'); }
    } catch { showToast('Delete failed', 'error'); }
  };

  return (
    <div>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email or department..."
          style={{ flex: 1, padding: '0.75rem 1rem', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '10px', color: '#fff', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' }} />
        <button type="submit" style={{ padding: '0.75rem 1.5rem', background: '#333', color: '#fff', border: '1px solid #444', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Search</button>
        <button type="button" onClick={() => { setSearch(''); fetchUsers(''); }} style={{ padding: '0.75rem 1rem', background: 'transparent', color: '#555', border: '1px solid #2a2a2a', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit' }}>Reset</button>
      </form>

      {loading ? <Loader /> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2a2a2a' }}>
                {['#', 'Name', 'Email', 'Department', 'Section', 'Year', 'Joined', 'Action'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', color: '#555', fontWeight: 600, textAlign: 'left', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#555' }}>No users found.</td></tr>
              ) : users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #1a1a1a' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#151515')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '0.85rem 1rem', color: '#555' }}>{u.id}</td>
                  <td style={{ padding: '0.85rem 1rem', color: '#fff', fontWeight: 600 }}>{u.name}</td>
                  <td style={{ padding: '0.85rem 1rem', color: '#888' }}>{u.email}</td>
                  <td style={{ padding: '0.85rem 1rem', color: '#aaa' }}>{u.department || '—'}</td>
                  <td style={{ padding: '0.85rem 1rem', color: '#aaa' }}>{u.section || '—'}</td>
                  <td style={{ padding: '0.85rem 1rem', color: '#aaa' }}>{u.year || '—'}</td>
                  <td style={{ padding: '0.85rem 1rem', color: '#555', whiteSpace: 'nowrap' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <button onClick={() => deleteUser(u.id, u.name)} style={{
                      padding: '0.4rem 0.9rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                      border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', cursor: 'pointer',
                      fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit'
                    }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ color: '#555', fontSize: '0.8rem', marginTop: '1rem' }}>{users.length} user{users.length !== 1 ? 's' : ''} found</div>
        </div>
      )}
    </div>
  );
}

// ─── Posts Tab ────────────────────────────────────────────────────────────────
function PostsTab({ showToast }: { showToast: (m: string, t: 'success' | 'error') => void }) {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchPosts = useCallback((q = '') => {
    setLoading(true);
    adminApi.get('', { params: { action: 'posts', search: q } })
      .then(r => { if (r.data.status === 'success') setPosts(r.data.data); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchPosts(search); };

  const deletePost = async (id: number) => {
    if (!confirm('Permanently delete this post?')) return;
    try {
      const r = await adminApi.post('', { action: 'delete_post', id });
      if (r.data.status === 'success') {
        showToast(r.data.message, 'success');
        setPosts(posts.filter(p => p.id !== id));
      } else { showToast(r.data.message, 'error'); }
    } catch { showToast('Delete failed', 'error'); }
  };

  return (
    <div>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by content or author name..."
          style={{ flex: 1, padding: '0.75rem 1rem', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '10px', color: '#fff', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' }} />
        <button type="submit" style={{ padding: '0.75rem 1.5rem', background: '#333', color: '#fff', border: '1px solid #444', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Search</button>
        <button type="button" onClick={() => { setSearch(''); fetchPosts(''); }} style={{ padding: '0.75rem 1rem', background: 'transparent', color: '#555', border: '1px solid #2a2a2a', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit' }}>Reset</button>
      </form>

      {loading ? <Loader /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {posts.length === 0 ? <p style={{ color: '#555' }}>No posts found.</p> : posts.map(p => (
            <div key={p.id} style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: '14px', padding: '1.25rem', transition: 'border-color 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>{p.author_name}</span>
                    <span style={{ color: '#555', fontSize: '0.85rem' }}>{p.author_email}</span>
                    {p.department && <span style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '0.15rem 0.5rem', color: '#888', fontSize: '0.75rem' }}>{p.department}</span>}
                  </div>
                  <p style={{ color: '#ccc', fontSize: '0.9rem', margin: 0, lineHeight: 1.5, overflow: expandedId === p.id ? 'visible' : 'hidden', textOverflow: expandedId === p.id ? 'clip' : 'ellipsis', whiteSpace: expandedId === p.id ? 'normal' : 'nowrap' }}>
                    {p.content}
                  </p>
                  {p.content.length > 80 && (
                    <button onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                      style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '0.8rem', cursor: 'pointer', padding: '0.25rem 0', fontFamily: 'inherit' }}>
                      {expandedId === p.id ? 'Show less' : 'Show more'}
                    </button>
                  )}
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
                    <span style={{ color: '#555', fontSize: '0.8rem' }}>❤️ {p.likes_count}</span>
                    <span style={{ color: '#555', fontSize: '0.8rem' }}>💬 {p.comments_count}</span>
                    {p.media_url && <span style={{ color: '#555', fontSize: '0.8rem' }}>🖼️ Has media</span>}
                    <span style={{ color: '#555', fontSize: '0.8rem' }}>{new Date(p.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <button onClick={() => deletePost(p.id)} style={{
                  padding: '0.5rem 1rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                  border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', cursor: 'pointer',
                  fontSize: '0.85rem', fontWeight: 600, fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0
                }}>Delete</button>
              </div>
            </div>
          ))}
          <div style={{ color: '#555', fontSize: '0.8rem', marginTop: '0.5rem' }}>{posts.length} post{posts.length !== 1 ? 's' : ''} found</div>
        </div>
      )}
    </div>
  );
}

// ─── Mess Tab ─────────────────────────────────────────────────────────────────
function MessTab({ showToast }: { showToast: (m: string, t: 'success' | 'error') => void }) {
  const [menu, setMenu] = useState<{ day: string; meal_type: string; items: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // New States
  const [jsonInput, setJsonInput] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  useEffect(() => {
    adminApi.get('', { params: { action: 'mess' } })
      .then(r => { if (r.data.status === 'success') setMenu(r.data.data); })
      .finally(() => setLoading(false));
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; 
    if (!f) return;
    if (!f.name.endsWith('.json')) { showToast('Please upload a .json file', 'error'); return; }
    try {
      const text = await f.text();
      const parsed = JSON.parse(text);
      setJsonInput(JSON.stringify(parsed, null, 2));
      setPreviewMode(false);
    } catch {
      showToast('Invalid JSON file', 'error');
    }
    e.target.value = '';
  };

  const handlePreview = () => {
    if (!jsonInput.trim()) {
      setPreviewMode(false);
      setPreviewData(null);
      return;
    }
    try {
      const parsed = JSON.parse(jsonInput);
      setPreviewData(parsed);
      setPreviewMode(true);
      showToast('Preview loaded successfully', 'success');
    } catch {
      showToast('Invalid JSON syntax', 'error');
      setPreviewMode(false);
    }
  };

  const handleUpload = async () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!confirm('This will REPLACE the entire mess routine. Continue?')) return;
      setUploading(true);
      const r = await adminApi.post('', { action: 'upload_mess', menu: parsed });
      if (r.data.status === 'success') {
        showToast('Mess routine deployed!', 'success');
        setJsonInput('');
        setPreviewMode(false);
        const r2 = await adminApi.get('', { params: { action: 'mess' } });
        if (r2.data.status === 'success') setMenu(r2.data.data);
      } else { showToast(r.data.message, 'error'); }
    } catch (err: any) { 
      console.error(err);
      showToast(err.response?.data?.message || err.message || 'Upload failed', 'error'); 
    }
    finally { setUploading(false); }
  };

  // Group menu by day
  let grouped: Record<string, Record<string, string>> = {};
  
  if (previewMode && previewData) {
    grouped = previewData;
  } else {
    menu.forEach(item => {
      if (!grouped[item.day]) grouped[item.day] = {};
      grouped[item.day][item.meal_type] = item.items;
    });
  }

  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const mealOrder = ['breakfast', 'lunch', 'lunch_international', 'snacks', 'dinner'];
  const mealLabel: Record<string, string> = {
    breakfast: '🌅 Breakfast', lunch: '🍱 Lunch', lunch_international: '🌍 Intl. Lunch',
    snacks: '🫙 Snacks', dinner: '🌙 Dinner'
  };

  if (loading) return <Loader />;

  return (
    <div>
      {/* Editor zone */}
      <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ color: '#fff', margin: 0, fontWeight: 700 }}>Direct JSON Input</h3>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <label style={{ cursor: 'pointer', padding: '0.5rem 1rem', background: 'transparent', color: '#6366f1', border: '1px solid #6366f1', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, fontFamily: 'inherit' }}>
              Import .json
              <input type="file" accept=".json" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
            <button onClick={handlePreview} style={{ cursor: 'pointer', padding: '0.5rem 1rem', background: '#333', color: '#fff', border: '1px solid #444', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, fontFamily: 'inherit' }}>
              Preview Menu
            </button>
            <button onClick={handleUpload} disabled={uploading || !jsonInput.trim()} style={{ cursor: uploading || !jsonInput.trim() ? 'not-allowed' : 'pointer', padding: '0.5rem 1rem', background: uploading || !jsonInput.trim() ? '#444' : '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, fontFamily: 'inherit' }}>
              {uploading ? 'Deploying...' : 'Deploy to Live'}
            </button>
          </div>
        </div>
        
        <textarea
          value={jsonInput}
          onChange={(e) => { setJsonInput(e.target.value); setPreviewMode(false); }}
          placeholder="Paste your JSON schedule here..."
          style={{ width: '100%', minHeight: '200px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#10b981', padding: '1rem', fontFamily: 'monospace', fontSize: '0.85rem', resize: 'vertical' }}
        />
        <p style={{ color: '#555', fontSize: '0.8rem', margin: '0.75rem 0 0' }}>
          Format example: {`{ "Monday": { "date": "6-Apr-26", "breakfast": "...", "lunch": "...", "lunch_international": "..." } }`}
        </p>
      </div>

      {/* Visual Menu display */}
      <h3 style={{ color: '#fff', margin: '0 0 1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {previewMode ? <span style={{ color: '#10b981' }}>Previewing Local Data</span> : <span>Live Menu Data</span>}
      </h3>
      
      {(!previewMode && menu.length === 0) || (previewMode && (!grouped || Object.keys(grouped).length === 0)) ? (
        <p style={{ color: '#555', padding: '2rem', textAlign: 'center', border: '1px dashed #2a2a2a', borderRadius: '16px' }}>No routine found.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          {dayOrder.filter(d => grouped[d]).map(day => (
            <div key={day} style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: '14px', overflow: 'hidden' }}>
              <div style={{ padding: '0.85rem 1.25rem', background: '#151515', borderBottom: '1px solid #1f1f1f' }}>
                <h4 style={{ margin: 0, color: '#fff', fontWeight: 700 }}>
                  {day} {grouped[day]?.date && <span style={{ fontSize: '0.8rem', color: '#888', marginLeft: '0.5rem', fontWeight: 500 }}>({grouped[day].date})</span>}
                </h4>
              </div>
              <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {mealOrder.filter(m => grouped[day]?.[m]).map(meal => (
                  <div key={meal}>
                    <div style={{ color: '#888', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
                      {mealLabel[meal] || meal}
                    </div>
                    <div style={{ color: '#ccc', fontSize: '0.9rem' }}>{grouped[day][meal]}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Loader ───────────────────────────────────────────────────────────────────
function Loader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
      <div style={{ width: '32px', height: '32px', border: '3px solid #2a2a2a', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
}

// ─── Main Admin Console ───────────────────────────────────────────────────────
const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'users', label: 'Users', icon: '👥' },
  { id: 'posts', label: 'Posts', icon: '📝' },
  { id: 'mess', label: 'Mess Routine', icon: '🍽️' },
] as const;
type TabId = typeof TABS[number]['id'];

function Console({ onLock }: { onLock: () => void }) {
  const [tab, setTab] = useState<TabId>('dashboard');
  const { toast, show: showToast } = useToastAdmin();

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', fontFamily: "'Inter', sans-serif", color: '#fff' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } * { box-sizing: border-box; }`}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999,
          padding: '0.85rem 1.25rem', borderRadius: '12px', fontWeight: 600, fontSize: '0.9rem',
          background: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
          border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
          color: toast.type === 'success' ? '#10b981' : '#ef4444',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
        }}>{toast.msg}</div>
      )}

      {/* Top Bar */}
      <div style={{ height: '60px', background: '#111', borderBottom: '1px solid #1f1f1f', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.1rem' }}>🛡️</span>
          <span style={{ fontWeight: 800, fontSize: '1rem' }}>Terminus <span style={{ color: '#ef4444' }}>Admin</span></span>
        </div>
        <button onClick={onLock} style={{
          padding: '0.4rem 1rem', background: 'transparent', color: '#555',
          border: '1px solid #2a2a2a', borderRadius: '8px', cursor: 'pointer',
          fontFamily: 'inherit', fontSize: '0.85rem'
        }}>Lock Console</button>
      </div>

      <div style={{ display: 'flex' }}>
        {/* Sidebar */}
        <aside style={{ width: '220px', minHeight: 'calc(100vh - 60px)', background: '#111', borderRight: '1px solid #1f1f1f', padding: '1.5rem 0', position: 'sticky', top: '60px', alignSelf: 'flex-start' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              width: '100%', padding: '0.8rem 1.5rem', background: tab === t.id ? 'rgba(99,102,241,0.1)' : 'transparent',
              color: tab === t.id ? '#6366f1' : '#555', border: 'none',
              borderLeft: `3px solid ${tab === t.id ? '#6366f1' : 'transparent'}`,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem',
              fontWeight: tab === t.id ? 700 : 500, fontSize: '0.9rem', fontFamily: 'inherit',
              textAlign: 'left', transition: '0.15s'
            }}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </aside>

        {/* Content */}
        <main style={{ flex: 1, padding: '2rem', minWidth: 0 }}>
          <h2 style={{ color: '#fff', fontWeight: 800, margin: '0 0 1.75rem', fontSize: '1.5rem' }}>
            {TABS.find(t => t.id === tab)?.label}
          </h2>
          {tab === 'dashboard' && <DashboardTab />}
          {tab === 'users' && <UsersTab showToast={showToast} />}
          {tab === 'posts' && <PostsTab showToast={showToast} />}
          {tab === 'mess' && <MessTab showToast={showToast} />}
        </main>
      </div>
    </div>
  );
}

// ─── Root Export ──────────────────────────────────────────────────────────────
export default function Admin() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === 'true');

  const handleLock = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setUnlocked(false);
  };

  if (!unlocked) return <LockScreen onUnlock={() => setUnlocked(true)} />;
  return <Console onLock={handleLock} />;
}
