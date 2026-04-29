import {
  BASEFM_DEFAULT_STREAM_IMAGE,
  BASEFM_DJ_SKILL_CODE,
  BASEFM_DJ_SKILL_NAME,
  buildBasefmFfmpegCommandTemplate,
} from '@/app/lib/basefmDjSkill'

describe('baseFM DJ skill helper', () => {
  test('builds an ffmpeg command template for the returned RTMP target', () => {
    const command = buildBasefmFfmpegCommandTemplate('rtmp://global-live.mux.com:5222/app/stream-key')

    expect(command).toContain(`ffmpeg -re -loop 1 -i "${BASEFM_DEFAULT_STREAM_IMAGE}"`)
    expect(command).toContain('-f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100')
    expect(command).toContain('"rtmp://global-live.mux.com:5222/app/stream-key"')
  })

  test('ships the DJ streaming skill payload with the expected identity', () => {
    expect(BASEFM_DJ_SKILL_NAME).toBe('DJ Streaming')
    expect(BASEFM_DJ_SKILL_CODE).toContain('createStream')
    expect(BASEFM_DJ_SKILL_CODE).toContain('getFfmpegCommand')
  })

  // Keeps CI path filters active for workflow-only follow-up changes.
})
