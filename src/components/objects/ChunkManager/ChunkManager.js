import * as THREE from 'three';
import { Group, PlaneGeometry, Mesh, MeshBasicMaterial } from 'three';
import Obstacle from '../Obstacle/Obstacle';

const chunkPxLength = 40; // Length of the chunk
const chunkPxWidth = 10; // Width of the chunk
const chunkDepth = 40; // Depth of the chunk
// Note: Depth and length are the same so they don't overlap and spazz out
const numChunks = 5; // Number of chunks to cycle
const movementSpeed = 0.5; // Speed of movement

class ChunkManager extends Group {
    constructor(parent) {
        super();
        this.name = 'chunkManager';

        // Create an array to hold the chunks
        this.chunks = [];

        // Initialize chunks
        for (let i = 0; i < numChunks; i++) {
            // with different colors
            const colors = [0x00ff00, 0xff0000, 0x0000ff, 0xffff00, 0x00ffff];
            // create a chunk that is long but thin
            this.createChunk(-i * chunkDepth - chunkDepth, colors[i]);
        }

        // Add self to parent's update list
        parent.addToUpdateList(this);
    }

    createChunk(zPosition, color) {
        // Create the geometry and material for the chunk
        const geometry = new PlaneGeometry(chunkPxWidth, chunkPxLength, 10, 10);
        const material = new MeshBasicMaterial({
            color: color,
            // wireframe: true,
        });
        const chunk = new Mesh(geometry, material);

        // Rotate the chunk to lie flat
        chunk.rotation.x = -Math.PI / 2;
        chunk.position.z = zPosition;

        // Add the chunk to the scene and to the chunks array
        this.add(chunk);
        this.chunks.push(chunk);

        // Add cube to each chunk
        const cubeSize = 1; // Half the previous size
        const randomColor = Math.random() * 0xffffff; // Generate a random color
        const cube = new Obstacle(cubeSize, randomColor);

        // Random position within a smaller range near the center of the chunk
        const positionRange = chunkPxWidth * 0.2; // 20% of the chunk width
        cube.position.x = Math.random() * positionRange - positionRange / 2;
        cube.position.y = Math.random() * positionRange - positionRange / 2; // Set y position to half the cube's height
        cube.position.z = 0.5;

        // Attach the cube to the chunk
        chunk.add(cube);
    }

    update(timeStamp) {
        // Move each chunk towards the camera
        for (let chunk of this.chunks) {
            chunk.position.z += movementSpeed;

            // If a chunk has moved past the camera, reset its position to the back
            if (chunk.position.z > 30) {
                chunk.position.z -= numChunks * chunkDepth;
            }
        }
    }
}

export default ChunkManager;
