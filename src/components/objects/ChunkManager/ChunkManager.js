import * as THREE from 'three';
import { Group, PlaneGeometry, Mesh, MeshBasicMaterial } from 'three';
import Obstacle from '../Obstacle/Obstacle';

const chunkPxLength = 40; // Length of the chunk
const chunkPxWidth = 10; // Width of the chunk
const chunkDepth = 40; // Depth of the chunk
// Note: Depth and length are the same so they don't overlap and spazz out
const numChunks = 5; // Number of chunks to cycle
const movementSpeed = 0.2; // Speed of movement

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

        // Add obstacle to each chunk
        const obstacle = new Obstacle(); // Now automatically determines its size and type

        // Random position within the chunk
        const positionRange = chunkPxWidth * 0.2;
        obstacle.position.x = Math.random() * positionRange - positionRange / 2;

        // get obstacle height and position z so the bottom of obstacle is on ground
        const obstacleHeight = obstacle.getHeight();
        obstacle.position.z = obstacleHeight / 2;

        // Attach the obstacle to the chunk
        chunk.add(obstacle);

        // Add the chunk to the scene and to the chunks array
        this.add(chunk);
        this.chunks.push(chunk);
    }

    update(timeStamp) {
        // Move each chunk towards the camera
        // TODO: Slowly crank up the speed as the game goes on
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
