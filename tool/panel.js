// @charset "UTF-8";

document.addEventListener('DOMContentLoaded', () => {
    // Elementos DOM
    const panel = document.getElementById('docs-panel');
    const toggleBtn = document.getElementById('toggle-panel');
    const iframe = document.getElementById('prototype-frame');
    const sectionSelector = document.getElementById('section-selector');
    const rulesContainer = document.getElementById('rules-container');
    
    // Estado
    let currentSection = null;
    let rules = null;
    let visibleComponents = new Set();
    const panelState = localStorage.getItem('panelState') || 'open';
    
    // Inicialização
    if (panelState === 'closed') togglePanel();
    loadRules();
    
    // Event Listeners
    toggleBtn.addEventListener('click', togglePanel);
    sectionSelector.addEventListener('change', updateDocumentation);
    
    // Comunicação com iframe
    window.addEventListener('message', (event) => {
        if (event.data.type === 'prototypeNavigation') {
            // Atualiza a documentação
            updateDocumentationForSection(event.data.section);
            // Atualiza o seletor
            sectionSelector.value = event.data.section;
            // Destaca a seção no painel
            highlightSection(event.data.section);
        }
    });

    // Funções
    function togglePanel() {
        panel.classList.toggle('collapsed');
        iframe.style.width = panel.classList.contains('collapsed') ? '100%' : '70%';
        
        localStorage.setItem('panelState', 
            panel.classList.contains('collapsed') ? 'closed' : 'open');
    }

    async function loadRules() {
        try {
            const response = await fetch('tool/rules.json', {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json; charset=utf-8'
                }
            });
            const text = await response.text();
            rules = JSON.parse(text);
            setupDocumentationPanel();
        } catch (error) {
            console.error("Error loading rules:", error);
        }
    }

    function setupDocumentationPanel() {
        if (!rulesContainer) return;
        
        // Mostrar conteúdo inicial
        const initialContent = renderInitialContent();
        rulesContainer.appendChild(initialContent);
        
        // Criar container para os cards
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'cards-container';
        cardsContainer.style.display = 'none'; // Inicialmente oculto
        rulesContainer.appendChild(cardsContainer);

        // Criar cards para cada seção
        rules.forEach(section => {
            const card = createCard(section);
            cardsContainer.appendChild(card);
        });
    }

    function createCard(section) {
        const card = document.createElement('div');
        card.className = 'rule-card';
        card.dataset.section = section.section;
        card.style.display = 'none'; // Inicialmente oculto

        // Título do card
        const title = document.createElement('h3');
        title.textContent = section.title;
        card.appendChild(title);

        // Descrição
        const description = document.createElement('p');
        description.textContent = section.description;
        card.appendChild(description);

        // Regras (se existirem)
        if (section.rules) {
            const rulesContainer = document.createElement('div');
            rulesContainer.className = 'rules-container';
            
            section.rules.forEach(rule => {
                const ruleElement = document.createElement('div');
                ruleElement.className = 'rule';
                
                const ruleTitle = document.createElement('h4');
                ruleTitle.textContent = rule.title;
                
                const ruleDescription = document.createElement('p');
                ruleDescription.textContent = rule.description;
                
                const detailsList = document.createElement('ul');
                rule.details.forEach(detail => {
                    const li = document.createElement('li');
                    li.textContent = detail;
                    detailsList.appendChild(li);
                });
                
                ruleElement.appendChild(ruleTitle);
                ruleElement.appendChild(ruleDescription);
                ruleElement.appendChild(detailsList);
                rulesContainer.appendChild(ruleElement);
            });
            
            card.appendChild(rulesContainer);
        }

        // Evento de clique para destacar elementos
        card.addEventListener('click', () => {
            const section = card.dataset.section;
            if (currentSection === section) {
                removeHighlight();
            } else {
                highlightSection(section);
            }
        });

        return card;
    }

    function updateDocumentation() {
        const section = sectionSelector.value;
        updateDocumentationForSection(section);
    }

    function highlightSection(section) {
        removeHighlight();
        currentSection = section;

        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        const card = rulesContainer.querySelector(`.rule-card[data-section="${section}"]`);

        if (card) {
            card.classList.add('highlighted');
        }

        // Adicionar borda ao elemento correspondente no iframe
        let targetElement;
        switch (section) {
            case 'config-dialog':
                targetElement = iframeDoc.getElementById('config-dialog');
                break;
            case 'search-results':
                targetElement = iframeDoc.getElementById('search-results-dropdown');
                break;
            case 'external-details':
                targetElement = iframeDoc.getElementById('external-details-container');
                break;
            case 'items-list':
                targetElement = iframeDoc.getElementById('added-items-list');
                break;
            case 'confirm-dialog':
                targetElement = iframeDoc.getElementById('unsaved-confirm-dialog');
                break;
        }

        if (targetElement) {
            targetElement.classList.add('highlighted');
        }
    }

    function removeHighlight() {
        if (currentSection) {
            const card = rulesContainer.querySelector(`.rule-card[data-section="${currentSection}"]`);
            if (card) {
                card.classList.remove('highlighted');
            }

            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            let targetElement;
            switch (currentSection) {
                case 'config-dialog':
                    targetElement = iframeDoc.getElementById('config-dialog');
                    break;
                case 'search-results':
                    targetElement = iframeDoc.getElementById('search-results-dropdown');
                    break;
                case 'external-details':
                    targetElement = iframeDoc.getElementById('external-details-container');
                    break;
                case 'items-list':
                    targetElement = iframeDoc.getElementById('added-items-list');
                    break;
                case 'confirm-dialog':
                    targetElement = iframeDoc.getElementById('unsaved-confirm-dialog');
                    break;
            }

            if (targetElement) {
                targetElement.classList.remove('highlighted');
            }
        }
        currentSection = null;
    }

    function updateDocumentationForSection(section) {
        if (!section) {
            rulesContainer.innerHTML = '<p class="empty-state">Selecione uma seção para visualizar as regras</p>';
            return;
        }

        const sectionRules = rules.filter(rule => rule.section === section);
        
        if (sectionRules.length === 0) {
            rulesContainer.innerHTML = '<p class="empty-state">Nenhuma regra encontrada para esta seção</p>';
            return;
        }

        // Criar elementos manualmente em vez de usar innerHTML
        const container = document.createElement('div');
        sectionRules.forEach(rule => {
            const ruleDiv = document.createElement('div');
            ruleDiv.className = 'rule';
            ruleDiv.dataset.section = rule.section;

            // Título
            const title = document.createElement('h3');
            title.textContent = rule.title;
            ruleDiv.appendChild(title);

            // Descrição
            const description = document.createElement('p');
            description.textContent = rule.description;
            ruleDiv.appendChild(description);

            // Critérios de Aceite
            if (rule.acceptance_criteria) {
                const acceptance = document.createElement('div');
                acceptance.className = 'acceptance';
                
                const acceptanceTitle = document.createElement('h4');
                acceptanceTitle.textContent = 'Critérios de Aceite';
                acceptance.appendChild(acceptanceTitle);

                const acceptanceList = document.createElement('ul');
                rule.acceptance_criteria.forEach(criteria => {
                    const li = document.createElement('li');
                    li.textContent = criteria;
                    acceptanceList.appendChild(li);
                });
                acceptance.appendChild(acceptanceList);
                ruleDiv.appendChild(acceptance);
            }

            // Notas Técnicas
            if (rule.technical_notes) {
                const technical = document.createElement('div');
                technical.className = 'technical-notes';
                
                const technicalTitle = document.createElement('h4');
                technicalTitle.textContent = 'Notas Técnicas';
                technical.appendChild(technicalTitle);

                const technicalContent = document.createElement('p');
                technicalContent.textContent = rule.technical_notes;
                technical.appendChild(technicalContent);
                ruleDiv.appendChild(technical);
            }

            // Fluxo de Interação
            if (rule.interaction_flow) {
                const flow = document.createElement('div');
                flow.className = 'flow';
                
                const flowTitle = document.createElement('h4');
                flowTitle.textContent = 'Fluxo de Interação';
                flow.appendChild(flowTitle);

                const flowList = document.createElement('ol');
                rule.interaction_flow.steps.forEach(step => {
                    const li = document.createElement('li');
                    li.textContent = step;
                    flowList.appendChild(li);
                });
                flow.appendChild(flowList);
                ruleDiv.appendChild(flow);
            }

            container.appendChild(ruleDiv);
        });

        // Limpar e adicionar novo conteúdo
        rulesContainer.innerHTML = '';
        rulesContainer.appendChild(container);

        // Destaca a seção após renderizar
        highlightSection(section);
    }

    function renderInitialContent() {
        const container = document.createElement('div');
        container.className = 'initial-content';

        // Título
        const title = document.createElement('h2');
        title.textContent = 'Personalização do Banner';
        container.appendChild(title);

        // Objetivo
        const objective = document.createElement('div');
        objective.className = 'section';
        objective.innerHTML = `
            <h3>Objetivo</h3>
            <p>Permitir que o administrador personalize e gerencie um banner dinâmico com até 3 slides, exibindo conteúdos internos (cursos, trilhas, eventos) ou links externos para todos os usuários.</p>
        `;
        container.appendChild(objective);

        // Funcionalidades
        const features = document.createElement('div');
        features.className = 'section';
        features.innerHTML = `
            <h3>Principais Funcionalidades</h3>
            <div class="feature-group">
                <h4>Configuração simplificada:</h4>
                <ul>
                    <li>Slides com objetos internos (herdam título, descrição e imagem automaticamente) ou links externos (preenchimento manual).</li>
                    <li>Vigência obrigatória (datas de início e fim ajustáveis).</li>
                </ul>
            </div>
            <div class="feature-group">
                <h4>Controle flexível:</h4>
                <ul>
                    <li>Ativar/desativar o banner a qualquer momento.</li>
                    <li>Desativar = remove personalização; reativar = recomeça do zero.</li>
                </ul>
            </div>
            <div class="feature-group">
                <h4>Comportamento automático:</h4>
                <ul>
                    <li>Sem banner personalizado? Sistema exibe o banner padrão.</li>
                </ul>
            </div>
        `;
        container.appendChild(features);

        // Observações
        const notes = document.createElement('div');
        notes.className = 'section';
        notes.innerHTML = `
            <h3>Observações</h3>
            <div class="feature-group">
                <h4>MVP (Versão Inicial):</h4>
                <ul>
                    <li>Apenas um banner editável (futuro: painel para múltiplos banners).</li>
                </ul>
            </div>
            <p class="final-note">Pronto para engajar usuários com conteúdo relevante! 🚀</p>
        `;
        container.appendChild(notes);

        return container;
    }

    function checkComponentVisibility() {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        const visibleComponents = new Set();

        // Verificar visibilidade de cada componente
        if (iframeDoc.getElementById('config-dialog')?.classList.contains('hidden') === false) {
            // Se o modo manual está ativo, mostrar regras do modo manual
            if (iframeDoc.getElementById('mode-toggle')?.checked) {
                visibleComponents.add('manual-mode');
            } else {
                visibleComponents.add('config-dialog');
            }
        }

        if (iframeDoc.getElementById('search-results-dropdown')?.classList.contains('hidden') === false) {
            visibleComponents.add('search-results');
        }

        if (iframeDoc.getElementById('external-details-container')?.classList.contains('hidden') === false) {
            visibleComponents.add('external-details');
        }

        if (iframeDoc.getElementById('added-items-list')?.classList.contains('hidden') === false) {
            visibleComponents.add('items-list');
        }

        if (iframeDoc.getElementById('unsaved-confirm-dialog')?.classList.contains('hidden') === false) {
            visibleComponents.add('confirm-dialog');
        }

        // Atualizar visibilidade dos cards
        const cardsContainer = rulesContainer.querySelector('.cards-container');
        const cards = cardsContainer.querySelectorAll('.rule-card');
        let hasVisibleCards = false;

        cards.forEach(card => {
            const section = card.dataset.section;
            const isVisible = visibleComponents.has(section);
            card.style.display = isVisible ? 'block' : 'none';
            if (isVisible) hasVisibleCards = true;
        });

        // Mostrar/esconder containers baseado na visibilidade
        const initialContent = rulesContainer.querySelector('.initial-content');
        if (hasVisibleCards) {
            initialContent.style.display = 'none';
            cardsContainer.style.display = 'flex';
        } else {
            initialContent.style.display = 'block';
            cardsContainer.style.display = 'none';
        }
    }

    // Observar mudanças no iframe
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                checkComponentVisibility();
            }
        });
    });

    // Configurar observer para monitorar mudanças de visibilidade
    if (iframe.contentDocument) {
        const elementsToObserve = [
            'config-dialog',
            'search-results-dropdown',
            'external-details-container',
            'added-items-list',
            'unsaved-confirm-dialog',
            'mode-toggle'
        ];

        elementsToObserve.forEach(id => {
            const element = iframe.contentDocument.getElementById(id);
            if (element) {
                observer.observe(element, { attributes: true });
            }
        });
    }
}); 