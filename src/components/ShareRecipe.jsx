import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function ShareRecipe({ user, onClose }) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [recipe, setRecipe] = useState({ 
    title: "", 
    short_description: "", 
    ingredients: "", 
    steps: "", 
    category_id: "", 
    location: "",
    cooking_time: "", 
    difficulty: "Easy" 
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    // Fetch categories for the region dropdown
    supabase.from("categories").select("*").then(({ data }) => setCategories(data || []));
  }, []);

  const handlePublish = async () => {
    // Validation: Ensure all critical fields are filled
    if (!recipe.title || !recipe.short_description || !file || !recipe.cooking_time) {
      return alert("Photo, Title, Description, and Cooking Time are required.");
    }
    
    setLoading(true);

    try {
      // 1. Upload Image to Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const path = `recipe-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL (Corrected to camelCase)
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      const publicImageUrl = urlData.publicUrl;

      // 3. Insert Recipe into Database
      const { error } = await supabase.from("recipes").insert([{
        ...recipe,
        cooking_time: parseInt(recipe.cooking_time) || 0,
        ingredients: recipe.ingredients.split('\n').filter(i => i.trim() !== ""),
        steps: recipe.steps.split('\n').filter(s => s.trim() !== ""),
        image_url: publicImageUrl,
        user_id: user.id,
        status: 'approved'
      }]);

      if (error) throw error;

      alert("Heritage Published! ✨");
      onClose();
      window.location.reload(); // Refresh to show new recipe in feed
    } catch (err) {
      console.error("Publishing error:", err.message);
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button onClick={onClose} style={styles.closeBtn}>✕</button>
        <h2 style={{fontFamily: 'Playfair Display', color: '#1A120B', marginBottom: '25px'}}>Share Heritage Recipe</h2>
        
        {/* Image Upload Dropzone */}
        <div 
          style={{...styles.dropzone, backgroundImage: preview ? `url(${preview})` : 'none'}} 
          onClick={() => document.getElementById('r-img').click()}
        >
          {!preview && <div style={{textAlign: 'center', color: '#888'}}>+ Upload Meal Photo</div>}
          <input id="r-img" type="file" hidden accept="image/*" onChange={e => { 
            const selectedFile = e.target.files[0];
            if (selectedFile) {
              setFile(selectedFile); 
              setPreview(URL.createObjectURL(selectedFile)); 
            }
          }} />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>RECIPE TITLE</label>
          <input style={styles.input} placeholder="e.g. Egusi Soup" value={recipe.title} onChange={e => setRecipe({...recipe, title: e.target.value})} />
        </div>

        {/* Short Description */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>SHORT DESCRIPTION (For the feed card)</label>
          <input 
            style={styles.input} 
            placeholder="A brief catchy sentence about this dish..." 
            maxLength={120}
            value={recipe.short_description} 
            onChange={e => setRecipe({...recipe, short_description: e.target.value})} 
          />
        </div>

        {/* Time and Difficulty Row */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>TIME (MINS)</label>
            <input type="number" style={styles.input} placeholder="45" value={recipe.cooking_time} onChange={e => setRecipe({...recipe, cooking_time: e.target.value})} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>DIFFICULTY</label>
            <select style={styles.input} value={recipe.difficulty} onChange={e => setRecipe({...recipe, difficulty: e.target.value})}>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>HERITAGE REGION</label>
          <select style={styles.input} value={recipe.category_id} onChange={e => setRecipe({...recipe, category_id: e.target.value})}>
             <option value="">Select Region</option>
             {categories.map(c => <option key={c.id} value={c.id}>{c.region} — {c.name}</option>)}
          </select>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>INGREDIENTS (One per line)</label>
          <textarea style={styles.textarea} placeholder="3 cups of rice..." value={recipe.ingredients} onChange={e => setRecipe({...recipe, ingredients: e.target.value})} />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>PROCEDURE (One per line)</label>
          <textarea style={styles.textarea} placeholder="Wash the rice..." value={recipe.steps} onChange={e => setRecipe({...recipe, steps: e.target.value})} />
        </div>
        
        <button style={styles.btn} onClick={handlePublish} disabled={loading}>
          {loading ? "Stirring and seasoning..." : "Publish Heritage"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(5px)' },
  modal: { background: '#fff', width: '100%', maxWidth: '550px', padding: '40px', borderRadius: '40px', position: 'relative', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' },
  closeBtn: { position: 'absolute', top: '25px', right: '25px', border: 'none', background: '#f5f5f5', width: '35px', height: '35px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' },
  dropzone: { width: '100%', height: '180px', border: '2px dashed #EEE', borderRadius: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundSize: 'cover', backgroundPosition: 'center', marginBottom: '25px', backgroundColor: '#FAFAFA', overflow: 'hidden' },
  inputGroup: { marginBottom: '20px' },
  label: { fontSize: '0.65rem', fontWeight: 'bold', color: '#E2725B', marginBottom: '8px', display: 'block', letterSpacing: '1px' },
  input: { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #EEE', outline: 'none', background: '#fdfdfd', boxSizing: 'border-box', fontSize: '1rem' },
  textarea: { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #EEE', minHeight: '100px', outline: 'none', background: '#fdfdfd', boxSizing: 'border-box', fontSize: '1rem', fontFamily: 'inherit' },
  btn: { width: '100%', padding: '18px', background: '#1A120B', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }
};