// Função para carregar o footer
function loadFooter() {
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {
        fetch('footer.html') // Caminho para o seu arquivo de footer
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status} ao buscar footer.html`);
                }
                return response.text();
            })
            .then(data => {
                footerPlaceholder.innerHTML = data;
                // Após carregar o footer (que contém o HTML do modal), inicializamos os seletores do modal.
                initializeModalSelectors();
            })
            .catch(error => {
                console.error("Erro ao carregar o footer:", error);
                if (footerPlaceholder) { // Verifica novamente se o placeholder existe antes de tentar modificar
                    footerPlaceholder.innerHTML = "<p style='color:red; text-align:center;'>Erro ao carregar o rodapé.</p>";
                }
            });
    } else {
        console.warn("Elemento 'footer-placeholder' não encontrado na página.");
    }
}

// --- INÍCIO DAS FUNÇÕES E VARIÁVEIS DO MODAL CUSTOMIZADO ---
let modalOverlay = null;
let modalTitleElement = null;
let modalMessageElement = null;
let modalActionsContainer = null;
let currentModalResolve = null; // Para lidar com a "promessa" do modal

// Função para inicializar os seletores dos elementos do modal
// Esta função DEVE ser chamada DEPOIS que o HTML do modal estiver carregado no DOM.
function initializeModalSelectors() {
    modalOverlay = document.getElementById('customModal');
    modalTitleElement = document.getElementById('modalTitle');
    modalMessageElement = document.getElementById('modalMessage');
    modalActionsContainer = document.getElementById('modalActions');

    if (!modalOverlay || !modalTitleElement || !modalMessageElement || !modalActionsContainer) {
        console.warn("Um ou mais elementos do modal não foram encontrados. Verifique se o HTML do modal está carregado corretamente (ex: em footer.html) e se os IDs correspondem ('customModal', 'modalTitle', 'modalMessage', 'modalActions').");
        return; // Interrompe se os elementos principais não forem encontrados
    }

    // Adicionar listener para fechar com ESC, se o overlay estiver visível
    document.addEventListener('keydown', function(event) {
        if (event.key === "Escape" && modalOverlay && modalOverlay.classList.contains('active')) {
            // Se houver um botão com valor 'dismiss' ou 'cancel', poderia simular o clique nele
            // Por simplicidade, resolve com um valor padrão que indica fechamento por Esc.
            hideCustomModal();
            if (currentModalResolve) {
                currentModalResolve('dismiss_esc'); // Valor específico para fechamento por Esc
            }
        }
    });
     // Adicionar listener para fechar ao clicar no overlay (fundo)
     modalOverlay.addEventListener('click', function(event) {
        if (event.target === modalOverlay) { // Verifica se o clique foi diretamente no overlay
            hideCustomModal();
            if (currentModalResolve) {
                currentModalResolve('dismiss_overlay'); // Valor para fechamento por clique no overlay
            }
        }
    });
}

/**
 * Mostra um modal customizado.
 * @param {object} config - Configuração do modal.
 * @param {string} [config.title='Atenção'] - Título do modal.
 * @param {string} config.message - Mensagem do modal.
 * @param {Array<object>} [config.buttons] - Array de botões. Cada botão é um objeto:
 *   { text: 'Texto do Botão', value: any, class: 'classe_css', id?: 'id_do_botao', callback?: function }
 *   Se omitido, um botão "OK" padrão é criado.
 * @returns {Promise<any>} Uma promessa que resolve com o 'value' do botão clicado ou um valor de 'dismiss'.
 */
function showCustomModal(config) {
    if (!modalOverlay) { // Se os seletores não foram inicializados (ex: modal chamado muito cedo)
        console.error("showCustomModal: Elementos do Modal não foram inicializados. Chame initializeModalSelectors() após o carregamento do HTML do modal.");
        // Tenta inicializar como fallback, mas o ideal é que já esteja pronto.
        initializeModalSelectors(); 
        if (!modalOverlay) { // Se ainda não conseguiu
            return Promise.reject("Modal não inicializado corretamente.");
        }
    }

    return new Promise((resolve) => {
        currentModalResolve = resolve;

        modalTitleElement.textContent = config.title || 'Atenção';
        modalMessageElement.innerHTML = config.message || ''; // Usar innerHTML para permitir <br>
        modalActionsContainer.innerHTML = ''; // Limpa botões antigos

        const buttonsToShow = (config.buttons && config.buttons.length > 0) ? 
            config.buttons : 
            [{ text: 'OK', value: true, class: 'modal-btn-neutral' }]; // Botão OK padrão

        buttonsToShow.forEach(btnConfig => {
            const button = document.createElement('button');
            button.textContent = btnConfig.text;
            button.className = btnConfig.class || 'modal-btn-neutral';
            if (btnConfig.id) { // Adiciona ID se fornecido
                button.id = btnConfig.id;
            }

            button.addEventListener('click', (event) => {
                event.stopPropagation(); // Impede que o clique no botão propague para o overlay
                hideCustomModal();
                if (currentModalResolve) {
                    currentModalResolve(btnConfig.value);
                }
                if (btnConfig.callback) {
                    btnConfig.callback(); // Executa callback específico se houver
                }
            });
            modalActionsContainer.appendChild(button);
        });

        modalOverlay.style.display = 'flex'; // Garante que está como flex antes de ativar
        // Pequeno delay para garantir que o 'display: flex' seja aplicado antes da classe 'active'
        // para que a transição de opacidade/transform funcione.
        setTimeout(() => {
            modalOverlay.classList.add('active');
        }, 10); 
    });
}

function hideCustomModal() {
    if (modalOverlay && modalOverlay.classList.contains('active')) {
        modalOverlay.classList.remove('active');
        // O CSS com `visibility: hidden` e `transition-delay` deve cuidar de esconder
        // após a animação de opacidade.
        // Se precisar forçar o display:none após a animação, pode-se usar um setTimeout
        // que corresponda à duração da transição no CSS.
        // Ex: setTimeout(() => { modalOverlay.style.display = 'none'; }, 300);
        // Mas geralmente não é necessário se 'visibility' for usado corretamente.
    }
}
// --- FIM DAS FUNÇÕES E VARIÁVEIS DO MODAL CUSTOMIZADO ---


// Chamada para carregar o footer (e indiretamente inicializar o modal)
// quando o DOM estiver pronto.
document.addEventListener('DOMContentLoaded', function() {
    loadFooter();
});