import { jsx as _jsx } from "react/jsx-runtime";
import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, useTexture } from '@react-three/drei';
import * as THREE from 'three';
export default function Avatar3D({ isTalking, emotion = 'neutral', userVolume = 0, talkingIntensity = 0, isListening = false, state = 'idle', modelPath = '/school_girl_sit_on_a_chair/scene.gltf' }) {
    const group = useRef(null);
    const { scene, animations, nodes } = useGLTF(modelPath);
    const { actions } = useAnimations(animations, group);
    // Manually load textures if the GLTF loader fails to apply them (e.g. legacy SPECULAR GLOSSINESS extension)
    // This is the CRITICAL FIX for the "gray avatar" issue.
    const textures = useTexture({
        diffuse: '/school_girl_sit_on_a_chair/textures/material_0_diffuse.jpeg',
    });
    if (textures.diffuse) {
        textures.diffuse.flipY = false;
        textures.diffuse.colorSpace = THREE.SRGBColorSpace;
    }
    // Set up lip-sync and blink state
    const [mouthOpen, setMouthOpen] = useState(0);
    const [blink, setBlink] = useState(false);
    const [smile, setSmile] = useState(0);
    const [frown, setFrown] = useState(0);
    const [browUp, setBrowUp] = useState(0);
    const [pupilSize, setPupilSize] = useState(1);
    // Play idle animation
    useEffect(() => {
        if (actions) {
            const idle = actions[Object.keys(actions)[0]];
            if (idle)
                idle.reset().fadeIn(0.5).play();
        }
    }, [actions]);
    // Emotion-driven blink timing
    useEffect(() => {
        let timeout;
        const getBlinkInterval = () => {
            if (emotion === 'anxious')
                return 800 + Math.random() * 1200; // fast, nervous
            if (emotion === 'sad')
                return 5000 + Math.random() * 4000; // slow, heavy
            if (emotion === 'angry')
                return 2000 + Math.random() * 1500; // tense
            return 3000 + Math.random() * 3000; // normal
        };
        const getBlinkDuration = () => {
            if (emotion === 'sad')
                return 250; // slow blink
            return 150;
        };
        const nextBlink = () => {
            setBlink(true);
            setTimeout(() => setBlink(false), getBlinkDuration());
            timeout = setTimeout(nextBlink, getBlinkInterval());
        };
        timeout = setTimeout(nextBlink, getBlinkInterval());
        return () => clearTimeout(timeout);
    }, [emotion]);
    // Micro-expression: subtle surprise/tension flicker every 5-8s
    const [microBrow, setMicroBrow] = useState(0);
    useEffect(() => {
        const trigger = () => {
            const intensity = emotion === 'anxious' ? 0.3 : 0.15;
            setMicroBrow(intensity);
            setTimeout(() => setMicroBrow(0), 600);
        };
        const interval = setInterval(trigger, 5000 + Math.random() * 3000);
        return () => clearInterval(interval);
    }, [emotion]);
    const headRef = useRef(null);
    const chestRef = useRef(null);
    // TEXTURE RESTORATION / MATERIAL UPDATE
    useEffect(() => {
        if (!scene)
            return;
        scene.traverse((node) => {
            // Find bones for tracking
            if (node.isBone) {
                const boneName = node.name.toLowerCase();
                if (boneName.includes('head'))
                    headRef.current = node;
                if (boneName.includes('spine2') || boneName.includes('chest'))
                    chestRef.current = node;
                if (boneName.includes('shoulder')) {
                    if (boneName.includes('left'))
                        node.userData.isLShoulder = true;
                    if (boneName.includes('right'))
                        node.userData.isRShoulder = true;
                }
                return;
            }
            if (node.isMesh && node.material) {
                const materials = Array.isArray(node.material) ? node.material : [node.material];
                materials.forEach((mat) => {
                    // Force apply the diffuse map if the GLTF loader failed to resolve it
                    if (!mat.map && textures.diffuse) {
                        mat.map = textures.diffuse;
                        mat.needsUpdate = true;
                    }
                    if (mat.map) {
                        mat.map.colorSpace = THREE.SRGBColorSpace;
                        mat.map.needsUpdate = true;
                    }
                    mat.metalness = 0;
                    mat.roughness = 0.65;
                    mat.envMapIntensity = 1.0;
                    mat.color.set(0xffffff);
                    const matName = mat.name.toLowerCase();
                    if (matName.includes('skin') || matName.includes('body') || matName.includes('face') || matName.includes('head')) {
                        // Subsurface scattering effect — warm pinkish emissive tint
                        mat.roughness = 0.50;
                        mat.emissive = new THREE.Color(0.04, 0.015, 0.01); // warm subsurface
                        mat.emissiveIntensity = 0.25;
                    }
                    else if (matName.includes('hair')) {
                        mat.roughness = 0.88;
                        mat.metalness = 0.02;
                    }
                    else if (matName.includes('eye')) {
                        // Eye moisture — glossy with slight blue tint
                        mat.roughness = 0.02;
                        mat.metalness = 0.12;
                        mat.emissive = new THREE.Color(0.0, 0.01, 0.03);
                        mat.emissiveIntensity = 0.15;
                    }
                    else if (matName.includes('lip') || matName.includes('mouth')) {
                        mat.roughness = 0.3;
                        mat.emissive = new THREE.Color(0.04, 0.005, 0.005);
                        mat.emissiveIntensity = 0.1;
                    }
                });
            }
        });
    }, [scene, textures.diffuse]); // CRITICAL: Run when textures load!
    const headTarget = new THREE.Vector3();
    const headQuaternion = new THREE.Quaternion();
    useFrame((frameState) => {
        if (!group.current)
            return;
        const t = frameState.clock.getElapsedTime();
        // 1. Natural Body Movement
        const speechIntensity = isTalking ? 1.5 : (state === 'thinking' ? 0.8 : 1.0);
        group.current.rotation.y = Math.sin(t * 0.4) * 0.02 * speechIntensity;
        group.current.rotation.x = Math.cos(t * 0.5) * 0.015 * speechIntensity;
        group.current.position.y = -0.5 + Math.sin(t * 1.2) * 0.012;
        if (state === 'thinking') {
            group.current.rotation.z = Math.sin(t * 2) * 0.01;
        }
        // 2. Eye/Head Tracking
        if (headRef.current) {
            const camPos = frameState.camera.position;
            headTarget.set(camPos.x, camPos.y + 0.05, camPos.z);
            const currentQuat = headRef.current.quaternion.clone();
            headRef.current.lookAt(headTarget);
            headQuaternion.copy(headRef.current.quaternion);
            headRef.current.quaternion.slerpQuaternions(currentQuat, headQuaternion, 0.07);
            // 3. State-Based Gestures
            if (state === 'listening') {
                headRef.current.rotation.x += Math.sin(t * 2.8) * 0.05; // Nod
            }
            else if (state === 'thinking') {
                headRef.current.rotation.z += Math.sin(t * 0.8) * 0.05; // Tilt
                headRef.current.rotation.y += Math.cos(t * 0.5) * 0.1; // Look away
            }
            else if (state === 'speaking') {
                headRef.current.rotation.y += Math.sin(t * 2.0) * 0.03; // Shake
                headRef.current.rotation.x += Math.cos(t * 1.5) * 0.02; // Accent
            }
        }
        // 4. Breathing — deeper when speaking
        if (chestRef.current) {
            const breatheRate = isTalking ? 1.8 : 1.2;
            const breatheDepth = isTalking ? 0.014 : (state === 'listening' ? 0.01 : 0.008);
            const breathe = Math.sin(t * breatheRate) * breatheDepth;
            chestRef.current.scale.y = 1 + breathe;
            chestRef.current.scale.x = 1 + breathe * 0.5;
        }
        // 5. Reactive Lip Sync
        let targetMouth = 0;
        if (isTalking) {
            if (talkingIntensity > 0) {
                targetMouth = talkingIntensity;
            }
            else {
                targetMouth = 0.12 + (Math.sin(t * 16) * 0.12) + (Math.random() * 0.08);
            }
        }
        else if (isListening) {
            targetMouth = Math.min(userVolume * 0.005, 0.4);
        }
        const lerpFactor = isTalking ? 0.35 : 0.2;
        setMouthOpen(prev => THREE.MathUtils.lerp(prev, targetMouth, lerpFactor));
        // 6. Emotion Mapping — deeper, richer expressions
        const targetSmile = emotion === 'happy' ? 0.9 : (emotion === 'neutral' ? 0.08 : 0);
        // Sad: drooping corners, Angry: tight jaw
        const targetFrown = emotion === 'sad' ? 0.75 : (emotion === 'angry' ? 0.5 : (emotion === 'frustrated' ? 0.4 : 0));
        // Anxious: raised alarmed brows. Sad: heavy drooped brows. Angry: furrowed.
        const targetBrow = emotion === 'anxious' ? 0.8 : (emotion === 'sad' ? 0.5 : (emotion === 'angry' ? -0.7 : (emotion === 'happy' ? 0.3 + microBrow : microBrow)));
        setSmile(prev => THREE.MathUtils.lerp(prev, targetSmile, 0.1));
        setFrown(prev => THREE.MathUtils.lerp(prev, targetFrown, 0.1));
        setBrowUp(prev => THREE.MathUtils.lerp(prev, targetBrow, 0.12));
        // 7. Pupil Dilation — emotion-driven
        // Happy/surprised: dilated. Angry: constricted. Anxious: dilated. Sad: slightly dilated.
        const targetPupil = emotion === 'happy' ? 1.0 : (emotion === 'anxious' ? 1.3 : (emotion === 'sad' ? 1.15 : (emotion === 'angry' ? 0.65 : 1.0)));
        setPupilSize(prev => THREE.MathUtils.lerp(prev, targetPupil, 0.05));
        // 8. Apply Final State to Nodes
        Object.values(nodes).forEach((node) => {
            if (node.isBone) {
                if (node.name.toLowerCase().includes('jaw') || node.name.toLowerCase().includes('mouth')) {
                    node.rotation.x = mouthOpen * 0.3;
                }
                if (node.name.toLowerCase().includes('brow') || node.name.toLowerCase().includes('eyebrow')) {
                    node.position.y = browUp * 0.005;
                }
                if (node.userData.isLShoulder)
                    node.rotation.z = Math.sin(t * 1.2) * 0.01;
                if (node.userData.isRShoulder)
                    node.rotation.z = -Math.sin(t * 1.2) * 0.01;
            }
            if (node.morphTargetInfluences) {
                const dict = node.morphTargetDictionary || {};
                const mouthIdx = dict['mouthOpen'] ?? dict['JawOpen'] ?? dict['MouthOpen'];
                if (mouthIdx !== undefined)
                    node.morphTargetInfluences[mouthIdx] = mouthOpen;
                const blinkIdx = dict['eye_blink'] ?? dict['EyesClosed'] ?? dict['Blink'];
                if (blinkIdx !== undefined && node.morphTargetInfluences[blinkIdx] !== undefined) {
                    node.morphTargetInfluences[blinkIdx] = THREE.MathUtils.lerp(node.morphTargetInfluences[blinkIdx], blink ? 1 : 0, 0.3);
                }
                const smileIdx = dict['mouthSmile'] ?? dict['Smile'];
                if (smileIdx !== undefined)
                    node.morphTargetInfluences[smileIdx] = smile;
                const frownIdx = dict['mouthFrown'] ?? dict['Frown'];
                if (frownIdx !== undefined)
                    node.morphTargetInfluences[frownIdx] = frown;
                const pupilIdx = dict['Pupil_Dila'] ?? dict['eye_pupil'] ?? dict['PupilSize'];
                if (pupilIdx !== undefined) {
                    node.morphTargetInfluences[pupilIdx] = pupilSize - 1;
                }
            }
        });
    });
    return (_jsx("group", { ref: group, dispose: null, scale: 4.2, position: [0, -0.5, 0], children: _jsx("primitive", { object: scene }) }));
}
useGLTF.preload('/school_girl_sit_on_a_chair/scene.gltf');
