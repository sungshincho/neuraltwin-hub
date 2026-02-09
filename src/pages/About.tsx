// About 페이지 - NEURALTWIN 제품 & 회사소개
// HTML 원본을 React로 변환: 인트로 애니메이션, 아코디언, 캔버스, 스크롤 Reveal
import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import "@/styles/about.css";

// 서비스 아코디언 데이터
// 서비스별 스크린샷 이미지 경로 — public/images/services/ 에 실제 파일 배치 필요
const SERVICES = [
  {
    num: "01",
    title: "데이터컨트롤타워",
    desc: "Data Aggregator Hub - 단일 진실 소스",
    image: "/images/services/data-control-tower.png",
    panelTitle: "모든 데이터를 하나로",
    panelDesc:
      "POS, IoT 센서, CCTV, ERP 등 매장 내 모든 데이터 소스를 단일 플랫폼으로 통합합니다. 실시간 스트리밍과 배치 처리를 동시에 지원하며, 데이터 품질 모니터링이 자동으로 이루어집니다.",
    tags: ["실시간 연동", "데이터 정합성", "멀티소스 통합"],
  },
  {
    num: "02",
    title: "인사이트허브",
    desc: "실시간 대시보드 분석 및 AI 추천",
    image: "/images/services/insight-hub.png",
    panelTitle: "데이터에서 인사이트로",
    panelDesc:
      "통합된 데이터를 AI가 분석하여 실시간 대시보드로 시각화합니다. 매출 트렌드, 고객 동선 패턴, 재고 예측 등 핵심 지표를 한눈에 파악하고 AI 기반 추천을 받을 수 있습니다.",
    tags: ["실시간 대시보드", "AI 추천", "예측 분석"],
  },
  {
    num: "03",
    title: "디지털트윈스튜디오",
    desc: "매장 레이아웃 변경 & 상품 배치 최적화를 사전 시뮬레이션",
    image: "/images/services/digital-twin-studio.png",
    panelTitle: "실제 적용 전에 검증",
    panelDesc:
      "매장의 3D 디지털 트윈을 생성하여 레이아웃 변경, 상품 재배치, 동선 최적화를 사전에 시뮬레이션합니다. 변경이 매출에 미치는 영향을 미리 예측하여 리스크를 최소화합니다.",
    tags: ["3D 시뮬레이션", "레이아웃 최적화", "사전 검증"],
  },
  {
    num: "04",
    title: "ROI 측정",
    desc: "시뮬레이션 적용 결과를 추적 분석",
    image: "/images/services/roi-measurement.png",
    panelTitle: "성과를 숫자로 증명",
    panelDesc:
      "시뮬레이션 결과를 실제 매장에 적용한 후, 변경 전후의 성과를 자동으로 비교 분석합니다. 매출 변화, 고객 체류 시간, 동선 효율성 등 주요 KPI를 실시간으로 추적합니다.",
    tags: ["A/B 비교", "KPI 추적", "자동 리포트"],
  },
  {
    num: "05",
    title: "설정 & 관리",
    desc: "시스템 설정, 매장 관리, 사용자 권한",
    image: "/images/services/settings-management.png",
    panelTitle: "유연한 시스템 관리",
    panelDesc:
      "다중 매장 관리, 사용자 권한 설정, 알림 규칙, 데이터 연동 설정 등 플랫폼의 모든 설정을 직관적인 인터페이스로 관리합니다. 역할 기반 접근 제어(RBAC)를 지원합니다.",
    tags: ["멀티매장", "권한 관리", "RBAC"],
  },
];


const About = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // 인트로 애니메이션 상태
  const [introComplete, setIntroComplete] = useState(false);
  const [curtainsOpen, setCurtainsOpen] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [introHidden, setIntroHidden] = useState(false);

  // 아코디언 상태 (열려있는 서비스 인덱스, -1이면 모두 닫힘)
  const [openService, setOpenService] = useState(-1);

  // 패널 ref 배열 (아코디언 높이 계산용)
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  // 서비스 아이템 ref 배열 (classList 기반 open 토글 — React className 충돌 방지)
  const serviceItemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // body 다크 배경
    document.body.style.backgroundColor = "#0a0a0a";
    document.body.style.margin = "0";
    document.body.style.padding = "0";

    // 인트로 시퀀스
    const t1 = setTimeout(() => setIntroComplete(true), 1100);
    const t2 = setTimeout(() => {
      setCurtainsOpen(true);
      setContentVisible(true);
    }, 1400);
    const t3 = setTimeout(() => setIntroHidden(true), 2200);

    return () => {
      document.body.style.backgroundColor = "";
      document.body.style.margin = "";
      document.body.style.padding = "";
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // 스크롤 Reveal (IntersectionObserver)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.15 }
    );

    const elements = document.querySelectorAll(".about-page .reveal");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [contentVisible]);

  // 아코디언 토글
  const toggleService = useCallback(
    (index: number) => {
      setOpenService(openService === index ? -1 : index);
    },
    [openService]
  );

  // open 클래스를 classList로 관리 — React className이 IntersectionObserver의 visible을 덮어쓰지 않도록
  useEffect(() => {
    serviceItemRefs.current.forEach((el, i) => {
      if (!el) return;
      el.classList.toggle('open', openService === i);
    });
  }, [openService]);

  // 아코디언 패널 높이 계산 — rAF로 레이아웃 완료 후 측정하여 scrollHeight 0 버그 방지
  useEffect(() => {
    requestAnimationFrame(() => {
      panelRefs.current.forEach((panel, i) => {
        if (!panel) return;
        if (openService === i) {
          panel.style.maxHeight = panel.scrollHeight + "px";
        } else {
          panel.style.maxHeight = "0px";
        }
      });
    });
  }, [openService]);

  return (
    <div className="about-page">
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

      {/* ==================== GRID BACKGROUND ==================== */}
      <div className="page-grid-bg">
        <div className="grid-lines"></div>
        <div className="grid-lines-fine"></div>
        <div className="grid-dots"></div>
        <div className="grid-glow"></div>
      </div>

      {/* ==================== PAGE CONTENT ==================== */}
      <div className={`page-content${contentVisible ? " visible" : ""}`}>
        {/* Nav */}
        <nav className="page-nav">
          <Link to="/">
            <img src="/NEURALTWIN_logo_white.png" alt="NEURALTWIN" className="logo-img" />
          </Link>
          <div className="page-nav-links">
            <Link to="/about" className="active">제품 &amp; 회사소개</Link>
            <Link to="/contact">문의하기</Link>
            <Link to="/auth" state={{ tab: "login" }} style={{ display: "none" }}>로그인</Link>
            <Link to="/auth" state={{ tab: "signup" }} style={{ display: "none" }}>회원가입</Link>
          </div>
          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <span className="mobile-menu-icon">{mobileMenuOpen ? "✕" : "☰"}</span>
          </button>
        </nav>
        {mobileMenuOpen && (
          <div className="mobile-menu-dropdown">
            <Link to="/about" onClick={() => setMobileMenuOpen(false)}>제품 &amp; 회사소개</Link>
            <Link to="/contact" onClick={() => setMobileMenuOpen(false)}>문의하기</Link>
          </div>
        )}

        {/* ==================== PAGE HERO ==================== */}
        <section className="page-hero">
          <div className="page-hero-label">Product &amp; Company</div>
          <h1 className="page-hero-title">
            리테일의 미래를<br />만듭니다
          </h1>
          <p className="page-hero-desc">
            NEURALTWIN은 오프라인 매장을 디지털 트윈으로 구현하여
            실시간으로 운영 상황을 모니터링하고 최적화하는 AI 플랫폼입니다.
          </p>
        </section>

        {/* ==================== ABOUT ==================== */}
        <section className="section-about" id="about">
          <div className="about-left reveal">
            <div className="about-label">About</div>
            <h2 className="about-title">
              리테일의<br />미래를<br />만듭니다
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

        {/* ==================== SERVICES (Accordion) ==================== */}
        <section className="section-services" id="services">
          <div className="services-header reveal">
            <div className="about-label">Platform</div>
            <h2 className="about-title">강력한 도구</h2>
          </div>

          {SERVICES.map((svc, i) => (
            <div
              key={svc.num}
              ref={(el) => { serviceItemRefs.current[i] = el; }}
              className="service-item reveal"
            >
              <div className="service-row" onClick={() => toggleService(i)}>
                <div className="service-num">{svc.num}</div>
                <div className="service-title">{svc.title}</div>
                <div className="service-desc">{svc.desc}</div>
              </div>
              <div className="service-arrow">→</div>
              <div
                className="service-panel"
                ref={(el) => { panelRefs.current[i] = el; }}
              >
                <div className="service-panel-inner">
                  <div className="service-panel-image">
                    <img
                      src={svc.image}
                      alt={svc.title}
                      loading="lazy"
                    />
                  </div>
                  <div className="service-panel-text">
                    <h3>{svc.panelTitle}</h3>
                    <p>{svc.panelDesc}</p>
                    <div className="service-panel-tags">
                      {svc.tags.map((tag) => (
                        <span key={tag} className="service-panel-tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* ==================== HOW IT WORKS ==================== */}
        <section className="section-process" id="process">
          <div className="process-header reveal">
            <div className="about-label">How It Works</div>
            <h2 className="about-title">4단계로 시작하세요</h2>
          </div>
          <div className="process-grid">
            <div className="process-step reveal">
              <div className="process-step-num">01</div>
              <div className="process-step-title">데이터 연결</div>
              <div className="process-step-desc">
                POS, IoT 센서, CCTV 등 기존 시스템의 데이터를 NEURALTWIN에 연결합니다.
                별도 하드웨어 설치 없이 시작할 수 있습니다.
              </div>
              <div className="process-connector"></div>
            </div>
            <div className="process-step reveal">
              <div className="process-step-num">02</div>
              <div className="process-step-title">디지털 트윈 생성</div>
              <div className="process-step-desc">
                실제 매장의 디지털 트윈을 자동으로 생성합니다. 레이아웃, 상품 배치,
                고객 동선이 실시간으로 반영됩니다.
              </div>
              <div className="process-connector"></div>
            </div>
            <div className="process-step reveal">
              <div className="process-step-num">03</div>
              <div className="process-step-title">AI 분석 &amp; 시뮬레이션</div>
              <div className="process-step-desc">
                AI가 패턴을 분석하고 최적화 방안을 제안합니다. 변경 사항을
                실제 적용 전에 시뮬레이션으로 검증할 수 있습니다.
              </div>
              <div className="process-connector"></div>
            </div>
            <div className="process-step reveal">
              <div className="process-step-num">04</div>
              <div className="process-step-title">실행 &amp; 측정</div>
              <div className="process-step-desc">
                검증된 최적화 방안을 실제 매장에 적용하고, ROI를 실시간으로 추적합니다.
                지속적인 개선 사이클을 구축합니다.
              </div>
            </div>
          </div>
        </section>

        {/* ==================== CTA ==================== */}
        <section className="section-cta" id="cta">
          <div className="cta-glow"></div>
          <div className="reveal">
            <div className="cta-label">Get Started</div>
            <h2 className="cta-title">
              미래를 구축할<br />준비가 되셨나요?
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
        <footer className="about-footer">
          <div className="footer-left">
            <img src="/NEURALTWIN_logo_white.png" alt="NEURALTWIN" className="logo-img" />
            <p>복잡한 세계를 위한 AI 플랫폼.<br />데이터를 의사결정으로 전환합니다.</p>
          </div>
          <div className="footer-cols">
            <div className="footer-col">
              <h4>Company &amp; Product</h4>
              <Link to="/about">제품 & 회사소개</Link>
            </div>
            <div className="footer-col">
              <h4>Contact</h4>
              <Link to="/contact">문의하기</Link>
            </div>
          </div>
        </footer>
        <div className="footer-bottom">
          <span>&copy; 2026 NEURALTWIN. All rights reserved.</span>
          <span>
            <Link to="/privacy">Privacy Policy</Link> · <Link to="/terms">Terms of Service</Link>
          </span>
        </div>
      </div>
    </div>
  );
};

export default About;
