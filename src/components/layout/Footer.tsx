import { Link } from "react-router-dom";
import { Mail, Linkedin, Twitter } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-background border-t border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold gradient-text">
              NEURALTWIN
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              오프라인 리테일을 위한<br />
              궁극의 AI OS
            </p>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">제품</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/product" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  기능
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  가격
                </Link>
              </li>
              <li>
                <Link to="/product" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  기술
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">회사</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  팀
                </Link>
              </li>
              <li>
                <Link to="/cases" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  케이스
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  문의
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">법적 고지</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  개인정보처리방침
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  이용약관
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground text-center">
            © 2025 NEURALTWIN. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
