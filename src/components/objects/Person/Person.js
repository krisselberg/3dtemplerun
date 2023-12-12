import {
    Group,
    AnimationMixer,
    Box3,
    Box3Helper,
    Vector3,
    Audio,
    AudioLoader,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js';

class Person extends Group {
    constructor(parent, listener) {
        // Call parent Group() constructor
        super();

        this.previousTimestamp = 0; // Used to calculate delta time

        // Init state
        this.state = {
            gui: parent.state.gui,
            spin: () => this.spin(), // or this.spin.bind(this)
            twirl: 0,
        };

        // Create audio objects for jump and slide sounds
        this.jumpSound = new Audio(listener);
        this.slideSound = new Audio(listener);

        // Load jump and slide sounds
        const audioLoader = new AudioLoader();
        audioLoader.load('jump.m4a', (buffer) => {
            this.jumpSound.setBuffer(buffer);
            this.jumpSound.setVolume(0.5); // adjust volume as needed
        });

        audioLoader.load('slide.m4a', (buffer) => {
            this.slideSound.setBuffer(buffer);
            this.slideSound.setVolume(0.5); // adjust volume as needed
        });

        // Load object
        const loader = new GLTFLoader();

        this.name = 'person';
        loader.load('./person.gltf', (gltf) => {
            // Set up the mixer
            this.mixer = new AnimationMixer(gltf.scene);
            // Find and play the running animation
            const runAction = this.mixer.clipAction(gltf.animations[3]); // Assumes running animation is the first
            runAction.play();
            // Store actions for later use
            this.jumpAction = this.mixer.clipAction(gltf.animations[1]);
            this.idleAction = this.mixer.clipAction(gltf.animations[0]);
            // rotate the person to face the camera
            gltf.scene.rotation.y = Math.PI;
            this.add(gltf.scene);
            this.createStaticBoundingBox();
        });

        // Add self to parent's update list
        parent.addToUpdateList(this);

        // Add event handlers for up arrow to spin
        document.addEventListener('keydown', (event) => {
            if (event.code === 'ArrowUp') {
                this.jump();
            } else if (event.code === 'ArrowDown') {
                this.slide();
            }
        });
    }

    jump() {
        // Use timing library for more precice "bounce" animation
        // TweenJS guide: http://learningthreejs.com/blog/2011/08/17/tweenjs-for-smooth-animation/
        // Possible easings: http://sole.github.io/tween.js/examples/03_graphs.html
        const jumpUp = new TWEEN.Tween(this.position)
            .to({ y: this.position.y + 2 }, 500)
            .easing(TWEEN.Easing.Quadratic.Out);
        const fallDown = new TWEEN.Tween(this.position)
            .to({ y: 0 }, 500)
            .easing(TWEEN.Easing.Quadratic.In);

        // Fall down after jumping up
        jumpUp.onComplete(() => fallDown.start());

        // Start animation
        if (this.jumpAction) {
            if (this.jumpSound && !this.jumpSound.isPlaying) {
                this.jumpSound.play();
            }
            this.jumpAction.reset().play();
        }
        jumpUp.start();
    }

    slide() {
        // Use timing library for more precice "bounce" animation
        // TweenJS guide: http://learningthreejs.com/blog/2011/08/17/tweenjs-for-smooth-animation/
        // Possible easings: http://sole.github.io/tween.js/examples/03_graphs.html
        // Rotate the character to be on their back
        this.rotation.x = Math.PI / 2;

        const slide = new TWEEN.Tween(this.position)
            .to({ y: this.position.x }, 500)
            .easing(TWEEN.Easing.Quadratic.Out);
        const getUp = new TWEEN.Tween(this.position)
            .to({ y: 0 }, 500)
            .easing(TWEEN.Easing.Quadratic.In);

        // Get up after sliding and rotate back to normal
        slide.onComplete(() => {
            getUp.start();
        });
        getUp.onComplete(() => {
            this.rotation.x = 0;
        });

        // Start animation
        if (this.slideSound && !this.slideSound.isPlaying) {
            this.slideSound.play();
        }
        if (this.idleAction) {
            this.idleAction.reset().play();
        }
        slide.start();
    }

    update(timeStamp) {
        if (this.mixer) {
            // Update the animation mixer, if it exists
            this.mixer.update((timeStamp - this.previousTimestamp) / 1000);
            this.previousTimestamp = timeStamp;
        }
        if (this.state.bob) {
            // Bob back and forth
            this.rotation.z = 0.05 * Math.sin(timeStamp / 300);
        }
        if (this.state.twirl > 0) {
            // Lazy implementation of twirl
            this.state.twirl -= Math.PI / 8;
            this.rotation.y += Math.PI / 8;
        }

        // Calculate bounding box
        if (!this.boundingBox && this.children.length > 0) {
            this.boundingBox = new Box3().setFromObject(this);
            this.boundingBoxHelper = new Box3Helper(this.boundingBox, 0xff0000); // Red color for visibility
            this.add(this.boundingBoxHelper); // Add the helper to the Person group
        }

        // Advance tween animations, if any exist
        TWEEN.update();
    }

    getBoundingBox() {
        if (!this.boundingBox) {
            this.boundingBox = new Box3().setFromObject(this);
        }
        return this.boundingBox.clone().applyMatrix4(this.matrixWorld);
    }

    createStaticBoundingBox() {
        // Define the size of the bounding box
        const size = new Vector3(0.5, 2, 1); // width, height, depth - adjust these values based on your character's size

        // Calculate the min and max coordinates of the box
        const min = new Vector3(-size.x / 2, -size.y / 2 + 1, -size.z / 2);
        const max = new Vector3(size.x / 2, size.y / 2 + 0.65, size.z / 2);

        // Create the bounding box
        this.boundingBox = new Box3(min, max);

        // Create and add the bounding box helper for visualization
        this.boundingBoxHelper = new Box3Helper(this.boundingBox, 0xff0000);
        this.add(this.boundingBoxHelper);
    }
}

export default Person;
