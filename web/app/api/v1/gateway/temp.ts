/**
 * Gateway configuration and temporary storage for Agentbot API v1.
 * 
 * This file defines the gateway config and temporary storage path.
 * Plugins are registered here and routed by the main gateway handler.
 */

export const TEMP_DIR = '/tmp/agentbot-gateway';

export const GATEWAY_CONFIG = {
  // API version
  version: '1.0.0',
  
  // Gateway name
  name: 'agentbot-gateway',
  
  // Enable CORS
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    headers: ['Content-Type', 'Authorization', 'X-Plugin-Id', 'X-Payment-Method'],
  },
  
  // Plugin registry
  plugins: {
    // Agent orchestrator
    agent: {
      name: 'Agent',
      description: 'Agent orchestrator for multi-step tasks',
      version: '1.0.0',
      enabled: true,
      endpoint: '/api/agent',
      auth: true,
      streaming: true,
    },
    
    // Text generation
    'generate-text': {
      name: 'Text Generation',
      description: 'LLM text generation',
      version: '1.0.0',
      enabled: true,
      endpoint: '/api/chat',
      auth: true,
      streaming: true,
    },
    
    // Text-to-speech
    tts: {
      name: 'Text-to-Speech',
      description: 'Speech synthesis',
      version: '1.0.0',
      enabled: true,
      endpoint: '/api/tts',
      auth: true,
      streaming: false,
    },
    
    // Speech-to-text
    stt: {
      name: 'Speech-to-Text',
      description: 'Speech transcription',
      version: '1.0.0',
      enabled: true,
      endpoint: '/api/stt',
      auth: true,
      streaming: false,
    },
  },
  
  // Default plugin
  defaultPlugin: 'generate-text',
  
  // Rate limiting
  rateLimit: {
    windowMs: 60 * 1000,
    max: 100,
  },
};
