import NProgress from "nprogress";

NProgress.configure({
  showSpinner: false,
  trickleSpeed: 120,
  minimum: 0.08,
});

let activeCount = 0;
let watchdogTimer = null;

function scheduleWatchdog() {
  if (watchdogTimer) clearTimeout(watchdogTimer);
  if (activeCount <= 0) return;
  watchdogTimer = setTimeout(() => {
    // Safety net: force-close an accidentally stuck progress bar.
    activeCount = 0;
    NProgress.done(true);
    watchdogTimer = null;
  }, 15000);
}

export function startProgress() {
  activeCount += 1;
  if (activeCount === 1) NProgress.start();
  scheduleWatchdog();
}

export function doneProgress() {
  activeCount = Math.max(0, activeCount - 1);
  if (activeCount === 0) NProgress.done();
  scheduleWatchdog();
}

export function resetProgress() {
  activeCount = 0;
  if (watchdogTimer) clearTimeout(watchdogTimer);
  watchdogTimer = null;
  NProgress.done(true);
}
