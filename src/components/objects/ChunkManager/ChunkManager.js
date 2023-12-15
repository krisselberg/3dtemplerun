import * as THREE from 'three';
import {
    Group,
    PlaneGeometry,
    Mesh,
    MeshBasicMaterial,
    TextureLoader,
} from 'three';
import Obstacle from '../Obstacle/Obstacle';

const DIRECTION = { LEFT: -1, STRAIGHT: 0, RIGHT: 1 }; // Which way is the hero currently moving in the universe
const chunkPxLength = 10; // Length of the chunk
const chunkPxWidth = 10; // Width of the chunk
const chunkDepth = 10; // Depth of the chunk
// Note: Depth and length are the same so they don't overlap and freak out
const numChunks = 20; // Number of chunks to cycle
const movementSpeed = 0.15; // Speed of movement
const turnProbability = 0.25; // Probability of chunks turning left or right
const chunksBetweenObstacles = 3; //  1/n chunks have an obstacle

class ChunkManager extends Group {
    constructor(parent) {
        super();
        this.name = 'chunkManager';

        // Set the start time of the round only once
        // This is how we handle the movement speed multiplier
        this.startTimeSet = false;

        // Create an array to hold the chunks
        this.chunks = [];

        // To check if chunks are currently being turned or if they're
        // just going straight
        // False is going straight
        this.isTurning = false;

        // For ensuring we're never turned around
        this.leftTurnCount = 0;
        this.rightTurnCount = 0;
        this.canTurnLeft = false;
        this.canTurnRight = false;

        // For knowing which way the hero is moving in the universe
        this.direction = DIRECTION.STRAIGHT;

        // Create a texture loader
        this.textureLoader = new TextureLoader();

        // Load the grass texture
        this.grassTexture = this.textureLoader.load('grass.jpeg');

        // Initialize chunks
        for (let i = 0; i < numChunks; i++) {
            // create a chunk that is long but thin
            // addObstacleFlag is such that every nth chunk has an obstacle
            let addObstacleFlag = false;
            if (i !== 0 && i % chunksBetweenObstacles === 0) {
                addObstacleFlag = true;
            }
            this.createChunk(-i * chunkDepth - chunkDepth, addObstacleFlag);
        }

        // Add self to parent's update list
        parent.addToUpdateList(this);
    }

    createChunk(zPosition, addObstacleFlag) {
        // Create the geometry and material for the chunk
        const geometry = new PlaneGeometry(chunkPxWidth, chunkPxLength, 10, 10);
        const material = new MeshBasicMaterial({ map: this.grassTexture });
        const chunk = new Mesh(geometry, material);

        // Default this value to false
        chunk.lastChunkInTurn = false;

        // Rotate the chunk to lie flat
        chunk.rotation.x = -Math.PI / 2;
        chunk.position.z = zPosition;

        // Attach the obstacle to the chunk
        if (addObstacleFlag) {
            // Add obstacle to each chunk
            const obstacle = new Obstacle(); // Now automatically determines its size and type

            // Random position within the chunk
            const positionRange = chunkPxWidth * 0.2;
            obstacle.position.x =
                Math.random() * positionRange - positionRange / 2;

            // get obstacle height and position z so the bottom of obstacle is on ground
            const obstacleHeight = obstacle.getHeight();
            obstacle.position.z = obstacleHeight / 2;
            chunk.add(obstacle);
        }

        // Add the chunk to the scene and to the chunks array
        this.add(chunk);
        this.chunks.push(chunk);
    }

    sendChunkToBack(chunk) {
        // add obstacle to chunk if corner chunk
        if (this.direction === DIRECTION.STRAIGHT) {
            chunk.position.z -= numChunks * chunkDepth;
        } else if (this.direction === DIRECTION.LEFT) {
            chunk.position.x -= numChunks * chunkDepth;
        } else if (this.direction === DIRECTION.RIGHT) {
            chunk.position.x += numChunks * chunkDepth;
        }
        // TODO: Add back obstacle on corner block?
    }

    turnSingleChunk(chunk) {
        // Send chunk towards the back, to the z value of the chunk that initiated the turn
        if (this.direction === DIRECTION.STRAIGHT) {
            chunk.position.z = chunk.depthOffset;
        } else {
            // Right or Left
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

        // After the first turn, the pace the player is moving will steadily get faster
        if (this.startTimeSet === false) {
            // For having the speed get faster over time
            this.startTime = Date.now();
            this.startTimeSet = true;
        }

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
            let cornerChunkIndex = (i + j - 1 + numChunks) % numChunks;
            let previousChunkIndex = (i + j - 2 + numChunks) % numChunks;
            this.chunks[chunkIndex].turnOffset =
                leftRight * (j + 1) * chunkPxWidth;
            // set canTurnLeft and canTurnRight on the previous chunk depending on the leftRight (WORKS)
            if (leftRight === -1 && j === 0) {
                this.chunks[cornerChunkIndex].isCorner = true; // set isCorner to true to check for missing turn
                this.chunks[previousChunkIndex].canTurnLeft = true;
                this.chunks[previousChunkIndex].canTurnRight = false;
            } else if (leftRight === 1 && j === 0) {
                this.chunks[cornerChunkIndex].isCorner = true; // set isCorner to true to check for missing turn
                this.chunks[previousChunkIndex].canTurnLeft = false;
                this.chunks[previousChunkIndex].canTurnRight = true;
            }

            // This is what allows us to put each turned chunk next to each other in the z-axis
            // This is necessary because the origin is changing as the camera moves forward in the z-axis,
            // so when we move the first chunk, we have to move it forward (numChunks - 1) units, and when we move
            // the final chunk, we just have to move it forward 1 unit.
            if (this.direction === DIRECTION.STRAIGHT) {
                this.chunks[chunkIndex].depthOffset =
                    this.chunks[i].position.z -
                    (numChunks - (j + 1)) * chunkDepth;
            } else if (this.direction === DIRECTION.LEFT) {
                this.chunks[chunkIndex].depthOffset =
                    this.chunks[i].position.x -
                    (numChunks - (j + 1)) * chunkDepth;
            } else if (this.direction === DIRECTION.RIGHT) {
                this.chunks[chunkIndex].depthOffset =
                    this.chunks[i].position.x +
                    (numChunks - (j + 1)) * chunkDepth;
            }
        }
        // Delete obstacles from corner chunk (one before the last chunk in the turn)
        let cornerChunkIndex = (i - 1 + numChunks) % numChunks;
        let cornerChunk = this.chunks[cornerChunkIndex];
        // if corner chunk has obstacle, set cornerHadObstacle to true
        console.log(cornerChunk.children);
        if (cornerChunk.children.length > 0) {
            cornerChunk.cornerHadObstacle = true;
        }
        cornerChunk.children = cornerChunk.children.filter(
            (child) => !(child instanceof Obstacle)
        );

        // Turn this single chunk
        this.turnSingleChunk(this.chunks[i]);

        // Mark the last chunk in the turn (so we know when the turn is over)
        this.chunks[(i - 2 + numChunks) % numChunks].lastChunkInTurn = true;
    }

    updateChunkPosition(i) {
        let chunk = this.chunks[i];

        // If you're not in the process of turning, either send the chunk to the back or initiate a turn
        if (!this.isTurning) {
            if (Math.random() < turnProbability) {
                // Initiate a turn
                this.initiateTurn(i);
            } else {
                // Just send the chunk to the back
                this.sendChunkToBack(chunk);
            }
        } else {
            // If you are in the process of turning, turn the individual chunk
            this.turnSingleChunk(chunk);

            // If it is the last chunk to be turned, set isTurning to false
            if (chunk.lastChunkInTurn === true) {
                this.isTurning = false;
                chunk.lastChunkInTurn = false;
                // When the final chunk has been turned, mark that the hero is now moving a new direction in the universe
                this.direction =
                    this.leftTurnCount > this.rightTurnCount
                        ? DIRECTION.LEFT
                        : this.rightTurnCount > this.leftTurnCount
                        ? DIRECTION.RIGHT
                        : DIRECTION.STRAIGHT;
            }
        }
    }

    updateChunkTurn(i) {
        let chunk = this.chunks[i];

        // If it is the chunk before the last chunk to be turned, set the canTurnLeft or canTurnRight flag
        if (chunk.canTurnLeft == true) {
            this.canTurnLeft = true;
        } else if (chunk.canTurnRight == true) {
            this.canTurnRight = true;
        } else if (chunk.isCorner == true) {
            this.isCorner = true;
        } else {
            this.canTurnLeft = false;
            this.canTurnRight = false;
            this.isCorner = false;
        }
    }

    update(timeStamp) {
        // Calculate the movement speed multiplier.
        let movementSpeedMultiplier = 1;
        if (this.startTime) {
            // Only starts increasing after the first turn (when startTime is set)
            // It starts at 1x speed, then increases until you reach
            // 3x speed at 90 seconds, then it stays there.
            let elapsedTime = (Date.now() - this.startTime) / 1000; // Time in seconds
            if (elapsedTime < 60) {
                // Gradually increase from 1x speed to 3x speed over 90 seconds
                movementSpeedMultiplier = 1 + 2 * (elapsedTime / 90);
            } else {
                // After 90 seconds, keep it constant at 3
                movementSpeedMultiplier = 3;
            }
        }

        // Move each chunk towards the camera
        for (let i = 0; i < numChunks; i++) {
            let chunk = this.chunks[i];

            if (this.direction === DIRECTION.STRAIGHT) {
                chunk.position.z += movementSpeed * movementSpeedMultiplier;
                // If a chunk has moved past the camera, reset its position to the back or turn it
                // In world coordinates, if a chunk has moved past the camera at 0,0,0, we call updateChunkTurn
                if (chunk.position.z > chunkDepth) {
                    this.updateChunkPosition(i);
                } else if (chunk.position.z > 0) {
                    this.updateChunkTurn(i);
                }
            } else if (this.direction === DIRECTION.LEFT) {
                chunk.position.x += movementSpeed * movementSpeedMultiplier;
                // If a chunk has moved past the camera, reset its position to the back or turn it
                // If a player is on a chunk, updateChunkTurn
                if (chunk.position.x > chunkDepth) {
                    this.updateChunkPosition(i);
                } else if (chunk.position.x > 0) {
                    this.updateChunkTurn(i);
                }
            } else if (this.direction === DIRECTION.RIGHT) {
                chunk.position.x -= movementSpeed * movementSpeedMultiplier;
                // If a chunk has moved past the camera, reset its position to the back or turn it
                if (chunk.position.x < -1 * chunkDepth) {
                    this.updateChunkPosition(i);
                } else if (chunk.position.x < 0) {
                    this.updateChunkTurn(i);
                }
            }
        }
    }
}

export default ChunkManager;
