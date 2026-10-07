// Halaman Dashboard: ringkasan kas, grafik 6 bulan, transaksi terakhir

let myFinanceChart = null;

function refreshAllUI() {
    renderDashboard();
    renderKartuIuranWarga();
    renderDashboardSuggestions();
}

function renderKartuIuranWarga() {
    const select = document.getElementById('kartuIuranWarga');
    const yearSelect = document.getElementById('kartuIuranTahun');
    const container = document.getElementById('kartuIuranBulan');
    if (!select || !yearSelect || !container) return;

    const selectedId = select.value;
    const selectedYear = yearSelect.value;
    select.replaceChildren(new Option('Pilih nama / nomor rumah', ''));
    yearSelect.replaceChildren(new Option('Pilih tahun', ''));

    const warga = [...(window.dataStore.warga || [])].sort((a, b) =>
        (a.blok || '').localeCompare(b.blok || '', 'id', { numeric: true, sensitivity: 'base' }) ||
        (a.nama || '').localeCompare(b.nama || '', 'id', { sensitivity: 'base' })
    );
    warga.forEach(w => select.add(new Option(`${w.nama || 'Tanpa nama'} (${w.blok || 'Tanpa nomor rumah'})`, w.id)));

    if (warga.some(w => w.id === selectedId)) select.value = selectedId;

    const monthNames = {
        januari: 0, februari: 1, maret: 2, april: 3, mei: 4, juni: 5,
        juli: 6, agustus: 7, september: 8, oktober: 9, november: 10, desember: 11
    };
    const monthPattern = /iuran\s+kas\s+lorong\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\s+(\d{4})\s*$/i;
    const months = new Map();

    (window.dataStore.kategori || []).forEach(category => {
        const match = (category.nama || '').match(monthPattern);
        if (!match) return;

        const month = match[1].toLowerCase();
        const year = Number(match[2]);
        const key = `${year}-${String(monthNames[month] + 1).padStart(2, '0')}`;
        if (!months.has(key)) months.set(key, { key, month, year, categoryIds: [] });
        months.get(key).categoryIds.push(category.id);
    });

    const years = [...new Set([...months.values()].map(month => month.year))].sort((a, b) => b - a);
    years.forEach(year => yearSelect.add(new Option(String(year), String(year))));
    if (years.includes(Number(selectedYear))) yearSelect.value = selectedYear;

    container.replaceChildren();

    if (months.size === 0) {
        const message = document.createElement('p');
        message.className = 'text-sm text-slate-500 italic';
        message.textContent = 'Belum ada kategori iuran bulanan dengan format “Iuran Kas Lorong [Bulan] [Tahun]”.';
        container.append(message);
        return;
    }

    if (!select.value || !yearSelect.value) {
        const message = document.createElement('p');
        message.className = 'text-sm text-slate-400 italic';
        message.textContent = !select.value
            ? 'Pilih warga untuk melihat status pembayaran iuran.'
            : 'Pilih tahun untuk melihat status pembayaran iuran.';
        container.append(message);
        return;
    }

    const selectedWargaId = select.value;
    const monthEntries = [...months.values()]
        .filter(month => month.year === Number(yearSelect.value))
        .sort((a, b) => b.key.localeCompare(a.key));
    monthEntries.forEach(month => {
        const payments = (window.dataStore.transaksi || [])
            .filter(transaction =>
                transaction.wargaId === selectedWargaId &&
                transaction.tipe === 'Pemasukan' &&
                month.categoryIds.includes(transaction.kategoriId)
            )
            .sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
        const paid = payments.length > 0;
        const card = document.createElement('article');
        card.className = `p-4 rounded-xl border ${paid ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`;

        const title = document.createElement('h4');
        title.className = 'font-semibold text-slate-800';
        title.textContent = `${month.month.charAt(0).toUpperCase()}${month.month.slice(1)} ${month.year}`;

        const status = document.createElement('p');
        status.className = `mt-2 inline-flex items-center gap-1.5 text-xs font-semibold ${paid ? 'text-emerald-700' : 'text-amber-700'}`;
        status.innerHTML = paid
            ? '<i class="fa-solid fa-circle-check"></i> Lunas'
            : '<i class="fa-solid fa-clock"></i> Belum tercatat';
        card.append(title, status);

        if (paid) {
            const payment = payments[0];
            const detail = document.createElement('p');
            detail.className = 'mt-1 text-xs text-slate-500';
            detail.textContent = [
                payment.tanggal ? new Date(`${payment.tanggal}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
                payment.jumlah ? formatRupiah(payment.jumlah) : ''
            ].filter(Boolean).join(' · ');
            if (detail.textContent) card.append(detail);
        }

        container.append(card);
    });
}

function renderDashboardSuggestions() {
    const container = document.getElementById('daftarSaranDashboard');
    if (!container || !window.isAdmin) return;

    const suggestions = [...(window.dataStore.kotaksaran || [])].sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return dateB - dateA;
    });
    document.getElementById('jumlahSaranDashboard').textContent = `${suggestions.length} saran`;
    container.replaceChildren();

    if (!suggestions.length) {
        const empty = document.createElement('p');
        empty.className = 'text-sm text-slate-500 italic py-3';
        empty.textContent = 'Belum ada saran yang masuk.';
        container.append(empty);
        return;
    }

    suggestions.forEach(suggestion => {
        const card = document.createElement('article');
        card.className = 'p-4 bg-slate-50 border border-slate-200 rounded-xl';

        const header = document.createElement('div');
        header.className = 'flex items-start justify-between gap-3';
        const date = document.createElement('time');
        date.className = 'text-[11px] text-slate-400';
        if (suggestion.createdAt?.toDate) {
            const value = suggestion.createdAt.toDate();
            date.dateTime = value.toISOString();
            date.textContent = new Intl.DateTimeFormat('id-ID', {
                dateStyle: 'medium',
                timeStyle: 'short'
            }).format(value);
        } else {
            date.textContent = 'Waktu belum tersedia';
        }

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg text-xs font-semibold';
        deleteButton.innerHTML = '<i class="fa-solid fa-trash mr-1"></i> Hapus';
        deleteButton.addEventListener('click', () => window.confirmDelete('kotaksaran', suggestion.id, 'saran anonim'));
        header.append(date, deleteButton);

        const text = document.createElement('p');
        text.className = 'text-sm text-slate-700 leading-relaxed mt-3 whitespace-pre-line break-words';
        text.textContent = suggestion.text || '';
        card.append(header, text);
        container.append(card);
    });
}

function renderDashboard() {
    const transaksi = window.dataStore.transaksi || [];
    const warga = window.dataStore.warga || [];

    const now = new Date();
    const currentYearMonth = now.toISOString().slice(0, 7);

    let totalKas = 0;
    let masukBulanIni = 0;
    let keluarBulanIni = 0;

    transaksi.forEach(t => {
        const amount = Number(t.jumlah) || 0;
        if (t.tipe === 'Pemasukan') {
            totalKas += amount;
            if (t.tanggal && t.tanggal.startsWith(currentYearMonth)) masukBulanIni += amount;
        } else if (t.tipe === 'Pengeluaran') {
            totalKas -= amount;
            if (t.tanggal && t.tanggal.startsWith(currentYearMonth)) keluarBulanIni += amount;
        }
    });

    const tunggakanCount = warga.filter(w => w.statusIuran === 'Tunggak').length;

    const dashKas = document.getElementById('dashTotalKas');
    if (dashKas) dashKas.innerText = formatRupiah(totalKas);
    const dashMasuk = document.getElementById('dashMasukBulan');
    if (dashMasuk) dashMasuk.innerText = formatRupiah(masukBulanIni);
    const dashKeluar = document.getElementById('dashKeluarBulan');
    if (dashKeluar) dashKeluar.innerText = formatRupiah(keluarBulanIni);
    const dashWarga = document.getElementById('dashTotalWarga');
    if (dashWarga) dashWarga.innerText = `${warga.filter(w => w.menempatiRumah === true).length} penghuni`;
    const dashTunggak = document.getElementById('dashTunggakanBadge');
    if (dashTunggak) dashTunggak.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${tunggakanCount} Menunggak Iuran`;

    const recentContainer = document.getElementById('dashRecentTransactions');
    if (recentContainer) {
        recentContainer.innerHTML = '';
        const sortedTx = [...transaksi].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)).slice(0, 5);

        if (sortedTx.length === 0) {
            recentContainer.innerHTML = `<p class="text-xs text-slate-400 italic">Belum ada data transaksi.</p>`;
        } else {
            sortedTx.forEach(t => {
                const isMasuk = t.tipe === 'Pemasukan';
                const icon = isMasuk ? 'fa-arrow-down text-emerald-600 bg-emerald-50' : 'fa-arrow-up text-rose-600 bg-rose-50';
                const kat = window.dataStore.kategori.find(k => k.id === t.kategoriId)?.nama || 'Umum';

                recentContainer.innerHTML += `
                    <div class="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition">
                        <div class="flex items-center space-x-3">
                            <div class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${icon}">
                                <i class="fa-solid ${icon.split(' ')[0]}"></i>
                            </div>
                            <div>
                                <p class="text-xs font-bold text-slate-800">${t.keterangan || kat}</p>
                                <p class="text-[10px] text-slate-400">${t.tanggal}</p>
                            </div>
                        </div>
                        <span class="text-xs font-bold ${isMasuk ? 'text-emerald-600' : 'text-rose-600'}">
                            ${isMasuk ? '+' : '-'}${formatRupiah(t.jumlah)}
                        </span>
                    </div>
                `;
            });
        }
    }

    renderChart();
}

function renderChart() {
    const ctx = document.getElementById('financeChart');
    if (!ctx) return;

    const labels = [];
    const masukData = [];
    const keluarData = [];

    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const yearMonth = d.toISOString().slice(0, 7);
        const monthName = d.toLocaleString('id-ID', { month: 'short', year: '2-digit' });

        labels.push(monthName);

        let sumMasuk = 0;
        let sumKeluar = 0;

        (window.dataStore.transaksi || []).forEach(t => {
            if (t.tanggal && t.tanggal.startsWith(yearMonth)) {
                if (t.tipe === 'Pemasukan') sumMasuk += Number(t.jumlah) || 0;
                if (t.tipe === 'Pengeluaran') sumKeluar += Number(t.jumlah) || 0;
            }
        });

        masukData.push(sumMasuk);
        keluarData.push(sumKeluar);
    }

    if (myFinanceChart) myFinanceChart.destroy();

    myFinanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Pemasukan', data: masukData, backgroundColor: '#22c55e', borderRadius: 6 },
                { label: 'Pengeluaran', data: keluarData, backgroundColor: '#f43f5e', borderRadius: 6 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: (val) => 'Rp ' + (val / 1000) + 'k' }
                }
            }
        }
    });
}
