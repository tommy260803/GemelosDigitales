import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  Image as ImageIcon, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  FileSearch
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
}

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
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ base64: string; mimeType: string; preview: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const msgIdCounter = useRef(0);

  // Keep welcome message translated if no other messages exist
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        return [{ ...prev[0], text: t.aiWelcomeMsg }];
      }
      return prev;
    });
  }, [t.aiWelcomeMsg]);

  // Auto-scroll to bottom on new messages or loading state change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() && !selectedImage) return;

    const userMsgId = `msg-${++msgIdCounter.current}`;
    const newMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: text || t.aiAnalyzeDoc,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      imagePreview: selectedImage?.preview,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      if (selectedImage) {
        // Call Multimodal Image Analysis Endpoint
        const res = await fetch('/api/gemini/analyze-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: selectedImage.base64,
            mimeType: selectedImage.mimeType,
            prompt: text,
          }),
        });
        const data = await res.json().catch(() => ({}));
        setSelectedImage(null);

        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${++msgIdCounter.current}`,
            sender: 'ai',
            text: data.analysis || data.reply || (data.error ? `Notice: ${data.error}` : t.aiImageAnalyzed),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
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
          body: JSON.stringify({
            message: text,
            conversation_history: conversationHistory,
            district_id: selectedDistrict.id,
            scenario_id: activeScenarioId,
          }),
        });
        const data = await res.json().catch(() => ({}));

        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${++msgIdCounter.current}`,
            sender: 'ai',
            text: data.reply || (data.error ? `Notice: ${data.error}${data.detail ? ` (${data.detail})` : ''}` : t.aiAnalysisComplete),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            toolsUsed: data.tools_used || [],
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: t.aiError,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      setSelectedImage({
        base64,
        mimeType: file.type,
        preview: result,
      });
    };
    reader.readAsDataURL(file);
  };

  const quickPrompts = [
    t.aiQuickPrompt1,
    t.aiQuickPrompt2,
    t.aiQuickPrompt3,
    t.aiQuickPrompt4,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-white text-sm">{t.aiModalTitle}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/30">
                  {t.aiBackend}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {t.aiContext} {selectedDistrict.name} ({selectedDistrict.country}) | {t.aiScenario} {activeScenarioId.toUpperCase()}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat History Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => {
            const isAi = msg.sender === 'ai';
            return (
              <div key={msg.id} className={`flex space-x-3 ${isAi ? '' : 'justify-end'}`}>
                {isAi && (
                  <div className="w-8 h-8 rounded-full bg-teal-600/20 border border-teal-500/30 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-teal-400" />
                  </div>
                )}

                <div className={`max-w-[80%] rounded-2xl p-3.5 text-xs ${
                  isAi 
                    ? 'bg-slate-800 text-slate-200 border border-slate-700/60' 
                    : 'bg-teal-600 text-white shadow-md'
                }`}>
                  {msg.imagePreview && (
                    <div className="mb-2 rounded-lg overflow-hidden border border-slate-700">
                      <img src={msg.imagePreview} alt="Uploaded document" className="max-h-48 w-full object-cover" />
                    </div>
                  )}
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                  {isAi && msg.toolsUsed && msg.toolsUsed.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-700/50 flex flex-wrap gap-1">
                      {msg.toolsUsed.map((tool, i) => (
                        <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-300 text-[9px] font-medium border border-teal-500/20">
                          <FileSearch className="w-2.5 h-2.5 mr-0.5" />
                          {tool}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className={`text-[10px] mt-1.5 ${isAi ? 'text-slate-400' : 'text-teal-200'} text-right`}>
                    {msg.timestamp}
                  </div>
                </div>

                {!isAi && (
                  <div className="w-8 h-8 rounded-full bg-teal-700 flex items-center justify-center shrink-0 text-white font-bold text-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center space-x-2 text-xs text-teal-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800 w-fit">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{t.aiEvaluating}</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Question Pills */}
        <div className="px-4 py-2 bg-slate-950/50 border-t border-slate-800/80 flex items-center space-x-2 overflow-x-auto scrollbar-none text-[11px]">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 whitespace-nowrap transition cursor-pointer border border-slate-700/60"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Selected Image Preview Bar */}
        {selectedImage && (
          <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <ImageIcon className="w-4 h-4 text-teal-400" />
              <span className="text-slate-300">{t.aiDocAttached}</span>
            </div>
            <button
              onClick={() => setSelectedImage(null)}
              className="text-rose-400 hover:text-rose-300 text-xs font-semibold"
            >
              {t.aiRemove}
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center space-x-2">
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
            className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition"
          >
            <Upload className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={t.aiPlaceholder}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || (!inputMessage.trim() && !selectedImage)}
            className="p-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white transition shadow cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
