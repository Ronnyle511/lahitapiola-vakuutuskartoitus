export function track(event, payload = {}) {
  const entry = {
    event,
    payload,
    at: new Date().toISOString()
  };

  window.analyticsEvents = window.analyticsEvents || [];
  window.analyticsEvents.push(entry);

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event, ...payload });
  }
}
