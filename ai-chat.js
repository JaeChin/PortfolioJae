/**
 * AI Chat Widget for Portfolio
 * 
 * Features:
 * - General Q&A chat about Jaedon
 * - Fit Check for job descriptions
 * - Suggested questions
 * - Mobile responsive
 * 
 * Configuration:
 * - Set API_ENDPOINT to your Cloudflare Worker URL
 */

(function() {
    'use strict';

    // ========================================
    // CONFIGURATION - UPDATE THIS
    // ========================================
    const API_ENDPOINT = 'https://your-worker.your-subdomain.workers.dev'; // Update this!
    
    // Suggested questions for the chat
    const SUGGESTIONS = [
        "What's Jaedon's experience?",
        "What certifications does he have?",
        "Tell me about his projects",
        "Is he available for hire?",
        "What are his skills?"
    ];

    // ========================================
    // STATE
    // ========================================
    let isOpen = false;
    let currentTab = 'chat'; // 'chat' or 'fitcheck'
    let isLoading = false;
    let messages = [
        {
            role: 'assistant',
            content: "Hi! I'm Jaedon's AI assistant. Ask me anything about his experience, skills, or projects. You can also use the Fit Check tab to see how well he matches a specific job."
        }
    ];

    // ========================================
    // DOM CREATION
    // ========================================
    function createChatWidget() {
        // Create toggle button
        const toggle = document.createElement('button');
        toggle.className = 'ai-chat-toggle';
        toggle.setAttribute('aria-label', 'Open AI chat');
        toggle.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Ask AI
        `;

        // Create chat container
        const chat = document.createElement('div');
        chat.className = 'ai-chat';
        chat.setAttribute('role', 'dialog');
        chat.setAttribute('aria-label', 'Chat with AI assistant');
        chat.innerHTML = `
            <header class="ai-chat__header">
                <div class="ai-chat__header-left">
                    <div class="ai-chat__avatar">AI</div>
                    <div>
                        <div class="ai-chat__title">Chat with Jaedon's AI</div>
                        <div class="ai-chat__subtitle">Ask anything about my background</div>
                    </div>
                </div>
                <button class="ai-chat__close" aria-label="Close chat">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </header>

            <div class="ai-chat__tabs">
                <button class="ai-chat__tab ai-chat__tab--active" data-tab="chat">Ask AI</button>
                <button class="ai-chat__tab" data-tab="fitcheck">Fit Check</button>
            </div>

            <div class="ai-chat__chat-view">
                <div class="ai-chat__messages" aria-live="polite"></div>
                <div class="ai-chat__suggestions"></div>
                <div class="ai-chat__input-wrapper">
                    <textarea 
                        class="ai-chat__input" 
                        placeholder="Ask about experience, skills, projects..."
                        rows="1"
                        aria-label="Type your message"
                    ></textarea>
                    <button class="ai-chat__send" aria-label="Send message">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
            </div>

            <div class="ai-chat__fit-check">
                <label class="ai-chat__fit-check-label">Paste a job description to check fit:</label>
                <textarea 
                    class="ai-chat__fit-check-textarea" 
                    placeholder="Paste the full job description here..."
                ></textarea>
                <button class="ai-chat__fit-check-btn">Analyze Fit</button>
                <div class="ai-chat__fit-result" style="display: none;"></div>
            </div>
        `;

        document.body.appendChild(toggle);
        document.body.appendChild(chat);

        return { toggle, chat };
    }

    // ========================================
    // RENDER FUNCTIONS
    // ========================================
    function renderMessages() {
        const container = document.querySelector('.ai-chat__messages');
        if (!container) return;

        container.innerHTML = messages.map(msg => `
            <div class="ai-chat__message ai-chat__message--${msg.role}">
                ${formatMessage(msg.content)}
            </div>
        `).join('');

        // Add typing indicator if loading
        if (isLoading) {
            container.innerHTML += `
                <div class="ai-chat__typing">
                    <span class="ai-chat__typing-dot"></span>
                    <span class="ai-chat__typing-dot"></span>
                    <span class="ai-chat__typing-dot"></span>
                </div>
            `;
        }

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    function renderSuggestions() {
        const container = document.querySelector('.ai-chat__suggestions');
        if (!container) return;

        // Only show suggestions if no user messages yet
        const hasUserMessages = messages.some(m => m.role === 'user');
        
        if (hasUserMessages) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = SUGGESTIONS.map(suggestion => `
            <button class="ai-chat__suggestion">${suggestion}</button>
        `).join('');
    }

    function formatMessage(content) {
        // Basic markdown-like formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n- /g, '\n• ')
            .replace(/\n/g, '<br>');
    }

    // ========================================
    // API CALLS
    // ========================================
    async function sendMessage(message) {
        if (isLoading || !message.trim()) return;

        // Add user message
        messages.push({ role: 'user', content: message });
        renderMessages();
        renderSuggestions();

        isLoading = true;
        renderMessages();

        try {
            const response = await fetch(`${API_ENDPOINT}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const data = await response.json();
            messages.push({ role: 'assistant', content: data.response });

        } catch (error) {
            console.error('Chat error:', error);
            messages.push({ 
                role: 'assistant', 
                content: "Sorry, I'm having trouble connecting right now. Please try again or reach out directly at jaechin9@gmail.com" 
            });
        }

        isLoading = false;
        renderMessages();
    }

    async function runFitCheck(jobDescription) {
        if (isLoading || !jobDescription.trim()) return;

        const btn = document.querySelector('.ai-chat__fit-check-btn');
        const result = document.querySelector('.ai-chat__fit-result');
        
        btn.disabled = true;
        btn.textContent = 'Analyzing...';
        result.style.display = 'none';
        isLoading = true;

        try {
            const response = await fetch(`${API_ENDPOINT}/fit-check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobDescription })
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const data = await response.json();
            result.textContent = data.response;
            result.style.display = 'block';

        } catch (error) {
            console.error('Fit check error:', error);
            result.textContent = "Sorry, I couldn't analyze this job description. Please try again or reach out directly at jaechin9@gmail.com";
            result.style.display = 'block';
        }

        btn.disabled = false;
        btn.textContent = 'Analyze Fit';
        isLoading = false;
    }

    // ========================================
    // EVENT HANDLERS
    // ========================================
    function setupEventListeners({ toggle, chat }) {
        // Toggle open/close
        toggle.addEventListener('click', () => {
            isOpen = true;
            chat.classList.add('ai-chat--open');
            toggle.classList.add('ai-chat-toggle--hidden');
            document.querySelector('.ai-chat__input')?.focus();
        });

        // Close button
        chat.querySelector('.ai-chat__close').addEventListener('click', () => {
            isOpen = false;
            chat.classList.remove('ai-chat--open');
            toggle.classList.remove('ai-chat-toggle--hidden');
        });

        // Tab switching
        chat.querySelectorAll('.ai-chat__tab').forEach(tab => {
            tab.addEventListener('click', () => {
                currentTab = tab.dataset.tab;
                
                // Update active tab
                chat.querySelectorAll('.ai-chat__tab').forEach(t => {
                    t.classList.toggle('ai-chat__tab--active', t.dataset.tab === currentTab);
                });

                // Show/hide views
                const chatView = chat.querySelector('.ai-chat__chat-view');
                const fitCheck = chat.querySelector('.ai-chat__fit-check');
                
                if (currentTab === 'chat') {
                    chatView.classList.remove('ai-chat__chat-view--hidden');
                    fitCheck.classList.remove('ai-chat__fit-check--active');
                } else {
                    chatView.classList.add('ai-chat__chat-view--hidden');
                    fitCheck.classList.add('ai-chat__fit-check--active');
                }
            });
        });

        // Send message
        const input = chat.querySelector('.ai-chat__input');
        const sendBtn = chat.querySelector('.ai-chat__send');

        sendBtn.addEventListener('click', () => {
            sendMessage(input.value);
            input.value = '';
            input.style.height = 'auto';
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input.value);
                input.value = '';
                input.style.height = 'auto';
            }
        });

        // Auto-resize textarea
        input.addEventListener('input', () => {
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 100) + 'px';
        });

        // Suggestion clicks
        chat.querySelector('.ai-chat__suggestions').addEventListener('click', (e) => {
            if (e.target.classList.contains('ai-chat__suggestion')) {
                sendMessage(e.target.textContent);
            }
        });

        // Fit check
        chat.querySelector('.ai-chat__fit-check-btn').addEventListener('click', () => {
            const textarea = chat.querySelector('.ai-chat__fit-check-textarea');
            runFitCheck(textarea.value);
        });

        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isOpen) {
                isOpen = false;
                chat.classList.remove('ai-chat--open');
                toggle.classList.remove('ai-chat-toggle--hidden');
            }
        });

        // Close on click outside
        document.addEventListener('click', (e) => {
            if (isOpen && !chat.contains(e.target) && !toggle.contains(e.target)) {
                isOpen = false;
                chat.classList.remove('ai-chat--open');
                toggle.classList.remove('ai-chat-toggle--hidden');
            }
        });
    }

    // ========================================
    // INITIALIZATION
    // ========================================
    function init() {
        // Wait for DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initWidget);
        } else {
            initWidget();
        }
    }

    function initWidget() {
        const elements = createChatWidget();
        setupEventListeners(elements);
        renderMessages();
        renderSuggestions();
        
        console.log('AI Chat widget initialized');
    }

    // Start
    init();
})();
