import * as THREE from 'three';
import { Group, PlaneGeometry, Mesh, MeshBasicMaterial } from 'three';
import Obstacle from '../Obstacle/Obstacle';

const DIRECTION = { LEFT: -1, STRAIGHT: 0, RIGHT: 1 }; // Which way is the hero currently moving in the universe
const chunkPxLength = 10; // Length of the chunk
const chunkPxWidth = 10; // Width of the chunk
const chunkDepth = 10; // Depth of the chunk
// Note: Depth and length are the same so they don't overlap and freak out
const numChunks = 20; // Number of chunks to cycle
const movementSpeed = 0.4; // Speed of movement
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

        // For ensuring we're never turned around
        this.leftTurnCount = 0;
        this.rightTurnCount = 0;

        // For knowing which way the hero is moving in the universe
        this.direction = DIRECTION.STRAIGHT;

        // Initialize chunks
        for (let i = 0; i < numChunks; i++) {
            // with different colors
            const colors = [0x00ff00, 0xff0000, 0x0000ff, 0xffff00, 0x00ffff, 0x00ff00, 0xff0000, 0x0000ff, 0xffff00, 0x00ffff];
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
        if (this.direction === DIRECTION.STRAIGHT) {
            chunk.position.z -= numChunks * chunkDepth;
        } else if (this.direction === DIRECTION.LEFT) {
            chunk.position.x -= numChunks * chunkDepth;
        }  else if (this.direction === DIRECTION.RIGHT) {
            chunk.position.x += numChunks * chunkDepth;
        }
    }

    turnSingleChunk(chunk) {
        // Send chunk towards the back, to the z value of the chunk that initiated the turn
        if (this.direction === DIRECTION.STRAIGHT) {
            chunk.position.z = chunk.depthOffset;
        } else { // Right or Left
            chunk.position.x = chunk.depthOffset;
        }

        // Send chunk to the left or right of the previous chunk
        if (this.direction === DIRECTION.STRAIGHT) {
            chunk.position.x = chunk.turnOffset;
        } else if (this.direction === DIRECTION.LEFT) {
            chunk.position.z = -1 * chunk.turnOffset;
        } else if (this.direction === DIRECTION.RIGHT) {
            chunk.position.z = chunk.turnOffset;
        }
    }

    initiateTurn(i) {
        // Set isTurning to true
        this.isTurning = true;

        // Even out the number of right/left turns, or pick at random if they're even
        // this.direction keeps track of which way in the universe we're headed (straight, left, or right)
        let leftRight;
        if (this.leftTurnCount < this.rightTurnCount) {
            leftRight = -1;
            this.leftTurnCount++;
        } else if (this.leftTurnCount > this.rightTurnCount) {
            leftRight = 1;
            this.rightTurnCount++;
        } else {
            leftRight = Math.random() < 0.5 ? -1 : 1;
            if (leftRight === -1) {
                this.leftTurnCount++;
            } else {
                this.rightTurnCount++;
            }
        }
        
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
            if (this.direction === DIRECTION.STRAIGHT) {
                this.chunks[chunkIndex].depthOffset = this.chunks[i].position.z - ((numChunks - (j+1)) * chunkDepth);
            } else if (this.direction === DIRECTION.LEFT) {
                this.chunks[chunkIndex].depthOffset = this.chunks[i].position.x - ((numChunks - (j+1)) * chunkDepth);
            } else if (this.direction === DIRECTION.RIGHT) {
                this.chunks[chunkIndex].depthOffset = this.chunks[i].position.x + ((numChunks - (j+1)) * chunkDepth);
            }
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
                // When the final chunk has been turned, mark that the hero is now moving a new direction in the universe
                this.direction = this.leftTurnCount > this.rightTurnCount ? DIRECTION.LEFT 
                    : this.rightTurnCount > this.leftTurnCount ? DIRECTION.RIGHT 
                    : DIRECTION.STRAIGHT;
            }
        }
    }

    update(timeStamp) {
        // Move each chunk towards the camera
        for (let i = 0; i < numChunks; i++) {
            let chunk = this.chunks[i];

            if (this.direction === DIRECTION.STRAIGHT) {
                chunk.position.z += movementSpeed;
                // If a chunk has moved past the camera, reset its position to the back or turn it
                if (chunk.position.z > chunkDepth) {
                    this.updateChunkPosition(i);
                }
            } else if (this.direction === DIRECTION.LEFT) {
                chunk.position.x += movementSpeed;
                // If a chunk has moved past the camera, reset its position to the back or turn it
                if (chunk.position.x > chunkDepth) {
                    this.updateChunkPosition(i);
                }
            } else if (this.direction === DIRECTION.RIGHT) {
                chunk.position.x -= movementSpeed;
                // If a chunk has moved past the camera, reset its position to the back or turn it
                if (chunk.position.x < -1 * chunkDepth) {
                    this.updateChunkPosition(i);
                }
            } 
        }
    }
}

export default ChunkManager;
