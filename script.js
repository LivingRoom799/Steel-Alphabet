const SteelAlphabet = {
    images : new Map(),
    imageWidths : new Map(),
    tokens : new Set(),
    symbols : [
  'a','b','c','d','e','f','g','h','j','k','l','m','n','o','p','r','s','t','v','w','x','y','z']
};

SteelAlphabet.loadImages = function loadImages() {
    return Promise.all(
        SteelAlphabet.symbols.map(symbol =>
            fetch("Steel Alphabet/" + symbol + ".svg")
            .then(response => response.text())
            .then(text => text.replace(/stroke:#[0-9a-fA-F]*;?/g, ''))
            .then(text => text.replace(/stroke-width:[0-9a-zA-Z]*;?/g, ''))
            .then(text => {
                console.log(`SVG content for ${symbol}:`, text);
                return (new window.DOMParser()).parseFromString(text, "text/xml");
            })
            .then(svgNode => {
                const svgElement = svgNode.documentElement;
                if (!svgElement) {
                    console.error(`No root SVG element found in SVG for symbol: ${symbol}`);
                    return;
                }

                // Read width and height attributes
                const width = svgElement.getAttribute("width") || "100"; // Default to 100 if width is missing
                const height = svgElement.getAttribute("height") || "100"; // Default to 100 if height is missing

                SteelAlphabet.images.set(symbol, svgElement);
                SteelAlphabet.imageWidths.set(symbol, parseInt(width));
                console.log(`Loaded SVG for symbol: ${symbol}`);
            })
            .catch(error => console.error(`Failed to load SVG for symbol: ${symbol}`, error))
        )
    ).then(() => {
        console.log("All images loaded.");
    });
}




SteelAlphabet.normalizeInput = function normalizeInput(input) {
    // Convert input to lowercase
    let normalized = input.toLowerCase();
    
    // Replace specific characters according to rules
    normalized = normalized.replace(/i/g, 'e'); // Replace 'i' with 'e'
    normalized = normalized.replace(/u/g, 'o'); // Replace 'u' with 'o'
    normalized = normalized.replace(/ch/g, 'c'); // Replace 'ch' with 'c'

    return normalized;
};

SteelAlphabet.drawString = function drawString(input) {
    const normalized = SteelAlphabet.normalizeInput(input);
    console.log("Normalized text:", normalized);

    const canvas = document.getElementById('outputCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let x = 10; // Starting x position
    let y = 50; // Starting y position

    for (let i = 0; i < normalized.length; i++) {
        const char = normalized[i];
        console.log(`Processing character: ${char}`);

        if (SteelAlphabet.images.has(char)) {
            const svgNode = SteelAlphabet.images.get(char);
            if (!svgNode) {
                console.error(`SVG node is null for character: ${char}`);
                continue;
            }
            const imgWidth = SteelAlphabet.imageWidths.get(char) || 100; // Default width

            const serializer = new XMLSerializer();
            const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${imgWidth}" height="100">${serializer.serializeToString(svgNode)}</svg>`;
            const img = new Image();
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            img.onload = function() {
                ctx.drawImage(img, x, y, imgWidth, 100);
                x += imgWidth + 5;
                URL.revokeObjectURL(url);
            };
            img.src = url;
        } else {
            console.error(`Character '${char}' not found in images.`);
        }
    }
};




window.onload = function() {
    SteelAlphabet.loadImages();
}