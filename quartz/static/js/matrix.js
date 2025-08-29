// Self-executing function to encapsulate the Matrix Rain logic
(function() {
  // --- Canvas Setup ---
  const canvas = document.createElement('canvas'); // Create a new canvas element
  const ctx = canvas.getContext('2d'); // Get the 2D rendering context for the canvas
  let width, height; // Variables to store canvas dimensions (width and height)
  let fontSize = 16; // Adjustable font size for individual matrix characters
  let columns; // Number of character columns that fit across the canvas width
  let drops = []; // Array to store individual matrix rain "drops" (vertical lines of characters)
  let activeColumns = []; // New: Array to track columns that currently have an active drop

  // Global 2D grid to store the state of each character cell on the canvas.
  let charGrid = [];

  // Placeholder for 'isThinking' flag, not implemented in this version.
  const isThinking = false;
  // Placeholder for 'waitingForFirstChunk' flag, not implemented in this version.
  const waitingForFirstChunk = false;

  // --- Apply Canvas Specific Styles via JavaScript ---
  // These styles position the canvas to cover the entire page
  // and place it behind other content. Position is 'fixed'.
  canvas.style.display = 'block';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.zIndex = '-1';

  // Append the created canvas element to the document body
  canvas.classList.add('matrix-canvas');
  document.querySelector('html').appendChild(canvas);

  // --- Helper function: maps a value from one numerical range to another ---
  function map(value, start1, stop1, start2, stop2) {
    return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
  }

  // --- Constants for HSL colors ---
  // Using user-provided hex values converted to HSL for accuracy.
  const COLORS = {
    // Inactive background flicker: #062621 -> hsl(171, 73%, 9%)
    inactive: { h: 171, s: 73, l: 9 },
    // Primary (green, keyboard typing): #12ffbc -> hsl(163, 100%, 54%)
    primary: { h: 163, s: 100, l: 54 },
    // Negative (red, backspace/enter): #ff1342 -> hsl(348, 93%, 54%)
    negative: { h: 348, s: 93, l: 54 },
    // Info (yellow/tertiary, tab/hover): #eb9b27 -> hsl(36, 83%, 54%)
    info: { h: 36, s: 83, l: 54 },
  };

  // --- Brightness and Saturation Tweaking Constants for Gradients ---
  // These define the lightness and saturation ranges for different parts of the streams.

  // Primary (Green) Stream Lightness and Saturation
  const PRIMARY_TIP_LIGHTNESS_MIN = 90;
  const PRIMARY_TIP_LIGHTNESS_MAX = 100;
  const PRIMARY_TAIL_LIGHTNESS_MIN = 35;
  const PRIMARY_TAIL_LIGHTNESS_MAX = 65;
  const PRIMARY_SATURATION = 100; // Full saturation for green

  // Colored (Red, Yellow) Stream Lightness and Saturation (adjusted for better visibility)
  const COLORED_TIP_LIGHTNESS_MIN = 70; // Slightly lower max for colored tips to prevent washout
  const COLORED_TIP_LIGHTNESS_MAX = 85;
  const COLORED_TAIL_LIGHTNESS_MIN = 30; // Lowered for red/yellow tails to ensure hue visibility
  const COLORED_TAIL_LIGHTNESS_MAX = 55;
  const COLORED_STREAM_SATURATION = 95; // High saturation for red/yellow

  // Background Flicker and Trickle Streams
  const INACTIVE_CELL_LIGHTNESS_MIN = 35;
  const INACTIVE_CELL_LIGHTNESS_MAX = 45;
  const INACTIVE_CELL_ALPHA_MIN = 0.15;
  const INACTIVE_CELL_ALPHA_MAX = 0.25;

  // Updated Trickle Brightness: TRICKLE_LIGHTNESS_MIN and MAX increased for a brighter effect.
  const TRICKLE_LIGHTNESS_MIN = 40; // Increased from 20
  const TRICKLE_LIGHTNESS_MAX = 55; // Increased from 40
  const TRICKLE_INITIAL_ALPHA = 0.3;

  // --- Utility Functions ---

  /**
   * Generates a random character from the allowed set.
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
   * Adjusts the canvas dimensions to fill the entire window and recalculates column count.
   */
  function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    columns = Math.floor(width / fontSize);

    // Reinitialize the grid with empty cell states upon resize
    const rows = Math.floor(height / fontSize); // Recalculate rows for current height
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
    // Clear active columns on resize as all drops are effectively reset
    activeColumns = [];
  }

  /**
   * Creates new matrix rain drops and adds them to the global 'drops' array.
   * Each drop has a starting position, length, speed, and a color style.
   * @param {object} opts - Options for creating drops.
   * @param {string} opts.style - The color style of the drops ('primary', 'negative', 'info', 'trickle').
   * @param {number} opts.count - The number of individual drops to create.
   * @param {number} [opts.startY] - Optional: A specific starting Y pixel position for the drops.
   */
  function createRain(opts) {
    for (let i = 0; i < opts.count; i++) {
      let x;
      let attempts = 0;
      const maxAttempts = 50; // Prevents an infinite loop

      // Find an available column that doesn't have an active drop
      do {
        x = Math.floor(Math.random() * columns);
        attempts++;
      } while (activeColumns.includes(x) && attempts < maxAttempts);

      // Only create a drop if we found an available column
      if (attempts < maxAttempts) {
        drops.push({
          x: x,
          y: opts.startY !== undefined ? opts.startY : Math.random() * -height,
          // Shorter Streaks: Adjusted the length calculation
          len: Math.floor(Math.random() * 10) + 3,
          // Adjusted speed to make drops move slower
          speed: Math.random() * 35 + 10,
          style: opts.style
        });
        // Mark the column as active
        activeColumns.push(x);
      }
    }
  }

  /**
   * Determines the HSL color properties (hue, saturation, lightness, alpha) for a character
   * based on its position in the drop (`charIndexInDrop`) and the drop's `style`.
   * This is where the color gradient for each drop is defined.
   * @param {number} charIndexInDrop - The character's position within the current drop (0 is tip).
   * @param {number} dropLength - The total length of the drop in characters.
   * @param {string} dropStyle - The style of the current drop ('primary', 'negative', 'info', 'trickle').
   * @returns {object} An object containing `hue`, `saturation`, `lightness`, and `alpha`.
   */
  function getHSLForChar(charIndexInDrop, dropLength, dropStyle) {
    let hue, saturation, lightness;
    let alpha = 1;

    // Define base hue and saturation based on drop style
    switch (dropStyle) {
      case 'negative':
        hue = COLORS.negative.h;
        saturation = COLORED_STREAM_SATURATION;
        break;
      case 'info':
        hue = COLORS.info.h;
        saturation = COLORED_STREAM_SATURATION;
        break;
      case 'trickle':
        hue = COLORS.primary.h; // Trickle streams use primary's hue but dim
        saturation = PRIMARY_SATURATION;
        alpha = TRICKLE_INITIAL_ALPHA;
        break;
      default: // 'primary'
        hue = COLORS.primary.h;
        saturation = PRIMARY_SATURATION;
        break;
    }

    // Determine lightness based on position within the drop (gradient) and style
    // charIndexInDrop = 0 is the tip, charIndexInDrop = dropLength-1 is the tail end
    if (dropStyle === 'primary') {
      // Green streams
      lightness = map(charIndexInDrop, 0, dropLength - 1, PRIMARY_TIP_LIGHTNESS_MAX, PRIMARY_TAIL_LIGHTNESS_MIN);
      lightness = Math.max(PRIMARY_TAIL_LIGHTNESS_MIN, Math.min(PRIMARY_TIP_LIGHTNESS_MAX, lightness)); // Clamp values
    } else if (dropStyle === 'negative' || dropStyle === 'info') {
      // Red and Yellow streams
      lightness = map(charIndexInDrop, 0, dropLength - 1, COLORED_TIP_LIGHTNESS_MAX, COLORED_TAIL_LIGHTNESS_MIN);
      lightness = Math.max(COLORED_TAIL_LIGHTNESS_MIN, Math.min(COLORED_TIP_LIGHTNESS_MAX, lightness)); // Clamp values
    } else if (dropStyle === 'trickle') {
      // Trickle streams are generally dimmer, using updated TRICKLE_LIGHTNESS_MIN/MAX
      lightness = map(charIndexInDrop, 0, dropLength - 1, TRICKLE_LIGHTNESS_MAX, TRICKLE_LIGHTNESS_MIN);
      lightness = Math.max(TRICKLE_LIGHTNESS_MIN, Math.min(TRICKLE_LIGHTNESS_MAX, lightness)); // Clamp values
    } else {
      lightness = 5; // Fallback
    }

    // CRITICAL CHANGE: Force the very first cell (lead) to be pure white
    // ONLY IF the drop is NOT a trickle style.
    if (charIndexInDrop === 0 && dropStyle !== 'trickle') {
      saturation = 0; // No color saturation
      lightness = 100; // Full brightness
    }

    return { hue, saturation, lightness, alpha };
  }

  /**
   * Handles keyboard input events to trigger matrix rain effects.
   */
  function onKeyboardInput(event) {
    if (this.typingTimer) clearTimeout(this.typingTimer);

    let streamStyle = 'primary'; // Default style is primary

    // Check for special keys: Enter, Backspace, Tab
    if (event.key === 'Enter' || event.key === 'Backspace') {
      streamStyle = 'negative'; // Red for these keys
    }
    if (event.key === 'Tab') {
      streamStyle = 'info'; // Yellow/Orange for Tab key
    }

    // Only create streams for key presses, as isThinking is false in this implementation
    if (!isThinking) {
      // --- EXACTLY TWO STREAMS PER KEY PRESS ---
      // 1. One stream starting immediately from the top (y=0)
      createRain({ style: streamStyle, count: 1, startY: 0 }); // Ensure it starts at y=0
      // 2. One stream starting randomly high up
      createRain({ style: streamStyle, count: 1 });
    }
  }

  /**
   * Handles mouse over/out events for a.internal tags to trigger matrix rain effects.
   */
  function onHover(event) {
    let $img = event.target.closest('img');
    if ($img && $img.tagName.toUpperCase() === 'IMG') {
      createRain({ style: 'trickle', count: Math.random()*10+1, startY: 0 });
    }
    
    let $a = event.target.closest('a');
    if ($a) {
      if (event.type === 'mouseover') {
        let streamStyle = 'info'; // Default for hover
        if ($a.classList.contains('is-unresolved')) {
          streamStyle = 'negative'; // Red if link is unresolved
        }
        // Create multiple rain drops on hover
        createRain({ style: streamStyle, count: Math.random()*3+1, startY: 0 });
      }
    }

    $el = event.target.closest('input[type="checkbox"]');
    if ($el) {
      if (event.type === 'mouseover') {
        let streamStyle = 'negative'; // Default for hover
        if ($el.checked) {
          streamStyle = 'info'; // Red if link is unresolved
        }
        for (let i = 0; i < Math.random() * 5 + 1; i++) {
          createRain({ style: streamStyle, count: 1, startY: 0 });
        }
      }
    }

    $el = event.target.closest('button');
    if ($el) {
      if (event.type === 'mouseover') {
        let streamStyle = 'info'; // Default for hover
        createRain({ style: streamStyle, count: 1, startY: 0 }); // Ensure it starts at y=0
      }
    }
  }

  /**
   * Handles mouse movement to create a trail of trickle drops.
   * @param {MouseEvent} event - The mousemove event object.
   */
  function onMouseMove(event) {
    // Only create a new drop with a certain probability to avoid overwhelming the canvas
    if (Math.random() < 0.3) { // 30% chance to create a drop on mouse move
      const mouseX = event.clientX;
      const mouseY = event.clientY;

      const col = Math.floor(mouseX / fontSize);

      // Ensure the column is within bounds
      if (col >= 0 && col < columns) {
        const newDropLen = Math.floor(Math.random() * 10) + 5; // The desired final length

        drops.push({
          x: col,
          y: mouseY, // The TOP of the initial character is at mouseY
          len: 1, // Start with a length of 1
          targetLen: newDropLen, // Store the desired final length for growth
          speed: Math.random() * 10 + 5,
          style: 'trickle'
        });
      }
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

    // --- Generate Continuous Trickle Streams (background activity) ---
    // Increased trickle drop rate: Math.random() < 0.1 (10% chance per frame)
    if (Math.random() < 0.1) {
      createRain({ style: 'trickle', count: 1 });
    }

    // 1. Process Drops: Update positions and "write" characters to `charGrid`.
    for (let n = drops.length - 1; n >= 0; n--) {
      const drop = drops[n];

      // Update currentLen for trickle drops to make them grow
      if (drop.style === 'trickle' && drop.len < drop.targetLen) {
        drop.len = Math.min(drop.len + 1, drop.targetLen); // Grow by 1 character per frame
      }

      drop.y += drop.speed;

      // Determine the length to use for rendering and off-screen check
      const renderLen = drop.len; // `len` now directly represents the current rendered length

      // Remove drop if it has completely fallen off screen
      if (drop.y > height) { // Condition modified to check if the top of the drop is off-screen.
                             // This is because drops now grow downwards from drop.y.
        // Remove the column from the activeColumns array when drop goes off-screen
        // Only remove if it was explicitly added by createRain (i.e., not a mouse trail drop)
        if (drop.style !== 'trickle' || drop.y === drop.startY || activeColumns.includes(drop.x)) {
            const index = activeColumns.indexOf(drop.x);
            if (index > -1) {
              activeColumns.splice(index, 1);
            }
        }
        drops.splice(n, 1);
        continue;
      }

      for (let i = 0; i < renderLen; i++) {
        const col = drop.x;
        // Characters are now drawn *downwards* from drop.y (which is the top of the streak)
        const row = Math.floor((drop.y + (i * fontSize)) / fontSize);

        if (col < 0 || col >= columns || row < 0 || row >= charGrid[0].length) continue; // Ensure row is within bounds

        // Calculate charIndexForGradient:
        let charIndexForGradient;
        if (drop.style === 'trickle') {
          // For trickle (mouse trails), i=0 is top (tip), i=renderLen-1 is bottom (tail).
          // We want tip (top) to be normal green and grow downwards.
          charIndexForGradient = i; // Retain current behavior for trickle
        } else {
          // For non-trickle (keyboard/hover), i=0 is top, i=renderLen-1 is bottom.
          // We want the white "tip" to be at the BOTTOM of the streak,
          // so getHSLForChar's charIndexInDrop === 0 must correspond to the bottom-most character.
          charIndexForGradient = (renderLen - 1) - i; // Invert for non-trickle
        }

        // Pass renderLen as dropLength to getHSLForChar for accurate gradient mapping for the *currently visible* length
        const { hue, saturation, lightness, alpha } = getHSLForChar(charIndexForGradient, renderLen, drop.style);

        // Update charGrid cell with character and its full HSL color properties
        charGrid[col][row] = {
          char: getRandomChar(),
          hue: hue,
          saturation: saturation,
          lightness: lightness,
          alpha: alpha,
          // Reduced fadeDuration for faster fade-out
          ttl: 10 // Time to live (frames remaining) for character to fade in opacity
        };
      }
    }

    // 2. Render Grid and Fade / Flicker Background:
    const fadeDuration = 10; // How many frames a character remains on screen while fading
    const rowsInGrid = charGrid[0] ? charGrid[0].length : 0; // Get actual number of rows from grid

    for (let col = 0; col < columns; col++) {
      for (let row = 0; row < rowsInGrid; row++) {
        const cell = charGrid[col][row];
        const charX = col * fontSize;
        const charY = row * fontSize;

        if (cell.ttl > 0) { // Active drop character: Render with fading opacity
          // Lightness is set in getHSLForChar and represents the color gradient.
          // Alpha now fades to INACTIVE_CELL_ALPHA_MIN for a smoother blend (no "burn")
          const currentLightness = map(fadeDuration - cell.ttl, 0, fadeDuration, cell.lightness, PRIMARY_TAIL_LIGHTNESS_MIN);
          const currentAlpha = map(cell.ttl, 0, fadeDuration, INACTIVE_CELL_ALPHA_MIN, cell.alpha);

          ctx.fillStyle = `hsla(${cell.hue}, ${cell.saturation}%, ${currentLightness}%, ${currentAlpha})`;
          ctx.fillText(cell.char, charX, charY);
          cell.ttl--;

          // No need to clear character data completely when TTL expires,
          // as the background rendering will naturally take over.
        } else { // Inactive cell: Render a flickering background character
          const inactiveLightness = map(Math.random(), 0, 1, INACTIVE_CELL_LIGHTNESS_MIN, INACTIVE_CELL_LIGHTNESS_MAX);
          ctx.fillStyle = `hsla(${COLORS.inactive.h}, ${COLORS.inactive.s}%, ${inactiveLightness}%, ${map(Math.random(), 0, 1, INACTIVE_CELL_ALPHA_MIN, INACTIVE_CELL_ALPHA_MAX)})`;
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
    document.addEventListener('mousedown', onKeyboardInput);
    document.addEventListener('mouseup', onKeyboardInput);
    document.addEventListener('keydown', onKeyboardInput);
    document.addEventListener('mouseover', onHover);
    document.addEventListener('mouseout', onHover);
    document.addEventListener('mousemove', onMouseMove); // New: Mousemove listener
    draw(); // Start the main animation loop
  }

  window.onload = init;
})();
