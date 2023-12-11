import { BoxGeometry, CylinderGeometry, Mesh, MeshBasicMaterial } from 'three';

class Obstacle extends Mesh {
    constructor() {
        // Randomly choose the type of obstacle - cube or tree stump
        const isCube = Math.random() > 0.5;

        // Cube geometry and size
        const cubeSize = 1;
        const cubeGeometry = new BoxGeometry(cubeSize, cubeSize, cubeSize);

        // Tree stump geometry and size
        const stumpRadius = 4;
        const stumpHeight = 6;
        const stumpGeometry = new CylinderGeometry(
            stumpRadius,
            stumpRadius,
            stumpHeight,
            4
        );

        // Select geometry based on random choice
        const geometry = isCube ? cubeGeometry : stumpGeometry;

        // Random color for the obstacle
        const color = Math.random() * 0xffffff;
        const material = new MeshBasicMaterial({ color });

        // Call the Mesh constructor
        super(geometry, material);

        // Set the initial position of the obstacle
        if (isCube) {
            this.position.set(0, 0, 0); // For cube
        } else {
            this.position.set(0, 0, 0); // For tree stump
        }
    }
}

export default Obstacle;
