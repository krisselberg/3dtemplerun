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
        this.isBat = false;

        // Randomly choose the type of obstacle - cube or tree stump
        // if (Math.random() > 0.5) {
        //     this.createCube();
        //     // set isCube
        //     this.isCube = true;
        // } else {
        //     this.loadTreeStump();
        // }
        const random = Math.random();
        if (random < 0.5) {
            this.loadTreeStump();
            this.isStump = true;
        } else {
            this.loadBat();
            this.isBat = true;
        }
        // this.createCube();
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
        // Randomize vertical position (either 0 or 1)
        const verticalPosition = Math.round(Math.random());
        cube.position.set(0, 0, verticalPosition);

        this.boundingBox = new Box3().setFromObject(cube);
    }

    loadBat() {
        const loader = new GLTFLoader();
        loader.load(
            './bat.glb',
            (gltf) => {
                // Add the loaded tree stump model to the group
                this.add(gltf.scene);
                // Adjust stump position and scale if necessary (rotate)
                gltf.scene.position.set(0, 0, 1); // Adjust as needed
                gltf.scene.scale.set(1, 1, 1); // Adjust scale as needed
                // rotate
                gltf.scene.rotation.x = Math.PI / 2;
                gltf.scene.rotation.y = Math.PI / 2;
            },
            undefined,
            function (error) {
                console.error('An error happened', error);
            }
        );
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

    getBoundingBox() {
        // if (!this.boundingBox) {
        //     this.boundingBox = new Box3().setFromObject(this);
        // }
        // do static bounding box
        this.createStaticBoundingBox(this.isBat, this.isStump);
        if (this.boundingBox) {
            return this.boundingBox.clone().applyMatrix4(this.matrixWorld);
        }
        return null;
    }

    createStaticBoundingBox(isBat, isStump) {
        if (isBat) {
            // Define the size of the bounding box
            const size = new Vector3(2, 2, 4); // width, height, depth - adjust these values based on your character's size

            // Calculate the min and max coordinates of the box
            const min = new Vector3(-size.x / 2, -size.y / 2, -size.z / 2 + 2);
            const max = new Vector3(size.x / 2, size.y / 2, size.z / 2);

            // Create the bounding box
            this.boundingBox = new Box3(min, max);
        } else if (isStump) {
            // Define the size of the bounding box
            const size = new Vector3(2, 2, 1); // width, height, depth - adjust these values based on your character's size

            // Calculate the min and max coordinates of the box
            const min = new Vector3(
                -size.x / 2,
                -size.y / 2,
                -size.z / 2 - 0.5
            );
            const max = new Vector3(size.x / 2, size.y / 2, size.z / 2);

            // Create the bounding box
            this.boundingBox = new Box3(min, max);
        }
    }
}

export default Obstacle;
