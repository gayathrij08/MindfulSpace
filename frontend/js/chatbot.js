// ============================================================
// MindfulSpace Chatbot
// Website navigation + Gemini conversational assistant
// ============================================================

class MindfulSpaceChatbot {

    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.isSending = false;

        this.apiBaseUrl = window.ENV_CONFIG.backendApiUrl;

        this.init();
        this.setupEventListeners();
        this.addWelcomeMessage();
    }

    // ============================================================
    // INITIALIZE ELEMENTS
    // ============================================================

    init() {
        this.chatbotToggle = document.getElementById('chatbot-toggle');
        this.chatbotContainer = document.getElementById('chatbot-container');
        this.chatbotClose = document.getElementById('chatbot-close');
        this.chatbotInput = document.getElementById('chatbot-input');
        this.chatbotSend = document.getElementById('chatbot-send');
        this.chatbotVoiceBtn = document.getElementById('chatbot-voice-btn');
        this.chatbotMessages = document.getElementById('chatbot-messages');
        this.typingIndicator = document.getElementById('typing-indicator');
        this.notification = document.getElementById('chatbot-notification');
        this.voiceRecognition = null;
        this.isListening = false;
        this.voiceHintTimer = null;

        console.log(
            'MindfulSpace Chatbot initialized. API:',
            this.apiBaseUrl
        );
    }

    // ============================================================
    // EVENT LISTENERS
    // ============================================================

    setupEventListeners() {

        if (this.chatbotToggle) {
            this.chatbotToggle.addEventListener('click', () => {
                this.toggleChatbot();

                if (this.notification) {
                    this.notification.style.display = 'none';
                }
            });
        }

        if (this.chatbotClose) {
            this.chatbotClose.addEventListener('click', () => {
                this.closeChatbot();
            });
        }

        if (this.chatbotSend) {
            this.chatbotSend.addEventListener('click', () => {
                this.sendMessage();
            });
        }

        if (this.chatbotVoiceBtn) {
            this.setupVoiceInput();
        }

        if (this.chatbotInput) {
            this.chatbotInput.addEventListener('keydown', (event) => {

                if (
                    event.key === 'Enter' &&
                    !event.shiftKey
                ) {
                    event.preventDefault();
                    this.sendMessage();
                }

            });
        }
    }

    setupVoiceInput() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            this.chatbotVoiceBtn.disabled = true;
            this.chatbotVoiceBtn.title = "Voice input isn't supported in this browser. You can still type your message.";
            this.chatbotVoiceBtn.setAttribute('aria-label', "Voice input isn't supported in this browser. You can still type your message.");
            if (this.chatbotInput) {
                this.chatbotInput.placeholder = "Voice input isn't supported in this browser. You can still type your message.";
            }
            return;
        }

        this.voiceRecognition = new SpeechRecognition();
        this.voiceRecognition.continuous = false;
        this.voiceRecognition.interimResults = false;
        this.voiceRecognition.maxAlternatives = 1;
        this.voiceRecognition.lang = this.getRecognitionLanguage();

        this.chatbotVoiceBtn.addEventListener('click', () => {
            if (this.isListening) {
                this.voiceRecognition.stop();
                return;
            }

            this.voiceRecognition.lang = this.getRecognitionLanguage();

            try {
                this.voiceRecognition.start();
            } catch (error) {
                console.warn('Voice recognition was already started:', error);
                this.voiceRecognition.stop();
                this.voiceRecognition.start();
            }
        });

        this.voiceRecognition.onstart = () => {
            this.isListening = true;
            this.chatbotVoiceBtn.classList.add('listening');
            this.chatbotVoiceBtn.title = 'Stop listening';
            this.chatbotVoiceBtn.setAttribute('aria-label', 'Stop listening');
        };

        this.voiceRecognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0]?.transcript || '')
                .join(' ')
                .trim();

            if (!transcript || !this.chatbotInput) return;

            this.chatbotInput.value = transcript;
            this.chatbotInput.focus();
            this.chatbotInput.dispatchEvent(new Event('input', { bubbles: true }));
        };

        this.voiceRecognition.onend = () => {
            this.isListening = false;
            this.chatbotVoiceBtn.classList.remove('listening');
            this.chatbotVoiceBtn.title = 'Speak your message';
            this.chatbotVoiceBtn.setAttribute('aria-label', 'Speak your message');
        };

        this.voiceRecognition.onerror = (event) => {
            this.isListening = false;
            this.chatbotVoiceBtn.classList.remove('listening');
            this.chatbotVoiceBtn.title = 'Speak your message';
            this.chatbotVoiceBtn.setAttribute('aria-label', 'Speak your message');

            if (this.chatbotInput) {
                const originalPlaceholder = this.chatbotInput.getAttribute('data-original-placeholder') || 'Type your message...';
                this.chatbotInput.placeholder = "Voice input isn't supported in this browser. You can still type your message.";
                clearTimeout(this.voiceHintTimer);
                this.voiceHintTimer = setTimeout(() => {
                    this.chatbotInput.placeholder = originalPlaceholder;
                }, 2200);
            }

            if (event.error !== 'aborted') {
                console.warn('Speech recognition error:', event.error);
            }
        };

        window.addEventListener('mindfulspace-language-changed', () => {
            if (this.voiceRecognition) {
                this.voiceRecognition.lang = this.getRecognitionLanguage();
            }
        });
    }

    getRecognitionLanguage() {
        const language = localStorage.getItem('mindfulspace_language') || 'en';
        if (language === 'kn') return 'kn-IN';
        if (language === 'hi') return 'hi-IN';
        return 'en-IN';
    }

    // ============================================================
    // OPEN / CLOSE CHATBOT
    // ============================================================

    toggleChatbot() {

        this.isOpen = !this.isOpen;

        if (!this.chatbotContainer) return;

        if (this.isOpen) {
            this.chatbotContainer.classList.add('active');

            if (this.chatbotInput) {
                this.chatbotInput.focus();
            }

        } else {
            this.chatbotContainer.classList.remove('active');
        }
    }

    closeChatbot() {

        this.isOpen = false;

        if (this.chatbotContainer) {
            this.chatbotContainer.classList.remove('active');
        }
    }

    // ============================================================
    // WELCOME MESSAGE
    // ============================================================

    addWelcomeMessage() {

        setTimeout(() => {

            this.addBotMessage(
                "👋 Hi! I'm your MindfulSpace assistant. " +
                "I can help you navigate our website, find resources, " +
                "or answer questions about mental wellness. " +
                "How can I assist you today?",
                [
                    "Show me mood tracking",
                    "Mental health resources",
                    "How to get started",
                    "Contact support"
                ]
            );

            this.showNotification();

        }, 700);
    }

    // ============================================================
    // NOTIFICATION
    // ============================================================

    showNotification() {

        if (this.notification) {
            this.notification.style.display = 'flex';
        }
    }

    // ============================================================
    // SEND NORMAL USER MESSAGE
    // ============================================================

    sendMessage() {

        if (!this.chatbotInput) return;

        const message = this.chatbotInput.value.trim();

        if (!message) return;

        if (this.isSending) return;

        this.isSending = true;

        if (this.chatbotSend) {
            this.chatbotSend.disabled = true;
        }

        this.addUserMessage(message);

        this.chatbotInput.value = '';

        const navigationTarget = this.getNavigationTarget(message);
        if (navigationTarget) {
            this.isSending = false;
            if (this.chatbotSend) {
                this.chatbotSend.disabled = false;
            }
            window.location.href = navigationTarget;
            return;
        }

        this.showTypingIndicator();

        this.requestReply(message)

            .then((reply) => {

                this.addBotMessage(
                    reply ||
                    "I'm here with you. Tell me a little more about what you're feeling."
                );

            })

            .catch((error) => {

                console.error(
                    'MindfulSpace chat request failed:',
                    error
                );

                this.addBotMessage(
                    "I'm sorry, I'm having trouble connecting right now. " +
                    "But I'm still here with you. Please try again in a moment. 💙"
                );

            })

            .finally(() => {

                this.hideTypingIndicator();

                this.isSending = false;

                if (this.chatbotSend) {
                    this.chatbotSend.disabled = false;
                }

                if (this.chatbotInput) {
                    this.chatbotInput.focus();
                }

            });
    }

    // ============================================================
    // ADD USER MESSAGE
    // ============================================================

    addUserMessage(message) {

        const messageElement =
            document.createElement('div');

        messageElement.className = 'message user';

        const content =
            document.createElement('div');

        content.className = 'message-content';

        content.textContent = message;

        messageElement.appendChild(content);

        this.messages.push({
            role: 'user',
            content: message
        });

        if (this.chatbotMessages) {
            this.chatbotMessages.appendChild(messageElement);
        }

        this.scrollToBottom();
    }

    // ============================================================
    // ADD BOT MESSAGE
    // ============================================================

    addBotMessage(message, quickActions = []) {

        const messageElement =
            document.createElement('div');

        messageElement.className = 'message bot';

        // Avatar
        const avatar =
            document.createElement('img');

        avatar.src = 'images/chatbot.gif';
        avatar.alt = 'Assistant';
        avatar.className = 'message-avatar';

        // Message content
        const content =
            document.createElement('div');

        content.className = 'message-content';

        content.textContent = message;

        // Quick action buttons
        if (quickActions.length > 0) {

            const actions =
                document.createElement('div');

            actions.className = 'quick-actions';

            quickActions.forEach((action) => {

                const button =
                    document.createElement('button');

                button.className = 'quick-action';
                button.type = 'button';
                button.textContent = action;

                // IMPORTANT:
                // Prevent the button from behaving like
                // a form submit button.
                button.addEventListener('click', (event) => {

                    event.preventDefault();
                    event.stopPropagation();

                    this.handleQuickAction(action);

                });

                actions.appendChild(button);
            });

            content.appendChild(actions);
        }

        messageElement.appendChild(avatar);
        messageElement.appendChild(content);

        this.messages.push({
            role: 'assistant',
            content: message
        });

        if (this.chatbotMessages) {
            this.chatbotMessages.appendChild(messageElement);
        }

        this.scrollToBottom();
    }

    // ============================================================
    // QUICK ACTIONS
    // ============================================================

    handleQuickAction(action) {

        console.log(
            '🔥 QUICK ACTION CLICKED:',
            action
        );

        // --------------------------------------------------------
        // MOOD TRACKER
        // --------------------------------------------------------

        if (
            action === 'Show me mood tracking' ||
            action === 'Take me to mood tracker' ||
            action === 'Mood tracking'
        ) {

            console.log(
                '➡️ Navigating to mood.html'
            );

            window.location.href = './mood.html';

            return;
        }

        // --------------------------------------------------------
        // RESOURCES
        // --------------------------------------------------------

        if (
            action === 'Mental health resources' ||
            action === 'View all resources' ||
            action === 'Show videos' ||
            action === 'Calming audio' ||
            action === 'Self-help guides' ||
            action === 'Resources'
        ) {

            console.log(
                '➡️ Navigating to resources.html'
            );

            window.location.href = './resources.html';

            return;
        }

        // --------------------------------------------------------
        // CONTACT SUPPORT
        // --------------------------------------------------------

        if (
            action === 'Contact support' ||
            action === 'Contact us'
        ) {

            console.log(
                '➡️ Navigating to contact section'
            );

            window.location.href =
                './index.html#contact';

            return;
        }

        // --------------------------------------------------------
        // GETTING STARTED
        // --------------------------------------------------------

        if (action === 'How to get started') {

            console.log(
                '🌱 Showing getting started response'
            );

            this.addUserMessage(action);

            this.addBotMessage(
                "🌱 Of course! Let's take it one step at a time. " +
                "You can start by checking in with your mood, " +
                "exploring our wellness resources, or simply " +
                "chatting with me about how you're feeling. " +
                "There's no pressure — I'm here whenever you need me. 💙",
                [
                    'Show me mood tracking',
                    'Mental health resources',
                    'Contact support'
                ]
            );

            return;
        }

        // --------------------------------------------------------
        // OTHER QUICK ACTIONS
        // --------------------------------------------------------

        // If a future quick action isn't a navigation action,
        // send it to Gemini as a normal message.

        if (this.chatbotInput) {
            this.chatbotInput.value = action;
            this.sendMessage();
        }
    }

    getNavigationTarget(message) {
        const normalizedMessage = message.toLowerCase().replace(/[?.!]/g, '').trim();
        const navigationTargets = [
            { phrases: ['show me mood tracking', 'take me to mood tracker', 'open mood tracker', 'go to mood tracking'], target: './mood.html' },
            { phrases: ['mental health resources', 'show me resources', 'take me to resources', 'open resources', 'go to resources'], target: './resources.html' },
            { phrases: ['open my dashboard', 'open dashboard', 'go to dashboard', 'take me to dashboard'], target: './dashboard.html' },
            { phrases: ['open my profile', 'open profile', 'go to profile', 'take me to profile'], target: './profile.html' },
            { phrases: ['book an appointment', 'book counseling', 'go to appointments', 'take me to appointments'], target: './appointment.html' },
            { phrases: ['contact support', 'contact us', 'go to contact'], target: './index.html#contact' }
        ];

        return navigationTargets.find(({ phrases }) => phrases.includes(normalizedMessage))?.target || null;
    }

    // ============================================================
    // GEMINI API REQUEST
    // ============================================================

    async requestReply(message) {

        const history =
            this.messages
                .slice(-10)
                .map((item) =>
                    `${item.role}: ${item.content}`
                )
                .join('\n');

        const token =
            localStorage.getItem('authToken');

        const headers = {
            'Content-Type': 'application/json'
        };

        if (token) {
            headers.Authorization =
                `Bearer ${token}`;
        }

        console.log(
            '🤖 Sending message to Gemini:',
            message
        );

        const response =
            await fetch(
                `${this.apiBaseUrl}/api/chat`,
                {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        message: message,
                        context: history,
                        language: window.MindfulSpaceI18n?.getLanguage?.() || 'en'
                    })
                }
            );

        const data =
            await response
                .json()
                .catch(() => ({}));

        console.log(
            '🤖 Gemini response:',
            data
        );

        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                `Chat request failed with status ${response.status}`
            );
        }

        return (
            data.reply ||
            data.response ||
            "I'm here with you. Tell me more."
        );
    }

    // ============================================================
    // TYPING INDICATOR
    // ============================================================

    showTypingIndicator() {

        if (this.typingIndicator) {

            this.typingIndicator.style.display =
                'flex';
        }

        this.scrollToBottom();
    }

    hideTypingIndicator() {

        if (this.typingIndicator) {

            this.typingIndicator.style.display =
                'none';
        }
    }

    // ============================================================
    // SCROLL
    // ============================================================

    scrollToBottom() {

        setTimeout(() => {

            if (this.chatbotMessages) {

                this.chatbotMessages.scrollTop =
                    this.chatbotMessages.scrollHeight;
            }

        }, 100);
    }

    // ============================================================
    // WEBSITE NAVIGATION
    // ============================================================

    navigateToPage(page) {

        const pageMap = {

            'Home':
                './index.html',

            'About':
                './index.html#about',

            'Services':
                './index.html#services',

            'Resources':
                './resources.html',

            'Statistics':
                './index.html#statistics',

            'Dashboard':
                './dashboard.html',

            'Mood Tracker':
                './mood.html',

            'Profile':
                './profile.html',

            'Contact':
                './index.html#contact'
        };

        const url = pageMap[page];

        if (!url) {
            console.warn(
                'Unknown navigation page:',
                page
            );
            return;
        }

        console.log(
            '🌐 Navigating to:',
            url
        );

        window.location.href = url;
    }
}


// ============================================================
// INITIALIZE CHATBOT
// ============================================================

document.addEventListener(
    'DOMContentLoaded',
    function () {

        if (
            document.getElementById(
                'chatbot-toggle'
            )
        ) {

            window.MindfulSpaceChatbot =
                new MindfulSpaceChatbot();
        }

    }
);


// ============================================================
// GLOBAL NAVIGATION FUNCTION
// ============================================================

window.handleChatbotNavigation =
    function (page) {

        if (
            window.MindfulSpaceChatbot
        ) {

            window.MindfulSpaceChatbot
                .navigateToPage(page);

        } else {

            console.warn(
                'MindfulSpace chatbot is not initialized.'
            );
        }
    };