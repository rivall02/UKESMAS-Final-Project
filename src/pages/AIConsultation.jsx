import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Calendar,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';
import { useAuth } from '../contexts/auth';
import {
  askAI,
  subscribeChat,
  addChatMessage,
  clearChat,
} from '../services/ai';
import BookingModal from '../components/BookingModal';
import '../styles/ai.css';

const SUGGESTIONS = [
  'Tips menjaga pola tidur',
  'Cara mengelola stres kuliah',
  'Pola makan sehat mahasiswa',
  'Kapan perlu konsultasi ke klinik?',
];

function renderFormattedText(text) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function renderAIContent(rawContent) {
  if (!rawContent) return null;
  const lines = rawContent.split(/\r?\n/);
  const blocks = [];
  let currentList = null;

  const flushList = () => {
    if (currentList) {
      if (currentList.type === 'ul') {
        blocks.push(
          <ul key={`ul-${blocks.length}`} className="ai-bullet-list">
            {currentList.items.map((item, i) => (
              <li key={i}>{renderFormattedText(item)}</li>
            ))}
          </ul>,
        );
      } else {
        blocks.push(
          <ol key={`ol-${blocks.length}`} className="ai-numbered-list">
            {currentList.items.map((item, i) => (
              <li key={i}>{renderFormattedText(item)}</li>
            ))}
          </ol>,
        );
      }
      currentList = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      flushList();
      continue;
    }

    const bulletMatch = line.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(bulletMatch[1]);
      continue;
    }

    const numberMatch = line.match(/^\d+\.\s+(.+)$/);
    if (numberMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(numberMatch[1]);
      continue;
    }

    flushList();
    blocks.push(
      <p key={`p-${blocks.length}`} className="ai-paragraph">
        {renderFormattedText(line)}
      </p>,
    );
  }

  flushList();
  return blocks;
}

export default function AIConsultation() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [bookingOpen, setBookingOpen] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!profile?.id) return;
    const unsubscribe = subscribeChat(
      profile.id,
      (list) => setMessages(list),
      (err) => console.error('Gagal memuat obrolan AI:', err),
    );
    return () => unsubscribe();
  }, [profile?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, error]);

  async function handleSendMessage(textToSend) {
    const text = (textToSend || input).trim();
    if (!text || isTyping || !profile?.id) return;

    setInput('');
    setError(null);
    setIsTyping(true);

    try {
      await addChatMessage(profile.id, { role: 'user', content: text });
    } catch (err) {
      console.error('Gagal menyimpan pesan user:', err);
      setError('Gagal mengirim pesan. Periksa koneksi internetmu.');
      setIsTyping(false);
      return;
    }

    const history = [...messages, { role: 'user', content: text }];
    let response;
    try {
      response = await askAI(history);
    } catch (err) {
      console.error('AI consultation error:', err);
      setError('Asisten AI sedang sibuk atau tidak dapat dihubungi. Coba lagi beberapa saat.');
      setIsTyping(false);
      return;
    }

    try {
      await addChatMessage(profile.id, {
        role: 'assistant',
        content: response.text,
        urgency: response.urgency,
      });
    } catch (err) {
      console.error('Gagal menyimpan balasan AI:', err);
      setError('Gagal menyimpan balasan AI ke riwayat.');
    } finally {
      setIsTyping(false);
    }
  }

  async function handleRetry() {
    if (isTyping || !profile?.id || messages.length === 0) return;
    setError(null);
    setIsTyping(true);

    let response;
    try {
      response = await askAI(messages);
    } catch (err) {
      console.error('AI retry error:', err);
      setError('Asisten AI sedang sibuk atau tidak dapat dihubungi. Coba lagi beberapa saat.');
      setIsTyping(false);
      return;
    }

    try {
      await addChatMessage(profile.id, {
        role: 'assistant',
        content: response.text,
        urgency: response.urgency,
      });
    } catch (err) {
      console.error('Gagal menyimpan balasan AI saat coba lagi:', err);
      setError('Gagal menyimpan balasan AI ke riwayat.');
    } finally {
      setIsTyping(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    handleSendMessage();
  }

  async function handleClearChat() {
    if (!profile?.id) return;
    if (window.confirm('Mulai percakapan baru? Riwayat obrolan ini akan dihapus.')) {
      setError(null);
      try {
        await clearChat(profile.id);
      } catch (err) {
        console.error('Gagal menghapus obrolan:', err);
      }
    }
  }

  function getLastUserMessageBefore(index) {
    for (let i = index - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        return messages[i].content;
      }
    }
    return '';
  }

  function handleSOS(msg, index) {
    const lastUserText = getLastUserMessageBefore(index);
    navigate('/sos', {
      state: {
        description: lastUserText,
        aiSummary: (msg.content || '').slice(0, 200),
        source: 'ai',
      },
    });
  }

  return (
    <>
      <div className="ai-container">
        {/* Header */}
        <div className="ai-chat-header">
          <div className="ai-header-info">
            <div className="ai-header-avatar">
              <Sparkles size={20} />
            </div>
            <div className="ai-header-titles">
              <b>UKESMAS Health Buddy</b>
              <small>
                <span className="ai-status-dot" /> Online · Asisten Kesehatan Mahasiswa
              </small>
            </div>
          </div>
          <button className="ai-btn-reset" onClick={handleClearChat} title="Hapus riwayat dan mulai baru">
            <RotateCcw size={13} /> Percakapan baru
          </button>
        </div>

        {/* Chat Messages */}
        <div className="ai-messages-area">
          {messages.length === 0 ? (
            <div className="ai-empty-state">
              <div className="ai-empty-icon">
                <Bot size={28} />
              </div>
              <h3>Halo, {profile?.name || 'Mahasiswa'}!</h3>
              <p>
                Ada keluhan kesehatan atau ingin tahu tips gaya hidup sehat di kampus? Tanyakan
                apa saja pada Health Buddy.
              </p>
              <div className="ai-suggestions-grid">
                {SUGGESTIONS.map((topic) => (
                  <button
                    key={topic}
                    className="ai-suggestion-btn"
                    onClick={() => handleSendMessage(topic)}
                  >
                    <span>{topic}</span>
                    <ArrowRight size={13} />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id || index}
                  className={`ai-msg-row ${isUser ? 'ai-msg-user' : 'ai-msg-ai'}`}
                >
                  <div className={`ai-msg-avatar ${isUser ? 'user' : 'ai'}`}>
                    {isUser ? <User size={16} /> : <Bot size={16} />}
                  </div>

                  <div className="ai-msg-content-wrap">
                    <div className={`ai-bubble ${isUser ? 'ai-bubble-user' : 'ai-bubble-ai'}`}>
                      {isUser ? msg.content : renderAIContent(msg.content)}
                    </div>

                    {/* MEDIUM Urgency Card */}
                    {!isUser && msg.urgency === 'MEDIUM' && (
                      <div className="ai-card-medium">
                        <div className="ai-card-medium-header">
                          <Calendar size={15} />
                          <span>Perhatian: Perlu Konsultasi Medis</span>
                        </div>
                        <p>
                          Keluhanmu disarankan untuk diperiksa langsung oleh dokter atau perawat UKESMAS.
                        </p>
                        <button
                          className="ai-btn-book"
                          onClick={() => setBookingOpen(true)}
                        >
                          <Calendar size={12} /> Buat janji temu
                        </button>
                      </div>
                    )}

                    {/* HIGH Urgency Emergency Card */}
                    {!isUser && msg.urgency === 'HIGH' && (
                      <div className="ai-card-high">
                        <div className="ai-card-high-header">
                          <AlertTriangle size={18} />
                          <b>Peringatan: Kondisi Darurat Terdeteksi</b>
                        </div>
                        <p>
                          AI mendeteksi gejala yang membutuhkan pertolongan medis segera. Jangan
                          tunda untuk mengirimkan sinyal darurat ke UKESMAS!
                        </p>
                        <button
                          className="ai-btn-sos"
                          onClick={() => handleSOS(msg, index)}
                        >
                          <AlertTriangle size={14} /> Kirim SOS sekarang
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {isTyping && (
            <div className="ai-msg-row ai-msg-ai">
              <div className="ai-msg-avatar ai">
                <Bot size={16} />
              </div>
              <div className="ai-bubble ai-bubble-ai ai-typing-bubble">
                <span className="ai-dot" />
                <span className="ai-dot" />
                <span className="ai-dot" />
              </div>
            </div>
          )}

          {error && (
            <div className="ai-error-box">
              <div className="ai-error-text">
                <AlertTriangle size={15} />
                <span>{error}</span>
              </div>
              <button
                type="button"
                className="ai-btn-retry"
                onClick={handleRetry}
                disabled={isTyping}
              >
                <RotateCcw size={12} /> Coba lagi
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form className="ai-input-form" onSubmit={handleSubmit}>
          <div className="ai-input-box">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tulis keluhan atau pertanyaan kesehatanmu di sini..."
              disabled={isTyping}
            />
            <button
              type="submit"
              className="ai-btn-send"
              disabled={isTyping || !input.trim()}
              title="Kirim pesan"
            >
              <Send size={15} />
            </button>
          </div>
          <small className="ai-input-disclaimer">
            <ShieldCheck size={12} /> Health Buddy bukan pengganti diagnosis dokter resmi.
          </small>
        </form>
      </div>

      {bookingOpen && <BookingModal onClose={() => setBookingOpen(false)} />}
    </>
  );
}
