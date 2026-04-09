import { classifyCommand, classifyToolCall } from './tiered-classifier'

describe('tiered-classifier', () => {
  describe('classifyCommand', () => {
    it('should classify safe commands as safe', () => {
      expect(classifyCommand('cat /etc/hosts').tier).toBe('safe')
      expect(classifyCommand('ls -la').tier).toBe('safe')
      expect(classifyCommand('git status').tier).toBe('safe')
      expect(classifyCommand('git log --oneline').tier).toBe('safe')
      expect(classifyCommand('grep -r "test" .').tier).toBe('safe')
      expect(classifyCommand('curl https://example.com').tier).toBe('safe')
      expect(classifyCommand('npm list').tier).toBe('safe')
      expect(classifyCommand('docker ps').tier).toBe('safe')
    })

    it('should classify destructive commands as destructive', () => {
      expect(classifyCommand('rm -rf /').tier).toBe('destructive')
      expect(classifyCommand('rm -rf ~').tier).toBe('destructive')
      expect(classifyCommand('sudo rm -rf /tmp/data').tier).toBe('destructive')
      expect(classifyCommand('DROP TABLE users').tier).toBe('destructive')
      expect(classifyCommand('gh repo delete my-repo').tier).toBe('destructive')
      expect(classifyCommand('terraform destroy').tier).toBe('destructive')
      expect(classifyCommand('diskutil eraseDisk JHFS+ MyDisk disk0').tier).toBe('destructive')
    })

    it('should classify dangerous commands as dangerous', () => {
      expect(classifyCommand('python script.py').tier).toBe('dangerous')
      expect(classifyCommand('node server.js').tier).toBe('dangerous')
      expect(classifyCommand('npm install express').tier).toBe('dangerous')
      expect(classifyCommand('git push origin main').tier).toBe('dangerous')
      expect(classifyCommand('docker run nginx').tier).toBe('dangerous')
      expect(classifyCommand('ssh user@host').tier).toBe('dangerous')
      expect(classifyCommand('railway deploy').tier).toBe('dangerous')
      expect(classifyCommand('vercel --prod').tier).toBe('dangerous')
    })

    it('should classify unknown commands as dangerous by default', () => {
      expect(classifyCommand('some-unknown-tool').tier).toBe('dangerous')
    })
  })

  describe('classifyToolCall', () => {
    it('should classify bash tool calls', () => {
      expect(classifyToolCall('bash', { command: 'ls -la' }).tier).toBe('safe')
      expect(classifyToolCall('bash', { command: 'rm -rf /' }).tier).toBe('destructive')
      expect(classifyToolCall('bash', { command: 'node server.js' }).tier).toBe('dangerous')
    })

    it('should classify write tool calls to sensitive paths as dangerous', () => {
      expect(classifyToolCall('write', { path: '.env' }).tier).toBe('dangerous')
      expect(classifyToolCall('write', { path: 'credentials.json' }).tier).toBe('dangerous')
      expect(classifyToolCall('write', { path: '~/.ssh/id_rsa' }).tier).toBe('dangerous')
      expect(classifyToolCall('write', { path: 'src/index.ts' }).tier).toBe('safe')
    })

    it('should classify read tool calls as safe', () => {
      expect(classifyToolCall('read', { path: '/etc/hosts' }).tier).toBe('safe')
      expect(classifyToolCall('read', { path: '.env' }).tier).toBe('safe')
    })

    it('should classify unknown tools as dangerous by default', () => {
      expect(classifyToolCall('unknown-tool', {}).tier).toBe('dangerous')
    })
  })
})
