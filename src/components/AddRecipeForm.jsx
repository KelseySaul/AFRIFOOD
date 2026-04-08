import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AddRecipeForm({ user, onComplete }) {
  const [categories, setCategories] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  
  // Form States
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState(''); // Stores the UUID from categories table
  const [cookingTime, setCookingTime] = useState(30);
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [ingredients, setIngredients] = useState([{ item: '', amount: '', unit: '' }]);
  const [steps, setSteps] = useState(['']);

  // 1. Fetch categories on mount to populate the dropdown
  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, region')
        .order('region', { ascending: true });
      
      if (data) setCategories(data);
      if (error) console.error("Error fetching categories:", error.message);
    }
    fetchCategories();
  }, []);

  const addIngredient = () => setIngredients([...ingredients, { item: '', amount: '', unit: '' }]);
  const addStep = () => setSteps([...steps, '']);
  
  const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  const captureVideoFrames = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = URL.createObjectURL(file);
      video.muted = true;
      video.onloadedmetadata = () => {
        video.currentTime = Math.min(2, video.duration / 2); // Capture at 2s or middle
      };
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        URL.revokeObjectURL(video.src);
        resolve(dataUrl);
      };
    });
  };

  const handleUpload = async (file, bucket) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `public/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryId) return alert("Please select a region/category");
    
    setVerifying(true);
    try {
      // --- AI CONTENT VALIDATION ---
      let base64Image = null;
      if (imageFile) {
        base64Image = await toBase64(imageFile);
      }

      let videoFrames = null;
      if (videoFile) {
        // AI Optimization: Capture a frame for verification instead of the whole video
        videoFrames = await captureVideoFrames(videoFile);
      }

      const valResponse = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'recipe',
          data: { 
            title, 
            ingredients, 
            steps, 
            image: base64Image,
            videoFrame: videoFrames // Smart Sampler optimization
          }
        })
      });

      const validation = await valResponse.json();
      if (!validation.valid) {
        alert("🚨 Validation Error: " + validation.reason);
        setVerifying(false);
        return;
      }

      setVerifying(false);
      setUploading(true);
      
      const finalImageUrl = await handleUpload(imageFile, 'recipe-images');
      const finalVideoUrl = await handleUpload(videoFile, 'recipe-videos');

      const { error } = await supabase.from('recipes').insert([{
        user_id: user.id,
        category_id: categoryId,
        title,
        ingredients,
        steps,
        cooking_time: cookingTime,
        image_url: finalImageUrl,
        video_url: finalVideoUrl,
        status: 'pending'
      }]);

      if (error) throw error;
      alert("Recipe submitted for review!");
      onComplete();
    } catch (error) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={{ fontFamily: 'Playfair Display', color: 'var(--primary)' }}>Share Your Heritage</h2>
      
      <form onSubmit={handleSubmit} style={styles.form}>
        <input 
          type="text" 
          placeholder="Recipe Title (e.g., Nigerian Jollof Rice)" 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          required 
          style={styles.input} 
        />
        
        {/* 2. DYNAMIC DROPDOWN: Pulling directly from Categories table */}
        <select 
          value={categoryId} 
          onChange={e => setCategoryId(e.target.value)} 
          required 
          style={styles.input}
        >
          <option value="">-- Select Region --</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.region} - {cat.name}
            </option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="number" 
            placeholder="Mins" 
            value={cookingTime} 
            onChange={e => setCookingTime(e.target.value)} 
            style={styles.input} 
          />
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Cover Image</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => setImageFile(e.target.files[0])} 
              style={styles.fileInput} 
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Short Video (mp4/mov)</label>
            <input 
              type="file" 
              accept="video/*" 
              onChange={(e) => setVideoFile(e.target.files[0])} 
              style={styles.fileInput} 
            />
          </div>
        </div>

        {/* Ingredients Section */}
        <div style={styles.section}>
          <label>Ingredients</label>
          {ingredients.map((ing, i) => (
            <div key={i} style={{ display: 'flex', gap: '5px', marginBottom: '8px' }}>
              <input 
                placeholder="Item" 
                value={ing.item} 
                onChange={e => {
                  const n = [...ingredients]; n[i].item = e.target.value; setIngredients(n);
                }} 
                style={styles.input} 
              />
              <input 
                placeholder="Amt" 
                value={ing.amount} 
                onChange={e => {
                  const n = [...ingredients]; n[i].amount = e.target.value; setIngredients(n);
                }} 
                style={{ ...styles.input, width: '80px' }} 
              />
            </div>
          ))}
          <button type="button" onClick={addIngredient} style={styles.addBtn}>+ Add Ingredient</button>
        </div>

        <button type="submit" disabled={uploading || verifying} style={{
          ...styles.primaryBtn,
          background: verifying ? 'var(--accent)' : 'var(--primary)',
          opacity: (uploading || verifying) ? 0.7 : 1
        }}>
          {verifying ? 'Verifying Recipe Heritage...' : (uploading ? 'Processing...' : 'Submit Recipe')}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: { background: 'white', padding: '30px', borderRadius: '30px', maxWidth: '600px', margin: '0 auto', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  input: { padding: '12px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '1rem', width: '100%' },
  fileInput: { fontSize: '0.8rem', padding: '8px', border: '1px dashed var(--primary)', borderRadius: '10px', width: '100%' },
  addBtn: { background: 'none', border: '1px solid var(--accent)', color: 'var(--accent)', borderRadius: '10px', padding: '5px 10px', cursor: 'pointer', alignSelf: 'flex-start' },
  primaryBtn: { background: 'var(--primary)', color: 'white', padding: '15px', borderRadius: '50px', border: 'none', fontWeight: 'bold', cursor: 'pointer' },
  section: { marginTop: '10px' },
  label: { display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#888', marginBottom: '5px', textTransform: 'uppercase' }
};