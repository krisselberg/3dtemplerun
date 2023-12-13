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
    constructor(parent, listener, chunkManager, camera) {
        // Call parent Group() constructor
        super();

        this.previousTimestamp = 0; // Used to calculate delta time
        this.chunkManager = chunkManager; // Reference to the ChunkManager

        this.camera = camera;

        this.direction = this.chunkManager.direction; // Which way is the hero currently moving in the universe

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
            } else if (
                event.code === 'ArrowLeft' ||
                event.code === 'ArrowRight'
            ) {
                this.handleTurn(event.code);
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

        // Define the world's X-axis for rotation
        let worldAxisX = new Vector3(1, 0, 0);
        if (this.direction === DIRECTION.LEFT) {
            worldAxisX = new Vector3(0, 0, -1);
        } else if (this.direction === DIRECTION.RIGHT) {
            worldAxisX = new Vector3(0, 0, 1);
        }

        // Start rotation to have the character lie on their back
        let rotateToBack = new TWEEN.Tween({ theta: 0 })
            .to({ theta: Math.PI / 2 }, 200) // Rotate by 90 degrees
            .onUpdate(({ theta }) => {
                // Reset the rotation, but if character is facing left or right, keep that rotation
                if (this.direction === DIRECTION.STRAIGHT) {
                    this.rotation.set(0, 0, 0);
                } else if (this.direction === DIRECTION.LEFT) {
                    this.rotation.set(0, Math.PI / 2, 0);
                } else if (this.direction === DIRECTION.RIGHT) {
                    this.rotation.set(0, -Math.PI / 2, 0);
                }
                this.rotateOnWorldAxis(worldAxisX, theta);
            })
            .easing(TWEEN.Easing.Quadratic.InOut);

        // Slide animation
        let slide = new TWEEN.Tween(this.position)
            .to({ y: this.position.x }, 500)
            .easing(TWEEN.Easing.Quadratic.Out);

        // Get up animation
        let getUp = new TWEEN.Tween(this.position)
            .to({ y: 0 }, 200)
            .easing(TWEEN.Easing.Quadratic.In);

        // Rotate back to normal after getting up
        let rotateBack = new TWEEN.Tween({ theta: Math.PI / 2 })
            .to({ theta: 0 }, 200) // Rotate back to 0 degrees
            .onUpdate(({ theta }) => {
                // Reset the rotation, but if character is facing left or right, keep that rotation
                if (this.direction === DIRECTION.STRAIGHT) {
                    this.rotation.set(0, 0, 0);
                } else if (this.direction === DIRECTION.LEFT) {
                    this.rotation.set(0, Math.PI / 2, 0);
                } else if (this.direction === DIRECTION.RIGHT) {
                    this.rotation.set(0, -Math.PI / 2, 0);
                }
                this.rotateOnWorldAxis(worldAxisX, theta);
            })
            .easing(TWEEN.Easing.Quadratic.InOut);

        // Chain animations
        rotateToBack.onComplete(() => slide.start());
        slide.onComplete(() => {
            getUp.start();
            rotateBack.start();
        });

        // Reset flags and animations once sliding is complete
        rotateBack.onComplete(() => {
            this.isSliding = false; // Reset flag once the slide is done
            if (this.slideSound && !this.slideSound.isPlaying) {
                this.slideSound.play();
            }
            // Reset running animation if it exists
            if (this.runAction) {
                this.runAction.reset().fadeIn(0.2).play(); // Fade in and restart running animation
            }
        });

        // Start the initial rotation animation
        rotateToBack.start();
    }

    // Method to handle left and right turns
    handleTurn(direction) {
        // Check if it's safe to turn left or right
        const canTurnLeft = this.chunkManager.canTurnLeft;
        const canTurnRight = this.chunkManager.canTurnRight;

        if (direction === 'ArrowLeft' && !canTurnLeft) {
            // Not safe to turn left
            console.log('Game Over - Unsafe Left Turn');
            this.parent.onGameOver();
            return;
        }

        if (direction === 'ArrowRight' && !canTurnRight) {
            // Not safe to turn right
            console.log('Game Over - Unsafe Right Turn');
            this.parent.onGameOver();
            return;
        }

        // Execute turn
        if (direction === 'ArrowLeft') {
            this.turnLeft();
        } else if (direction === 'ArrowRight') {
            this.turnRight();
        }
    }

    // Method to update the canTurn flag
    updateTurnWindow(status) {
        this.canTurn = status;
    }

    // Character turns to run left
    turnLeft() {
        // To ensure you can't turn when you're in the middle of a turn
        if (this.isTurning === true) return;
        this.isTurning = true;

        const targetRotation = this.rotation.y + Math.PI / 2;

        // Person rotation
        new TWEEN.Tween(this.rotation)
            .onComplete(() => {
                this.isTurning = false; // Reset flag once the turn is done
            })
            .to({ y: targetRotation }, 333)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .start();

        // set camera to face left
        if (this.camera.position.z == 7) {
            this.camera.position.set(7, 2, 0);
        } else {
            this.camera.position.set(0, 2, 7);
        }
    }

    // Character turns to run right
    turnRight() {
        // To ensure you can't turn when you're in the middle of a turn
        if (this.isTurning === true) return;
        this.isTurning = true;

        const targetRotation = this.rotation.y - Math.PI / 2;

        // Person rotation
        new TWEEN.Tween(this.rotation)
            .onComplete(() => {
                this.isTurning = false; // Reset flag once the turn is done
            })
            .to({ y: targetRotation }, 333)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .start();

        // Set camera to face right
        if (this.camera.position.z === 7) {
            this.camera.position.set(-7, 2, 0);
        } else {
            this.camera.position.set(0, 2, 7);
        }
    }

    update(timeStamp) {
        this.direction = this.chunkManager.direction; // Update the direction

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

        function vectorsAreClose(v1, v2, tolerance = 0.1) {
            return (
                Math.abs(v1.x - v2.x) < tolerance &&
                Math.abs(v1.y - v2.y) < tolerance &&
                Math.abs(v1.z - v2.z) < tolerance
            );
        }

        if (
            this.chunkManager.isCorner &&
            this.chunkManager.direction === DIRECTION.STRAIGHT
        ) {
            if (!vectorsAreClose(this.camera.position, new Vector3(0, 2, 7))) {
                this.parent.onGameOver();
            }
        } else if (
            this.chunkManager.isCorner &&
            this.chunkManager.direction === DIRECTION.LEFT
        ) {
            if (!vectorsAreClose(this.camera.position, new Vector3(7, 2, 0))) {
                this.parent.onGameOver();
            }
        } else if (
            this.chunkManager.isCorner &&
            this.chunkManager.direction === DIRECTION.RIGHT
        ) {
            if (!vectorsAreClose(this.camera.position, new Vector3(-7, 2, 0))) {
                this.parent.onGameOver();
            }
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
