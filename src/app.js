/**
 * app.js
 *
 * This is the first file loaded. It sets up the Renderer,
 * Scene and Camera. It also starts the render loop and
 * handles window resizes.
 *
 */
import { WebGLRenderer, PerspectiveCamera, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SeedScene } from 'scenes';

// Initialize core ThreeJS components
const scene = new SeedScene();
const camera = new PerspectiveCamera();
const renderer = new WebGLRenderer({ antialias: true });

// Set up camera
camera.position.set(0, 2, 7);
camera.lookAt(new Vector3(0, 0, 5));

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
            startAnimationLoop(); // Start the animation loop
        });
    }
});
