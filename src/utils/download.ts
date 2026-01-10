export const downloadQrCode = (elementId: string, filename: string) => {
    const container = document.getElementById(elementId);
    const svg = container?.querySelector('svg');

    if (!svg) {
        console.error('QR Code SVG not found');
        return;
    }

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    // Set dimensions based on SVG viewbox or width
    // We can force high resolution
    const size = 512;
    canvas.width = size;
    canvas.height = size;

    img.onload = () => {
        if (ctx) {
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, size, size);
            ctx.drawImage(img, 0, 0, size, size);
            const pngFile = canvas.toDataURL("image/png");

            const downloadLink = document.createElement("a");
            downloadLink.download = `${filename}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        }
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
};
