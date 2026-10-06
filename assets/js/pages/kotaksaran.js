// Pengiriman saran anonim; daftar saran hanya tersedia di dashboard admin.

document.getElementById('formSaran')?.addEventListener('submit', async event => {
    event.preventDefault();
    const input = document.getElementById('isiSaran');
    const button = document.getElementById('btnKirimSaran');
    const status = document.getElementById('formSaranStatus');
    const text = input.value.trim();
    if (text.length < 3 || text.length > 2000) {
        status.className = 'text-xs text-rose-600';
        status.textContent = 'Saran harus berisi 3 sampai 2.000 karakter.';
        return;
    }

    button.disabled = true;
    try {
        await window.submitAnonymousSuggestion(text);
        input.value = '';
        status.className = 'text-xs text-emerald-700';
        status.textContent = 'Terima kasih. Saran Anda telah dikirim secara anonim.';
    } catch (error) {
        status.className = 'text-xs text-rose-600';
        status.textContent = `Saran gagal dikirim: ${error.message}`;
    } finally {
        button.disabled = false;
    }
});
