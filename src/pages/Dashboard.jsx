
import { logout } from "../utils/auth";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: 40 }}>
      <h1>Admin Dashboard</h1>

      <div style={grid}>
        <Card title="Announcements" onClick={() => navigate("/announcements")} />
        <Card title="News" onClick={() => navigate("/news")} />
        <Card title="Notifications" onClick={() => navigate("/notifications")} />
      </div>

      <div className="logout-wrapper">
        <button className="logout" onClick={() => { logout(); navigate("/login"); }}>
        Logout
      </button>
      </div>
    </div>
  );
}

function Card({ title, onClick }) {
  return (
    <div style={card} onClick={onClick}>
      <h3>{title}</h3>
      <p>Manage {title.toLowerCase()}</p>
    </div>
  );
}

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 20,
  marginTop: 20,
};

const card = {
  padding: 20,
  borderRadius: 8,
  background: "#fff",
  cursor: "pointer",
  boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
};
