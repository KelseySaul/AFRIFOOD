import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Identity({ user, onClose }) {
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, [user.id]);

  async function fetchProfile() {
    const { data, error } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error("Error fetching profile:", error);
    } else if (data) {
      setName(data.display_name || "");
      setAvatarUrl(data.avatar_url || "");
      setPreview(data.avatar_url || null);
    }
  }

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `profile-pics/${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;

      // Fix: Use 'publicUrl' (camelCase) instead of 'public_url'
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;  // Correct property

      if (!publicUrl) throw new Error("Failed to retrieve public URL");

      setAvatarUrl(publicUrl);
      setPreview(publicUrl);  // Update preview to the uploaded URL for consistency
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!name.trim()) return alert("Please enter a name.");
    
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        display_name: name.trim(),  // Trim whitespace
        avatar_url: avatarUrl,  // Now correctly set from handleUpload
        email: user.email,  // Satisfies NOT NULL constraint
        updated_at: new Date()
      }, { onConflict: 'id' });

      if (error) throw error;

      // Trigger Success State
      setSuccess(true);
      
      // Delay closing so user sees the success state
      setTimeout(() => {
        onClose();
        window.location.reload();  // Ensures Navbar and Session sync perfectly
      }, 1200);

    } catch (err) {
      console.error("Update Error:", err.message);
      alert("Error: " + err.message);
      setLoading(false);  // Reset loading on error
    }
  };

  return (
    <div style={styles.overlay}>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes checkPop { 0% { transform: scale(0); } 70% { transform: scale(1.2); } 100% { transform: scale(1); } }
        
        .spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
        .success-check { font-size: 20px; animation: checkPop 0.4s ease-out forwards; }
        .avatar-hover:hover { transform: scale(1.05); }
        .avatar-hover:hover .edit-overlay { opacity: 1; }
      `}</style>

      <div style={styles.modal}>
        <button onClick={onClose} style={styles.closeBtn}>✕</button>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontFamily: 'Playfair Display', margin: '0 0 10px 0', fontSize: '1.8rem' }}>Studio Profile</h2>
          <p style={{ fontSize: '0.85rem', color: '#888' }}>Update your heritage identity</p>
        </div>
        
        {/* Profile Picture */}
        <div style={styles.avatarSection}>
          <div className="avatar-hover" style={styles.avatarWrapper} onClick={() => document.getElementById('avatar-file').click()}>
            <img 
              src={preview || `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`} 
              style={styles.img} 
              alt="Profile" 
            />
            <div className="edit-overlay" style={styles.editOverlay}>
              {loading ? '...' : 'CHANGE'}
            </div>
          </div>
          <input id="avatar-file" type="file" hidden accept="image/*" onChange={handleUpload} disabled={loading || success} />
        </div>

        {/* Input Fields */}
        <div style={{ marginBottom: '25px' }}>
          <label style={styles.label}>DISPLAY NAME</label>
          <input 
            style={styles.input} 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="e.g. Chef Kofi" 
            disabled={success}
          />
        </div>

        <div style={{ marginBottom: '25px' }}>
          <label style={styles.label}>EMAIL (Read Only)</label>
          <input 
            style={{ ...styles.input, backgroundColor: '#f9f9f9', color: '#999', cursor: 'not-allowed' }} 
            value={user.email} 
            disabled 
          />
        </div>

        {/* Action Button */}
        <button 
          style={{ 
            ...styles.btn, 
            background: success ? '#2E7D32' : '#1A120B',
            pointerEvents: (loading || success) ? 'none' : 'auto' 
          }} 
          onClick={updateProfile}
        >
          {loading ? (
            <div className="spinner"></div>
          ) : success ? (
            <span className="success-check">✓ Saved</span>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', backdropFilter: 'blur(10px)' },
  modal: { background: '#fff', width: '100%', maxWidth: '400px', padding: '40px', borderRadius: '40px', position: 'relative', boxShadow: '0 30px 60px rgba(0,0,0,0.4)' },
  closeBtn: { position: 'absolute', top: '25px', right: '25px', border: 'none', background: '#f5f5f5', width: '35px', height: '35px', borderRadius: '50%', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  avatarSection: { display: 'flex', justifyContent: 'center', marginBottom: '30px' },
  avatarWrapper: { width: '130px', height: '130px', borderRadius: '45px', overflow: 'hidden', position: 'relative', cursor: 'pointer', border: '4px solid #E2725B', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' },
  img: { width: '100%', height: '100%', objectFit: 'cover' },
  editOverlay: { position: 'absolute', bottom: 0, width: '100%', background: 'rgba(26, 18, 11, 0.85)', color: '#fff', fontSize: '10px', padding: '8px 0', fontWeight: 'bold', textAlign: 'center', backdropFilter: 'blur(4px)', opacity: 0.8, transition: '0.3s' },
  label: { fontSize: '0.65rem', fontWeight: '900', color: '#E2725B', letterSpacing: '1.5px', display: 'block', marginBottom: '8px' },
  input: { width: '100%', padding: '16px', borderRadius: '18px', border: '1px solid #EEE', outline: 'none', fontSize: '1rem', background: '#fdfdfd', boxSizing: 'border-box' },
  btn: { width: '100%', padding: '18px', color: '#fff', border: 'none', borderRadius: '18px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.4s ease', fontSize: '1rem' }
};