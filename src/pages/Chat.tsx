// 채팅 페이지 - NEURALTWIN 다크 테마 스타일 적용
import { useEffect } from "react";
import { Link } from "react-router-dom";
import "@/styles/chat.css";

const Chat = () => {
  useEffect(() => {
    // 페이지 진입 시 body 스타일 조정
    document.body.style.backgroundColor = "#0a0a0a";
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, []);

  return (
    <div className="chat-page">
      {/* Grid Background */}
      <div className="chat-grid-bg">
        <div className="grid-lines"></div>
        <div className="grid-lines-fine"></div>
        <div className="grid-dots"></div>
        <div className="grid-glow"></div>
      </div>

      {/* Navigation */}
      <nav className="chat-nav">
        <Link to="/">
          <img
            src="/NEURALTWIN_logo_white.png"
            alt="NEURALTWIN"
            className="logo-img"
          />
        </Link>
        <div className="chat-nav-links">
          <Link to="/product">제품</Link>
          <Link to="/pricing">가격</Link>
          <Link to="/dashboard">대시보드</Link>
        </div>
      </nav>

      {/* Page Header */}
      <header className="chat-header">
        <div className="chat-label chat-animate-in chat-animate-delay-1">Chat</div>
        <h1 className="chat-title chat-animate-in chat-animate-delay-2">채팅</h1>
      </header>

      {/* Main Content Area */}
      <main className="chat-content chat-animate-in chat-animate-delay-3">
        {/* TODO: 채팅 UI 컴포넌트 추가 예정 */}
        <div style={{
          border: "1px solid var(--gray-700)",
          padding: "40px",
          textAlign: "center",
          color: "var(--gray-500)"
        }}>
          <p style={{ marginBottom: "16px" }}>채팅 UI가 여기에 구현될 예정입니다.</p>
          <p style={{ fontSize: "12px" }}>Coming Soon</p>
        </div>
      </main>

      {/* Footer */}
      <footer className="chat-footer">
        <div className="chat-footer-left">
          <img
            src="/NEURALTWIN_logo_white.png"
            alt="NEURALTWIN"
            className="logo-img"
          />
          <p>복잡한 세계를 위한 AI 플랫폼.<br />데이터를 의사결정으로 전환합니다.</p>
        </div>
        <div className="chat-footer-cols">
          <div className="chat-footer-col">
            <h4>Product</h4>
            <Link to="/product">Platform</Link>
            <Link to="/pricing">Pricing</Link>
          </div>
          <div className="chat-footer-col">
            <h4>Company</h4>
            <Link to="/contact">Contact</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
          </div>
        </div>
      </footer>
      <div className="chat-footer-bottom">
        <span>© 2026 NEURALTWIN. All rights reserved.</span>
        <span>Privacy Policy · Terms of Service</span>
      </div>
    </div>
  );
};

export default Chat;
