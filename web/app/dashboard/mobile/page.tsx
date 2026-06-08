'use client'

import { useState } from 'react'
import {
  Smartphone, Camera, MapPin, Mic, Wifi, Bluetooth,
  Shield, QrCode, CheckCircle, ArrowRight, Zap, Globe,
  MessageSquare, Image, Battery, Signal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'

const capabilities = [
  {
    icon: Camera,
    title: 'Camera Access',
    desc: 'Agent can take photos and scan documents on demand. Point your camera at anything — the agent sees it.',
    color: 'text-orange-400',
  },
  {
    icon: MapPin,
    title: 'Location',
    desc: 'Agent knows where you are. Get local recommendations, weather, directions, and location-triggered automations.',
    color: 'text-emerald-400',
  },
  {
    icon: Mic,
    title: 'Voice Input',
    desc: 'Speak naturally to your agent. MiMo ASR transcribes in real-time. No typing needed.',
    color: 'text-purple-400',
  },
  {
    icon: Image,
    title: 'Screen Recording',
    desc: 'Record your screen and share it with the agent for debugging, tutorials, or documentation.',
    color: 'text-blue-400',
  },
  {
    icon: MessageSquare,
    title: 'Canvas',
    desc: 'Rich interactive canvas for agent outputs — code previews, diagrams, forms, and visual workflows.',
    color: 'text-sky-400',
  },
  {
    icon: Shield,
    title: 'Secure Pairing',
    desc: 'QR code pairing with end-to-end encryption. Your agent only connects to devices you authorize.',
    color: 'text-amber-400',
  },
]

const platforms = [
  {
    name: 'iOS',
    icon: '🍎',
    status: 'Available',
    features: ['Camera', 'Location', 'Voice', 'Canvas', 'Siri Shortcuts', 'Background Refresh'],
    pairing: 'QR Code',
  },
  {
    name: 'Android',
    icon: '🤖',
    status: 'Available',
    features: ['Camera', 'Location', 'Voice', 'Canvas', 'Notifications', 'Widget'],
    pairing: 'QR Code',
  },
]

export default function MobilePage() {
  const [paired, setPaired] = useState(false)

  return (
    <DashboardShell>
      <DashboardHeader
        title="Mobile Companion"
        subtitle="Connect your phone — camera, location, voice, and Canvas for your agents"
        icon={<Smartphone className="h-5 w-5 text-orange-400" />}
      />

      <DashboardContent className="space-y-6">
        {/* Pairing status */}
        <div className="border border-zinc-800 bg-zinc-950 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-tight">Device Pairing</h2>
              <p className="text-xs text-zinc-500 mt-1">Connect your phone to unlock mobile capabilities</p>
            </div>
            <div className={cn(
              'flex items-center gap-2 px-3 py-1.5 border text-[10px] uppercase tracking-widest',
              paired ? 'border-emerald-500/30 text-emerald-400' : 'border-zinc-700 text-zinc-400'
            )}>
              {paired ? <CheckCircle className="h-3 w-3" /> : <QrCode className="h-3 w-3" />}
              {paired ? 'Connected' : 'Not Paired'}
            </div>
          </div>

          {!paired ? (
            <div className="flex flex-col sm:flex-row gap-6 items-center">
              {/* QR Code placeholder */}
              <div className="w-48 h-48 border border-zinc-800 bg-black flex items-center justify-center">
                <div className="text-center">
                  <QrCode className="h-12 w-12 text-zinc-700 mx-auto mb-2" />
                  <p className="text-[10px] text-zinc-600">QR Code</p>
                  <p className="text-[10px] text-zinc-600">Scan with OpenClaw app</p>
                </div>
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 flex items-center justify-center border border-zinc-800 text-orange-400 text-xs font-bold shrink-0">1</div>
                  <div>
                    <div className="text-xs font-bold text-white">Install OpenClaw App</div>
                    <div className="text-[10px] text-zinc-500">Download from App Store or Google Play</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 flex items-center justify-center border border-zinc-800 text-orange-400 text-xs font-bold shrink-0">2</div>
                  <div>
                    <div className="text-xs font-bold text-white">Scan QR Code</div>
                    <div className="text-[10px] text-zinc-500">Open the app and scan this code to pair</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 flex items-center justify-center border border-zinc-800 text-orange-400 text-xs font-bold shrink-0">3</div>
                  <div>
                    <div className="text-xs font-bold text-white">Grant Permissions</div>
                    <div className="text-[10px] text-zinc-500">Camera, location, microphone — you control what's shared</div>
                  </div>
                </div>
                <button
                  onClick={() => setPaired(true)}
                  className="text-[11px] bg-white text-black px-5 py-2 font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
                >
                  Generate Pairing Code
                </button>
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="border border-zinc-800 bg-black p-4">
                <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Device</div>
                <div className="text-sm font-bold text-white">iPhone 16 Pro</div>
              </div>
              <div className="border border-zinc-800 bg-black p-4">
                <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">App Version</div>
                <div className="text-sm font-bold text-white">OpenClaw v2026.5</div>
              </div>
              <div className="border border-zinc-800 bg-black p-4">
                <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Status</div>
                <div className="text-sm font-bold text-emerald-400">Online</div>
              </div>
            </div>
          )}
        </div>

        {/* Capabilities */}
        <div className="border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-tight mb-4">
            Mobile Capabilities
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-800">
            {capabilities.map((cap) => {
              const Icon = cap.icon
              return (
                <div key={cap.title} className="bg-zinc-950 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={cn('h-4 w-4', cap.color)} />
                    <span className="text-xs font-bold text-white uppercase tracking-tight">{cap.title}</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">{cap.desc}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Platform comparison */}
        <div className="border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-tight mb-4">
            Platform Support
          </h2>
          <div className="grid sm:grid-cols-2 gap-px bg-zinc-800">
            {platforms.map((platform) => (
              <div key={platform.name} className="bg-zinc-950 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{platform.icon}</span>
                  <div>
                    <div className="text-sm font-bold text-white">{platform.name}</div>
                    <div className="text-[10px] text-emerald-400 uppercase tracking-widest">{platform.status}</div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {platform.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-[10px] text-zinc-400">
                      <CheckCircle className="h-3 w-3 text-emerald-400" />
                      {f}
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-zinc-800">
                  <span className="text-[10px] text-zinc-600">Pairing: {platform.pairing}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Use cases */}
        <div className="border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-tight mb-4">
            Mobile Use Cases
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { title: 'Photo-to-Action', desc: 'Snap a photo of a whiteboard → agent converts to tasks', icon: Camera },
              { title: 'Voice Commands', desc: '"Hey agent, schedule a meeting for tomorrow at 2pm"', icon: Mic },
              { title: 'Location Triggers', desc: 'Agent reminds you to buy groceries when near the shop', icon: MapPin },
              { title: 'Screen Debug', desc: 'Record a bug → agent analyzes and suggests fixes', icon: Image },
            ].map((uc) => {
              const Icon = uc.icon
              return (
                <div key={uc.title} className="border border-zinc-800 bg-black p-4 flex items-start gap-3">
                  <Icon className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-white">{uc.title}</div>
                    <div className="text-[10px] text-zinc-500 mt-1">{uc.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </DashboardContent>
    </DashboardShell>
  )
}
