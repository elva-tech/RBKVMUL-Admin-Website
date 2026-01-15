import { useState } from "react";
import { popupData as initialData } from "/src/data/popupData"; 
import { getFile, commitFile } from "../utils/github";
import Swal from "sweetalert2";

export default function AnnouncementAdmin() {
  
  const [data, setData] = useState({
    active: true,
    title: { en: "Announcement", ka: "ಪ್ರಕಟಣೆ" },
    subtitle: { en: "", ka: "" },
    description: { en: "", ka: "" },
    images: [] 
  });

  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState([]); // Changed to handle array

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = (error) => reject(error);
  });

  const handleSave = async () => {
    // Check if subtitle and at least one image exists
    if (!data.subtitle.en || imageFiles.length === 0) {
      Swal.fire("Please fill in the English Subtitle and select at least one image.", "warning");
      return;
    }

    setLoading(true);
    try {
      let currentData = { ...data };
      const uploadedPaths = [];

      // 1. Upload All Selected Images to public/assets/
      for (const file of imageFiles) {
        const fileName = `popup-${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
        const base64 = await toBase64(file);
        
        await commitFile({
          path: `public/assets/${fileName}`,
          content: base64,
          message: "Update announcement image",
          isBase64: true
        });
        uploadedPaths.push(`/assets/${fileName}`);
      }
      
      currentData.images = uploadedPaths;

      // 2. Update the Data File
      const file = await getFile("src/data/popupData.js");
      const content = `export const popupData = ${JSON.stringify(currentData, null, 2)};`;

      await commitFile({
        path: "src/data/popupData.js",
        sha: file.sha,
        content,
        message: "Update announcement content",
        isBase64: false
      });

      // 3. Clear the form back to empty after success
      setData({
        active: true,
        title: { en: "Announcement", ka: "ಪ್ರಕಟಣೆ" },
        subtitle: { en: "", ka: "" },
        description: { en: "", ka: "" },
        images: currentData.images
      });
      setImageFiles([]);

      Swal.fire({
        title: 'Published! ✅',
        text: 'The website will update in 2 minutes.',
        icon: 'success',
        confirmButtonColor: '#0a4da2'
      });
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Announcement Manager</h2>
      <div style={styles.card}>
        <div style={styles.formSection}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>English title</label>
            <input 
              style={styles.input} 
              placeholder="Enter English title..."
              value={data.subtitle.en} 
              onChange={e => setData({...data, subtitle: {...data.subtitle, en: e.target.value}})} 
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Kannada title</label>
            <input 
              style={styles.input} 
              placeholder="ಕನ್ನಡ ಶೀರ್ಷಿಕೆ ನಮೂದಿಸಿ..."
              value={data.subtitle.ka} 
              onChange={e => setData({...data, subtitle: {...data.subtitle, ka: e.target.value}})} 
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>English Description</label>
            <textarea 
              style={{...styles.input, height: '80px'}} 
              placeholder="Enter English Description..."
              value={data.description.en} 
              onChange={e => setData({...data, description: {...data.description, en: e.target.value}})} 
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Kannada Description</label>
            <textarea 
              style={{...styles.input, height: '80px'}} 
              placeholder="ವಿವರಣೆಯನ್ನು ನಮೂದಿಸಿ..."
              value={data.description.ka} 
              onChange={e => setData({...data, description: {...data.description, ka: e.target.value}})} 
            />
          </div>
          
          <div style={styles.imageSection}>
            <label style={styles.label}>Upload New Images (Select multiple)</label>
            <input 
              type="file" 
              accept="image/*" 
              multiple 
              onChange={e => setImageFiles(Array.from(e.target.files))} 
            />
            {data.images && data.images.length > 0 && (
              <div style={{marginTop: '10px'}}>
                <p style={{fontSize: '11px', color: '#666'}}>Current Live Images ({data.images.length}):</p>
                <div style={{display: 'flex', gap: '5px', overflowX: 'auto'}}>
                  {data.images.map((img, idx) => (
                    <img 
                      key={idx}
                      src={img} 
                      style={{width: '80px', borderRadius: '4px'}} 
                      onError={(e) => { e.target.src = `https://rbkvmul-website.vercel.app${img}`; }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={handleSave} 
          disabled={loading}
          style={{ ...styles.saveButton, backgroundColor: loading ? "#ccc" : "#007bff" }}
        >
          {loading ? "Processing..." : "Publish Announcement"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: "40px 20px", maxWidth: "800px", margin: "auto", fontFamily: "sans-serif" },
  header: { textAlign: "center", marginBottom: "30px", color: "#333" },
  card: { background: "#fff", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" },
  formSection: { display: "flex", flexDirection: "column", gap: "20px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "5px" },
  label: { fontSize: "13px", fontWeight: "600", color: "#555" },
  input: { padding: "12px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px" },
  imageSection: { padding: "15px", border: "1px dashed #ccc", borderRadius: "8px" },
  saveButton: { marginTop: "25px", padding: "15px", color: "#fff", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "bold", cursor: "pointer", width: "100%" }
};