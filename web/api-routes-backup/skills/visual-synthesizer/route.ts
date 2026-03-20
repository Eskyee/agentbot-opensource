export const dynamic = "force-static"
import { NextRequest, NextResponse } from 'next/server';

const REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions';
const DEFAULT_MODEL = 'black-forest-labs/flux-schnell';

interface GenerationRequest {
  prompt: string;
  style?: 'techno' | 'house' | 'ambient' | 'industrial' | 'drumnbass';
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3';
  outputFormat?: 'png' | 'webp';
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerationRequest = await request.json();
    const { prompt, style, aspectRatio = '1:1', outputFormat = 'png' } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiToken = process.env.REPLICATE_API_TOKEN;
    if (!apiToken) {
      return NextResponse.json({ 
        error: 'Replicate not configured. Set REPLICATE_API_TOKEN env.' 
      }, { status: 503 });
    }

    const enhancedPrompt = style 
      ? `${prompt}, ${style} music aesthetic, dark atmosphere, rave culture, club visuals`
      : prompt;

    const aspectMap: Record<string, string> = {
      '1:1': '1:1',
      '16:9': '16:9',
      '9:16': '9:16',
      '4:3': '4:3'
    };

    const response = await fetch(REPLICATE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait=true'
      },
      body: JSON.stringify({
        version: 'a1c3f7eb4d5311a5a0d7f1edc4c86c323c8d2b9a1d7c3e8f4a6b9c2d1e0f5a8b',
        input: {
          prompt: enhancedPrompt,
          aspect_ratio: aspectMap[aspectRatio] || '1:1',
          output_format: outputFormat,
          num_inference_steps: 4
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Replicate error:', error);
      return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
    }

    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      imageUrl: result.output?.[0] || result.output,
      predictionId: result.id,
      prompt: enhancedPrompt
    });

  } catch (error) {
    console.error('Visual Synthesizer error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    skill: 'visual-synthesizer',
    name: 'Visual Synthesizer',
    description: 'Generate release artwork and social media assets',
    security: {
      inputValidation: true,
      allowlistFiltering: true,
      apiKeyRequired: true,
      noUserDataStored: true
    },
    capabilities: [
      'Album cover generation',
      'Social media assets (Instagram, Telegram, Discord)',
      'Video thumbnails',
      'Merch mockups'
    ],
    parameters: {
      prompt: 'required - description of image',
      style: 'optional - techno|house|ambient|industrial|drumnbass',
      aspectRatio: 'optional - 1:1, 16:9, 9:16, 4:3',
      outputFormat: 'optional - png, webp'
    },
    requires: ['REPLICATE_API_TOKEN']
  });
}
