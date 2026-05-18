import {
  BASEFM_DJ_SKILL_CODE,
  BASEFM_DJ_SKILL_NAME,
  buildBasefmAudioOnlyFfmpegCommandTemplate,
  buildBasefmFfmpegCommandTemplates,
  buildBasefmFfmpegCommandTemplate,
  buildBasefmPlaylistFfmpegCommandTemplate,
} from '@/app/lib/basefmDjSkill'

describe('baseFM DJ skill helper', () => {
  test('builds an ffmpeg command template for the returned RTMP target', () => {
    const command = buildBasefmFfmpegCommandTemplate('rtmp://global-live.mux.com:5222/app/stream-key')

    expect(command).toContain('ffmpeg -re -i "/path/to/set.mp3"')
    expect(command).toContain('-c:a aac -b:a 128k -ar 44100 -ac 2')
    expect(command).toContain('"rtmp://global-live.mux.com:5222/app/stream-key"')
  })

  test('builds audio-only and playlist command templates for agent encoders', () => {
    const rtmpUrl = 'rtmp://global-live.mux.com:5222/app/stream-key'

    expect(buildBasefmAudioOnlyFfmpegCommandTemplate(rtmpUrl, '/sets/live.mp3')).toBe(
      'ffmpeg -re -i "/sets/live.mp3" -c:a aac -b:a 128k -ar 44100 -ac 2 -f flv "rtmp://global-live.mux.com:5222/app/stream-key"'
    )
    expect(buildBasefmPlaylistFfmpegCommandTemplate(rtmpUrl, '/tmp/playlist.txt')).toBe(
      'ffmpeg -re -f concat -safe 0 -i "/tmp/playlist.txt" -c:a aac -b:a 128k -ar 44100 -ac 2 -f flv "rtmp://global-live.mux.com:5222/app/stream-key"'
    )
  })

  test('returns explicit ffmpeg command choices for stream creation responses', () => {
    const commands = buildBasefmFfmpegCommandTemplates('rtmp://global-live.mux.com:5222/app/stream-key')

    expect(commands.command).toBe(commands.audioOnlyCommand)
    expect(commands.audioOnlyCommand).toContain('/path/to/set.mp3')
    expect(commands.playlistCommand).toContain('/tmp/basefm-playlist.txt')
    expect(commands.inputHint).toContain('Default command is audio-only')
  })

  test('ships the DJ streaming skill payload with the expected identity', () => {
    expect(BASEFM_DJ_SKILL_NAME).toBe('DJ Streaming')
    expect(BASEFM_DJ_SKILL_CODE).toContain('createStream')
    expect(BASEFM_DJ_SKILL_CODE).toContain('getFfmpegCommand')
    expect(BASEFM_DJ_SKILL_CODE).toContain('getAudioOnlyFfmpegCommand')
  })

  // Keeps CI path filters active for workflow-only follow-up changes.
})
