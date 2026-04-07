/* ============================================
   VESTORA — Main JavaScript
   ============================================ */

(function () {
    'use strict';

    // --- Scroll Reveal ---
    const revealElements = document.querySelectorAll('.reveal');

    const revealObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    revealElements.forEach((el) => revealObserver.observe(el));

    // --- Navbar Scroll Effect ---
    const nav = document.getElementById('nav');
    let lastScroll = 0;

    function handleNavScroll() {
        const scrollY = window.scrollY;
        if (scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
        lastScroll = scrollY;
    }

    window.addEventListener('scroll', handleNavScroll, { passive: true });
    handleNavScroll();

    // --- Mobile Menu ---
    const navToggle = document.getElementById('nav-toggle');
    const mobileMenu = document.getElementById('mobile-menu');

    if (navToggle && mobileMenu) {
        navToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
        });

        mobileMenu.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

    // --- Pricing Toggle ---
    const pricingToggle = document.getElementById('pricing-toggle');
    const toggleMonthly = document.getElementById('toggle-monthly');
    const toggleAnnual = document.getElementById('toggle-annual');
    const priceValues = document.querySelectorAll('.price-value');

    if (pricingToggle) {
        let isAnnual = false;

        pricingToggle.addEventListener('click', () => {
            isAnnual = !isAnnual;
            pricingToggle.classList.toggle('active', isAnnual);
            toggleMonthly.classList.toggle('active', !isAnnual);
            toggleAnnual.classList.toggle('active', isAnnual);

            priceValues.forEach((el) => {
                const monthly = el.getAttribute('data-monthly');
                const annual = el.getAttribute('data-annual');
                const target = isAnnual ? annual : monthly;

                el.style.opacity = '0';
                el.style.transform = 'translateY(-10px)';

                setTimeout(() => {
                    el.textContent = target;
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                }, 150);
            });
        });

        // Add transition styles to price values
        priceValues.forEach((el) => {
            el.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
        });
    }

    // --- Smooth Scroll for Anchor Links ---
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href === '#') return;

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const offset = 80;
                const top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });
})();
