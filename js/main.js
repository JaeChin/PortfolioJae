/**
 * Portfolio - Main JavaScript
 * Dark Cyber Minimalist Theme
 */

(function() {
    'use strict';

    // ==========================================================================
    // Mobile Navigation
    // ==========================================================================

    const navToggle = document.querySelector('.nav__toggle');
    const navList = document.querySelector('.nav__list');

    if (navToggle && navList) {
        navToggle.addEventListener('click', function() {
            const isOpen = navList.classList.toggle('is-open');
            navToggle.setAttribute('aria-expanded', isOpen);

            // Prevent body scroll when menu is open
            document.body.style.overflow = isOpen ? 'hidden' : '';
        });

        // Close menu when clicking a link
        navList.addEventListener('click', function(e) {
            if (e.target.classList.contains('nav__link') || e.target.closest('.btn--nav')) {
                navList.classList.remove('is-open');
                navToggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            }
        });

        // Close menu on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && navList.classList.contains('is-open')) {
                navList.classList.remove('is-open');
                navToggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            }
        });
    }

    // ==========================================================================
    // Smooth Scroll
    // ==========================================================================

    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // ==========================================================================
    // Scroll-Triggered Animations
    // ==========================================================================

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion) {
        const animatedElements = document.querySelectorAll('.animate-on-scroll');

        if (animatedElements.length > 0 && 'IntersectionObserver' in window) {
            const observerOptions = {
                root: null,
                rootMargin: '0px 0px -50px 0px',
                threshold: 0.1
            };

            const observerCallback = (entries, observer) => {
                entries.forEach((entry, index) => {
                    if (entry.isIntersecting) {
                        // Add staggered delay based on element position
                        const delay = index * 50;
                        entry.target.style.transitionDelay = `${delay}ms`;
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            };

            const observer = new IntersectionObserver(observerCallback, observerOptions);

            // FIX: Elements already in the viewport on page load (e.g. hero)
            // won't reliably trigger the observer — show them immediately.
            animatedElements.forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    el.classList.add('is-visible');
                } else {
                    observer.observe(el);
                }
            });

        } else {
            // Fallback: show all elements immediately
            animatedElements.forEach(el => {
                el.classList.add('is-visible');
            });
        }
    } else {
        // Reduced motion: show all elements immediately without animation
        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            el.classList.add('is-visible', 'no-animation');
        });
    }

    // ==========================================================================
    // Animated Tabs (Projects)
    // ==========================================================================

    const tabsContainer = document.querySelector('.tabs');

    if (tabsContainer) {
        const tabBtns = tabsContainer.querySelectorAll('.tabs__btn');
        const tabPanels = tabsContainer.querySelectorAll('.tabs__panel');
        const indicator = tabsContainer.querySelector('.tabs__indicator');

        function positionIndicator(btn) {
            if (!indicator || !btn) return;
            indicator.style.width = btn.offsetWidth + 'px';
            indicator.style.transform = 'translateX(' + (btn.offsetLeft - 4) + 'px)';
        }

        function switchTab(targetId) {
            tabBtns.forEach(function(b) { b.classList.remove('is-active'); });
            tabPanels.forEach(function(p) { p.classList.remove('is-active'); });

            var activeBtn = tabsContainer.querySelector('.tabs__btn[data-tab="' + targetId + '"]');
            var activePanel = tabsContainer.querySelector('.tabs__panel[data-panel="' + targetId + '"]');

            if (activeBtn) activeBtn.classList.add('is-active');
            if (activePanel) activePanel.classList.add('is-active');
            positionIndicator(activeBtn);
        }

        tabBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                switchTab(btn.getAttribute('data-tab'));
            });
        });

        var firstActive = tabsContainer.querySelector('.tabs__btn.is-active');
        if (firstActive) {
            requestAnimationFrame(function() { positionIndicator(firstActive); });
        }

        window.addEventListener('resize', function() {
            var current = tabsContainer.querySelector('.tabs__btn.is-active');
            if (current) positionIndicator(current);
        });
    }

    // ==========================================================================
    // Image Accordion (Recognition)
    // ==========================================================================

    const accordionItems = document.querySelectorAll('.accordion__item');

    accordionItems.forEach(function(item) {
        item.addEventListener('mouseenter', function() {
            accordionItems.forEach(function(el) { el.classList.remove('is-active'); });
            item.classList.add('is-active');
        });

        item.addEventListener('click', function() {
            accordionItems.forEach(function(el) { el.classList.remove('is-active'); });
            item.classList.add('is-active');
        });
    });

    // ==========================================================================
    // Header Scroll Effect
    // ==========================================================================

    const header = document.querySelector('.site-header');
    let lastScrollY = window.scrollY;
    let ticking = false;

    function updateHeader() {
        const scrollY = window.scrollY;

        if (scrollY > 100) {
            header.classList.add('is-scrolled');
        } else {
            header.classList.remove('is-scrolled');
        }

        lastScrollY = scrollY;
    }

    // ==========================================================================
    // Scroll Spy — Active Nav Highlighting
    // ==========================================================================

    const navLinks = document.querySelectorAll('.nav__link');
    const sections = [];

    navLinks.forEach(function(link) {
        var href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
            var section = document.querySelector(href);
            if (section) sections.push({ el: section, link: link });
        }
    });

    function updateActiveNav() {
        var scrollPos = window.scrollY + 200;

        var current = null;
        for (var i = sections.length - 1; i >= 0; i--) {
            if (sections[i].el.offsetTop <= scrollPos) {
                current = sections[i];
                break;
            }
        }

        navLinks.forEach(function(l) { l.classList.remove('is-active'); });
        if (current) current.link.classList.add('is-active');
    }

    // ==========================================================================
    // Back to Top Button
    // ==========================================================================

    const backToTop = document.querySelector('.back-to-top');

    function updateBackToTop() {
        if (!backToTop) return;
        if (window.scrollY > 600) {
            backToTop.classList.add('is-visible');
        } else {
            backToTop.classList.remove('is-visible');
        }
    }

    if (backToTop) {
        backToTop.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ==========================================================================
    // Combined Scroll Handler
    // ==========================================================================

    function onScroll() {
        updateHeader();
        updateActiveNav();
        updateBackToTop();
        ticking = false;
    }

    window.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(onScroll);
            ticking = true;
        }
    }, { passive: true });

    updateActiveNav();

})();