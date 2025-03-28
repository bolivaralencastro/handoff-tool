document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const elements = {
        // Dialog controls
        openConfigButton: document.getElementById('open-config-button'),
        configDialog: document.getElementById('config-dialog'),
        closeDialogButton: document.getElementById('close-dialog-button'),
        closeAutoButton: document.getElementById('close-auto-button'),

        // Mode toggle elements
        modeToggle: document.getElementById('mode-toggle'),
        modeIcon: document.getElementById('mode-icon'),
        modeLabel: document.getElementById('mode-label'),
        modeDescription: document.getElementById('mode-description'),
        manualConfigSection: document.getElementById('manual-config-section'),
        autoModeActions: document.getElementById('auto-mode-actions'),

        // Manual mode elements
        addItemInput: document.getElementById('add-item-input'),
        addItemButton: document.getElementById('add-item-button'),
        searchResultsDropdown: document.getElementById('search-results-dropdown'),
        searchResultsList: document.getElementById('search-results-list'),
        externalDetailsContainer: document.getElementById('external-details'),
        externalTitleInput: document.getElementById('external-title-input'),
        externalImageInput: document.getElementById('external-image-input'),
        confirmAddExternalButton: document.getElementById('confirm-add-external-button'),
        addedItemsList: document.getElementById('added-items-list'),
        startDateInput: document.getElementById('start-date'),
        endDateInput: document.getElementById('end-date'),
        publishButton: document.getElementById('publish-button'),
        cancelButton: document.getElementById('cancel-button'),
        limitWarning: document.getElementById('limit-warning'),
        dateError: document.getElementById('date-error'),
        toastContainer: document.getElementById('toast-container'),

    // Confirmation Dialogs
        deactivationDialog: document.getElementById('deactivation-confirm-dialog'),
        cancelDeactivationBtn: document.getElementById('cancel-deactivation'),
        confirmDeactivationBtn: document.getElementById('confirm-deactivation'),
        unsavedDialog: document.getElementById('unsaved-confirm-dialog'),
        continueEditingBtn: document.getElementById('continue-editing'),
        discardChangesBtn: document.getElementById('discard-changes'),

        // New elements
        banner: document.getElementById('banner'),
        bannerTitle: document.getElementById('banner-title'),
        actionButton: document.getElementById('action-button')
    };

    // --- State Variables ---
    const state = {
        isManualModeActive: false,
        isDialogOpen: false,
        addedSlides: [],
        nextSlideId: 0,
        startDate: '',
        endDate: '',
        unsavedChanges: false,
        pendingExternalSlide: null,
        initialManualModeState: false,
        draggedItem: null
    };

    const constants = {
        MAX_SLIDES: 3,
        TOAST_DURATION: 3000
    };

    // --- Mock Data Source ---
    const mockData = {
        courses: [
            { id: '229ecf35-590c-48ea-8833-f2603607d4ee', title: 'Liderança Ágil', type: 'course' },
            { id: 'c2', title: 'Gestão de Projetos com Scrum', type: 'course' },
            { id: 'c3', title: 'Comunicação Efetiva', type: 'course' },
            { id: 'c4', title: 'Design Thinking na Prática', type: 'course' }
        ],
        tracks: [
            { id: '448bc8f9-1597-4558-b97e-ca1afef6d2bb', title: 'Desenvolvimento Front-End', type: 'track' },
            { id: 't2', title: 'UX/UI Design', type: 'track' },
            { id: 't3', title: 'Gestão de Produtos Digitais', type: 'track' }
        ],
        events: [
            { id: '3ab82599-1f83-46f1-b6f1-8025df7dcbf9', title: 'Workshop de Inovação', type: 'event' },
            { id: 'e2', title: 'Conferência de Tecnologia', type: 'event' },
            { id: 'e3', title: 'Meetup de Design', type: 'event' }
        ]
    };

    // --- Helper Functions ---
    function showToast(message, type = 'info', duration = constants.TOAST_DURATION) {
        if (!elements.toastContainer) {
            console.error("Toast container not found!");
            return;
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        elements.toastContainer.appendChild(toast);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                toast.classList.add('show');
            });
        });

        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => {
                if (toast.parentNode) toast.remove();
            }, { once: true });
            
            setTimeout(() => {
                if (toast.parentNode) toast.remove();
            }, duration + 600);
        }, duration);
    }

    function validateDates() {
        if (!elements.dateError) return true;
        
        if (state.startDate && state.endDate && new Date(state.endDate) < new Date(state.startDate)) {
            elements.dateError.classList.remove('hidden');
            return false;
        }
        
        elements.dateError.classList.add('hidden');
        return true;
    }

    function validateAndSetPublishState() {
        const datesValid = state.startDate && state.endDate && validateDates();
        const hasSlides = state.addedSlides.length > 0;
        
        if (elements.publishButton) {
            const isValid = state.isManualModeActive && hasSlides && datesValid;
            elements.publishButton.disabled = !isValid;
            elements.publishButton.classList.toggle('disabled', !isValid);
        } else {
            console.error("Publish button not found!");
        }
    }

    function setUnsavedChanges(hasChanges) {
        state.unsavedChanges = hasChanges;
    }

    function isLikelyUrl(text) {
        const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
        return urlPattern.test(text);
    }

    function showSearchResults() {
        if (elements.searchResultsDropdown) {
            elements.searchResultsDropdown.classList.remove('hidden');
        }
    }

    function hideSearchResults() {
        if (elements.searchResultsDropdown) {
            elements.searchResultsDropdown.classList.add('hidden');
        }
    }

    function hideExternalDetails() {
        if (elements.externalDetailsContainer) {
            elements.externalDetailsContainer.classList.add('hidden');
            state.pendingExternalSlide = null;
        }
    }

    function showAddButton() {
        if (elements.addItemButton) {
            elements.addItemButton.classList.remove('hidden');
        }
    }

    function hideAddButton() {
        if (elements.addItemButton) {
            elements.addItemButton.classList.add('hidden');
        }
    }

    function searchItems(query) {
        if (!query) return [];

        query = query.toLowerCase();
        let results = [];

        // Função auxiliar para buscar em uma coleção
        const searchInCollection = (collection) => {
            return collection.filter(item => 
                item.title.toLowerCase().includes(query) || 
                query.split('').some(char => item.title.toLowerCase().includes(char))
            );
        };

        // Buscar em todas as coleções
        results = results.concat(
            searchInCollection(mockData.courses).map(item => ({
                id: item.id,
                title: item.title,
                type: 'course'
            }))
        );

        results = results.concat(
            searchInCollection(mockData.tracks).map(item => ({
                id: item.id,
                title: item.title,
                type: 'track'
            }))
        );

        results = results.concat(
            searchInCollection(mockData.events).map(item => ({
                id: item.id,
                title: item.title,
                type: 'event'
            }))
        );

        // Remover duplicatas e limitar a 10 resultados
        return [...new Set(results)].slice(0, 10);
    }

    function renderSearchResults(results) {
        if (!elements.searchResultsList) return;

        elements.searchResultsList.innerHTML = '';
        
        if (results.length === 0) {
            const noResults = document.createElement('li');
            noResults.textContent = 'Nenhum resultado encontrado';
            elements.searchResultsList.appendChild(noResults);
            return;
        }

        results.forEach(result => {
            const li = document.createElement('li');
            li.dataset.id = result.id;
            li.dataset.type = result.type;
            
            let iconName = 'link';
            switch (result.type) {
                case 'course': iconName = 'rocket_launch'; break;
                case 'track': iconName = 'alt_route'; break;
                case 'event': iconName = 'calendar_month'; break;
            }
            
            li.innerHTML = `
                <span class="material-icons-outlined">${iconName}</span>
                <span>${result.title}</span>
            `;
            
            li.addEventListener('click', () => {
                handleSearchResultClick(result);
                notifyHandoffTool('items-list');
            });
            elements.searchResultsList.appendChild(li);
        });
    }

    function handleSearchResultClick(result) {
        addItemToList(result.type, result.title, result, true);
        if (elements.searchResultsDropdown) {
            elements.searchResultsDropdown.classList.add('hidden');
        }
        if (elements.addItemInput) {
            elements.addItemInput.value = '';
        }
        notifyHandoffTool('items-list');
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.list-item:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // --- Core Logic Functions ---
    function updateDialogView() {
        if (!elements.modeToggle || !elements.modeIcon || !elements.modeLabel || 
            !elements.modeDescription || !elements.manualConfigSection || !elements.autoModeActions) {
            console.error("Missing elements for updateDialogView");
            return;
        }

        try {
            elements.modeToggle.checked = state.isManualModeActive;
            
            if (state.isManualModeActive) {
                elements.modeIcon.textContent = 'build';
                elements.modeIcon.classList.remove('icon-auto');
                elements.modeIcon.classList.add('icon-manual');
                elements.modeLabel.textContent = 'Modo Personalizado';
                elements.modeDescription.textContent = 'No modo personalizado você define o conteúdo';
                elements.manualConfigSection.classList.remove('hidden');
                elements.autoModeActions.classList.add('hidden');
                document.getElementById('manual-mode-actions')?.classList.remove('hidden');
            } else {
                elements.modeIcon.textContent = 'auto_awesome';
                elements.modeIcon.classList.remove('icon-manual');
                elements.modeIcon.classList.add('icon-auto');
                elements.modeLabel.textContent = 'Modo Automático';
                elements.modeDescription.textContent = 'Cada usuário recebe conteúdos personalizados via IA.';
                elements.manualConfigSection.classList.add('hidden');
                elements.autoModeActions.classList.remove('hidden');
                document.getElementById('manual-mode-actions')?.classList.add('hidden');
            }
            
            validateAndSetPublishState();
        } catch (error) {
            console.error("Error inside updateDialogView:", error);
        }
    }

    function resetManualConfigForm(clearSlidesData = true) {
        try {
            // Clear inputs and containers
            if (elements.addItemInput) elements.addItemInput.value = '';
            if (elements.externalTitleInput) elements.externalTitleInput.value = '';
            if (elements.externalImageInput) elements.externalImageInput.value = '';
            
            const filePlaceholder = elements.externalImageInput?.closest('.file-input-container')?.querySelector('.file-placeholder');
            if (filePlaceholder) {
                filePlaceholder.textContent = 'Imagem (...) *';
                filePlaceholder.style.color = 'var(--md-sys-color-on-surface-variant)';
            }
            
            if (elements.externalDetailsContainer) elements.externalDetailsContainer.classList.add('hidden');
            if (elements.searchResultsDropdown) elements.searchResultsDropdown.classList.add('hidden');
            
            // Clear data if needed
            if (clearSlidesData) {
                state.addedSlides = [];
                state.nextSlideId = 0;
            }
            
            // Clear dates
            if (elements.startDateInput) elements.startDateInput.value = '';
            if (elements.endDateInput) elements.endDateInput.value = '';
            state.startDate = '';
            state.endDate = '';
            
            // Reset warnings/errors and pending state
            if (elements.limitWarning) elements.limitWarning.classList.add('hidden');
            if (elements.dateError) elements.dateError.classList.add('hidden');
            state.pendingExternalSlide = null;
            
            // Re-render the list
            renderSlideList();
        } catch (error) {
             console.error("Error inside resetManualConfigForm:", error);
        }
    }

    function renderSlideList() {
        if (!elements.addedItemsList) {
            console.error("Slide list container (#added-items-list) not found!");
            return;
        }

        try {
            elements.addedItemsList.innerHTML = '';
            
            // Mostrar a lista se houver itens
            elements.addedItemsList.style.display = state.addedSlides.length > 0 ? 'block' : 'none';
            
            state.addedSlides.forEach(slide => {
                const listItem = document.createElement('li');
                listItem.className = `list-item ${slide.isInternal ? '' : 'external-item'}`;
                listItem.dataset.id = slide.id;
                listItem.draggable = true;
                
                let iconName = 'link';
                if (slide.isInternal) {
                    switch (slide.type) {
                        case 'course': iconName = 'rocket_launch'; break;
                        case 'track': iconName = 'alt_route'; break;
                        case 'event': iconName = 'calendar_month'; break;
                    }
                }
                
                listItem.innerHTML = `
                    <div class="list-item-content">
                        <span class="material-icons-outlined">${iconName}</span>
                        <span class="list-item-title">${slide.title}</span>
                        ${slide.isInternal ? '<span class="body-small text-muted" style="margin-left: 4px;"></span>' : ''}
                    </div>
                    <div class="list-item-actions">
                        <button class="button icon-button danger remove-item-button" aria-label="Remover item">
                            <span class="material-icons-outlined">delete_outline</span>
                        </button>
                        <div class="drag-handle">
                            <span class="material-icons-outlined">drag_indicator</span>
                        </div>
                    </div>
                `;
                
                listItem.addEventListener('dragstart', handleDragStart);
                listItem.addEventListener('dragend', handleDragEnd);
                listItem.addEventListener('dragenter', handleDragEnter);
                listItem.addEventListener('dragleave', handleDragLeave);
                listItem.addEventListener('dragover', handleDragOver);
                
                elements.addedItemsList.appendChild(listItem);
            });
            
            // Add event listeners to remove buttons
            document.querySelectorAll('.remove-item-button').forEach(button => {
                button.removeEventListener('click', handleRemoveItem);
                button.addEventListener('click', handleRemoveItem);
            });
            
            // Update input states
            const limitReached = state.addedSlides.length >= constants.MAX_SLIDES;
            if (elements.addItemInput) {
                elements.addItemInput.disabled = limitReached;
                elements.addItemInput.closest('.text-field')?.classList.toggle('disabled', limitReached);
            }
            if (elements.addItemButton) {
                elements.addItemButton.disabled = limitReached;
            }
            
            validateAndSetPublishState();
        } catch (error) {
             console.error("Error inside renderSlideList:", error);
        }
    }

    function addItemToList(type, title, data = {}, isInternal = false, image = null) {
        if (state.addedSlides.length >= constants.MAX_SLIDES) {
            showToast('Limite de 3 slides atingido!', 'warning');
            return false;
        }
        
        state.addedSlides.push({
            id: state.nextSlideId++,
            type,
            title,
            data,
            isInternal,
            image
        });
        
        renderSlideList();
        setUnsavedChanges(true);
        notifyHandoffTool('items-list');
        return true;
    }

    function loadDialogState() {
        try {
            const savedState = null; // Simulação
            
            if (savedState && savedState.mode === 'manual') {
                // Load state logic would go here
            } else {
                state.isManualModeActive = false;
                resetManualConfigForm(true);
            }
            
            state.initialManualModeState = state.isManualModeActive;
            updateDialogView();
            setUnsavedChanges(false);
            validateAndSetPublishState();
        } catch (error) {
             console.error("Error inside loadDialogState:", error);
        }
    }

    function openDialog() {
        try {
            loadDialogState();
            state.isDialogOpen = true;
            
            if (elements.configDialog) {
                elements.configDialog.classList.remove('hidden');
            } else {
                console.error("configDialog element not found in openDialog!");
            }

            if (elements.modeToggle) {
                elements.modeToggle.focus();
            }
        } catch (error) {
            console.error("Error inside openDialog:", error);
            showToast("Erro ao abrir configurações.", "error");
        }
    }

    function closeDialog(forceClose = false) {
        if (!forceClose && state.unsavedChanges && state.addedSlides.length > 0) {
            if (elements.unsavedDialog && elements.configDialog) {
                elements.configDialog.classList.add('hidden');
                elements.unsavedDialog.classList.remove('hidden');
            }
            return;
        }
        
        state.isDialogOpen = false;
        
        if (elements.configDialog) elements.configDialog.classList.add('hidden');
        if (elements.unsavedDialog) elements.unsavedDialog.classList.add('hidden');
        if (elements.searchResultsDropdown) elements.searchResultsDropdown.classList.add('hidden');
        
        resetDialogStateAfterClose();
    }

    function resetDialogStateAfterClose() {
        setUnsavedChanges(false);
        state.pendingExternalSlide = null;
        
        if (elements.externalDetailsContainer) elements.externalDetailsContainer.classList.add('hidden');
        
        // Re-enable input/button considering the slide limit
        const limitReached = state.addedSlides.length >= constants.MAX_SLIDES;
        if (elements.addItemInput) elements.addItemInput.disabled = limitReached;
        if (elements.addItemButton) elements.addItemButton.disabled = limitReached;
    }

    // --- Event Handlers ---
    function handleToggleChange() {
        if (!elements.modeToggle || !elements.deactivationDialog || 
            !elements.manualConfigSection || !elements.autoModeActions) {
            console.error("Missing critical elements for handleToggleChange!");
            return;
        }
        
        try {
            const wantsToActivateManual = elements.modeToggle.checked;
            
            if (!wantsToActivateManual && state.isManualModeActive) {
                // Trying to deactivate manual mode
                if (state.addedSlides.length > 0 || state.startDate || state.endDate) {
                    elements.deactivationDialog.classList.remove('hidden');
                    elements.modeToggle.checked = true;
                    return;
                } else {
                    confirmDeactivation();
                }
            } else if (wantsToActivateManual && !state.isManualModeActive) {
                // Trying to activate manual mode
                state.isManualModeActive = true;
                updateDialogView();
                setUnsavedChanges(true);
            } else if (wantsToActivateManual === state.isManualModeActive) {
                setUnsavedChanges(true);
            }
            
            validateAndSetPublishState();
        } catch (error) {
            console.error("Error inside handleToggleChange:", error);
            showToast("Erro ao alterar modo.", "error");
        }
    }

    function confirmDeactivation() {
        state.isManualModeActive = false;
        resetManualConfigForm(true);
        updateDialogView();
        
        if (elements.deactivationDialog) elements.deactivationDialog.classList.add('hidden');
        if (elements.modeToggle) elements.modeToggle.checked = false;
        
        showToast('Modo personalizado desativado.');
        setUnsavedChanges(false);
        validateAndSetPublishState();
    }

    function cancelDeactivation() {
        if (elements.deactivationDialog) elements.deactivationDialog.classList.add('hidden');
        if (elements.modeToggle) elements.modeToggle.checked = true;
    }

    // Função para extrair informações de links internos
    function parseInternalLink(url) {
        try {
            const urlObj = new URL(url);
            if (!urlObj.hostname.includes('konquest.keepsdev.com')) return null;

            const pathParts = urlObj.pathname.split('/').filter(Boolean);
            const workspaceId = pathParts[0];
            
            // Padrões de URL suportados
            const patterns = {
                track: {
                    pattern: /^T$/i,
                    index: 1,
                    type: 'track'
                },
                course: {
                    pattern: /^(C|course)$/i,
                    index: 1,
                    type: 'course'
                },
                event: {
                    pattern: /^E$/i,
                    index: 1,
                    type: 'event'
                }
            };

            // Identificar o tipo de conteúdo e extrair o ID
            for (const [key, config] of Object.entries(patterns)) {
                const typeIndex = pathParts.findIndex(part => config.pattern.test(part));
                if (typeIndex !== -1) {
                    const id = pathParts[typeIndex + 1];
                    if (id) {
                        return {
                            type: config.type,
                            id: id,
                            workspaceId: workspaceId
                        };
                    }
                }
            }
        } catch (error) {
            console.error('Erro ao analisar URL:', error);
        }
        return null;
    }

    // Função para buscar item por ID (simulação)
    async function findItemById(type, id) {
        // Simular uma busca nos dados mock
        const typeToCollection = {
            'course': mockData.courses,
            'track': mockData.tracks,
            'event': mockData.events
        };

        const collection = typeToCollection[type];
        if (!collection) return null;

        return collection.find(item => item.id === id) || null;
    }

    // Modificar a função handleInput para incluir reconhecimento de links
    async function handleInput(e) {
        const query = e.target.value.trim();
        
        if (!query) {
            hideSearchResults();
            hideAddButton();
            return;
        }

        try {
            // Tentar reconhecer como URL interna
            const internalLink = parseInternalLink(query);
            if (internalLink) {
                const item = await findItemById(internalLink.type, internalLink.id);
                if (item) {
                    // Mostrar resultado exato
                    renderSearchResults([item]);
                    showSearchResults();
                    hideExternalDetails();
                    hideAddButton();
                    notifyHandoffTool('search-results');
                    return;
                }
            }

            // Se for uma URL externa
            if (isLikelyUrl(query)) {
                hideSearchResults();
                showAddButton();
                notifyHandoffTool('external-url');
                return;
            }

            // Se não for URL, continuar com busca normal
            hideAddButton();
            hideExternalDetails();
            const results = searchItems(query);
            if (results.length > 0) {
                renderSearchResults(results);
                showSearchResults();
                notifyHandoffTool('search-results');
            } else {
                hideSearchResults();
            }
        } catch (error) {
            console.error('Erro ao processar input:', error);
        }
    }

    function handleAddItem() {
        const inputValue = elements.addItemInput?.value.trim();
        
        if (!inputValue) {
            showToast('Por favor, insira um termo de busca ou URL', 'error');
            return;
        }

        if (isLikelyUrl(inputValue)) {
            // Configura slide externo pendente
            state.pendingExternalSlide = { url: inputValue };
            if (elements.externalDetailsContainer) {
                elements.searchResultsDropdown?.classList.add('hidden');
                // Limpa os campos antes de mostrar
                if (elements.externalTitleInput) elements.externalTitleInput.value = '';
                if (elements.externalImageInput) {
                    elements.externalImageInput.value = '';
                    const filePlaceholder = elements.externalImageInput.closest('.file-input-container')?.querySelector('.file-placeholder');
                    if (filePlaceholder) {
                        filePlaceholder.textContent = 'Imagem (...) *';
                        filePlaceholder.style.color = 'var(--md-sys-color-on-surface-variant)';
                    }
                }
                // Mostra o dropdown e foca no título
                elements.externalDetailsContainer.classList.remove('hidden');
                if (elements.externalTitleInput) elements.externalTitleInput.focus();
            }
        }
    }

    function validateExternalForm() {
        const title = elements.externalTitleInput?.value.trim();
        const imageData = localStorage.getItem('pendingExternalImage');
        const isValid = title && imageData;
        
        if (elements.confirmAddExternalButton) {
            elements.confirmAddExternalButton.disabled = !isValid;
            elements.confirmAddExternalButton.classList.toggle('disabled', !isValid);
        }
        
        return isValid;
    }

    function handleExternalFormChange() {
        validateExternalForm();
    }

    function handleConfirmAddExternal() {
        if (!state.pendingExternalSlide) return;

        const title = elements.externalTitleInput?.value.trim();
        const imageData = localStorage.getItem('pendingExternalImage');

        if (!title || !imageData) {
            showToast('Por favor, preencha todos os campos obrigatórios', 'error');
            return;
        }

        if (state.addedSlides.length >= constants.MAX_SLIDES) {
            showToast('Limite de 3 slides atingido!', 'warning');
            return;
        }

        addItemToList(
            'external',
            title,
            { url: state.pendingExternalSlide.url, image: imageData },
            false,
            imageData
        );

        // Resetar formulário
        if (elements.externalDetailsContainer) elements.externalDetailsContainer.classList.add('hidden');
        if (elements.addItemInput) elements.addItemInput.value = '';
        if (elements.externalTitleInput) elements.externalTitleInput.value = '';
        
        // Limpar imagem
        if (elements.externalImageInput) {
            elements.externalImageInput.value = '';
            const filePlaceholder = elements.externalImageInput.closest('.file-input-container')?.querySelector('.file-placeholder');
            if (filePlaceholder) {
                filePlaceholder.value = '';
            }
        }
        localStorage.removeItem('pendingExternalImage');
        state.pendingExternalSlide = null;

        // Atualizar a lista e estado
        renderSlideList();
        setUnsavedChanges(true);
        showToast('Link externo adicionado com sucesso', 'success');
        notifyHandoffTool('items-list');
    }

    function handleRemoveItem(event) {
        const button = event.currentTarget;
        const listItem = button.closest('.list-item');
        const itemId = parseInt(listItem.dataset.id);

        state.addedSlides = state.addedSlides.filter(slide => slide.id !== itemId);
        renderSlideList();
        setUnsavedChanges(true);
        showToast('Item removido', 'success');
        notifyHandoffTool('items-list');
    }

    function handleDateChange() {
        const startDate = elements.startDateInput.value;
        const endDate = elements.endDateInput.value;

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            if (end < start) {
                elements.startDateInput.classList.add('error');
                elements.endDateInput.classList.add('error');
                showToast('A data de término deve ser posterior à data de início', 'error');
            } else {
                elements.startDateInput.classList.remove('error');
                elements.endDateInput.classList.remove('error');
                state.startDate = startDate;
                state.endDate = endDate;
                state.unsavedChanges = true;
                validateAndSetPublishState();
                notifyHandoffTool('manual-mode');
            }
        }
    }

    function handlePublish() {
        const startDate = elements.startDateInput.value;
        const endDate = elements.endDateInput.value;

        if (!startDate || !endDate) {
            showToast('Selecione as datas de início e término', 'error');
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (end < start) {
            showToast('A data de término deve ser posterior à data de início', 'error');
            return;
        }

        // Simular publicação
        elements.publishButton.disabled = true;
        elements.publishButton.textContent = 'Publicando...';
        
        setTimeout(() => {
            state.unsavedChanges = false;
            elements.publishButton.disabled = false;
            elements.publishButton.textContent = 'Publicar';
            showToast('Configurações publicadas com sucesso!', 'success');
            elements.configDialog.classList.add('hidden');
            elements.overlay.classList.add('hidden');
            elements.body.classList.remove('overflow-hidden');
            notifyHandoffTool('publish-button');
            resetState();
        }, 1500);
    }

    function handleCancel() {
        // Só mostra o diálogo de confirmação se houver alterações não salvas
        if (state.unsavedChanges) {
            elements.configDialog.classList.add('hidden');
            elements.unsavedDialog.classList.remove('hidden');
            notifyHandoffTool('confirm-dialog');
        } else {
            // Se não houver alterações, fecha diretamente
            elements.configDialog.classList.add('hidden');
            elements.overlay.classList.add('hidden');
            elements.body.classList.remove('overflow-hidden');
            resetState();
        }
    }

    function handleContinueEditing() {
        elements.unsavedDialog.classList.add('hidden');
        elements.configDialog.classList.remove('hidden');
        notifyHandoffTool('confirm-dialog');
    }

    function handleDiscardChanges() {
        resetManualConfigForm(true);
        state.isManualModeActive = state.initialManualModeState;
        updateDialogView();
        elements.unsavedDialog.classList.add('hidden');
        elements.configDialog.classList.add('hidden');
        elements.overlay.classList.add('hidden');
        elements.body.classList.remove('overflow-hidden');
        resetState();
    }

    // --- Drag and Drop Handlers ---
    function handleDragStart(e) {
        state.draggedItem = e.currentTarget;
        e.currentTarget.classList.add('dragging');
        e.dataTransfer.setData('text/plain', e.currentTarget.dataset.id);
        notifyHandoffTool('items-list');
    }

    function handleDragEnd(e) {
        e.currentTarget.classList.remove('dragging');
        state.draggedItem = null;
    }

    function handleDragOver(e) {
        e.preventDefault();
    }

    function handleDragEnter(e) {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    }

    function handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
    }

    function handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        
        const id = parseInt(e.dataTransfer.getData('text/plain'));
        const draggedSlideIndex = state.addedSlides.findIndex(slide => slide.id === id);
        const dropTarget = e.currentTarget.closest('.list-item');
        
        if (dropTarget) {
            const dropTargetId = parseInt(dropTarget.dataset.id);
            const dropIndex = state.addedSlides.findIndex(slide => slide.id === dropTargetId);
            
            if (draggedSlideIndex !== dropIndex) {
                const [removed] = state.addedSlides.splice(draggedSlideIndex, 1);
                state.addedSlides.splice(dropIndex, 0, removed);
                setUnsavedChanges(true);
                renderSlideList();
                notifyHandoffTool('items-list');
            }
        }
    }

    // --- Attach Event Listeners ---
    if (elements.openConfigButton) {
        elements.openConfigButton.addEventListener('click', () => {
            if (elements.configDialog) {
                elements.configDialog.classList.remove('hidden');
                notifyHandoffTool('config-dialog');
            }
        });
    }

    if (elements.closeDialogButton) elements.closeDialogButton.addEventListener('click', () => closeDialog(false));
    if (elements.closeAutoButton) elements.closeAutoButton.addEventListener('click', () => closeDialog(false));
    
    if (elements.configDialog) {
        elements.configDialog.addEventListener('click', (e) => {
            // Removendo a notificação ao clicar no corpo da dialog
        });
    }

    if (elements.modeToggle) {
        elements.modeToggle.addEventListener('change', () => {
            state.isManualModeActive = elements.modeToggle.checked;
            updateDialogView();
            if (state.isManualModeActive) {
                notifyHandoffTool('manual-mode');
            } else {
                notifyHandoffTool('config-dialog');
            }
        });
    }

    if (elements.addItemInput) {
        elements.addItemInput.addEventListener('input', handleInput);
        elements.addItemInput.addEventListener('click', (e) => {
            notifyHandoffTool('search-input');
            if (elements.externalDetailsContainer && !elements.externalDetailsContainer.classList.contains('hidden')) {
                elements.externalDetailsContainer.classList.add('hidden');
                state.pendingExternalSlide = null;
            }
        });
        elements.addItemInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const inputValue = e.target.value.trim();
                
                // Verificar se é um link interno
                const internalLink = parseInternalLink(inputValue);
                if (internalLink) {
                    // Não fazer nada, pois o usuário deve selecionar da lista
                    return;
                }

                // Se for URL externa, mostrar formulário
                if (isLikelyUrl(inputValue)) {
                    handleAddItem();
                }
            } else if (e.key === 'Escape') {
                hideSearchResults();
                hideExternalDetails();
                hideAddButton();
            }
        });
        elements.addItemInput.addEventListener('blur', () => {
            setTimeout(() => {
                const related = document.activeElement;
                const isClickInDropdown = elements.externalDetailsContainer?.contains(related) ||
                                        elements.searchResultsDropdown?.contains(related);
                
                if (!isClickInDropdown && !elements.addItemInput.contains(related)) {
                    if (elements.searchResultsDropdown) elements.searchResultsDropdown.classList.add('hidden');
                    if (elements.externalDetailsContainer) {
                        elements.externalDetailsContainer.classList.add('hidden');
                        state.pendingExternalSlide = null;
                    }
                }
            }, 150);
        });
    }

    if (elements.addItemButton) {
        elements.addItemButton.classList.add('hidden'); // Esconde o botão inicialmente
        elements.addItemButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const inputValue = elements.addItemInput?.value.trim();
            if (isLikelyUrl(inputValue) && !elements.externalDetailsContainer?.classList.contains('hidden')) {
                elements.externalDetailsContainer.classList.add('hidden');
                state.pendingExternalSlide = null;
            } else if (isLikelyUrl(inputValue)) {
                handleAddItem();
            }
        });
    }

    if (elements.confirmAddExternalButton) {
        elements.confirmAddExternalButton.addEventListener('click', () => {
            handleConfirmAddExternal();
            notifyHandoffTool('external-details');
        });
    }

    if (elements.startDateInput) {
        elements.startDateInput.addEventListener('change', () => {
            handleDateChange();
            notifyHandoffTool('manual-mode');
        });
        elements.startDateInput.addEventListener('click', () => {
            notifyHandoffTool('programming-section');
        });
    }

    if (elements.endDateInput) {
        elements.endDateInput.addEventListener('change', () => {
            handleDateChange();
            notifyHandoffTool('manual-mode');
        });
        elements.endDateInput.addEventListener('click', () => {
            notifyHandoffTool('programming-section');
        });
    }

    if (elements.publishButton) {
        elements.publishButton.addEventListener('click', () => {
            handlePublish();
            notifyHandoffTool('publish-button');
        });
    }

    if (elements.cancelButton) {
        elements.cancelButton.addEventListener('click', () => {
            handleCancel();
            notifyHandoffTool('confirm-dialog');
        });
    }

    if (elements.discardChangesBtn) {
        elements.discardChangesBtn.addEventListener('click', () => {
            handleDiscardChanges();
            notifyHandoffTool('confirm-dialog');
        });
    }

    if (elements.continueEditingBtn) {
        elements.continueEditingBtn.addEventListener('click', () => {
            handleContinueEditing();
            notifyHandoffTool('confirm-dialog');
        });
    }

    if (elements.externalTitleInput) {
        elements.externalTitleInput.addEventListener('input', () => {
            validateExternalForm();
        });
    }

    if (elements.externalImageInput) {
        elements.externalImageInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            const filePlaceholder = e.target.closest('.file-input-container')?.querySelector('.file-placeholder');
            const fileContainer = e.target.closest('.file-input-container');
            
            if (file) {
                // Validar tipo de arquivo
                const validTypes = ['.jpg', '.jpeg', '.png', '.webp'];
                const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
                
                if (!validTypes.includes(fileExtension)) {
                    showToast('Formato de arquivo não suportado. Use .jpg, .png ou .webp', 'error');
                    e.target.value = '';
                    localStorage.removeItem('pendingExternalImage');
                    validateExternalForm();
                    return;
                }
                
                // Mostrar loader
                if (fileContainer) {
                    fileContainer.classList.add('loading');
                    const loader = fileContainer.querySelector('.image-loader');
                    if (loader) loader.classList.remove('hidden');
                }
                
                try {
                    // Converter arquivo para base64
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        const base64String = event.target.result;
                        localStorage.setItem('pendingExternalImage', base64String);
                        
                        if (filePlaceholder) {
                            filePlaceholder.value = file.name;
                        }
                        
                        validateExternalForm();
                    };
                    reader.readAsDataURL(file);
                    
                    // Simular delay de upload
                    await new Promise(resolve => setTimeout(resolve, 1500));
                } catch (error) {
                    showToast('Erro ao carregar imagem', 'error');
                    e.target.value = '';
                    localStorage.removeItem('pendingExternalImage');
                    validateExternalForm();
                } finally {
                    // Esconder loader
                    if (fileContainer) {
                        fileContainer.classList.remove('loading');
                        const loader = fileContainer.querySelector('.image-loader');
                        if (loader) loader.classList.add('hidden');
                    }
                }
            }
        });
    }
    
    if (elements.addedItemsList) {
        elements.addedItemsList.addEventListener('dragover', handleDragOver);
        elements.addedItemsList.addEventListener('drop', handleDrop);
        elements.addedItemsList.addEventListener('dragleave', handleDragLeave);
        elements.addedItemsList.addEventListener('click', () => {
            notifyHandoffTool('items-list');
        });
    }

    console.log("DOM Content Loaded and Parsed. Script initialization finished.");

    // Atualiza o event listener global
    document.addEventListener('click', function(event) {
        const dialog = document.querySelector('.dialog:not(.hidden)');
        const dropdowns = [
            elements.searchResultsDropdown,
            elements.externalDetailsContainer
        ].filter(el => el && !el.classList.contains('hidden'));
        
        if (!dialog || dropdowns.length === 0) return;
        
        const isClickInDropdown = dropdowns.some(dropdown => dropdown.contains(event.target));
        const isClickInInput = elements.addItemInput?.contains(event.target);
        
        if (!dialog.contains(event.target) || (!isClickInDropdown && !isClickInInput)) {
            dropdowns.forEach(dropdown => {
                dropdown.classList.add('hidden');
                if (dropdown === elements.externalDetailsContainer) {
                    state.pendingExternalSlide = null;
                }
            });
        }
    });

    // Inicializa o drag and drop quando o DOM estiver pronto
    initDragAndDrop();

    // Função para notificar o painel sobre interações
    function notifyHandoffTool(section) {
        if (window.parent) {
            window.parent.postMessage({
                type: 'prototypeNavigation',
                section: section
            }, '*');
        }
    }

    // Remover event listeners duplicados e desnecessários
    const settingsButton = document.querySelector('.settings-button');
    if (settingsButton) {
        settingsButton.addEventListener('click', () => {
            notifyHandoffTool('settingsButton');
        });
    }

    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton) {
        ctaButton.addEventListener('click', () => {
            notifyHandoffTool('actionButton');
        });
    }

    const bannerTitle = document.querySelector('.banner-title');
    if (bannerTitle) {
        bannerTitle.addEventListener('click', () => {
            // Removendo notificação desnecessária
        });
    }

    const bannerContainer = document.querySelector('.banner-container');
    if (bannerContainer) {
        bannerContainer.addEventListener('click', () => {
            // Removendo notificação desnecessária
        });
    }

    // Remover listeners duplicados
    if (elements.searchResultsList) {
        elements.searchResultsList.removeEventListener('click', () => {
            notifyHandoffTool('search-results');
        });
    }

    if (elements.searchResultsDropdown) {
        elements.searchResultsDropdown.removeEventListener('click', () => {
            notifyHandoffTool('search-results');
        });
    }
});

function initDragAndDrop() {
    const itemList = document.querySelector('.item-list');
    let draggedItem = null;

    function handleDragStart(e) {
        draggedItem = this;
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const list = this.closest('.item-list');
        const items = Array.from(list.querySelectorAll('.list-item:not(.dragging)'));
        
        const afterElement = items.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = e.clientY - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;

        if (afterElement) {
            this.parentNode.insertBefore(draggedItem, afterElement);
        } else {
            this.parentNode.appendChild(draggedItem);
        }
    }

    function handleDragEnd() {
        this.classList.remove('dragging');
        draggedItem = null;
        
        // Atualiza a ordem dos slides no state
        const items = Array.from(itemList.querySelectorAll('.list-item'));
        state.addedSlides = items.map(item => {
            const index = parseInt(item.dataset.index);
            return state.addedSlides[index];
        });
        
        state.unsavedChanges = true;
    }

    // Adiciona os event listeners necessários
    itemList.addEventListener('dragover', e => e.preventDefault());
    
    function updateDragListeners() {
        const items = itemList.querySelectorAll('.list-item');
        items.forEach((item, index) => {
            item.setAttribute('draggable', true);
            item.dataset.index = index;
            
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragover', handleDragOver);
            item.addEventListener('dragend', handleDragEnd);
        });
    }

    // Observa mudanças na lista para atualizar os listeners
    const observer = new MutationObserver(updateDragListeners);
    observer.observe(itemList, { childList: true });
}

function updateInputState() {
    const hasReachedLimit = state.addedSlides.length >= constants.MAX_SLIDES;
    
    if (elements.addItemInput) {
        elements.addItemInput.disabled = hasReachedLimit;
        elements.addItemInput.closest('.text-field')?.classList.toggle('disabled', hasReachedLimit);
    }
    
    if (hasReachedLimit) {
        showToast('Limite de 3 slides atingido!', 'warning');
    }
}

function resetExternalForm() {
    if (elements.externalTitleInput) elements.externalTitleInput.value = '';
    if (elements.externalImageInput) {
        elements.externalImageInput.value = '';
        const filePlaceholder = elements.externalImageInput.closest('.file-input-container')?.querySelector('.file-placeholder');
        if (filePlaceholder) {
            filePlaceholder.value = '';
        }
    }
    localStorage.removeItem('pendingExternalImage');
    validateExternalForm();
}