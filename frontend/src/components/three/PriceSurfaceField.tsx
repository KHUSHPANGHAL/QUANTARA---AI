"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function TerrainMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const rows = 35;
  const cols = 55;

  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const pos = new Float32Array(rows * cols * 3);
    const ind: number[] = [];

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const idx = (i * cols + j) * 3;
        pos[idx] = (j - cols / 2) * 0.45;
        pos[idx + 1] = 0;
        pos[idx + 2] = (i - rows / 2) * 0.45;
      }
    }

    for (let i = 0; i < rows - 1; i++) {
      for (let j = 0; j < cols - 1; j++) {
        const a = i * cols + j;
        const b = (i + 1) * cols + j;
        const c = (i + 1) * cols + (j + 1);
        const d = i * cols + (j + 1);

        ind.push(a, b, d);
        ind.push(b, c, d);
      }
    }

    geom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geom.setIndex(ind);
    return geom;
  }, []);

  useFrame(({ clock }) => {
    if (!geometry) return;
    const posAttr = geometry.attributes.position as THREE.BufferAttribute;
    if (!posAttr) return;
    const t = clock.getElapsedTime() * 0.4;

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const idx = i * cols + j;
        const x = (j - cols / 2) * 0.45;
        const z = (i - rows / 2) * 0.45;
        const y =
          Math.sin(x * 0.6 + t) * 0.35 +
          Math.cos(z * 0.5 + t * 0.8) * 0.3 +
          Math.sin((x + z) * 0.4 + t * 0.5) * 0.2;
        posAttr.setY(idx, y);
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 4, 0, 0]} position={[0, -1.8, -4]}>
      <meshBasicMaterial
        wireframe
        color="#00f0ff"
        transparent
        opacity={0.12}
      />
    </mesh>
  );
}

function FloatingParticles() {
  const count = 180;
  const pointsRef = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
    }
    geom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return geom;
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = clock.getElapsedTime() * 0.015;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.035}
        color="#00f0ff"
        transparent
        opacity={0.35}
      />
    </points>
  );
}

export function PriceSurfaceField() {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!mounted || isMobile) {
    return (
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#00f0ff_1px,transparent_1px)] [background-size:24px_24px]" />
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      <Canvas
        camera={{ position: [0, 1.2, 5], fov: 50 }}
        gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
      >
        <TerrainMesh />
        <FloatingParticles />
      </Canvas>
    </div>
  );
}
