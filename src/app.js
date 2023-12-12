/**
 * app.js
 *
 * This is the first file loaded. It sets up the Renderer,
 * Scene and Camera. It also starts the render loop and
 * handles window resizes.
 *
 */
import { WebGLRenderer, PerspectiveCamera, Vector3, AudioContext } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SeedScene } from 'scenes';

// Set up camera
const camera = new PerspectiveCamera();
camera.position.set(0, 2, 7); // 0, 2, 7
camera.lookAt(new Vector3(0, -5, 5));

// Initialize core ThreeJS components
const scene = new SeedScene(camera);
const renderer = new WebGLRenderer({ antialias: true });

// Set up renderer, canvas, and minor CSS adjustments
renderer.setPixelRatio(window.devicePixelRatio);
const canvas = renderer.domElement;
canvas.style.display = 'none'; // Initially hide the canvas
document.body.style.margin = 0;
document.body.style.overflow = 'hidden';
document.body.appendChild(canvas);

// Set up controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 4;
controls.maxDistance = 16;

// Function to start the animation loop
const startAnimationLoop = () => {
    const onAnimationFrameHandler = (timeStamp) => {
        controls.update();
        renderer.render(scene, camera);
        scene.update && scene.update(timeStamp);
        window.requestAnimationFrame(onAnimationFrameHandler);
    };
    window.requestAnimationFrame(onAnimationFrameHandler);
};

// Resize Handler
const windowResizeHandler = () => {
    const { innerHeight, innerWidth } = window;
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
};
windowResizeHandler();
window.addEventListener('resize', windowResizeHandler, false);

// Function to play audio
let audioSource = null;
const audioContext = new (window.AudioContext || window.webkitAudioContext)(); // Create AudioContext

const playAudio = (url) => {
    fetch(url)
        .then((response) => response.arrayBuffer())
        .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
        .then((audioBuffer) => {
            audioSource = audioContext.createBufferSource();
            audioSource.buffer = audioBuffer;
            audioSource.connect(audioContext.destination);
            audioSource.start(0);
        })
        .catch((e) => console.error('Error playing audio:', e));
};

const stopAudio = () => {
    if (audioSource) {
        audioSource.stop();
        audioSource = null;
    }
};

// Start Game Event Listener
document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startButton');
    const titleScreen = document.getElementById('titleScreen');

    if (startButton) {
        startButton.addEventListener('click', () => {
            if (titleScreen) {
                titleScreen.style.display = 'none'; // Hide the title screen
            }
            canvas.style.display = 'block'; // Show the canvas
            scoreElement.style.display = 'block'; // Show the score
            startAnimationLoop(); // Start the animation loop
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            if (!audioSource) {
                // Play audio only if it's not already playing
                playAudio('game.m4a');
            }
        });
    }
});
