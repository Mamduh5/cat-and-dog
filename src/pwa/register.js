if ("serviceWorker" in navigator) {
  const serviceWorkerUrl = new URL("../../service-worker.js", import.meta.url);

  window.addEventListener("load", () => {
    navigator.serviceWorker.register(serviceWorkerUrl).catch(() => {
      // Ignore registration failures so static hosting keeps working without extra setup.
    });
  });
}
