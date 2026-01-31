async function fetchWikipedia(countryName) {
    try {
        const url = CONFIG.wikipedia.baseUrl + encodeURIComponent(countryName);
        const response = await fetch(url);
        if (!response.ok) return null;
        return await response.json();
    } catch (e) {
        console.error('Wikipedia fetch error:', e);
        return null;
    }
}

async function fetchCountryData(countryName) {
    try {
        const url = 'https://restcountries.com/v3.1/name/' + encodeURIComponent(countryName) + '?fullText=true';
        const response = await fetch(url);
        if (!response.ok) return null;
        const data = await response.json();
        return data[0] || null;
    } catch (e) {
        console.error('REST Countries fetch error:', e);
        return null;
    }
}

function formatNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toString();
}

function latLonToVector3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    );
}
