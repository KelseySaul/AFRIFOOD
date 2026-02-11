import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function BlogEditor({ user, onComplete }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [uploading, setUploading] = useState(false);

  const saveBlog = async () => {
    setUploading(true);
    const { error } = await supabase.from('blogs').insert({
      author_id: user.id,
      title,
      content,
      status: 'published'
    });

    if (error) alert(error.message);
    else {
      alert("Story published to the community!");
      onComplete();
    }
    setUploading(false);
  };

  return (
    <div style={styles.editorContainer}>
      <h3 style={{fontFamily: 'Playfair Display'}}>Write a Culinary Story</h3>
      <input 
        style={styles.titleInput} 
        placeholder="Title of your story..." 
        value={title} 
        onChange={e => setTitle(e.target.value)}
      />
      <textarea 
        style={styles.textArea} 
        placeholder="Share the history, the culture, or the memories behind the dish..." 
        value={content} 
        onChange={e => setContent(e.target.value)}
      />
      <button onClick={saveBlog} disabled={uploading} style={styles.publishBtn}>
        {uploading ? 'Publishing...' : 'Publish Blog'}
      </button>
    </div>
  );
}

const styles = {
  editorContainer: { display: 'flex', flexDirection: 'column', gap: '15px' },
  titleInput: { padding: '15px', borderRadius: '12px', border: '1px solid #eee', fontSize: '1.2rem', fontWeight: 'bold', outline: 'none' },
  textArea: { padding: '15px', borderRadius: '12px', border: '1px solid #eee', height: '300px', fontSize: '1rem', lineHeight: '1.6', outline: 'none', resize: 'none' },
  publishBtn: { background: 'var(--accent)', color: 'white', border: 'none', padding: '15px', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer' }
};