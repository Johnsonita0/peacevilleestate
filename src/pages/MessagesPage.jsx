import { useEffect, useState } from 'react'
import { MessageSquareText, Send } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { api } from '../lib/api'
import '../css/admin-messages.css'

function MessagesPage() {
  const { profile, session } = useAuth()
  const [rooms, setRooms] = useState([])
  const [selectedRoom, setSelectedRoom] = useState('')
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    async function loadRooms() {
      if (!session?.access_token) {
        setLoading(false)
        return
      }
      try {
        const { data } = await api.get('/admin/chat/rooms', { accessToken: session.access_token })
        if (!active) return
        setRooms(data ?? [])
        setSelectedRoom((current) => current || data?.[0]?.id || '')
      } catch (error) {
        console.error('Admin chat rooms could not be loaded:', error)
        if (active) setNotice('Messages could not be loaded. Check the API and database connection.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void loadRooms()
    return () => { active = false }
  }, [session?.access_token])

  useEffect(() => {
    let active = true
    async function loadMessages() {
      if (!selectedRoom || !session?.access_token) {
        setMessages([])
        return
      }
      try {
        const { data } = await api.get(`/admin/chat/rooms/${selectedRoom}/messages`, { accessToken: session.access_token })
        if (active) setMessages(data ?? [])
      } catch (error) {
        console.error('Admin chat messages could not be loaded:', error)
        if (active) setNotice('Messages for this room could not be loaded.')
      }
    }
    void loadMessages()
    return () => { active = false }
  }, [selectedRoom, session?.access_token])

  async function sendMessage(event) {
    event.preventDefault()
    const body = draft.trim()
    if (!body || !selectedRoom || !session?.access_token) return
    setBusy(true)
    try {
      const { data } = await api.post(`/admin/chat/rooms/${selectedRoom}/messages`, { body }, { accessToken: session.access_token })
      setMessages((current) => [...current, data])
      setDraft('')
      setNotice('')
    } catch (error) {
      console.error('Admin chat message could not be sent:', error)
      setNotice('Your message could not be sent. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="admin-messages">
      <header className="admin-messages-heading">
        <div><span className="admin-label">Community</span><h1>Messages</h1><p>Estate and compound conversations.</p></div>
      </header>
      {notice && <div className="admin-toast" role="status">{notice}</div>}
      <div className="admin-messages-layout">
        <aside className="admin-messages-rooms" aria-label="Chat rooms">
          <h2>Rooms</h2>
          {rooms.map((room) => <button key={room.id} type="button" className={selectedRoom === room.id ? 'active' : ''} onClick={() => setSelectedRoom(room.id)}><MessageSquareText size={16} /><span><strong>{room.name}</strong><small>{room.scope}</small></span></button>)}
          {!loading && rooms.length === 0 && <p className="admin-messages-empty">No chat rooms have been created.</p>}
          {loading && <p className="admin-messages-empty">Loading rooms…</p>}
        </aside>
        <section className="admin-messages-conversation" aria-label="Conversation">
          <div className="admin-messages-log" aria-live="polite">
            {messages.map((message) => <article className={`admin-message${message.sender_id === profile?.id ? ' mine' : ''}`} key={message.id}><p>{message.body}</p><time>{new Date(message.created_at).toLocaleString('en-NG')}</time></article>)}
            {selectedRoom && !messages.length && <p className="admin-messages-empty">No messages in this room yet.</p>}
            {!selectedRoom && !loading && <p className="admin-messages-empty">Choose a room to view its messages.</p>}
          </div>
          <form className="admin-messages-compose" onSubmit={sendMessage}>
            <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message" maxLength={5000} aria-label="Write a message" disabled={!selectedRoom || busy} />
            <button type="submit" aria-label="Send message" disabled={!selectedRoom || busy || !draft.trim()}><Send size={17} /></button>
          </form>
        </section>
      </div>
    </section>
  )
}

export default MessagesPage
