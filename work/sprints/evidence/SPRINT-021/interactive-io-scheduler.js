// Test-only scheduling seam. Real chooser-selected File bytes and app code are unchanged.
// Loaded before the production bundle only by interactive-io-server.py on loopback.
/* global File, document */
(() => {
  let armed = false;
  const pending = [];
  let status;
  const update = (message) => {
    status.textContent = message;
  };
  for (const method of ["arrayBuffer", "text"]) {
    const nativeRead = File.prototype[method];
    File.prototype[method] = async function (...args) {
      const hold = armed;
      armed = false;
      const result = await nativeRead.apply(this, args);
      if (hold) {
        update(`Held ${method} completion for ${this.name} (${this.size} bytes)`);
        await new Promise((resolve) => pending.push(resolve));
        update(`Released ${method} completion for ${this.name} (${this.size} bytes)`);
      }
      return result;
    };
  }
  document.addEventListener("DOMContentLoaded", () => {
    const panel = document.createElement("aside");
    panel.setAttribute("aria-label", "Test file IO scheduler");
    panel.style.cssText =
      "position:fixed;bottom:0;left:0;z-index:2147483647;background:#fff;color:#000;padding:10px;border:2px solid #c60;font:14px sans-serif";
    const arm = document.createElement("button");
    arm.textContent = "Hold next real file read";
    arm.onclick = () => {
      armed = true;
      update("Armed for next real File read");
    };
    const release = document.createElement("button");
    release.textContent = "Release held file read";
    release.onclick = () => {
      for (const resolve of pending.splice(0)) resolve();
    };
    status = document.createElement("output");
    status.setAttribute("aria-label", "File IO scheduling status");
    status.textContent = "Real file reads run normally";
    panel.append(arm, release, status);
    document.body.append(panel);
  });
})();
