import { apiUrl } from './apiUrl';

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

export async function enablePushReminders({ userId = 'anonymous', userName = '' } = {}) {
    if (!isPushSupported()) {
        return { ok: false, status: 'unsupported', message: 'Push reminders need an installed PWA or a supported browser.' };
    }

    const keyResponse = await fetch(apiUrl('/api/push/vapid-public-key'));
    const keyData = await keyResponse.json();
    if (!keyData.enabled || !keyData.publicKey) {
        return { ok: false, status: 'server-missing-key', message: 'Push reminders need VAPID keys on the server.' };
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        return { ok: false, status: permission === 'denied' ? 'blocked' : 'default', message: 'Notification permission was not granted.' };
    }

    const registration = await registerVietnamyServiceWorker();
    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyData.publicKey),
    });

    const response = await fetch(apiUrl('/api/push/subscribe'), {
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

export function trackPushReturnFromUrl(userId = 'anonymous') {
    const params = new URLSearchParams(window.location.search);
    const notificationId = params.get('notification');
    if (!notificationId) return;

    fetch(apiUrl('/api/push/events'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'opened_app',
            notificationId,
            userId,
            metadata: { path: window.location.pathname },
        }),
    }).catch(() => {});

    params.delete('notification');
    const nextSearch = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`);
}
