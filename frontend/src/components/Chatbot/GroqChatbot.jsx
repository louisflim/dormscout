import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import dormBotAvatar from '../../assets/images/DormBot.png';
import './GroqChatbot.css';

const BOT_NAME = 'DormBot';

/** Dev: CRA proxy. Production (`serve -s build`): must hit backend directly. */
const CHAT_API_URL =
  process.env.REACT_APP_CHAT_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'http://localhost:8080/api/chat/completions'
    : '/api/chat/completions');

function welcomeMessage(firstName) {
  return `Hi${firstName ? ` ${firstName}` : ''}! 👋 I'm ${BOT_NAME}, your DormScout guide. Ask me anything about navigating the app.`;
}

function BotAvatar({ variant = 'msg' }) {
  return (
    <div className={`chatbot-avatar chatbot-avatar--${variant}`} aria-hidden="true">
      <img src={dormBotAvatar} alt="" />
    </div>
  );
}

// ── Page navigation knowledge base ──────────────────────────────────────────
const NAVIGATION_CONTEXT = `
You are DormBot, DormScout's friendly in-app navigation assistant. DormScout is a dorm-finding platform in Cebu, Philippines that connects students (tenants) with landlords.

═══ APP PAGES & ROUTES ═══

/overview
- The main dashboard after login
- TENANTS: see available dorm listings, banner, recent activity, how it works
- LANDLORDS: see their posted listings, tenant requests, occupancy stats
- This is the HOME screen for all logged-in users

/map
- Interactive map showing all available dorms in Cebu
- TENANTS use this to visually browse dorms near their university
- Great for finding dorms by location

/listing
- LANDLORDS ONLY: where landlords create, edit, and delete their dorm listings
- Also where landlords manage tenant requests and current tenants
- TENANTS do NOT use this page — never direct a tenant here

/booking
- TENANTS: see all their booking requests and their status (pending, accepted, rejected)
- Shows move-in date, listing name, and booking history
- Landlords can also view incoming booking requests here

/bookmarks
- TENANTS: saved/bookmarked dorm listings they want to revisit later
- Tenants can bookmark a listing from the overview or map page

/messages
- In-app messaging between tenants and landlords
- Used to ask questions about a dorm before or after booking

/notifications
- Alerts and updates such as booking accepted, booking rejected, new messages
- Both tenants and landlords receive notifications here

/reviews
- Read and write reviews for dorm listings
- Tenants can leave a review after their stay

/profile
- View and edit personal information: name, email, profile photo, university
- Accessible to both tenants and landlords

/settings
- Account preferences: password, security, notification settings

/report
- Report a suspicious listing or inappropriate user behavior

/support
- Contact DormScout support team for help with any issues

/about
- Information about the DormScout platform and team

═══ USER ROLES ═══

TENANT (student looking for a dorm):
- Browse dorms → /overview or /map
- Save a dorm → /bookmarks
- Book a dorm → click a listing on /overview or /map
- Track booking status → /booking
- Message a landlord → /messages
- Leave a review → /reviews
- Edit profile → /profile

LANDLORD (property owner posting dorms):
- Post or edit a dorm listing → /listing
- Manage tenant requests → /listing
- View current tenants → /listing
- Message a tenant → /messages
- View notifications → /notifications

═══ COMMON QUESTIONS & CORRECT ANSWERS ═══

"How do I find a dorm?" → Direct tenant to /overview to browse listings or /map to search by location. NEVER say /listing.
"How do I book a dorm?" → Tell tenant to go to /overview or /map, click a listing, and submit a booking request.
"Where is my booking?" → Direct tenant to the Bookings page (/booking) to see request status.
"How do I save a dorm?" → Tell tenant to bookmark it from the listing card, viewable at /bookmarks.
"How do I post a listing?" → Direct landlord to the Listings page (/listing) to create a new dorm post.
"How do I message someone?" → Direct to /messages.
"I was rejected/accepted" → Direct to /notifications for alerts and /booking for booking status.
"How do I edit my profile?" → Direct to /profile.
"How do I change my password?" → Direct to /settings.
"I want to report someone" → Direct to /report.
"I need help" → Direct to /support.

═══ RESPONSE RULES ═══

1. Always write routes in this format: the **Bookings** page — never just "/booking" alone as it looks like an API path.
2. Be role-aware — tenant and landlord flows are different. Never send a tenant to /listing.
3. Keep replies to 2-3 sentences max. Be warm, clear, and helpful.
4. Only answer DormScout navigation questions. If asked anything unrelated (homework, general AI questions, etc.), politely say: "I'm only able to help you navigate DormScout! For other questions, feel free to visit our **Support** page."
5. If you are unsure, always suggest the **Support** page (/support).
6. Never make up pages or features that are not listed above.
`;

// ── Quick suggestion chips ───────────────────────────────────────────────────
const SUGGESTIONS = [
  { label: '🏠 Find a dorm', text: 'How do I find a dorm?' },
  { label: '📋 My bookings', text: 'Where can I see my bookings?' },
  { label: '💬 Message landlord', text: 'How do I message a landlord?' },
  { label: '🔖 Saved listings', text: 'Where are my saved listings?' },
  { label: '⚙️ Settings', text: 'How do I change my settings?' },
  { label: '🗺️ Map view', text: 'How do I view listings on a map?' },
];

export default function GrokChatbot() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: welcomeMessage(user?.firstName),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  // Don't render if not logged in
  if (!user) return null;

  // ── Parse bold markdown and clickable routes ──────────────────────────────
  function parseContent(text) {
    // Split by **bold** or /route patterns
    const parts = text.split(/(\*\*[^*]+\*\*|\/[a-z-]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const inner = part.slice(2, -2);
        // Check if it's a route inside bold
        if (inner.startsWith('/')) {
          return (
            <button
              key={i}
              className="chatbot-route-link"
              onClick={() => { navigate(inner); setOpen(false); }}
            >
              {inner}
            </button>
          );
        }
        return <strong key={i}>{inner}</strong>;
      }
      if (part.match(/^\/[a-z-]+$/) && part.length > 1) {
        return (
          <button
            key={i}
            className="chatbot-route-link"
            onClick={() => { navigate(part); setOpen(false); }}
          >
            {part}
          </button>
        );
      }
      return part;
    });
  }

  // ── Send message to Grok ─────────────────────────────────────────────────
  async function sendMessage(text) {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    const userMsg = { role: 'user', content: trimmed };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setLoading(true);
    setShowSuggestions(false);

    try {
      const response = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: NAVIGATION_CONTEXT },
            ...newHistory.map(m => ({ role: m.role, content: m.content })),
          ],
          max_tokens: 200,
          temperature: 0.5,
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      console.log('Content-Type:', response.headers.get('content-type'));

      try {
        const data = await response.json();
        console.log('Full data:', JSON.stringify(data));
        console.log('Choices:', data?.choices);

        const reply = data?.choices?.[0]?.message?.content;
        console.log('Reply:', reply);

        if (reply) {
          setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, no response. Try again!" }]);
        }
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);

        // Fallback — read as text to see what actually came back
        const text = await response.clone().text();
        console.log('Raw text response:', text);
      }

    } catch (err) {
      console.error('Fetch error:', err);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: "⚠️ Couldn't connect right now. Check your connection and try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleReset() {
    setMessages([
      {
        role: 'assistant',
        content: welcomeMessage(user?.firstName),
      },
    ]);
    setShowSuggestions(true);
    setInput('');
  }

  return (
    <>
      {/* ── Floating toggle button ── */}
      <button
        className={`chatbot-fab ${open ? 'chatbot-fab--open' : 'chatbot-fab--brand'}`}
        onClick={() => setOpen(o => !o)}
        aria-label={`Toggle ${BOT_NAME}`}
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        ) : (
          <img src={dormBotAvatar} alt="" className="chatbot-fab-img" />
        )}
        {!open && <span className="chatbot-fab-pulse" />}
      </button>

      {/* ── Chat window ── */}
      <div className={`chatbot-window ${open ? 'chatbot-window--open' : ''}`}>
        {/* Header */}
        <div className="chatbot-header">
          <BotAvatar variant="header" />
          <div className="chatbot-header-info">
            <span className="chatbot-header-name">{BOT_NAME}</span>
            <span className="chatbot-header-status">
              <span className="chatbot-status-dot" />
              Navigation Assistant
            </span>
          </div>
          <button className="chatbot-reset-btn" onClick={handleReset} title="Reset chat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" strokeLinecap="round" />
              <path d="M3 3v5h5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="chatbot-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chatbot-msg chatbot-msg--${msg.role}`}>
              {msg.role === 'assistant' && <BotAvatar />}
              <div className="chatbot-msg-bubble">
                {msg.role === 'assistant'
                  ? parseContent(msg.content)
                  : msg.content}
              </div>
            </div>
          ))}

          {/* Suggestion chips (only on fresh chat) */}
          {showSuggestions && messages.length === 1 && (
            <div className="chatbot-suggestions">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  className="chatbot-chip"
                  onClick={() => sendMessage(s.text)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {/* Typing indicator */}
          {loading && (
            <div className="chatbot-msg chatbot-msg--assistant">
              <BotAvatar />
              <div className="chatbot-msg-bubble chatbot-typing">
                <span /><span /><span />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="chatbot-input-row">
          <input
            ref={inputRef}
            className="chatbot-input"
            placeholder="Ask me anything…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            maxLength={300}
          />
          <button
            className="chatbot-send-btn"
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            aria-label="Send"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" strokeLinecap="round" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <p className="chatbot-footer">Powered by Grok · {BOT_NAME}</p>
      </div>
    </>
  );
}