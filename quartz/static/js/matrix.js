        // Self-executing function to encapsulate the Matrix Rain logic
        (function() {
            // --- Canvas Setup ---
            const canvas = document.createElement('canvas'); // Create a new canvas element
            const ctx = canvas.getContext('2d'); // Get the 2D rendering context for the canvas
            let width, height; // Variables to store canvas dimensions (width and height)
            let fontSize = 16; // Adjustable font size for individual matrix characters
            let columns; // Number of character columns that fit across the canvas width
            let rows; // Number of character rows that fit vertically
            let drops = []; // Array to store individual matrix rain "drops" (vertical lines of characters)

            // Global 2D grid to store the state of each character cell on the canvas.
            // This replaces the multiple HTML 'div' layers from the original algorithm.
            let charGrid = [];

            // Placeholder for 'isThinking' flag, matching the original algorithm's external dependency.
            // It is explicitly set to false here as the 'thinking' logic is not implemented.
            const isThinking = false;
            // Placeholder for 'waitingForFirstChunk' flag, matching the original.
            const waitingForFirstChunk = false;

            // --- Apply Canvas Specific Styles via JavaScript ---
            // These styles position the canvas to cover the entire page
            // and place it behind other content. Position is 'fixed' as requested.
            canvas.style.display = 'block';
            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.zIndex = '-1';

            // Append the created canvas element to the document body
            document.body.appendChild(canvas);

            // --- Helper function: maps a value from one numerical range to another ---
            // This is crucial for creating the color gradient within each drop, exactly as in the original.
            function map(value, start1, stop1, start2, stop2) {
                return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
            }

            // --- Constants for HSL colors ---
            // Mapped from the provided darkMode palette
            const COLORS = {
                // inactive: #062621 -> hsl(171, 73%, 9%) - used for background flicker
                inactive: { h: 171, s: 73, l: 9 },
                // primary (active streams): #12ffbc -> hsl(163, 100%, 54%)
                primary: { h: 163, s: 100, l: 54 },
                // negative (delete streams): #ff1342 -> hsl(348, 100%, 54%)
                negative: { h: 348, s: 100, l: 54 },
                // info (ai streams): #eb9b27 -> hsl(36, 83%, 54%)
                info: { h: 36, s: 83, l: 54 },
            };

            // --- Brightness Tweaking Constants ---
            // These constants allow global adjustment of different rain element brightness.
            const ACTIVE_STREAM_LIGHTNESS_MIN = 35; // Min lightness for regular active streams
            const ACTIVE_STREAM_LIGHTNESS_MAX = 65; // Max lightness for regular active streams

            const BRIGHT_TIP_LIGHTNESS_MIN = 90; // Min lightness for the brightest tips/flashes (increased for more pop)
            const BRIGHT_TIP_LIGHTNESS_MAX = 100; // Max lightness for the brightest tips/flashes

            const INACTIVE_CELL_LIGHTNESS_MIN = 35; // Min lightness for background flickering cells
            const INACTIVE_CELL_LIGHTNESS_MAX = 45; // Max lightness for background flickering cells

            // TRICKLE STREAMS: Dramatically reduced lightness and alpha for extreme dimness
            const TRICKLE_LIGHTNESS_MIN = 20; // Very low min lightness for trickle streams
            const TRICKLE_LIGHTNESS_MAX = 40; // Very low max lightness for trickle streams
            const TRICKLE_INITIAL_ALPHA = 0.2; // Low initial opacity for trickle streams

            // --- Utility Functions ---

            /**
             * Generates a random character from the exact set used in the original `viz.ts`:
             * uppercase letters, lowercase letters, and numbers.
             * @returns {string} A single random character.
             */
            function getRandomChar() {
                const caps = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                const lower = caps.toLowerCase();
                const nums = '0123456789';
                const alphabet = caps + lower + nums;
                return alphabet.charAt(Math.floor(Math.random() * alphabet.length));
            }

            /**
             * Adjusts the canvas dimensions to fill the entire window and recalculates the number of character columns and rows.
             * This function is essential for making the effect responsive to browser window resizing.
             * It also initializes or resizes the `charGrid` accordingly.
             */
            function resizeCanvas() {
                width = window.innerWidth; // Get current window width
                height = window.innerHeight; // Get current window height
                canvas.width = width; // Set canvas width
                canvas.height = height; // Set canvas height

                columns = Math.floor(width / fontSize); // Calculate how many columns of characters can fit
                rows = Math.floor(height / fontSize); // Calculate how many rows of characters can fit

                // Initialize the grid with empty cell states
                charGrid = Array(columns).fill(null).map(() =>
                    Array(rows).fill(null).map(() => ({
                        char: '',
                        hue: 0,
                        saturation: 0,
                        lightness: 0,
                        alpha: 0,
                        ttl: 0 // Time to live (frames remaining) for character to fade
                    }))
                );
            }

            /**
             * Creates new matrix rain drops and adds them to the global 'drops' array.
             * Each drop has a starting position, length, speed, and a color style.
             * @param {object} opts - Options for creating drops.
             * @param {string} opts.style - The color style of the drops ('primary', 'secondary', 'negative', 'info', 'trickle').
             * @param {number} opts.count - The number of individual drops to create.
             * @param {number} [opts.startY] - Optional: A specific starting Y pixel position for the drops.
             * @param {boolean} [opts.halfRandomYDistance=false] - If true, reduce the random high Y distance by half.
             */
            function createRain(opts) {
                const randomYMultiplier = opts.halfRandomYDistance ? 1.5 : 3; // Use 1.5 for half distance, 3 for full

                for (let i = 0; i < opts.count; i++) {
                    drops.push({
                        x: Math.floor(Math.random() * columns), // Random starting column index
                        y: opts.startY !== undefined ? opts.startY : Math.random() * -height * randomYMultiplier, // Use specific startY or random high up with adjusted distance
                        len: Math.floor(Math.random() * (height / fontSize) / 2) + 5, // Length of the drop (in characters), from 5 to half the screen height
                        // Variability in falling speed: range 0.5 to 3.5
                        speed: Math.random() * 3 + 0.5, // Increased random range for speed
                        style: opts.style // Color style
                    });
                }
            }

            /**
             * Determines the HSL color properties (hue, saturation, lightness, alpha) for a character
             * based on its `layerIdx` and the drop's `style`, directly mimicking the original logic.
             * This function is an interpretation of how the 15 `data-layer` divs would render their content.
             * @param {number} layerIdx - The calculated layer index (0-14) from the original algorithm.
             * @param {string} dropStyle - The style of the current drop ('primary', 'secondary', etc.).
             * @param {boolean} isTipOrBrightFlash - True if this character is the very tip of the drop or a random bright flash.
             * @returns {object} An object containing `hue`, `saturation`, `lightness`, and `alpha`.
             */
            function getHSLFromLayer(layerIdx, dropStyle, isTipOrBrightFlash) {
                let hue, saturation, lightness;
                let alpha = 1; // Default initial alpha

                // Assign base hue and saturation based on drop style
                switch (dropStyle) {
                    // Original `secondary` from viz.ts not mapped to a new hex, retaining old HSL if used.
                    case 'secondary':
                        hue = 200; saturation = 100; break;
                    case 'negative':
                        hue = COLORS.negative.h; saturation = COLORS.negative.s; break;
                    case 'info':
                        hue = COLORS.info.h; saturation = COLORS.info.s; break;
                    case 'trickle':
                        hue = COLORS.primary.h; saturation = COLORS.primary.s;
                        alpha = TRICKLE_INITIAL_ALPHA; // Set low initial alpha for trickle streams
                        break;
                    default: // 'primary'
                        hue = COLORS.primary.h; saturation = COLORS.primary.s; break;
                }

                // Map layerIdx to lightness, interpreting original layer ranges
                if (isTipOrBrightFlash && dropStyle !== 'trickle') { // Don't make trickle streams *too* bright at the tip
                    hue = COLORS.primary.h;
                    saturation = 0; // Make it desaturated, appearing almost white
                    lightness = map(Math.random(), 0, 1, BRIGHT_TIP_LIGHTNESS_MIN, BRIGHT_TIP_LIGHTNESS_MAX);
                } else if (dropStyle === 'primary' || dropStyle === 'negative' || dropStyle === 'info' || dropStyle === 'secondary') {
                    // Active streams
                    lightness = map(layerIdx, 0, 3, ACTIVE_STREAM_LIGHTNESS_MIN, ACTIVE_STREAM_LIGHTNESS_MAX);
                } else if (dropStyle === 'trickle') {
                    // Trickle streams: very dim
                    lightness = map(layerIdx, 0, 3, TRICKLE_LIGHTNESS_MIN, TRICKLE_LIGHTNESS_MAX);
                }
                else {
                    lightness = 5; // Default very dim if not explicitly mapped
                }

                return { hue, saturation, lightness, alpha };
            }

            /**
             * Handles keyboard input events to trigger matrix rain effects.
             */
            function onKeyboardInput(event) {
                if (this.typingTimer) clearTimeout(this.typingTimer);

                let streamStyle = 'primary'; // Default style is primary

                // Check for special keys: Enter or Backspace
                if (event.key === 'Enter' || event.key === 'Backspace') {
                    streamStyle = 'negative'; // Set style to negative (red) for these keys
                }

                // Replicating original onEditorChange logic, but with isThinking always false.
                if (isThinking && !waitingForFirstChunk && Math.random() > 0.9) {
                    createRain({ style: 'primary', count: Math.max(3, Math.random() * columns / 2) * 1 });
                    createRain({ style: 'info', count: Math.max(3, Math.random() * columns / 2) * 0.25 });
                } else if (isThinking) {
                    createRain({ style: 'primary', count: Math.max(3, Math.random() * columns / 30) * 1 });
                    createRain({ style: 'secondary', count: Math.max(3, Math.random() * columns / 30) * 0.25 });
                }
                // This is the only part that will execute for a key press in this implementation
                else {
                    // --- EXACTLY TWO STREAMS PER KEY PRESS ---
                    // 1. One stream starting immediately from the top (y=0)
                    createRain({ style: streamStyle, count: 1, startY: 0 });
                    // 2. One stream starting randomly high up, with half the distance
                    createRain({ style: streamStyle, count: 1, halfRandomYDistance: true });
                }
            }

            // --- Animation Loop ---

            /**
             * The core animation loop for the Matrix Rain effect.
             */
            function draw() {
                // Clear the entire canvas to fully transparent in each frame.
                ctx.clearRect(0, 0, width, height);

                ctx.font = `${fontSize}px monospace`;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';

                // --- Generate Continuous Trickle Streams ---
                if (Math.random() < 0.02) { // About 2% chance per frame to add a new trickle drop
                    createRain({ style: 'trickle', count: 1 });
                }

                // 1. Process Drops: Update positions and "write" characters to `charGrid`.
                for (let n = drops.length - 1; n >= 0; n--) {
                    const drop = drops[n];
                    drop.y += drop.speed;

                    if (drop.y - (drop.len * fontSize) > height) {
                        drops.splice(n, 1);
                        continue;
                    }

                    for (let i = 0; i < drop.len; i++) {
                        const col = drop.x;
                        const row = Math.floor((drop.y - (i * fontSize)) / fontSize);

                        if (col < 0 || col >= columns || row < 0 || row >= rows) continue;

                        let layerIdx;
                        switch (drop.style) {
                            case 'secondary': layerIdx = Math.floor(map(i, 0, drop.len, 9, 11)); break;
                            case 'negative': layerIdx = Math.floor(map(i, 0, drop.len, 6, 8)); break;
                            case 'info': layerIdx = Math.floor(map(i, 0, drop.len, 12, 14)); break;
                            case 'trickle': layerIdx = Math.floor(map(i, 0, drop.len, 3, 0)); break; // Use primary's layer mapping
                            default: layerIdx = Math.floor(map(i, 0, drop.len, 3, 0)); break;
                        }

                        const isTipOrBrightFlash = (i === 0 || (layerIdx === 3 && Math.random() > 0.5));
                        if (isTipOrBrightFlash && drop.style !== 'trickle') {
                            layerIdx = Math.floor(map(Math.random(), 0, 1, 3, 5));
                        }

                        const { hue, saturation, lightness, alpha } = getHSLFromLayer(layerIdx, drop.style, isTipOrBrightFlash);

                        charGrid[col][row] = {
                            char: getRandomChar(),
                            hue: hue,
                            saturation: saturation,
                            lightness: lightness,
                            alpha: alpha, // Use the determined alpha from getHSLFromLayer
                            ttl: 20
                        };
                    }
                }

                // 2. Render Grid and Fade / Flicker Background:
                const fadeDuration = 20;
                for (let col = 0; col < columns; col++) {
                    for (let row = 0; row < rows; row++) {
                        const cell = charGrid[col][row];
                        const charX = col * fontSize;
                        const charY = row * fontSize;

                        if (cell.ttl > 0) { // Active drop character: Render with fading effect
                            const currentLightness = map(cell.ttl, 0, fadeDuration, 0, cell.lightness);
                            // Fade from initial cell.alpha to 0
                            const currentAlpha = map(cell.ttl, 0, fadeDuration, 0, cell.alpha);

                            ctx.fillStyle = `hsla(${cell.hue}, ${cell.saturation}%, ${currentLightness}%, ${currentAlpha})`;
                            ctx.fillText(cell.char, charX, charY);
                            cell.ttl--;

                            if (cell.ttl <= 0) {
                                // Clear character data completely when TTL expires.
                                cell.char = '';
                                cell.hue = 0; saturation = 0; lightness = 0; alpha = 0;
                            }
                        } else { // Inactive cell: Render a flickering background character
                            const inactiveLightness = map(Math.random(), 0, 1, INACTIVE_CELL_LIGHTNESS_MIN, INACTIVE_CELL_LIGHTNESS_MAX);
                            ctx.fillStyle = `hsla(${COLORS.inactive.h}, ${COLORS.inactive.s}%, ${inactiveLightness}%, ${Math.random() * 0.1 + 0.05})`;
                            ctx.fillText(getRandomChar(), charX, charY);
                        }
                    }
                }

                requestAnimationFrame(draw);
            }

            // --- Initialization Function ---
            function init() {
                resizeCanvas();
                window.addEventListener('resize', resizeCanvas);
                document.addEventListener('keydown', onKeyboardInput);
                draw(); // Start the main animation loop
            }

            window.onload = init;
        })();