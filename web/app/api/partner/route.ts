import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getClientIP, isRateLimited } from '@/app/lib/security-middleware';

export async function POST(request: NextRequest) {
  const ip = getClientIP(request)
  if (await isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const { name, email, company, website, type, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    const isEnterprise = type === 'enterprise' || type === 'ai_provider';
    const fastTrack = isEnterprise && company;
    
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: 'Agentbot Partners <onboarding@resend.dev>',
      to: ['YOUR_ADMIN_EMAIL_2'],
      subject: `${fastTrack ? '🚀 FAST TRACK' : 'New'} Partner Inquiry: ${name}${company ? ` from ${company}` : ''} [${type}]`,
      html: `
        <h2>${fastTrack ? '🚀 FAST TRACK - Enterprise Partner' : 'New Partner Inquiry'}</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${company ? `<p><strong>Company:</strong> ${company}</p>` : ''}
        ${website ? `<p><strong>Website:</strong> <a href="${website}">${website}</a></p>` : ''}
        <p><strong>Partner Type:</strong> ${type} ${fastTrack ? '(FAST TRACK)' : ''}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr/>
        <p><em>${fastTrack ? 'This partner should be auto-approved within 24 hours' : 'Standard review process applies'}</em></p>
      `,
    });

    return NextResponse.json({ 
      success: true, 
      fastTrack: fastTrack || false,
      message: fastTrack ? 'Fast track enabled - we will respond within 24 hours' : 'We will be in touch soon'
    });
  } catch (error) {
    console.error('Partner form error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
