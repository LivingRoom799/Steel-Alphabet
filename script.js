const SteelAlphabet = {
    images: new Map(),
    imageWidths: new Map(),
    symbols: [
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'r', 's', 't', 'v', 'w', 'x', 'y', 'z', ' '
    ],
    spaceWidth: 20,
    lineHeight: 100,
    symbolSpacing: 5,
};

// Load SVG images and store their widths
SteelAlphabet.loadImages = function loadImages() {
    return Promise.all(
        SteelAlphabet.symbols.map(symbol =>
            fetch("Steel Alphabet/" + symbol + ".svg")
                .then(response => response.text())
                .then(text => text.replace(/stroke:#[0-9a-fA-F]*;?/g, ''))
                .then(text => text.replace(/stroke-width:[0-9a-zA-Z]*;?/g, ''))
                .then(text => {
                    const svgNode = (new window.DOMParser()).parseFromString(text, "text/xml");
                    const svgElement = svgNode.documentElement;
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

// Tokenize the input to map characters to symbols
SteelAlphabet.tokenizeInput = function tokenizeInput(input) {
    const tokens = [];
    const normalized = SteelAlphabet.normalizeInput(input);

    for (let i = 0; i < normalized.length; i++) {
        const char = normalized[i];
        if (SteelAlphabet.images.has(char)) {
            tokens.push(char);
        } else if (char === ' ') {
            tokens.push(' '); // Handle spaces as tokens
        }
    }

    return tokens;
};

// Calculate the required canvas width and height
SteelAlphabet.calculateCanvasSize = function calculateCanvasSize(tokens) {
    let totalWidth = 0;
    let totalHeight = 0;

    let x = 10;
    let y = 50;
    const lineHeight = SteelAlphabet.lineHeight;
    const symbolSpacing = SteelAlphabet.symbolSpacing;

    // Iterate over tokens to calculate width and height
    for (let token of tokens) {
        if (token !== ' ') {
            const imgWidth = SteelAlphabet.imageWidths.get(token) || 100;

            // Add image width to total width
            totalWidth = Math.max(totalWidth, x + imgWidth);
            x += imgWidth + symbolSpacing;

            // Move to the next line if it exceeds a fixed width limit
            if (x > 1000) { // Example: max width of 1000px
                x = 10;
                y += lineHeight + symbolSpacing;
            }
        } else {
            x += SteelAlphabet.spaceWidth; // Handle space width
        }

        // Track the height as we add lines
        totalHeight = Math.max(totalHeight, y + lineHeight);
    }

    return { width: totalWidth, height: totalHeight };
};

// Resize the canvas based on calculated width and height
SteelAlphabet.resizeCanvas = function resizeCanvas(ctx, width, height) {
    const canvas = ctx.canvas;
    canvas.width = width;
    canvas.height = height;
};

SteelAlphabet.drawString = function drawString(input) {
    const tokens = SteelAlphabet.tokenizeInput(input);
    const { width, height } = SteelAlphabet.calculateCanvasSize(tokens);

    const canvas = document.getElementById('outputCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Resize the canvas to fit the content
    SteelAlphabet.resizeCanvas(ctx, width, height);

    let x = 10;
    let y = 50;
    const lineHeight = SteelAlphabet.lineHeight;
    const symbolSpacing = SteelAlphabet.symbolSpacing;
    const spaceWidth = SteelAlphabet.spaceWidth;

    // First, pre-calculate the x and y positions for each token
    const positions = [];
    for (let token of tokens) {
        if (token !== ' ') {
            const imgWidth = SteelAlphabet.imageWidths.get(token) || 100;

            // Store the position and token in the array
            positions.push({ token, x, y });

            // Update x position after placing the token
            x += imgWidth + symbolSpacing;

            // Move to next line if the x position exceeds canvas width
            if (x > canvas.width - 100) {
                x = 10;
                y += lineHeight + symbolSpacing;
            }
        } else {
            // Handle spaces by just updating the x position
            x += spaceWidth;

            // Check if we need to move to the next line after adding space
            if (x > canvas.width - 100) {
                x = 10;
                y += lineHeight + symbolSpacing;
            }
        }
    }

    // Now, render the images at the pre-calculated positions
    for (let position of positions) {
        const token = position.token;
        const svgNode = SteelAlphabet.images.get(token);
        const imgWidth = SteelAlphabet.imageWidths.get(token) || 100;

        const serializer = new XMLSerializer();
        const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${imgWidth}" height="${lineHeight}">${serializer.serializeToString(svgNode)}</svg>`;
        const img = new Image();
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        // Draw the image at the pre-calculated x and y position
        img.onload = function () {
            ctx.drawImage(img, position.x, position.y, imgWidth, lineHeight);
            URL.revokeObjectURL(url); // Clean up the object URL after drawing
        };

        img.src = url; // Trigger the image loading
    }
};




// When the window loads, load images and set up event handlers
window.onload = function () {
    SteelAlphabet.loadImages().then(() => {
        console.log("Images loaded successfully");
    });
};
