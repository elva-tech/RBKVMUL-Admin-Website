import { useState, useEffect } from "react";
import { getFile, commitFile, decodeBase64UTF8 } from "../utils/github";
import Swal from "sweetalert2";

export default function NotificationsAdmin() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [docFile, setDocFile] = useState(null);
  const [form, setForm] = useState({ titleEn: "", titleKa: "", date: "" });

  useEffect(() => { fetchLiveNotifs(); }, []);

  const fetchLiveNotifs = async () => {
    try {
      const file = await getFile("src/data/notofications.js");
      if (file && file.content) {
        const decoded = decodeBase64UTF8(file.content);
        const match = decoded.match(/\[[\s\S]*\]/);
        if (match) setNotifications(JSON.parse(match[0]));
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = (error) => reject(error);
  });

 const addNotification = async () => {
    if (!form.titleEn || !form.date) return Swal.fire("Warning", "Fill required fields", "warning");
    setLoading(true);
    try {
      let uploadedFileUrl = "";
      if (docFile) {
        const fileName = `notif-${Date.now()}-${docFile.name.replace(/\s+/g, '-')}`;
        const base64 = await toBase64(docFile);
        
        // 1. Upload the physical file to GitHub
        await commitFile({
          path: `public/pdfs/${fileName}`,
          content: base64,
          message: `Upload file: ${fileName}`,
          isBase64: true,
        });

        // 2. Create the TEXT link to that file
        uploadedFileUrl = `https://raw.githubusercontent.com/elva-tech/RBKVMUL-website/main/public/pdfs/${fileName}`;
      }

      // 3. Create the data object
      const newItem = {
        id: Date.now(),
        title: { en: form.titleEn, ka: form.titleKa || form.titleEn },
        date: form.date,
        fileUrl: uploadedFileUrl // This is now a clean string
      };

      const updated = [newItem, ...notifications];

      // 4. SAVE TO REPO - This is the most important part
      const dataFile = await getFile("src/data/notofications.js");
      
      // JSON.stringify converts the 'uploadedFileUrl' into "https://raw..." 
      // so it saves as a string, not a variable.
      const content = `export const notifications = ${JSON.stringify(updated, null, 2)};`;

      await commitFile({
        path: "src/data/notofications.js",
        sha: dataFile.sha,
        content,
        message: "Add notification with fixed URL",
        isBase64: false,
      });

      setNotifications(updated);
      setForm({ titleEn: "", titleKa: "", date: "" });
      setDocFile(null);
      Swal.fire("Success! ✅", "Notification Added", "success");
    } catch (err) { 
      Swal.fire("Error", err.message, "error"); 
    } finally { 
      setLoading(false); 
    }
  };

  const deleteNotification = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "Delete this permanently?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes'
    });

    if (result.isConfirmed) {
      const updated = notifications.filter((n) => n.id !== id);
      setLoading(true);
      try {
        const dataFile = await getFile("src/data/notofications.js");
        const content = `export const notifications = ${JSON.stringify(updated, null, 2)};`;
        await commitFile({
          path: "src/data/notofications.js",
          sha: dataFile.sha,
          content,
          message: "Delete notification",
          isBase64: false,
        });
        setNotifications(updated);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
  };

  return (
   <div style={styles.container}>
      <h2 style={styles.header}>Manage Notifications</h2>
      <div style={styles.card}>
        <div style={styles.formGrid}>
          <input style={styles.input} placeholder="Title (English)" value={form.titleEn} onChange={e => setForm({ ...form, titleEn: e.target.value })} />
          <input style={styles.input} placeholder="Title (Kannada)" value={form.titleKa} onChange={e => setForm({ ...form, titleKa: e.target.value })} />
          <input style={styles.input} placeholder="Date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          <input type="file" onChange={e => setDocFile(e.target.files[0])} />
          <button style={styles.addButton} onClick={addNotification} disabled={loading}>{loading ? "Saving..." : "Add"}</button>
        </div>
      </div>

      <div style={styles.list}>
        {notifications.map((item) => (
          <div key={item.id} style={styles.listItem}>
            <div style={{ flex: 1 }}>
              <div style={styles.dateTag}>{item.date}</div>
              <h4 style={styles.itemTitle}>{item.title.en}</h4>
              {item.fileUrl && <span style={{ fontSize: '11px', color: 'green' }}>📎 File Attached</span>}
            </div>
            <button onClick={() => deleteNotification(item.id)} style={styles.deleteButton}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: "40px 20px", maxWidth: "800px", margin: "auto", fontFamily: "sans-serif" },
  header: { textAlign: "center", color: "#222" },
  card: { background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", marginBottom: 30 },
  formGrid: { display: "flex", flexDirection: "column", gap: 12 },
  input: { padding: "12px", borderRadius: "6px", border: "1px solid #ddd" },
  addButton: { padding: "14px", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" },
  list: { display: "flex", flexDirection: "column", gap: 16 },
  listItem: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", padding: "20px", borderRadius: "8px", border: "1px solid #eee" },
  dateTag: { fontSize: "12px", color: "#007bff", fontWeight: "bold" },
  itemTitle: { margin: "4px 0", fontSize: "16px" },
  deleteButton: { backgroundColor: "transparent", color: "#dc3545", border: "1px solid #dc3545", padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }
};