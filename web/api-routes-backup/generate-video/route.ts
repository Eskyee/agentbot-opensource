export const dynamic = "force-static"
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { generateDemoVideo, generateMarketingVideo, animateScreenshot, generateTutorialVideo } from '@/app/lib/video';
import { put } from '@vercel/blob';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  // Authentication check - video generation uses paid AI APIs
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { type, ...params } = await request.json();

    console.log('Video generation request:', { type, params });

    let videoBuffer: Uint8Array;

    switch (type) {
      case 'demo':
        console.log('Generating demo video...');
        videoBuffer = await generateDemoVideo(params.agentName, params.agentDescription);
        break;
      case 'marketing':
        console.log('Generating marketing video...');
        videoBuffer = await generateMarketingVideo(params.productName, params.features);
        break;
      case 'screenshot':
        console.log('Generating screenshot animation...');
        videoBuffer = await animateScreenshot(params.imageUrl, params.description);
        break;
      case 'tutorial':
        console.log('Generating tutorial video...');
        videoBuffer = await generateTutorialVideo(params.topic, params.steps);
        break;
      default:
        return NextResponse.json({ error: 'Invalid video type' }, { status: 400 });
    }

    console.log('Video generated, uploading to blob...');
    const blob = await put(`videos/${Date.now()}.mp4`, Buffer.from(videoBuffer), {
      access: 'public',
      contentType: 'video/mp4',
    });

    console.log('Video uploaded:', blob.url);
    return NextResponse.json({ url: blob.url });
  } catch (error: any) {
    console.error('Video generation error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to generate video'
    }, { status: 500 });
  }
}
