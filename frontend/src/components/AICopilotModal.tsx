import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Send,
  Bot,
  User,
  Upload,
  Copy,
  Check,
  AlertCircle,
  Square,
  MessageSquarePlus,
  Workflow,
  MapPin,
  FileSearch,
} from 'lucide-react';
import { DistrictData } from '../types';
import { useLanguage } from '../i18n/translations';

interface AICopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDistrict: DistrictData;
  activeScenarioId: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  imagePreview?: string;
  toolsUsed?: string[];
  isError?: boolean;
}

const nowTime = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/* ─── Lightweight markdown renderer (dependency-free) ─────────────────────── */

function renderInlineMd(text: string, baseKey: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('**')) {
      parts.push(
        <strong key={`${baseKey}-b${i}`} className="font-semibold text-white">
          {renderInlineMd(tok.slice(2, -2), `${baseKey}-bi${i}`)}
        </strong>
      );
    } else if (tok.startsWith('`')) {
      parts.push(
        <code
          key={`${baseKey}-c${i}`}
          className="px-1 py-0.5 rounded bg-slate-950/70 text-sky-300 font-mono text-[11px]"
        >
          {tok.slice(1, -1)}
        </code>
      );
    } else {
      parts.push(
        <em key={`${baseKey}-i${i}`} className="italic">
          {renderInlineMd(tok.slice(1, -1), `${baseKey}-ii${i}`)}
        </em>
      );
    }
    last = m.index + tok.length;
    i++;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split(/\r?\n/);
  const blocks: React.ReactNode[] = [];
  let k = 0;
  let idx = 0;

  const isBullet = (l: string) => /^\s*[-•]\s+/.test(l);
  const isOrdered = (l: string) => /^\s*\d+[.)]\s+/.test(l);
  const isHeading = (l: string) => /^#{1,6}\s+/.test(l);
  const isFence = (l: string) => /^\s*```/.test(l);
  const isTableRow = (l: string) => /^\s*\|/.test(l);
  const isHr = (l: string) => /^\s{0,3}([-*_])(?:\s*\1){2,}\s*$/.test(l);
  const isUnderline = (l: string) => /^\s{0,3}(?:=+|-+)\s*$/.test(l);

  while (idx < lines.length) {
    const line = lines[idx];

    if (isTableRow(line)) {
      const rows: string[][] = [];
      while (idx < lines.length && isTableRow(lines[idx])) {
        rows.push(
          lines[idx]
            .trim()
            .replace(/^\|/, '')
            .replace(/\|$/, '')
            .split('|')
            .map((c) => c.trim()),
        );
        idx++;
      }
      const header = rows[0] ?? [];
      const body = rows
        .slice(1)
        .filter((cells) => !cells.every((c) => /^:?-{3,}:?$/.test(c)));
      const tKey = `t-${k++}`;
      blocks.push(
        <div key={tKey} className="my-2 overflow-x-auto scrollbar-thin">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr>
                {header.map((c, i) => (
                  <th
                    key={`${tKey}-h${i}`}
                    className="border border-slate-700/50 bg-slate-950/50 px-2 py-1 text-left font-semibold text-white"
                  >
                    {renderInlineMd(c, `${tKey}-h${i}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((cells, r) => (
                <tr key={`${tKey}-r${r}`}>
                  {cells.map((c, i) => (
                    <td
                      key={`${tKey}-r${r}-c${i}`}
                      className="border border-slate-700/50 px-2 py-1 text-slate-200 align-top"
                    >
                      {renderInlineMd(c, `${tKey}-r${r}-c${i}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (isFence(line)) {
      const buf: string[] = [];
      idx++;
      while (idx < lines.length && !isFence(lines[idx])) {
        buf.push(lines[idx]);
        idx++;
      }
      idx++;
      blocks.push(
        <pre
          key={`code-${k++}`}
          className="my-2 p-3 rounded-xl bg-slate-950/70 border border-slate-700/60 overflow-x-auto scrollbar-thin"
        >
          <code className="text-[11px] font-mono text-slate-300 whitespace-pre">
            {buf.join('\n')}
          </code>
        </pre>
      );
      continue;
    }

    if (isHr(line)) {
      blocks.push(
        <hr
          key={`hr-${k++}`}
          className="my-3 border-0 border-t border-slate-600/60"
        />,
      );
      idx++;
      continue;
    }

    const h = line.match(/^#{1,6}\s+(.*)$/);
    if (h) {
      blocks.push(
        <div key={`h-${k++}`} className="font-bold text-white text-[13px] mt-2 first:mt-0">
          {renderInlineMd(h[1], `h${k}`)}
        </div>
      );
      idx++;
      continue;
    }

    if (isBullet(line)) {
      const items: React.ReactNode[] = [];
      while (idx < lines.length && isBullet(lines[idx]) && !isHr(lines[idx])) {
        const content = lines[idx].replace(/^\s*[-•]\s+/, '');
        items.push(<li key={`li-${k++}`}>{renderInlineMd(content, `li${k}`)}</li>);
        idx++;
      }
      blocks.push(
        <ul key={`ul-${k++}`} className="list-disc pl-5 my-1.5 space-y-1 marker:text-sky-500">
          {items}
        </ul>
      );
      continue;
    }

    if (isOrdered(line)) {
      const items: React.ReactNode[] = [];
      while (idx < lines.length && isOrdered(lines[idx]) && !isHr(lines[idx])) {
        const content = lines[idx].replace(/^\s*\d+[.)]\s+/, '');
        items.push(<li key={`oli-${k++}`}>{renderInlineMd(content, `oli${k}`)}</li>);
        idx++;
      }
      blocks.push(
        <ol key={`ol-${k++}`} className="list-decimal pl-5 my-1.5 space-y-1 marker:text-sky-500">
          {items}
        </ol>
      );
      continue;
    }

    if (isUnderline(line)) {
      // stray "===", "--", "-" with no preceding text → divider (avoid loop)
      blocks.push(
        <hr
          key={`hr-${k++}`}
          className="my-3 border-0 border-t border-slate-600/60"
        />,
      );
      idx++;
      continue;
    }

    if (!line.trim()) {
      idx++;
      continue;
    }

    const para: string[] = [];
    while (
      idx < lines.length &&
      lines[idx].trim() &&
      !isHeading(lines[idx]) &&
      !isFence(lines[idx]) &&
      !isBullet(lines[idx]) &&
      !isOrdered(lines[idx]) &&
      !isTableRow(lines[idx]) &&
      !isUnderline(lines[idx]) &&
      !isHr(lines[idx])
    ) {
      para.push(lines[idx]);
      idx++;
    }

    // Setext heading: text line followed by "===" (h1) or "---" (h2)
    if (para.length > 0 && idx < lines.length && isUnderline(lines[idx])) {
      const isH1 = /=/.test(lines[idx]);
      const shKey = `sh-${k++}`;
      blocks.push(
        <div
          key={shKey}
          className={`font-bold text-white mt-2 first:mt-0 ${isH1 ? 'text-[14px]' : 'text-[13px]'}`}
        >
          {renderInlineMd(para.join(' '), shKey)}
        </div>,
      );
      idx++;
      continue;
    }

    const pKey = `p-${k++}`;
    blocks.push(
      <p key={pKey} className="my-1 leading-relaxed first:mt-0 last:mb-0">
        {para.map((l, i) => (
          <React.Fragment key={`${pKey}-${i}`}>
            {i > 0 && <br />}
            {renderInlineMd(l, `${pKey}-${i}`)}
          </React.Fragment>
        ))}
      </p>
    );
  }

  return <div className="space-y-0.5">{blocks}</div>;
}

/* ─── Component ───────────────────────────────────────────────────────────── */

export const AICopilotModal: React.FC<AICopilotModalProps> = ({
  isOpen,
  onClose,
  selectedDistrict,
  activeScenarioId,
}) => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: t.aiWelcomeMsg,
      timestamp: nowTime(),
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingElapsed, setLoadingElapsed] = useState(0);
  const [selectedImage, setSelectedImage] = useState<{
    base64: string;
    mimeType: string;
    preview: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const msgIdCounter = useRef(0);
  const stickToBottomRef = useRef(true);

  // Keep welcome message translated if no other messages exist
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        return [{ ...prev[0], text: t.aiWelcomeMsg }];
      }
      return prev;
    });
  }, [t.aiWelcomeMsg]);

  // Smart auto-scroll: only follow the conversation when user is near the bottom
  useEffect(() => {
    if (stickToBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Escape closes the modal + lock background scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  // Focus the input when the modal opens
  useEffect(() => {
    if (isOpen) {
      const id = window.setTimeout(() => textareaRef.current?.focus(), 50);
      return () => window.clearTimeout(id);
    }
  }, [isOpen]);

  // Auto-grow textarea (max ~120px)
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [inputMessage]);

  // Abort any in-flight request on unmount
  useEffect(() => () => abortRef.current?.abort(), []);

  // Elapsed-seconds ticker while the agent is working
  useEffect(() => {
    if (!isLoading) {
      setLoadingElapsed(0);
      return;
    }
    const started = Date.now();
    setLoadingElapsed(0);
    const id = window.setInterval(() => {
      setLoadingElapsed(Math.round((Date.now() - started) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [isLoading]);

  const handleChatScroll = useCallback(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }, []);

  if (!isOpen) return null;

  const pushMessage = (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    setMessages((prev) => [
      ...prev,
      { ...msg, id: `msg-${++msgIdCounter.current}`, timestamp: nowTime() },
    ]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    if (isLoading) return;
    const text = (textToSend ?? inputMessage).trim();
    if (!text && !selectedImage) return;

    const userMsg: ChatMessage = {
      id: `msg-${++msgIdCounter.current}`,
      sender: 'user',
      text: text || t.aiAnalyzeDoc,
      timestamp: nowTime(),
      imagePreview: selectedImage?.preview,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    stickToBottomRef.current = true;
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      if (selectedImage) {
        const res = await fetch('/api/gemini/analyze-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            imageBase64: selectedImage.base64,
            mimeType: selectedImage.mimeType,
            prompt: text,
          }),
        });
        const data = await res.json().catch(() => ({}));
        setSelectedImage(null);

        pushMessage({
          sender: 'ai',
          text:
            data.analysis ||
            data.reply ||
            (data.error ? `Notice: ${data.error}` : t.aiImageAnalyzed),
          isError: Boolean(data.error),
        });
      } else {
        // Build conversation history for multi-turn context
        const conversationHistory = messages
          .filter((m) => m.id !== 'welcome')
          .map((m) => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text,
          }));

        // Call Agent Chat Endpoint (LangGraph)
        const res = await fetch('/api/gemini/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            message: text,
            conversation_history: conversationHistory,
            district_id: selectedDistrict.id,
            scenario_id: activeScenarioId,
          }),
        });
        const data = await res.json().catch(() => ({}));

        pushMessage({
          sender: 'ai',
          text:
            data.reply ||
            (data.error
              ? `Notice: ${data.error}${data.detail ? ` (${data.detail})` : ''}`
              : t.aiAnalysisComplete),
          toolsUsed: data.tools_used || [],
          isError: Boolean(data.error) || !res.ok,
        });
      }
    } catch (err) {
      const aborted = err instanceof DOMException && err.name === 'AbortError';
      if (!aborted) {
        pushMessage({ sender: 'ai', text: t.aiError, isError: true });
      }
    } finally {
      abortRef.current = null;
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const handleNewChat = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
    setInputMessage('');
    setSelectedImage(null);
    stickToBottomRef.current = true;
    setMessages([
      { id: 'welcome', sender: 'ai', text: t.aiWelcomeMsg, timestamp: nowTime() },
    ]);
    textareaRef.current?.focus();
  };

  const handleCopy = async (msg: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(msg.text);
      setCopiedId(msg.id);
      window.setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // Clipboard unavailable (permissions / non-secure context) — fail silently
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      pushMessage({ sender: 'ai', text: t.aiImageTooBig, isError: true });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setSelectedImage({
        base64: result.split(',')[1],
        mimeType: file.type,
        preview: result,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickPrompts = [
    `${t.aiQuickPrompt1} ${selectedDistrict.name}?`,
    t.aiQuickPrompt2,
    t.aiQuickPrompt3,
    t.aiQuickPrompt4,
  ];
  const showSuggestions = messages.length === 1 && !isLoading;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-0 sm:p-4 animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.aiModalTitle}
        className="relative bg-slate-900 border border-slate-800 w-full sm:max-w-3xl h-[100dvh] sm:h-[85vh] flex flex-col shadow-2xl overflow-hidden sm:rounded-2xl animate-scale-in"
      >
        {/* Modal Header */}
        <div className="px-3 sm:px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-sky-500/20 shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-white text-sm">{t.aiModalTitle}</h3>
                <span
                  className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 font-semibold border border-sky-500/30"
                  title="Agente orquestado con LangGraph (LLM ⇄ herramientas)"
                >
                  <Workflow className="w-2.5 h-2.5" />
                  {t.aiBackend}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {t.aiOnline}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                <MapPin className="w-3 h-3 shrink-0 text-slate-500" />
                <span className="truncate">
                  {t.aiContext} {selectedDistrict.name} ({selectedDistrict.country})
                  {' · '}
                  {t.aiScenario} {activeScenarioId.toUpperCase()}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleNewChat}
              title={t.aiNewChat}
              aria-label={t.aiNewChat}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <MessageSquarePlus className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title={t.aiClose}
              aria-label={t.aiClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat History Body */}
        <div
          ref={chatContainerRef}
          onScroll={handleChatScroll}
          role="log"
          aria-live="polite"
          aria-relevant="additions text"
          className="flex-1 overflow-y-auto scrollbar-thin px-3 sm:px-4 py-4 space-y-4"
        >
          {messages.map((msg) => {
            const isAi = msg.sender === 'ai';
            return (
              <div
                key={msg.id}
                className={`group flex gap-3 animate-slide-up ${isAi ? '' : 'justify-end'}`}
              >
                {isAi && (
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      msg.isError
                        ? 'bg-rose-500/15 border border-rose-500/30'
                        : 'bg-sky-500/15 border border-sky-500/30'
                    }`}
                  >
                    {msg.isError ? (
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Bot className="w-4 h-4 text-sky-400" />
                    )}
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs ${
                    isAi
                      ? msg.isError
                        ? 'bg-rose-500/10 text-rose-100 border border-rose-500/30'
                        : 'bg-slate-800 text-slate-200 border border-slate-700/60'
                      : 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                  }`}
                >
                  {msg.imagePreview && (
                    <div className="mb-2 rounded-lg overflow-hidden border border-slate-700">
                      <img
                        src={msg.imagePreview}
                        alt="Uploaded document"
                        className="max-h-48 w-full object-cover"
                      />
                    </div>
                  )}

                  {isAi ? (
                    <div className="leading-relaxed">{renderMarkdown(msg.text)}</div>
                  ) : (
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                  )}

                  {isAi && msg.toolsUsed && msg.toolsUsed.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-700/50 flex flex-wrap gap-1">
                      {msg.toolsUsed.map((tool, i) => (
                        <span
                          key={i}
                          title={tool}
                          className="inline-flex items-center px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 text-[9px] font-medium border border-sky-500/20"
                        >
                          <FileSearch className="w-2.5 h-2.5 mr-0.5" />
                          {(() => {
                            const label = tool.replace(/_/g, ' ');
                            return label.charAt(0).toUpperCase() + label.slice(1);
                          })()}
                        </span>
                      ))}
                    </div>
                  )}

                  <div
                    className={`mt-1.5 flex items-center justify-end gap-2 text-[10px] ${
                      isAi ? 'text-slate-400' : 'text-sky-200'
                    }`}
                  >
                    {isAi && !msg.isError && (
                      <button
                        onClick={() => handleCopy(msg)}
                        title={copiedId === msg.id ? t.aiCopied : t.aiCopy}
                        aria-label={copiedId === msg.id ? t.aiCopied : t.aiCopy}
                        className="p-0.5 rounded opacity-60 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 hover:text-sky-300 transition"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                    <span>{msg.timestamp}</span>
                  </div>
                </div>

                {!isAi && (
                  <div className="w-8 h-8 rounded-full bg-sky-700/80 border border-sky-600/40 flex items-center justify-center shrink-0 text-white">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing / thinking indicator */}
          {isLoading && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-sky-400" />
              </div>
              <div className="max-w-[80%] min-w-0">
                <div className="bg-slate-800 border border-slate-700/60 rounded-2xl px-4 py-3 inline-flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-500 leading-snug">
                  {t.aiEvaluating}
                  <span className="text-slate-600"> · {loadingElapsed}s</span>
                </p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Question Pills (shown while conversation is untouched) */}
        {showSuggestions && (
          <div className="px-3 sm:px-4 py-2 bg-slate-950/50 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto scrollbar-thin text-[11px]">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:border-sky-500/50 whitespace-nowrap transition cursor-pointer border border-slate-700/60 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Selected Image Preview Bar */}
        {selectedImage && (
          <div className="px-3 sm:px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={selectedImage.preview}
                alt=""
                className="w-9 h-9 rounded-lg object-cover border border-slate-700 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-[11px] text-slate-200 font-medium truncate">
                  {t.aiDocAttached}
                </p>
                <p className="text-[10px] text-slate-500 truncate">{selectedImage.mimeType}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedImage(null)}
              title={t.aiRemove}
              aria-label={t.aiRemove}
              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800">
          <div className="flex items-end gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              title={t.aiUploadTitle}
              aria-label={t.aiUploadTitle}
              className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition shrink-0"
            >
              <Upload className="w-4 h-4" />
            </button>

            <textarea
              ref={textareaRef}
              rows={1}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.aiPlaceholder}
              aria-label={t.aiPlaceholder}
              className="flex-1 resize-none bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 leading-relaxed max-h-[120px] focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition"
            />

            {isLoading ? (
              <button
                onClick={handleStop}
                title={t.aiStop}
                aria-label={t.aiStop}
                className="p-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white transition shadow cursor-pointer shrink-0"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() && !selectedImage}
                title={t.aiPlaceholder}
                aria-label={t.aiPlaceholder}
                className="p-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition shadow cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>

          <p className="hidden sm:block mt-1.5 text-[10px] text-slate-500 text-center">
            {t.aiSendHint}
          </p>
        </div>
      </div>
    </div>
  );
};
