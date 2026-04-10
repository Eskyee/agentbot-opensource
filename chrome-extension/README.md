# Agentbot Chrome Extension

Your AI agent in the browser. Chat, automate, extract, and summarize any page.

## Features

- 🤖 **Chat with your agent** from any page
- 📄 **Extract content** from the current page
- 📝 **Summarize** any page
- ⚡ **Automate** forms and workflows
- 🔍 **Search** via your agent
- 📸 **Screenshot** any page
- 🔔 **Notifications** from your agent

## Install (Development)

1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `chrome-extension/` directory
5. Click the Agentbot icon in your toolbar

## Install (Chrome Web Store)

Coming soon to the Chrome Web Store.

## Configuration

The extension connects to your Agentbot instance at `agentbot.sh`. 
Make sure you're logged in to use the chat and automation features.

## Architecture

- `manifest.json` — Chrome extension manifest (MV3)
- `src/popup.html/js` — Extension popup UI
- `src/content.js` — Injected into web pages (floating button + mini chat)
- `src/background.js` — Service worker for notifications
