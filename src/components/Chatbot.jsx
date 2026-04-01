import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, ChefHat, Volume2, VolumeX } from 'lucide-react';
import { getChakulaResponse } from '../lib/gemini';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm Chakula, your AfriFood culinary guide. What African flavors are we exploring today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const messagesEndRef = useRef(null);
  const speechRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  useEffect(() => {
    // Stop speaking if chat is closed
    if (!isOpen) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
    }
  }, [isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const aiResponse = await getChakulaResponse(userMessage, messages);
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Mmm, something's not quite right in the kitchen. Could you try that again?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSpeech = (text, index) => {
    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Prioritize African voices (Nigeria, South Africa, etc.) if available on the user's system
    const voices = window.speechSynthesis.getVoices();
    const africanVoice = voices.find(v => 
      v.lang.startsWith('en-NG') || 
      v.lang.startsWith('en-ZA') || 
      v.lang.startsWith('en-KE') ||
      v.name.toLowerCase().includes('nigeria') ||
      v.name.toLowerCase().includes('south africa')
    );
    
    const preferredVoice = africanVoice || voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('google')) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.rate = 0.92; // Slightly slower for a more natural, rhythmic storytelling pace
    utterance.pitch = 1;
    
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);
    
    speechRef.current = utterance;
    setSpeakingIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div style={styles.container}>
      {/* Floating Bubble */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)} 
          style={styles.bubble}
          aria-label="Ask Chakula"
        >
          <MessageCircle size={28} color="white" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div style={styles.window}>
          {/* Header */}
          <div style={styles.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={styles.headerIcon}>
                <ChefHat size={18} color="white" />
              </div>
              <div>
                <h3 style={styles.headerTitle}>Chakula</h3>
                <span style={styles.headerSubtitle}>Culinary Guide</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={styles.closeBtn}>
              <X size={20} color="var(--primary)" />
            </button>
          </div>

          {/* Messages */}
          <div style={styles.messagesArea}>
            {messages.map((msg, index) => (
              <div 
                key={index} 
                style={{
                  ...styles.messageWrapper,
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={styles.bubbleContainer}>
                  <div style={{
                    ...styles.message,
                    ...(msg.role === 'user' ? styles.userMessage : styles.aiMessage)
                  }}>
                    {msg.content}
                  </div>
                  {msg.role === 'assistant' && (
                    <button 
                      onClick={() => handleToggleSpeech(msg.content, index)}
                      style={{
                        ...styles.speakBtn,
                        ...(speakingIndex === index ? styles.speakBtnActive : {})
                      }}
                      title={speakingIndex === index ? "Stop Speaking" : "Listen to Chakula"}
                    >
                      {speakingIndex === index ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={styles.messageWrapper}>
                <div style={styles.aiMessage}>
                  <Loader2 className="animate-spin" size={18} style={{ opacity: 0.6 }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} style={styles.inputArea}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about spices, jollof, or injera..."
              style={styles.input}
              disabled={isLoading}
            />
            <button type="submit" style={styles.sendBtn} disabled={!input.trim() || isLoading}>
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.9); opacity: 1; }
          100% { transform: scale(1.3); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    position: 'fixed',
    bottom: '30px',
    right: '30px',
    zIndex: 9999,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  bubble: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent)',
    border: 'none',
    boxShadow: '0 8px 32px rgba(226, 114, 91, 0.4)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  window: {
    width: '350px',
    height: '500px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '24px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    animation: 'slideUp 0.4s ease-out forwards',
    border: '1px solid rgba(74, 50, 40, 0.1)',
  },
  header: {
    padding: '20px',
    borderBottom: '1px solid rgba(74, 50, 40, 0.05)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'white',
  },
  headerIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '10px',
    backgroundColor: 'var(--primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: '700',
    color: 'var(--primary)',
  },
  headerSubtitle: {
    fontSize: '0.7rem',
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '5px',
    opacity: 0.5,
  },
  messagesArea: {
    flexGrow: 1,
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  messageWrapper: {
    display: 'flex',
    width: '100%',
  },
  bubbleContainer: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    maxWidth: '85%',
  },
  message: {
    padding: '12px 16px',
    borderRadius: '18px',
    fontSize: '0.9rem',
    lineHeight: '1.4',
  },
  aiMessage: {
    backgroundColor: '#F3F4F6',
    color: 'var(--primary)',
    borderTopLeftRadius: '4px',
  },
  userMessage: {
    backgroundColor: 'var(--accent)',
    color: 'white',
    borderTopRightRadius: '4px',
  },
  speakBtn: {
    marginTop: '4px',
    padding: '6px',
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(74, 50, 40, 0.05)',
    color: 'var(--primary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    opacity: 0.5,
  },
  speakBtnActive: {
    opacity: 1,
    background: 'var(--accent)',
    color: 'white',
    animation: 'pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite',
  },
  inputArea: {
    padding: '15px 20px',
    borderTop: '1px solid rgba(74, 50, 40, 0.05)',
    display: 'flex',
    gap: '10px',
    background: 'white',
  },
  input: {
    flexGrow: 1,
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    padding: '10px 15px',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  },
  sendBtn: {
    background: 'var(--primary)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  }
};

export default Chatbot;
