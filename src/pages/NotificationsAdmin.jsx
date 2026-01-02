import { useState, useEffect } from "react";
import { getFile, commitFile, decodeBase64UTF8 } from "../utils/github";
import Swal from "sweetalert2";

export default function NotificationsAdmin() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    titleEn: "",
    titleKa: "",
    date: "",
  });

  useEffect(() => {
    const fetchLiveNotifs = async () => {
      try {
        const file = await getFile("src/data/notofications.js");
        if (file && file.content) {
          // Use proper UTF-8 decoding for Kannada text
          const decoded = decodeBase64UTF8(file.content);
          const match = decoded.match(/\[[\s\S]*\]/);
          if (match) setNotifications(JSON.parse(match[0]));
        }
      } catch (err) {
        console.error("Notifications Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLiveNotifs();
  }, []);

  // Save changes to GitHub repo
  const saveToRepo = async (updatedData) => {
    setLoading(true);
    try {
      const filePath = "src/data/notofications.js";
      const file = await getFile(filePath);
      if (!file) {
        throw new Error(`File not found at ${filePath}. Please check your GitHub folder structure.`);
      }

      const content = `export const notifications = ${JSON.stringify(updatedData, null, 2)};`;

      await commitFile({
        path: filePath,
        sha: file.sha,
        content,
        message: "Update notifications data",
        isBase64: false,
      });

      setNotifications(updatedData);
      Swal.fire("Success! ✅", "Notification list updated.", "success");
    } catch (err) {
      console.error(err);
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const addNotification = async () => {
    if (!form.titleEn || !form.date) {
      return Swal.fire("Warning", "Title and Date are required", "warning");
    }

    const updated = [
      {
        id: Date.now(),
        title: {
          en: form.titleEn,
          ka: form.titleKa || "",
        },
        date: form.date,
      },
      ...notifications,
    ];

    await saveToRepo(updated);
    setForm({ titleEn: "", titleKa: "", date: "" });
  };

  const deleteNotification = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This will delete the notification permanently.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!'
    });
    
    if (result.isConfirmed) {
      const updated = notifications.filter((n) => n.id !== id);
      await saveToRepo(updated);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Manage Notifications</h2>

      <div style={styles.card}>
        <h3 style={{ marginTop: 0 }}>Create New Notification</h3>
        <div style={styles.formGrid}>
          <input
            style={styles.input}
            placeholder="Title (English)"
            value={form.titleEn}
            onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
          />
          <input
            style={styles.input}
            placeholder="Title (Kannada)"
            value={form.titleKa}
            onChange={(e) => setForm({ ...form, titleKa: e.target.value })}
          />
          <input
            style={styles.input}
            type="text"
            placeholder="Date (e.g., Oct 24, 2023)"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
          <button 
            style={styles.addButton} 
            onClick={addNotification} 
            disabled={loading}
          >
            {loading ? "Saving..." : "Add Notification"}
          </button>
        </div>
      </div>

      <hr style={styles.divider} />

      <div style={styles.list}>
        {notifications.map((item) => (
          <div key={item.id} style={styles.listItem}>
            <div style={{ flex: 1 }}>
              <div style={styles.dateTag}>{item.date}</div>
              <div style={styles.langLabel}>ENGLISH</div>
              <h4 style={styles.itemTitle}>{item.title.en}</h4>
              
              <div style={{ ...styles.langLabel, marginTop: 10 }}>KANNADA</div>
              <h4 style={styles.itemTitle}>{item.title.ka || "—"}</h4>
            </div>
            <button
              onClick={() => deleteNotification(item.id)}
              style={styles.deleteButton}
              disabled={loading}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: "40px 20px", maxWidth: "800px", margin: "auto", fontFamily: "sans-serif", backgroundColor: "#fcfcfc" },
  header: { textAlign: "center", color: "#222" },
  card: { background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", marginBottom: 30 },
  formGrid: { display: "flex", flexDirection: "column", gap: 12 },
  input: { padding: "12px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "15px" },
  addButton: { padding: "14px", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" },
  divider: { margin: "40px 0", border: "0", borderTop: "1px solid #eee" },
  list: { display: "flex", flexDirection: "column", gap: 16 },
  listItem: { 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center", 
    background: "#fff", 
    padding: "20px", 
    borderRadius: "8px", 
    border: "1px solid #eee" 
  },
  dateTag: { fontSize: "12px", color: "#007bff", fontWeight: "bold", marginBottom: "8px" },
  langLabel: { fontSize: "10px", color: "#999", letterSpacing: "1px" },
  itemTitle: { margin: "4px 0 0 0", color: "#333", fontSize: "16px" },
  deleteButton: { 
    backgroundColor: "transparent", 
    color: "#dc3545", 
    border: "1px solid #dc3545", 
    padding: "8px 16px", 
    borderRadius: "6px", 
    cursor: "pointer",
    marginLeft: "20px"
  }
};