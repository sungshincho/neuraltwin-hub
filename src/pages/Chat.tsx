// 채팅 페이지 - NEURALTWIN 다크 테마 + retail-chatbot EF 연동
// TASK 9: Suggestions + Lead Capture Form 추가
// TASK C: 3D Wireframe Visualizer 통합
// PHASE J: 파일 업로드, 메시지 리액션, Export 기능
// UI 통합: collapsible messages, 타임라인 minor ticks, fullscreen UX 개선
import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import "@/styles/chat.css";

// 3D Visualizer 컴포넌트
import { StoreVisualizer, KPIBar, StageProgress } from "@/components/chatbot/visualizer";
import type { VizDirective, VizState, CustomerStage, VizKPI, VizAnnotation, StoreParams, ZoneScale } from "@/components/chatbot/visualizer";

// Export 유틸리티
import { exportAsMarkdown, exportAsPDF, exportAsDocx } from "@/shared/chat/utils/exportConversation";

// 메시지 타입 정의
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
  showLeadForm?: boolean;
  feedback?: "positive" | "negative" | null;
  attachments?: FileAttachment[];
}

// 파일 첨부 타입
interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;           // Supabase storage URL (업로드 완료 후)
  previewUrl?: string;    // 로컬 미리보기 URL
}

// 리드 폼 데이터 타입
interface LeadFormData {
  email: string;
  company: string;
  role: string;
}

// 타임라인 연도 (2018~2026, HTML 원본 동일)
const TIMELINE_YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];

// 인라인 채팅에서 최근 N턴만 표시, 나머지는 접기
const VISIBLE_TURNS = 3;

// 세션 ID 관리
const getOrCreateSessionId = (): string => {
  const key = "neuraltwin_chat_session_id";
  let sessionId = localStorage.getItem(key);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(key, sessionId);
  }
  return sessionId;
};

const Chat = () => {
  const [introComplete, setIntroComplete] = useState(false);
  const [curtainsOpen, setCurtainsOpen] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [introHidden, setIntroHidden] = useState(false);

  // 채팅 상태
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // TASK 9: Suggestions + Lead Form 상태
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showLeadForm, setShowLeadForm] = useState(false);

  // TASK C: VizDirective 상태 (3D Visualizer)
  const [vizDirective, setVizDirective] = useState<VizDirective | null>(null);
  const [leadFormData, setLeadFormData] = useState<LeadFormData>({
    email: "",
    company: "",
    role: "",
  });
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  // 전체화면 상태
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fsInputValue, setFsInputValue] = useState("");

  // 이전 대화 접기/펼치기 상태
  const [expandedOldMessages, setExpandedOldMessages] = useState(false);

  // PHASE J: Export 메뉴 상태
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // PHASE J: 파일 업로드 상태
  const [pendingFiles, setPendingFiles] = useState<FileAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fsFileInputRef = useRef<HTMLInputElement>(null);

  // PHASE J: 복사 알림
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // 플레이스홀더 로테이션
  const PLACEHOLDERS = [
    "예: 이번 시즌 VMD 트렌드 알려줘",
    "예: 주말 프로모션 기획안 작성해줘",
    "예: 리테일 전환율 업계 평균은?",
    "예: 매장 일일 보고서 양식 만들어줘",
  ];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fsMessagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fsInputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // 페이지 진입 시 body 스타일 조정
    document.body.style.backgroundColor = "#0a0a0a";
    document.body.style.margin = "0";
    document.body.style.padding = "0";

    // 인트로 애니메이션 시퀀스 (HTML 원본 타이밍과 동일)
    const timer1 = setTimeout(() => setIntroComplete(true), 1100);
    const timer2 = setTimeout(() => {
      setCurtainsOpen(true);
      setContentVisible(true);
    }, 1400);
    const timer3 = setTimeout(() => setIntroHidden(true), 2200);

    return () => {
      document.body.style.backgroundColor = "";
      document.body.style.margin = "";
      document.body.style.padding = "";
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      // 컴포넌트 언마운트 시 진행 중인 스트리밍 중단
      abortControllerRef.current?.abort();
    };
  }, []);

  // 메시지 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    fsMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 플레이스홀더 로테이션 (2.5초 간격)
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // 메시지 전송 (비스트리밍 모드)
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // 파일 첨부 정보를 메시지에 포함
    const currentFiles = pendingFiles.length > 0 ? [...pendingFiles] : undefined;
    const fileContext = currentFiles
      ? `\n\n[첨부 파일: ${currentFiles.map(f => f.name).join(', ')}]`
      : '';

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim() + fileContext,
      attachments: currentFiles,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setPendingFiles([]);
    setIsLoading(true);

    // AbortController 생성
    abortControllerRef.current = new AbortController();

    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const sessionId = getOrCreateSessionId();

      // 히스토리 구성 (최근 10턴)
      const history = messages.slice(-20).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch(`${SUPABASE_URL}/functions/v1/retail-chatbot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId,
          conversationId,
          history,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${response.status}`);
      }

      // JSON 응답 파싱
      const data = await response.json();

      // DEBUG: API 응답 전체 로그
      console.log('[Chat] API Response:', JSON.stringify(data, null, 2));
      console.log('[Chat] vizDirective:', data.vizDirective);

      // conversationId 저장
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      // TASK 9: Suggestions 저장
      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
      } else {
        setSuggestions([]);
      }

      // TASK 9: Lead Form 표시 여부
      if (data.showLeadForm && !leadSubmitted) {
        setShowLeadForm(true);
      }

      // TASK C: VizDirective 저장 (3D Visualizer)
      if (data.vizDirective) {
        setVizDirective(data.vizDirective);
      }

      // 어시스턴트 응답 추가
      if (data.content) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.content,
          suggestions: data.suggestions,
          showLeadForm: data.showLeadForm,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request aborted");
      } else {
        console.error("Chat error:", error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "죄송합니다. 응답을 처리하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Enter 키 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // TASK 9: Suggestion 클릭 핸들러
  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setSuggestions([]);
  };

  // TASK 9: Lead Form 제출 핸들러
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadFormData.email.trim()) return;

    setIsSubmittingLead(true);
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const sessionId = getOrCreateSessionId();

      const response = await fetch(`${SUPABASE_URL}/functions/v1/retail-chatbot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "capture_lead",
          sessionId,
          conversationId,
          lead: leadFormData,
        }),
      });

      if (response.ok) {
        setLeadSubmitted(true);
        setShowLeadForm(false);
        const thankYouMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `감사합니다, ${leadFormData.company || "고객"}님! 입력하신 이메일(${leadFormData.email})로 연락드리겠습니다.`,
        };
        setMessages((prev) => [...prev, thankYouMessage]);
      }
    } catch (error) {
      console.error("Lead submission error:", error);
    } finally {
      setIsSubmittingLead(false);
    }
  };

  // TASK 9: Lead Form 닫기
  const handleLeadFormClose = () => {
    setShowLeadForm(false);
  };

  // ═══════════════════════════════════════════
  // PHASE J: 메시지 리액션 핸들러 (Copy / Like / Dislike)
  // ═══════════════════════════════════════════

  const handleCopyMessage = useCallback((messageId: string, content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    }).catch(() => {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    });
  }, []);

  const handleFeedback = useCallback((messageId: string, feedback: "positive" | "negative") => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, feedback: msg.feedback === feedback ? null : feedback }
          : msg
      )
    );
    // TODO: DB에 피드백 저장 (chat_messages.user_feedback 컬럼)
  }, []);

  // ═══════════════════════════════════════════
  // PHASE J: Export 핸들러
  // ═══════════════════════════════════════════

  const handleExport = useCallback(async (format: 'md' | 'pdf' | 'docx') => {
    if (messages.length === 0 || isExporting) return;

    setIsExporting(true);
    setShowExportMenu(false);

    try {
      const exportMessages = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      switch (format) {
        case 'md':
          exportAsMarkdown(exportMessages);
          break;
        case 'pdf':
          await exportAsPDF(exportMessages);
          break;
        case 'docx':
          await exportAsDocx(exportMessages);
          break;
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  }, [messages, isExporting]);

  // Export 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

  // ═══════════════════════════════════════════
  // PHASE J: 파일 업로드 핸들러
  // ═══════════════════════════════════════════

  const ALLOWED_FILE_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'text/plain', 'text/csv', 'text/markdown',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: FileAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        alert(`지원하지 않는 파일 형식입니다: ${file.name}`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        alert(`파일 크기가 10MB를 초과합니다: ${file.name}`);
        continue;
      }

      const previewUrl = file.type.startsWith('image/')
        ? URL.createObjectURL(file)
        : undefined;

      newAttachments.push({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl,
      });
    }

    if (newAttachments.length > 0) {
      setPendingFiles((prev) => [...prev, ...newAttachments]);
    }

    // Reset input
    e.target.value = '';
  }, []);

  const handleRemoveFile = useCallback((fileId: string) => {
    setPendingFiles((prev) => {
      const file = prev.find((f) => f.id === fileId);
      if (file?.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }
      return prev.filter((f) => f.id !== fileId);
    });
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  // ═══════════════════════════════════════════
  // PHASE J: 첨부 파일 렌더러
  // ═══════════════════════════════════════════

  const renderAttachments = (attachments?: FileAttachment[]) => {
    if (!attachments || attachments.length === 0) return null;
    return (
      <div className="msg-attachments">
        {attachments.map((file) => (
          <div key={file.id} className="msg-attachment-chip">
            {file.previewUrl ? (
              <img src={file.previewUrl} alt={file.name} className="msg-attachment-thumb" />
            ) : (
              <span className="msg-attachment-icon">
                {file.type.includes('pdf') ? 'PDF' : file.type.includes('word') || file.type.includes('document') ? 'DOC' : 'FILE'}
              </span>
            )}
            <span className="msg-attachment-name">{file.name}</span>
          </div>
        ))}
      </div>
    );
  };

  // ═══════════════════════════════════════════
  // 메시지 액션 버튼 렌더러
  // ═══════════════════════════════════════════

  const renderMessageActions = (msg: Message, variant: 'inline' | 'fullscreen' = 'inline') => {
    if (msg.role === 'user') return null;

    const prefix = variant === 'fullscreen' ? 'fs-' : '';
    const isCopied = copiedMessageId === msg.id;

    return (
      <div className={`msg-actions ${prefix}msg-actions`}>
        {/* Copy */}
        <button
          className={`msg-action-btn ${isCopied ? 'copied' : ''}`}
          onClick={() => handleCopyMessage(msg.id, msg.content)}
          title={isCopied ? '복사됨!' : '복사'}
        >
          {isCopied ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          )}
        </button>

        {/* Like */}
        <button
          className={`msg-action-btn ${msg.feedback === 'positive' ? 'active-positive' : ''}`}
          onClick={() => handleFeedback(msg.id, 'positive')}
          title="좋아요"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={msg.feedback === 'positive' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>
        </button>

        {/* Dislike */}
        <button
          className={`msg-action-btn ${msg.feedback === 'negative' ? 'active-negative' : ''}`}
          onClick={() => handleFeedback(msg.id, 'negative')}
          title="싫어요"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={msg.feedback === 'negative' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"/></svg>
        </button>
      </div>
    );
  };

  // 전체화면 열기/닫기
  const openFullscreen = () => {
    setIsFullscreen(true);
    document.body.style.overflow = "hidden";
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
    document.body.style.overflow = "";
  };

  // 전체화면 전용 메시지 전송
  const handleFsSendMessage = async () => {
    if (!fsInputValue.trim() || isLoading) return;

    const currentFiles = pendingFiles.length > 0 ? [...pendingFiles] : undefined;
    const fileContext = currentFiles
      ? `\n\n[첨부 파일: ${currentFiles.map(f => f.name).join(', ')}]`
      : '';

    setInputValue(fsInputValue);
    setFsInputValue("");
    setPendingFiles([]);
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: fsInputValue.trim() + fileContext,
      attachments: currentFiles,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    abortControllerRef.current = new AbortController();
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const sessionId = getOrCreateSessionId();
      const history = messages.slice(-20).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch(`${SUPABASE_URL}/functions/v1/retail-chatbot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId,
          conversationId,
          history,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${response.status}`);
      }

      const data = await response.json();
      if (data.conversationId) setConversationId(data.conversationId);
      if (data.suggestions?.length > 0) setSuggestions(data.suggestions);
      else setSuggestions([]);
      if (data.showLeadForm && !leadSubmitted) setShowLeadForm(true);
      if (data.vizDirective) setVizDirective(data.vizDirective);

      if (data.content) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.content,
          suggestions: data.suggestions,
          showLeadForm: data.showLeadForm,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "죄송합니다. 응답을 처리하는 중 오류가 발생했습니다.",
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // 전체화면 전용 키 핸들러
  const handleFsKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleFsSendMessage();
    }
  };

  // 메시지를 턴(user+assistant 쌍) 단위로 그룹화
  const computeTurns = (): Message[][] => {
    const turns: Message[][] = [];
    let currentTurn: Message[] = [];
    messages.forEach((msg) => {
      currentTurn.push(msg);
      if (msg.role === "assistant") {
        turns.push([...currentTurn]);
        currentTurn = [];
      }
    });
    if (currentTurn.length > 0) turns.push([...currentTurn]);
    return turns;
  };

  // 인라인 채팅 메시지 렌더링 (collapsible turns)
  const renderCollapsibleMessages = () => {
    if (messages.length === 0 && !isLoading) {
      return <div className="chat-message-empty">대화를 시작해보세요</div>;
    }

    const turns = computeTurns();
    const hiddenCount = Math.max(0, turns.length - VISIBLE_TURNS);
    const hiddenTurns = turns.slice(0, hiddenCount);
    const visibleTurns = turns.slice(hiddenCount);

    return (
      <>
        {/* 접기 가능한 이전 대화 */}
        {hiddenTurns.length > 0 && (
          <>
            <div className="chat-collapsed-group">
              <button
                className={`chat-expand-btn${expandedOldMessages ? " expanded" : ""}`}
                onClick={() => setExpandedOldMessages(!expandedOldMessages)}
              >
                <span className="expand-arrow">▶</span>
                {expandedOldMessages
                  ? "이전 대화 접기"
                  : `이전 대화 ${hiddenTurns.length}개 보기`}
              </button>
              <div className={`chat-hidden-messages${expandedOldMessages ? " expanded" : ""}`}>
                {hiddenTurns.flat().map((msg) => (
                  <div key={msg.id} className="chat-message-wrapper">
                    <div className={`chat-message ${msg.role}`}>
                      {msg.role === 'user' && renderAttachments(msg.attachments)}
                      {msg.content}
                    </div>
                    {renderMessageActions(msg, 'inline')}
                  </div>
                ))}
              </div>
            </div>
            <div className="chat-divider">
              <span>최근 대화</span>
            </div>
          </>
        )}

        {/* 최근 대화 (항상 표시) */}
        {visibleTurns.flat().map((msg) => (
          <div key={msg.id} className="chat-message-wrapper">
            <div className={`chat-message ${msg.role}`}>
              {msg.role === 'user' && renderAttachments(msg.attachments)}
              {msg.content}
            </div>
            {renderMessageActions(msg, 'inline')}
          </div>
        ))}
      </>
    );
  };

  // 타임라인 룰러 렌더링 (minor tick 포함)
  const renderTimelineRuler = () => {
    const elements: JSX.Element[] = [];
    TIMELINE_YEARS.forEach((year, index) => {
      const isActive = year === 2026;
      const pos = 3 + (index / (TIMELINE_YEARS.length - 1)) * 94;

      // 활성 연도의 dot
      if (isActive) {
        elements.push(
          <div
            key={`dot-${year}`}
            className="ruler-dot"
            style={{ left: `${pos}%`, transform: "translateX(-50%)" }}
          />
        );
      }

      // 연도 마크
      elements.push(
        <div
          key={year}
          className={`ruler-mark${isActive ? " active" : ""}`}
          style={{ left: `${pos}%` }}
        >
          <div className="line"></div>
          <div className="label">{year}</div>
        </div>
      );

      // minor tick marks (연도 사이 3개씩)
      if (index < TIMELINE_YEARS.length - 1) {
        const gap = 94 / (TIMELINE_YEARS.length - 1);
        for (let t = 1; t <= 3; t++) {
          elements.push(
            <div
              key={`${year}-tick-${t}`}
              className="ruler-mark ruler-minor"
              style={{ left: `${pos + (t * gap) / 4}%` }}
            >
              <div className="line"></div>
            </div>
          );
        }
      }
    });
    return elements;
  };

  return (
    <div className="chat-page">
      {/* ==================== FULLSCREEN CHAT OVERLAY ==================== */}
      {/* 조건부 렌더링: isFullscreen일 때만 DOM에 마운트 (CSS display:none FOUC 방지) */}
      {isFullscreen && (
      <div className="chat-fullscreen open">
        <div className="chat-fs-header">
          <span className="chat-fs-brand">NEURALTWIN CHAT</span>
          <div className="chat-fs-header-actions">
            {/* Export 버튼 */}
            <div className="export-menu-container" ref={exportMenuRef}>
              <button
                className="chat-fs-action-btn"
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={messages.length === 0 || isExporting}
                title="대화 내보내기"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                {isExporting ? '내보내는 중...' : '내보내기'}
              </button>
              {showExportMenu && (
                <div className="export-menu-dropdown">
                  <button className="export-menu-item" onClick={() => handleExport('md')}>
                    <span className="export-icon">MD</span>
                    Markdown (.md)
                  </button>
                  <button className="export-menu-item" onClick={() => handleExport('pdf')}>
                    <span className="export-icon">PDF</span>
                    PDF (.pdf)
                  </button>
                  <button className="export-menu-item" onClick={() => handleExport('docx')}>
                    <span className="export-icon">DOC</span>
                    Word (.docx)
                  </button>
                </div>
              )}
            </div>

            <button className="chat-fs-minimize" onClick={closeFullscreen}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7"/></svg>
              축소
            </button>
          </div>
        </div>

        {/* body 영역: vizDirective 유무에 따라 분할 */}
        <div className={`chat-fs-body-wrapper${vizDirective ? " with-viz" : ""}`}>
          {/* 좌측: 채팅 메시지 */}
          <div className="chat-fs-body" id="chat-fs-body">
            <div className="chat-fs-inner">
              {messages.length === 0 ? (
                <div className="chat-fs-empty">대화를 시작해보세요</div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="chat-fs-message-wrapper">
                    <div className={`chat-fs-message ${msg.role}`}>
                      {msg.role === 'user' && renderAttachments(msg.attachments)}
                      {msg.content}
                    </div>
                    {renderMessageActions(msg, 'fullscreen')}
                  </div>
                ))
              )}
              {isLoading && (
                <div className="chat-fs-message assistant">
                  <div className="chat-fs-loading">
                    <span className="chat-fs-loading-text">NEURALTWIN 생각 중</span>
                    <div className="chat-fs-loading-dot"></div>
                    <div className="chat-fs-loading-dot"></div>
                    <div className="chat-fs-loading-dot"></div>
                  </div>
                </div>
              )}
              <div ref={fsMessagesEndRef} />
            </div>
          </div>

          {/* 우측: 3D Visualizer (vizDirective 있을 때만 표시) */}
          {vizDirective && (
            <div className="chat-fs-viz">
              {vizDirective.kpis && vizDirective.kpis.length > 0 && (
                <KPIBar kpis={vizDirective.kpis} />
              )}
              <div style={{ flex: 1, position: "relative" }}>
                <StoreVisualizer
                  vizState={vizDirective.vizState}
                  highlights={vizDirective.highlights || []}
                  annotations={vizDirective.annotations || []}
                  showFlow={vizDirective.flowPath || false}
                  storeParams={vizDirective.storeParams}
                  zoneScale={vizDirective.zoneScale}
                />
              </div>
              {vizDirective.stage && (
                <StageProgress stage={vizDirective.stage} />
              )}
            </div>
          )}
        </div>

        <div className="chat-fs-footer">
          <div className="chat-fs-input-wrapper">
            <div className="chat-fs-input-box">
              {/* 첨부 파일 미리보기 (풀스크린) */}
              {pendingFiles.length > 0 && (
                <div className="chat-pending-files">
                  {pendingFiles.map((file) => (
                    <div key={file.id} className="pending-file-chip">
                      {file.previewUrl ? (
                        <img src={file.previewUrl} alt={file.name} className="pending-file-thumb" />
                      ) : (
                        <span className="pending-file-icon">
                          {file.type.includes('pdf') ? 'PDF' : file.type.includes('word') || file.type.includes('document') ? 'DOC' : 'FILE'}
                        </span>
                      )}
                      <span className="pending-file-name">{file.name}</span>
                      <span className="pending-file-size">{formatFileSize(file.size)}</span>
                      <button
                        className="pending-file-remove"
                        onClick={() => handleRemoveFile(file.id)}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="chat-fs-input-row">
                <textarea
                  ref={fsInputRef}
                  className="chat-fs-input"
                  placeholder={PLACEHOLDERS[placeholderIndex]}
                  value={fsInputValue}
                  onChange={(e) => setFsInputValue(e.target.value)}
                  onKeyDown={handleFsKeyDown}
                  rows={1}
                />
              </div>
              <div className="chat-fs-input-actions">
                <div className="chat-fs-input-left">
                  {/* 파일 업로드 버튼 (풀스크린) */}
                  <input
                    ref={fsFileInputRef}
                    type="file"
                    className="chat-file-input-hidden"
                    onChange={handleFileSelect}
                    multiple
                    accept="image/*,.pdf,.txt,.csv,.md,.docx,.xlsx"
                  />
                  <button
                    className="chat-action-icon-btn"
                    onClick={() => fsFileInputRef.current?.click()}
                    title="파일 첨부"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                  </button>
                </div>
                <button
                  className="chat-send-btn"
                  onClick={handleFsSendMessage}
                  disabled={!fsInputValue.trim() || isLoading}
                >
                  <svg
                    className="chat-send-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ==================== INTRO ANIMATION ==================== */}
      {!introHidden && (
        <>
          <div className={`intro-overlay${introComplete ? " done" : ""}`}>
            <div className="intro-logo-wrapper">
              <img src="/NEURALTWIN_logo_white.png" alt="NEURALTWIN" />
            </div>
            <div className="intro-tagline">Intelligence Redefined</div>
            <div className="intro-line"></div>
          </div>
          <div className={`intro-curtain-top${curtainsOpen ? " open" : ""}`}></div>
          <div className={`intro-curtain-bottom${curtainsOpen ? " open" : ""}`}></div>
        </>
      )}

      {/* ==================== PAGE CONTENT ==================== */}
      <div className={`page-content${contentVisible ? " visible" : ""}`}>
        {/* ==================== HERO with CHAT ==================== */}
        <section className="hero">
          {/* Grid Background */}
          <div className="hero-grid-bg">
            <div className="grid-lines"></div>
            <div className="grid-lines-fine"></div>
            <div className="grid-dots"></div>
            <div className="grid-glow"></div>
          </div>

          {/* Grid Coordinates */}
          <div className="grid-coord tl">0, 0</div>
          <div className="grid-coord tr">1920, 0</div>
          <div className="grid-coord bl">0, 1080</div>
          <div className="grid-coord br">1920, 1080</div>
          <div className="grid-axis-y">Y — Axis</div>
          <div className="grid-axis-x">X — Axis</div>

          {/* Nav */}
          <nav className="hero-nav">
            <Link to="/">
              <img src="/NEURALTWIN_logo_white.png" alt="NEURALTWIN" className="logo-img" />
            </Link>
            <div className="hero-nav-links">
              <Link to="/about">제품 &amp; 회사소개</Link>
              <Link to="/contact">문의하기</Link>
            </div>
          </nav>

          {/* Chat UI + Visualizer Split Layout */}
          <div
            className="hero-content"
            style={vizDirective ? { gap: "16px", padding: "0 24px" } : undefined}
          >
            {/* 채팅 영역 */}
            <div
              className="chat-container"
              style={{ width: vizDirective ? "45%" : "100%", transition: "width 0.5s ease" }}
            >
              {/* 타이틀 + 전체화면 버튼 */}
              <div className="chat-title-row">
                <h2 className="chat-title">오늘은 어떤 업무를 도와드릴까요?</h2>
                <button
                  className="chat-expand-fullscreen-btn"
                  onClick={openFullscreen}
                  title="전체화면으로 보기"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                  전체화면
                </button>
              </div>

              {/* 채팅 기록 (collapsible turns) */}
              <div className="chat-messages">
                {renderCollapsibleMessages()}

                {/* 로딩 인디케이터 */}
                {isLoading && (
                  <div className="chat-message assistant">
                    <div className="chat-loading">
                      <span className="chat-loading-text">NEURALTWIN 생각 중</span>
                      <div className="chat-loading-dot"></div>
                      <div className="chat-loading-dot"></div>
                      <div className="chat-loading-dot"></div>
                    </div>
                  </div>
                )}

                {/* TASK 9: Suggestions 칩 */}
                {!isLoading && suggestions.length > 0 && (
                  <div className="chat-suggestions">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        className="chat-suggestion-chip"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

                {/* TASK 9: Lead Capture Form */}
                {showLeadForm && !leadSubmitted && (
                  <div className="chat-lead-form-container">
                    <div className="chat-lead-form">
                      <div className="chat-lead-form-header">
                        <h4>더 자세한 상담을 원하시나요?</h4>
                        <button
                          className="chat-lead-form-close"
                          onClick={handleLeadFormClose}
                        >
                          ✕
                        </button>
                      </div>
                      <p className="chat-lead-form-desc">
                        연락처를 남겨주시면 전문 컨설턴트가 연락드립니다.
                      </p>
                      <form onSubmit={handleLeadSubmit}>
                        <input
                          type="email"
                          className="chat-lead-input"
                          placeholder="이메일 *"
                          value={leadFormData.email}
                          onChange={(e) =>
                            setLeadFormData({ ...leadFormData, email: e.target.value })
                          }
                          required
                        />
                        <input
                          type="text"
                          className="chat-lead-input"
                          placeholder="회사명"
                          value={leadFormData.company}
                          onChange={(e) =>
                            setLeadFormData({ ...leadFormData, company: e.target.value })
                          }
                        />
                        <input
                          type="text"
                          className="chat-lead-input"
                          placeholder="직책/역할"
                          value={leadFormData.role}
                          onChange={(e) =>
                            setLeadFormData({ ...leadFormData, role: e.target.value })
                          }
                        />
                        <button
                          type="submit"
                          className="chat-lead-submit"
                          disabled={isSubmittingLead || !leadFormData.email.trim()}
                        >
                          {isSubmittingLead ? "제출 중..." : "상담 요청"}
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* 입력 박스 */}
              <div className="chat-input-box">
                {/* 첨부 파일 미리보기 */}
                {pendingFiles.length > 0 && (
                  <div className="chat-pending-files">
                    {pendingFiles.map((file) => (
                      <div key={file.id} className="pending-file-chip">
                        {file.previewUrl ? (
                          <img src={file.previewUrl} alt={file.name} className="pending-file-thumb" />
                        ) : (
                          <span className="pending-file-icon">
                            {file.type.includes('pdf') ? 'PDF' : file.type.includes('word') || file.type.includes('document') ? 'DOC' : 'FILE'}
                          </span>
                        )}
                        <span className="pending-file-name">{file.name}</span>
                        <span className="pending-file-size">{formatFileSize(file.size)}</span>
                        <button
                          className="pending-file-remove"
                          onClick={() => handleRemoveFile(file.id)}
                          title="파일 제거"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="chat-input-row">
                  <textarea
                    ref={inputRef}
                    className="chat-input"
                    placeholder={PLACEHOLDERS[placeholderIndex]}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                  />
                </div>
                <div className="chat-input-actions">
                  <div className="chat-input-left">
                    {/* 파일 업로드 버튼 */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="chat-file-input-hidden"
                      onChange={handleFileSelect}
                      multiple
                      accept="image/*,.pdf,.txt,.csv,.md,.docx,.xlsx"
                    />
                    <button
                      className="chat-action-icon-btn"
                      onClick={() => fileInputRef.current?.click()}
                      title="파일 첨부"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                    </button>

                    {/* Export 버튼 (인라인) */}
                    <div className="export-menu-container export-menu-inline" ref={messages.length > 0 ? undefined : exportMenuRef}>
                      <button
                        className="chat-action-icon-btn"
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        disabled={messages.length === 0}
                        title="대화 내보내기"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      </button>
                      {showExportMenu && !isFullscreen && (
                        <div className="export-menu-dropdown export-menu-up">
                          <button className="export-menu-item" onClick={() => handleExport('md')}>
                            <span className="export-icon">MD</span>
                            Markdown
                          </button>
                          <button className="export-menu-item" onClick={() => handleExport('pdf')}>
                            <span className="export-icon">PDF</span>
                            PDF
                          </button>
                          <button className="export-menu-item" onClick={() => handleExport('docx')}>
                            <span className="export-icon">DOC</span>
                            Word
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    className="chat-send-btn"
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                  >
                    <svg
                      className="chat-send-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 19V5M5 12l7-7 7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* 우측: 3D Visualizer (55%) - vizDirective가 있을 때만 표시 */}
            {vizDirective && (
              <div
                className="visualizer-container"
                style={{
                  width: "55%",
                  height: "600px",
                  minHeight: "500px",
                  display: "flex",
                  flexDirection: "column",
                  backgroundColor: "rgba(3, 7, 18, 0.9)",
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  animation: "fadeIn 0.5s ease"
                }}
              >
                {/* KPI Bar */}
                {vizDirective.kpis && vizDirective.kpis.length > 0 && (
                  <KPIBar kpis={vizDirective.kpis} />
                )}

                {/* 3D Store Visualizer */}
                <div style={{ flex: 1, position: "relative" }}>
                  <StoreVisualizer
                    vizState={vizDirective.vizState}
                    highlights={vizDirective.highlights || []}
                    annotations={vizDirective.annotations || []}
                    showFlow={vizDirective.flowPath || false}
                    storeParams={vizDirective.storeParams}
                    zoneScale={vizDirective.zoneScale}
                  />
                </div>

                {/* Stage Progress */}
                {vizDirective.stage && (
                  <StageProgress stage={vizDirective.stage} />
                )}
              </div>
            )}
          </div>

          {/* Semicircle Decoration */}
          <div className="hero-semicircle"></div>

          {/* Caption */}
          <div className="hero-caption">
            <div className="dot"></div>
            <p>리테일 전문 지식으로 학습된 AI 어시스턴트, NEURALTWIN.</p>
          </div>

          {/* Timeline Ruler (minor ticks 포함) */}
          <div className="hero-ruler">
            <div className="ruler-track">
              {renderTimelineRuler()}
            </div>
          </div>

          {/* Giant Brand */}
          <div className="hero-brand">
            <h1>NEURALTWIN</h1>
          </div>
        </section>

        {/* ==================== FOOTER ==================== */}
        <footer className="chat-footer">
          <div className="footer-left">
            <img src="/NEURALTWIN_logo_white.png" alt="NEURALTWIN" className="logo-img" />
            <p>복잡한 세계를 위한 AI 플랫폼.<br />데이터를 의사결정으로 전환합니다.</p>
          </div>
          <div className="footer-cols">
            <div className="footer-col">
              <h4>Company &amp; Product</h4>
              <Link to="/about">About</Link>
            </div>
            <div className="footer-col">
              <h4>Contact</h4>
              <Link to="/contact">문의하기</Link>
            </div>
          </div>
        </footer>
        <div className="footer-bottom">
          <span>© 2026 NEURALTWIN. All rights reserved.</span>
          <span><Link to="/privacy">Privacy Policy</Link> · <Link to="/terms">Terms of Service</Link></span>
        </div>
      </div>
    </div>
  );
};

export default Chat;
