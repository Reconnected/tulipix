// Halaman Program Kerja: informasi publik yang dikelola admin

const programStatusStyles = {
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    Berjalan: 'bg-blue-50 text-blue-700 border-blue-200',
    Selesai: 'bg-emerald-50 text-emerald-700 border-emerald-200'
};
const programStatusOrder = { Pending: 0, Berjalan: 1, Selesai: 2 };

function refreshAllUI() {
    renderProgramKerja();
}

function renderProgramKerja() {
    const container = document.getElementById('programKerjaList');
    if (!container) return;

    const programs = window.dataStore.programkerja || [];
    const search = (document.getElementById('searchProgramKerja')?.value || '').trim().toLocaleLowerCase('id');
    const selectedStatus = document.getElementById('filterProgramStatus')?.value || '';
    const countByStatus = status => programs.filter(program => program.status === status).length;

    document.getElementById('programTotal').innerText = programs.length;
    document.getElementById('programBerjalan').innerText = countByStatus('Berjalan');
    document.getElementById('programPending').innerText = countByStatus('Pending');

    const filteredPrograms = programs.filter(program => {
        const matchesSearch = `${program.nama || ''} ${program.deskripsi || ''}`.toLocaleLowerCase('id').includes(search);
        return matchesSearch && (!selectedStatus || program.status === selectedStatus);
    }).sort((a, b) => {
        const statusOrder = (programStatusOrder[a.status] ?? 3) - (programStatusOrder[b.status] ?? 3);
        return statusOrder || (a.nama || '').localeCompare(b.nama || '', 'id');
    });

    container.replaceChildren();
    if (!filteredPrograms.length) {
        const empty = document.createElement('div');
        empty.className = 'lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-200/80 text-center';
        const icon = document.createElement('i');
        icon.className = 'fa-solid fa-clipboard-list text-3xl text-slate-300';
        const message = document.createElement('p');
        message.className = 'text-sm text-slate-500 mt-3';
        message.textContent = programs.length ? 'Tidak ada program yang cocok dengan pencarian atau filter.' : 'Belum ada program kerja yang dipublikasikan.';
        empty.append(icon, message);
        container.append(empty);
        return;
    }

    filteredPrograms.forEach(program => {
        const card = document.createElement('article');
        card.className = 'bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col';

        const heading = document.createElement('div');
        heading.className = 'flex items-start justify-between gap-3';
        const name = document.createElement('h3');
        name.className = 'font-bold text-slate-800 text-base leading-snug';
        name.textContent = program.nama || 'Program tanpa nama';
        const status = document.createElement('span');
        status.className = `shrink-0 inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-semibold ${programStatusStyles[program.status] || 'bg-slate-50 text-slate-600 border-slate-200'}`;
        status.textContent = program.status || 'Status belum ditentukan';
        heading.append(name, status);

        const description = document.createElement('p');
        description.className = 'text-sm text-slate-600 leading-relaxed mt-3 whitespace-pre-line';
        description.textContent = program.deskripsi || 'Belum ada keterangan.';
        card.append(heading, description);

        if (window.isAdmin) {
            const actions = document.createElement('div');
            actions.className = 'flex justify-end gap-2 border-t border-slate-100 mt-4 pt-3';
            const editButton = document.createElement('button');
            editButton.type = 'button';
            editButton.className = 'text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-semibold transition';
            editButton.innerHTML = '<i class="fa-solid fa-pen-to-square mr-1"></i> Edit';
            editButton.addEventListener('click', () => openModalProgramKerja(program.id));
            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.className = 'text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg text-xs font-semibold transition';
            deleteButton.innerHTML = '<i class="fa-solid fa-trash mr-1"></i> Hapus';
            deleteButton.addEventListener('click', () => window.confirmDelete('programkerja', program.id, program.nama || 'program kerja'));
            actions.append(editButton, deleteButton);
            card.append(actions);
        }
        container.append(card);
    });
}

function openModalProgramKerja(id = null) {
    const form = document.getElementById('formProgramKerja');
    form.reset();
    document.getElementById('programKerjaId').value = '';
    document.getElementById('modalProgramKerjaTitle').innerText = id ? 'Edit Program Kerja' : 'Tambah Program Kerja';

    if (id) {
        const program = (window.dataStore.programkerja || []).find(item => item.id === id);
        if (!program) {
            window.showToast('Program kerja tidak ditemukan. Muat ulang data dan coba lagi.', true);
            return;
        }
        document.getElementById('programKerjaId').value = program.id;
        document.getElementById('programKerjaNama').value = program.nama || '';
        document.getElementById('programKerjaDeskripsi').value = program.deskripsi || '';
        document.getElementById('programKerjaStatus').value = program.status || 'Pending';
    }
    document.getElementById('modalProgramKerja').classList.remove('hidden');
}

function closeModalProgramKerja() {
    document.getElementById('modalProgramKerja').classList.add('hidden');
}

async function saveProgramKerja(event) {
    event.preventDefault();
    const item = {
        id: document.getElementById('programKerjaId').value || undefined,
        nama: document.getElementById('programKerjaNama').value.trim(),
        deskripsi: document.getElementById('programKerjaDeskripsi').value.trim(),
        status: document.getElementById('programKerjaStatus').value
    };

    await window.dbSave('programkerja', item);
    closeModalProgramKerja();
}
