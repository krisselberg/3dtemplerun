import {
    BoxGeometry,
    CylinderGeometry,
    Mesh,
    MeshBasicMaterial,
    Group,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

class Obstacle extends Group {
    constructor() {
        super();

        // Randomly choose the type of obstacle - cube or tree stump
        if (Math.random() > 0.5) {
            this.createCube();
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
        cube.position.set(0, cubeSize / 2, 0);
    }

    loadTreeStump() {
        const loader = new GLTFLoader();
        loader.load(
            './scene.gltf',
            (gltf) => {
                // Add the loaded tree stump model to the group
                this.add(gltf.scene);
                // Adjust stump position and scale if necessary (rotate)
                gltf.scene.position.set(0, 0, 0); // Adjust as needed
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
}

export default Obstacle;
