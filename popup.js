document.addEventListener('DOMContentLoaded', () => {
    // Luôn gọi autoInit để Preline nhận diện các thành phần tĩnh
    if (window.HSStaticMethods) {
        window.HSStaticMethods.autoInit();
    }
    const noteInput = document.getElementById('note-input');
    const addNoteBtn = document.getElementById('add-note-btn');
    const searchInput = document.getElementById('search-input');
    const notesContainer = document.getElementById('notes-container');
    const openFullscreenBtn = document.getElementById('open-fullscreen');

    let notes = [];
    let sortableInstance = null;

    // Initialize Sortable
    const initSortable = () => {
        if (sortableInstance) sortableInstance.destroy();
        sortableInstance = new Sortable(notesContainer, {
            animation: 150,
            handle: '.drag-handle',
            ghostClass: 'bg-blue-100',
            onEnd: () => {
                const newNotes = [];
                const cards = notesContainer.querySelectorAll('.note-card');
                cards.forEach(card => {
                    const id = parseInt(card.getAttribute('data-id'));
                    const note = notes.find(n => n.id === id);
                    if (note) newNotes.push(note);
                });
                notes = newNotes;
                saveNotes();
            }
        });
    };
    chrome.storage.local.get(['notes'], (result) => {
        if (result.notes) {
            notes = result.notes;
            renderNotes();
            initSortable();
        }
    });

    // Add Note
    const addNote = () => {
        const text = noteInput.value.trim();
        if (text) {
            const newNote = {
                id: Date.now(),
                content: text,
                pinned: false,
                timestamp: new Date().toLocaleString()
            };
            notes.unshift(newNote);
            saveNotes();
            noteInput.value = '';
            renderNotes();
            initSortable();
        }
    };

    if (addNoteBtn) addNoteBtn.addEventListener('click', addNote);
    if (noteInput) {
        noteInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addNote();
        });
    }

    // Open Fullscreen
    if (openFullscreenBtn) {
        openFullscreenBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: chrome.runtime.getURL('fullscreen.html') });
        });
    }

    // Live Search
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            renderNotes(query);
        });
    }

    // Save notes
    const saveNotes = () => {
        chrome.storage.local.set({ notes });
    };

    // Render Notes
    const renderNotes = (query = '') => {
        notesContainer.innerHTML = '';

        const filteredNotes = notes
            .filter(note => note.content.toLowerCase().includes(query))
            .sort((a, b) => (b.pinned - a.pinned)); // Pinned first

        if (filteredNotes.length === 0) {
            notesContainer.innerHTML = `
                <div class="text-center py-10">
                    <p class="text-gray-500 text-sm">Không tìm thấy ghi chú nào.</p>
                </div>
            `;
            return;
        }

        filteredNotes.forEach(note => {
            const card = document.createElement('div');
            card.setAttribute('data-id', note.id);
            const pinClasses = note.pinned
                ? 'border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-900/20'
                : 'border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900';

            card.className = `note-card group flex flex-col border shadow-sm rounded-xl p-4 md:p-5 dark:shadow-neutral-700/70 ${pinClasses}`;

            card.innerHTML = `
                <div class="flex justify-between items-start space-x-3">
                    <div class="drag-handle cursor-move opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 dark:text-neutral-600 dark:hover:text-neutral-400 transition-opacity">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                    </div>
                    <p class="text-sm text-gray-800 dark:text-neutral-200 break-words flex-grow select-all">${escapeHtml(note.content)}</p>
                    <div class="flex flex-shrink-0 gap-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button class="pin-btn p-1.5 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700" title="${note.pinned ? 'Unpin' : 'Pin'}">
                            <svg class="shrink-0 size-3.5 ${note.pinned ? 'fill-blue-600 text-blue-600 dark:fill-blue-500 dark:text-blue-500' : 'text-gray-500'}" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 20 2-2 5-5V4"/><path d="M15 2H9a1 1 0 0 0-1 1v2c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V3a1 1 0 0 0-1-1Z"/><path d="M12 6v14"/><path d="M8 22h8"/></svg>
                        </button>
                        <button class="copy-btn copy-feedback p-1.5 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700" title="Copy">
                            <span class="copy-icon">
                                <svg class="shrink-0 size-3.5 text-gray-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
                            </span>
                            <span class="check-icon hidden text-green-500">
                                <svg class="shrink-0 size-3.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </span>
                        </button>
                        <button class="delete-btn p-1.5 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-red-600 hover:bg-red-50 dark:bg-neutral-800 dark:border-neutral-700 dark:hover:bg-neutral-700" title="Delete">
                            <svg class="shrink-0 size-3.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                    </div>
                </div>
                <div class="mt-2 text-[10px] text-gray-400 dark:text-neutral-500">${note.timestamp}</div>
            `;

            // Pin Event
            card.querySelector('.pin-btn').onclick = () => {
                note.pinned = !note.pinned;
                saveNotes();
                renderNotes(searchInput.value.toLowerCase());
            };

            // Copy Event
            card.querySelector('.copy-btn').onclick = (e) => {
                const btn = e.currentTarget;
                navigator.clipboard.writeText(note.content).then(() => {
                    const copyIcon = btn.querySelector('.copy-icon');
                    const checkIcon = btn.querySelector('.check-icon');

                    copyIcon.classList.add('hidden');
                    checkIcon.classList.remove('hidden');

                    setTimeout(() => {
                        copyIcon.classList.remove('hidden');
                        checkIcon.classList.add('hidden');
                    }, 2000);
                });
            };

            // Delete Event
            card.querySelector('.delete-btn').onclick = () => {
                if (confirm('Bạn có chắc chắn muốn xóa ghi chú này?')) {
                    notes = notes.filter(n => n.id !== note.id);
                    saveNotes();
                    renderNotes(searchInput.value.toLowerCase());
                }
            };

            notesContainer.appendChild(card);
        });

        // Khởi tạo lại các thành phần Preline sau khi DOM thay đổi
        if (window.HSStaticMethods) {
            window.HSStaticMethods.autoInit();
        }
    };

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
