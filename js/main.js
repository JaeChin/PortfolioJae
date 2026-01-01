/**
 * Portfolio - Main JavaScript
 * Minimal, progressive enhancement only
 */

(function() {
    'use strict';

    // Mobile navigation toggle
    const navToggle = document.querySelector('.nav__toggle');
    const navList = document.querySelector('.nav__list');

    if (navToggle && navList) {
        navToggle.addEventListener('click', function() {
            const isOpen = navList.classList.toggle('is-open');
            navToggle.setAttribute('aria-expanded', isOpen);
        });

        // Close menu when clicking a link
        navList.addEventListener('click', function(e) {
            if (e.target.classList.contains('nav__link')) {
                navList.classList.remove('is-open');
                navToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Smooth scroll for anchor links (fallback for browsers without CSS scroll-behavior)
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
})();
