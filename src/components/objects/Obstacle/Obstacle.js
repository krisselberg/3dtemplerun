import {
    BoxGeometry,
    CylinderGeometry,
    Mesh,
    MeshBasicMaterial,
    Group,
    Box3,
    Vector3,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

class Obstacle extends Group {
    constructor() {
        super();

        // Randomly choose the type of obstacle - cube or tree stump
        if (Math.random() > 0.5) {
            this.createCube();
            // set isCube
            this.isCube = true;
        } else {
            this.loadTreeStump();
        }
    }

    createCube() {
        // Cube geometry and size
        const cubeSize = 1;
        const cubeGeometry = new BoxGeometry(cubeSize, cubeSize, cubeSize);
        const color = Math.random() * 0xffffff;
        const cubeMaterial = new MeshBasicMaterial({ color });
        const cube = new Mesh(cubeGeometry, cubeMaterial);

        // Add cube to the group and set position
        this.add(cube);
        cube.position.set(0, 0, 0);
    }

    loadTreeStump() {
        const loader = new GLTFLoader();
        loader.load(
            './stump.gltf',
            (gltf) => {
                // Add the loaded tree stump model to the group
                this.add(gltf.scene);
                // Adjust stump position and scale if necessary (rotate)
                gltf.scene.position.set(0, 0, -1); // Adjust as needed
                gltf.scene.scale.set(1, 1, 1); // Adjust scale as needed
                // rotate
                gltf.scene.rotation.x = Math.PI / 2;
            },
            undefined,
            function (error) {
                console.error('An error happened', error);
            }
        );
    }

    // get obstacle height
    getHeight() {
        if (this.isCube) {
            // Get the bounding box of the obstacle
            const box = new Box3().setFromObject(this);
            // Get the size of the bounding box
            const size = box.getSize(new Vector3());
            // Return the height of the bounding box
            return size.y;
        } else {
            return 1.7; // empirically determined by stump. TODO: change to bounding box
        }
    }
}

export default Obstacle;
