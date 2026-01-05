import { useState, useEffect } from "react";
import { getFile, commitFile, decodeBase64UTF8 } from "../utils/github";
import Swal from "sweetalert2";

export default function NotificationsAdmin() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ titleEn: "", titleKa: "", date: "" });

  useEffect(() => { fetchLiveNotifs(); }, []);

  const fetchLiveNotifs = async () => {
    try {
      const fileData = await getFile("src/data/notofications.js");
      if (fileData && fileData.content) {
        const decoded = decodeBase64UTF8(fileData.content);
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
    if (!form.titleEn || !form.date) {
      return Swal.fire("Error", "Need Title & Date", "error");
    }
    
    setLoading(true);
    
    try {
      let fileUrl = ""; // Use fileUrl consistently
      
      // Upload file if selected
      if (file) {
        const fileName = `notif-${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
        const base64 = await toBase64(file);
        
        await commitFile({
          path: `public/pdfs/${fileName}`,
          content: base64,
          message: `Upload ${fileName}`,
          isBase64: true,
        });
        
        // Use FULL URL to avoid React Router interference
        // fileUrl = `https://github.com/elva-tech/RBKVMUL-website/tree/main/public/pdfs/${fileName}`;
        fileUrl = `https://raw.githubusercontent.com/elva-tech/RBKVMUL-website/main/public/pdfs/${fileName}`;
      }

      // Create notification object
      const newNotif = {
        id: Date.now(),
        title: { 
          en: form.titleEn, 
          ka: form.titleKa || form.titleEn 
        },
        date: form.date,
        fileUrl: fileUrl // CONSISTENT property name
      };

      // Save to data file
      const updated = [newNotif, ...notifications];
      const dataFile = await getFile("src/data/notofications.js");
      const content = `export const notifications = ${JSON.stringify(updated, null, 2)};`;

      await commitFile({
        path: "src/data/notofications.js",
        sha: dataFile.sha,
        content,
        message: "Add notification",
        isBase64: false,
      });

      setNotifications(updated);
      setForm({ titleEn: "", titleKa: "", date: "" });
      setFile(null);
      
      Swal.fire("Success", "Notification added!", "success");
      
    } catch (err) { 
      console.error(err);
      Swal.fire("Error", err.message, "error"); 
    } finally { 
      setLoading(false); 
    }
  };

  const deleteNotification = async (id) => {
    const result = await Swal.fire({
      title: 'Delete?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes'
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        const updated = notifications.filter((n) => n.id !== id);
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
        Swal.fire("Deleted!", "", "success");
      } catch (err) { 
        Swal.fire("Error", err.message, "error");
      } finally { 
        setLoading(false); 
      }
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>📢 Manage Notifications</h2>
      
      <div style={styles.card}>
        <div style={styles.formGrid}>
          <input 
            style={styles.input} 
            placeholder="Title (English)" 
            value={form.titleEn} 
            onChange={e => setForm({ ...form, titleEn: e.target.value })} 
          />
          
          <input 
            style={styles.input} 
            placeholder="Title (Kannada)" 
            value={form.titleKa} 
            onChange={e => setForm({ ...form, titleKa: e.target.value })} 
          />
          
          <input 
            style={styles.input} 
            type="date"
            value={form.date} 
            onChange={e => setForm({ ...form, date: e.target.value })} 
          />
          
          <input 
            type="file" 
            accept=".pdf,.doc,.docx,.jpg,.png"
            onChange={e => setFile(e.target.files[0])} 
            style={styles.fileInput}
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

      <div style={styles.list}>
        {notifications.map((item) => (
          <div key={item.id} style={styles.listItem}>
            <div style={{ flex: 1 }}>
              <div style={styles.dateTag}>📅 {item.date}</div>
              <h4 style={styles.itemTitle}>{item.title.en}</h4>
              
              {(item.fileUrl || item.file) && (
                <a 
                  href={item.fileUrl || item.file} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{fontSize: '13px', color: '#007bff'}}
                >
                  📎 View File
                </a>
              )}
            </div>
            
            <button 
              onClick={() => deleteNotification(item.id)} 
              style={styles.deleteButton}
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
  container: { padding: "40px 20px", maxWidth: "900px", margin: "auto", fontFamily: "sans-serif" },
  header: { textAlign: "center", color: "#222", marginBottom: "30px" },
  card: { background: "#fff", padding: 30, borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", marginBottom: 40 },
  formGrid: { display: "flex", flexDirection: "column", gap: 16 },
  input: { padding: "14px", borderRadius: "8px", border: "1px solid #ddd" },
  fileInput: { padding: "10px", border: "2px dashed #ddd", borderRadius: "8px", width: "100%", cursor: "pointer" },
  addButton: { padding: "16px", backgroundColor: "#28a745", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", marginTop: "10px" },
  list: { display: "flex", flexDirection: "column", gap: 16 },
  listItem: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: "#fff", padding: "24px", borderRadius: "10px", border: "1px solid #e0e0e0" },
  dateTag: { fontSize: "13px", color: "#007bff", fontWeight: "bold", marginBottom: "8px" },
  itemTitle: { margin: "0 0 8px 0", fontSize: "18px" },
  deleteButton: { backgroundColor: "#dc3545", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }
};