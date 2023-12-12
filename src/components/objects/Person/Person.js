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

const DIRECTION = { LEFT: -1, STRAIGHT: 0, RIGHT: 1 }; // Which way is the hero currently moving in the universe

class Person extends Group {
    constructor(parent, listener) {
        // Call parent Group() constructor
        super();

        this.previousTimestamp = 0; // Used to calculate delta time

        this.direction = DIRECTION.STRAIGHT;

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
            this.runAction = this.mixer.clipAction(gltf.animations[3]); // Assumes running animation is the first
            this.runAction.play();
            // Store actions for later use
            this.jumpAction = this.mixer.clipAction(gltf.animations[1]);
            // this.idleAction = this.mixer.clipAction(gltf.animations[0]);
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
            } else if (event.code === 'ArrowLeft') {
                this.turnLeft();
            } else if (event.code === 'ArrowRight') {
                this.turnRight();
            }
        });
    }

    jump() {
        // Check if already jumping, if so, do nothing
        if (this.isJumping) return;

        this.isJumping = true; // Set flag to indicate jumping

        const jumpUp = new TWEEN.Tween(this.position)
            .to({ y: this.position.y + 2 }, 500)
            .easing(TWEEN.Easing.Quadratic.Out);
        const fallDown = new TWEEN.Tween(this.position)
            .to({ y: 0 }, 500)
            .easing(TWEEN.Easing.Quadratic.In);

        jumpUp.onComplete(() => fallDown.start());
        fallDown.onComplete(() => {
            this.isJumping = false; // Reset flag once the person lands back
            if (this.jumpAction) {
                this.jumpAction.fadeOut(0.2); // Fade out the jump animation
            }
            this.runAction.reset().fadeIn(0.2).play(); // Fade in and restart running animation
        });

        if (this.jumpAction) {
            if (this.jumpSound && !this.jumpSound.isPlaying) {
                this.jumpSound.play();
            }
            this.jumpAction.reset().play();
        }
        jumpUp.start();
    }

    slide() {
        // Check if already sliding, if so, do nothing
        if (this.isSliding) return;

        this.isSliding = true; // Set flag to indicate sliding

        // Modify based on which way the character is facing,
        // so they always slide by putting their head straight back
        // to the ground
        let rotateToBack;
        let slide;
        let getUp;
        let rotateBack;

        // if (this.direction === DIRECTION.STRAIGHT) {
        // Start rotation to have the character lie on their back
        rotateToBack = new TWEEN.Tween(this.rotation)
            .to({ x: Math.PI / 2 }, 200)
            .easing(TWEEN.Easing.Quadratic.InOut);

        // Slide animation
        slide = new TWEEN.Tween(this.position)
            .to({ y: this.position.x }, 500)
            .easing(TWEEN.Easing.Quadratic.Out);

        // Get up animation
        getUp = new TWEEN.Tween(this.position)
            .to({ y: 0 }, 200)
            .easing(TWEEN.Easing.Quadratic.In);

        // Rotate back to normal after getting up
        rotateBack = new TWEEN.Tween(this.rotation)
            .to({ x: 0 }, 200)
            .easing(TWEEN.Easing.Quadratic.InOut);
        // }

        // else if (this.direction === DIRECTION.LEFT) {
        //     // Start rotation to have the character lie on their back
        //     rotateToBack = new TWEEN.Tween(this.rotation)
        //         .to({ z: (-1 * Math.PI) / 2 }, 200) // Rotate around z-axis
        //         .easing(TWEEN.Easing.Quadratic.InOut);

        //     // Slide animation
        //     slide = new TWEEN.Tween(this.position)
        //         .to({ y: this.position.z }, 500)
        //         .easing(TWEEN.Easing.Quadratic.Out);

        //     // Get up animation
        //     getUp = new TWEEN.Tween(this.position)
        //         .to({ y: 0 }, 200)
        //         .easing(TWEEN.Easing.Quadratic.In);

        //     // Rotate back to normal after getting up
        //     rotateBack = new TWEEN.Tween(this.rotation)
        //         .to({ z: 0 }, 200)
        //         .easing(TWEEN.Easing.Quadratic.InOut);
        // }

        // Chain animations
        rotateToBack.onComplete(() => slide.start());
        slide.onComplete(() => {
            getUp.start();
            rotateBack.start();
        });

        // Reset flags and animations once sliding is complete
        rotateBack.onComplete(() => {
            this.isSliding = false; // Reset flag once the slide is done
            if (this.slideAction) {
                this.slideAction.fadeOut(0.2); // Fade out the slide animation
            }
            this.runAction.reset().fadeIn(0.2).play(); // Fade in and restart running animation
        });

        // Start the initial rotation animation
        rotateToBack.start();

        // Additional code for sound
        if (this.slideSound && !this.slideSound.isPlaying) {
            this.slideSound.play();
        }
    }

    // Character turns to run left
    turnLeft() {
        // To ensure you can't turn when you're in the middle of a turn
        if (this.isTurning === true) return;
        this.isTurning = true;

        const targetRotationLeft = this.rotation.y + Math.PI / 2;

        const turnTween = new TWEEN.Tween(this.rotation)
            .to({ y: targetRotationLeft }, 333) // 333 milliseconds is roughly a third of a second
            .easing(TWEEN.Easing.Quadratic.InOut) // InOut easing for a smooth start and end
            .start(); // Start the tween animation

        turnTween.onComplete(() => {
            this.isTurning = false;
            // Update the universal direction of the character based on the direction they were facing pre-turn
            if (this.direction === DIRECTION.STRAIGHT) {
                this.direction = DIRECTION.LEFT;
            } else if (this.direction === DIRECTION.RIGHT) {
                this.direction = DIRECTION.STRAIGHT;
            }
        });
    }

    // Character turns to run right
    turnRight() {
        // To ensure you can't turn when you're in the middle of a turn
        if (this.isTurning === true) return;
        this.isTurning = true;

        const targetRotationLeft = this.rotation.y - Math.PI / 2;

        const turnTween = new TWEEN.Tween(this.rotation)
            .to({ y: targetRotationLeft }, 333) // 333 milliseconds is roughly a third of a second
            .easing(TWEEN.Easing.Quadratic.InOut) // InOut easing for a smooth start and end
            .start(); // Start the tween animation

        turnTween.onComplete(() => {
            this.isTurning = false;
            // Update the universal direction of the character based on the direction they were facing pre-turn
            if (this.direction === DIRECTION.STRAIGHT) {
                this.direction = DIRECTION.RIGHT;
            } else if (this.direction === DIRECTION.LEFT) {
                this.direction = DIRECTION.STRAIGHT;
            }
        });
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
