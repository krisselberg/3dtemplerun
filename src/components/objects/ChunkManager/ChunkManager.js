import * as THREE from 'three';
import { Group, PlaneGeometry, Mesh, MeshBasicMaterial } from 'three';
import Obstacle from '../Obstacle/Obstacle';

const chunkPxLength = 40; // Length of the chunk
const chunkPxWidth = 10; // Width of the chunk
const chunkDepth = 40; // Depth of the chunk
// Note: Depth and length are the same so they don't overlap and spazz out
const numChunks = 5; // Number of chunks to cycle
const movementSpeed = 0.2; // Speed of movement
const turnProbability = 0.25; // Probability of chunks turning left or right

class ChunkManager extends Group {
    constructor(parent) {
        super();
        this.name = 'chunkManager';

        // Create an array to hold the chunks
        this.chunks = [];

        // To check if chunks are currently being turned or if they're
        // just going straight
        // False is going straight
        this.isTurning = false;
        
        // turnDepth holds the z value of where the turn is happening,
        // so that each chunk that is part of the turn can be set to
        // that z position
        this.turnDepth = 0;

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

        // Default this value to false
        chunk.lastChunkInTurn = false;

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

    sendChunkToBack(chunk) {
        chunk.position.z -= numChunks * chunkDepth;
    }

    turnSingleChunk(chunk) {
        // Send chunk towards the back, to the z value of the chunk that initiated the turn
        chunk.position.z = chunk.depthOffset;
        // Send chunk to the left or right of the previous chunk
        chunk.position.x = chunk.turnOffset;
        // Reset the turnOffset to 0 because the chunk's been turned
        chunk.turnOffset = 0;
    }

    initiateTurn(i) {
        // Set isTurning to true
        this.isTurning = true;

        // 50/50 chance of left turn vs right turn
        let leftRight = Math.random() < 0.5 ? -1 : 1;
        
        // Set turn offset of all coming chunks
        for (let j = 0; j < numChunks; j++) {
            // This is the meat right here.
            // This is saying for the chunk 1 ahead of you, set it 1 to the right when turning.
            // For the chunk 2 ahead of you, set it 1 to the right OF THE CHUNK YOU JUST SET 1 TO THE RIGHT. So 2 to the right.
            // And so on.
            let chunkIndex = (i + j) % numChunks;
            this.chunks[chunkIndex].turnOffset = leftRight * (j + 1) * chunkPxWidth;
            
            // This is what allows us to put each turned chunk next to each other in the z-axis
            // This is necessary because the origin is changing as the camera moves forward in the z-axis,
            // so when we move the first chunk, we have to move it forward (numChunks - 1) units, and when we move
            // the final chunk, we just have to move it forward 1 unit.
            this.chunks[chunkIndex].depthOffset = this.chunks[i].position.z - ((numChunks - (j+1)) * chunkDepth);
        }

        // Turn this single chunk
        this.turnSingleChunk(this.chunks[i]);

        // Mark the last chunk in the turn (so we know when the turn is over)
        this.chunks[(i - 2 + numChunks) % numChunks].lastChunkInTurn = true;
    }

    updateChunkPosition(i) {
        let chunk = this.chunks[i];
        
        // If you're not in the process of turning, either send the chunk to the back or initiate a turn
        if (!this.isTurning) {
            if (Math.random() < turnProbability) { // Initiate a turn
                this.initiateTurn(i);
            } else { // Just send the chunk to the back
                this.sendChunkToBack(chunk);
            }
        } else { // If you are in the process of turning, turn the individual chunk
            this.turnSingleChunk(chunk);

            // If it is the last chunk to be turned, set isTurning to false
            if (chunk.lastChunkInTurn === true) {
                this.isTurning = false;
                chunk.lastChunkInTurn = false;
            }
        }
    }

    update(timeStamp) {
        // Move each chunk towards the camera
        for (let i = 0; i < numChunks; i++) {
            let chunk = this.chunks[i];

            chunk.position.z += movementSpeed;

            // If a chunk has moved past the camera, reset its position to the back or turn it
            if (chunk.position.z > 30) {
                this.updateChunkPosition(i);
            }
        }
    }
}

export default ChunkManager;
