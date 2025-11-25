import { Link } from "react-router-dom";
import { Mail, Linkedin, Twitter } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-border/50 bg-card/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow glow" />
              <span className="text-xl font-bold gradient-text">NEURALTWIN</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              오프라인 리테일을 위한<br />
              궁극의 AI OS
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
                <Linkedin size={20} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
                <Twitter size={20} />
              </a>
              <a href="mailto:contact@neuraltwin.ai" className="text-muted-foreground hover:text-primary transition-smooth">
                <Mail size={20} />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold mb-4">제품</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/product" className="text-muted-foreground hover:text-foreground transition-smooth">
                  기능
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-smooth">
                  가격
                </Link>
              </li>
              <li>
                <Link to="/technology" className="text-muted-foreground hover:text-foreground transition-smooth">
                  기술
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">회사</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-foreground transition-smooth">
                  팀
                </Link>
              </li>
              <li>
                <Link to="/case" className="text-muted-foreground hover:text-foreground transition-smooth">
                  케이스
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-smooth">
                  문의
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4">법적 고지</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-smooth">
                  개인정보처리방침
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-smooth">
                  이용약관
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/50">
          <p className="text-center text-sm text-muted-foreground">
            © 2025 NEURALTWIN. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
