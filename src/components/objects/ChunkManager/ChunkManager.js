import * as THREE from 'three';
import { Group, PlaneGeometry, Mesh, MeshBasicMaterial } from 'three';

const chunkPxWidth = 1000; // Width of the chunk
const chunkDepth = 1000; // Depth of the chunk
const numChunks = 5; // Number of chunks to cycle
const movementSpeed = 1; // Speed of movement

class ChunkManager extends Group {
    constructor(parent) {
        super();
        this.name = 'chunkManager';

        // Create an array to hold the chunks
        this.chunks = [];

        // Initialize chunks
        for (let i = 0; i < numChunks; i++) {
            this.createChunk(-i * chunkDepth - chunkDepth);
        }

        // Add self to parent's update list
        parent.addToUpdateList(this);
    }

    createChunk(zPosition) {
        // Create the geometry and material for the chunk
        const geometry = new PlaneGeometry(chunkPxWidth, chunkPxWidth, 10, 10);
        const material = new MeshBasicMaterial({
            color: 0xffffff,
            // wireframe: true,
        });
        const chunk = new Mesh(geometry, material);

        // Rotate the chunk to lie flat
        chunk.rotation.x = -Math.PI / 2;
        chunk.position.z = zPosition;

        // Add the chunk to the scene and the chunks array
        this.add(chunk);
        this.chunks.push(chunk);
    }

    update(timeStamp) {
        // Move each chunk towards the camera
        for (let chunk of this.chunks) {
            chunk.position.z += movementSpeed;

            // If a chunk has moved past the camera, reset its position to the back
            if (chunk.position.z > 0) {
                chunk.position.z -= numChunks * chunkDepth;
            }
        }
    }
}

export default ChunkManager;
