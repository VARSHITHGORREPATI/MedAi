import { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Lock,
  MoreVertical,
  PlusCircle,
  Paperclip,
  Image,
  Send,
  CheckCircle,
  Activity,
  AlertTriangle,
  RotateCw,
  Frown,
  Droplets,
  CalendarClock,
  MessageSquare,
  Clock,
  ChevronLeft,
  Trash2,
  FileText,
  Sparkles,
} from 'lucide-react';
import ChatLayout from '../components/ChatLayout';
import { diagnosisAPI, chatAPI } from '../services/api';

const API_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'http://localhost:8000');

// Start with empty conversation
const INITIAL_MESSAGES = [];

function ChatHeader({ onNewChat, onToggleConversations }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-sidebar-border bg-sidebar/95 backdrop-blur z-10">
      <div className="flex items-center gap-4 text-white">
        <button
          onClick={onToggleConversations}
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-sidebar-hover text-white hover:bg-primary hover:text-white transition-colors"
          title="Toggle Conversations"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 text-primary flex items-center justify-center bg-primary/10 rounded-lg">
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-white text-lg font-bold leading-tight">AI Health Chatbot</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-muted font-medium">Active Session</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
          <Lock className="w-4 h-4 text-green-500" />
          <span className="text-green-500 text-xs font-bold uppercase tracking-wide">HIPAA Secure</span>
        </div>
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-sidebar-hover text-white hover:bg-primary hover:text-white transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          
          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg bg-sidebar border border-sidebar-border shadow-xl z-50">
              <button
                onClick={() => {
                  onNewChat();
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-3 text-white hover:bg-sidebar-hover transition-colors flex items-center gap-3"
              >
                <PlusCircle className="w-4 h-4" />
                New Chat
              </button>
              <button
                onClick={() => {
                  alert('Clear chat clicked');
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-3 text-white hover:bg-sidebar-hover transition-colors flex items-center gap-3"
              >
                <RotateCw className="w-4 h-4" />
                Clear Chat
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function ConversationsSidebar({ conversations, onSelectConversation, onClose, currentSessionId, onDeleteConversation }) {
  return (
    <aside className="w-[320px] flex-shrink-0 border-r border-sidebar-border bg-sidebar h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        <h3 className="text-white text-lg font-bold flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Chat History
        </h3>
        <button
          onClick={onClose}
          className="p-2 text-muted hover:text-white hover:bg-sidebar-hover rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-3">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-sidebar-hover flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-muted" />
            </div>
            <p className="text-white text-sm font-semibold mb-2">No Conversations Yet</p>
            <p className="text-muted text-xs leading-relaxed max-w-[240px]">
              Start a new conversation to see your chat history here.
            </p>
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv._id}
              className={`w-full mb-2 rounded-lg transition-colors relative group ${
                currentSessionId === conv._id
                  ? 'bg-primary/10 border border-primary/30'
                  : 'bg-sidebar-hover hover:bg-sidebar-hover/70 border border-transparent'
              }`}
            >
              <button
                onClick={() => onSelectConversation(conv._id)}
                className="w-full text-left p-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate mb-1 pr-8">
                      {conv.title}
                    </p>
                    <div className="flex items-center gap-2 text-muted text-xs">
                      <Clock className="w-3 h-3" />
                      <span>
                        {new Date(conv.updated_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                    </span>
                    <span>•</span>
                    <span>{conv.messages?.length || 0} messages</span>
                  </div>
                </div>
              </div>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteConversation(conv._id);
              }}
              className="absolute top-3 right-3 p-1.5 text-muted hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              title="Delete conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          ))
        )}
      </div>
    </aside>
  );
}

/** Strip markdown emphasis so "**HELLO**" is treated like "hello". */
function normalizeForIntent(text) {
  return (text || '')
    .replace(/\*+/g, '')
    .replace(/[_`#]/g, '')
    .trim();
}

/**
 * Greetings and tiny chit-chat should use general chat, not the diagnosis / triage pipeline.
 */
function shouldUseGeneralChat(text) {
  const raw = (text || '').trim();
  if (!raw) return true;
  const t = normalizeForIntent(raw).toLowerCase();
  if (t.length > 100) return false;

  const medicalHint =
    /\b(pain|hurt|hurts|ache|aching|fever|cough|rash|vomit|nausea|blood|dizzy|dizziness|chest|swollen|swelling|symptom|symptoms|headache|migraine|diarrhea|constipation|shortness|breath|wheez|palpitat|seizure|faint|blurred|lump|bleed|infection|uti|std|pregnant|dose|mg\b|ml\b|tablet|prescri|diagnos|tumor|cancer|stroke|heart attack|covid|flu|cold)\b/i.test(
      t
    );
  if (medicalHint) return false;

  const greetingOnly =
    /^(hi+|hello+|hey+|howdy+|yo+|sup+|hiya+|gm\b|gn\b|good\s+(morning|afternoon|evening|night|day)\b|thanks|thank\s+you|thx|ty|ok+|okay|k\b|yes|no|yep|nope|bye|goodbye|ciao|see\s+ya|what'?s\s+up|whats\s+up|how\s+are\s+you|how\s+r\s+u|hru|what\s+can\s+you\s+do|who\s+are\s+you)[\s!?.,"']*$/i.test(
      t
    );
  if (greetingOnly) return true;

  const singleToken = /^[a-z']+$/i.test(t) && t.length <= 12;
  if (singleToken && !medicalHint) {
    const casualWords = new Set([
      'hi',
      'hello',
      'hey',
      'yo',
      'sup',
      'hiya',
      'howdy',
      'thanks',
      'thx',
      'ty',
      'ok',
      'okay',
      'k',
      'yes',
      'no',
      'yep',
      'nope',
      'bye',
      'gm',
      'gn',
    ]);
    if (casualWords.has(t)) return true;
  }

  if (t.length <= 24 && !/\d/.test(t) && !medicalHint) {
    const wordCount = t.split(/\s+/).filter(Boolean).length;
    if (wordCount <= 4 && !/\b(help|advise|feel|sick|ill|worried)\b/i.test(t)) return true;
  }

  return false;
}

const HEADING_REGEX = /^\*\*([^*]+?)\*\*:?\s*$/;
const BULLET_REGEX = /^[•\-*]\s+(.*)$/;

/** PDFs/labs often contain `<30`, `</b>` etc.; raw `<` breaks dangerouslySetInnerHTML. */
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatInlineText(text) {
  const safe = escapeHtml(text);
  return safe.replace(/\*\*([^*]+)\*\*/g, '<span class="font-semibold text-white">$1</span>');
}

function parseResponseSections(text) {
  const lines = text.split('\n');
  const sections = [];
  let currentSection = null;

  const startSection = (title = '') => {
    currentSection = {
      title,
      paragraphs: [],
      bullets: [],
    };
  };

  startSection();

  lines.forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line || line === '•') {
      return;
    }

    const headingMatch = line.match(HEADING_REGEX);
    if (headingMatch) {
      if (currentSection.title || currentSection.paragraphs.length || currentSection.bullets.length) {
        sections.push(currentSection);
      }

      startSection(headingMatch[1].replace(/:$/, '').trim());
      return;
    }

    const bulletMatch = line.match(BULLET_REGEX);
    if (bulletMatch) {
      currentSection.bullets.push(bulletMatch[1].trim());
      return;
    }

    currentSection.paragraphs.push(line);
  });

  if (currentSection.title || currentSection.paragraphs.length || currentSection.bullets.length) {
    sections.push(currentSection);
  }

  return sections;
}

// Helper function to parse and format response text
function ParsedContent({ text }) {
  if (!text) return null;

  const sections = parseResponseSections(text);

  return (
    <div className="space-y-5">
      {sections.map((section, idx) => (
        <div key={idx} className={section.title ? 'border-l-2 border-cyan-400 pl-4' : ''}>
          {section.title && (
            <h4 className="font-semibold text-cyan-300 text-sm mb-2 uppercase tracking-wide">
              {section.title}
            </h4>
          )}

          {section.paragraphs.map((para, pIdx) => (
            <p
              key={pIdx}
              className="text-sm leading-relaxed text-gray-100 mb-2"
              dangerouslySetInnerHTML={{ __html: formatInlineText(para) }}
            />
          ))}

          {section.bullets.length > 0 && (
            <ul className="space-y-2 mt-2 pl-1">
              {section.bullets.map((bullet, bIdx) => (
                <li key={bIdx} className="flex gap-2 text-sm text-gray-100 leading-relaxed">
                  <span className="text-cyan-400 mt-0.5 shrink-0">•</span>
                  <span dangerouslySetInnerHTML={{ __html: formatInlineText(bullet) }} />
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

function MessageBubble({ message }) {
  if (message.type === 'system') {
    return (
      <div className="flex justify-center my-2">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-sidebar-hover/50 border border-sidebar-border text-muted text-sm">
          <CheckCircle className="w-4 h-4" />
          <span>{message.content}</span>
        </div>
      </div>
    );
  }

  if (message.type === 'assistant' && message.variant === 'diagnosis' && message.diagnosis) {
    const diagnosis = message.diagnosis;
    const confidencePercent = Math.round((diagnosis.confidence || 0) * 100);

    return (
      <div className="flex items-start gap-3 group">
        <div
          className="w-10 h-10 rounded-full shrink-0 border-2 border-primary/30 shadow-[0_0_15px_rgba(19,127,236,0.3)] bg-cover bg-center"
          style={{ backgroundImage: `url('${message.avatar}')` }}
        />
        <div className="flex flex-col gap-1 items-start max-w-[90%]">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-muted text-xs">MedAI Assistant</p>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sidebar-hover text-muted">
              {(diagnosis.modality || 'TEXT').toUpperCase()}
            </span>
          </div>
          <div className="rounded-2xl rounded-tl-none px-5 py-4 bg-sidebar-hover text-white shadow-sm border border-sidebar-border/50 w-full">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-cyan-300 font-semibold">Predicted disease</p>
                  <h4 className="text-xl font-bold text-white mt-1">{diagnosis.disease}</h4>
                  <p className="text-sm text-muted mt-1">Modality: {diagnosis.modality?.toUpperCase()}</p>
                </div>
                <div className="min-w-[150px] rounded-xl bg-sidebar border border-sidebar-border p-3">
                  <p className="text-xs text-muted mb-2">Confidence</p>
                  <div className="h-2 rounded-full bg-sidebar-hover overflow-hidden">
                    <div
                      className={`h-full rounded-full ${confidencePercent >= 80 ? 'bg-green-400' : confidencePercent >= 60 ? 'bg-yellow-400' : 'bg-red-400'}`}
                      style={{ width: `${confidencePercent}%` }}
                    />
                  </div>
                  <p className="text-sm text-white font-semibold mt-2">{confidencePercent}%</p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl bg-sidebar border border-sidebar-border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted mb-2">Specialist</p>
                  <p className="text-white font-medium">{diagnosis.doctor?.specialty}</p>
                  <p className="text-muted text-sm mt-1">Urgency: {diagnosis.doctor?.urgency}</p>
                </div>
                <div className="rounded-xl bg-sidebar border border-sidebar-border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted mb-2">Tests</p>
                  <ul className="space-y-1 text-sm text-white">
                    {(diagnosis.tests || []).slice(0, 3).map((test) => (
                      <li key={test} className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-400 shrink-0" />
                        <span>{test}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl bg-sidebar border border-sidebar-border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted mb-2">Medicines</p>
                  <ul className="space-y-1 text-sm text-white">
                    {(diagnosis.treatment?.medications || []).slice(0, 4).map((medication) => (
                      <li key={medication} className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                        <span>{medication}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl bg-sidebar border border-sidebar-border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted mb-2">Follow-ups</p>
                  <ul className="space-y-1 text-sm text-white">
                    {(diagnosis.treatment?.next_steps || []).slice(0, 4).map((step) => (
                      <li key={step} className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-400 shrink-0" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-xl bg-sidebar border border-sidebar-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted mb-2">Explanation</p>
                <p className="text-sm leading-relaxed text-white whitespace-pre-line">{diagnosis.explanation}</p>
              </div>

              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100 whitespace-pre-line">
                {diagnosis.disclaimer}
              </div>
            </div>
          </div>
          <p className="text-muted text-[11px] opacity-0 group-hover:opacity-100 transition-opacity">
            {message.time}
          </p>
        </div>
      </div>
    );
  }

  if (message.type === 'user') {
    return (
      <div className="flex items-end gap-3 justify-end group">
        <div className="flex flex-col gap-1 items-end max-w-[min(100%,520px)]">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-muted text-xs">You</p>
          </div>
          {message.pdfPreview && (
            <div className="w-full rounded-2xl rounded-tr-none overflow-hidden border border-white/20 bg-white/10 shadow-md">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-white/15 bg-black/20">
                <FileText className="w-4 h-4 text-red-300 shrink-0" />
                <span className="text-xs font-medium text-white truncate">{message.pdfName || 'Document.pdf'}</span>
                <span className="text-[10px] uppercase tracking-wide text-white/70 ml-auto shrink-0">PDF</span>
              </div>
              <embed
                src={`${message.pdfPreview}#toolbar=0&navpanes=0`}
                type="application/pdf"
                className="w-full h-[200px] bg-neutral-900"
                title="PDF attachment preview"
              />
            </div>
          )}
          <div className="rounded-2xl rounded-tr-none px-5 py-4 bg-primary text-white shadow-md">
            <p className="text-base font-medium leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
          </div>
          <p className="text-muted text-[11px] opacity-0 group-hover:opacity-100 transition-opacity">
            {message.time}
          </p>
        </div>
        <div
          className="w-10 h-10 rounded-full shrink-0 border-2 border-sidebar-border bg-cover bg-center"
          style={{ backgroundImage: `url('${message.avatar}')` }}
        />
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 group">
      <div
        className="w-10 h-10 rounded-full shrink-0 border-2 border-primary/30 shadow-[0_0_15px_rgba(19,127,236,0.3)] bg-cover bg-center"
        style={{ backgroundImage: `url('${message.avatar}')` }}
      />
      <div className="flex flex-col gap-1 items-start max-w-[85%]">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-muted text-xs">MedAI Assistant</p>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sidebar-hover text-muted">BOT</span>
        </div>
        <div className="rounded-2xl rounded-tl-none px-5 py-4 bg-sidebar-hover text-white shadow-sm border border-sidebar-border/50 max-w-full">
          {message.richContent || <ParsedContent text={message.content} />}
        </div>
        <p className="text-muted text-[11px] opacity-0 group-hover:opacity-100 transition-opacity">
          {message.time}
        </p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-8 h-8 rounded-full shrink-0 opacity-70 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDgL4ptd60y86EhIXQDCiZD9RpNBtBm396Q6hAhb1I-CHBSP5nOspjRXV0NFY74qVWIQax-G22iORHuid5cw07iQl_ohLWKZSM-TI3HnNBW4WDNZTSCVlvpO9Uh5Us5LHA4KzRLEuYGdMFGeqCjQqDrWwBUN1pa3FtoC2VmgHz7JYniG2PeO3g6kAihTrMkQwL-PcM5tqoBB4MDYNcjn6Y-gLPKnmpM4Crr_769SZjOjYk2aoqRa2vkIpiohFxE0-Iaz9y1jLPma1A')",
        }}
      />
      <div className="flex gap-1 px-3 py-2 bg-sidebar-hover rounded-xl">
        <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" />
        <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce [animation-delay:75ms]" />
        <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce [animation-delay:150ms]" />
      </div>
    </div>
  );
}

function ChatComposer({ onSendMessage, onNewChat }) {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [selectedModality, setSelectedModality] = useState('basic');
  /** paperclip / doc uploads → OCR & chat; image icon → medical image diagnosis model */
  const [attachIntent, setAttachIntent] = useState('document');
  const [prescriptionParsing, setPrescriptionParsing] = useState(false);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const prescriptionInputRef = useRef(null);

  useEffect(() => {
    if (!selectedFile || selectedFile.type !== 'application/pdf') {
      setPdfPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPdfPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [selectedFile]);

  const handleSend = () => {
    if (message.trim() || selectedFile) {
      onSendMessage(message.trim(), selectedFile, selectedModality, attachIntent);
      setMessage('');
      setSelectedFile(null);
      setFilePreview(null);
      setPdfPreviewUrl(null);
      setAttachIntent('document');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelectDoc = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setAttachIntent('document');
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => { setFilePreview(reader.result); };
        reader.readAsDataURL(file);
      } else if (file.type === 'application/pdf') {
        setFilePreview(null);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleFileSelectImage = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setAttachIntent('diagnosis');
      const reader = new FileReader();
      reader.onloadend = () => { setFilePreview(reader.result); };
      reader.readAsDataURL(file);
    }
  };

  const handlePrescriptionUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPrescriptionParsing(true);
    try {
      const token = localStorage.getItem('authToken');
      const fd = new FormData();
      fd.append('file', file);
      fd.append('save_to_db', 'true');
      const res = await fetch(`${API_URL}/api/prescriptions/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (res.ok && data.parsed) {
        const p = data.parsed;
        localStorage.setItem('activePrescription', JSON.stringify({
          ...p, prescription_id: data.prescription_id, applied_at: new Date().toISOString()
        }));
        const summary = [
          p.diagnosis ? `**Diagnosis:** ${p.diagnosis}` : '',
          p.medicines?.length ? `**Medicines (${p.medicines.length}):** ${p.medicines.map(m => `${m.name} ${m.dosage}`).join(', ')}` : '',
          p.lab_tests?.length ? `**Lab Tests:** ${p.lab_tests.join(', ')}` : '',
          p.dietary_advice ? `**Dietary Advice:** ${p.dietary_advice}` : '',
        ].filter(Boolean).join('\n');
        onSendMessage(
          `I've uploaded my prescription. Here's what was extracted:\n\n${summary}\n\nPlease advise me on how to follow this prescription, any precautions, and what lifestyle changes I should make.`,
          null,
          'skin',
          'document',
          { preferChat: true }
        );
      } else {
        onSendMessage(
          `I've uploaded a prescription file. Please help me understand it and advise on medicines and diet.`,
          null,
          'skin',
          'document',
          { preferChat: true }
        );
      }
    } catch (err) {
      onSendMessage(
        `I've uploaded a prescription. Please help me understand it.`,
        null,
        'skin',
        'document',
        { preferChat: true }
      );
    } finally {
      setPrescriptionParsing(false);
      if (prescriptionInputRef.current) prescriptionInputRef.current.value = '';
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setPdfPreviewUrl(null);
    setAttachIntent('document');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  return (
    <footer className="p-6 pt-2 bg-sidebar flex-shrink-0">
      {/* Prescription parsing indicator */}
      {prescriptionParsing && (
        <div className="mb-3 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
          <Sparkles className="w-4 h-4 animate-pulse" />
          Analysing prescription with AI...
        </div>
      )}
      {/* File Preview */}
      {selectedFile && selectedFile.type === 'application/pdf' && pdfPreviewUrl && (
        <div className="mb-3 rounded-xl border border-sidebar-border bg-sidebar overflow-hidden shadow-lg">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-sidebar-border bg-sidebar-hover">
            <FileText className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-sm font-medium text-white truncate flex-1">{selectedFile.name}</span>
            <span className="text-[10px] font-bold text-muted uppercase tracking-wide">PDF</span>
            <button type="button" onClick={removeFile} className="text-red-400 hover:text-red-300 px-2 text-lg leading-none" aria-label="Remove file">
              ×
            </button>
          </div>
          <embed
            src={`${pdfPreviewUrl}#toolbar=0&navpanes=0`}
            type="application/pdf"
            className="w-full h-[220px] bg-neutral-900"
            title="PDF preview"
          />
        </div>
      )}
      {selectedFile && !(selectedFile.type === 'application/pdf' && pdfPreviewUrl) && (
        <div className="mb-3 p-3 rounded-lg bg-sidebar-hover border border-sidebar-border flex items-center gap-3">
          {filePreview ? (
            <img src={filePreview} alt="Preview" className="w-12 h-12 rounded object-cover" />
          ) : (
            <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center">
              <Paperclip className="w-6 h-6 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{selectedFile.name}</p>
            <p className="text-muted text-xs">{(selectedFile.size / 1024).toFixed(1)} KB</p>
          </div>
          <button onClick={removeFile} className="text-red-400 hover:text-red-300 transition-colors">×</button>
        </div>
      )}

      <div className="relative flex w-full items-end rounded-xl bg-sidebar-hover border border-sidebar-border focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary transition-all shadow-lg">
        <button 
          onClick={onNewChat}
          className="p-3 text-muted hover:text-white transition-colors self-end mb-0.5"
          title="New Chat"
        >
          <PlusCircle className="w-5 h-5" />
        </button>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 bg-transparent border-none text-white placeholder-muted focus:ring-0 resize-none py-4 max-h-32 min-h-[56px] focus:outline-none"
          placeholder="Describe your symptoms or ask a question..."
          rows={1}
        />
        <div className="flex items-center gap-2 pr-3 pb-3 self-end">
          <select
            value={selectedModality}
            onChange={(e) => setSelectedModality(e.target.value)}
            className="bg-sidebar border border-sidebar-border text-white text-xs rounded-lg px-2 py-2 outline-none focus:ring-2 focus:ring-primary/40"
            title="Select medical image modality"
          >
            <option value="basic">BASIC</option>
            <option value="skin">Skin</option>
            <option value="chest">Chest X-ray</option>
            <option value="eye">Eye</option>
            <option value="brain">Brain</option>
          </select>
          <input ref={fileInputRef} type="file" onChange={handleFileSelectDoc} className="hidden" accept=".pdf,.doc,.docx,.txt,image/*" />
          <button onClick={() => fileInputRef.current?.click()} className="p-2 text-muted hover:text-white hover:bg-white/5 rounded-lg transition-colors" title="Upload document (PDF, Word, text, or photo of a report for OCR)">
            <Paperclip className="w-5 h-5" />
          </button>
          <input ref={imageInputRef} type="file" onChange={handleFileSelectImage} className="hidden" accept="image/*" />
          <button onClick={() => imageInputRef.current?.click()} className="p-2 text-muted hover:text-white hover:bg-white/5 rounded-lg transition-colors" title="Medical image analysis (skin, X-ray, etc.)">
            <Image className="w-5 h-5" />
          </button>

          {/* Prescription Upload */}
          <input ref={prescriptionInputRef} type="file" onChange={handlePrescriptionUpload} className="hidden" accept="image/*,.pdf,.txt" />
          <button
            onClick={() => prescriptionInputRef.current?.click()}
            disabled={prescriptionParsing}
            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors disabled:opacity-50"
            title="Upload Prescription (AI will analyse & apply to dashboard)"
          >
            <FileText className="w-5 h-5" />
          </button>

          <button 
            onClick={handleSend}
            disabled={!message.trim() && !selectedFile}
            className="ml-2 flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
      <p className="text-center text-muted text-[10px] mt-2">
        MedAI can make mistakes. Consider checking important information. &nbsp;|&nbsp; <span className="text-blue-400">📋 = Upload Prescription</span>
      </p>
    </footer>
  );
}

function HealthInsightsPanel() {
  const [vitals, setVitals] = useState(null);
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    const headers = { 'Authorization': `Bearer ${token}` };
    fetch(`${API_URL}/api/health/logs`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const logs = Array.isArray(data) ? data : (data?.data || []);
        if (logs.length > 0) setVitals(logs[0]);
      }).catch(() => {});
    fetch(`${API_URL}/api/medicine/reminders?active_only=true`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data)) setReminders(data.slice(0, 4)); })
      .catch(() => {});
  }, []);

  const getBpStatus = (sys) => {
    if (!sys) return { label: 'N/A', color: 'text-gray-400' };
    if (sys < 120) return { label: 'Normal', color: 'text-green-400' };
    if (sys < 130) return { label: 'Elevated', color: 'text-yellow-400' };
    return { label: 'High', color: 'text-red-400' };
  };

  const getGlucoseStatus = (g) => {
    if (!g) return { label: 'N/A', color: 'text-gray-400' };
    if (g < 100) return { label: 'Normal', color: 'text-green-400' };
    if (g < 126) return { label: 'Pre-diabetic', color: 'text-yellow-400' };
    return { label: 'High', color: 'text-red-400' };
  };

  const vs = vitals?.vital_signs || {};
  const bpStatus = getBpStatus(vs.blood_pressure_systolic);
  const glucoseStatus = getGlucoseStatus(vs.blood_sugar);

  return (
    <aside className="w-[340px] flex-shrink-0 flex-col border-l border-sidebar-border bg-sidebar h-full overflow-y-auto hidden xl:flex">
      <div className="p-6">
        <h3 className="text-white text-lg font-bold mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Health Insights
        </h3>

        {vitals ? (
          <div className="space-y-4">
            {/* Vitals Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-sidebar-hover rounded-xl p-3">
                <p className="text-muted text-xs mb-1">Blood Pressure</p>
                <p className="text-white text-lg font-bold">
                  {vs.blood_pressure_systolic || '--'}/{vs.blood_pressure_diastolic || '--'}
                </p>
                <p className={`text-xs font-medium mt-1 ${bpStatus.color}`}>{bpStatus.label}</p>
                <p className="text-muted text-[10px]">mmHg</p>
              </div>
              <div className="bg-sidebar-hover rounded-xl p-3">
                <p className="text-muted text-xs mb-1">Heart Rate</p>
                <p className="text-white text-lg font-bold">{vs.heart_rate || '--'}</p>
                <p className={`text-xs font-medium mt-1 ${(vs.heart_rate >= 60 && vs.heart_rate <= 100) ? 'text-green-400' : 'text-yellow-400'}`}>
                  {(vs.heart_rate >= 60 && vs.heart_rate <= 100) ? 'Normal' : 'Monitor'}
                </p>
                <p className="text-muted text-[10px]">bpm</p>
              </div>
              <div className="bg-sidebar-hover rounded-xl p-3">
                <p className="text-muted text-xs mb-1">Blood Glucose</p>
                <p className="text-white text-lg font-bold">{vs.blood_sugar || '--'}</p>
                <p className={`text-xs font-medium mt-1 ${glucoseStatus.color}`}>{glucoseStatus.label}</p>
                <p className="text-muted text-[10px]">mg/dL</p>
              </div>
              <div className="bg-sidebar-hover rounded-xl p-3">
                <p className="text-muted text-xs mb-1">Weight</p>
                <p className="text-white text-lg font-bold">{vs.weight || '--'}</p>
                <p className="text-green-400 text-xs font-medium mt-1">Tracking</p>
                <p className="text-muted text-[10px]">kg</p>
              </div>
            </div>

            {/* Today's Medicines */}
            {reminders.length > 0 && (
              <div className="bg-sidebar-hover rounded-xl p-4">
                <p className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-blue-400" />
                  Today's Medicines
                </p>
                <div className="space-y-2">
                  {reminders.map((r) => (
                    <div key={r._id} className="flex items-center justify-between">
                      <div>
                        <p className="text-white text-xs font-medium">{r.medicine_name}</p>
                        <p className="text-muted text-[10px]">{r.dosage} · {r.frequency?.replace('_', ' ')}</p>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Last Updated */}
            <p className="text-muted text-[10px] text-center">
              Last updated: {vitals.date ? new Date(vitals.date).toLocaleDateString() : 'Today'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-sidebar-hover flex items-center justify-center mb-4">
              <Activity className="w-8 h-8 text-muted" />
            </div>
            <p className="text-white text-sm font-semibold mb-2">No Health Data Yet</p>
            <p className="text-muted text-xs leading-relaxed max-w-[240px]">
              Start a conversation with the AI assistant to receive personalized health insights and recommendations.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}

export default function Chatbot() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [showConversations, setShowConversations] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch(`${API_URL}/api/chat/sessions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const loadConversation = async (convSessionId) => {
    try {
      const response = await fetch(`${API_URL}/api/chat/sessions/${convSessionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const session = await response.json();
        setSessionId(convSessionId);
        
        // Convert session messages to display format
        const displayMessages = session.messages.map((msg, idx) => ({
          id: idx + 1,
          type: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
          time: new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          avatar: msg.role === 'user' 
            ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuBkv4vcFz8KDsmGpfU3pVy6ZJh5z997ZJYeCKNEIQxq99GBj3o1fNlIG-k7gCaYHsnt4tCkKMkSeFcQSFH-8QlGqPhPxvR6n7CAOLGytqvlwvWz8rFeVwXyv-tNlI-QDRfZiOWM_TZB-tQ_xbBy1-jK1PdQ1f4eWsFWyj2tPzJ26751JuMDcwrsp8menuQUoML5AmxqNfT1ezcYhHjAuhY1T5YJbNpAd_aV7iBm0uFkLKTN4MW2rNIyNNKEyBYyGtRE1g37wKgDIzg'
            : 'https://lh3.googleusercontent.com/aida-public/AB6AXuA94h3IYI8Q6uNTNr6IN9L_pCWz_bAHhfvSVPQxriTMoD3eLnp9OeQrxL3gAUa8QBcgccv4lImUm8UtfbtwsKKufpSaKMkzqMplzUxE_rwtk2kD11mD5WDj-b-8E6Fm7AnIt8cBBhQH31vsJri6dE9uw_OLS1zNINrlzG6bEbGoybuP9qk7B4LDLWGrCCvXyMTlbrNB5M_A4BPaRs5W_W7KPmw4BS1Crvhd5wJ6VRSQvjZP9n_T2_yMGtTox6ZHcWlL5cuulwrkMks'
        }));
        
        setMessages(displayMessages);
        setShowConversations(false);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setSessionId(null);
    fetchConversations(); // Refresh conversation list
  };
  const deleteConversation = async (convSessionId) => {
    if (!confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/chat/sessions/${convSessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        // If deleted conversation is the current one, reset chat
        if (convSessionId === sessionId) {
          setMessages([]);
          setSessionId(null);
        }
        // Refresh conversations list
        fetchConversations();
      } else {
        alert('Failed to delete conversation');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Error deleting conversation');
    }
  };
  const handleSendMessage = async (
    content,
    file = null,
    modality = 'basic',
    attachIntent = 'document',
    options = {}
  ) => {
    const preferChat = options && typeof options === 'object' && options.preferChat === true;

    // Get current time
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const userPdfUrl =
      file && file.type === 'application/pdf' ? URL.createObjectURL(file) : null;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: content || (file ? `[Attached: ${file.name}]` : ''),
      time: time,
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBkv4vcFz8KDsmGpfU3pVy6ZJh5z997ZJYeCKNEIQxq99GBj3o1fNlIG-k7gCaYHsnt4tCkKMkSeFcQSFH-8QlGqPhPxvR6n7CAOLGytqvlwvWz8rFeVwXyv-tNlI-QDRfZiOWM_TZB-tQ_xbBy1-jK1PdQ1f4eWsFWyj2tPzJ26751JuMDcwrsp8menuQUoML5AmxqNfT1ezcYhHjAuhY1T5YJbNpAd_aV7iBm0uFkLKTN4MW2rNIyNNKEyBYyGtRE1g37wKgDIzg',
      ...(userPdfUrl ? { pdfPreview: userPdfUrl, pdfName: file.name } : {}),
    };
    setMessages(prev => [...prev, userMessage]);

    // Show typing indicator
    setIsTyping(true);

    try {
      let response, data;

      if (file && file.type.startsWith('image/') && attachIntent === 'diagnosis') {
        data = await diagnosisAPI.completeDiagnosis({
          symptoms: content,
          imageFile: file,
          modality,
        });
      } else if (file) {
        const formData = new FormData();
        formData.append('file', file);
        if (content) formData.append('message', content);
        if (sessionId) formData.append('session_id', sessionId);

        response = await fetch(`${API_URL}/api/chat/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: formData
        });
        const uploadPayload = await response.json().catch(() => ({}));
        if (!response.ok) {
          const det = uploadPayload.detail;
          const errText =
            typeof det === 'string'
              ? det
              : Array.isArray(det)
                ? det.map((d) => d.msg || d).join('; ')
                : uploadPayload.message || 'File upload failed';
          throw new Error(errText);
        }
        data = {
          success: true,
          session_id: uploadPayload.session_id,
          message: uploadPayload.message,
        };
      } else if (!file && (preferChat || shouldUseGeneralChat(content))) {
        const chatRes = await chatAPI.sendMessage(content, sessionId, false);
        data = {
          success: true,
          session_id: chatRes.session_id,
          message: chatRes.message,
          data: null,
        };
      } else {
        // Symptom / triage diagnosis path (not for simple greetings)
        data = await diagnosisAPI.completeDiagnosis({
          symptoms: content,
          imageFile: null,
          modality,
        });
      }

      if (data?.success !== false) {
        // Store session ID for conversation continuity
        if (data.session_id && !sessionId) {
          setSessionId(data.session_id);
          fetchConversations(); // Refresh conversation list when new session created
        }

        // Add AI response
        const diagnosisData = data?.data;
        const normalizedDiagnosis = diagnosisData?.prediction
          ? {
              disease: diagnosisData.prediction?.disease,
              confidence: diagnosisData.prediction?.confidence,
              modality: diagnosisData.decision_layer?.path === 'image' ? modality : 'text',
              doctor: diagnosisData.doctor_mapping,
              treatment: diagnosisData.treatment,
              tests: diagnosisData.tests,
              explanation: diagnosisData.rag_llm_output,
              disclaimer: diagnosisData.disclaimer,
            }
          : null;

        const aiMessage = normalizedDiagnosis?.disease
          ? {
              id: messages.length + 2,
              type: 'assistant',
              variant: 'diagnosis',
              content: `${normalizedDiagnosis.disease} detected with ${Math.round((normalizedDiagnosis.confidence || 0) * 100)}% confidence`,
              diagnosis: normalizedDiagnosis,
              time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA94h3IYI8Q6uNTNr6IN9L_pCWz_bAHhfvSVPQxriTMoD3eLnp9OeQrxL3gAUa8QBcgccv4lImUm8UtfbtwsKKufpSaKMkzqMplzUxE_rwtk2kD11mD5WDj-b-8E6Fm7AnIt8cBBhQH31vsJri6dE9uw_OLS1zNINrlzG6bEbGoybuP9qk7B4LDLWGrCCvXyMTlbrNB5M_A4BPaRs5W_W7KPmw4BS1Crvhd5wJ6VRSQvjZP9n_T2_yMGtTox6ZHcWlL5cuulwrkMks',
            }
          : {
              id: messages.length + 2,
              type: 'assistant',
              content: data?.message || data?.data?.rag_llm_output || 'Unable to generate diagnosis output.',
              time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA94h3IYI8Q6uNTNr6IN9L_pCWz_bAHhfvSVPQxriTMoD3eLnp9OeQrxL3gAUa8QBcgccv4lImUm8UtfbtwsKKufpSaKMkzqMplzUxE_rwtk2kD11mD5WDj-b-8E6Fm7AnIt8cBBhQH31vsJri6dE9uw_OLS1zNINrlzG6bEbGoybuP9qk7B4LDLWGrCCvXyMTlbrNB5M_A4BPaRs5W_W7KPmw4BS1Crvhd5wJ6VRSQvjZP9n_T2_yMGtTox6ZHcWlL5cuulwrkMks',
            };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(data.detail || data?.message || 'Failed to get diagnosis response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      // Show error message
      const errorMessage = {
        id: messages.length + 2,
        type: 'assistant',
        content:
          error?.message && String(error.message).length < 400
            ? `**Could not complete request**\n\n${error.message}`
            : "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA94h3IYI8Q6uNTNr6IN9L_pCWz_bAHhfvSVPQxriTMoD3eLnp9OeQrxL3gAUa8QBcgccv4lImUm8UtfbtwsKKufpSaKMkzqMplzUxE_rwtk2kD11mD5WDj-b-8E6Fm7AnIt8cBBhQH31vsJri6dE9uw_OLS1zNINrlzG6bEbGoybuP9qk7B4LDLWGrCCvXyMTlbrNB5M_A4BPaRs5W_W7KPmw4BS1Crvhd5wJ6VRSQvjZP9n_T2_yMGtTox6ZHcWlL5cuulwrkMks',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <ChatLayout>
      <div className="flex-1 flex h-full overflow-hidden">
        {/* Conversations Sidebar */}
        {showConversations && (
          <ConversationsSidebar
            conversations={conversations}
            onSelectConversation={loadConversation}
            onClose={() => setShowConversations(false)}
            currentSessionId={sessionId}
            onDeleteConversation={deleteConversation}
          />
        )}

        {/* Central Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          <ChatHeader 
            onNewChat={handleNewChat} 
            onToggleConversations={() => setShowConversations(!showConversations)}
          />

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            {messages.length === 0 && !isTyping ? (
              /* Empty State with Suggested Questions */
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Bot className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-gray-900 dark:text-white text-xl font-bold mb-2">Welcome to MedAI</h3>
                <p className="text-gray-600 dark:text-[#9dabb9] text-sm max-w-md leading-relaxed mb-8">
                  Your AI health assistant is ready to help. Describe your symptoms or ask health-related questions to get started.
                </p>

                {/* Suggested Questions */}
                <div className="w-full max-w-xl">
                  <p className="text-gray-500 dark:text-[#9dabb9] text-xs font-semibold uppercase tracking-widest mb-4">Suggested Questions</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { icon: '🤒', text: 'I have a headache and mild fever. What could it be?' },
                      { icon: '💊', text: 'What are common side effects of ibuprofen?' },
                      { icon: '🫀', text: 'How do I maintain a healthy heart?' },
                      { icon: '😴', text: 'I have trouble sleeping. Any remedies?' },
                      { icon: '🩺', text: 'When should I see a doctor urgently?' },
                      { icon: '🥗', text: 'What foods boost my immune system?' },
                    ].map((q) => (
                      <button
                        key={q.text}
                        onClick={() => handleSendMessage(q.text)}
                        className="flex items-start gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#1c2127] border border-gray-200 dark:border-[#283039] hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all text-left group"
                      >
                        <span className="text-lg leading-none mt-0.5">{q.icon}</span>
                        <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white leading-snug">{q.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Date Separator - Only show when there are messages */}
                {messages.length > 0 && (
                  <div className="flex justify-center">
                    <span className="px-3 py-1 rounded-full bg-sidebar-hover text-muted text-xs font-medium">
                      Today, {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}

                {/* Messages */}
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}

                {/* Typing Indicator */}
                {isTyping && <TypingIndicator />}
              </>
            )}

            {/* Bottom spacer and scroll anchor */}
            <div ref={messagesEndRef} className="h-4 w-full" />
          </div>

          <ChatComposer onSendMessage={handleSendMessage} onNewChat={handleNewChat} />
        </div>

        {/* Right Sidebar */}
        <HealthInsightsPanel />
      </div>
    </ChatLayout>
  );
}
