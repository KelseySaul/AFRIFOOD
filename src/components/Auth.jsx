import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          // Optional: If you want to send the email to the profile table 
          // via the trigger more reliably, you can pass it in metadata
          options: {
            data: {
              email: email,
            },
          },
        });
        if (error) throw error;
        alert('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error) {
      // This will now catch that "500" or the "null value" error 
      // and display it clearly in the browser.
      alert(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.glassCard}>
        <h2 style={styles.title}>{isSignUp ? 'Join the Heritage' : 'Login'}</h2>
        <p style={styles.subtitle}>Preserving Africa's culinary secrets, one recipe at a time.</p>

        <form onSubmit={handleAuth} style={styles.form}>
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Password"
            // FIXED: Changed 'password' to 'e' to correctly access target.value
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />
          <button disabled={loading} style={styles.submitBtn}>
            {loading ? 'Authenticating...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <p onClick={() => setIsSignUp(!isSignUp)} style={styles.toggleText}>
          {isSignUp ? 'Already an expert? Sign In' : 'New here? Create an Account'}
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { height: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg)' },
  glassCard: { background: 'white', padding: '50px', borderRadius: '40px', boxShadow: '0 20px 60px rgba(92, 64, 51, 0.1)', width: '100%', maxWidth: '450px', textAlign: 'center' },
  title: { fontFamily: 'Playfair Display', fontSize: '2.2rem', color: 'var(--primary)', marginBottom: '10px' },
  subtitle: { color: '#888', marginBottom: '30px', fontSize: '0.9rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  input: { padding: '15px', borderRadius: '15px', border: '1px solid #eee', fontSize: '1rem', outline: 'none', background: '#f9f9f9' },
  submitBtn: { background: 'var(--primary)', color: 'white', padding: '15px', borderRadius: '15px', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
  toggleText: { marginTop: '20px', fontSize: '0.85rem', color: 'var(--accent)', cursor: 'pointer', fontWeight: '600' }
};