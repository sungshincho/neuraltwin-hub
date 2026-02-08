// About 페이지 - NEURALTWIN 제품 & 회사소개
// HTML 원본을 React로 변환: 인트로 애니메이션, 아코디언, 캔버스, 스크롤 Reveal
import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import "@/styles/about.css";

// 서비스 아코디언 데이터
const SERVICES = [
  {
    num: "01",
    title: "데이터컨트롤타워",
    desc: "Data Aggregator Hub - 단일 진실 소스",
    panelTitle: "모든 데이터를 하나로",
    panelDesc:
      "POS, IoT 센서, CCTV, ERP 등 매장 내 모든 데이터 소스를 단일 플랫폼으로 통합합니다. 실시간 스트리밍과 배치 처리를 동시에 지원하며, 데이터 품질 모니터링이 자동으로 이루어집니다.",
    tags: ["실시간 연동", "데이터 정합성", "멀티소스 통합"],
  },
  {
    num: "02",
    title: "인사이트허브",
    desc: "실시간 대시보드 분석 및 AI 추천",
    panelTitle: "데이터에서 인사이트로",
    panelDesc:
      "통합된 데이터를 AI가 분석하여 실시간 대시보드로 시각화합니다. 매출 트렌드, 고객 동선 패턴, 재고 예측 등 핵심 지표를 한눈에 파악하고 AI 기반 추천을 받을 수 있습니다.",
    tags: ["실시간 대시보드", "AI 추천", "예측 분석"],
  },
  {
    num: "03",
    title: "디지털트윈스튜디오",
    desc: "매장 레이아웃 변경 & 상품 배치 최적화를 사전 시뮬레이션",
    panelTitle: "실제 적용 전에 검증",
    panelDesc:
      "매장의 3D 디지털 트윈을 생성하여 레이아웃 변경, 상품 재배치, 동선 최적화를 사전에 시뮬레이션합니다. 변경이 매출에 미치는 영향을 미리 예측하여 리스크를 최소화합니다.",
    tags: ["3D 시뮬레이션", "레이아웃 최적화", "사전 검증"],
  },
  {
    num: "04",
    title: "ROI 측정",
    desc: "시뮬레이션 적용 결과를 추적 분석",
    panelTitle: "성과를 숫자로 증명",
    panelDesc:
      "시뮬레이션 결과를 실제 매장에 적용한 후, 변경 전후의 성과를 자동으로 비교 분석합니다. 매출 변화, 고객 체류 시간, 동선 효율성 등 주요 KPI를 실시간으로 추적합니다.",
    tags: ["A/B 비교", "KPI 추적", "자동 리포트"],
  },
  {
    num: "05",
    title: "설정 & 관리",
    desc: "시스템 설정, 매장 관리, 사용자 권한",
    panelTitle: "유연한 시스템 관리",
    panelDesc:
      "다중 매장 관리, 사용자 권한 설정, 알림 규칙, 데이터 연동 설정 등 플랫폼의 모든 설정을 직관적인 인터페이스로 관리합니다. 역할 기반 접근 제어(RBAC)를 지원합니다.",
    tags: ["멀티매장", "권한 관리", "RBAC"],
  },
];

// 캔버스 그리기 함수 (서비스별 placeholder 시각화)
function drawServiceCanvas(canvas: HTMLCanvasElement, index: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;

  // 다크 배경 + 그리드
  ctx.fillStyle = "#0f0f0f";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  if (index === 0) {
    // 01: Data flow - nodes and connections
    const nodes = [
      { x: 80, y: 120, label: "POS" },
      { x: 80, y: 200, label: "IoT" },
      { x: 80, y: 280, label: "CCTV" },
      { x: 320, y: 200, label: "HUB" },
      { x: 540, y: 140, label: "Store" },
      { x: 540, y: 260, label: "Report" },
    ];
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    [[0, 3], [1, 3], [2, 3], [3, 4], [3, 5]].forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(nodes[a].x, nodes[a].y);
      ctx.lineTo(nodes[b].x, nodes[b].y);
      ctx.stroke();
    });
    nodes.forEach((n) => {
      const isCenter = n.label === "HUB";
      const r = isCenter ? 32 : 22;
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = isCenter ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = isCenter ? "#fff" : "rgba(255,255,255,0.5)";
      ctx.font = (isCenter ? "600 13px" : "500 11px") + " 'Fira Code', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(n.label, n.x, n.y);
    });
  } else if (index === 1) {
    // 02: Dashboard bar chart
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(40, 40, w - 80, h - 80);
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1;
    ctx.strokeRect(40, 40, w - 80, h - 80);
    const bars = [60, 85, 45, 90, 70, 95, 55, 80, 100, 75, 65, 88];
    const barW = 32;
    const gap = 12;
    const startX = 70;
    bars.forEach((val, i) => {
      const bh = val * 2.2;
      const x = startX + i * (barW + gap);
      const y = h - 80 - bh;
      ctx.fillStyle = i === 9 ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.12)";
      ctx.fillRect(x, y, barW, bh);
    });
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "500 11px 'Fira Code', monospace";
    ctx.textAlign = "left";
    ctx.fillText("Monthly Revenue", 50, 30);
  } else if (index === 2) {
    // 03: Store floor plan
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.strokeRect(80, 60, 480, 280);
    const shelves: number[][] = [
      [120, 100, 140, 20], [120, 160, 140, 20], [120, 220, 140, 20],
      [340, 100, 180, 20], [340, 160, 180, 20], [340, 260, 100, 20],
    ];
    shelves.forEach(([x, y, sw, sh]) => {
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(x, y, sw, sh);
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.strokeRect(x, y, sw, sh);
    });
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(160, 300);
    ctx.quadraticCurveTo(200, 140, 320, 140);
    ctx.quadraticCurveTo(440, 140, 480, 280);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "500 10px 'Fira Code', monospace";
    ctx.textAlign = "left";
    ctx.fillText("ENTRANCE", 130, 320);
  } else if (index === 3) {
    // 04: ROI before/after
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "500 11px 'Fira Code', monospace";
    ctx.textAlign = "center";
    ctx.fillText("BEFORE", 200, 50);
    ctx.fillText("AFTER", 440, 50);
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(320, 40); ctx.lineTo(320, 360); ctx.stroke();
    ctx.setLineDash([]);
    const before = [55, 40, 65, 50];
    const after = [80, 72, 90, 85];
    const labels = ["매출", "체류", "전환", "효율"];
    const bw = 40;
    before.forEach((v, i) => {
      const x = 100 + i * 55;
      const bh = v * 2.5;
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(x, 340 - bh, bw, bh);
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.font = "500 9px 'Fira Code', monospace";
      ctx.textAlign = "center";
      ctx.fillText(labels[i], x + bw / 2, 360);
    });
    after.forEach((v, i) => {
      const x = 340 + i * 55;
      const bh = v * 2.5;
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect(x, 340 - bh, bw, bh);
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.font = "500 9px 'Fira Code', monospace";
      ctx.textAlign = "center";
      ctx.fillText(labels[i], x + bw / 2, 360);
    });
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "700 24px 'Fira Code', monospace";
    ctx.textAlign = "center";
    ctx.fillText("→", 320, 200);
  } else if (index === 4) {
    // 05: Settings admin panel
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(40, 40, 140, 320);
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.strokeRect(40, 40, 140, 320);
    const menuItems = ["General", "Stores", "Users", "Alerts", "API"];
    menuItems.forEach((item, i) => {
      const y = 70 + i * 40;
      if (i === 2) {
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillRect(44, y - 10, 132, 30);
      }
      ctx.fillStyle = i === 2 ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)";
      ctx.font = "500 11px 'Fira Code', monospace";
      ctx.textAlign = "left";
      ctx.fillText(item, 60, y + 5);
    });
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.strokeRect(200, 40, 400, 320);
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.fillRect(200, 40, 400, 36);
    const headers = ["Name", "Role", "Status"];
    headers.forEach((h, i) => {
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "600 10px 'Fira Code', monospace";
      ctx.textAlign = "left";
      ctx.fillText(h, 220 + i * 140, 63);
    });
    for (let r = 0; r < 6; r++) {
      const ry = 90 + r * 40;
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.beginPath(); ctx.moveTo(200, ry); ctx.lineTo(600, ry); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillRect(220, ry + 8, 80, 8);
      ctx.fillRect(360, ry + 8, 50, 8);
      ctx.fillStyle = r < 4 ? "rgba(100,255,150,0.15)" : "rgba(255,100,100,0.15)";
      ctx.fillRect(500, ry + 8, 40, 8);
    }
  }
}

const About = () => {
  // 인트로 애니메이션 상태
  const [introComplete, setIntroComplete] = useState(false);
  const [curtainsOpen, setCurtainsOpen] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [introHidden, setIntroHidden] = useState(false);

  // 아코디언 상태 (열려있는 서비스 인덱스, -1이면 모두 닫힘)
  const [openService, setOpenService] = useState(-1);

  // 캔버스 ref 배열 (서비스 패널 내부)
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  // 캔버스가 이미 그려졌는지 추적
  const canvasDrawn = useRef<boolean[]>([false, false, false, false, false]);

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
      const nextOpen = openService === index ? -1 : index;
      setOpenService(nextOpen);

      // 캔버스 그리기 (처음 열릴 때만)
      if (nextOpen >= 0 && !canvasDrawn.current[nextOpen]) {
        const canvas = canvasRefs.current[nextOpen];
        if (canvas) {
          drawServiceCanvas(canvas, nextOpen);
          canvasDrawn.current[nextOpen] = true;
        }
      }
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
          </div>
        </nav>

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
                    <canvas
                      ref={(el) => { canvasRefs.current[i] = el; }}
                      width={640}
                      height={400}
                    />
                    <span className="service-panel-image-label">Preview</span>
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
