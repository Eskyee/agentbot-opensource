'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const PARTICLE_COUNT = 20000

export default function MorphingHero() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 2.0
    container.appendChild(renderer.domElement)

    // Scene
    const scene = new THREE.Scene()
    scene.background = null // transparent

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100)
    camera.position.set(0, 0, 5)

    // Lights
    scene.add(new THREE.AmbientLight(0xd4eef0, 2.0))
    const keyLight = new THREE.PointLight(0x7eb8a8, 12, 50)
    keyLight.position.set(3, 3, 4)
    scene.add(keyLight)
    const fillLight = new THREE.PointLight(0x6a5acd, 7, 50)
    fillLight.position.set(-4, -2, 3)
    scene.add(fillLight)
    const rimLight = new THREE.PointLight(0x4d8a7a, 8, 50)
    rimLight.position.set(0, 4, -3)
    scene.add(rimLight)
    const frontLight = new THREE.PointLight(0xddeeff, 9, 40)
    frontLight.position.set(0, 0, 6)
    scene.add(frontLight)

    // ── Shape sampling ──
    function sampleGeometry(geometry: THREE.BufferGeometry, count: number) {
      const pos = new Float32Array(count * 3)
      const posAttr = geometry.attributes.position
      const indexAttr = geometry.index
      const triangles: [THREE.Vector3, THREE.Vector3, THREE.Vector3][] = []
      const areas: number[] = []
      let totalArea = 0
      const triCount = indexAttr ? indexAttr.count / 3 : posAttr.count / 3
      const vA = new THREE.Vector3(), vB = new THREE.Vector3(), vC = new THREE.Vector3()

      for (let i = 0; i < triCount; i++) {
        let a: number, b: number, c: number
        if (indexAttr) {
          a = indexAttr.getX(i * 3)
          b = indexAttr.getX(i * 3 + 1)
          c = indexAttr.getX(i * 3 + 2)
        } else {
          a = i * 3; b = i * 3 + 1; c = i * 3 + 2
        }
        vA.fromBufferAttribute(posAttr, a)
        vB.fromBufferAttribute(posAttr, b)
        vC.fromBufferAttribute(posAttr, c)
        const area = new THREE.Triangle(vA.clone(), vB.clone(), vC.clone()).getArea()
        areas.push(area)
        totalArea += area
        triangles.push([vA.clone(), vB.clone(), vC.clone()])
      }

      for (let i = 0; i < count; i++) {
        let r = Math.random() * totalArea
        let triIdx = 0
        for (let j = 0; j < areas.length; j++) {
          r -= areas[j]
          if (r <= 0) { triIdx = j; break }
        }
        const tri = triangles[triIdx]
        let u = Math.random(), v = Math.random()
        if (u + v > 1) { u = 1 - u; v = 1 - v }
        const w = 1 - u - v
        pos[i * 3] = tri[0].x * w + tri[1].x * u + tri[2].x * v
        pos[i * 3 + 1] = tri[0].y * w + tri[1].y * u + tri[2].y * v
        pos[i * 3 + 2] = tri[0].z * w + tri[1].z * u + tri[2].z * v
      }
      return pos
    }

    function prepGeo(geo: THREE.BufferGeometry) {
      const nonIdx = geo.toNonIndexed()
      const idxGeo = new THREE.BufferGeometry()
      idxGeo.setAttribute('position', nonIdx.attributes.position)
      const idxArr = []
      for (let i = 0; i < nonIdx.attributes.position.count; i++) idxArr.push(i)
      idxGeo.setIndex(idxArr)
      return sampleGeometry(idxGeo, PARTICLE_COUNT)
    }

    // Shapes
    const shapes: Float32Array[] = []

    // 0: Icosahedron
    shapes.push(prepGeo(new THREE.IcosahedronGeometry(1.3, 1)))

    // 1: Torus Knot
    shapes.push(prepGeo(new THREE.TorusKnotGeometry(0.8, 0.3, 128, 32, 2, 3)))

    // 2: Octahedron (stretched)
    const prismGeo = new THREE.OctahedronGeometry(1.1, 0)
    const pAttr = prismGeo.attributes.position
    for (let i = 0; i < pAttr.count; i++) pAttr.setY(i, pAttr.getY(i) * 1.6)
    pAttr.needsUpdate = true
    prismGeo.computeVertexNormals()
    shapes.push(prepGeo(prismGeo))

    // 3: Triple Spiral
    const spiralPos = new Float32Array(PARTICLE_COUNT * 3)
    const perSpiral = Math.floor(PARTICLE_COUNT / 3)
    for (let s = 0; s < 3; s++) {
      const angleOff = s * (Math.PI * 2 / 3)
      const count = s < 2 ? perSpiral : PARTICLE_COUNT - perSpiral * 2
      for (let i = 0; i < count; i++) {
        const idx = (s * perSpiral + i) * 3
        const t = (i / count) * Math.PI * 8 - Math.PI * 4
        const r = 0.15 + Math.abs(t) * 0.08
        spiralPos[idx] = r * Math.cos(t + angleOff) + (Math.random() - 0.5) * 0.03
        spiralPos[idx + 1] = t * 0.18 + (Math.random() - 0.5) * 0.03
        spiralPos[idx + 2] = r * Math.sin(t + angleOff) + (Math.random() - 0.5) * 0.03
      }
    }
    shapes.push(spiralPos)

    // ── Particle system ──
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const colors = new Float32Array(PARTICLE_COUNT * 3)
    const sizes = new Float32Array(PARTICLE_COUNT)
    const randoms = new Float32Array(PARTICLE_COUNT)

    positions.set(shapes[0])

    const c1 = new THREE.Color(0xa8dcd1)
    const c2 = new THREE.Color(0x7eb8a8)
    const c3 = new THREE.Color(0x9b8ec4)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ratio = i / PARTICLE_COUNT
      const color = ratio < 0.5
        ? c1.clone().lerp(c2, ratio * 2)
        : c2.clone().lerp(c3, (ratio - 0.5) * 2)
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
      sizes[i] = 0.012 + Math.random() * 0.02
      randoms[i] = Math.random()
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1))

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: renderer.getPixelRatio() },
        uMorph: { value: 0 },
        uMouse3D: { value: new THREE.Vector3(0, 0, 0) },
        uMouseActive: { value: 0 },
      },
      vertexShader: `
        attribute float aSize;
        attribute float aRandom;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uTime;
        uniform float uPixelRatio;
        uniform float uMorph;
        uniform vec3 uMouse3D;
        uniform float uMouseActive;

        void main() {
          vColor = color;
          vec3 pos = position;

          float breath = sin(uTime * 0.5 + aRandom * 6.28) * 0.02;
          pos += normalize(pos) * breath;

          float scatter = sin(uMorph * 3.14159) * 0.3;
          pos += normalize(pos + vec3(0.001)) * scatter * aRandom;

          vec3 toParticle = pos - uMouse3D;
          float xyDist = length(toParticle.xy);
          float fullDist = length(toParticle);
          float influence = 1.0 - smoothstep(0.0, 1.4, xyDist);
          influence = influence * influence * uMouseActive;

          if (influence > 0.001) {
            vec3 pushDir = fullDist > 0.001 ? normalize(toParticle) : vec3(0.0, 1.0, 0.0);
            pos += pushDir * influence * 0.3;

            float swirlSpeed = uTime * 2.0 + aRandom * 6.28;
            float swirlStrength = influence * 0.25;
            vec2 radial = pos.xy - uMouse3D.xy;
            float angle = swirlStrength * (1.0 + sin(swirlSpeed) * 0.3);
            float cosA = cos(angle);
            float sinA = sin(angle);
            vec2 rotated = vec2(
              radial.x * cosA - radial.y * sinA,
              radial.x * sinA + radial.y * cosA
            );
            pos.xy = uMouse3D.xy + rotated;
            pos.z += sin(swirlSpeed * 0.7 + aRandom * 3.14) * influence * 0.15;
          }

          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = aSize * uPixelRatio * 500.0 / -mvPos.z;
          gl_PointSize = max(gl_PointSize, 1.5);
          gl_Position = projectionMatrix * mvPos;
          vAlpha = 0.85 + 0.15 * (1.0 - smoothstep(0.0, 10.0, -mvPos.z));
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float alpha = smoothstep(0.5, 0.0, d) * vAlpha;
          vec3 brightColor = vColor * 2.0 + 0.12;
          gl_FragColor = vec4(brightColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    })

    const particles = new THREE.Points(geometry, material)
    scene.add(particles)

    // ── Morphing ──
    let currentShape = 0
    let targetShape = 0
    let isMorphing = false
    let morphStartTime = 0
    const morphDuration = 2.5
    const clock = new THREE.Clock()

    function easeInOutCubic(t: number) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    }

    function startMorph(idx: number) {
      if (isMorphing || idx === currentShape) return
      targetShape = idx
      isMorphing = true
      morphStartTime = clock.getElapsedTime()
    }

    // Auto-morph every 5 seconds
    setInterval(() => {
      startMorph((currentShape + 1) % shapes.length)
    }, 5000)

    // ── Mouse ──
    const raycaster = new THREE.Raycaster()
    const mouseNDC = new THREE.Vector2(9999, 9999)
    const mousePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
    let mouseOnScreen = false
    let mouseActiveSmooth = 0
    const _invMatrix = new THREE.Matrix4()
    const _localMouse = new THREE.Vector3()
    const _intersectPoint = new THREE.Vector3()

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      mouseOnScreen = true
    }
    const onMouseLeave = () => {
      mouseNDC.set(9999, 9999)
      mouseOnScreen = false
    }
    container.addEventListener('mousemove', onMouseMove)
    container.addEventListener('mouseleave', onMouseLeave)

    // ── Animate ──
    let animId: number

    function animate() {
      animId = requestAnimationFrame(animate)
      const elapsed = clock.getElapsedTime()
      material.uniforms.uTime.value = elapsed

      const mouseTarget = mouseOnScreen ? 1 : 0
      mouseActiveSmooth += (mouseTarget - mouseActiveSmooth) * 0.08
      material.uniforms.uMouseActive.value = mouseActiveSmooth

      raycaster.setFromCamera(mouseNDC, camera)
      raycaster.ray.intersectPlane(mousePlane, _intersectPoint)
      _invMatrix.copy(particles.matrixWorld).invert()
      _localMouse.copy(_intersectPoint).applyMatrix4(_invMatrix)
      material.uniforms.uMouse3D.value.copy(_localMouse)

      if (isMorphing) {
        const raw = Math.min((elapsed - morphStartTime) / morphDuration, 1)
        const progress = easeInOutCubic(raw)
        material.uniforms.uMorph.value = progress

        const src = shapes[currentShape]
        const tgt = shapes[targetShape]
        const posArr = geometry.attributes.position.array as Float32Array
        const len = PARTICLE_COUNT * 3
        for (let i = 0; i < len; i++) {
          posArr[i] = src[i] + (tgt[i] - src[i]) * progress
        }
        geometry.attributes.position.needsUpdate = true

        if (raw >= 1) {
          isMorphing = false
          currentShape = targetShape
          material.uniforms.uMorph.value = 0
        }
      }

      particles.rotation.y = elapsed * 0.06
      particles.rotation.x = Math.sin(elapsed * 0.15) * 0.02
      particles.position.y = Math.sin(elapsed * 0.35) * 0.06

      const sinT = Math.sin(elapsed * 0.25)
      const cosT = Math.cos(elapsed * 0.25)
      keyLight.position.x = sinT * 4.5
      keyLight.position.z = cosT * 4.5
      fillLight.position.y = -2 + Math.sin(elapsed * 0.18) * 1.5

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
      material.uniforms.uPixelRatio.value = renderer.getPixelRatio()
    }
    window.addEventListener('resize', onResize)

    // Cleanup
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      container.removeEventListener('mousemove', onMouseMove)
      container.removeEventListener('mouseleave', onMouseLeave)
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{ zIndex: 0 }}
    />
  )
}
