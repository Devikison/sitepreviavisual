/* Biquini System: le a demo fora da tela principal para a pagina nao travar */
importScripts("pkg/demoparser2.js", "motor.js");
let pronto = null;
self.onmessage = async (e) => {
  try {
    if (!pronto) pronto = wasm_bindgen({ module_or_path: "pkg/demoparser2_bg.wasm" });
    await pronto;
    let bytes;
    if (e.data.url) { self.postMessage({ etapa: "Baixando a demo" }); bytes = new Uint8Array(await (await fetch(e.data.url)).arrayBuffer()); }
    else bytes = new Uint8Array(e.data.buffer);
    const rel = BiquiniMotor.gerar(bytes, wasm_bindgen, (m) => self.postMessage({ etapa: m }));
    self.postMessage({ ok: JSON.parse(JSON.stringify(rel, (k, v) => (typeof v === "bigint" ? String(v) : v))) });
  } catch (err) {
    self.postMessage({ erro: String((err && err.message) || err) });
  }
};
