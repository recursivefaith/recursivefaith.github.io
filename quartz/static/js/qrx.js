// Standalone IIFE to avoid polluting the global scope.
(function() {
  // Check if the qrcodegen library is available before proceeding.
  if (typeof qrcodegen === 'undefined' || typeof qrcodegen.QrCode === 'undefined') {
    console.error("The qrcodegen.js library is not loaded. Please ensure it is included in the DOM.");
    return;
  }

  // == CONFIGURATION VARIABLES ==
  // These variables can be easily changed to customize the behavior.
  const ANIMATION_SPEED_MS = 250;
  
  // Function to create a canvas element for a QR code, without the border.
  // Sizing and styling for the canvas should be handled by CSS.
  function createCanvas(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    return canvas;
  }

  // Function to chunk the data into pieces that can fit into a single QR code.
  function chunkData(data, chunkSize) {
    const chunks = [];
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }
    return chunks;
  }

  // Function to manually draw the QR code onto a canvas.
  function drawQrCodeOnCanvas(qr, canvas, scale, foregroundColor, backgroundColor) {
    const ctx = canvas.getContext('2d');
    const size = qr.size;

    // Clear the canvas with the background color.
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set color for the modules (foreground color).
    ctx.fillStyle = foregroundColor;

    // Draw the QR code modules.
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (qr.getModule(x, y)) {
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }
  }

  // Function to generate the QR codes and set up the animation for a single container.
  function generateAndAnimateForContainer(container, data) {
    // Clear previous QR codes and animation interval for this container.
    container.innerHTML = '';
    if (container.animationInterval) {
      clearInterval(container.animationInterval);
    }
    
    // A conservative chunk size to ensure the QR codes are not too dense and remain scannable.
    const MAX_CHUNK_SIZE = 2000;
    const dataChunks = chunkData(data, MAX_CHUNK_SIZE);
    
    const containerQrCodes = [];

    // Dynamically fetch colors and other variables from the document's CSS.
    const rootStyle = getComputedStyle(document.documentElement);
    const qrForegroundColor = rootStyle.getPropertyValue('--dark').trim() || '#000000';
    const qrBackgroundColor = rootStyle.getPropertyValue('--light').trim() || '#FFFFFF';
    const moduleScale = parseFloat(rootStyle.getPropertyValue('--module-scale-px')) || 5;

    // Loop through the chunks and generate a QR code for each.
    for (let i = 0; i < dataChunks.length; i++) {
      try {
        const chunk = dataChunks[i];
        // Prepend the metadata to the chunk.
        const metadata = `<qrx frame=${i+1} total=${dataChunks.length}>`;
        const contentWithMeta = metadata + chunk;

        const qr = qrcodegen.QrCode.encodeText(contentWithMeta, qrcodegen.QrCode.Ecc.MEDIUM);
        
        // The quiet zone border is now handled by CSS padding on the container.
        const canvas = createCanvas(qr.size * moduleScale);
        drawQrCodeOnCanvas(qr, canvas, moduleScale, qrForegroundColor, qrBackgroundColor);
        
        containerQrCodes.push(canvas);
        container.appendChild(canvas);
      } catch (error) {
        console.error("Failed to generate QR code for a data chunk:", error);
      }
    }

    // Start the animation if there are multiple QR codes.
    if (containerQrCodes.length > 0) {
      containerQrCodes[0].classList.add('active'); // Show the first QR code with the active class.
      if (containerQrCodes.length > 1) {
        let currentIndex = 0;
        container.animationInterval = setInterval(function() {
          containerQrCodes[currentIndex].classList.remove('active');
          currentIndex = (currentIndex + 1) % containerQrCodes.length;
          containerQrCodes[currentIndex].classList.add('active');
        }, ANIMATION_SPEED_MS);
      }
    }
  }

  // The event listener that triggers the QR code generation.
  document.addEventListener("generate_qrx", function(event) {
    const { slug, page } = event.detail;
    
    // The correct target container is found by a direct query, not from the event detail.
    const targetContainers = document.querySelectorAll('.qrx-page');
    if (targetContainers.length === 0) {
      console.error("Target container '.qrx-page' not found in the DOM.");
      return;
    }
    
    // Check if page is an object and serialize it to a JSON string.
    const pageContent = typeof page === 'object' && page !== null ? JSON.stringify(page, null, 2) : String(page);

    // Combine the slug and page content into a single string for encoding.
    const contentToEncode = `${slug}\n\n${pageContent}`;
    console.log("Generating QR codes for data:", contentToEncode);

    targetContainers.forEach(container => {
      generateAndAnimateForContainer(container, contentToEncode);
    });
  });

  console.log("QR Code generation listener is active.");

})();

// when an element with .graph-title > label is clicked
document.addEventListener("click", function(event) {
  const target = event.target;
  if (target.matches(".graph-title > label")) {
    const focusValue = target.dataset.sidebarFocus;

    // Unify the active class removal logic
    document.querySelectorAll(`.graph-title > label`).forEach((el) => {
      el.classList.remove("active");
    });
    document.querySelectorAll(`[data-hideable="true"]`).forEach((el) => {
      el.classList.remove("active");
    });

    // Add active to the clicked label
    target.classList.add("active");

    // Handle the mismatch between 'qrx' label and 'qrcode' container
    let containerFocusValue = focusValue;
    if (focusValue === "qrx") {
      containerFocusValue = "qrcode";
    }

    // Add active to the corresponding content container
    document.querySelectorAll(`[data-sidebar-focus="${containerFocusValue}"]`).forEach((el) => {
      el.classList.add("active");
    });
  }
});
