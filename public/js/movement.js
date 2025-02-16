const workspace = document.querySelector(".workspace");
let isDragging = false;
let startX, startY, transformX = 0, transformY = 0;
let scale = 1;

// Panning functionality remains the same
workspace.addEventListener('mousedown', (e) => {
    if (e.button === 1 || e.button === 0) { // Middle mouse or left click
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        workspace.style.cursor = 'grabbing';
    }
});

workspace.addEventListener('mouseup', () => {
    isDragging = false;
    workspace.style.cursor = 'grab';
});

workspace.addEventListener('mouseleave', () => {
    isDragging = false;
    workspace.style.cursor = 'grab';
});

workspace.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const x = e.clientX;
    const y = e.clientY;
    const dx = (x - startX);
    const dy = (y - startY);
    transformX += dx;
    transformY += dy;
    workspace.style.transform = `translate(${transformX}px, ${transformY}px) scale(${scale})`;
    startX = x;
    startY = y;
});

// Improved zoom functionality
workspace.addEventListener('wheel', (e) => {
    e.preventDefault();

    const zoomSensitivity = 0.1;
    const minScale = 0.2;
    const maxScale = 1.5;

    // Calculate cursor position relative to current transform
    const rect = workspace.getBoundingClientRect();
    const px = (e.clientX - rect.left - transformX) / scale;
    const py = (e.clientY - rect.top - transformY) / scale;

    // Adjust scale
    if (e.deltaY < 0) {
        scale *= (1 + zoomSensitivity);
    } else {
        scale *= (1 - zoomSensitivity);
    }
    scale = Math.max(minScale, Math.min(maxScale, scale));
    jsPlumb.setZoom(scale);
    // Recompute transform so cursor is the zoom anchor
    transformX = e.clientX - rect.left - px * scale;
    transformY = e.clientY - rect.top - py * scale;

    // Smooth transform
    workspace.style.transition = 'transform 0.3s ease-out';
    workspace.style.transformOrigin = '0 0';
    workspace.style.transform = `translate(${transformX}px, ${transformY}px) scale(${scale})`;

    // Remove transition after a short delay
    setTimeout(() => {
        workspace.style.transition = 'none';
    }, 400);
});