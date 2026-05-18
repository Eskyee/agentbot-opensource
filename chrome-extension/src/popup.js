// Agentbot Chrome Extension — Popup Logic

const API_URL = 'https://agentbot.sh/api';

async function sendChat() {
  const input = document.getElementById('chatInput');
  const messages = document.getElementById('messages');
  const text = input.value.trim();
  if (!text) return;

  // Add user message
  messages.innerHTML += `<div class="message user">${escapeHtml(text)}</div>`;
  input.value = '';
  messages.scrollTop = messages.scrollHeight;

  // Add thinking indicator
  const thinkingId = 'thinking-' + Date.now();
  messages.innerHTML += `<div class="message agent" id="${thinkingId}">Thinking...</div>`;
  messages.scrollTop = messages.scrollHeight;

  try {
    const res = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, context: { url: window.location?.href || 'extension' } }),
    });
    const data = await res.json();
    
    document.getElementById(thinkingId).innerHTML = escapeHtml(data.response || data.message || 'I got your message. Check the dashboard for full details.');
  } catch {
    document.getElementById(thinkingId).innerHTML = '⚠️ Could not connect. Make sure you\'re logged in at agentbot.sh';
  }
  
  messages.scrollTop = messages.scrollHeight;
}

async function extractPage() {
  addMessage('Extracting page content...');
  
  try {
    // Get content from active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.body.innerText.substring(0, 5000),
    });
    
    const content = results[0]?.result || 'No content';
    addMessage(`📄 Extracted from ${tab.url}:\n\n${content.substring(0, 500)}...`);
  } catch {
    addMessage('⚠️ Could not extract page content');
  }
}

async function summarizePage() {
  addMessage('Summarizing page...');
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => ({
        title: document.title,
        text: document.body.innerText.substring(0, 3000),
        links: Array.from(document.querySelectorAll('a')).slice(0, 10).map(a => a.href),
      }),
    });
    
    const page = results[0]?.result;
    addMessage(`📝 Summary of "${page?.title}":\n\n${page?.text?.substring(0, 300)}...\n\nLinks: ${page?.links?.length || 0} found`);
  } catch {
    addMessage('⚠️ Could not summarize page');
  }
}

function screenshotPage() {
  addMessage('📸 Taking screenshot... (requires dashboard)');
  window.open('https://agentbot.sh/dashboard/browser', '_blank');
}

function automateForm() {
  addMessage('⚡ Opening automation tools...');
  window.open('https://agentbot.sh/dashboard/browser', '_blank');
}

function searchWeb() {
  const input = document.getElementById('chatInput');
  const query = input.value.trim();
  if (query) {
    window.open(`https://agentbot.sh/dashboard/browser?url=https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
  } else {
    addMessage('🔍 Type a search query first');
  }
}

function openDashboard() {
  window.open('https://agentbot.sh/dashboard', '_blank');
}

function addMessage(text) {
  const messages = document.getElementById('messages');
  messages.innerHTML += `<div class="message agent">${escapeHtml(text)}</div>`;
  messages.scrollTop = messages.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
