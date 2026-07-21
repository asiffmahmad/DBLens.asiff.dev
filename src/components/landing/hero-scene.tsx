"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Line, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const NUM_NODES = 15;

function DatabaseNodes() {
  const group = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  
  // Animation state proxy for GSAP
  const animState = useMemo(() => ({
    scatter: 0,
    colorR: 0.1,
    colorG: 0.5,
    colorB: 1.0,
    explode: 0,
    rotationSpeed: 1,
  }), []);

  // Generate initial node positions
  const nodes = useMemo(() => {
    const temp = [];
    for (let i = 0; i < NUM_NODES; i++) {
      temp.push({
        basePos: new THREE.Vector3(
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 10
        ),
        targetPos: new THREE.Vector3(
          (Math.random() - 0.5) * 40,
          (Math.random() - 0.5) * 40,
          (Math.random() - 0.5) * 40
        ),
        organizedPos: new THREE.Vector3(
          (i % 5) * 2 - 4,
          Math.floor(i / 5) * 2 - 2,
          0
        )
      });
    }
    return temp;
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "300vh top",
        scrub: 1,
      }
    });

    // Scene 2: The Problem (Nodes scatter and turn red)
    tl.to(animState, {
      scatter: 1,
      colorR: 1.0,
      colorG: 0.1,
      colorB: 0.1,
      explode: 1,
      rotationSpeed: 5,
      duration: 1,
      ease: "power2.inOut"
    }, 0.2); // Start animating around 20% scroll

    // Scene 3: The Solution (Nodes reorganize into a grid and turn brand color)
    tl.to(animState, {
      scatter: 2, // 2 means organized state
      colorR: 0.2,
      colorG: 0.8,
      colorB: 1.0,
      explode: 0,
      rotationSpeed: 0.5,
      duration: 1,
      ease: "power3.out"
    }, 0.6); // Start organizing at 60% scroll

    return () => { tl.kill(); };
  }, [animState]);

  useFrame((state, delta) => {
    if (!group.current || !materialRef.current) return;

    // Slowly rotate the entire group
    group.current.rotation.y += delta * 0.1 * animState.rotationSpeed;
    group.current.rotation.x += delta * 0.05 * animState.rotationSpeed;

    // Update positions and colors of children
    group.current.children.forEach((child, i) => {
      if (child.userData.isNode && child instanceof THREE.Mesh) {
        // Update color
        const mat = child.material as THREE.MeshPhysicalMaterial;
        mat.color.setRGB(animState.colorR, animState.colorG, animState.colorB);
        mat.emissive.setRGB(animState.colorR * 0.5, animState.colorG * 0.5, animState.colorB * 0.5);

        // Update position
        const node = nodes[i];
        let currentTarget = new THREE.Vector3();
        
        if (animState.scatter < 1) {
          currentTarget.lerpVectors(node.basePos, node.targetPos, animState.scatter);
        } else {
          currentTarget.lerpVectors(node.targetPos, node.organizedPos, animState.scatter - 1);
        }

        if (animState.explode > 0) {
          currentTarget.x += (Math.random() - 0.5) * 0.5 * animState.explode;
          currentTarget.y += (Math.random() - 0.5) * 0.5 * animState.explode;
          currentTarget.z += (Math.random() - 0.5) * 0.5 * animState.explode;
        }

        child.position.lerp(currentTarget, 0.1);
      }
    });
  });

  return (
    <group ref={group}>
      {nodes.map((node, i) => (
        <mesh key={`node-${i}`} position={node.basePos} userData={{ isNode: true }}>
          <cylinderGeometry args={[0.4, 0.4, 0.8, 16]} />
          {i === 0 ? (
            <meshPhysicalMaterial 
              ref={materialRef}
              color="#2288ff" 
              transparent 
              opacity={0.8}
              transmission={0.9} 
              thickness={1}
              roughness={0.2}
              emissive="#114488"
            />
          ) : (
            <meshPhysicalMaterial 
              color="#2288ff" 
              transparent 
              opacity={0.8}
              transmission={0.9} 
              thickness={1}
              roughness={0.2}
              emissive="#114488"
            />
          )}
        </mesh>
      ))}
    </group>
  );
}

function CameraRig() {
  const { camera } = useThree();
  
  useFrame(() => {
    // Parallax effect based on mouse (simple)
    // GSAP handles the main story, but mouse adds flavor
  });
  
  return null;
}

export function HeroScene3D() {
  return (
    <Canvas camera={{ position: [0, 0, 15], fov: 45 }}>
      <color attach="background" args={["#000000"]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1.5} />
      <spotLight position={[-10, -10, -10]} intensity={1} color="#4488ff" />
      
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <DatabaseNodes />
      </Float>
      
      <Environment preset="city" />
      
      <CameraRig />
    </Canvas>
  );
}
