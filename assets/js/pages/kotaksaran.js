// Pengiriman saran anonim; daftar saran hanya tersedia di dashboard admin.

let saranNotificationTimeout;

function showSaranNotification(message, isError = false) {
    const notification = document.getElementById('saranNotification');
    const icon = document.getElementById('saranNotificationIcon');
    const text = document.getElementById('saranNotificationMessage');
    if (!notification || !icon || !text) return;

    text.textContent = message;
    icon.className = isError
        ? 'fa-solid fa-circle-exclamation text-rose-400 text-base'
        : 'fa-solid fa-circle-check text-emerald-400 text-base';
    notification.classList.remove('opacity-0', 'translate-y-4');
    clearTimeout(saranNotificationTimeout);
    saranNotificationTimeout = setTimeout(() => {
        notification.classList.add('opacity-0', 'translate-y-4');
    }, 4000);
}

document.getElementById('formSaran')?.addEventListener('submit', async event => {
    event.preventDefault();
    const input = document.getElementById('isiSaran');
    const button = document.getElementById('btnKirimSaran');
    const text = input.value.trim();
    if (text.length < 3 || text.length > 2000) {
        showSaranNotification('Saran harus berisi 3 sampai 2.000 karakter.', true);
        input.focus();
        return;
    }

    button.disabled = true;
    try {
        await window.submitAnonymousSuggestion(text);
        input.value = '';
        showSaranNotification('Terima kasih. Saran Anda telah dikirim secara anonim.');
    } catch (error) {
        showSaranNotification(`Saran gagal dikirim: ${error.message}`, true);
    } finally {
        button.disabled = false;
    }
});
