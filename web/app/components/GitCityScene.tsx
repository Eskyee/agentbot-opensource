'use client'

import { useState, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Box as ThreeBox, Grid } from '@react-three/drei'
import * as THREE from 'three'

// 3D Building Component
function CityBuilding({ position, height, color, date, commits, onClick, isSelected }: {
  position: [number, number, number]
  height: number
  color: string
  date: string
  commits: number
  onClick: () => void
  isSelected: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame(() => {
    if (meshRef.current) {
      const targetScale = hovered || isSelected ? 1.1 : 1
      meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, targetScale, 0.1)
    }
  })

  return (
    <group position={position}>
      <ThreeBox
        ref={meshRef}
        args={[1.2, height, 1.2]}
        position={[0, height / 2, 0]}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial 
          color={color}
          emissive={isSelected ? color : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : 0}
        />
      </ThreeBox>
      {(hovered || isSelected || height > 2) && (
        <Text
          position={[0, height + 0.8, 0]}
          fontSize={0.25}
          color="white"
          anchorX="center"
          anchorY="bottom"
        >
          {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Text>
      )}
      <Text
        position={[0, 0.1, 0.7]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        rotation={[-Math.PI / 2, 0, 0]}
      >
        {commits}
      </Text>
    </group>
  )
}

interface CityBlock {
  id: string
  position: [number, number, number]
  height: number
  color: string
  date: string
  commits: number
  commitData: Array<{ sha: string; message: string; author: string; date: string; url: string }>
}

interface GitCitySceneProps {
  cityBlocks: CityBlock[]
  selectedBlock: string | null
  onSelectBlock: (id: string | null) => void
}

export default function GitCityScene({ cityBlocks, selectedBlock, onSelectBlock }: GitCitySceneProps) {
  return (
    <>
      <div className="border border-zinc-800 bg-black relative" style={{ height: '500px' }}>
        <Canvas camera={{ position: [15, 15, 15], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
          <pointLight position={[0, 10, 0]} intensity={0.5} color="#3b82f6" />
          
          <Grid args={[50, 50]} position={[0, 0.01, 0]} />
          
          {cityBlocks.map((block) => (
            <CityBuilding
              key={block.id}
              position={block.position}
              height={block.height}
              color={block.color}
              date={block.date}
              commits={block.commits}
              onClick={() => onSelectBlock(block.id)}
              isSelected={selectedBlock === block.id}
            />
          ))}
          
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={5}
            maxDistance={50}
            maxPolarAngle={Math.PI / 2 - 0.1}
          />
        </Canvas>
      </div>

      {/* Selected Block Details */}
      {selectedBlock && (
        <div className="border border-red-800 bg-red-900/20 p-4">
          {(() => {
            const block = cityBlocks.find(b => b.id === selectedBlock)
            if (!block) return null
            return (
              <>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-bold">
                    {new Date(block.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h4>
                  <button 
                    onClick={() => onSelectBlock(null)}
                    className="text-zinc-500 hover:text-white"
                  >
                    ×
                  </button>
                </div>
                <p className="text-orange-500 text-sm mb-3">
                  {block.commits} commits
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {block.commitData.map((commit, idx) => (
                    <a
                      key={idx}
                      href={commit.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-black/50 p-2 block hover:bg-black/70"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-zinc-500">{commit.sha.substring(0, 7)}</span>
                        <span className="text-zinc-400">{commit.author}</span>
                      </div>
                      <p className="text-white truncate">{commit.message}</p>
                    </a>
                  ))}
                </div>
              </>
            )
          })()}
        </div>
      )}
    </>
  )
}
