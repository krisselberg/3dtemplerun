import * as Dat from 'dat.gui';
import { Scene, Color } from 'three';
import { Person } from 'objects';
import { BasicLights } from 'lights';
import { ChunkManager } from 'objects';
import { Obstacle } from 'objects';

class SeedScene extends Scene {
    constructor() {
        // Call parent Scene() constructor
        super();

        // Init state
        this.state = {
            gui: new Dat.GUI(), // Create GUI for scene
            rotationSpeed: 0,
            updateList: [],
        };

        // Set background to a nice color
        this.background = new Color(0x000000);

        // Add meshes to scene
        const chunkManager = new ChunkManager(this); // Create ChunkManager instance
        const person = new Person(this);
        const lights = new BasicLights();
        this.add(chunkManager, person, lights);

        // Populate GUI
        this.state.gui.add(this.state, 'rotationSpeed', -5, 5);

        this.isGameRunning = true;
        this.setupRestartButton();
    }

    addToUpdateList(object) {
        this.state.updateList.push(object);
    }

    update(timeStamp) {
        if (!this.isGameRunning) {
            return; // Stop the update loop if the game is not running
        }

        const { rotationSpeed, updateList } = this.state;
        this.rotation.y = (rotationSpeed * timeStamp) / 10000;

        // Call update for each object in the updateList
        for (const obj of updateList) {
            obj.update(timeStamp);
        }

        // Collision detection
        const person = this.children.find((child) => child instanceof Person);
        const personBoundingBox = person.getBoundingBox();
        // Get all chunks from ChunkManager
        const chunks = this.children
            .filter((child) => child instanceof ChunkManager)
            .flatMap((chunkManager) => chunkManager.chunks);

        // Find all obstacles in the chunks
        const obstacles = chunks.flatMap((chunk) =>
            chunk.children.filter((child) => child instanceof Obstacle)
        );

        for (const obstacle of obstacles) {
            const obstacleBoundingBox = obstacle.getBoundingBox();
            if (
                personBoundingBox &&
                obstacleBoundingBox &&
                personBoundingBox.intersectsBox(obstacleBoundingBox)
            ) {
                this.onGameOver();
                // Additional actions on collision
                break; // Optional: stop checking further if collision is detected
            }
        }
    }

    onGameOver() {
        console.log('Game Over');
        this.isGameRunning = false; // Stop the game

        // Display the game over overlay
        const overlay = document.getElementById('gameOverOverlay');
        console.log(overlay);
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }

    setupRestartButton() {
        document.addEventListener('DOMContentLoaded', () => {
            const restartButton = document.getElementById('restartButton');
            if (restartButton) {
                restartButton.addEventListener('click', () => {
                    this.restartGame();
                });
            }
        });
    }

    restartGame() {
        console.log('Restarting game...');

        // Reload the entire webpage
        window.location.reload();
    }
}

export default SeedScene;
