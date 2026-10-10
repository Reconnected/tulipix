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
    generateReport();
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
    const periodTitle = document.getElementById('reportPeriodTitle');
    const tbody = document.getElementById('reportTableBody');

    if (!tbody) return;

    let list = [...(window.dataStore.transaksi || [])];

    if (bulan) {
        list = list.filter(t => t.tanggal && t.tanggal.startsWith(bulan));
        const d = new Date(bulan + "-01");
        const monthStr = d.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
        if (periodTitle) periodTitle.innerText = `Bulan Pembayaran: ${monthStr}`;
    } else {
        if (periodTitle) periodTitle.innerText = `Bulan Pembayaran: Semua Waktu (Keseluruhan)`;
    }

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
