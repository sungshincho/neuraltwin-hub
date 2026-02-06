// 채팅 페이지 - NEURALTWIN 다크 테마 + 채팅 UI
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

// 타임라인 년도 데이터
const TIMELINE_YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];

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

  // 전체화면 상태
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fsInputValue, setFsInputValue] = useState("");
  const [fsModeMenuOpen, setFsModeMenuOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fsMessagesEndRef = useRef<HTMLDivElement>(null);
  const fsInputRef = useRef<HTMLTextAreaElement>(null);

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
    };
  }, []);

  // 메시지 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    fsMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 전체화면 열릴 때 입력창 포커스
  useEffect(() => {
    if (isFullscreen && fsInputRef.current) {
      fsInputRef.current.focus();
    }
  }, [isFullscreen]);

  // 메시지 전송
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

    // TODO: 실제 AI API 연동
    // 임시 응답 (데모용)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `안녕하세요! "${userMessage.content}"에 대한 답변입니다. 이것은 데모 응답입니다. 실제 AI 연동 시 이 부분이 교체됩니다.`,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
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
    setFsModeMenuOpen(false);
  };

  // 현재 모드 라벨
  const currentModeLabel = CHAT_MODES.find((m) => m.id === selectedMode)?.label || "생각 중";

  // 전체화면 열기
  const openFullscreen = () => {
    setIsFullscreen(true);
    setFsInputValue(inputValue);
  };

  // 전체화면 닫기
  const closeFullscreen = () => {
    setIsFullscreen(false);
    setInputValue(fsInputValue);
  };

  // 전체화면 메시지 전송
  const handleFsSendMessage = async () => {
    if (!fsInputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: fsInputValue.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setFsInputValue("");
    setIsLoading(true);

    // TODO: 실제 AI API 연동
    // 임시 응답 (데모용)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `안녕하세요! "${userMessage.content}"에 대한 답변입니다. 이것은 데모 응답입니다. 실제 AI 연동 시 이 부분이 교체됩니다.`,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  // 전체화면 Enter 키 처리
  const handleFsKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleFsSendMessage();
    }
  };

  return (
    <div className="chat-page">
      {/* ==================== FULLSCREEN CHAT OVERLAY ==================== */}
      <div className={`chat-fullscreen${isFullscreen ? " open" : ""}`}>
        <div className="chat-fs-header">
          <span className="chat-fs-brand">NEURALTWIN CHAT</span>
          <button className="chat-fs-minimize" onClick={closeFullscreen}>
            축소
          </button>
        </div>
        <div className="chat-fs-body">
          <div className="chat-fs-inner">
            {messages.length === 0 ? (
              <div className="chat-fs-empty">대화를 시작해보세요</div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`chat-fs-message ${msg.role}`}>
                  {msg.content}
                </div>
              ))
            )}
            {isLoading && (
              <div className="chat-fs-message assistant">
                <div className="chat-fs-loading">
                  <div className="chat-fs-loading-dot"></div>
                  <div className="chat-fs-loading-dot"></div>
                  <div className="chat-fs-loading-dot"></div>
                </div>
              </div>
            )}
            <div ref={fsMessagesEndRef} />
          </div>
        </div>
        <div className="chat-fs-footer">
          <div className="chat-fs-input-wrapper">
            <div className="chat-fs-input-box">
              <div className="chat-fs-input-row">
                <textarea
                  ref={fsInputRef}
                  className="chat-fs-input"
                  placeholder="무엇이든 물어보세요"
                  value={fsInputValue}
                  onChange={(e) => setFsInputValue(e.target.value)}
                  onKeyDown={handleFsKeyDown}
                  rows={1}
                />
              </div>
              <div className="chat-fs-input-actions">
                <div className="chat-fs-input-left">
                  {/* 모드 드롭다운 */}
                  <div style={{ position: "relative" }}>
                    <button
                      className="chat-mode-dropdown"
                      onClick={() => setFsModeMenuOpen(!fsModeMenuOpen)}
                    >
                      <span className="chat-mode-icon"></span>
                      <span>{currentModeLabel}</span>
                      <span className="chat-mode-arrow">▾</span>
                    </button>
                    <div className={`chat-mode-menu${fsModeMenuOpen ? " open" : ""}`}>
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
              <Link to="/product">제품 &amp; 회사소개</Link>
              <Link to="/contact">문의하기</Link>
            </div>
          </nav>

          {/* Chat UI */}
          <div className="hero-content" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div className="chat-container">
              <div className="chat-title-row">
                <h2 className="chat-title">무엇을 도와드릴까요?</h2>
                <button className="chat-expand-fullscreen-btn" onClick={openFullscreen}>
                  전체화면
                </button>
              </div>

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

          {/* Timeline Ruler */}
          <div className="hero-ruler">
            <div className="ruler-track">
              {TIMELINE_YEARS.map((year, index) => {
                const isActive = year === 2026;
                const leftPercent = (index / (TIMELINE_YEARS.length - 1)) * 100;
                return (
                  <div
                    key={year}
                    className={`ruler-mark${isActive ? " active" : ""}`}
                    style={{ left: `${leftPercent}%` }}
                  >
                    {isActive && <div className="ruler-dot"></div>}
                    <div className="line"></div>
                    <div className="label">{year}</div>
                  </div>
                );
              })}
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
              <a href="#">About Us</a>
              <Link to="/product">Platform</Link>
              <a href="#">AI Engine</a>
              <a href="#">Careers</a>
            </div>
            <div className="footer-col">
              <h4>Contact</h4>
              <Link to="/contact">문의하기</Link>
              <a href="#">Documentation</a>
              <a href="#">Support</a>
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
