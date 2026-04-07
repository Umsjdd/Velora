import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../landing.css'

export default function Landing() {
  useEffect(() => {
    // Scroll reveal
    const reveals = document.querySelectorAll('.reveal')
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
        }
      })
    }, { threshold: 0.1 })
    reveals.forEach((el) => observer.observe(el))

    // Nav scroll effect
    const handleScroll = () => {
      const nav = document.getElementById('nav')
      if (nav) nav.classList.toggle('nav-scrolled', window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)

    // Pricing toggle
    const toggle = document.getElementById('pricing-toggle')
    const handleToggle = () => {
      const isAnnual = toggle?.classList.toggle('active')
      document.querySelectorAll('.price-value').forEach((el) => {
        el.textContent = isAnnual ? el.dataset.annual : el.dataset.monthly
      })
      document.getElementById('toggle-monthly')?.classList.toggle('active', !isAnnual)
      document.getElementById('toggle-annual')?.classList.toggle('active', isAnnual)
    }
    toggle?.addEventListener('click', handleToggle)

    // Mobile menu
    const navToggle = document.getElementById('nav-toggle')
    const mobileMenu = document.getElementById('mobile-menu')
    const handleMobileToggle = () => {
      navToggle?.classList.toggle('active')
      mobileMenu?.classList.toggle('active')
    }
    navToggle?.addEventListener('click', handleMobileToggle)
    mobileMenu?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
      navToggle?.classList.remove('active')
      mobileMenu?.classList.remove('active')
    }))

    return () => {
      window.removeEventListener('scroll', handleScroll)
      observer.disconnect()
      toggle?.removeEventListener('click', handleToggle)
      navToggle?.removeEventListener('click', handleMobileToggle)
    }
  }, [])

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="nav" id="nav">
        <div className="nav-container">
          <a href="#" className="nav-logo">
            <div className="logo-icon">
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="8" fill="url(#logo-grad)" />
                <path d="M10 10L16 22L22 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="logo-grad" x1="0" y1="0" x2="32" y2="32">
                    <stop stopColor="#4a6cf7" />
                    <stop offset="1" stopColor="#7c5cf7" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            Vestora
          </a>
          <div className="nav-links" id="nav-links">
            <a href="#product">Product</a>
            <a href="#features">Features</a>
            <a href="#use-cases">Use Cases</a>
            <a href="#pricing">Pricing</a>
          </div>
          <div className="nav-actions">
            <Link to="/login" className="btn-text">Sign In</Link>
            <Link to="/register" className="btn-primary btn-sm">Get Started</Link>
          </div>
          <button className="nav-toggle" id="nav-toggle" aria-label="Menu">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className="mobile-menu" id="mobile-menu">
        <a href="#product">Product</a>
        <a href="#features">Features</a>
        <a href="#use-cases">Use Cases</a>
        <a href="#pricing">Pricing</a>
        <div className="mobile-menu-actions">
          <Link to="/login" className="btn-text">Sign In</Link>
          <Link to="/register" className="btn-primary">Get Started</Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-glow hero-glow-1"></div>
          <div className="hero-glow hero-glow-2"></div>
          <div className="hero-glow hero-glow-3"></div>
          <div className="hero-grid"></div>
        </div>
        <div className="container">
          <div className="hero-content reveal">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              The all-in-one infrastructure platform
            </div>
            <h1>Your Entire Digital<br />Infrastructure. <span className="gradient-text">Simplified.</span></h1>
            <p className="hero-sub">Servers, email, storage, domains, analytics, and billing — unified in one premium platform. No complexity. No compromise.</p>
            <div className="hero-cta">
              <Link to="/register" className="btn-primary btn-lg">
                Get Started
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              </Link>
              <a href="#product" className="btn-outline btn-lg">See How It Works</a>
            </div>
          </div>
          <div className="hero-stats reveal reveal-delay-1">
            <div className="stat">
              <span className="stat-value">99.99%</span>
              <span className="stat-label">Uptime SLA</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat">
              <span className="stat-value">42</span>
              <span className="stat-label">Global Edge Locations</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat">
              <span className="stat-value">&lt;50ms</span>
              <span className="stat-label">Avg Response Time</span>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="trust-bar">
        <div className="container">
          <p className="trust-label reveal">Trusted by forward-thinking teams worldwide</p>
          <div className="trust-logos reveal reveal-delay-1">
            <div className="trust-logo">Meridian</div>
            <div className="trust-logo">Arclight</div>
            <div className="trust-logo">Onward</div>
            <div className="trust-logo">Helix</div>
            <div className="trust-logo">Prism</div>
          </div>
        </div>
      </section>

      {/* Product Overview */}
      <section className="section product" id="product">
        <div className="container">
          <div className="section-header reveal">
            <span className="section-tag">Product</span>
            <h2>One platform.<br />Everything you need.</h2>
            <p className="section-sub">Stop juggling eight different tools. Vestora brings your entire digital infrastructure under one roof — managed, monitored, and optimised from a single dashboard.</p>
          </div>
          <div className="product-grid">
            <div className="product-category reveal">
              <h3 className="category-title">
                <span className="category-icon infrastructure">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" /><circle cx="6" cy="6" r="1" fill="currentColor" stroke="none" /><circle cx="6" cy="18" r="1" fill="currentColor" stroke="none" /></svg>
                </span>
                Infrastructure
              </h3>
              <div className="product-cards">
                <div className="product-card">
                  <div className="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg></div>
                  <h4>Server Hosting</h4>
                  <p>Fast, scalable cloud servers with automatic load balancing and 99.99% uptime guarantee.</p>
                </div>
                <div className="product-card">
                  <div className="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg></div>
                  <h4>Database Hosting</h4>
                  <p>Managed databases with automatic backups, point-in-time recovery, and enterprise-grade security.</p>
                </div>
                <div className="product-card">
                  <div className="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg></div>
                  <h4>Image & File Storage</h4>
                  <p>Store and deliver images, videos, and documents with automatic compression and optimisation.</p>
                </div>
              </div>
            </div>
            <div className="product-category reveal reveal-delay-1">
              <h3 className="category-title">
                <span className="category-icon delivery">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                </span>
                Delivery
              </h3>
              <div className="product-cards">
                <div className="product-card">
                  <div className="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" /></svg></div>
                  <h4>CDN</h4>
                  <p>Global content delivery network with intelligent caching, DDoS protection, and edge computing.</p>
                </div>
                <div className="product-card">
                  <div className="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg></div>
                  <h4>Domains & DNS</h4>
                  <p>Register domains, manage DNS records, and get automatic SSL certificates — all in one place.</p>
                </div>
              </div>
            </div>
            <div className="product-category reveal reveal-delay-2">
              <h3 className="category-title">
                <span className="category-icon communication">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                </span>
                Communication
              </h3>
              <div className="product-cards">
                <div className="product-card">
                  <div className="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg></div>
                  <h4>Email Hosting</h4>
                  <p>Professional business email with your domain. High deliverability, spam protection, and unlimited aliases.</p>
                </div>
              </div>
            </div>
            <div className="product-category reveal reveal-delay-1">
              <h3 className="category-title">
                <span className="category-icon insights">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
                </span>
                Insights
              </h3>
              <div className="product-cards">
                <div className="product-card">
                  <div className="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" /></svg></div>
                  <h4>Analytics Dashboard</h4>
                  <p>Website traffic, email performance, and infrastructure metrics — all visualised in real time.</p>
                </div>
                <div className="product-card">
                  <div className="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg></div>
                  <h4>Monitoring & Alerts</h4>
                  <p>Uptime monitoring, performance tracking, and real-time notifications when something needs attention.</p>
                </div>
              </div>
            </div>
            <div className="product-category reveal reveal-delay-2">
              <h3 className="category-title">
                <span className="category-icon business">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h22" /></svg>
                </span>
                Business Tools
              </h3>
              <div className="product-cards">
                <div className="product-card">
                  <div className="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h22" /></svg></div>
                  <h4>Billing & Subscriptions</h4>
                  <p>Built-in billing, subscription management, and payment integrations to monetise your services.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section features" id="features">
        <div className="container">
          <div className="section-header reveal">
            <span className="section-tag">Features</span>
            <h2>Built for performance.<br />Designed for clarity.</h2>
            <p className="section-sub">Every feature exists because businesses asked for it. Nothing extra. Nothing missing.</p>
          </div>
          <div className="features-grid">
            {[
              { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>, title: 'Unified Dashboard', desc: 'Servers, email, storage, domains, analytics — controlled from a single, beautifully designed interface.' },
              { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><path d="m10 17 5-5-5-5" /><path d="M15 12H3" /></svg>, title: 'One Login', desc: 'Access everything with a single set of credentials. Team permissions and roles built in.' },
              { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" /></svg>, title: 'High Performance', desc: 'Enterprise-grade infrastructure with 99.99% uptime SLA and sub-50ms response times globally.' },
              { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>, title: 'Secure by Default', desc: 'Automatic SSL, DDoS protection, encrypted storage, and SOC 2 compliant infrastructure.' },
              { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /><polyline points="21 3 21 9 15 9" /></svg>, title: 'Auto-Scaling', desc: 'Infrastructure that grows with your business. Handle traffic spikes without manual intervention.' },
              { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>, title: 'Priority Support', desc: 'Real humans. Fast responses. Dedicated account managers on Growth and Scale plans.' },
            ].map((f, i) => (
              <div key={f.title} className={`feature-card reveal ${i > 0 ? `reveal-delay-${(i % 3)}` : ''}`}>
                <div className="feature-icon">{f.icon}</div>
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="section pricing" id="pricing">
        <div className="container">
          <div className="section-header reveal">
            <span className="section-tag">Pricing</span>
            <h2>Simple, transparent pricing.</h2>
            <p className="section-sub">No hidden fees. No surprise charges. Choose the plan that fits your business.</p>
          </div>
          <div className="pricing-toggle reveal">
            <span className="toggle-label active" id="toggle-monthly">Monthly</span>
            <button className="toggle-switch" id="pricing-toggle" aria-label="Toggle billing period">
              <span className="toggle-knob"></span>
            </button>
            <span className="toggle-label" id="toggle-annual">Annual <span className="toggle-save">Save 20%</span></span>
          </div>
          <div className="pricing-grid">
            <div className="pricing-card reveal">
              <div className="pricing-header">
                <h4>Starter</h4>
                <p className="pricing-desc">For individuals and small projects</p>
                <div className="pricing-amount">
                  <span className="price-currency">$</span>
                  <span className="price-value" data-monthly="49" data-annual="39">49</span>
                  <span className="price-period">/month</span>
                </div>
              </div>
              <ul className="pricing-features">
                {['1 Cloud Server (2 vCPU, 4GB RAM)', '5 Email Accounts', '50GB Storage', '1 Domain with SSL', 'Basic Analytics', 'Community Support'].map((f) => (
                  <li key={f}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>{f}</li>
                ))}
              </ul>
              <Link to="/register" className="btn-outline btn-block">Get Started</Link>
            </div>
            <div className="pricing-card pricing-card-featured reveal reveal-delay-1">
              <div className="pricing-badge">Most Popular</div>
              <div className="pricing-header">
                <h4>Growth</h4>
                <p className="pricing-desc">For growing businesses</p>
                <div className="pricing-amount">
                  <span className="price-currency">$</span>
                  <span className="price-value" data-monthly="149" data-annual="119">149</span>
                  <span className="price-period">/month</span>
                </div>
              </div>
              <ul className="pricing-features">
                {['3 Cloud Servers (4 vCPU, 8GB RAM)', '25 Email Accounts', '250GB Storage', '5 Domains with SSL', 'Full Analytics & Monitoring', 'Global CDN', 'Priority Support'].map((f) => (
                  <li key={f}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>{f}</li>
                ))}
              </ul>
              <Link to="/register" className="btn-primary btn-block">Get Started</Link>
            </div>
            <div className="pricing-card reveal reveal-delay-2">
              <div className="pricing-header">
                <h4>Scale</h4>
                <p className="pricing-desc">For teams and enterprises</p>
                <div className="pricing-amount">
                  <span className="price-currency">$</span>
                  <span className="price-value" data-monthly="399" data-annual="319">399</span>
                  <span className="price-period">/month</span>
                </div>
              </div>
              <ul className="pricing-features">
                {['Unlimited Servers (Custom Specs)', 'Unlimited Email Accounts', '1TB Storage', 'Unlimited Domains with SSL', 'Advanced Analytics & API Access', 'Global CDN + DDoS Protection', 'Dedicated Account Manager', 'Custom Integrations'].map((f) => (
                  <li key={f}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>{f}</li>
                ))}
              </ul>
              <Link to="/register" className="btn-outline btn-block">Contact Sales</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section cta-section">
        <div className="cta-bg">
          <div className="cta-glow cta-glow-1"></div>
          <div className="cta-glow cta-glow-2"></div>
        </div>
        <div className="container">
          <div className="cta-content reveal">
            <h2>Ready to simplify your infrastructure?</h2>
            <p>Join forward-thinking businesses that run everything from one platform. Set up in minutes, not days.</p>
            <div className="cta-actions">
              <Link to="/register" className="btn-primary btn-lg">
                Get Started Today
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              </Link>
              <a href="#pricing" className="btn-text btn-lg">Talk to Sales</a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <a href="#" className="nav-logo">
                <div className="logo-icon">
                  <svg viewBox="0 0 32 32" fill="none">
                    <rect width="32" height="32" rx="8" fill="url(#footer-grad)" />
                    <path d="M10 10L16 22L22 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <defs><linearGradient id="footer-grad" x1="0" y1="0" x2="32" y2="32"><stop stopColor="#4a6cf7" /><stop offset="1" stopColor="#7c5cf7" /></linearGradient></defs>
                  </svg>
                </div>
                Vestora
              </a>
              <p className="footer-tagline">Your entire digital infrastructure. Simplified.</p>
            </div>
            <div className="footer-links">
              <div className="footer-col">
                <h5>Product</h5>
                <a href="#product">Features</a>
                <a href="#pricing">Pricing</a>
                <a href="#dashboard">Dashboard</a>
              </div>
              <div className="footer-col">
                <h5>Company</h5>
                <a href="#">About</a>
                <a href="#">Blog</a>
                <a href="#">Careers</a>
                <a href="#">Contact</a>
              </div>
              <div className="footer-col">
                <h5>Resources</h5>
                <a href="#">Documentation</a>
                <a href="#">API Reference</a>
                <a href="#">Status Page</a>
              </div>
              <div className="footer-col">
                <h5>Legal</h5>
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
                <a href="#">SLA</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 Vestora. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
