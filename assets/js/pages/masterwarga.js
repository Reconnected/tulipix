// Halaman Master Warga: daftar, filter, tambah/edit/hapus

function refreshAllUI() {
    renderWargaTable();
}

function renderWargaTable() {
    const tbody = document.getElementById('wargaTableBody');
    if (!tbody) return;

    const search = (document.getElementById('searchWarga')?.value || '').toLowerCase();
    const filterIuran = document.getElementById('filterStatusIuran')?.value || '';

    let list = window.dataStore.warga || [];

    if (search) list = list.filter(w => w.nama.toLowerCase().includes(search) || w.blok.toLowerCase().includes(search));
    if (filterIuran) list = list.filter(w => w.statusIuran === filterIuran);

    tbody.innerHTML = '';

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-400 italic">Data warga tidak ditemukan.</td></tr>`;
        return;
    }
    // --- OPSI SORTING NOMOR RUMAH / BLOK ---
    list.sort((a, b) => {
    // Gunakan 'numeric: true' agar "A-2" datang SEBELUM "A-10"
    return (a.nomorRumah || a.blok || '').localeCompare(
        (b.nomorRumah || b.blok || ''), 
        undefined, 
        { numeric: true, sensitivity: 'base' }
    );
    });
    const isAdmin = window.isAdmin;

    list.forEach(w => {
        const isLunas = w.statusIuran === 'Lunas';
        tbody.innerHTML += `
            <tr class="hover:bg-slate-50 transition">
                <td class="p-4 font-semibold text-slate-800">${w.blok}</td>
                <td class="p-4 font-medium text-slate-900">${w.nama}</td>
                <td class="p-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${w.statusHunian === 'Tetap' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}">
                        ${w.statusHunian}
                    </span>
                </td>
                <td class="p-4 text-slate-600">${w.hp || '-'}</td>
                <td class="p-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${isLunas ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                        <i class="fa-solid ${isLunas ? 'fa-check' : 'fa-clock'} mr-1"></i> ${w.statusIuran}
                    </span>
                </td>
                <td class="p-4 text-center space-x-2 ${isAdmin ? '' : 'hidden'}">
                    <button onclick="editWarga('${w.id}')" title="Edit Warga" class="bg-blue-50 text-blue-600 hover:bg-blue-100 p-2 rounded-lg border border-blue-200 transition">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button onclick="deleteWarga('${w.id}', '${w.nama}')" title="Hapus Warga" class="bg-rose-50 text-rose-600 hover:bg-rose-100 p-2 rounded-lg border border-rose-200 transition">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
}

function openModalWarga(id = null) {
    const form = document.getElementById('formWarga');
    if (form) form.reset();
    const wId = document.getElementById('wargaId');
    if (wId) wId.value = '';
    const modalTitle = document.getElementById('modalWargaTitle');
    if (modalTitle) modalTitle.innerText = id ? 'Edit Data Warga' : 'Tambah Data Warga';

    if (id) {
        const w = window.dataStore.warga.find(x => x.id === id);
        if (w) {
            if (document.getElementById('wargaId')) document.getElementById('wargaId').value = w.id;
            if (document.getElementById('wargaNama')) document.getElementById('wargaNama').value = w.nama;
            if (document.getElementById('wargaBlok')) document.getElementById('wargaBlok').value = w.blok;
            if (document.getElementById('wargaStatusHunian')) document.getElementById('wargaStatusHunian').value = w.statusHunian;
            if (document.getElementById('wargaHp')) document.getElementById('wargaHp').value = w.hp || '';
            if (document.getElementById('wargaStatusIuran')) document.getElementById('wargaStatusIuran').value = w.statusIuran;
        }
    }
    const modal = document.getElementById('modalWarga');
    if (modal) modal.classList.remove('hidden');
}

function closeModalWarga() {
    const modal = document.getElementById('modalWarga');
    if (modal) modal.classList.add('hidden');
}

async function saveWarga(e) {
    e.preventDefault();
    const id = document.getElementById('wargaId')?.value;
    const item = {
        id: id || undefined,
        nama: document.getElementById('wargaNama')?.value || '',
        blok: document.getElementById('wargaBlok')?.value || '',
        statusHunian: document.getElementById('wargaStatusHunian')?.value || 'Tetap',
        hp: document.getElementById('wargaHp')?.value || '',
        statusIuran: document.getElementById('wargaStatusIuran')?.value || 'Lunas',
    };
    await window.dbSave('warga', item);
    closeModalWarga();
}

function editWarga(id) { openModalWarga(id); }

function deleteWarga(id, nama) { window.confirmDelete('warga', id, nama); }
