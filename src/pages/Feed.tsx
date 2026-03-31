import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

interface Post {
  id: number;
  content: string;
  media_url: string | null;
  created_at: string;
  user_id: number;
  name: string;
  department: string;
  avatar_url: string | null;
  likes_count: number;
  has_liked: boolean;
  comments_count: number;
}

interface Comment {
  id: number;
  comment: string;
  created_at: string;
  user_id: number;
  name: string;
  avatar_url: string | null;
}

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({});
  const [postComments, setPostComments] = useState<Record<number, Comment[]>>({});
  const [newCommentText, setNewCommentText] = useState<Record<number, string>>({});

  const fetchPosts = async () => {
    try {
      const res = await api.get('get_posts.php');
      if (res.data.status === 'success') {
        setPosts(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch posts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() && !mediaFile) return;
    
    setLoading(true);
    try {
      let media_url = null;
      if (mediaFile) {
        const formData = new FormData();
        formData.append('media', mediaFile);
        const uploadRes = await api.post('upload.php', formData);
        if (uploadRes.data.status === 'success') {
          media_url = uploadRes.data.data.media_url;
        }
      }

      const res = await api.post('create_post.php', { content: newPost, media_url });
      if (res.data.status === 'success') {
        setNewPost('');
        setMediaFile(null);
        fetchPosts();
      }
    } catch (err) {
      console.error('Failed to create post', err);
      setLoading(false);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      const res = await api.post('likes.php', { post_id: postId });
      if (res.data.status === 'success') {
        setPosts(posts.map(p => {
          if (p.id === postId) {
            return { ...p, likes_count: res.data.data.likes_count, has_liked: res.data.data.has_liked };
          }
          return p;
        }));
      }
    } catch(e) {
      console.error(e);
    }
  };

  const toggleComments = async (postId: number) => {
    const isExpanded = expandedComments[postId];
    setExpandedComments({ ...expandedComments, [postId]: !isExpanded });

    if (!isExpanded && !postComments[postId]) {
      try {
        const res = await api.get(`comments.php?post_id=${postId}`);
        if (res.data.status === 'success') {
          setPostComments(prev => ({ ...prev, [postId]: res.data.data }));
        }
      } catch(e) {
        console.error(e);
      }
    }
  };

  const handleAddComment = async (postId: number) => {
    const text = newCommentText[postId];
    if (!text || !text.trim()) return;

    try {
      const res = await api.post('comments.php', { post_id: postId, comment: text });
      if (res.data.status === 'success') {
        setPostComments(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), res.data.data]
        }));
        setNewCommentText({ ...newCommentText, [postId]: '' });
        setPosts(posts.map(p => p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Utility to parse Mentions and Hashtags
  const parseContent = (text: string) => {
    return text.split(/(\s+)/).map((word, i) => {
      if (word.startsWith('@') && word.length > 1) {
        return <span key={i} style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>{word}</span>;
      }
      if (word.startsWith('#') && word.length > 1) {
        return <span key={i} style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>{word}</span>;
      }
      return word;
    });
  };

  const renderAvatar = (url: string | null, name: string) => {
    if (url) {
      return <img src={`http://${window.location.hostname}:8000${url}`} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />;
    }
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="animate-fade-up container" style={{ maxWidth: '1200px' }}>
      <div className="glass-panel" style={{ borderRadius: '24px', padding: '3rem 2.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem', letterSpacing: '-0.5px' }}>
            Welcome back, <span className="hero-gradient-text">{user?.name}</span> 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Ready to conquer today? Here's what's happening on campus.</p>
        </div>
        <button className="btn hoverable" onClick={fetchPosts} style={{ borderRadius: '12px', width: '56px', height: '56px', padding: 0, fontSize: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>↻</button>
      </div>

      <div className="feed-grid">
        <div>
          <div className="card animate-fade-up delay-100" style={{ marginBottom: '2rem', padding: '1.5rem 1.5rem 1rem 1.5rem', borderRadius: '20px' }}>
            <form onSubmit={handleCreatePost} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div className="avatar" style={{ width: '48px', height: '48px', fontSize: '1.2rem', overflow: 'hidden' }}>
                {renderAvatar(user?.avatar_url || null, user?.name || 'U')}
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <textarea 
                  className="input-field" 
                  placeholder="Share a campus update, ask a question, or use #hashtags and @mentions..." 
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  style={{ minHeight: '90px', resize: 'none', padding: '1rem', backgroundColor: 'var(--bg-color)', fontSize: '1.05rem', borderRadius: '16px' }}
                />
                {mediaFile && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--primary)', background: 'rgba(56, 189, 248, 0.1)', padding: '0.5rem 1rem', borderRadius: '8px', display: 'inline-block' }}>
                    📎 {mediaFile.name} <span style={{cursor: 'pointer', marginLeft: '0.5rem'}} onClick={() => setMediaFile(null)}>✖</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '1.25rem', marginLeft: '0.5rem' }}>
                    <span style={{ cursor: 'pointer', transition: 'var(--transition)' }} className="hoverable" onClick={() => fileInputRef.current?.click()}>📎 Photo/Doc</span>
                    <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => e.target.files && setMediaFile(e.target.files[0])} />
                  </div>
                  <button type="submit" className="btn hoverable" disabled={(!newPost.trim() && !mediaFile) || loading} style={{ padding: '0.6rem 2rem', borderRadius: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>Post Spark</button>
                </div>
              </div>
            </form>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {loading ? (
               Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card animate-fade-up" style={{ borderRadius: '20px', padding: '1.5rem', animationDelay: `${i * 100}ms` }}>
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="skeleton" style={{ width: '50px', height: '50px', borderRadius: '50%' }}></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center' }}>
                      <div className="skeleton" style={{ width: '120px', height: '16px' }}></div>
                      <div className="skeleton" style={{ width: '80px', height: '12px' }}></div>
                    </div>
                  </div>
                  <div className="skeleton" style={{ width: '100%', height: '16px', marginBottom: '0.5rem' }}></div>
                  <div className="skeleton" style={{ width: '60%', height: '16px' }}></div>
                </div>
              ))
            ) : posts.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>It's quiet here. Break the ice!</div>
            ) : (
              posts.map((post, index) => (
                <div key={post.id} className={`card hoverable animate-fade-up`} style={{ animationDelay: `${(index % 3) * 100}ms`, borderRadius: '20px' }}>
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
                    <Link to={`/profile/${post.user_id}`} style={{ textDecoration: 'none' }}>
                      <div className="avatar" style={{ width: '50px', height: '50px', fontSize: '1.2rem', overflow: 'hidden' }}>
                        {renderAvatar(post.avatar_url, post.name)}
                      </div>
                    </Link>
                    <div>
                      <Link to={`/profile/${post.user_id}`} style={{ textDecoration: 'none' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, letterSpacing: '-0.25px', color: 'var(--text-main)' }}>{post.name}</h3>
                      </Link>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{post.department} • {new Date(post.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  
                  <p style={{ fontSize: '1.05rem', lineHeight: 1.6, color: 'var(--text-main)', marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>
                    {parseContent(post.content)}
                  </p>

                  {post.media_url && (
                    <div style={{ marginBottom: '1.5rem', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <img src={`http://${window.location.hostname}:8000${post.media_url}`} alt="Post Attachment" style={{ width: '100%', display: 'block' }} />
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
                    <button onClick={() => handleLike(post.id)} className="btn-secondary animate-pop hoverable" style={{ border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', color: post.has_liked ? '#ef4444' : 'var(--text-muted)', fontWeight: 600, padding: '0.6rem 1.25rem', borderRadius: '12px', background: post.has_liked ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-color)', transition: '0.2s' }}>
                      <span style={{ fontSize: '1.1rem' }}>{post.has_liked ? '❤️' : '🤍'}</span> {post.likes_count}
                    </button>
                    <button onClick={() => toggleComments(post.id)} className="btn-secondary hoverable" style={{ border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontWeight: 600, padding: '0.6rem 1.25rem', borderRadius: '12px', background: 'var(--bg-color)', transition: '0.2s' }}>
                      <span style={{ fontSize: '1.1rem' }}>💬</span> {post.comments_count}
                    </button>
                    <button className="btn-secondary hoverable" style={{ border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontWeight: 600, padding: '0.6rem 1.25rem', borderRadius: '12px', background: 'var(--bg-color)' }}>
                      <span style={{ fontSize: '1.1rem' }}>📤</span> Share
                    </button>
                  </div>

                  {/* Comments Section */}
                  {expandedComments[post.id] && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed var(--border)' }} className="animate-fade-up">
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                        <input 
                          type="text" 
                          className="input-field" 
                          placeholder="Write a comment..." 
                          value={newCommentText[post.id] || ''}
                          onChange={e => setNewCommentText({...newCommentText, [post.id]: e.target.value})}
                          onKeyDown={e => e.key === 'Enter' && handleAddComment(post.id)}
                          style={{ flex: 1, padding: '0.5rem 1rem', borderRadius: '20px' }}
                        />
                        <button onClick={() => handleAddComment(post.id)} className="btn" style={{ borderRadius: '20px', padding: '0.5rem 1.5rem' }}>Reply</button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {postComments[post.id]?.map(comment => (
                          <div key={comment.id} style={{ display: 'flex', gap: '0.75rem', background: 'var(--bg-color)', padding: '0.75rem', borderRadius: '12px' }}>
                            <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '0.8rem', overflow: 'hidden' }}>
                               {renderAvatar(comment.avatar_url, comment.name)}
                            </div>
                            <div>
                              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>{comment.name} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.5rem' }}>{new Date(comment.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>
                              <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{parseContent(comment.comment)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar Trending section preserved but moved mostly as is */}
        <div className="animate-fade-up delay-200 trending-sidebar">
           <div className="card hoverable" style={{ position: 'sticky', top: '2rem', padding: '2rem', borderRadius: '24px' }}>
              <div style={{ width: '56px', height: '56px', background: 'var(--text-main)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem', marginBottom: '1.5rem', boxShadow: 'var(--shadow)' }}>
                🚀
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>Trending Topics</h3>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>What students are talking about right now.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '12px', cursor: 'pointer', transition: 'var(--transition)' }} className="hoverable">
                  <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.95rem' }}>#TechFest2026</span>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>4.2k Sparks</div>
                </div>
                <div style={{ padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '12px', cursor: 'pointer', transition: 'var(--transition)' }} className="hoverable">
                  <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.95rem' }}>#Midterms</span>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>2.1k Sparks</div>
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
