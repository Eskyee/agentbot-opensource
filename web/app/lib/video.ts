import { experimental_generateVideo } from 'ai';

// Validate API key is configured before making video generation calls
const validateApiKey = () => {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey || apiKey === 'your_ai_gateway_key') {
    throw new Error('AI_GATEWAY_API_KEY environment variable is required for video generation');
  }
  return apiKey;
};

export async function generateDemoVideo(agentName: string, agentDescription: string) {
  validateApiKey();
  const result = await experimental_generateVideo({
    model: 'google/veo-3.1-generate-001',
    prompt: `Professional demo video showcasing ${agentName}: ${agentDescription}. Modern tech aesthetic, smooth camera movements, clean UI elements.`,
    aspectRatio: '16:9',
    duration: 8,
  });
  
  if (!result.videos?.length) {
    throw new Error('Video generation failed - no videos returned');
  }
  return result.videos[0].uint8Array;
}

export async function generateMarketingVideo(productName: string, features: string[]) {
  const featureText = features.join(', ');
  const result = await experimental_generateVideo({
    model: 'google/veo-3.1-generate-001',
    prompt: `Engaging marketing video for ${productName} highlighting: ${featureText}. Dynamic visuals, professional lighting, modern design.`,
    aspectRatio: '16:9',
    duration: 8,
  });
  
  if (!result.videos?.length) {
    throw new Error('Video generation failed - no videos returned');
  }
  return result.videos[0].uint8Array;
}

export async function animateScreenshot(imageUrl: string, description: string) {
  const result = await experimental_generateVideo({
    model: 'alibaba/wan-v2.6-i2v',
    prompt: {
      image: imageUrl,
      text: `Smooth animation of ${description}. Subtle UI interactions, professional presentation.`,
    },
    duration: 5,
  });
  
  if (!result.videos?.length) {
    throw new Error('Video generation failed - no videos returned');
  }
  return result.videos[0].uint8Array;
}

export async function generateTutorialVideo(topic: string, steps: string[]) {
  const stepsText = steps.map((s, i) => `${i + 1}. ${s}`).join(', ');
  const result = await experimental_generateVideo({
    model: 'google/veo-3.1-generate-001',
    prompt: `Clear tutorial video about ${topic}. Steps: ${stepsText}. Educational, easy to follow, professional quality.`,
    aspectRatio: '16:9',
    duration: 8,
  });
  
  if (!result.videos?.length) {
    throw new Error('Video generation failed - no videos returned');
  }
  return result.videos[0].uint8Array;
}
