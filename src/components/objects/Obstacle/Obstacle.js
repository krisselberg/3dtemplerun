import { BoxGeometry, Mesh, MeshBasicMaterial } from 'three';

class Obstacle extends Mesh {
    constructor(size = 50, color = 0xff0000) {
        // Create the geometry and material for the cube
        const geometry = new BoxGeometry(size, size, size);
        const material = new MeshBasicMaterial({ color });

        // Call the Mesh constructor
        super(geometry, material);

        // Set the initial position of the cube
        this.position.set(0, size / 2, 0); // Adjust as needed
    }
}

export default Obstacle;
