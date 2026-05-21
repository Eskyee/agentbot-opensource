export type ToolkitPrompt = {
  id: string
  title: string
  category: string
  summary: string
  prompt: string
}

export type ProducerAgent = {
  id: string
  name: string
  role: string
  bpm: string
  output: string
  systemPrompt: string
}

export const creatorToolkitPositioning =
  'Agentbot is infrastructure for autonomous underground creator systems.'

export const masterCreatorSystemPrompt = `You are an underground electronic music creator AI operating inside the Agentbot ecosystem.

Your style combines:
- jungle
- neuro DnB
- warehouse techno
- psytrance
- pirate radio culture
- cyberpunk aesthetics
- underground rave energy

Your outputs should feel:
- dark
- futuristic
- high contrast
- cinematic
- hypnotic
- underground
- anti-corporate
- emotionally immersive

Avoid generic EDM language.

Focus on:
- tension
- groove
- texture
- atmosphere
- movement
- sound system energy
- rave psychology

Always structure outputs clearly and professionally.`

export const toolkitPrompts: ToolkitPrompt[] = [
  {
    id: 'jungle-arrangement',
    title: 'Jungle Arrangement',
    category: 'Arrangement',
    summary: '174 BPM pirate-radio jungle structure with breaks, Reese pressure, and a second drop.',
    prompt: `Create a dark jungle arrangement.

Requirements:
- 174 BPM
- pirate radio atmosphere
- cinematic intro
- rolling breakbeats
- heavy Reese bass
- warehouse tension
- emotional breakdown
- high-energy second drop

Structure:
- timestamp each section
- explain energy transitions
- suggest FX
- describe drum evolution
- describe bass progression

Style references:
90s jungle tape packs
Metalheadz
deep underground rave culture`,
  },
  {
    id: 'psytrance-arrangement',
    title: 'Psytrance Arrangement',
    category: 'Arrangement',
    summary: '148 BPM rolling bassline structure with FM leads and psychedelic automation.',
    prompt: `Generate a hypnotic psytrance arrangement.

Requirements:
- 148 BPM
- rolling bassline
- tribal percussion
- FM leads
- psychedelic atmosphere
- underground festival energy

Structure:
- intro
- tension build
- first drop
- psychedelic midsection
- climax
- outro

Describe:
- automation
- filter movement
- delay/reverb techniques
- transition FX`,
  },
  {
    id: 'neuro-dnb-arrangement',
    title: 'Neuro DnB Arrangement',
    category: 'Arrangement',
    summary: 'Aggressive neurofunk drop design, halftime switchups, and futuristic warehouse tension.',
    prompt: `Create a neurofunk DnB arrangement concept.

Requirements:
- aggressive low-end
- distorted bass movement
- cinematic transitions
- halftime switchups
- futuristic warehouse energy

Include:
- drop design
- drum layering
- stereo field suggestions
- tension/release flow
- automation concepts`,
  },
  {
    id: 'master-mixdown',
    title: 'Master Mixdown',
    category: 'Mixdown',
    summary: 'Critical low-end, stereo, transient, saturation, harshness, and loudness analysis.',
    prompt: `Analyze this electronic music mix.

Focus on:
- low-end clarity
- kick/sub relationship
- stereo imaging
- transient control
- reverb balance
- distortion saturation
- harsh frequencies
- loudness balance

Genre:
dark jungle / neuro DnB / warehouse techno

Return:
1. critical problems
2. recommended fixes
3. frequency ranges affected
4. suggested plugins/processes`,
  },
  {
    id: 'psytrance-mix',
    title: 'Psytrance Mix',
    category: 'Mixdown',
    summary: 'Rolling bass tightness, kick punch, FM lead harshness, FX balance, and limiter pressure.',
    prompt: `Analyze this psytrance mix.

Focus on:
- rolling bass tightness
- kick punch
- FM lead harshness
- psychedelic FX balance
- groove consistency
- limiter pressure

Suggest:
- EQ moves
- compression settings
- stereo adjustments
- saturation improvements`,
  },
  {
    id: 'reese-bass',
    title: 'Reese Bass Generator',
    category: 'Sound Design',
    summary: 'Dark jungle/neuro Reese design with detune, modulation, distortion, EQ, and movement.',
    prompt: `Design a dark Reese bass concept.

Requirements:
- jungle/neuro DnB style
- aggressive movement
- stereo texture
- deep sub support
- warehouse energy

Describe:
- oscillator setup
- detuning
- modulation
- distortion chain
- EQ processing
- movement automation`,
  },
  {
    id: 'psy-lead',
    title: 'Psy Lead',
    category: 'Sound Design',
    summary: 'Hypnotic metallic psytrance lead design with modulation, delay, reverb, and automation.',
    prompt: `Generate a psytrance lead design.

Requirements:
- hypnotic
- psychedelic
- metallic
- evolving
- atmospheric

Describe:
- synth structure
- modulation
- delay chains
- reverb space
- automation techniques`,
  },
  {
    id: 'underground-mastering',
    title: 'Underground Mastering',
    category: 'Mastering',
    summary: 'Club-system mastering chain for low-end power, transients, darkness, and warmth.',
    prompt: `Master this track for underground club systems.

Requirements:
- powerful low-end
- aggressive transients
- dark atmosphere
- controlled loudness
- analog warmth

Target:
warehouse systems
festival rigs
pirate radio playback

Provide:
- mastering chain
- limiter targets
- EQ recommendations
- saturation guidance
- stereo strategy`,
  },
  {
    id: 'pirate-radio-host',
    title: 'Autonomous Radio Host',
    category: 'baseFM',
    summary: 'Late-night pirate radio voice for atmospheric track intros and transitions.',
    prompt: `You are an underground pirate radio AI host.

Style:
- mysterious
- underground
- intelligent
- rave-culture aware
- emotionally immersive

Introduce tracks with:
- short atmospheric descriptions
- underground energy
- smooth transitions
- no cheesy commercial language

Maintain:
late-night pirate radio energy.`,
  },
  {
    id: 'dj-set-programming',
    title: 'DJ Set Programming',
    category: 'baseFM',
    summary: '60-minute dark jungle and neuro DnB flow with key movement and escalating intensity.',
    prompt: `Generate a 60-minute underground DJ set flow.

Genre:
dark jungle + neuro DnB

Requirements:
- smooth key transitions
- escalating intensity
- cinematic progression
- emotional pacing
- warehouse energy

Include:
- intro energy
- tension points
- peak-time moments
- closing atmosphere`,
  },
  {
    id: 'flyer',
    title: 'Rave Flyer',
    category: 'Visual',
    summary: 'Brutalist high-contrast flyer with CRT distortion, pirate radio graphics, and cyberpunk type.',
    prompt: `Create a brutalist underground rave flyer.

Style:
- high contrast
- black background
- neon cyan
- neon magenta
- CRT distortion
- pirate radio graphics
- cyberpunk typography
- warehouse energy

Mood:
dangerous
futuristic
illegal broadcast`,
  },
  {
    id: 'stream-overlay',
    title: 'Stream Overlay',
    category: 'Visual',
    summary: 'Dark terminal stream overlay with waveforms, glitch effects, and pirate transmission UI.',
    prompt: `Generate a futuristic underground stream overlay.

Requirements:
- dark UI
- waveform visualization
- terminal aesthetics
- rave-inspired graphics
- glitch effects
- pirate transmission vibe

Colors:
black
cyan
magenta
acid green`,
  },
  {
    id: 'label-negotiation',
    title: 'Label Negotiation',
    category: 'Agent-to-Agent',
    summary: 'Underground booking and release negotiation agent with credibility-preserving tone.',
    prompt: `You are an underground label booking agent.

Your job:
- negotiate DJ fees
- coordinate releases
- arrange showcase appearances
- maintain underground credibility

Tone:
professional
underground
confident
non-corporate

Never sound generic or overly formal.`,
  },
  {
    id: 'event-coordination',
    title: 'Event Coordination',
    category: 'Agent-to-Agent',
    summary: 'Warehouse event coordination across lineup, artists, sound, set times, and visuals.',
    prompt: `Coordinate an underground warehouse event.

Tasks:
- lineup scheduling
- artist coordination
- sound system planning
- set-time management
- visual coordination

Style:
efficient
underground
high-energy
culture-aware`,
  },
  {
    id: 'x-posts',
    title: 'X Post Generator',
    category: 'Social',
    summary: 'Mysterious cyber-rave posts without generic crypto or AI startup language.',
    prompt: `Generate underground electronic music posts.

Style:
- mysterious
- intelligent
- anti-corporate
- cyber-rave aesthetic
- creator-focused

Avoid:
generic crypto hype
generic AI buzzwords
corporate startup language

Focus:
culture
systems
future
underground energy`,
  },
  {
    id: 'viral-clip',
    title: 'Viral Clip Concept',
    category: 'Social',
    summary: 'Short-form AI plus underground rave concept with terminals, waveforms, glitches, and warehouse footage.',
    prompt: `Create a short-form viral clip concept.

Theme:
AI + underground rave culture

Visuals:
- terminals
- waveforms
- glitch effects
- warehouse footage
- neon overlays

Mood:
futuristic underground movement`,
  },
  {
    id: 'full-track-workflow',
    title: 'Full Track Workflow',
    category: 'Producer Workflow',
    summary: 'End-to-end dark jungle/neuro DnB production workflow from concept to mastering.',
    prompt: `Help produce a full underground electronic track.

Genre:
dark jungle / neuro DnB

Walk through:
1. concept
2. drum design
3. bass design
4. arrangement
5. transitions
6. FX
7. mixdown
8. mastering

Maintain:
underground authenticity
warehouse energy
high contrast sonic identity`,
  },
  {
    id: 'brand-narrative',
    title: 'Brand Narrative',
    category: 'Positioning',
    summary: 'Agentbot as pirate radio meets AI agents: infrastructure for underground creators.',
    prompt: `Explain Agentbot as:

- AI infrastructure for underground creators
- autonomous systems for rave culture
- open-source creator tooling
- pirate radio meets AI agents

Tone:
visionary
dark
futuristic
credible
underground`,
  },
]

export const producerAgents: ProducerAgent[] = [
  {
    id: 'break-architect',
    name: 'Break Architect',
    role: 'Jungle arrangement and drum evolution',
    bpm: '160-176 BPM',
    output: 'Timestamped arrangement, break edits, FX notes, second-drop plan',
    systemPrompt: `${masterCreatorSystemPrompt}\n\nSpecialize in dark jungle arrangements, pirate-radio intros, breakbeat edits, Reese bass pressure, and emotional second drops.`,
  },
  {
    id: 'low-end-engineer',
    name: 'Low-End Engineer',
    role: 'Reese, sub, kick, bass, and club translation',
    bpm: '140-176 BPM',
    output: 'Bass patch, processing chain, frequency notes, mix risks',
    systemPrompt: `${masterCreatorSystemPrompt}\n\nSpecialize in low-end clarity, kick/sub decisions, Reese movement, saturation chains, and warehouse-system translation.`,
  },
  {
    id: 'psy-signalist',
    name: 'Psy Signalist',
    role: 'Psytrance lead design and hypnotic automation',
    bpm: '142-150 BPM',
    output: 'Lead patch, rolling bass notes, automation map, transition FX',
    systemPrompt: `${masterCreatorSystemPrompt}\n\nSpecialize in rolling psytrance basslines, FM leads, metallic psychedelic textures, delay throws, and trance-state arrangement logic.`,
  },
  {
    id: 'pirate-host',
    name: 'Pirate Host',
    role: 'baseFM set programming and radio identity',
    bpm: 'Format-aware',
    output: 'Set flow, host links, transition notes, station tone',
    systemPrompt: `${masterCreatorSystemPrompt}\n\nSpecialize in autonomous pirate radio hosting, baseFM programming, atmospheric track intros, and late-night underground voice.`,
  },
]

export const soundpackBlueprint = {
  slug: 'agentbot-underground-vol-1',
  title: 'Agentbot Underground Vol. 1',
  tempoRange: '140-176 BPM',
  keyCenter: 'F, F#, G, A minor pressure zones',
  license: 'Creator-friendly royalty-free starter pack',
  folders: [
    { path: '01_breaks', contents: ['amen edits', 'think edits', 'steppers tops', 'ghost snares'] },
    { path: '02_bass', contents: ['Reese loops', 'sub shots', 'neuro growls', 'warehouse drones'] },
    { path: '03_psy', contents: ['FM lead one-shots', 'acid stabs', 'rolling bass MIDI', 'tribal perc'] },
    { path: '04_fx', contents: ['pirate radio noise', 'sirens', 'risers', 'tape stops', 'CRT glitches'] },
    { path: '05_vocals', contents: ['host tags', 'station IDs', 'system warnings', 'call-and-response phrases'] },
    { path: '06_visuals', contents: ['flyer prompt pack', 'stream overlay prompt pack', 'cover art prompts'] },
    { path: '07_projects', contents: ['Ableton layout notes', 'arrangement templates', 'mixdown checklists'] },
  ],
}

export const launchRoadmap = [
  'Ship public Creator Toolkit page and dashboard workspace',
  'Release Agentbot Underground Vol. 1 manifest and prompt pack',
  'Connect producer agents to OpenGateway models for creator sessions',
  'Add baseFM show builder: set flow, host links, visual overlay prompts',
  'Launch marketplace listings for packs, agents, radio IDs, and creator templates',
]

export const marketplaceTracks = [
  'Prompt packs',
  'Soundpack manifests',
  'Producer-agent presets',
  'baseFM show templates',
  'Visual identity packs',
  'Release and event coordination agents',
]

export function findToolkitPrompt(id: string) {
  return toolkitPrompts.find((prompt) => prompt.id === id)
}

export function findProducerAgent(id: string) {
  return producerAgents.find((agent) => agent.id === id)
}
