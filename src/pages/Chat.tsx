// 채팅 페이지 - NEURALTWIN 다크 테마 (원본 HTML 완전 동일 구현)
import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import "@/styles/chat.css";

const Chat = () => {
  const [introComplete, setIntroComplete] = useState(false);
  const [curtainsOpen, setCurtainsOpen] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [introHidden, setIntroHidden] = useState(false);
  const rulerTrackRef = useRef<HTMLDivElement>(null);

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

  // 타임라인 룰러 생성
  useEffect(() => {
    if (!rulerTrackRef.current) return;

    const rulerTrack = rulerTrackRef.current;
    rulerTrack.innerHTML = "";

    const years = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
    const activeYear = 2026;

    years.forEach((year, i) => {
      const pos = 3 + (i / (years.length - 1)) * 94;

      // 활성 연도 도트
      if (year === activeYear) {
        const dot = document.createElement("div");
        dot.className = "ruler-dot";
        dot.style.left = `${pos}%`;
        dot.style.transform = "translateX(-50%)";
        rulerTrack.appendChild(dot);
      }

      // 연도 마크
      const mark = document.createElement("div");
      mark.className = `ruler-mark${year === activeYear ? " active" : ""}`;
      mark.style.left = `${pos}%`;
      mark.innerHTML = `<div class="line"></div><div class="label">${year}</div>`;
      rulerTrack.appendChild(mark);

      // 작은 틱
      if (i < years.length - 1) {
        for (let t = 1; t <= 3; t++) {
          const tick = document.createElement("div");
          tick.className = "ruler-mark ruler-minor";
          const tickPos = pos + (t * (94 / (years.length - 1)) / 4);
          tick.style.left = `${tickPos}%`;
          tick.innerHTML = '<div class="line"></div>';
          rulerTrack.appendChild(tick);
        }
      }
    });
  }, []);

  // 스크롤 리빌 효과
  useEffect(() => {
    const revealOnScroll = () => {
      const revealElements = document.querySelectorAll(".reveal");
      revealElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.85) {
          el.classList.add("visible");
        }
      });
    };

    window.addEventListener("scroll", revealOnScroll);
    revealOnScroll();

    return () => window.removeEventListener("scroll", revealOnScroll);
  }, []);

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
        {/* ==================== HERO ==================== */}
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

          {/* Content */}
          <div className="hero-content">
            <div className="hero-text">
              <p>
                궁극의 AI 리테일<br />
                인텔리전스 NEURALTWIN<br />
                가장 진보한<br />
                스마트 리테일의 미래
              </p>
            </div>
            <div className="hero-right">
              <div className="hero-menu">
                <a href="#services">제품</a>
                <a href="#about">가격</a>
                <a href="#cta">문의하기</a>
                <Link to="/dashboard">대시보드</Link>
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
            <div className="ruler-track" ref={rulerTrackRef}></div>
          </div>

          {/* Giant Brand */}
          <div className="hero-brand">
            <h1>NEURALTWIN</h1>
          </div>
        </section>

        {/* ==================== ABOUT ==================== */}
        <section className="section-about" id="about">
          <div className="about-left reveal">
            <div className="about-label">About</div>
            <h2 className="about-title">
              리테일의<br />
              미래를<br />
              만듭니다
            </h2>
          </div>
          <div className="about-right reveal">
            <p>
              NEURALTWIN은 오프라인 매장을 디지털 트윈으로 구현하여
              실시간으로 운영 상황을 모니터링하고 최적화합니다.
            </p>
            <p>
              AI 기반 분석으로 고객 동선, 상품 배치, 재고 관리를
              자동으로 최적화하여 매출을 극대화합니다.
            </p>
            <div className="about-stat-row">
              <div className="about-stat">
                <div className="number">-70%</div>
                <div className="label">시간 단축</div>
              </div>
              <div className="about-stat">
                <div className="number">+20%</div>
                <div className="label">매출 성장</div>
              </div>
              <div className="about-stat">
                <div className="number">-30%</div>
                <div className="label">비용 감소</div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== SERVICES ==================== */}
        <section className="section-services" id="services">
          <div className="services-header reveal">
            <div className="about-label">Platform</div>
            <h2 className="about-title">강력한 도구</h2>
          </div>

          <div className="service-row reveal">
            <div className="service-num">01</div>
            <div className="service-title">데이터컨트롤타워</div>
            <div className="service-desc">Data Aggregator Hub - 단일 진실 소스</div>
            <div className="service-arrow">→</div>
          </div>
          <div className="service-row reveal">
            <div className="service-num">02</div>
            <div className="service-title">인사이트허브</div>
            <div className="service-desc">실시간 대시보드 분석 및 AI 추천</div>
            <div className="service-arrow">→</div>
          </div>
          <div className="service-row reveal">
            <div className="service-num">03</div>
            <div className="service-title">디지털트윈스튜디오</div>
            <div className="service-desc">매장 레이아웃 변경 & 상품 배치 최적화를 사전 시뮬레이션</div>
            <div className="service-arrow">→</div>
          </div>
          <div className="service-row reveal">
            <div className="service-num">04</div>
            <div className="service-title">ROI 측정</div>
            <div className="service-desc">시뮬레이션 적용 결과를 추적 분석</div>
            <div className="service-arrow">→</div>
          </div>
          <div className="service-row reveal">
            <div className="service-num">05</div>
            <div className="service-title">설정 & 관리</div>
            <div className="service-desc">시스템 설정, 매장 관리, 사용자 권한</div>
            <div className="service-arrow">→</div>
          </div>
        </section>

        {/* ==================== CTA ==================== */}
        <section className="section-cta" id="cta">
          <div className="cta-glow"></div>
          <div className="reveal">
            <div className="cta-label">Get Started</div>
            <h2 className="cta-title">
              미래를 구축할<br />
              준비가 되셨나요?
            </h2>
            <p className="cta-desc">
              지금 바로 NEURALTWIN 플랫폼을 경험하세요.
              전문가 팀이 여러분의 여정을 함께합니다.
            </p>
            <div className="cta-buttons">
              <Link to="/contact" className="btn-white">미팅 요청</Link>
              <Link to="/contact" className="btn-outline">상담하기</Link>
            </div>
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
