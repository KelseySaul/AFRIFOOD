import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AddRecipeForm({ user, onComplete }) {
  const [categories, setCategories] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  // Form States
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState(''); // Stores the UUID from categories table
  const [cookingTime, setCookingTime] = useState(30);
  const [imageFile, setImageFile] = useState(null);
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

  const handleUpload = async () => {
    if (!imageFile) return null;
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `public/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('recipe-images')
      .upload(filePath, imageFile);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('recipe-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryId) return alert("Please select a region/category");
    
    setUploading(true);
    try {
      const finalImageUrl = await handleUpload();

      const { error } = await supabase.from('recipes').insert([{
        user_id: user.id,
        category_id: categoryId, // This is now a valid ID from the dropdown
        title,
        ingredients,
        steps,
        cooking_time: cookingTime,
        image_url: finalImageUrl,
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
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => setImageFile(e.target.files[0])} 
              style={styles.fileInput} 
            />
            {imageFile && <small>Ready: {imageFile.name}</small>}
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

        <button type="submit" disabled={uploading} style={styles.primaryBtn}>
          {uploading ? 'Processing...' : 'Submit Recipe'}
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
  section: { marginTop: '10px' }
};