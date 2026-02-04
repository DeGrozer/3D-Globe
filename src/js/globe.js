class GlobeRenderer {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.globe = null;
        this.highlight = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.selectedCountry = null;
        this.isAnimating = false;
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
        this.controls.dampingFactor = 0.08;
        this.controls.rotateSpeed = 0.5;
        this.controls.minDistance = 1.5;
        this.controls.maxDistance = 4;
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
        this.createHighlight();
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

    createHighlight() {
        // Subtle glow ring for selected country
        const geometry = new THREE.RingGeometry(0.03, 0.05, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        this.highlight = new THREE.Mesh(geometry, material);
        this.highlight.visible = false;
        this.scene.add(this.highlight);
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
        // Convert 3D point to lat/lon - must match the inverse of showHighlight formula
        const r = CONFIG.globe.radius;
        
        // Reverse of: y = r * cos(phi) where phi = (90 - lat) in radians
        const phi = Math.acos(point.y / r);
        const lat = 90 - phi * (180 / Math.PI);
        
        // Reverse of: x = -r * sin(phi) * cos(theta), z = r * sin(phi) * sin(theta)
        // where theta = (lon + 180) in radians
        const theta = Math.atan2(point.z, -point.x);
        const lon = theta * (180 / Math.PI) - 180;

        let closest = null;
        let minDist = Infinity;

        for (const [code, coords] of Object.entries(COUNTRY_COORDS)) {
            const dLat = lat - coords.lat;
            let dLon = lon - coords.lon;
            // Handle wraparound for longitude
            if (dLon > 180) dLon -= 360;
            if (dLon < -180) dLon += 360;
            const dist = Math.sqrt(dLat * dLat + dLon * dLon);
            if (dist < minDist && dist < 15) {
                minDist = dist;
                closest = { code, name: COUNTRY_NAMES[code] };
            }
        }
        return closest;
    }

    selectCountry(code, name, clickPoint) {
        if (this.isAnimating) return;
        this.selectedCountry = code;
        this.controls.autoRotate = false;

        const coords = COUNTRY_COORDS[code];
        if (coords) {
            this.showHighlight(coords.lat, coords.lon);
            this.smoothPanToCountry(coords.lat, coords.lon);
        }

        Panel.showCountry(code, name);
    }

    showHighlight(lat, lon) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        const r = CONFIG.globe.radius + 0.005;

        const x = -r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.cos(phi);
        const z = r * Math.sin(phi) * Math.sin(theta);

        this.highlight.position.set(x, y, z);
        this.highlight.lookAt(0, 0, 0);
        this.highlight.visible = true;
    }

    smoothPanToCountry(lat, lon) {
        this.isAnimating = true;
        
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        const dist = this.camera.position.length(); // Keep current zoom level

        const targetPos = new THREE.Vector3(
            -dist * Math.sin(phi) * Math.cos(theta),
            dist * Math.cos(phi),
            dist * Math.sin(phi) * Math.sin(theta)
        );

        const startPos = this.camera.position.clone();
        const duration = 1500; // Slower, smoother
        const startTime = Date.now();

        const animateCamera = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Smooth ease-in-out curve
            const eased = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            this.camera.position.lerpVectors(startPos, targetPos, eased);
            this.camera.lookAt(0, 0, 0);

            if (progress < 1) {
                requestAnimationFrame(animateCamera);
            } else {
                this.isAnimating = false;
            }
        };
        animateCamera();
    }

    clearSelection() {
        this.selectedCountry = null;
        this.controls.autoRotate = true;
        this.highlight.visible = false;
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.highlight && this.highlight.visible) {
            // Subtle pulse effect
            const scale = 1 + Math.sin(Date.now() * 0.003) * 0.1;
            this.highlight.scale.set(scale, scale, scale);
        }
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}
