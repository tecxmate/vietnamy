self.addEventListener('push', (event) => {
    let payload = {};
    try {
        payload = event.data ? event.data.json() : {};
    } catch {
        payload = {};
    }

    const title = payload.title || 'Vietnamy';
    const options = {
        body: payload.body || 'Your Vietnamese practice is ready.',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: payload.templateId || 'vietnamy-reminder',
        data: {
            url: payload.url || '/',
            notificationId: payload.notificationId || '',
            templateId: payload.templateId || '',
            scenarioId: payload.scenarioId || '',
            variantId: payload.variantId || '',
            subscriptionId: payload.subscriptionId || '',
        },
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const data = event.notification.data || {};
    const url = new URL(data.url || '/', self.location.origin);
    if (data.notificationId) url.searchParams.set('notification', data.notificationId);
    if (data.scenarioId) url.searchParams.set('scenario', data.scenarioId);
    if (data.variantId) url.searchParams.set('variant', data.variantId);

    const trackClick = fetch('/api/push/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'clicked',
            notificationId: data.notificationId || '',
            templateId: data.templateId || '',
            scenarioId: data.scenarioId || '',
            variantId: data.variantId || '',
            subscriptionId: data.subscriptionId || '',
        }),
    }).catch(() => {});

    const openClient = clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
            if ('focus' in client) {
                client.navigate(url.href);
                return client.focus();
            }
        }
        return clients.openWindow(url.href);
    });

    event.waitUntil(Promise.all([trackClick, openClient]));
});
