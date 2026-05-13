import { useEffect, useState } from "react";
import { bookingApi } from "../lib/api";

export default function BookingsModal({ onClose }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const data = await bookingApi.getAll();
        setBookings(data || []);
      } catch (error) {
        console.error("Failed to fetch bookings:", error);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>My Bookings</h2>
          <button style={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {loading ? (
          <p style={styles.empty}>Loading your bookings...</p>
        ) : bookings.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>✈</div>
            <p style={styles.emptyTitle}>No bookings yet</p>
            <p style={styles.emptySubtitle}>Search for flights and book your first trip!</p>
          </div>
        ) : (
          <div style={styles.list}>
            {bookings.map((b) => (
              <div key={b._id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <div style={styles.airline}>{b.airline}</div>
                    {b.flight_no && <div style={styles.flightNo}>Flight {b.flight_no}</div>}
                  </div>
                  <div style={styles.right}>
                    <div style={styles.price}>{b.price}</div>
                    <span style={{ ...styles.badge, background: b.status === "confirmed" ? "rgba(74,222,128,0.12)" : "rgba(245,166,35,0.12)", color: b.status === "confirmed" ? "#4ade80" : "#f5a623", borderColor: b.status === "confirmed" ? "rgba(74,222,128,0.3)" : "rgba(245,166,35,0.3)" }}>
                      {b.status}
                    </span>
                  </div>
                </div>

                <div style={styles.route}>
                  <div style={styles.routePoint}>
                    <span style={styles.code}>{extractCode(b.from_airport)}</span>
                    <span style={styles.city}>{stripCode(b.from_airport)}</span>
                    <span style={styles.time}>{b.departure_time}</span>
                  </div>
                  <div style={styles.routeMid}>
                    <span style={styles.duration}>{b.duration}</span>
                    <div style={styles.line}><div style={styles.lineInner} /><span style={styles.plane}>✈</span><div style={styles.lineInner} /></div>
                    <span style={styles.stops}>{b.stops}</span>
                  </div>
                  <div style={{ ...styles.routePoint, alignItems: "flex-end" }}>
                    <span style={styles.code}>{extractCode(b.to_airport)}</span>
                    <span style={styles.city}>{stripCode(b.to_airport)}</span>
                    <span style={styles.time}>{b.arrival_time}</span>
                  </div>
                </div>

                <div style={styles.cardFooter}>
                  <span style={styles.cabin}>{b.cabin}</span>
                  <span style={styles.bookedAt}>Booked {new Date(b.booked_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function extractCode(airport) {
  const m = airport?.match(/\(([^)]+)\)/);
  return m ? m[1] : airport?.slice(0, 3).toUpperCase() || "";
}

function stripCode(airport) {
  return airport?.replace(/\s*\([^)]*\)/, "") || "";
}

const styles = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "16px",
  },
  modal: {
    background: "#0f1624", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px",
    width: "100%", maxWidth: "620px", maxHeight: "85vh", overflow: "hidden",
    display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "24px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)",
  },
  title: { margin: 0, fontSize: "20px", fontWeight: 700, color: "#e8eaf0" },
  closeBtn: {
    background: "none", border: "none", color: "#7a8aaa", fontSize: "24px", cursor: "pointer",
  },
  empty: { padding: "40px 24px", textAlign: "center", color: "#7a8aaa" },
  emptyState: { padding: "48px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" },
  emptyIcon: { fontSize: "36px", background: "linear-gradient(135deg, #1a6fff, #00cfff)", borderRadius: "50%", width: "72px", height: "72px", display: "flex", alignItems: "center", justifyContent: "center" },
  emptyTitle: { margin: 0, fontSize: "16px", fontWeight: 600, color: "#e8eaf0" },
  emptySubtitle: { margin: 0, fontSize: "13px", color: "#7a8aaa" },
  list: { overflowY: "auto", padding: "16px 24px", display: "flex", flexDirection: "column", gap: "12px" },
  card: {
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "14px", padding: "16px",
  },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" },
  airline: { fontSize: "14px", fontWeight: 600, color: "#c8d8f0" },
  flightNo: { fontSize: "11px", color: "#506080", marginTop: "2px" },
  right: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" },
  price: { fontSize: "18px", fontWeight: 700, color: "#f5a623" },
  badge: { fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "20px", border: "1px solid", textTransform: "capitalize" },
  route: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" },
  routePoint: { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "1px", minWidth: "55px" },
  code: { fontSize: "20px", fontWeight: 700, lineHeight: 1 },
  city: { fontSize: "10px", color: "#506080", maxWidth: "70px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  time: { fontSize: "11px", color: "#7a8aaa", marginTop: "2px" },
  routeMid: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" },
  duration: { fontSize: "10px", color: "#7a8aaa" },
  line: { width: "100%", display: "flex", alignItems: "center" },
  lineInner: { flex: 1, height: "1px", background: "rgba(26,111,255,0.25)" },
  plane: { fontSize: "12px", color: "#1a6fff", margin: "0 3px" },
  stops: { fontSize: "9px", fontWeight: 600, color: "#4ade80" },
  cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  cabin: { fontSize: "11px", color: "#7a8aaa", background: "rgba(255,255,255,0.06)", padding: "3px 8px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.08)" },
  bookedAt: { fontSize: "11px", color: "#506080" },
};
