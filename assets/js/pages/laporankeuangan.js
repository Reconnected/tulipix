// Halaman Laporan Keuangan: rekap per periode & cetak

const REPORT_PAGE_SIZE = 25;
let reportCurrentPage = 1;
let isPrintingReport = false;

function formatReportTransactionPeriod(periode) {
    if (!periode) return '-';
    const date = new Date(`${periode}-01T00:00:00`);
    return Number.isNaN(date.getTime())
        ? periode
        : date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

function refreshAllUI() {
    populateReportCategoryFilter();
    generateReport();
}

function populateReportCategoryFilter() {
    const options = document.getElementById('reportKategoriOptions');
    if (!options) return;

    const selectedIds = new Set(getSelectedReportCategoryIds());
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
        updateReportCategoryFilter();
    });
    const allText = document.createElement('span');
    allText.textContent = 'Semua kategori';
    allLabel.append(allCheckbox, allText);
    options.append(allLabel);

    [...(window.dataStore.kategori || [])]
        .sort((a, b) => (a.nama || '').localeCompare(b.nama || '', 'id', { sensitivity: 'base' }))
        .forEach(category => {
            const label = document.createElement('label');
            label.className = 'flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 text-sm cursor-pointer';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.dataset.categoryFilter = 'true';
            checkbox.value = category.id;
            checkbox.checked = selectedIds.has(category.id);
            checkbox.addEventListener('change', updateReportCategoryFilter);
            const text = document.createElement('span');
            text.textContent = category.nama || 'Tanpa nama';
            label.append(checkbox, text);
            options.append(label);
        });
    updateReportCategoryFilter();
}

function getSelectedReportCategoryIds() {
    return [...(document.querySelectorAll('#reportKategoriOptions [data-category-filter]:checked'))]
        .map(checkbox => checkbox.value);
}

function updateReportCategoryFilter() {
    const options = document.getElementById('reportKategoriOptions');
    const label = document.getElementById('reportKategoriLabel');
    if (!options || !label) return;

    const selected = getSelectedReportCategoryIds();
    const allCheckbox = options.querySelector('label input[type="checkbox"]:not([data-category-filter])');
    if (allCheckbox) {
        allCheckbox.checked = selected.length === 0;
        allCheckbox.indeterminate = selected.length > 0;
    }
    label.textContent = selected.length ? `${selected.length} kategori dipilih` : 'Semua Kategori';
    reportPeriodChanged();
}

function reportPeriodChanged() {
    reportCurrentPage = 1;
    generateReport();
}

function changeReportPage(page) {
    reportCurrentPage = page;
    generateReport();
}

function renderReportPagination(totalItems) {
    const pagination = document.getElementById('reportPagination');
    if (!pagination) return;

    const totalPages = Math.max(1, Math.ceil(totalItems / REPORT_PAGE_SIZE));
    reportCurrentPage = Math.min(Math.max(reportCurrentPage, 1), totalPages);

    if (totalItems === 0) {
        pagination.innerHTML = '';
        return;
    }

    const firstItem = (reportCurrentPage - 1) * REPORT_PAGE_SIZE + 1;
    const lastItem = Math.min(reportCurrentPage * REPORT_PAGE_SIZE, totalItems);
    pagination.innerHTML = `
        <span>Menampilkan ${firstItem}–${lastItem} dari ${totalItems} transaksi</span>
        <div class="flex items-center gap-2">
            <button onclick="changeReportPage(${reportCurrentPage - 1})" ${reportCurrentPage === 1 ? 'disabled' : ''} class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">Sebelumnya</button>
            <span>Halaman ${reportCurrentPage} dari ${totalPages}</span>
            <button onclick="changeReportPage(${reportCurrentPage + 1})" ${reportCurrentPage === totalPages ? 'disabled' : ''} class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">Berikutnya</button>
        </div>
    `;
}

function generateReport() {
    const bulan = document.getElementById('reportBulan')?.value || '';
    const periode = document.getElementById('reportPeriode')?.value || '';
    const kategoriIds = getSelectedReportCategoryIds();
    const periodTitle = document.getElementById('reportPeriodTitle');
    const tbody = document.getElementById('reportTableBody');

    if (!tbody) return;

    let list = [...(window.dataStore.transaksi || [])];

    if (bulan) {
        list = list.filter(t => t.tanggal && t.tanggal.startsWith(bulan));
    }
    if (periode) list = list.filter(t => t.periode === periode);
    if (kategoriIds.length) list = list.filter(t => kategoriIds.includes(t.kategoriId));

    const filterDescriptions = [
        bulan ? `Tanggal input: ${formatReportTransactionPeriod(bulan)}` : 'Tanggal input: semua',
        periode ? `Periode tujuan: ${formatReportTransactionPeriod(periode)}` : 'Periode tujuan: semua',
        kategoriIds.length
            ? `Kategori: ${window.dataStore.kategori.filter(category => kategoriIds.includes(category.id)).map(category => category.nama || 'Tanpa nama').join(', ')}`
            : 'Kategori: semua'
    ];
    if (periodTitle) periodTitle.innerText = filterDescriptions.join(' · ');

    list.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));

    let totMasuk = 0;
    let totKeluar = 0;

    list.forEach(t => {
        const amount = Number(t.jumlah) || 0;
        if (t.tipe === 'Pemasukan') totMasuk += amount;
        else totKeluar += amount;
    });

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="py-4 text-center text-slate-400 italic">Tidak ada data transaksi pada periode ini.</td></tr>`;
    } else {
        const totalPages = Math.max(1, Math.ceil(list.length / REPORT_PAGE_SIZE));
        reportCurrentPage = Math.min(Math.max(reportCurrentPage, 1), totalPages);
        const startIndex = isPrintingReport ? 0 : (reportCurrentPage - 1) * REPORT_PAGE_SIZE;
        const pageItems = isPrintingReport ? list : list.slice(startIndex, startIndex + REPORT_PAGE_SIZE);

        tbody.innerHTML = '';
        pageItems.forEach((t, idx) => {
            const isMasuk = t.tipe === 'Pemasukan';
            const amount = Number(t.jumlah) || 0;

            const katObj = window.dataStore.kategori.find(k => k.id === t.kategoriId);
            const wargaObj = window.dataStore.warga.find(w => w.id === t.wargaId);

            let ketDetail = t.keterangan || '-';
            if (wargaObj) ketDetail += ` (${wargaObj.nama} - ${wargaObj.blok})`;

            tbody.innerHTML += `
                <tr class="border-b border-slate-100">
                    <td class="py-2.5 px-3 text-slate-500">${startIndex + idx + 1}</td>
                    <td class="py-2.5 px-3 font-medium text-slate-800">${t.tanggal}</td>
                    <td class="py-2.5 px-3">${formatReportTransactionPeriod(t.periode)}</td>
                    <td class="py-2.5 px-3">${t.tipe}</td>
                    <td class="py-2.5 px-3">${katObj ? katObj.nama : 'Umum'}</td>
                    <td class="py-2.5 px-3 text-slate-600">${ketDetail}</td>
                    <td class="py-2.5 px-3 text-right font-medium text-emerald-600">${isMasuk ? formatRupiah(amount) : '-'}</td>
                    <td class="py-2.5 px-3 text-right font-medium text-rose-600">${!isMasuk ? formatRupiah(amount) : '-'}</td>
                </tr>
            `;
        });
    }
    renderReportPagination(list.length);

    const repMasuk = document.getElementById('repTotalMasuk');
    if (repMasuk) repMasuk.innerText = formatRupiah(totMasuk);
    const repKeluar = document.getElementById('repTotalKeluar');
    if (repKeluar) repKeluar.innerText = formatRupiah(totKeluar);

    const selisih = totMasuk - totKeluar;
    const selisihEl = document.getElementById('repSelisih');
    if (selisihEl) {
        selisihEl.innerText = formatRupiah(selisih);
        selisihEl.className = `text-lg sm:text-xl font-bold mt-1 ${selisih >= 0 ? 'text-slate-800' : 'text-rose-600'}`;
    }
}

window.addEventListener('beforeprint', () => {
    isPrintingReport = true;
    generateReport();
});

window.addEventListener('afterprint', () => {
    isPrintingReport = false;
    generateReport();
});

document.addEventListener('click', event => {
    const dropdown = document.getElementById('reportKategoriDropdown');
    if (dropdown?.open && !dropdown.contains(event.target)) dropdown.open = false;
});

document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
        const dropdown = document.getElementById('reportKategoriDropdown');
        if (dropdown) dropdown.open = false;
    }
});
