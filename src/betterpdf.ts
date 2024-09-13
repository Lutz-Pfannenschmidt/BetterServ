import { createWorker } from 'tesseract.js';


function setCSP() {
    const cspMeta = document.createElement('meta');
    cspMeta.httpEquiv = 'Content-Security-Policy';
    cspMeta.content = "default-src *; script-src *; img-src *; style-src *; connect-src *; font-src *; object-src *; media-src *; frame-src *;";

    const existingCspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (existingCspMeta) {
        existingCspMeta.parentNode?.removeChild(existingCspMeta);
    }

    document.head.appendChild(cspMeta);
}
setCSP();

console.log('Hello from betterpdf.ts');
if (window.location.toString().endsWith('/-/')) {
    (async () => {
        const worker = await createWorker('eng');
        const ret = await worker.recognize("https://neponet.de/iserv/file/-/Groups/E_Q2_G3/The%20World%20of%20Work/4%20-%20Homework%20-%20Gender%20GAP-wages.pdf");
        console.log(ret.data.text);
        await worker.terminate();
    })();
}