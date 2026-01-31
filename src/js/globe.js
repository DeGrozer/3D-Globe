class GlobeRenderer {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.globe = null;
        this.marker = null;
        this.markerRing = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.selectedCountry = null;
        this.init();
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = CONFIG.globe.camera.distance;

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 1.2;
        this.controls.maxDistance = 3;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.3;
        this.controls.enablePan = false;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(5, 3, 5);
        this.scene.add(directionalLight);

        const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
        backLight.position.set(-5, -3, -5);
        this.scene.add(backLight);

        this.createGlobe();
        this.createMarker();
        this.addEventListeners();
        this.animate();
    }

    createGlobe() {
        const textureLoader = new THREE.TextureLoader();
        const geometry = new THREE.SphereGeometry(CONFIG.globe.radius, 128, 128);

        const earthTexture = textureLoader.load(CONFIG.textures.earth);
        const bumpTexture = textureLoader.load(CONFIG.textures.bump);
        const specularTexture = textureLoader.load(CONFIG.textures.specular);

        earthTexture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();

        const material = new THREE.MeshPhongMaterial({
            map: earthTexture,
            bumpMap: bumpTexture,
            bumpScale: 0.02,
            specularMap: specularTexture,
            specular: new THREE.Color(0x222222),
            shininess: 8
        });

        this.globe = new THREE.Mesh(geometry, material);
        this.scene.add(this.globe);
    }

    createMarker() {
        const ringGeometry = new THREE.RingGeometry(0.06, 0.08, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xffd700, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
        this.markerRing = new THREE.Mesh(ringGeometry, ringMaterial);
        this.markerRing.visible = false;
        this.scene.add(this.markerRing);

        const dotGeometry = new THREE.SphereGeometry(0.02, 16, 16);
        const dotMaterial = new THREE.MeshBasicMaterial({ color: 0xffd700 });
        this.marker = new THREE.Mesh(dotGeometry, dotMaterial);
        this.marker.visible = false;
        this.scene.add(this.marker);
    }

    addEventListeners() {
        window.addEventListener('resize', () => this.onResize());
        this.renderer.domElement.addEventListener('click', (e) => this.onClick(e));
        this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onClick(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.globe);

        if (intersects.length > 0) {
            const point = intersects[0].point;
            const countryInfo = this.getCountryFromPoint(point);
            if (countryInfo) {
                this.selectCountry(countryInfo.code, countryInfo.name, point);
            }
        }
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.globe);

        if (intersects.length > 0) {
            const point = intersects[0].point;
            const countryInfo = this.getCountryFromPoint(point);
            if (countryInfo) {
                Tooltip.show(countryInfo.name, event.clientX, event.clientY);
                this.container.style.cursor = 'pointer';
            } else {
                Tooltip.hide();
                this.container.style.cursor = 'grab';
            }
        } else {
            Tooltip.hide();
            this.container.style.cursor = 'default';
        }
    }

    getCountryFromPoint(point) {
        const lat = 90 - (Math.acos(point.y / CONFIG.globe.radius)) * 180 / Math.PI;
        const lon = ((270 + (Math.atan2(point.x, point.z)) * 180 / Math.PI) % 360) - 180;

        let closest = null;
        let minDist = Infinity;

        for (const [code, coords] of Object.entries(COUNTRY_COORDS)) {
            const dist = Math.sqrt(Math.pow(lat - coords.lat, 2) + Math.pow(lon - coords.lon, 2));
            if (dist < minDist && dist < 20) {
                minDist = dist;
                closest = { code, name: COUNTRY_NAMES[code] };
            }
        }
        return closest;
    }

    selectCountry(code, name, clickPoint) {
        this.selectedCountry = code;
        this.controls.autoRotate = false;

        const coords = COUNTRY_COORDS[code];
        if (coords) {
            this.showMarker(coords.lat, coords.lon);
            this.rotateToCountry(coords.lat, coords.lon);
        }

        Panel.showCountry(code, name);
    }

    showMarker(lat, lon) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        const r = CONFIG.globe.radius + 0.01;

        const x = -r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.cos(phi);
        const z = r * Math.sin(phi) * Math.sin(theta);

        this.marker.position.set(x, y, z);
        this.marker.visible = true;

        this.markerRing.position.set(x, y, z);
        this.markerRing.lookAt(0, 0, 0);
        this.markerRing.visible = true;
    }

    rotateToCountry(lat, lon) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        const dist = CONFIG.globe.camera.distance;

        const targetPos = new THREE.Vector3(
            -dist * Math.sin(phi) * Math.cos(theta),
            dist * Math.cos(phi),
            dist * Math.sin(phi) * Math.sin(theta)
        );

        const startPos = this.camera.position.clone();
        const duration = 1000;
        const startTime = Date.now();

        const animateCamera = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            this.camera.position.lerpVectors(startPos, targetPos, eased);
            this.camera.lookAt(0, 0, 0);

            if (progress < 1) {
                requestAnimationFrame(animateCamera);
            }
        };
        animateCamera();
    }

    clearSelection() {
        this.selectedCountry = null;
        this.controls.autoRotate = true;
        this.marker.visible = false;
        this.markerRing.visible = false;
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.markerRing && this.markerRing.visible) {
            this.markerRing.rotation.z += 0.02;
        }
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}
