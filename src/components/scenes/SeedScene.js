import * as Dat from 'dat.gui';
import { Audio, Scene, Color, AudioListener, AudioLoader } from 'three';
import { Person } from 'objects';
import { BasicLights } from 'lights';
import { ChunkManager } from 'objects';
import { Obstacle } from 'objects';

class SeedScene extends Scene {
    constructor(characterCamera) {
        // Call parent Scene() constructor
        super();

        // Init state
        this.state = {
            // gui: new Dat.GUI(), // Create GUI for scene
            updateList: [],
        };

        // Set background to a nice color
        this.background = new Color(0x000000);

        // Add meshes to scene
        const chunkManager = new ChunkManager(this); // Create ChunkManager instance
        this.listener = new AudioListener();
        // Load and set up the death sound
        this.setupDeathSound();

        // camera
        const camera = characterCamera;

        const person = new Person(this, this.listener, chunkManager, camera);
        const lights = new BasicLights();
        this.add(chunkManager, person, lights);

        this.isGameRunning = true;
        this.setupRestartButton();

        this.startTime = Date.now();
        this.score = 0;
        this.scoreElement = document.getElementById('scoreElement');
    }

    setupDeathSound() {
        // Create an audio player for the death sound
        this.deathSound = new Audio(this.listener);
        const audioLoader = new AudioLoader();
        audioLoader.load('aaaaah.m4a', (buffer) => {
            this.deathSound.setBuffer(buffer);
            this.deathSound.setVolume(0.5); // Set volume as needed
        });
    }

    addToUpdateList(object) {
        this.state.updateList.push(object);
    }

    update(timeStamp) {
        if (!this.isGameRunning) {
            return; // Stop the update loop if the game is not running
        }

        const { updateList } = this.state;
        // this.rotation.y = (timeStamp) / 10000;

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

        // Update score based on elapsed time
        this.score = Math.floor((Date.now() - this.startTime) / 1000);
        if (this.scoreElement) {
            this.scoreElement.textContent = `Score: ${this.score}`;
        }
    }

    onGameOver() {
        if (this.deathSound && !this.deathSound.isPlaying) {
            this.deathSound.play();
        }
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
