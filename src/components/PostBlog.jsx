import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function PostBlog({ user, onClose }) {
  const [loading, setLoading] = useState(false);
  const [blog, setBlog] = useState({ title: "", content: "" });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const handlePublish = async (status = 'published') => {
    if (!blog.title) return alert("Please at least add a title for your story.");
    if (status === 'published' && (!blog.content || !file)) {
        return alert("To publish, you need a cover photo and content!");
    }

    setLoading(true);
    try {
      let imageUrl = null;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const path = `blog-photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }

      // --- UPDATED INSERT LOGIC ---
      const { error } = await supabase.from("blogs").insert([{
        title: blog.title,
        content: blog.content,
        image_url: imageUrl,
        author_id: user.id, // Changed key from user_id to author_id
        status: status 
      }]);

      if (error) throw error;

      alert(status === 'published' ? "Story Published! ✍️" : "Draft Saved! 📁"); 
      onClose(); 
      
    } catch (err) { 
        console.error("Blog post error:", err);
        alert(err.message); 
    } finally { 
        setLoading(false); 
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button onClick={onClose} style={styles.closeBtn}>✕</button>
        
        <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontFamily: 'Playfair Display', margin: 0 }}>Heritage Studio</h2>
            <p style={{ fontSize: '0.8rem', color: '#888' }}>Capture your culinary memories.</p>
        </div>

        <div 
          style={{ ...styles.dropzone, backgroundImage: preview ? `url(${preview})` : 'none' }} 
          onClick={() => document.getElementById('b-img').click()}
        >
          {!preview && (
            <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '1.5rem' }}>📸</span>
                <p style={{ fontSize: '0.75rem', margin: '5px 0' }}>Add Cover Image</p>
            </div>
          )}
          <input id="b-img" type="file" hidden accept="image/*" onChange={e => { 
            const selectedFile = e.target.files[0];
            if (selectedFile) {
                setFile(selectedFile); 
                setPreview(URL.createObjectURL(selectedFile)); 
            }
          }} />
        </div>

        <input 
          style={styles.input} 
          placeholder="Enter a captivating title..." 
          value={blog.title}
          onChange={e => setBlog({ ...blog, title: e.target.value })} 
        />
        
        <textarea 
          style={{ ...styles.textarea, minHeight: '280px' }} 
          placeholder="Once upon a time in my grandmother's kitchen..." 
          value={blog.content}
          onChange={e => setBlog({ ...blog, content: e.target.value })} 
        />

        <div style={styles.actionRow}>
            <button style={styles.draftBtn} onClick={() => handlePublish('draft')} disabled={loading}>
                Save as Draft
            </button>
            <button style={styles.publishBtn} onClick={() => handlePublish('published')} disabled={loading}>
                {loading ? "Publishing..." : "Post Story"}
            </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px', backdropFilter: 'blur(5px)' },
  modal: { background: '#fff', width: '100%', maxWidth: '700px', padding: '40px', borderRadius: '35px', position: 'relative', maxHeight: '92vh', overflowY: 'auto' },
  closeBtn: { position: 'absolute', top: '25px', right: '25px', border: 'none', background: '#f5f5f5', width: '35px', height: '35px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  dropzone: { width: '100%', height: '240px', background: '#FDFCFB', border: '1px dashed #DDD', borderRadius: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundSize: 'cover', backgroundPosition: 'center', marginBottom: '20px' },
  input: { width: '100%', padding: '15px 0', marginBottom: '15px', border: 'none', borderBottom: '1px solid #EEE', fontSize: '1.6rem', fontFamily: 'Playfair Display', outline: 'none' },
  textarea: { width: '100%', padding: '15px', marginBottom: '25px', borderRadius: '15px', border: '1px solid #EEE', fontSize: '1.05rem', outline: 'none', lineHeight: '1.7', background: '#fcfcfc', fontFamily: 'inherit' },
  actionRow: { display: 'flex', gap: '15px' },
  draftBtn: { flex: 1, padding: '18px', background: '#f5f5f5', color: '#5C4033', border: 'none', borderRadius: '18px', fontWeight: 'bold', cursor: 'pointer' },
  publishBtn: { flex: 2, padding: '18px', background: '#1A120B', color: '#fff', border: 'none', borderRadius: '18px', fontWeight: 'bold', cursor: 'pointer' }
};