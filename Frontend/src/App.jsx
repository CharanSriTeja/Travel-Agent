import { useState, useRef, useEffect } from "react";
import { sendMessage } from "./api/chatApi";
import { createBooking } from "./api/bookingApi";
import { authApi } from "./lib/api";
import { useAuth } from "./context/AuthContext";
import AuthModal from "./components/AuthModal";
import BookingsModal from "./components/BookingsModal";

const SUGGESTIONS = [
  "Flights from Hyderabad to Delhi tomorrow",
  "Cheapest flights Mumbai to Bangalore",
  "Flights to Goa this weekend",
];

/* ─── Flight Markdown Parser ──────────────────────────────── */
function extractField(block, label) {
  const regex = new RegExp(`\\*\\*${label}:\\*\\*\\s*([^\\n*]+)`, "i");
  const m = block.match(regex);
  return m ? m[1].trim() : null;
}

function formatTime(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch {
    return iso.replace("T", " ").slice(0, 16);
  }
}

function parseFlightsFromMarkdown(text) {
  const blocks = text.split(/(?=\*\s+\*\*Airline:\*\*)/g).filter(b => b.includes("**Price:**"));
  if (blocks.length === 0) return null;

  return blocks.map((block, i) => {
    const stopsRaw = extractField(block, "Stops");
    const stopsNum = stopsRaw ? parseInt(stopsRaw) : 0;
    const stopsLabel = stopsNum === 0 ? "Direct" : `${stopsNum} stop${stopsNum > 1 ? "s" : ""}`;
    const dep = extractField(block, "Departure Time");
    const arr = extractField(block, "Arrival Time");
    const isBest = i === 0 && text.includes("Best Overall");

    return {
      airline: extractField(block, "Airline") || "IndiGo",
      flightNo: extractField(block, "Flight Number"),
      from: extractField(block, "Departure Airport"),
      to: extractField(block, "Arrival Airport"),
      departure: formatTime(dep),
      arrival: formatTime(arr),
      duration: extractField(block, "Duration"),
      stops: stopsLabel,
      stopsNum,
      cabin: extractField(block, "Cabin Class") || "Economy",
      price: extractField(block, "Price"),
      isBest,
    };
  });
}

function parseAIMessage(content) {
  if (typeof content === "string" && content.includes("**Airline:**")) {
    const flights = parseFlightsFromMarkdown(content);
    if (flights && flights.length > 0) {
      const headerMatch = content.match(/^([\s\S]*?)(?=\*\s+\*\*Airline:\*\*)/);
      const header = headerMatch ? headerMatch[1].replace(/[*#]/g, "").trim() : "";
      return { header, flights };
    }
  }
  return { header: content, flights: null };
}

/* ─── Sub-components ──────────────────────────────────────── */
function TypingIndicator() {
  return (
    <div style={styles.typingWrapper}>
      <div style={styles.agentAvatar}>✈</div>
      <div style={styles.typingBubble}>
        <span style={{ ...styles.dot, animationDelay: "0s" }} />
        <span style={{ ...styles.dot, animationDelay: "0.2s" }} />
        <span style={{ ...styles.dot, animationDelay: "0.4s" }} />
      </div>
    </div>
  );
}

function FlightCard({ flight, onBook }) {
  const [booking, setBooking] = useState(null);
  const stopColor = flight.stopsNum === 0 ? "#4ade80" : "#f5a623";

  const handleBook = async () => {
    if (booking === "done") return;
    setBooking("loading");
    try {
      await onBook(flight);
      setBooking("done");
    } catch {
      setBooking("error");
    }
  };

  return (
    <div style={{ ...styles.flightCard, ...(flight.isBest ? styles.flightCardBest : {}) }}>
      {flight.isBest && <div style={styles.bestBadge}>Best Choice</div>}
      <div style={styles.flightHeader}>
        <div>
          <div style={styles.airline}>{flight.airline}</div>
          {flight.flightNo && <div style={styles.flightNo}>Flight {flight.flightNo}</div>}
        </div>
        <div style={styles.price}>{flight.price}</div>
      </div>

      <div style={styles.flightRoute}>
        <div style={styles.routePoint}>
          <span style={styles.cityCode}>{flight.from?.match(/\(([^)]+)\)/)?.[1] || flight.from}</span>
          <span style={styles.cityName}>{flight.from?.replace(/\s*\([^)]*\)/, "")}</span>
          <span style={styles.time}>{flight.departure}</span>
        </div>

        <div style={styles.routeLine}>
          <span style={styles.duration}>{flight.duration}</span>
          <div style={styles.lineTrack}>
            <div style={styles.lineInner} />
            <span style={styles.planeIcon}>✈</span>
            <div style={styles.lineInner} />
          </div>
          <span style={{ ...styles.stops, color: stopColor }}>{flight.stops}</span>
        </div>

        <div style={{ ...styles.routePoint, alignItems: "flex-end" }}>
          <span style={styles.cityCode}>{flight.to?.match(/\(([^)]+)\)/)?.[1] || flight.to}</span>
          <span style={styles.cityName}>{flight.to?.replace(/\s*\([^)]*\)/, "")}</span>
          <span style={styles.time}>{flight.arrival}</span>
        </div>
      </div>

      <div style={styles.flightFooter}>
        <span style={styles.cabinBadge}>{flight.cabin}</span>
        <button
          style={{
            ...styles.bookBtn,
            ...(booking === "done" ? styles.bookBtnDone : {}),
            ...(booking === "loading" ? styles.bookBtnLoading : {}),
          }}
          onClick={handleBook}
          disabled={booking === "loading" || booking === "done"}
        >
          {booking === "loading" ? "Booking..." : booking === "done" ? "Booked!" : booking === "error" ? "Try Again" : "Book Now"}
        </button>
      </div>
    </div>
  );
}

function MessageBubble({ msg, onBook }) {
  const isUser = msg.role === "user";
  if (isUser) {
    return (
      <div style={{ ...styles.messageRow, justifyContent: "flex-end" }}>
        <div style={styles.userBubble}>
          <p style={styles.bubbleText}>{msg.content}</p>
        </div>
        <div style={styles.userAvatar}>YOU</div>
      </div>
    );
  }

  const { header, flights } = parseAIMessage(msg.content);
  const structuredFlights = msg.flights || flights;

  return (
    <div style={{ ...styles.messageRow, justifyContent: "flex-start" }}>
      <div style={styles.agentAvatar}>✈</div>
      <div style={{ maxWidth: "82%", width: "100%" }}>
        {header && (
          <div style={styles.aiBubble}>
            <p style={styles.bubbleText}>{header}</p>
          </div>
        )}
        {structuredFlights && structuredFlights.length > 0 && (
          <div style={styles.flightsGrid}>
            {structuredFlights.map((f, i) => <FlightCard key={i} flight={f} onBook={onBook} />)}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main App ────────────────────────────────────────────── */
export default function App() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([
    {
      role: "ai",
      content: "Hello! I'm your AI travel agent. Where would you like to fly today? I can search flights for you.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showBookings, setShowBookings] = useState(false);
  const [bookToast, setBookToast] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, loading]);

  const handleSend = async (text) => {
    const query = text || message;
    if (!query.trim() || loading) return;
    setChat((prev) => [...prev, { role: "user", content: query }]);
    setMessage("");
    setLoading(true);
    try {
      const response = await sendMessage(query, "user_1");
      setChat((prev) => [...prev, {
        role: "ai",
        content: response.response,
        flights: response.flights || null,
      }]);
    } catch {
      setChat((prev) => [...prev, { role: "ai", content: "Sorry, I couldn't connect to the server. Please try again." }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleBook = async (flight) => {
    if (!user) {
      setShowAuth(true);
      throw new Error("Not authenticated");
    }
    await createBooking(flight);
    setBookToast("Flight booked successfully!");
    setTimeout(() => setBookToast(null), 3000);
  };

  const handleSignOut = async () => {
    authApi.signout();
    window.location.reload();
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <>
      <style>{globalStyles}</style>
      <div style={styles.page}>
        <div style={styles.bgOrb1} />
        <div style={styles.bgOrb2} />

        <header style={styles.header}>
          <div style={styles.logoArea}>
            <span style={styles.logoIcon}>✈</span>
            <div>
              <div style={styles.logoName}>SkyAgent</div>
              <div style={styles.logoSub}>AI Travel Assistant</div>
            </div>
          </div>

          <div style={styles.headerRight}>
            {user ? (
              <>
                <button style={styles.navBtn} onClick={() => setShowBookings(true)}>
                  My Bookings
                </button>
                <div style={styles.userInfo}>
                  <div style={styles.userDot}>
                    {(user.full_name || user.email || "U")[0].toUpperCase()}
                  </div>
                  <span style={styles.userEmail}>
                    {user.full_name || user.email?.split("@")[0]}
                  </span>
                </div>
                <button style={styles.signOutBtn} onClick={handleSignOut}>Sign Out</button>
              </>
            ) : (
              <>
                <div style={styles.statusBadge}>
                  <span style={styles.statusDot} />Online
                </div>
                <button style={styles.signInBtn} onClick={() => setShowAuth(true)}>Sign In</button>
              </>
            )}
          </div>
        </header>

        <main style={styles.chatArea}>
          <div style={styles.chatInner}>
            {chat.map((msg, i) => <MessageBubble key={i} msg={msg} onBook={handleBook} />)}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        </main>

        {chat.length === 1 && (
          <div style={styles.suggestions}>
            {SUGGESTIONS.map((s, i) => (
              <button key={i} style={styles.suggestionChip} onClick={() => handleSend(s)}>{s}</button>
            ))}
          </div>
        )}

        <footer style={styles.footer}>
          <div style={styles.inputWrapper}>
            <span style={styles.inputIcon}>🔍</span>
            <input
              ref={inputRef}
              style={styles.input}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Search flights, trains, buses..."
              disabled={loading}
            />
            <button
              style={{ ...styles.sendBtn, opacity: message.trim() && !loading ? 1 : 0.4 }}
              onClick={() => handleSend()}
              disabled={!message.trim() || loading}
            >
              <span style={styles.sendArrow}>↑</span>
            </button>
          </div>
          <p style={styles.footerNote}>Powered by AI · Results may vary</p>
        </footer>

        {bookToast && <div style={styles.toast}>{bookToast}</div>}

        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
        {showBookings && <BookingsModal onClose={() => setShowBookings(false)} />}
      </div>
    </>
  );
}

/* ─── Styles ──────────────────────────────────────────────── */
const styles = {
  page: {
    minHeight: "100vh", display: "flex", flexDirection: "column",
    background: "#0a0e1a", fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    color: "#e8eaf0", position: "relative", overflow: "hidden",
  },
  bgOrb1: {
    position: "fixed", top: "-120px", left: "-120px", width: "480px", height: "480px",
    borderRadius: "50%", background: "radial-gradient(circle, rgba(14,96,200,0.18) 0%, transparent 70%)",
    pointerEvents: "none", zIndex: 0,
  },
  bgOrb2: {
    position: "fixed", bottom: "-80px", right: "-80px", width: "380px", height: "380px",
    borderRadius: "50%", background: "radial-gradient(circle, rgba(200,140,14,0.12) 0%, transparent 70%)",
    pointerEvents: "none", zIndex: 0,
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 24px", background: "rgba(255,255,255,0.04)", backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(255,255,255,0.07)", position: "sticky", top: 0, zIndex: 10,
    gap: "12px", flexWrap: "wrap",
  },
  logoArea: { display: "flex", alignItems: "center", gap: "12px" },
  logoIcon: { fontSize: "22px", background: "linear-gradient(135deg, #1a6fff, #00cfff)", borderRadius: "10px", padding: "8px 10px" },
  logoName: { fontWeight: 700, fontSize: "17px", letterSpacing: "0.02em" },
  logoSub: { fontSize: "11px", color: "#7a8aaa", marginTop: "1px" },
  headerRight: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
  statusBadge: {
    display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#4ade80",
    background: "rgba(74,222,128,0.08)", padding: "5px 12px", borderRadius: "20px",
    border: "1px solid rgba(74,222,128,0.2)",
  },
  statusDot: {
    width: "7px", height: "7px", borderRadius: "50%",
    background: "#4ade80", boxShadow: "0 0 6px #4ade80", animation: "pulse 2s infinite",
  },
  navBtn: {
    padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)", color: "#c8d8f0", fontSize: "13px",
    fontWeight: 500, cursor: "pointer",
  },
  userInfo: { display: "flex", alignItems: "center", gap: "8px" },
  userDot: {
    width: "30px", height: "30px", borderRadius: "50%",
    background: "linear-gradient(135deg, #1a6fff, #00cfff)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "12px", fontWeight: 700, color: "#fff",
  },
  userEmail: { fontSize: "13px", color: "#c8d8f0", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  signOutBtn: {
    padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)",
    background: "transparent", color: "#7a8aaa", fontSize: "12px", cursor: "pointer",
  },
  signInBtn: {
    padding: "8px 18px", borderRadius: "8px", border: "none",
    background: "linear-gradient(135deg, #1a6fff, #005fcc)", color: "#fff",
    fontSize: "13px", fontWeight: 600, cursor: "pointer",
  },
  chatArea: { flex: 1, overflowY: "auto", padding: "24px 16px", zIndex: 1 },
  chatInner: { maxWidth: "860px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" },
  messageRow: { display: "flex", alignItems: "flex-start", gap: "10px" },
  agentAvatar: {
    flexShrink: 0, width: "36px", height: "36px", borderRadius: "50%",
    background: "linear-gradient(135deg, #1a6fff, #00cfff)",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700,
  },
  userAvatar: {
    flexShrink: 0, width: "36px", height: "36px", borderRadius: "50%",
    background: "linear-gradient(135deg, #f5a623, #f76b1c)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "9px", fontWeight: 700, color: "#fff", letterSpacing: "0.05em",
  },
  aiBubble: {
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "4px 18px 18px 18px", padding: "12px 16px", backdropFilter: "blur(8px)",
  },
  userBubble: {
    background: "linear-gradient(135deg, #1a6fff, #005fcc)", borderRadius: "18px 4px 18px 18px",
    padding: "12px 16px", boxShadow: "0 4px 20px rgba(26,111,255,0.3)",
  },
  bubbleText: { margin: 0, fontSize: "14.5px", lineHeight: 1.6, color: "#e8eaf0" },
  typingWrapper: { display: "flex", alignItems: "center", gap: "10px" },
  typingBubble: {
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "4px 18px 18px 18px", padding: "14px 18px", display: "flex", gap: "5px", alignItems: "center",
  },
  dot: {
    display: "inline-block", width: "7px", height: "7px", borderRadius: "50%",
    background: "#1a6fff", animation: "bounce 0.8s infinite ease-in-out",
  },
  flightsGrid: { marginTop: "10px", display: "flex", flexDirection: "column", gap: "10px" },
  flightCard: {
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px", padding: "16px 18px", backdropFilter: "blur(10px)",
    position: "relative", overflow: "hidden",
  },
  flightCardBest: {
    border: "1px solid rgba(26,111,255,0.5)", background: "rgba(26,111,255,0.07)",
    boxShadow: "0 0 24px rgba(26,111,255,0.12)",
  },
  bestBadge: {
    position: "absolute", top: "12px", right: "14px", fontSize: "10px", fontWeight: 700,
    letterSpacing: "0.05em", color: "#1a6fff", background: "rgba(26,111,255,0.15)",
    border: "1px solid rgba(26,111,255,0.3)", padding: "3px 8px", borderRadius: "20px",
  },
  flightHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" },
  airline: { fontSize: "14px", fontWeight: 600, color: "#c8d8f0" },
  flightNo: { fontSize: "11px", color: "#506080", marginTop: "2px" },
  price: { fontSize: "20px", fontWeight: 700, color: "#f5a623", letterSpacing: "-0.02em" },
  flightRoute: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" },
  routePoint: { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "1px", minWidth: "60px" },
  cityCode: { fontSize: "24px", fontWeight: 700, letterSpacing: "0.02em", lineHeight: 1 },
  cityName: { fontSize: "10px", color: "#506080", maxWidth: "80px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  time: { fontSize: "12px", color: "#7a8aaa", marginTop: "2px" },
  routeLine: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" },
  duration: { fontSize: "11px", color: "#7a8aaa" },
  lineTrack: { width: "100%", display: "flex", alignItems: "center" },
  lineInner: { flex: 1, height: "1px", background: "linear-gradient(90deg, rgba(26,111,255,0.25), rgba(0,207,255,0.25))" },
  planeIcon: { fontSize: "14px", color: "#1a6fff", margin: "0 4px" },
  stops: { fontSize: "10px", fontWeight: 600 },
  flightFooter: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  cabinBadge: {
    fontSize: "11px", color: "#7a8aaa", background: "rgba(255,255,255,0.06)",
    padding: "3px 8px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.08)",
  },
  bookBtn: {
    padding: "8px 18px", borderRadius: "8px", border: "1px solid rgba(26,111,255,0.4)",
    background: "rgba(26,111,255,0.1)", color: "#1a6fff", fontSize: "13px", fontWeight: 600, cursor: "pointer",
    transition: "all 0.2s",
  },
  bookBtnDone: {
    border: "1px solid rgba(74,222,128,0.4)", background: "rgba(74,222,128,0.1)", color: "#4ade80", cursor: "default",
  },
  bookBtnLoading: { opacity: 0.6, cursor: "not-allowed" },
  suggestions: { display: "flex", gap: "8px", padding: "0 24px 12px", flexWrap: "wrap", justifyContent: "center", zIndex: 1 },
  suggestionChip: {
    padding: "8px 14px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.05)", color: "#c8d8f0", fontSize: "13px", cursor: "pointer",
  },
  footer: {
    padding: "14px 20px 20px", background: "rgba(255,255,255,0.03)",
    borderTop: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(12px)", zIndex: 5,
  },
  inputWrapper: {
    maxWidth: "860px", margin: "0 auto", display: "flex", alignItems: "center", gap: "10px",
    background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "16px", padding: "8px 10px 8px 16px",
  },
  inputIcon: { fontSize: "16px", flexShrink: 0 },
  input: { flex: 1, background: "transparent", border: "none", outline: "none", color: "#e8eaf0", fontSize: "14.5px", padding: "4px 0", caretColor: "#1a6fff" },
  sendBtn: {
    width: "38px", height: "38px", borderRadius: "10px", border: "none",
    background: "linear-gradient(135deg, #1a6fff, #005fcc)", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    boxShadow: "0 4px 14px rgba(26,111,255,0.4)",
  },
  sendArrow: { color: "#fff", fontSize: "18px", fontWeight: 700 },
  footerNote: { textAlign: "center", fontSize: "11px", color: "#404a60", margin: "8px 0 0" },
  toast: {
    position: "fixed", bottom: "90px", left: "50%", transform: "translateX(-50%)",
    background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)",
    color: "#4ade80", padding: "12px 24px", borderRadius: "12px", fontSize: "14px",
    fontWeight: 500, zIndex: 200, backdropFilter: "blur(8px)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.3)", whiteSpace: "nowrap",
  },
};

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
  @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
  input::placeholder { color: #506080; }
`;
