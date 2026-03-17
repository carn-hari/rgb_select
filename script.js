document.addEventListener('DOMContentLoaded', () => {
    // State
    let currentH = 160;
    let currentS = 56;
    let currentV = 80;

    // DOM Elements
    const sbPicker = document.getElementById('sbPicker');
    const sbHandle = document.getElementById('sbHandle');
    const hueSlider = document.getElementById('hueSlider');
    const hueHandle = document.getElementById('hueHandle');
    const hexInput = document.getElementById('hexInput');
    const swatchPreview = document.getElementById('swatchPreview');
    const paletteGrid = document.getElementById('paletteGrid');
    const toast = document.getElementById('toast');

    // Info Labels
    const valHex = document.getElementById('valHex');
    const valRgb = document.getElementById('valRgb');
    const valHsl = document.getElementById('valHsl');
    const valOklch = document.getElementById('valOklch');

    function updateUI() {
        const rgb = hsvToRgb(currentH, currentS, currentV);
        const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        const oklch = rgbToOklch(rgb.r, rgb.g, rgb.b);

        // Update Picker & Previews
        sbPicker.style.backgroundColor = `hsl(${currentH}, 100%, 50%)`;
        swatchPreview.style.backgroundColor = hex;

        // Update Info Banner
        valHex.textContent = hex;
        valRgb.textContent = `${rgb.r}, ${rgb.g}, ${rgb.b}`;
        valHsl.textContent = `${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%`;
        valOklch.textContent = `${oklch.l.toFixed(2)}, ${oklch.c.toFixed(2)}, ${Math.round(oklch.h)}`;

        // Update Handles (avoid direct style if typing in hex)
        if (document.activeElement !== hexInput) {
            hexInput.value = hex;
        }

        sbHandle.style.left = `${currentS}%`;
        sbHandle.style.top = `${100 - currentV}%`;
        hueHandle.style.left = `${(currentH / 360) * 100}%`;

        generatePalette(rgb);
    }

    function generatePalette(baseRgb) {
        paletteGrid.innerHTML = '';

        // Define 12 shifts: 6 lighter, 1 base, 5 darker
        const shifts = [
            { label: 'L6', diff: 90 },
            { label: 'L5', diff: 75 },
            { label: 'L4', diff: 60 },
            { label: 'L3', diff: 45 },
            { label: 'L2', diff: 30 },
            { label: 'L1', diff: 15 },
            { label: 'Base', diff: 0 },
            { label: 'D1', diff: -15 },
            { label: 'D2', diff: -30 },
            { label: 'D3', diff: -45 },
            { label: 'D4', diff: -60 },
            { label: 'D5', diff: -75 }
        ];

        shifts.forEach((shift, index) => {
            const r = Math.max(0, Math.min(255, baseRgb.r + shift.diff));
            const g = Math.max(0, Math.min(255, baseRgb.g + shift.diff));
            const b = Math.max(0, Math.min(255, baseRgb.b + shift.diff));

            const hex = rgbToHex(r, g, b);
            const card = createColorCard(hex, shift.label, index);
            paletteGrid.appendChild(card);
        });
    }

    function createColorCard(hex, label, index) {
        const card = document.createElement('div');
        card.className = 'color-card';
        card.style.animationDelay = `${index * 0.05}s`;

        card.innerHTML = `
            <div class="color-swatch" style="background-color: ${hex}" onclick="copyColor('${hex}')"></div>
            <div class="color-info">
                <span class="hex-val">${hex}</span>
                <p class="label-val">${label}</p>
            </div>
        `;
        return card;
    }

    // Interaction Boilerplate
    function initPicker(el, callback) {
        let isDragging = false;
        const update = (e) => {
            const rect = el.getBoundingClientRect();
            const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
            callback(x, y);
            updateUI();
        };

        el.addEventListener('mousedown', (e) => { isDragging = true; update(e); });
        window.addEventListener('mousemove', (e) => { if (isDragging) update(e); });
        window.addEventListener('mouseup', () => { isDragging = false; });
    }

    initPicker(sbPicker, (x, y) => {
        currentS = x * 100;
        currentV = (1 - y) * 100;
    });

    initPicker(hueSlider, (x) => {
        currentH = x * 360;
    });

    hexInput.addEventListener('input', (e) => {
        const hex = e.target.value;
        if (/^#?[0-9A-Fa-f]{6}$/.test(hex)) {
            const rgb = hexToRgb(hex.startsWith('#') ? hex : '#' + hex);
            const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
            currentH = hsv.h;
            currentS = hsv.s;
            currentV = hsv.v;
            updateUI();
        }
    });

    // Clipboard
    window.copyColor = (hex) => {
        navigator.clipboard.writeText(hex).then(() => {
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2000);
        });
    };

    // --- Math Conversions ---

    function hsvToRgb(h, s, v) {
        s /= 100; v /= 100;
        let f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
        return { r: Math.round(f(5) * 255), g: Math.round(f(3) * 255), b: Math.round(f(1) * 255) };
    }

    function rgbToHex(r, g, b) {
        return "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
    }

    function hexToRgb(hex) {
        if (hex.length === 4) { // #RGB
            const r = parseInt(hex[1] + hex[1], 16);
            const g = parseInt(hex[2] + hex[2], 16);
            const b = parseInt(hex[3] + hex[3], 16);
            return { r, g, b };
        }
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b };
    }

    function rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        if (max === min) h = s = 0;
        else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h: h * 360, s: s * 100, l: l * 100 };
    }

    function rgbToHsv(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, v = max;
        const d = max - min;
        s = max === 0 ? 0 : d / max;
        if (max === min) h = 0;
        else {
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h: h * 360, s: s * 100, v: v * 100 };
    }

    function rgbToOklch(r, g, b) {
        const hsl = rgbToHsl(r, g, b);
        return {
            l: (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255,
            c: (hsl.s / 100) * 0.1,
            h: hsl.h
        };
    }

    updateUI();
});
