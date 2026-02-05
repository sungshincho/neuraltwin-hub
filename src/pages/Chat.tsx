// 채팅 페이지 - NEURALTWIN 다크 테마 + retail-chatbot EF 연동
import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import "@/styles/chat.css";

// 메시지 타입 정의
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// 모드 옵션
const CHAT_MODES = [
  { id: "thinking", label: "생각 중" },
  { id: "creative", label: "창의적" },
  { id: "precise", label: "정확한" },
];

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
  const [selectedMode, setSelectedMode] = useState("thinking");
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // 페이지 진입 시 body 스타일 조정
    document.body.style.backgroundColor = "#0a0a0a";
    document.body.style.margin = "0";
    document.body.style.padding = "0";

    // 인트로 애니메이션 시퀀스
    const timer1 = setTimeout(() => setIntroComplete(true), 2200);
    const timer2 = setTimeout(() => {
      setCurtainsOpen(true);
      setContentVisible(true);
    }, 2600);
    const timer3 = setTimeout(() => setIntroHidden(true), 3600);

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
  }, [messages]);

  // 메시지 전송 (비스트리밍 모드)
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
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

      // conversationId 저장
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      // 어시스턴트 응답 추가
      if (data.content) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.content,
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

  // 모드 선택
  const handleModeSelect = (modeId: string) => {
    setSelectedMode(modeId);
    setModeMenuOpen(false);
  };

  // 현재 모드 라벨
  const currentModeLabel = CHAT_MODES.find((m) => m.id === selectedMode)?.label || "생각 중";

  return (
    <div className="chat-page">
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
              <Link to="/contact">소개서요청</Link>
              <Link to="/auth">로그인</Link>
              <Link to="/auth">회원가입</Link>
            </div>
          </nav>

          {/* Chat UI */}
          <div className="hero-content" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div className="chat-container">
              <h2 className="chat-title">무엇을 도와드릴까요?</h2>

              {/* 채팅 기록 */}
              <div className="chat-messages">
                {messages.length === 0 ? (
                  <div className="chat-message-empty">
                    대화를 시작해보세요
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`chat-message ${msg.role}`}>
                      {msg.content}
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="chat-message assistant">
                    <div className="chat-loading">
                      <div className="chat-loading-dot"></div>
                      <div className="chat-loading-dot"></div>
                      <div className="chat-loading-dot"></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* 입력 박스 */}
              <div className="chat-input-box">
                <div className="chat-input-row">
                  <textarea
                    ref={inputRef}
                    className="chat-input"
                    placeholder="무엇이든 물어보세요"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                  />
                </div>
                <div className="chat-input-actions">
                  <div className="chat-input-left">
                    {/* 모드 드롭다운 */}
                    <div style={{ position: "relative" }}>
                      <button
                        className="chat-mode-dropdown"
                        onClick={() => setModeMenuOpen(!modeMenuOpen)}
                      >
                        <span className="chat-mode-icon"></span>
                        <span>{currentModeLabel}</span>
                        <span className="chat-mode-arrow">▾</span>
                      </button>
                      <div className={`chat-mode-menu${modeMenuOpen ? " open" : ""}`}>
                        {CHAT_MODES.map((mode) => (
                          <button
                            key={mode.id}
                            className={`chat-mode-option${selectedMode === mode.id ? " active" : ""}`}
                            onClick={() => handleModeSelect(mode.id)}
                          >
                            {mode.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 전송 버튼 */}
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
          </div>

          {/* Semicircle Decoration */}
          <div className="hero-semicircle"></div>

          {/* Caption */}
          <div className="hero-caption">
            <div className="dot"></div>
            <p>NEURALTWIN은 데이터를 의사결정으로 전환하는 AI 플랫폼입니다. 복잡성을 명확함으로.</p>
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
              <h4>Product</h4>
              <Link to="/product">Platform</Link>
              <a href="#">Ontology</a>
              <a href="#">AI Engine</a>
              <a href="#">Security</a>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Careers</a>
              <a href="#">Blog</a>
              <a href="#">Press</a>
            </div>
            <div className="footer-col">
              <h4>Resources</h4>
              <a href="#">Documentation</a>
              <a href="#">Case Studies</a>
              <a href="#">Support</a>
              <Link to="/contact">Contact</Link>
            </div>
          </div>
        </footer>
        <div className="footer-bottom">
          <span>© 2026 NEURALTWIN. All rights reserved.</span>
          <span>Privacy Policy · Terms of Service</span>
        </div>
      </div>
    </div>
  );
};

export default Chat;
