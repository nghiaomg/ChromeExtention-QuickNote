document.addEventListener('DOMContentLoaded', () => {
    // Luôn gọi autoInit để Preline nhận diện các thành phần tĩnh
    if (window.HSStaticMethods) {
        window.HSStaticMethods.autoInit();
    }
    const noteInput = document.getElementById('note-input');
    const searchInput = document.getElementById('search-input');
    const notesContainer = document.getElementById('notes-container');
    const foldersContainer = document.getElementById('folders-container');
    const openFullscreenBtn = document.getElementById('open-fullscreen');
    const addFolderBtn = document.getElementById('add-folder-btn');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const searchToggleBtn = document.getElementById('search-toggle');
    const searchBar = document.getElementById('search-bar');

    let notes = [];
    let folders = [];
    let currentFolderId = 'all';
    let sortableInstance = null;
    let folderSortableInstances = [];

    // ── Theme ──────────────────────────────────────────────
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const toggleTheme = () => {
        const isDark = document.documentElement.classList.contains('dark');
        const next = isDark ? 'light' : 'dark';
        applyTheme(next);
        chrome.storage.local.set({ theme: next });
    };

    // Khởi tạo Sortable cho Notes
    const initSortable = () => {
        if (sortableInstance) sortableInstance.destroy();
        sortableInstance = new Sortable(notesContainer, {
            group: 'shared', // Cho phép kéo sang group khác
            animation: 150,
            handle: '.drag-handle',
            ghostClass: 'bg-blue-100',
            onEnd: (evt) => {
                // Chỉ lưu thứ tự nếu thả trong cùng container
                if (evt.to === notesContainer) {
                    const newNotes = [];
                    const cards = notesContainer.querySelectorAll('.note-card');
                    cards.forEach(card => {
                        const id = parseInt(card.getAttribute('data-id'));
                        const note = notes.find(n => n.id === id);
                        if (note) newNotes.push(note);
                    });

                    // Giữ lại các note không nằm trong thư mục hiện tại không bị ảnh hưởng
                    if (currentFolderId !== 'all') {
                        const otherNotes = notes.filter(n => String(n.folderId) !== String(currentFolderId));
                        notes = [...newNotes, ...otherNotes];
                    } else {
                        notes = newNotes;
                    }
                    saveData();
                }
            }
        });
    };

    // Theme toggle button
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }

    chrome.storage.local.get(['notes', 'folders', 'theme'], (result) => {
        // Apply saved theme (or default to system preference)
        const savedTheme = result.theme;
        if (savedTheme) {
            applyTheme(savedTheme);
        } else {
            // Default: respect system preference via CSS media query
            applyTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        }

        if (result.folders) {
            folders = result.folders;
        }
        if (result.notes) {
            // Mạch mặc định backwards compatibility: note cũ có thể chưa có folderId
            notes = result.notes.map(n => ({ ...n, folderId: n.folderId || 'all' }));
        }
        renderFolders();
        renderNotes();
        initSortable();
    });

    // Hàm Save gộp chung
    const saveData = () => {
        chrome.storage.local.set({ notes, folders });
    };

    // Add Note
    const addNote = () => {
        const text = noteInput.value.trim();
        if (text) {
            const newNote = {
                id: Date.now(),
                content: text,
                pinned: false,
                folderId: currentFolderId === 'all' ? 'all' : currentFolderId,
                timestamp: new Date().toLocaleString()
            };
            notes.unshift(newNote);
            saveData();
            noteInput.value = '';
            renderNotes();
            initSortable();
        }
    };

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

    // Search toggle
    if (searchToggleBtn && searchBar && searchInput) {
        searchToggleBtn.addEventListener('click', () => {
            const isHidden = searchBar.classList.contains('hidden');
            searchBar.classList.toggle('hidden');
            if (isHidden) {
                searchInput.focus();
            } else {
                searchInput.value = '';
                renderNotes();
            }
        });
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            renderNotes(query);
        });
        // ESC to close search
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchBar.classList.add('hidden');
                searchInput.value = '';
                renderNotes();
            }
        });
    }

    // Folders CRUD
    if (addFolderBtn) {
        addFolderBtn.addEventListener('click', () => {
            const folderName = prompt('Nhập tên thư mục mới:');
            if (folderName && folderName.trim()) {
                const newFolder = {
                    id: 'folder_' + Date.now(),
                    name: folderName.trim(),
                    timestamp: new Date().toLocaleString()
                };
                folders.push(newFolder);
                saveData();
                renderFolders();
            }
        });
    }

    // Render Folders
    const renderFolders = () => {
        if (!foldersContainer) return;

        // Reset container chỉ giữ lại tab "Tất cả"
        foldersContainer.innerHTML = `
            <button type="button" class="folder-tab shrink-0 px-3 py-1 text-xs font-medium rounded-full transition-colors whitespace-nowrap ${currentFolderId === 'all' ? 'border border-blue-600 bg-blue-600 text-white hover:bg-blue-700' : 'border border-gray-200 text-gray-600 hover:border-gray-300 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-600'}" data-id="all">
                Tất cả
            </button>
        `;

        folders.forEach(folder => {
            const isActive = currentFolderId === folder.id;
            const btnClasses = isActive
                ? 'border border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
                : 'border border-gray-200 text-gray-600 hover:border-gray-300 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-600';

            const btn = document.createElement('div');
            btn.className = `folder-tab shrink-0 px-2.5 py-1 inline-flex items-center gap-1 text-xs font-medium rounded-full transition-colors cursor-pointer ${btnClasses}`;
            btn.setAttribute('data-id', folder.id);
            btn.innerHTML = `
                <span>${escapeHtml(folder.name)}</span>
                ${isActive ? `
                    <span class="edit-folder p-0.5 hover:bg-blue-500/30 rounded cursor-pointer" title="Đổi tên">
                        <svg class="size-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                    </span>
                    <span class="delete-folder p-0.5 hover:bg-red-500/50 rounded cursor-pointer" title="Xóa">
                        <svg class="size-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/></svg>
                    </span>
                ` : ''}
            `;

            // Xử lý sự kiện click
            btn.addEventListener('click', (e) => {
                // Ignore nếu click vào nút Xóa hoặc Sửa
                if (e.target.closest('.edit-folder') || e.target.closest('.delete-folder')) return;
                currentFolderId = folder.id;
                renderFolders();
                renderNotes();
            });

            // Sửa tên thư mục
            const editBtn = btn.querySelector('.edit-folder');
            if (editBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const newName = prompt('Đổi tên thư mục:', folder.name);
                    if (newName && newName.trim()) {
                        folder.name = newName.trim();
                        saveData();
                        renderFolders();
                    }
                });
            }

            // Xóa thư mục
            const deleteBtn = btn.querySelector('.delete-folder');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm('Bạn có chắc muốn xóa thư mục này? Các ghi chú bên trong sẽ được chuyển ra "Tất cả ghi chú".')) {
                        folders = folders.filter(f => f.id !== folder.id);
                        // Chuyển notes của folder này ra 'all'
                        notes = notes.map(n => {
                            if (String(n.folderId) === String(folder.id)) {
                                return { ...n, folderId: 'all' };
                            }
                            return n;
                        });
                        currentFolderId = 'all';
                        saveData();
                        renderFolders();
                        renderNotes();
                    }
                });
            }

            foldersContainer.appendChild(btn);
        });

        // Xử lý sự kiện click cho tab "Tất cả"
        const allTab = foldersContainer.querySelector('[data-id="all"]');
        allTab.addEventListener('click', () => {
            currentFolderId = 'all';
            renderFolders();
            renderNotes();
        });

        // Hủy các instance Sortable cũ của folders
        folderSortableInstances.forEach(inst => inst.destroy());
        folderSortableInstances = [];

        // Thêm tính năng nhận note thả vào các folder tab (trừ tab đang chọn)
        const tabs = foldersContainer.querySelectorAll('.folder-tab');
        tabs.forEach(tab => {
            const folderId = tab.getAttribute('data-id');
            // Init Sortable để biến tab thành dropzone
            const sortable = new Sortable(tab, {
                group: {
                    name: 'shared',
                    put: ['shared'] // Cho phép nhận item từ mảng list note
                },
                sort: false, // Không cho sắp xếp trong tab
                onAdd: function (evt) {
                    const noteCard = evt.item;
                    const noteId = parseInt(noteCard.getAttribute('data-id'));

                    // Xóa thẻ DOM khỏi Folder Tab ngay lập tức vì không muốn render nó ở UI list tab
                    noteCard.parentNode.removeChild(noteCard);

                    // Nếu thả vào tab hiện đang chọn thì không thay đổi
                    if (folderId === currentFolderId) {
                        renderNotes(); // Hoàn cảnh cũ
                        initSortable();
                        return;
                    }

                    // Đổi folderId cho Note
                    const noteIndex = notes.findIndex(n => n.id === noteId);
                    if (noteIndex !== -1) {
                        notes[noteIndex].folderId = folderId;
                        saveData();
                        renderNotes();
                        initSortable();
                    }
                }
            });
            folderSortableInstances.push(sortable);
        });
    };

    // Render Notes
    const renderNotes = (query = '') => {
        notesContainer.innerHTML = '';

        // Filter: theo Thư mục đang chọn và query
        const filteredNotes = notes
            .filter(note => {
                const matchSearch = note.content.toLowerCase().includes(query);
                const matchFolder = currentFolderId === 'all' || String(note.folderId) === String(currentFolderId);
                return matchSearch && matchFolder;
            })
            .sort((a, b) => (b.pinned - a.pinned)); // Pinned first

        if (filteredNotes.length === 0) {
            notesContainer.innerHTML = `
                <div class="text-center py-10 w-full col-span-full">
                    <p class="text-gray-500 text-sm">Không có ghi chú nào trong thư mục này.</p>
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

            card.className = `note-card group flex border rounded-lg p-3 dark:shadow-neutral-700/70 ${pinClasses}`;

            card.innerHTML = `
                <div class="flex-1 min-w-0">
                    <p class="text-sm text-gray-800 dark:text-neutral-200 break-words whitespace-pre-wrap select-text cursor-default">${escapeHtml(note.content)}</p>
                    <div class="mt-1 text-[10px] text-gray-300 dark:text-neutral-600">${note.timestamp}</div>
                </div>
                <div class="flex flex-col gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button class="pin-btn p-1 rounded text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-neutral-700" title="${note.pinned ? 'Unpin' : 'Ghim'}">
                        <svg class="size-3 ${note.pinned ? 'fill-blue-500 text-blue-500' : ''}" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 20 2-2 5-5V4"/><path d="M15 2H9a1 1 0 0 0-1 1v2c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V3a1 1 0 0 0-1-1Z"/><path d="M12 6v14"/><path d="M8 22h8"/></svg>
                    </button>
                    <button class="copy-btn p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-neutral-700" title="Copy">
                        <span class="copy-icon">
                            <svg class="size-3 text-gray-400" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
                        </span>
                        <span class="check-icon hidden">
                            <svg class="size-3 text-green-500" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </span>
                    </button>
                    <button class="delete-btn p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-neutral-700" title="Xóa">
                        <svg class="size-3" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                </div>
            `;

            // Pin Event
            card.querySelector('.pin-btn').onclick = () => {
                const targetNote = notes.find(n => n.id === note.id);
                if (targetNote) {
                    targetNote.pinned = !targetNote.pinned;
                    saveData();
                    renderNotes(searchInput ? searchInput.value.toLowerCase() : '');
                }
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
                    saveData();
                    renderNotes(searchInput ? searchInput.value.toLowerCase() : '');
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
