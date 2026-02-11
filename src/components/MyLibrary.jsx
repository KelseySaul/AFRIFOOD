import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function MyLibrary({ user, onClose }) {
  const [recipes, setRecipes] = useState([]);
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    fetch();
  }, []);

  const fetch = async () => {
    const [r, b] = await Promise.all([
      supabase.from("recipes").select("*").eq("user_id", user.id),
      supabase.from("blogs").select("*").eq("user_id", user.id).order('created_at', { ascending: false })
    ]);
    setRecipes(r.data || []);
    setBlogs(b.data || []);
  };

  const remove = async (id, table) => {
    if (confirm("Delete this heritage piece permanently?")) {
      await supabase.from(table).delete().eq("id", id);
      fetch();
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button onClick={onClose} style={styles.closeBtn}>✕</button>
        <h2 style={{fontFamily: 'Playfair Display', marginBottom: '20px'}}>My Library</h2>
        
        {/* RECIPES SECTION */}
        <h4 style={styles.sub}>RECIPES</h4>
        {recipes.length > 0 ? recipes.map(r => (
          <div key={r.id} style={styles.item}>
            <span style={styles.itemTitle}>{r.title}</span>
            <button onClick={() => remove(r.id, 'recipes')} style={styles.del}>Delete</button>
          </div>
        )) : <p style={styles.emptyText}>No recipes shared yet.</p>}

        {/* STORIES SECTION */}
        <h4 style={styles.sub}>STORIES</h4>
        {blogs.length > 0 ? blogs.map(b => (
          <div key={b.id} style={styles.item}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={styles.itemTitle}>{b.title}</span>
              {b.status === 'draft' && (
                <span style={styles.draftBadge}>DRAFT</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              {/* If you want to enable editing later, you'd add an onClick here */}
              <button style={styles.editBtn}>Edit</button>
              <button onClick={() => remove(b.id, 'blogs')} style={styles.del}>Delete</button>
            </div>
          </div>
        )) : <p style={styles.emptyText}>No stories written yet.</p>}
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', backdropFilter: 'blur(4px)' },
  modal: { background: '#fff', width: '100%', maxWidth: '500px', padding: '30px', borderRadius: '30px', position: 'relative', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' },
  closeBtn: { position: 'absolute', top: '20px', right: '20px', border: 'none', background: '#f5f5f5', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  sub: { color: '#E2725B', fontSize: '0.7rem', fontWeight: '900', letterSpacing: '1.5px', marginTop: '25px', marginBottom: '10px', borderBottom: '1px solid #f0f0f0', paddingBottom: '5px' },
  item: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #f9f9f9' },
  itemTitle: { fontSize: '0.95rem', color: '#1A120B', fontWeight: '500' },
  draftBadge: { background: '#f0f0f0', color: '#666', fontSize: '0.6rem', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold', letterSpacing: '0.5px' },
  editBtn: { background: 'none', border: 'none', color: '#5C4033', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' },
  del: { color: '#d9534f', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' },
  emptyText: { fontSize: '0.85rem', color: '#999', fontStyle: 'italic', padding: '10px 0' }
};