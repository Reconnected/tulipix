// Halaman Transaksi: daftar, filter, catat/edit/hapus transaksi

const TRANSAKSI_PAGE_SIZE = 25;
let transaksiCurrentPage = 1;

function formatTransaksiPeriode(periode) {
    if (!periode) return '-';
    const date = new Date(`${periode}-01T00:00:00`);
    return Number.isNaN(date.getTime())
        ? periode
        : date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

function refreshAllUI() {
    populateCategoryFilter();
    renderTransaksiTable();
}

function populateCategoryFilter() {
    const options = document.getElementById('filterTxKategoriOptions');
    if (!options) return;

    const selectedIds = new Set(getSelectedTransactionCategoryIds());
    options.replaceChildren();
    const allLabel = document.createElement('label');
    allLabel.className = 'flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 text-sm cursor-pointer';
    const allCheckbox = document.createElement('input');
    allCheckbox.type = 'checkbox';
    allCheckbox.checked = selectedIds.size === 0;
    allCheckbox.addEventListener('change', () => {
        if (allCheckbox.checked) {
            options.querySelectorAll('[data-category-filter]').forEach(checkbox => { checkbox.checked = false; });
        }
        updateTransactionCategoryFilter();
    });
    const allText = document.createElement('span');
    allText.textContent = 'Semua kategori';
    allLabel.append(allCheckbox, allText);
    options.append(allLabel);

    [...(window.dataStore.kategori || [])]
        .sort((a, b) => (a.nama || '').localeCompare(b.nama || '', 'id', { sensitivity: 'base' }))
        .forEach(k => {
            const label = document.createElement('label');
            label.className = 'flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 text-sm cursor-pointer';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.dataset.categoryFilter = 'true';
            checkbox.value = k.id;
            checkbox.checked = selectedIds.has(k.id);
            checkbox.addEventListener('change', updateTransactionCategoryFilter);
            const text = document.createElement('span');
            text.textContent = `${k.nama || 'Tanpa nama'} (${k.tipe || 'Tanpa jenis'})`;
            label.append(checkbox, text);
            options.append(label);
        });
    updateTransactionCategoryFilter();
}

function getSelectedTransactionCategoryIds() {
    return [...(document.querySelectorAll('#filterTxKategoriOptions [data-category-filter]:checked'))]
        .map(checkbox => checkbox.value);
}

function updateTransactionCategoryFilter() {
    const options = document.getElementById('filterTxKategoriOptions');
    const label = document.getElementById('filterTxKategoriLabel');
    if (!options || !label) return;

    const selected = getSelectedTransactionCategoryIds();
    const allCheckbox = options.querySelector('label input[type="checkbox"]:not([data-category-filter])');
    if (allCheckbox) {
        allCheckbox.checked = selected.length === 0;
        allCheckbox.indeterminate = selected.length > 0;
    }
    label.textContent = selected.length ? `${selected.length} kategori dipilih` : 'Semua Kategori';
    filterTransaksiChanged();
}

function getFilteredTransaksi() {
    const tipe = document.getElementById('filterTxTipe')?.value || '';
    const kategoriIds = getSelectedTransactionCategoryIds();
    const bulan = document.getElementById('filterTxBulan')?.value || '';

    let list = [...(window.dataStore.transaksi || [])];

    if (tipe) list = list.filter(t => t.tipe === tipe);
    if (kategoriIds.length) list = list.filter(t => kategoriIds.includes(t.kategoriId));
    if (bulan) list = list.filter(t => t.periode === bulan);

    return list.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
}

function filterTransaksiChanged() {
    transaksiCurrentPage = 1;
    renderTransaksiTable();
}

function changeTransaksiPage(page) {
    transaksiCurrentPage = page;
    renderTransaksiTable();
}

function renderTransaksiPagination(totalItems) {
    const pagination = document.getElementById('transaksiPagination');
    if (!pagination) return;

    const totalPages = Math.max(1, Math.ceil(totalItems / TRANSAKSI_PAGE_SIZE));
    transaksiCurrentPage = Math.min(Math.max(transaksiCurrentPage, 1), totalPages);

    if (totalItems === 0) {
        pagination.innerHTML = '';
        return;
    }

    const firstItem = (transaksiCurrentPage - 1) * TRANSAKSI_PAGE_SIZE + 1;
    const lastItem = Math.min(transaksiCurrentPage * TRANSAKSI_PAGE_SIZE, totalItems);
    pagination.innerHTML = `
        <span>Menampilkan ${firstItem}–${lastItem} dari ${totalItems} transaksi</span>
        <div class="flex items-center gap-2">
            <button onclick="changeTransaksiPage(${transaksiCurrentPage - 1})" ${transaksiCurrentPage === 1 ? 'disabled' : ''} class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">Sebelumnya</button>
            <span>Halaman ${transaksiCurrentPage} dari ${totalPages}</span>
            <button onclick="changeTransaksiPage(${transaksiCurrentPage + 1})" ${transaksiCurrentPage === totalPages ? 'disabled' : ''} class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">Berikutnya</button>
        </div>
    `;
}

function renderTransaksiTable() {
    const tbody = document.getElementById('transaksiTableBody');
    if (!tbody) return;

    const list = getFilteredTransaksi();
    renderTransaksiPagination(list.length);
    const startIndex = (transaksiCurrentPage - 1) * TRANSAKSI_PAGE_SIZE;
    const pageItems = list.slice(startIndex, startIndex + TRANSAKSI_PAGE_SIZE);

    tbody.innerHTML = '';

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-slate-400 italic">Tidak ada catatan transaksi.</td></tr>`;
        return;
    }

    const isAdmin = window.isAdmin;

    pageItems.forEach(t => {
        const isMasuk = t.tipe === 'Pemasukan';
        const katObj = window.dataStore.kategori.find(k => k.id === t.kategoriId);
        const wargaObj = window.dataStore.warga.find(w => w.id === t.wargaId);
        const desc = t.keterangan || (katObj ? katObj.nama : 'Transaksi Kas');

        tbody.innerHTML += `
            <tr class="hover:bg-slate-50 transition">
                <td class="p-4 text-slate-600 font-medium">${t.tanggal}</td>
                <td class="p-4 text-slate-600">${formatTransaksiPeriode(t.periode)}</td>
                <td class="p-4">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${isMasuk ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                        ${t.tipe}
                    </span>
                </td>
                <td class="p-4 font-semibold text-slate-800">${katObj ? katObj.nama : 'Umum'}</td>
                <td class="p-4 text-slate-600">
                    ${t.keterangan || '-'}
                    ${wargaObj ? `<div class="text-xs text-emerald-700 font-medium"><i class="fa-solid fa-user text-[10px]"></i> ${wargaObj.nama} (${wargaObj.blok})</div>` : ''}
                </td>
                <td class="p-4 text-right font-bold ${isMasuk ? 'text-emerald-600' : 'text-rose-600'}">
                    ${formatRupiah(t.jumlah)}
                </td>
                <td class="p-4 text-center space-x-2 ${isAdmin ? '' : 'hidden'}">
                    <button onclick="editTransaksi('${t.id}')" title="Edit Transaksi" class="bg-blue-50 text-blue-600 hover:bg-blue-100 p-2 rounded-lg border border-blue-200 transition">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button onclick="deleteTransaksi('${t.id}', '${desc}')" title="Hapus Transaksi" class="bg-rose-50 text-rose-600 hover:bg-rose-100 p-2 rounded-lg border border-rose-200 transition">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
}

function getTransaksiExportRows() {
    return getFilteredTransaksi().map(t => {
        const katObj = window.dataStore.kategori.find(k => k.id === t.kategoriId);
        const wargaObj = window.dataStore.warga.find(w => w.id === t.wargaId);

        return {
            Tanggal: t.tanggal || '',
            Periode: formatTransaksiPeriode(t.periode),
            Jenis: t.tipe || '',
            Kategori: katObj ? katObj.nama : 'Umum',
            'Keterangan / Warga': [t.keterangan || '-', wargaObj ? `${wargaObj.nama} (${wargaObj.blok})` : ''].filter(Boolean).join(' - '),
            'Jumlah (Rp)': Number(t.jumlah) || 0
        };
    });
}

function getTransaksiExportFilename(extension) {
    const bulan = document.getElementById('filterTxBulan')?.value || 'semua-waktu';
    return `transaksi-kas-periode-${bulan}.${extension}`;
}

function downloadTransaksiExcel() {
    if (typeof XLSX === 'undefined') {
        window.showToast('Library Excel belum tersedia.', true);
        return;
    }

    const worksheet = XLSX.utils.json_to_sheet(getTransaksiExportRows());
    worksheet['!cols'] = [{ wch: 14 }, { wch: 20 }, { wch: 16 }, { wch: 24 }, { wch: 42 }, { wch: 18 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transaksi');
    XLSX.writeFile(workbook, getTransaksiExportFilename('xlsx'));
}

function downloadTransaksiPdf() {
    const pdfConstructor = window.jspdf?.jsPDF;
    if (!pdfConstructor) {
        window.showToast('Library PDF belum tersedia.', true);
        return;
    }

    const rows = getTransaksiExportRows();
    const pdf = new pdfConstructor({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const bulan = document.getElementById('filterTxBulan')?.value || '';
    const periodTitle = bulan ? `Periode tujuan ${formatTransaksiPeriode(bulan)}` : 'Semua periode tujuan';

    pdf.setFontSize(16);
    pdf.text('Catatan Transaksi Kas Warga Tulip IX', 14, 15);
    pdf.setFontSize(10);
    pdf.text(periodTitle, 14, 22);
    pdf.autoTable({
        startY: 28,
        head: [['Tanggal', 'Periode', 'Jenis', 'Kategori', 'Keterangan / Warga', 'Jumlah (Rp)']],
        body: rows.map(row => [row.Tanggal, row.Periode, row.Jenis, row.Kategori, row['Keterangan / Warga'], formatRupiah(row['Jumlah (Rp)'])]),
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [15, 118, 110] },
        columnStyles: { 5: { halign: 'right' } },
        didDrawPage: data => {
            pdf.setFontSize(8);
            pdf.text(`Halaman ${data.pageNumber}`, 196, 285, { align: 'right' });
        }
    });
    pdf.save(getTransaksiExportFilename('pdf'));
}

function populateModalCategoryDropdown() {
    const tipe = document.getElementById('txTipe')?.value || 'Pemasukan';
    const select = document.getElementById('txKategori');
    if (!select) return;
    select.innerHTML = '';

    const filtered = (window.dataStore.kategori || [])
        .filter(k => k.tipe === tipe)
        .sort((a, b) => (a.nama || '').localeCompare(b.nama || '', 'id', { sensitivity: 'base' }));
    filtered.forEach(k => { select.innerHTML += `<option value="${k.id}">${k.nama}</option>`; });
}

function populateModalWargaDropdown() {
    const select = document.getElementById('txWargaId');
    if (!select) return;
    select.innerHTML = '<option value="">-- Umum / Tanpa Nama Warga --</option>';
    (window.dataStore.warga || []).forEach(w => {
        select.innerHTML += `<option value="${w.id}">${w.nama} (${w.blok})</option>`;
    });
}

function openModalTransaksi(id = null) {
    const form = document.getElementById('formTransaksi');
    if (form) form.reset();
    const txId = document.getElementById('transaksiId');
    if (txId) txId.value = '';
    const txDate = document.getElementById('txTanggal');
    if (txDate) txDate.valueAsDate = new Date();
    const modalTitle = document.getElementById('modalTransaksiTitle');
    if (modalTitle) modalTitle.innerText = id ? 'Edit Transaksi' : 'Catat Transaksi Baru';

    populateModalCategoryDropdown();
    populateModalWargaDropdown();

    if (id) {
        const t = window.dataStore.transaksi.find(x => x.id === id);
        if (t) {
            if (document.getElementById('transaksiId')) document.getElementById('transaksiId').value = t.id;
            if (document.getElementById('txTanggal')) document.getElementById('txTanggal').value = t.tanggal;
            if (document.getElementById('txPeriode')) document.getElementById('txPeriode').value = t.periode || '';
            if (document.getElementById('txTipe')) document.getElementById('txTipe').value = t.tipe;
            populateModalCategoryDropdown();
            if (document.getElementById('txKategori')) document.getElementById('txKategori').value = t.kategoriId;
            if (document.getElementById('txJumlah')) document.getElementById('txJumlah').value = t.jumlah;
            if (document.getElementById('txWargaId')) document.getElementById('txWargaId').value = t.wargaId || '';
            if (document.getElementById('txKeterangan')) document.getElementById('txKeterangan').value = t.keterangan || '';
        }
    }
    const modal = document.getElementById('modalTransaksi');
    if (modal) modal.classList.remove('hidden');
}

function closeModalTransaksi() {
    const modal = document.getElementById('modalTransaksi');
    if (modal) modal.classList.add('hidden');
}

async function saveTransaksi(e) {
    e.preventDefault();
    const id = document.getElementById('transaksiId')?.value;
    const wargaIdSelected = document.getElementById('txWargaId')?.value;

    const item = {
        id: id || undefined,
        tanggal: document.getElementById('txTanggal')?.value || '',
        periode: document.getElementById('txPeriode')?.value || '',
        tipe: document.getElementById('txTipe')?.value || 'Pemasukan',
        kategoriId: document.getElementById('txKategori')?.value || '',
        jumlah: Number(document.getElementById('txJumlah')?.value) || 0,
        wargaId: wargaIdSelected || '',
        keterangan: document.getElementById('txKeterangan')?.value || ''
    };

    if (wargaIdSelected && item.tipe === 'Pemasukan') {
        const wIdx = window.dataStore.warga.findIndex(w => w.id === wargaIdSelected);
        if (wIdx >= 0) {
            const updatedWarga = { ...window.dataStore.warga[wIdx], statusIuran: 'Lunas' };
            await window.dbSave('warga', updatedWarga);
        }
    }

    await window.dbSave('transaksi', item);
    closeModalTransaksi();
}

function editTransaksi(id) { openModalTransaksi(id); }

function deleteTransaksi(id, desc) { window.confirmDelete('transaksi', id, desc); }

document.addEventListener('click', event => {
    const dropdown = document.getElementById('filterTxKategoriDropdown');
    if (dropdown?.open && !dropdown.contains(event.target)) dropdown.open = false;
});

document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
        const dropdown = document.getElementById('filterTxKategoriDropdown');
        if (dropdown) dropdown.open = false;
    }
});
