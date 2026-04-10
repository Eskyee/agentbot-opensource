// Agentbot Chrome Extension — Content Script
// Injects agent capabilities into web pages

(function() {
  // Only run on http/https pages
  if (!window.location.href.startsWith('http')) return;

  // Create floating action button
  const fab = document.createElement('div');
  fab.id = 'agentbot-fab';
  fab.innerHTML = '🤖';
  fab.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 48px;
    height: 48px;
    background: #0a0a0a;
    border: 1px solid #252d3d;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    cursor: pointer;
    z-index: 999999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    transition: transform 0.2s;
  `;
  
  fab.addEventListener('mouseenter', () => fab.style.transform = 'scale(1.1)');
  fab.addEventListener('mouseleave', () => fab.style.transform = 'scale(1)');
  
  fab.addEventListener('click', () => {
    // Toggle mini chat
    let chat = document.getElementById('agentbot-chat');
    if (chat) {
      chat.remove();
      return;
    }
    
    chat = document.createElement('div');
    chat.id = 'agentbot-chat';
    chat.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      width: 320px;
      height: 400px;
      background: #0a0a0a;
      border: 1px solid #252d3d;
      border-radius: 12px;
      z-index: 999998;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      display: flex;
      flex-direction: column;
      font-family: 'IBM Plex Mono', monospace, system-ui;
    `;
    
    chat.innerHTML = `
      <div style="padding:12px;border-bottom:1px solid #1a1f2e;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:12px;font-weight:bold;color:#c9d1d9;text-transform:uppercase;letter-spacing:0.1em;">🤖 Agentbot</span>
        <button onclick="this.closest('#agentbot-chat').remove()" style="background:none;border:none;color:#6b7688;cursor:pointer;font-size:16px;">×</button>
      </div>
      <div style="flex:1;padding:12px;overflow-y:auto;" id="agentbot-messages">
        <div style="background:#14181f;padding:8px 12px;border-radius:8px;margin-bottom:6px;font-size:12px;color:#c9d1d9;">
          I can see you're on: ${window.location.href}. Need help with this page?
        </div>
      </div>
      <div style="padding:12px;border-top:1px solid #1a1f2e;display:flex;gap:8px;">
        <input type="text" id="agentbot-input" placeholder="Ask me anything..." style="flex:1;background:#14181f;border:1px solid #252d3d;border-radius:8px;padding:8px 12px;color:#c9d1d9;font-family:inherit;font-size:12px;outline:none;">
        <button onclick="agentbotSend()" style="background:#2563eb;border:none;border-radius:8px;padding:8px 16px;color:white;font-family:inherit;font-size:12px;cursor:pointer;">Send</button>
      </div>
    `;
    
    document.body.appendChild(chat);
    
    document.getElementById('agentbot-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') agentbotSend();
    });
  });

  document.body.appendChild(fab);

  // Make agentbotSend available globally
  window.agentbotSend = function() {
    const input = document.getElementById('agentbot-input');
    const messages = document.getElementById('agentbot-messages');
    const text = input?.value?.trim();
    if (!text) return;

    messages.innerHTML += `<div style="background:#1a2332;padding:8px 12px;border-radius:8px;margin-bottom:6px;margin-left:20%;font-size:12px;color:#c9d1d9;">${text}</div>`;
    input.value = '';
    messages.scrollTop = messages.scrollHeight;

    // Simulate response
    setTimeout(() => {
      messages.innerHTML += `<div style="background:#14181f;padding:8px 12px;border-radius:8px;margin-bottom:6px;margin-right:20%;font-size:12px;color:#c9d1d9;">
        I see you're asking about "${text.substring(0, 50)}". Check the dashboard for full AI capabilities: <a href="https://agentbot.sh/dashboard" style="color:#2563eb;" target="_blank">agentbot.sh/dashboard</a>
      </div>`;
      messages.scrollTop = messages.scrollHeight;
    }, 1000);
  };
})();
