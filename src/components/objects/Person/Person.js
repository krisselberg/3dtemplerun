import { Group, AnimationMixer } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js';

class Person extends Group {
    constructor(parent) {
        // Call parent Group() constructor
        super();

        this.previousTimestamp = 0; // Used to calculate delta time

        // Init state
        this.state = {
            gui: parent.state.gui,
            spin: () => this.spin(), // or this.spin.bind(this)
            twirl: 0,
        };

        // Load object
        const loader = new GLTFLoader();

        this.name = 'person';
        loader.load('./person.gltf', (gltf) => {
            // Set up the mixer
            this.mixer = new AnimationMixer(gltf.scene);

            // Find and play the running animation
            const runAction = this.mixer.clipAction(gltf.animations[3]); // Assumes running animation is the first
            runAction.play();
            this.add(gltf.scene);

            // rotate the person to face the camera
            gltf.scene.rotation.y = Math.PI;
        });

        // Add self to parent's update list
        parent.addToUpdateList(this);

        // Populate GUI
        this.state.gui.add(this.state, 'spin');
    }

    spin() {
        // Add a simple twirl
        this.state.twirl += 6 * Math.PI;

        // Use timing library for more precice "bounce" animation
        // TweenJS guide: http://learningthreejs.com/blog/2011/08/17/tweenjs-for-smooth-animation/
        // Possible easings: http://sole.github.io/tween.js/examples/03_graphs.html
        const jumpUp = new TWEEN.Tween(this.position)
            .to({ y: this.position.y + 1 }, 300)
            .easing(TWEEN.Easing.Quadratic.Out);
        const fallDown = new TWEEN.Tween(this.position)
            .to({ y: 0 }, 300)
            .easing(TWEEN.Easing.Quadratic.In);

        // Fall down after jumping up
        jumpUp.onComplete(() => fallDown.start());

        // Start animation
        jumpUp.start();
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

        // Advance tween animations, if any exist
        TWEEN.update();
    }
}

export default Person;
