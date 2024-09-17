const SteelAlphabet = {
    images: new Map(),
    imageWidths: new Map(),
    symbols: [
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'r', 's', 't', 'v', 'w', 'x', 'y', 'z', ' ' // added space
    ],
    spaceWidth: 20 
};


SteelAlphabet.loadImages = function loadImages() {
    return Promise.all(
        SteelAlphabet.symbols.map(symbol =>
            fetch("Steel Alphabet/" + symbol + ".svg")
                .then(response => response.text())
                .then(text => text.replace(/stroke:#[0-9a-fA-F]*;?/g, ''))
                .then(text => text.replace(/stroke-width:[0-9a-zA-Z]*;?/g, ''))
                .then(text => {
                    return (new window.DOMParser()).parseFromString(text, "text/xml");
                })
                .then(svgNode => {
                    const svgElement = svgNode.documentElement;
                    if (!svgElement) {
                        console.error(`No root SVG element found in SVG for symbol: ${symbol}`);
                        return;
                    }
                    SteelAlphabet.images.set(symbol, svgElement);
                    const width = parseInt(svgElement.getAttribute("width")) || 100;
                    SteelAlphabet.imageWidths.set(symbol, width);
                })
        )
    );
};

// Normalize input and apply character replacements
SteelAlphabet.normalizeInput = function normalizeInput(input) {
    let normalized = input.toLowerCase();
    normalized = normalized.replace(/i/g, 'e');
    normalized = normalized.replace(/u/g, 'o');
    normalized = normalized.replace(/ch/g, 'c');
    return normalized;
};


SteelAlphabet.expandCanvasIfNeeded = function expandCanvasIfNeeded(ctx, width, height) {
    const canvas = ctx.canvas;


    if (width > canvas.width || height > canvas.height) {
        const newWidth = Math.max(width, canvas.width);
        const newHeight = Math.max(height, canvas.height);
        
        // Resize the canvas and preserve content
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = newWidth;
        tempCanvas.height = newHeight;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(canvas, 0, 0);

        // Set new canvas dimensions
        canvas.width = newWidth;
        canvas.height = newHeight;

        // Restore the preserved content
        ctx.drawImage(tempCanvas, 0, 0);
    }
};


SteelAlphabet.drawString = function drawString(input) {
    const normalized = SteelAlphabet.normalizeInput(input);
    const canvas = document.getElementById('outputCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let x = 10; // Starting x position
    let y = 50; // Starting y position
    const lineHeight = 100;
    const symbolSpacing = 5; // Reduced symbol spacing

    // Iterate over normalized input
    for (let i = 0; i < normalized.length; i++) {
        const char = normalized[i];

        if (SteelAlphabet.images.has(char)) {
            const svgNode = SteelAlphabet.images.get(char);
            const imgWidth = SteelAlphabet.imageWidths.get(char) || 100;

            const serializer = new XMLSerializer();
            const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${imgWidth}" height="${lineHeight}">${serializer.serializeToString(svgNode)}</svg>`;
            const img = new Image();
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            img.onload = function () {
                SteelAlphabet.expandCanvasIfNeeded(ctx, x + imgWidth, y + lineHeight);
                ctx.drawImage(img, x, y, imgWidth, lineHeight);
                x += imgWidth + symbolSpacing; // Move x position for the next symbol
                URL.revokeObjectURL(url);
            };
            img.src = url;
        } else if (char === ' ') {
            // Handle spaces by adding a gap
            x += SteelAlphabet.spaceWidth;
        }

        // Check if the current x position exceeds canvas width; move to the next line if needed
        if (x > canvas.width - 100) { // Leave 100px padding
            x = 10; // Reset x to the start of the new line
            y += lineHeight + symbolSpacing; // Move y to the next line
        }
    }
};

window.onload = function () {
    SteelAlphabet.loadImages();
};
