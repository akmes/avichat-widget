(function () {

  const AviChatWidget = {
    // Carrega as dependências externas se não estiverem presentes
    async loadDependencies() {
      const scripts = [
        { id: 'marked-js', url: 'https://cdn.jsdelivr.net/npm/marked/marked.min.js' },
        { id: 'highlight-js', url: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js' }
      ];

      const promises = scripts.map(src => {
        if (document.getElementById(src.id) || (src.id === 'marked-js' && typeof marked !== 'undefined')) return Promise.resolve();
        return new Promise((resolve) => {
          const s = document.createElement('script');
          s.id = src.id;
          s.src = src.url;
          s.onload = resolve;
          document.head.appendChild(s);
        });
      });

      // Adiciona o CSS do Highlight.js para os blocos de código
      if (!document.querySelector('link[href*="highlight.js"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css';
        document.head.appendChild(link);
      }

      return Promise.all(promises);
    },

    async init(config) {
      this.config = config || {};
      // Aguarda o carregamento das libs externas antes de montar o widget
      await this.loadDependencies();
      this.mount();
    },

    mount() {
      this.injectCSS();
      this.injectHTML();
      this.injectScripts();
    },

    injectCSS() {
      const style = document.createElement('style');
      style.innerHTML = 
      `

      
      :root {
  --primary-color: #2b60ab;
  --primary-hover: #1e4a8f;
  --primary-light: #e8f0ff;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --border-color: #e5e7eb;
  --bg-light: #f9fafb;
  --bg-white: #ffffff;
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 40px rgba(0, 0, 0, 0.15);
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

button {
  font-family: inherit;
  outline: none;
  cursor: pointer;
}

/* ========== BOTÃO FLUTUANTE ========== */
.chat-button {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  border: none;
  font-size: 28px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-lg);
  transition: var(--transition);
  z-index: 1000;
  position: relative;
}

.chat-button:hover {
  transform: scale(1.1);
  box-shadow: 0 12px 48px rgba(43, 96, 171, 0.4);
}

.chat-button:active {
  transform: scale(0.95);
}

.chat-icon {
  width: 28px;
  height: 28px;
}

.notification-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: #ef4444;
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: 600;
  display: none;
  min-width: 18px;
  text-align: center;
}

.notification-badge.show {
  display: block;
  animation: bounce 0.5s;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

/* ========== CONTAINER DO CHAT ========== */
.chat-container {
  position: fixed;
  bottom: 0 !important;
  right: 0 !important;
  top: auto !important;
  left: auto !important;
  width: 400px;
  height: 600px;
  background: var(--bg-white);
  display: none;
  flex-direction: column;
  border-radius: 16px 16px 0 0;
  box-shadow: var(--shadow-lg);
  z-index: 1001;
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.chat-container.active {
  display: flex;
}

/* ========== HEADER ========== */
.chat-header {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chat-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.chat-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.chat-header-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.chat-title {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.chat-status {
  font-size: 13px;
  opacity: 0.9;
  display: flex;
  align-items: center;
  gap: 6px;
}

.chat-status::before {
  content: '';
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  display: inline-block;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.chat-header-actions {
  display: flex;
  gap: 8px;
}

.header-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition);
}

.header-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
}

.header-btn:active {
  transform: translateY(0);
}

.header-btn svg {
  width: 18px;
  height: 18px;
}

/* ========== MENSAGENS ========== */
.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: var(--bg-light);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.message {
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.5;
  width: fit-content;
  word-wrap: break-word;
  animation: fadeIn 0.3s ease;
  position: relative;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.user {
  background: var(--primary-color);
  color: white;
  margin-left: auto;
  border-bottom-right-radius: 4px;
  box-shadow: var(--shadow-sm);
}

.message.bot {
  background: var(--bg-white);
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
}

.message-time {
  font-size: 11px;
  opacity: 0.6;
  margin-top: 6px;
  display: block;
}

/* Markdown styling */
.message.bot p { margin: 0; margin-bottom: 8px; }
.message.bot p:last-child { margin-bottom: 0; }
.message.bot strong { font-weight: 600; color: var(--text-primary); }
.message.bot em { font-style: italic; }
.message.bot code { background: var(--bg-light); padding: 2px 6px; border-radius: 4px; font-size: 13px; font-family: 'Monaco', 'Courier New', monospace; color: #d73a49; }
.message.bot pre { background: #1f2937; padding: 12px; border-radius: 8px; overflow-x: auto; margin: 8px 0; }
.message.bot pre code { background: transparent; color: #e5e7eb; padding: 0; font-size: 13px; line-height: 1.6; }
.message.bot ul, .message.bot ol { margin: 8px 0; padding-left: 20px; }
.message.bot li { margin: 4px 0; }
.message.bot a { color: var(--primary-color); text-decoration: underline; transition: var(--transition); }
.message.bot a:hover { color: var(--primary-hover); }

/* ========== INPUT ========== */
.chat-input {
  display: flex;
  padding: 16px;
  gap: 12px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-white);
  align-items: flex-end;
}

.chat-input textarea {
  flex: 1;
  padding: 12px 16px;
  outline: none;
  font-size: 14px;
  font-family: inherit;
  resize: none;
  max-height: 120px;
  transition: var(--transition);
  line-height: 1.5;
}

.send-icon {
  width: 20px;
  height: 20px;
}
.chat-input button {
  background: var(--primary-color);
  border: none;
  color: white;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition);
  flex-shrink: 0;
}

/* ========== TYPING INDICATOR ========== */
.typing { display: inline-flex; gap: 4px; padding: 4px 0; }
.typing span { width: 8px; height: 8px; background: var(--text-secondary); border-radius: 50%; animation: blink 1.4s infinite both; }
.typing span:nth-child(2) { animation-delay: 0.2s; }
.typing span:nth-child(3) { animation-delay: 0.4s; }

@keyframes blink {
  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1); }
}

@media (max-width: 480px) {
  .chat-container { width: 100%; height: 100vh; border-radius: 0; bottom: 0; right: 0; }
}
      `;
      document.head.appendChild(style);
    },

    injectHTML() {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = 
      `
      <style>
        #chat { position: fixed !important; bottom: 24px !important; right: 24px !important; }
        #chatButton { position: fixed !important; bottom: 24px !important; right: 24px !important; }
      </style>

      <button class="chat-button" id="chatButton" aria-label="Abrir chat">
        <svg class="chat-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span class="notification-badge" id="notificationBadge"></span>
      </button>

      <div class="chat-container" id="chat" role="dialog" aria-labelledby="chatTitle">
        <div class="chat-header">
          <div class="chat-header-left">
            <img src="img/chatbot-maria.jpg" alt="Avatar da Maria" class="chat-avatar">
            <div class="chat-header-info">
              <span class="chat-title" id="chatTitle">Maria — Em Treinamento</span>
              <span class="chat-status" id="chatStatus">Online</span>
            </div>
          </div>
          <div class="chat-header-actions">
            <button id="clearChat" class="header-btn" aria-label="Limpar conversa">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><polyline points="23 20 23 14 17 14"></polyline><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path></svg>
            </button>
            <button id="closeChat" class="header-btn" aria-label="Fechar chat">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>
        <div class="chat-messages" id="messages" role="log" aria-live="polite"></div>
        <div class="chat-input">
          <textarea id="input" placeholder="Digite sua mensagem..." rows="1" aria-label="Digite sua mensagem"></textarea>
          <button id="sendBtn" aria-label="Enviar mensagem">
            <svg class="send-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
      </div>
      `;
      document.body.appendChild(wrapper);
    },

    injectScripts() {
      // ========= CONFIGURAÇÕES =========
      const CONFIG = {
        DIFY_API_URL: this.config.apiUrl,
        DIFY_API_KEY: this.config.apiKey,
        USER_ID: 'web-' + Math.random().toString(36).slice(2),
        WELCOME_MESSAGE: `Oi, seja bem-vindo(a)! 😊  
      Eu sou a Maria Rosa, mas pode me chamar de Rô.
      Sou a assistente virtual do Governo de Rondônia e estou aqui pra te ajudar com os nossos serviços do Portal do Cidadão, de um jeito simples e sem complicação.
      Antes de continuar, é importante você saber como seus dados são protegidos. 
      Ao seguir no atendimento, você concorda com a nossa Política de Privacidade.
      Ah, só pra te avisar: estou em treinamento, aprendendo todos os dias pra te atender cada vez melhor 💚`,
        TYPING_DELAY: 500,
        AUTO_SCROLL_THRESHOLD: 100
      };

      const state = {
        conversationId: '',
        isTyping: false,
        messageHistory: []
      };

      const elements = {
        chat: document.getElementById('chat'),
        chatButton: document.getElementById('chatButton'),
        closeChat: document.getElementById('closeChat'),
        clearChat: document.getElementById('clearChat'),
        messages: document.getElementById('messages'),
        input: document.getElementById('input'),
        sendBtn: document.getElementById('sendBtn'),
        chatStatus: document.getElementById('chatStatus'),
        notificationBadge: document.getElementById('notificationBadge')
      };

      // Configuração do Marked (executa após garantir que a lib carregou)
      marked.setOptions({
        breaks: true,
        gfm: true,
        highlight: function(code, lang) {
          if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value;
          }
          return hljs.highlightAuto(code).value;
        }
      });

      function initializeEventListeners() {
        elements.chatButton.addEventListener('click', toggleChat);
        elements.closeChat.addEventListener('click', toggleChat);
        elements.clearChat.addEventListener('click', clearChat);
        elements.sendBtn.addEventListener('click', sendMessage);
        elements.input.addEventListener('input', autoResizeTextarea);
        elements.input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
          }
        });
      }

      function toggleChat() {
        const isActive = elements.chat.classList.toggle('active');
        elements.chatButton.style.display = isActive ? 'none' : 'flex';
        if (isActive) {
          elements.input.focus();
          scrollToBottom(true);
          clearNotificationBadge();
        }
      }

      function clearChat() {
        elements.messages.innerHTML = '';
        state.conversationId = '';
        state.messageHistory = [];
        addWelcomeMessage();
        saveToLocalStorage();
      }

      function addWelcomeMessage() {
        setTimeout(() => { addMessage(CONFIG.WELCOME_MESSAGE, 'bot', false); }, 300);
      }

      function addMessage(text, type, showTime = true) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        if (type === 'bot') {
          messageDiv.innerHTML = marked.parse(text);
          messageDiv.querySelectorAll('a').forEach(link => {
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
          });
          messageDiv.querySelectorAll('pre code').forEach(block => {
            hljs.highlightElement(block);
          });
        } else {
          messageDiv.textContent = text;
        }

        if (showTime) {
          const timeSpan = document.createElement('span');
          timeSpan.className = 'message-time';
          timeSpan.textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          messageDiv.appendChild(timeSpan);
        }

        elements.messages.appendChild(messageDiv);
        state.messageHistory.push({ text, type, time: new Date().toISOString() });
        scrollToBottom();
        
        if (!elements.chat.classList.contains('active') && type === 'bot') {
          showNotification();
        }
        saveToLocalStorage();
      }

      async function sendMessage() {
        const text = elements.input.value.trim();
        if (!text || state.isTyping) return;
        
        addMessage(text, 'user');
        elements.input.value = '';
        autoResizeTextarea();
        
        state.isTyping = true;
        elements.sendBtn.disabled = true;
        updateChatStatus('Digitando...');
        
        showTyping();
        
        try {
          const response = await fetch(CONFIG.DIFY_API_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${CONFIG.DIFY_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              inputs: {},
              query: text,
              response_mode: 'blocking',
              conversation_id: state.conversationId,
              user: CONFIG.USER_ID
            })
          });

          const data = await response.json();
          if (data.conversation_id) state.conversationId = data.conversation_id;
          const reply = data.answer || 'Desculpe, não consegui processar sua mensagem.';
          
          hideTyping();
          addMessage(reply, 'bot');
        } catch (error) {
          hideTyping();
          addMessage('😕 Erro ao conectar com o assistente.', 'bot');
        } finally {
          state.isTyping = false;
          elements.sendBtn.disabled = false;
          updateChatStatus('Online');
          elements.input.focus();
        }
      }

      function showTyping() {
        if (document.getElementById('typing-indicator')) return;
        const div = document.createElement('div');
        div.className = 'message bot';
        div.id = 'typing-indicator';
        div.innerHTML = `<div class="typing"><span></span><span></span><span></span></div>`;
        elements.messages.appendChild(div);
        scrollToBottom();
      }

      function hideTyping() {
        const el = document.getElementById('typing-indicator');
        if (el) el.remove();
      }

      function autoResizeTextarea() {
        elements.input.style.height = 'auto';
        elements.input.style.height = Math.min(elements.input.scrollHeight, 120) + 'px';
      }

      function scrollToBottom(force = false) {
        const container = elements.messages;
        if (force || (container.scrollHeight - container.scrollTop - container.clientHeight < CONFIG.AUTO_SCROLL_THRESHOLD)) {
          container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        }
      }

      function updateChatStatus(status) { elements.chatStatus.textContent = status; }

      function showNotification() {
        const count = parseInt(elements.notificationBadge.textContent) || 0;
        elements.notificationBadge.textContent = (count + 1).toString();
        elements.notificationBadge.classList.add('show');
      }

      function clearNotificationBadge() {
        elements.notificationBadge.textContent = '';
        elements.notificationBadge.classList.remove('show');
      }

      function saveToLocalStorage() {
        localStorage.setItem('chat_history', JSON.stringify(state.messageHistory));
        localStorage.setItem('conversation_id', state.conversationId);
      }

      function loadFromLocalStorage() {
        const history = localStorage.getItem('chat_history');
        const convId = localStorage.getItem('conversation_id');
        if (history) {
          state.messageHistory = JSON.parse(history);
          state.messageHistory.forEach(msg => {
            const div = document.createElement('div');
            div.className = `message ${msg.type}`;
            div.innerHTML = msg.type === 'bot' ? marked.parse(msg.text) : msg.text;
            elements.messages.appendChild(div);
          });
          scrollToBottom(true);
        }
        if (convId) state.conversationId = convId;
      }

      // Inicialização da lógica
      initializeEventListeners();
      loadFromLocalStorage();
      if (state.messageHistory.length === 0) addWelcomeMessage();
      elements.input.focus();
      console.log('chat iniciado!');
    }
  };

  window.AviChatWidget = AviChatWidget;

})();