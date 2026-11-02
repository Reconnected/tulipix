// Laporan Bulanan Iuran Warga

function refreshAllUI() {
    generateMonthlyDuesReport();
}

function getMonthlyDuesYear() {
    const input = document.getElementById('monthlyDuesYear');
    return input?.value || String(new Date().getFullYear());
}

function getMonthlyDuesCategoryIds() {
    return (window.dataStore.kategori || [])
        .filter(category => (category.nama || '').trim().toLocaleLowerCase('id') === 'iuran kas lorong')
        .map(category => category.id);
}

function getMonthlyDuesRows() {
    const year = getMonthlyDuesYear();
    const categoryIds = getMonthlyDuesCategoryIds();
    const residents = [...(window.dataStore.warga || [])]
        .filter(w => Number(w.isActive ?? 1) === 1 && w.menempatiRumah === true)
        .sort((a, b) => (a.nomorRumah || a.blok || '').localeCompare(
            (b.nomorRumah || b.blok || ''), undefined, { numeric: true, sensitivity: 'base' }
        ));

    return residents.map(resident => {
        const months = [];
        for (let month = 1; month <= 12; month++) {
            const period = `${year}-${String(month).padStart(2, '0')}`;
            const paid = (window.dataStore.transaksi || []).some(t =>
                t.tipe === 'Pemasukan' &&
                t.wargaId === resident.id &&
                categoryIds.includes(t.kategoriId) &&
                t.periode === period
            );
            months.push(paid ? 1 : 0);
        }
        return { resident, months };
    });
}

function generateMonthlyDuesReport() {
    const input = document.getElementById('monthlyDuesYear');
    if (input && !input.value) input.value = String(new Date().getFullYear());

    const header = document.getElementById('monthlyDuesHeader');
    const tbody = document.getElementById('monthlyDuesTableBody');
    if (!header || !tbody) return;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    header.innerHTML = '<th class="py-2.5 px-3 sticky left-0 bg-slate-100">No. Rumah</th>' +
        '<th class="py-2.5 px-3 sticky left-[90px] bg-slate-100">Kepala Keluarga</th>' +
        monthNames.map(month => `<th class="py-2.5 px-2 text-center whitespace-nowrap">${month}</th>`).join('') +
        '<th class="py-2.5 px-3 text-center">Jumlah Lunas</th>';

    const rows = getMonthlyDuesRows();
    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="15" class="py-4 text-center text-slate-400 italic">Tidak ada warga aktif yang menempati rumah.</td></tr>';
        return;
    }

    tbody.innerHTML = rows.map(({ resident, months }) => {
        const monthCells = months.map(status => status === 1
            ? '<td class="py-2.5 px-2 text-center"><span class="inline-flex px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold">Lunas</span></td>'
            : '<td class="py-2.5 px-2 text-center"><span class="inline-flex px-2 py-1 rounded-full bg-rose-100 text-rose-700 font-semibold">Belum</span></td>'
        ).join('');
        const paidCount = months.filter(status => status === 1).length;
        return `<tr class="border-b border-slate-100"><td class="py-2.5 px-3 font-semibold sticky left-0 bg-white">${resident.blok || '-'}</td><td class="py-2.5 px-3 sticky left-[90px] bg-white">${resident.nama || '-'}</td>${monthCells}<td class="py-2.5 px-3 text-center font-bold">${paidCount}/12</td></tr>`;
    }).join('');
}

function downloadMonthlyDuesExcel() {
    if (typeof XLSX === 'undefined') {
        window.showToast?.('Library Excel belum tersedia.', true);
        return;
    }
    const year = getMonthlyDuesYear();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const data = [
        [`Laporan Bulanan Iuran Warga Tahun ${year}`], ['Warga aktif dan menempati rumah'], [],
        ['No. Rumah', 'Kepala Keluarga', ...monthNames, 'Jumlah Lunas'],
        ...getMonthlyDuesRows().map(({ resident, months }) => [
            resident.blok || '-', resident.nama || '-',
            ...months.map(status => status === 1 ? 'Lunas' : 'Belum'),
            `${months.filter(status => status === 1).length}/12`
        ])
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 14 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 14 } }];
    worksheet['!cols'] = [{ wch: 16 }, { wch: 28 }, ...monthNames.map(() => ({ wch: 10 })), { wch: 14 }];

    for (let row = 4; row < data.length; row++) {
        for (let column = 2; column <= 13; column++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: column });
            const status = worksheet[cellAddress]?.v;
            worksheet[cellAddress].s = {
                fill: { patternType: 'solid', fgColor: { rgb: status === 'Lunas' ? 'DCFCE7' : 'FFE4E6' } },
                font: { bold: true, color: { rgb: status === 'Lunas' ? '166534' : 'BE123C' } },
                alignment: { horizontal: 'center', vertical: 'center' },
                border: {
                    top: { style: 'thin', color: { rgb: 'CBD5E1' } },
                    bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
                    left: { style: 'thin', color: { rgb: 'CBD5E1' } },
                    right: { style: 'thin', color: { rgb: 'CBD5E1' } }
                }
            };
        }
    }

    const titleStyle = {
        font: { bold: true, sz: 14, color: { rgb: '1E293B' } },
        alignment: { horizontal: 'center', vertical: 'center' }
    };
    worksheet['A1'].s = titleStyle;
    worksheet['A2'].s = { font: { italic: true, color: { rgb: '64748B' } }, alignment: { horizontal: 'center' } };
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Iuran ${year}`);
    XLSX.writeFile(workbook, `laporan-bulanan-iuran-${year}.xlsx`);
}

function downloadMonthlyDuesPdf() {
    const pdfConstructor = window.jspdf?.jsPDF;
    if (!pdfConstructor) {
        window.showToast?.('Library PDF belum tersedia.', true);
        return;
    }
    const year = getMonthlyDuesYear();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const pdf = new pdfConstructor({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    pdf.setFontSize(16);
    pdf.text(`Laporan Bulanan Iuran Warga Tahun ${year}`, 14, 15);
    const rows = getMonthlyDuesRows().map(({ resident, months }) => [
        resident.blok || '-', resident.nama || '-',
        ...months.map(status => status === 1 ? 'Lunas' : 'Belum'),
        `${months.filter(status => status === 1).length}/12`
    ]);
    pdf.autoTable({
        startY: 27,
        head: [['No. Rumah', 'Kepala Keluarga', ...monthNames, 'Lunas']],
        body: rows,
        margin: { left: 10, right: 10 },
        styles: { fontSize: 7, cellPadding: 1.5, halign: 'center', overflow: 'linebreak' },
        headStyles: { fillColor: [15, 118, 110], textColor: 255 },
        columnStyles: { 0: { cellWidth: 24, halign: 'left' }, 1: { cellWidth: 42, halign: 'left' } },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        didParseCell: data => {
            if (data.section === 'body' && data.column.index >= 2 && data.column.index <= 13) {
                if (data.cell.raw === 'Lunas') {
                    data.cell.styles.fillColor = [220, 252, 231];
                    data.cell.styles.textColor = [22, 101, 52];
                    data.cell.styles.fontStyle = 'bold';
                } else if (data.cell.raw === 'Belum') {
                    data.cell.styles.fillColor = [255, 228, 230];
                    data.cell.styles.textColor = [190, 18, 60];
                    data.cell.styles.fontStyle = 'bold';
                }
            }
        }
    });
    pdf.save(`laporan-bulanan-iuran-${year}.pdf`);
}
