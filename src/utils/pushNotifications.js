const PUSH_DEVICE_ID_KEY = 'vnme_push_device_id';

function getPushDeviceId() {
    let id = localStorage.getItem(PUSH_DEVICE_ID_KEY);
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(PUSH_DEVICE_ID_KEY, id);
    }
    return id;
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function isPushSupported() {
    return (
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window &&
        window.isSecureContext
    );
}

export async function registerVietnamyServiceWorker() {
    if (!('serviceWorker' in navigator)) return null;
    return navigator.serviceWorker.register('/vnme-sw.js');
}

export async function getPushReminderStatus() {
    if (!isPushSupported()) return 'unsupported';
    if (Notification.permission === 'denied') return 'blocked';
    const registration = await registerVietnamyServiceWorker();
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) return 'enabled';
    return Notification.permission === 'granted' ? 'ready' : 'default';
}

export async function enablePushReminders({ userId, userName = '' } = {}) {
    if (!isPushSupported()) {
        return { ok: false, status: 'unsupported', message: 'Push reminders need an installed PWA or a supported browser.' };
    }
    if (!userId) {
        return { ok: false, status: 'auth-required', message: 'Sign in to enable push reminders.' };
    }

    const keyResponse = await fetch('/api/push/vapid-public-key');
    if (!keyResponse.ok) {
        return { ok: false, status: 'server-missing-key', message: 'Push reminders need server setup.' };
    }
    const keyData = await keyResponse.json();
    if (!keyData.enabled || !keyData.publicKey) {
        return { ok: false, status: 'server-missing-key', message: 'Push reminders need VAPID keys on the server.' };
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        return { ok: false, status: permission === 'denied' ? 'blocked' : 'default', message: 'Notification permission was not granted.' };
    }

    const registration = await registerVietnamyServiceWorker();
    const subscription = await registration.pushManager.getSubscription()
        || await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(keyData.publicKey),
        });

    const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            subscription,
            userId,
            userName,
            platform: navigator.userAgent,
            deviceId: getPushDeviceId(),
        }),
    });

    if (!response.ok) {
        return { ok: false, status: 'subscribe-failed', message: 'Could not save this device for reminders.' };
    }

    return { ok: true, status: 'enabled' };
}

export async function disablePushReminders({ userId } = {}) {
    if (!isPushSupported()) {
        return { ok: false, status: 'unsupported', message: 'Push reminders are unavailable.' };
    }

    const registration = await registerVietnamyServiceWorker();
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return { ok: true, status: Notification.permission === 'denied' ? 'blocked' : 'default' };

    const payload = { subscription, userId: userId || 'anonymous', deviceId: getPushDeviceId() };
    await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    }).catch(() => {});
    await subscription.unsubscribe().catch(() => {});

    return { ok: true, status: Notification.permission === 'denied' ? 'blocked' : 'default' };
}

export function trackPushReturnFromUrl(userId) {
    const params = new URLSearchParams(window.location.search);
    const notificationId = params.get('notification');
    if (!notificationId) return;
    if (!userId) return;
    const scenarioId = params.get('scenario') || '';
    const variantId = params.get('variant') || '';

    fetch('/api/messages/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            event: 'clicked',
            messageInstanceId: notificationId,
            scenarioId,
            variantId,
            channel: 'push',
            userId,
            metadata: { source: 'push_return_url', path: window.location.pathname },
        }),
    }).catch(() => {});

    fetch('/api/push/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'opened_app',
            notificationId,
            scenarioId,
            variantId,
            userId,
            metadata: { path: window.location.pathname },
        }),
    }).catch(() => {});

    params.delete('notification');
    params.delete('scenario');
    params.delete('variant');
    const nextSearch = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`);
}
