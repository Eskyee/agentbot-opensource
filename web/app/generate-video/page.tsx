'use client';

import { useState } from 'react';

type VideoType = 'demo' | 'marketing' | 'screenshot' | 'tutorial';

// Typed interfaces for video generation requests
interface DemoVideoRequest {
  type: 'demo';
  agentName: string;
  agentDescription: string;
}

interface MarketingVideoRequest {
  type: 'marketing';
  productName: string;
  features: string[];
}

interface ScreenshotVideoRequest {
  type: 'screenshot';
  imageUrl: string;
  description: string;
}

interface TutorialVideoRequest {
  type: 'tutorial';
  topic: string;
  steps: string[];
}

type VideoRequestBody = DemoVideoRequest | MarketingVideoRequest | ScreenshotVideoRequest | TutorialVideoRequest;

export default function VideoGenerator() {
  const [type, setType] = useState<VideoType>('demo');
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Demo fields
  const [agentName, setAgentName] = useState('');
  const [agentDescription, setAgentDescription] = useState('');
  
  // Marketing fields
  const [productName, setProductName] = useState('');
  const [features, setFeatures] = useState('');
  
  // Screenshot fields
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  
  // Tutorial fields
  const [topic, setTopic] = useState('');
  const [steps, setSteps] = useState('');

  const generateVideo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let body: VideoRequestBody;
      
      if (type === 'demo') {
        body = { type, agentName, agentDescription };
      } else if (type === 'marketing') {
        body = { type, productName, features: features.split(',').map(f => f.trim()) };
      } else if (type === 'screenshot') {
        body = { type, imageUrl, description };
      } else {
        body = { type, topic, steps: steps.split(',').map(s => s.trim()) };
      }
      
      const res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.details || data.error || 'Failed to generate video');
      }
      
      setVideoUrl(data.url);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30 font-mono px-6 py-32">
      <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tighter uppercase mb-6">AI Video Generator</h1>

      <div className="mb-4">
        <label className="block mb-2 text-[10px] uppercase tracking-widest text-zinc-500">Video Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as VideoType)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-600 font-mono"
        >
          <option value="demo">Agent Demo</option>
          <option value="marketing">Marketing Content</option>
          <option value="screenshot">Animate Screenshot</option>
          <option value="tutorial">Tutorial Video</option>
        </select>
      </div>

      {type === 'demo' && (
        <>
          <input
            placeholder="Agent Name"
            value={agentName}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono mb-2"
            onChange={(e) => setAgentName(e.target.value)}
          />
          <textarea
            placeholder="Agent Description"
            value={agentDescription}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono mb-2"
            onChange={(e) => setAgentDescription(e.target.value)}
          />
        </>
      )}

      {type === 'marketing' && (
        <>
          <input
            placeholder="Product Name"
            value={productName}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono mb-2"
            onChange={(e) => setProductName(e.target.value)}
          />
          <textarea
            placeholder="Features (comma separated)"
            value={features}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono mb-2"
            onChange={(e) => setFeatures(e.target.value)}
          />
        </>
      )}

      {type === 'screenshot' && (
        <>
          <input
            placeholder="Image URL"
            value={imageUrl}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono mb-2"
            onChange={(e) => setImageUrl(e.target.value)}
          />
          <input
            placeholder="Description"
            value={description}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono mb-2"
            onChange={(e) => setDescription(e.target.value)}
          />
        </>
      )}

      {type === 'tutorial' && (
        <>
          <input
            placeholder="Tutorial Topic"
            value={topic}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono mb-2"
            onChange={(e) => setTopic(e.target.value)}
          />
          <textarea
            placeholder="Steps (comma separated)"
            value={steps}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono mb-2"
            onChange={(e) => setSteps(e.target.value)}
          />
        </>
      )}

      {error && (
        <div className="border border-red-500/30 text-red-500 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={generateVideo}
        disabled={loading}
        className="w-full bg-white text-black p-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors disabled:bg-zinc-800 disabled:text-zinc-600"
      >
        {loading ? 'Generating...' : 'Generate Video'}
      </button>

      {videoUrl && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-2">Generated Video</h2>
          <video src={videoUrl} controls className="w-full rounded" />
          <a href={videoUrl} download className="text-zinc-400 hover:text-white mt-2 block text-xs">
            Download Video
          </a>
        </div>
      )}
    </div>
    </div>
  );
}
