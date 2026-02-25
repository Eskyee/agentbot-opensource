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
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">AI Video Generator</h1>

      <div className="mb-4">
        <label className="block mb-2 font-semibold">Video Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as VideoType)}
          className="w-full p-2 border rounded"
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
            className="w-full p-2 border rounded mb-2"
            onChange={(e) => setAgentName(e.target.value)}
          />
          <textarea
            placeholder="Agent Description"
            value={agentDescription}
            className="w-full p-2 border rounded mb-2"
            onChange={(e) => setAgentDescription(e.target.value)}
          />
        </>
      )}

      {type === 'marketing' && (
        <>
          <input
            placeholder="Product Name"
            value={productName}
            className="w-full p-2 border rounded mb-2"
            onChange={(e) => setProductName(e.target.value)}
          />
          <textarea
            placeholder="Features (comma separated)"
            value={features}
            className="w-full p-2 border rounded mb-2"
            onChange={(e) => setFeatures(e.target.value)}
          />
        </>
      )}

      {type === 'screenshot' && (
        <>
          <input
            placeholder="Image URL"
            value={imageUrl}
            className="w-full p-2 border rounded mb-2"
            onChange={(e) => setImageUrl(e.target.value)}
          />
          <input
            placeholder="Description"
            value={description}
            className="w-full p-2 border rounded mb-2"
            onChange={(e) => setDescription(e.target.value)}
          />
        </>
      )}

      {type === 'tutorial' && (
        <>
          <input
            placeholder="Tutorial Topic"
            value={topic}
            className="w-full p-2 border rounded mb-2"
            onChange={(e) => setTopic(e.target.value)}
          />
          <textarea
            placeholder="Steps (comma separated)"
            value={steps}
            className="w-full p-2 border rounded mb-2"
            onChange={(e) => setSteps(e.target.value)}
          />
        </>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <button
        onClick={generateVideo}
        disabled={loading}
        className="w-full bg-green-500 text-white p-3 rounded font-semibold disabled:bg-gray-400"
      >
        {loading ? 'Generating...' : 'Generate Video'}
      </button>

      {videoUrl && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-2">Generated Video</h2>
          <video src={videoUrl} controls className="w-full rounded" />
          <a href={videoUrl} download className="text-blue-500 underline mt-2 block">
            Download Video
          </a>
        </div>
      )}
    </div>
  );
}
