import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import AnimatedPage from '../components/AnimatedPage';
import { Heart, MessageSquare, Share2, Image as ImageIcon, Code, Calendar } from 'lucide-react';

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
  const location = useLocation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({});
  const [postComments, setPostComments] = useState<Record<number, Comment[]>>({});
  const [newCommentText, setNewCommentText] = useState<Record<number, string>>({});
  const [showNewPostModal, setShowNewPostModal] = useState(false);

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

  useEffect(() => {
    if (location.state?.openNewPost) {
      setShowNewPostModal(true);
      // Clean up state so it doesn't reopen on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleCreatePost = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
        setShowNewPostModal(false);
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
      return <img src={`${import.meta.env.VITE_API_URL}${url}`} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />;
    }
    return name.charAt(0).toUpperCase();
  };

  return (
    <AnimatedPage>
    {/* Hidden trigger that sidebar 'New Post' button clicks */}
    <button id="global-new-post" style={{ display: 'none' }} onClick={() => setShowNewPostModal(true)} />

    {/* New Post Modal */}
    {showNewPostModal && (
      <div
        onClick={() => setShowNewPostModal(false)}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem'
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          className="card animate-fade-up"
          style={{ width: '100%', maxWidth: '560px', borderRadius: '8px', padding: '2rem' }}
        >
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-main)' }}>New Post</h3>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div className="avatar" style={{ width: '40px', height: '40px', fontSize: '1rem', overflow: 'hidden', flexShrink: 0 }}>
              {renderAvatar(user?.avatar_url || null, user?.name || 'U')}
            </div>
            <div style={{ flex: 1 }}>
              <textarea
                autoFocus
                placeholder="What's on your mind?"
                value={newPost}
                onChange={e => setNewPost(e.target.value)}
                style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.05rem', outline: 'none', resize: 'none', minHeight: '120px', lineHeight: 1.6 }}
              />
            </div>
          </div>

          {mediaFile && (
            <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--primary)', background: 'rgba(184,205,239,0.1)', padding: '0.4rem 0.8rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              {mediaFile.name} <span style={{ cursor: 'pointer' }} onClick={() => setMediaFile(null)}>✖</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)' }}>
              <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.5px' }} onClick={() => fileInputRef.current?.click()}>
                <ImageIcon size={15} /> MEDIA
              </span>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={e => e.target.files && setMediaFile(e.target.files[0])} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setShowNewPostModal(false)} style={{ padding: '0.5rem 1rem', borderRadius: '4px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => handleCreatePost()} className="btn" disabled={(!newPost.trim() && !mediaFile) || loading} style={{ padding: '0.5rem 1.25rem', borderRadius: '4px' }}>Post Spark</button>
            </div>
          </div>
        </div>
      </div>
    )}

    <div className="animate-fade-up container" style={{ paddingTop: '2rem' }}>
      <div className="feed-grid">
        <div>
          <div className="animate-fade-up delay-100" style={{ marginBottom: '2rem' }}>
            <div className="card" style={{ padding: '1.5rem', borderRadius: '8px' }}>
            <form onSubmit={handleCreatePost} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div className="avatar" style={{ width: '48px', height: '48px', fontSize: '1.2rem', overflow: 'hidden' }}>
                {renderAvatar(user?.avatar_url || null, user?.name || 'U')}
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <input 
                  placeholder="Ignite a conversation..." 
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.1rem', outline: 'none', marginTop: '0.6rem' }}
                />
              </div>
            </form>
            
            {mediaFile && (
              <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--primary)', background: 'rgba(184, 205, 239, 0.1)', padding: '0.5rem 1rem', borderRadius: '4px', display: 'inline-block' }}>
                📎 {mediaFile.name} <span style={{cursor: 'pointer', marginLeft: '0.5rem'}} onClick={() => setMediaFile(null)}>✖</span>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
              <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-muted)' }}>
                <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.5px' }} className="hoverable" onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon size={16} /> MEDIA
                </span>
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => e.target.files && setMediaFile(e.target.files[0])} />
                <span style={{ cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.5px', opacity: 0.5 }}>
                  <Code size={16} /> SNIPPET
                </span>
                <span style={{ cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.5px', opacity: 0.5 }}>
                  <Calendar size={16} /> EVENT
                </span>
              </div>
              <button onClick={handleCreatePost} className="btn hoverable" disabled={(!newPost.trim() && !mediaFile) || loading} style={{ padding: '0.5rem 1.25rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: 'var(--text-main)' }}>Post Spark</button>
            </div>
            
            </div>
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
                <div key={post.id} className={`card hoverable animate-fade-up`} style={{ animationDelay: `${(index % 3) * 100}ms` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <Link to={`/profile/${post.user_id}`} style={{ textDecoration: 'none' }}>
                        <div className="avatar" style={{ width: '40px', height: '40px', fontSize: '1rem', overflow: 'hidden' }}>
                          {renderAvatar(post.avatar_url, post.name)}
                        </div>
                      </Link>
                      <div>
                        <Link to={`/profile/${post.user_id}`} style={{ textDecoration: 'none' }}>
                          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>{post.name}</h3>
                        </Link>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{post.department} • {new Date(post.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)', fontSize: '0.65rem', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 600, letterSpacing: '0.5px' }}>
                      UPDATE
                    </div>
                  </div>
                  
                  <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--text-main)', marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>
                    {parseContent(post.content)}
                  </p>

                  {post.media_url && (
                    <div style={{ marginBottom: '1.5rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <img src={`${import.meta.env.VITE_API_URL}${post.media_url}`} alt="Post Attachment" style={{ width: '100%', display: 'block' }} />
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', color: 'var(--text-muted)' }}>
                    <button onClick={() => handleLike(post.id)} className="hoverable" style={{ border: 'none', background: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', color: post.has_liked ? '#ef4444' : 'var(--text-muted)', fontWeight: 600, transition: '0.2s', fontSize: '0.85rem' }}>
                      <Heart size={18} fill={post.has_liked ? '#ef4444' : 'none'} color={post.has_liked ? '#ef4444' : 'currentColor'} /> {post.likes_count}
                    </button>
                    <button onClick={() => toggleComments(post.id)} className="hoverable" style={{ border: 'none', background: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontWeight: 600, transition: '0.2s', fontSize: '0.85rem' }}>
                      <MessageSquare size={18} /> {post.comments_count}
                    </button>
                    <button className="hoverable" style={{ border: 'none', background: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>
                      <Share2 size={18} /> {Math.floor(Math.random() * 20)}
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
      </div>
    </div>
    </AnimatedPage>
  );
}
