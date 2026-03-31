import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  created_at: string;
}

export default function Chat() {
  const { user } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [fetchedUsers, setFetchedUsers] = useState<any[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const selectedUserIdRef = useRef<number | null>(null);

  useEffect(() => {
    selectedUserIdRef.current = selectedUserId;
  }, [selectedUserId]);

  const pingIntervalRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  // Connect to WebSocket Server with Heartbeat and Auto-Reconnect
  useEffect(() => {
    if (!user) return;
    
    const connect = () => {
      const WS_URL = import.meta.env.VITE_WS_URL || `ws://${window.location.hostname}:8080`;
      const ws = new WebSocket(WS_URL);
      
      ws.onopen = () => {
        console.log('Connected to Chat Server');
        ws.send(JSON.stringify({ type: 'auth', user_id: user.id }));

        // Heartbeat (Ping)
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000); // 30 seconds connection persist
      };
      
      ws.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        if (payload.type === 'message') {
          const msg = payload.data;
          const currentSelectedId = selectedUserIdRef.current;
          
          if (
            (msg.sender_id === currentSelectedId && msg.receiver_id === user.id) ||
            (msg.sender_id === user.id && msg.receiver_id === currentSelectedId)
          ) {
            setMessages(prev => [...prev, msg]);
          }
        }
      };

      ws.onclose = () => {
        console.log('WebSocket closed. Reconnecting in 3 seconds...');
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
        ws.close(); // Forces onclose to trigger reconnection explicitly
      };

      socketRef.current = ws;
    };

    connect();

    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.onclose = null; // Prevent accidental reconnects when navigating away
        socketRef.current.close();
      }
    };
  }, [user]);

  const loadUsers = async () => {
    try {
      const res = await api.get('get_users.php');
      if (res.data.status === 'success') {
        setFetchedUsers(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const fetchMessages = async (userId: number) => {
    try {
      const res = await api.get(`get_messages.php?user_id=${userId}`);
      if (res.data.status === 'success') {
        setMessages(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  };

  useEffect(() => {
    if (!selectedUserId) return;
    fetchMessages(selectedUserId);
    // Removed HTTP Polling interval - handled by WebSockets now!
  }, [selectedUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUserId) return;
    
    const msgToSend = newMessage;
    setNewMessage(''); // Clear input instantly
    
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'message',
        receiver_id: selectedUserId,
        message: msgToSend
      }));
    } else {
      console.error('Socket not connected');
      // Fallback could be implemented here
    }
  };

  const handleUserSelect = (id: number, name: string) => {
    setSelectedUserId(id);
    setSelectedUserName(name);
  };

  return (
    <div className="animate-fade-up chat-wrapper" style={{ height: 'calc(100vh - 4rem)', paddingRight: '2rem' }}>
      <div className="card" style={{ display: 'flex', height: '100%', padding: 0, overflow: 'hidden', borderRadius: '24px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: 'var(--shadow-hover)' }}>
        
        {/* Left Sidebar (Contacts) */}
        <div className={`chat-sidebar ${selectedUserId ? 'hidden-mobile' : ''}`} style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg-color)' }}>
          <div style={{ padding: '2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Messages</strong>
            <div style={{ display: 'flex', gap: '0.75rem', cursor: 'pointer', color: 'var(--text-main)' }}>
              <span className="hoverable" style={{ padding: '0.6rem', background: 'var(--border)', borderRadius: '12px' }} onClick={loadUsers}>↻</span>
              <span className="hoverable" style={{ padding: '0.6rem', background: 'var(--border)', borderRadius: '12px' }}>📝</span>
            </div>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <input type="text" placeholder="Search conversations..." className="input-field" style={{ marginBottom: 0, padding: '0.8rem 1.25rem', background: 'var(--surface)', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {fetchedUsers.length === 0 && <p style={{ padding: '2rem', color: 'var(--text-muted)', textAlign: 'center' }}>No connections yet.</p>}
            {fetchedUsers.map((u, i) => (
              <div 
                key={u.id} 
                className={`animate-slide-in`}
                style={{
                  animationDelay: `${(i % 5) * 50}ms`,
                  padding: '1.25rem 1.5rem',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                  background: selectedUserId === u.id ? 'var(--surface)' : 'transparent',
                  borderLeft: selectedUserId === u.id ? '4px solid var(--primary)' : '4px solid transparent'
                }}
                onClick={() => handleUserSelect(u.id, u.name)}
              >
                <div className="avatar" style={{ width: '56px', height: '56px', fontSize: '1.25rem', boxShadow: selectedUserId === u.id ? '0 4px 12px rgba(0,0,0,0.15)' : 'none' }}>{u.name.charAt(0)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <strong style={{ color: selectedUserId === u.id ? 'var(--primary)' : 'var(--text-main)', fontSize: '1.1rem', fontWeight: 700 }}>{u.name}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Tap to view conversation
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Main Window */}
        <div className={`chat-main ${!selectedUserId ? 'hidden-mobile' : ''}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--surface)' }}>
          {!selectedUserId ? (
            <div className="animate-fade-up" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-muted)' }}>
              <div style={{ width: '120px', height: '120px', background: 'var(--text-main)', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '3.5rem', marginBottom: '2.5rem', boxShadow: 'var(--shadow)', transform: 'rotate(-10deg)' }}>
                💬
              </div>
              <h3 style={{ color: 'var(--text-main)', fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '-0.5px' }}>Your Messages</h3>
              <p style={{ fontSize: '1.1rem', maxWidth: '350px', textAlign: 'center', lineHeight: 1.6 }}>Select a conversation from the sidebar or start a new one to connect.</p>
            </div>
          ) : (
            <>
              <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div className="avatar" style={{ width: '52px', height: '52px' }}>{selectedUserName.charAt(0)}</div>
                  <div>
                    <strong style={{ fontSize: '1.25rem', display: 'block', color: 'var(--text-main)', fontWeight: 800 }}>{selectedUserName}</strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                      <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', display: 'inline-block' }}></span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Online now</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-muted)', fontSize: '1.25rem', cursor: 'pointer' }}>
                   <span className="hoverable">📞</span>
                   <span className="hoverable">📹</span>
                   <span className="hoverable">⋯</span>
                </div>
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-color)' }}>
                <div className="animate-fade-up delay-100" style={{ textAlign: 'center', margin: '2rem 0 3rem 0' }}>
                  <div className="avatar" style={{ width: '90px', height: '90px', margin: '0 auto 1.5rem auto', fontSize: '2.5rem', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}>{selectedUserName.charAt(0)}</div>
                  <strong style={{ fontSize: '1.75rem', color: 'var(--text-main)', fontWeight: 800 }}>{selectedUserName}</strong>
                  <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '1.05rem' }}>You're connected on CampusConnect</p>
                </div>

                {messages.map((msg) => {
                  const isMine = msg.sender_id === user?.id;
                  return (
                    <div className="animate-fade-up" key={msg.id} style={{ display: 'flex', gap: '0.75rem', alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                      {!isMine && <div className="avatar" style={{ width: '36px', height: '36px', fontSize: '0.8rem', marginTop: 'auto' }}>{selectedUserName.charAt(0)}</div>}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          padding: '1rem 1.5rem',
                          fontSize: '1.05rem',
                          lineHeight: 1.5,
                          borderRadius: '24px',
                          color: isMine ? 'var(--bg-color)' : 'var(--text-main)',
                          background: isMine ? 'var(--primary)' : 'var(--surface)',
                          boxShadow: isMine ? '0 6px 16px rgba(0,0,0,0.15)' : '0 4px 12px rgba(0,0,0,0.05)',
                          borderBottomRightRadius: isMine ? '6px' : '24px',
                          borderBottomLeftRadius: !isMine ? '6px' : '24px',
                          border: isMine ? 'none' : '1px solid var(--border)'
                        }}>
                          {msg.message}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem', padding: '0 0.5rem' }}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {isMine && '✓✓'}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} style={{ padding: '1.5rem 2rem', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-color)', borderRadius: '32px', padding: '0.5rem 0.5rem 0.5rem 1.5rem', border: '1px solid var(--border)', transition: 'var(--transition)' }}>
                  <div style={{ color: 'var(--text-muted)', display: 'flex', gap: '1.25rem', fontSize: '1.25rem' }}>
                    <span style={{ cursor: 'pointer' }} className="hoverable">😊</span>
                    <span style={{ cursor: 'pointer' }} className="hoverable">📎</span>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Type your message..." 
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '1.05rem', padding: '0.5rem 1rem', outline: 'none' }}
                  />
                  <button type="submit" className="btn" disabled={!newMessage.trim()} style={{ borderRadius: '24px', padding: '0.8rem 2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                    Send
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
