#  Globe 3D Render

A beautiful, interactive 3D globe visualization built with **Three.js**. Features realistic Earth textures, atmospheric glow, and smooth WebGL rendering. Perfect for displaying country data, statistics, or any geographical information.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-2.0.0-green.svg)
![Three.js](https://img.shields.io/badge/Three.js-r128-orange.svg)

##  Features

- **WebGL 3D Globe** - Smooth, hardware-accelerated rendering
- **Realistic Earth Textures** - Blue marble texture with bump mapping
- **Atmospheric Glow** - Beautiful shader-based atmosphere effect
- **Country Borders** - TopoJSON-based country boundary lines
- **Interactive Controls** - Orbit controls with drag, zoom, and auto-rotation
- **Country Selection** - Click countries to view detailed information
- **Info Cards** - Display data in a sleek side panel with flags
- **Responsive Design** - Works on desktop and mobile

##  Quick Start

### Prerequisites

- Modern web browser with WebGL support
- Local web server (or use included method)

### Installation

1. **Clone or download** this repository

2. **Start a local server**:
   ```bash
   # Using Node.js
   npx http-server src -p 8080
   
   # Or using Python
   python -m http.server 8080 --directory src
   ```

3. **Open in browser**: Navigate to `http://localhost:8080`

##  Project Structure

```
globe-3d-render/
 src/
    index.html          # Main HTML file
    assets/
       data/
           world-110m.json  # TopoJSON world map
    css/
       main.css        # Global styles
       cards.css       # Info card styles
       globe.css       # Globe container styles
    js/
        app.js          # Entry point & API
        config.js       # Configuration
        data.js         # Country data & mappings
        globe.js        # Three.js globe renderer
        utils.js        # Helper functions
 package.json
 LICENSE
 CONTRIBUTING.md
 README.md
```

##  Configuration

Edit `src/js/config.js` to customize:

```javascript
const CONFIG = {
    globe: {
        radius: 2,
        segments: 64,
        autoRotate: true,
        
        colors: {
            ocean: 0x1a4a7a,      // Deep blue
            land: 0x3d5a3d,       // Forest green
            selected: 0xffd700,   // Gold
            hover: 0x6bba6b,      // Light green
            atmosphere: 0x4a9eff  // Blue glow
        },
        
        camera: {
            fov: 45,
            distance: 6
        }
    },
    
    paths: {
        earthTexture: 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
        bumpMap: 'https://unpkg.com/three-globe/example/img/earth-topology.png'
    }
};
```

##  API Integration

### Using Custom Data

Override the API functions in `src/js/app.js`:

```javascript
const API = {
    async fetchCountryData(countryCode) {
        const response = await fetch(`/api/country/${countryCode}`);
        return response.json();
    }
};
```

### Data Format

The info card expects data in this format:

```javascript
{
    population: '331M',
    area: '9.8M',
    gdp: '25,460',
    capital: 'Washington D.C.',
    currency: 'USD',
    language: 'English'
}
```

##  Customization

### Custom Earth Textures

Replace the texture URLs in `config.js`:

```javascript
paths: {
    earthTexture: '/path/to/your/earth-texture.jpg',
    bumpMap: '/path/to/your/bump-map.png'
}
```

### Changing Colors

Update the `colors` object in `config.js` (use hex values):

```javascript
colors: {
    ocean: 0x1a4a7a,
    land: 0x3d5a3d,
    selected: 0xffd700
}
```

##  Development

```bash
npm install
npm start
```

##  Dependencies

- [Three.js r128](https://threejs.org/) - WebGL 3D library
- [OrbitControls](https://threejs.org/docs/#examples/en/controls/OrbitControls) - Camera controls
- [TopoJSON](https://github.com/topojson/topojson) - Geographic data (embedded)
- [FlagCDN](https://flagcdn.com/) - Country flags

##  Texture Credits

- Earth textures from [Three Globe](https://github.com/vasturiano/three-globe)
- World map data from [Natural Earth](https://www.naturalearthdata.com/)

##  Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

##  License

MIT License - see [LICENSE](LICENSE) for details.

---

**Made with  using Three.js**
