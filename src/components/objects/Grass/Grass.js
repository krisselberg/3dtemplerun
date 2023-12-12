import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';


class Grass extends THREE.Group {
    constructor() {
        super();
        this.loadGrass();
    }

    loadGrass() {
        const loader = new GLTFLoader();
        loader.load(
            './scene.gltf',
            (gltf) => {
                this.add(gltf.scene);
    
                gltf.scene.position.set(0, 0, 0);
                gltf.scene.scale.set(36, 2, 36);
                gltf.scene.rotation.x = Math.PI / 2;
                // gltf.scene.rotation.y = Math.PI / 2;
            },
            undefined,
            function (error) {
                console.error('An error happened', error);
            }
        );
    }

    // get obstacle height
    getHeight() {
        const box = new THREE.Box3().setFromObject(this);
        const size = box.getSize(new THREE.Vector3());
        return size.y;
    }
}

export default Grass;
