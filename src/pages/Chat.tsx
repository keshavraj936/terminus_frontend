import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import AnimatedPage from '../components/AnimatedPage';
import { Send, User as UserIcon, MessageSquare } from 'lucide-react';

interface Contact {
  id: number;
  name: string;
  avatar_url: string | null;
  department: string | null;
  last_message: string | null;
  last_interaction: string;
  unread_count: number;
}

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  created_at: string;
}

export default function Chat() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContactId, setActiveContactId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Parse contact from URL state if navigated from profile
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const userIdParam = searchParams.get('user_id');
    if (userIdParam) {
      setActiveContactId(parseInt(userIdParam));
    }
  }, [location]);

  // Fetch contacts list
  const fetchContacts = async () => {
    try {
      const res = await api.get('get_conversations.php');
      if (res.data.status === 'success') {
        setContacts(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingContacts(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // Fetch messages for active contact
  const fetchMessages = async (isPolling = false) => {
    if (!activeContactId) return;
    try {
      // Pass last_id to optimize polling if needed, for simplicity we fetch all for now, 
      // or we can just fetch all since it's an MVP
      const res = await api.get(`get_messages.php?user_id=${activeContactId}`);
      if (res.data.status === 'success') {
        const newMessages = res.data.data;
        setMessages(prev => {
          // Only scroll to bottom if new messages arrived
          if (prev.length !== newMessages.length && !isPolling) {
            setTimeout(scrollToBottom, 100);
          }
          return newMessages;
        });
        
        // If we fetched messages, and there were unread, refresh contacts to clear badge
        if (isPolling) {
            fetchContacts();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Initial fetch when contact changes
  useEffect(() => {
    if (activeContactId) {
      setMessages([]); // clear current chat
      fetchMessages();
      setTimeout(scrollToBottom, 300);
    }
  }, [activeContactId]);

  // Polling mechanism
  useEffect(() => {
    if (!activeContactId) return;
    const interval = setInterval(() => {
      fetchMessages(true);
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [activeContactId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeContactId) return;

    const tempMsg = inputText;
    setInputText('');

    try {
      const res = await api.post('send_message.php', {
        receiver_id: activeContactId,
        message: tempMsg
      });

      if (res.data.status === 'success') {
        fetchMessages();
        fetchContacts(); // Update latest message in sidebar
      }
    } catch (err) {
      console.error(err);
    }
  };

  const renderAvatar = (url: string | null, name: string) => {
    if (url) {
      return <img src={`${import.meta.env.VITE_API_URL}${url}`} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />;
    }
    return name.charAt(0).toUpperCase();
  };

  const activeContact = contacts.find(c => c.id === activeContactId) || 
    (activeContactId ? { id: activeContactId, name: 'User', avatar_url: null, department: null, last_message: null, last_interaction: '', unread_count: 0 } : null);

  return (
    <AnimatedPage>
      <div className="container" style={{ paddingTop: '2rem', height: 'calc(100vh - 4rem)', display: 'flex', gap: '1.5rem' }}>
        
        {/* Left Sidebar - Contacts */}
        <div className="card" style={{ width: '320px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={20} className="text-primary" /> Messages
            </h2>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
            {loadingContacts ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>Loading...</p>
            ) : contacts.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem', fontSize: '0.9rem' }}>
                No conversations yet. Connect with people to start chatting!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {contacts.map(contact => (
                  <div 
                    key={contact.id} 
                    className={`hoverable`}
                    onClick={() => setActiveContactId(contact.id)}
                    style={{ 
                      display: 'flex', gap: '1rem', padding: '0.85rem', borderRadius: '12px', cursor: 'pointer',
                      background: activeContactId === contact.id ? 'var(--bg-color)' : 'transparent',
                      borderLeft: activeContactId === contact.id ? '3px solid var(--primary)' : '3px solid transparent',
                      alignItems: 'center'
                    }}
                  >
                    <div className="avatar" style={{ width: '45px', height: '45px', flexShrink: 0, position: 'relative' }}>
                      {renderAvatar(contact.avatar_url, contact.name)}
                      {contact.unread_count > 0 && (
                        <span style={{ position: 'absolute', top: '-2px', right: '-2px', background: '#ef4444', color: 'white', fontSize: '0.65rem', fontWeight: 'bold', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                          {contact.unread_count}
                        </span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{contact.name}</span>
                      </div>
                      {contact.last_message && (
                        <p style={{ margin: 0, fontSize: '0.8rem', color: contact.unread_count > 0 ? 'var(--text-main)' : 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: contact.unread_count > 0 ? 600 : 400 }}>
                          {contact.last_message}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Area - Active Chat */}
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          {activeContactId ? (
            <>
              {/* Chat Header */}
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--surface)', zIndex: 10 }}>
                <div className="avatar" style={{ width: '40px', height: '40px' }} onClick={() => navigate(`/profile/${activeContactId}`)}>
                  {renderAvatar(activeContact?.avatar_url || null, activeContact?.name || 'User')}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', cursor: 'pointer' }} onClick={() => navigate(`/profile/${activeContactId}`)}>
                    {activeContact?.name}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{activeContact?.department || 'Student'}</span>
                </div>
              </div>

              {/* Chat Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-color)' }}>
                {messages.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    Say hi to start the conversation! 👋
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.sender_id === user?.id;
                    const showTime = idx === 0 || new Date(messages[idx].created_at).getTime() - new Date(messages[idx-1].created_at).getTime() > 3600000;
                    
                    return (
                      <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                        {showTime && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.4rem', alignSelf: 'center' }}>
                            {new Date(msg.created_at).toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        <div style={{
                          background: isMe ? 'var(--primary)' : 'var(--surface)',
                          color: isMe ? '#111' : 'var(--text-main)',
                          padding: '0.75rem 1rem',
                          borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                          fontSize: '0.95rem',
                          lineHeight: 1.5,
                          boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                        }}>
                          {msg.message}
                        </div>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message..." 
                  className="input-field"
                  style={{ flex: 1, borderRadius: '24px', padding: '0.75rem 1.5rem' }}
                />
                <button type="submit" className="btn" disabled={!inputText.trim()} style={{ width: '45px', height: '45px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Send size={18} />
                </button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <MessageSquare size={32} />
              </div>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Your Messages</h3>
              <p>Select a conversation or start a new one.</p>
            </div>
          )}
        </div>

      </div>
    </AnimatedPage>
  );
}
