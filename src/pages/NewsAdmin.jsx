import { useState, useEffect } from "react";
import { getFile, commitFile, decodeBase64UTF8 } from "../utils/github";
import Swal from "sweetalert2";

export default function NewsAdmin() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    titleEn: "", titleKa: "", descEn: "", descKa: "", imageFile: null,
  });

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const file = await getFile("src/data/news.js");
        if (file && file.content) {
          // Use proper UTF-8 decoding for Kannada text
          const decoded = decodeBase64UTF8(file.content);
          const match = decoded.match(/\[[\s\S]*\]/);
          if (match) {
            setNews(JSON.parse(match[0]));
          }
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = (error) => reject(error);
  });

  const saveToRepo = async (updatedNews, newImageData = null) => {
    setLoading(true);
    try {
      // 1. Update the Data File
      const file = await getFile("src/data/news.js");
      const content = `export const news = ${JSON.stringify(updatedNews, null, 2)};`;

      await commitFile({
        path: "src/data/news.js",
        sha: file.sha,
        content,
        message: "Update news data",
        isBase64: false,
      });

      // 2. Upload Image to public/images/
      if (newImageData) {
        await commitFile({
          path: `public/images/${newImageData.name}`,
          content: newImageData.base64,
          message: `Upload image: ${newImageData.name}`,
          isBase64: true,
        });
      }

      setNews(updatedNews);
      Swal.fire("Success! ✅", "News/Events list updated.", "success");
    } catch (err) {
      console.error(err);
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const addNews = async () => {
    if (!form.titleEn || !form.imageFile) return Swal.fire("Wait!", "Title and Image are required.", "warning");

    const fileName = `${Date.now()}-${form.imageFile.name.replace(/\s+/g, '-')}`;
    const base64Image = await toBase64(form.imageFile);

    const newItem = {
      id: Date.now(),
      title: { en: form.titleEn, ka: form.titleKa || form.titleEn },
      description: { en: form.descEn, ka: form.descKa || form.descEn },
      image: `/images/${fileName}`,
    };

    const updated = [newItem, ...news];
    await saveToRepo(updated, { name: fileName, base64: base64Image });
    setForm({ titleEn: "", titleKa: "", descEn: "", descKa: "", imageFile: null });
  };

  
  const deleteNews = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This will delete the News/Events permanently.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!'
    });
    if (result.isConfirmed) {
      const updated = news.filter((n) => n.id !== id);
      await saveToRepo(updated);
    }
  };

  const renderText = (field, lang) => {
    if (!field) return "";
    return typeof field === 'string' ? field : (field[lang] || field.en);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>News Management Dashboard</h2>

      <div style={styles.card}>
        <h3 style={{ marginTop: 0 }}>Add New Article</h3>
        <div style={styles.formGrid}>
          <input style={styles.input} placeholder="Title (EN)" value={form.titleEn} onChange={e => setForm({ ...form, titleEn: e.target.value })} />
          <input style={styles.input} placeholder="Title (KN)" value={form.titleKa} onChange={e => setForm({ ...form, titleKa: e.target.value })} />
          <textarea style={styles.input} placeholder="Description (EN)" value={form.descEn} onChange={e => setForm({ ...form, descEn: e.target.value })} />
          <textarea style={styles.input} placeholder="Description (KN)" value={form.descKa} onChange={e => setForm({ ...form, descKa: e.target.value })} />

          <div style={styles.fileInputWrapper}>
            <label>Upload Image: </label>
            <input type="file" accept="image/*" onChange={e => setForm({ ...form, imageFile: e.target.files[0] })} />
          </div>

          <button style={styles.addButton} onClick={addNews} disabled={loading}>
            {loading ? "Publishing the changes..." : "Publish News"}
          </button>
        </div>
      </div>

      <div style={styles.list} className="news-list">
        {news.map((item) => (
          <div key={item.id} style={styles.listItem} className="news-item">
            <img
              src={item.image}
              alt=""
              style={{ width: "190px", height: "190px", objectFit: "cover", borderRadius: "4px" }}
              onError={(e) => {
                const liveUrl = `https://rbkvmul-website.vercel.app/${item.image.replace(/^\//, '')}`;
                if (e.target.src !== liveUrl) {
                  e.target.src = liveUrl;
                } else {
                  e.target.src = "https://via.placeholder.com/80x50?text=Uploading...";
                }
              }}
            />
            <div style={{ flex: 1 }} className="news-item-content">
              <div style={styles.langTag}>English</div>
              <h4 style={styles.itemTitle}>{renderText(item.title, 'en')}</h4>
              <p style={styles.itemDesc}>{renderText(item.description, 'en')}</p>

              <div style={{ ...styles.langTag, marginTop: 10 }}>Kannada</div>
              <h4 style={styles.itemTitle}>{renderText(item.title, 'ka')}</h4>
              <p style={styles.itemDesc}>{renderText(item.description, 'ka')}</p>
            </div>
            <div style={styles.actionBox}>
              <button onClick={() => deleteNews(item.id)} style={styles.deleteButton} disabled={loading}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: "40px 20px", maxWidth: "1000px", margin: "auto", fontFamily: "system-ui, sans-serif", backgroundColor: "#f9f9f9" },
  header: { textAlign: "center", color: "#333", marginBottom: 30 },
  card: { background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 4px 6px rgba(0,0,0,0.1)", marginBottom: 40 },
  formGrid: { display: "flex", flexDirection: "column", gap: 12 },
  input: { padding: 12, borderRadius: 6, border: "1px solid #ddd", fontSize: 16 },
  fileInputWrapper: { padding: "10px 0" },
  addButton: { padding: "14px", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold" },
  list: { display: "flex", flexDirection: "column", gap: 16 },
  listItem: { display: "flex", gap: 20, background: "#fff", padding: 20, borderRadius: 12, border: "1px solid #eee", alignItems: "start" },
  itemTitle: { margin: "4px 0", fontSize: 18 },
  itemDesc: { margin: 0, color: "#666", fontSize: 14 },
  langTag: { fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#999", fontWeight: "bold" },
  deleteButton: { backgroundColor: "#fff", color: "#dc3545", border: "1px solid #dc3545", padding: "8px 16px", borderRadius: 6, cursor: "pointer" },
  actionBox: { display: "flex", alignItems: "flex-start", flexShrink: 0 },
};