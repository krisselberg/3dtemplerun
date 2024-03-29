import { Group, SpotLight, AmbientLight, HemisphereLight } from 'three';

class BasicLights extends Group {
    constructor(...args) {
        // Invoke parent Group() constructor with our args
        super(...args);

        const dir = new SpotLight(0xffffff, 1.6, 7, 0.8, 1, 1);
        const ambi = new AmbientLight(0x404040, 1.32);
        const hemi = new HemisphereLight(0xffffbb, 0x080820, 2.3);

        dir.position.set(5, 1, 2);
        dir.target.position.set(0, 0, 0);

        const dir2 = new SpotLight(0xffffff, 1.6, 7, 0.8, 1, 1);
        const dir3 = new SpotLight(0xffffff, 1.6, 7, 0.8, 1, 1);

        dir2.position.set(-5, 1, 2);
        dir2.target.position.set(0, 0, 0);

        dir3.position.set(0, 6, 2);
        dir3.target.position.set(0, 0, 0);

        this.add(ambi, hemi, dir, dir2, dir3);
    }
}

export default BasicLights;
