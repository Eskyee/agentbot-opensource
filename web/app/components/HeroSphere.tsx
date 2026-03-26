'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function HeroSphere() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    // Scene
    const scene = new THREE.Scene()
    scene.background = null // transparent — lets the page bg show through

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 500)
    camera.position.z = 4

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // Mouse tracking
    const mouseNDC = new THREE.Vector2(9999, 9999)
    const mouseInfluenceRadius = 1.2
    const mouseRepelStrength = 0.35

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    }
    const handleMouseLeave = () => mouseNDC.set(9999, 9999)
    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseleave', handleMouseLeave)

    // Mouse press
    let mousePressed = false
    let scaleCurrent = 1.0
    const handleDown = () => { mousePressed = true }
    const handleUp = () => { mousePressed = false }
    window.addEventListener('mousedown', handleDown)
    window.addEventListener('mouseup', handleUp)

    // ── Particle Sphere ──
    const particleCount = 8000
    const radius = 1.4

    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    const originalPositions = new Float32Array(particleCount * 3)
    const baseColors = new Float32Array(particleCount * 3)
    const phases = new Float32Array(particleCount)
    const offsets = new Float32Array(particleCount)

    for (let i = 0; i < particleCount; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / particleCount)
      const theta = Math.PI * (1 + Math.sqrt(5)) * i

      const x = radius * Math.sin(phi) * Math.cos(theta)
      const y = radius * Math.sin(phi) * Math.sin(theta)
      const z = radius * Math.cos(phi)

      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z
      originalPositions[i * 3] = x
      originalPositions[i * 3 + 1] = y
      originalPositions[i * 3 + 2] = z

      // Brand palette: zinc base with subtle warm accent at top
      const t = (y / radius + 1) * 0.5
      // Bottom: cool zinc (#52525b) → Top: warm zinc with amber hint
      colors[i * 3] = 0.32 + t * 0.15       // R
      colors[i * 3 + 1] = 0.32 + t * 0.08   // G
      colors[i * 3 + 2] = 0.36 + t * 0.04   // B

      baseColors[i * 3] = colors[i * 3]
      baseColors[i * 3 + 1] = colors[i * 3 + 1]
      baseColors[i * 3 + 2] = colors[i * 3 + 2]

      sizes[i] = Math.random() * 1.5 + 0.5
      phases[i] = Math.random() * Math.PI * 2
      offsets[i] = Math.random() * 0.6 + 0.7
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const vertexShader = `
      attribute float size;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (60.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `
    const fragmentShader = `
      varying vec3 vColor;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float alpha = 1.0 - smoothstep(0.1, 0.5, d);
        alpha *= 0.45;
        float glow = exp(-d * 6.0) * 0.25;
        vec3 col = vColor + glow;
        gl_FragColor = vec4(col, alpha);
      }
    `
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const particles = new THREE.Points(geometry, material)
    scene.add(particles)

    // ── Star Field ──
    const starCount = 3000
    const starGeo = new THREE.BufferGeometry()
    const starPos = new Float32Array(starCount * 3)
    const starCol = new Float32Array(starCount * 3)
    const starSz = new Float32Array(starCount)

    for (let i = 0; i < starCount; i++) {
      const sr = 10 + Math.random() * 60
      const sT = Math.random() * Math.PI * 2
      const sP = Math.acos(2 * Math.random() - 1)
      starPos[i * 3] = sr * Math.sin(sP) * Math.cos(sT)
      starPos[i * 3 + 1] = sr * Math.sin(sP) * Math.sin(sT)
      starPos[i * 3 + 2] = sr * Math.cos(sP)

      // Zinc-toned stars
      const v = 0.25 + Math.random() * 0.35
      starCol[i * 3] = v
      starCol[i * 3 + 1] = v
      starCol[i * 3 + 2] = v + Math.random() * 0.05
      starSz[i] = Math.random() * 1.2 + 0.3
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    starGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3))
    starGeo.setAttribute('size', new THREE.BufferAttribute(starSz, 1))

    const starVS = `
      attribute float size;
      varying vec3 vColor;
      varying float vBright;
      uniform float uTime;
      void main() {
        vColor = color;
        float tw = sin(uTime * 0.6 + position.x * 12.9898 + position.y * 78.233) * 0.5 + 0.5;
        vBright = 0.5 + tw * 0.5;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * vBright * (50.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `
    const starFS = `
      varying vec3 vColor;
      varying float vBright;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float alpha = (1.0 - smoothstep(0.0, 0.5, d)) * 0.4 * vBright;
        gl_FragColor = vec4(vColor, alpha);
      }
    `
    const starMat = new THREE.ShaderMaterial({
      vertexShader: starVS,
      fragmentShader: starFS,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 } },
    })
    const starField = new THREE.Points(starGeo, starMat)
    scene.add(starField)

    // ── Aura ──
    const auraCanvas = document.createElement('canvas')
    auraCanvas.width = 256
    auraCanvas.height = 256
    const ctx = auraCanvas.getContext('2d')!
    const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
    grad.addColorStop(0, 'rgba(160, 160, 175, 0.10)')
    grad.addColorStop(0.3, 'rgba(120, 120, 140, 0.05)')
    grad.addColorStop(0.6, 'rgba(80, 80, 100, 0.02)')
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 256, 256)
    const auraTex = new THREE.CanvasTexture(auraCanvas)
    const auraMat = new THREE.SpriteMaterial({
      map: auraTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.5,
    })
    const auraSprite = new THREE.Sprite(auraMat)
    auraSprite.scale.set(5, 5, 1)
    scene.add(auraSprite)

    // ── Trail Particles ──
    const trailCount = 40
    const trailGeo = new THREE.BufferGeometry()
    const trailPos = new Float32Array(trailCount * 3)
    const trailCol = new Float32Array(trailCount * 3)
    const trailSz = new Float32Array(trailCount)
    const trailData: { r: number; speed: number; phase: number; tilt: number }[] = []

    for (let i = 0; i < trailCount; i++) {
      trailData.push({
        r: 1.6 + Math.random() * 0.5,
        speed: 0.12 + Math.random() * 0.2,
        phase: Math.random() * Math.PI * 2,
        tilt: (Math.random() - 0.5) * Math.PI * 0.5,
      })
      const t = i / trailCount
      trailCol[i * 3] = 0.45 - t * 0.1
      trailCol[i * 3 + 1] = 0.45 - t * 0.15
      trailCol[i * 3 + 2] = 0.5 - t * 0.1
      trailSz[i] = (1.0 - t * 0.6) * 1.8
    }
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3))
    trailGeo.setAttribute('color', new THREE.BufferAttribute(trailCol, 3))
    trailGeo.setAttribute('size', new THREE.BufferAttribute(trailSz, 1))

    const trailMat = new THREE.ShaderMaterial({
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (60.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float alpha = (1.0 - smoothstep(0.05, 0.5, d)) * 0.3;
          float glow = exp(-d * 6.0) * 0.15;
          gl_FragColor = vec4(vColor + glow, alpha);
        }
      `,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const trailParticles = new THREE.Points(trailGeo, trailMat)
    scene.add(trailParticles)

    // ── Raycaster for mouse repulsion ──
    const raycaster = new THREE.Raycaster()
    const planeNormal = new THREE.Vector3(0, 0, 1)

    // ── Animation ──
    const clock = new THREE.Clock()
    let animId: number

    function animate() {
      animId = requestAnimationFrame(animate)
      const elapsed = clock.getElapsedTime()

      const posArr = geometry.attributes.position.array as Float32Array
      const sizeArr = geometry.attributes.size.array as Float32Array
      const colArr = geometry.attributes.color.array as Float32Array

      // Breathing
      const breath = Math.sin(elapsed * 0.6) * 0.03

      for (let i = 0; i < particleCount; i++) {
        const ox = originalPositions[i * 3]
        const oy = originalPositions[i * 3 + 1]
        const oz = originalPositions[i * 3 + 2]

        const phi = Math.acos(oy / radius)
        const theta = Math.atan2(oz, ox)

        // Gentle waves
        const w1 = Math.sin(phi * 6 + elapsed * 1.0) * 0.1
        const w2 = Math.sin(theta * 4 + elapsed * 0.7) * 0.08
        const drift = Math.sin(elapsed * 0.4 + phases[i] * 3.0) * 0.015 * offsets[i]

        const disp = 1 + w1 + w2 + breath
        posArr[i * 3] = ox * disp + drift
        posArr[i * 3 + 1] = oy * disp + Math.cos(elapsed * 0.3 + phases[i]) * 0.01 * offsets[i]
        posArr[i * 3 + 2] = oz * disp + Math.sin(elapsed * 0.5 + phases[i] * 1.5) * 0.012 * offsets[i]

        sizeArr[i] = Math.random() * 0.3 + 0.5
      }

      // Slow color shift — subtle hue cycle
      const hueShift = elapsed * 0.06
      for (let i = 0; i < particleCount; i++) {
        const oy = originalPositions[i * 3 + 1]
        const t = (oy / radius + 1) * 0.5
        const shift = Math.sin(hueShift + t * 2.0) * 0.5 + 0.5
        colArr[i * 3] = baseColors[i * 3] + shift * 0.06
        colArr[i * 3 + 1] = baseColors[i * 3 + 1] + shift * 0.03
        colArr[i * 3 + 2] = baseColors[i * 3 + 2] + shift * 0.04
      }

      // Mouse repulsion
      if (mouseNDC.x !== 9999) {
        raycaster.setFromCamera(mouseNDC, camera)
        planeNormal.set(0, 0, 1).applyQuaternion(camera.quaternion)
        const plane = new THREE.Plane(planeNormal, 0)
        const hit = new THREE.Vector3()
        raycaster.ray.intersectPlane(plane, hit)

        if (hit) {
          const inv = new THREE.Matrix4().copy(particles.matrixWorld).invert()
          const local = hit.clone().applyMatrix4(inv)

          for (let i = 0; i < particleCount; i++) {
            const dx = posArr[i * 3] - local.x
            const dy = posArr[i * 3 + 1] - local.y
            const dz = posArr[i * 3 + 2] - local.z
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

            if (dist < mouseInfluenceRadius && dist > 0.001) {
              const falloff = 1.0 - dist / mouseInfluenceRadius
              const str = falloff * falloff * mouseRepelStrength
              posArr[i * 3] += (dx / dist) * str
              posArr[i * 3 + 1] += (dy / dist) * str
              posArr[i * 3 + 2] += (dz / dist) * str

              // Brighten near mouse
              const glow = falloff * 0.5
              colArr[i * 3] = Math.min(1, colArr[i * 3] + glow * 0.6)
              colArr[i * 3 + 1] = Math.min(1, colArr[i * 3 + 1] + glow * 0.55)
              colArr[i * 3 + 2] = Math.min(1, colArr[i * 3 + 2] + glow * 0.7)
            }
          }
        }
      }

      geometry.attributes.position.needsUpdate = true
      geometry.attributes.size.needsUpdate = true
      geometry.attributes.color.needsUpdate = true

      // Scale on press
      const sTarget = mousePressed ? 1.15 : 1.0
      scaleCurrent += (sTarget - scaleCurrent) * 0.08
      particles.scale.setScalar(scaleCurrent)

      // Slow rotation
      particles.rotation.y += 0.001

      // Stars
      starMat.uniforms.uTime.value = elapsed
      starField.rotation.y += 0.00006
      starField.rotation.x += 0.00002

      // Aura breathing
      auraMat.opacity = 0.35 + Math.sin(elapsed * 0.5) * 0.1
      auraSprite.scale.setScalar(4.5 + Math.sin(elapsed * 0.5) * 0.3)

      // Trails
      const perStream = trailCount / 4
      const tPosArr = trailGeo.attributes.position.array as Float32Array
      const tSzArr = trailGeo.attributes.size.array as Float32Array
      for (let s = 0; s < 4; s++) {
        for (let j = 0; j < perStream; j++) {
          const i = s * perStream + j
          const d = trailData[i]
          const t = elapsed * d.speed - j * 0.1
          const sr = d.r + Math.sin(elapsed * 0.1 + d.phase) * 0.1
          const angle = t + d.phase
          const cosT = Math.cos(d.tilt)
          const sinT = Math.sin(d.tilt)
          tPosArr[i * 3] = sr * Math.cos(angle)
          tPosArr[i * 3 + 1] = sr * Math.sin(angle) * cosT
          tPosArr[i * 3 + 2] = sr * Math.sin(angle) * sinT
          tSzArr[i] = (1.0 - j / perStream) * 1.8
        }
      }
      trailGeo.attributes.position.needsUpdate = true
      trailGeo.attributes.size.needsUpdate = true

      renderer.render(scene, camera)
    }
    animate()

    // Resize
    const onResize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    // Cleanup
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('mousedown', handleDown)
      window.removeEventListener('mouseup', handleUp)
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseleave', handleMouseLeave)
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-auto"
      style={{ zIndex: 0 }}
    />
  )
}
