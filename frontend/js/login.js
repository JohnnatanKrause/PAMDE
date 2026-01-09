document.addEventListener('DOMContentLoaded', async function () {
    const loginForm = document.getElementById('loginForm');
    const usuarioSelect = document.getElementById('usuarioSelect');
    const usuarioManual = document.getElementById('usuarioManual');

    // Função de modal segura (fallback para alert)
    async function safeModal({ title, message }) {
        if (typeof showCustomModal === 'function') {
            return await showCustomModal({
                title,
                message,
                buttons: [{ text: 'OK', value: true, class: 'modal-btn-neutral' }]
            });
        } else {
            alert(`${title}\n\n${message}`);
        }
    }

    try {
        // Caminho correto para o JSON dentro da pasta frontend
        const response = await fetch('frontend/data_source/listadelogins.json');
        if (!response.ok) throw new Error('Falha ao carregar lista de usuários.');
        const validUsers = await response.json();

        // Lista de usuários que não devem aparecer no select
        const ocultarUsuarios = ["admin", "johnnatan krause ribeiro moreno"];

        const manualOpt = usuarioSelect.querySelector('option[value="manual"]');
        validUsers.forEach(user => {
            if (!ocultarUsuarios.includes(user.usuario.toLowerCase())) {
                const option = document.createElement('option');
                option.value = user.usuario;
                option.textContent = user.usuario;
                usuarioSelect.insertBefore(option, manualOpt);
            }
        });


        // Alternar campo manual
        usuarioSelect.addEventListener('change', function () {
            const isManual = usuarioSelect.value === 'manual';
            usuarioManual.style.display = isManual ? 'block' : 'none';
            if (!isManual) usuarioManual.value = '';
            if (isManual) usuarioManual.focus();
        });

        // Lógica de login
        if (loginForm) {
            loginForm.addEventListener('submit', async function (event) {
                event.preventDefault();

                const usuarioInput = (usuarioSelect.value === 'manual')
                    ? usuarioManual.value.trim()
                    : usuarioSelect.value;
                const cadastroInput = document.getElementById('cadastro').value.trim();
                const senhaInput = document.getElementById('senha').value.trim();

                if (!usuarioInput || !cadastroInput || !senhaInput) {
                    return safeModal({
                        title: 'Campos obrigatórios',
                        message: 'Preencha usuário, cadastro e senha.'
                    });
                }

                let authenticatedUser = validUsers.find(u =>
                    u.usuario === usuarioInput &&
                    u.cadastro === cadastroInput &&
                    u.senha === senhaInput
                );

                if (authenticatedUser) {
                    localStorage.setItem('usuarioLogado', authenticatedUser.usuario);
                    localStorage.setItem('cadastroLogado', authenticatedUser.cadastro);
                    window.location.href = 'frontend/dashboard.html';
                } else {
                    safeModal({
                        title: 'Falha no Login',
                        message: 'Usuário, cadastro ou senha inválidos.'
                    });
                }
            });
        } else {
            console.error('Elemento #loginForm não encontrado.');
        }

        // Carregar footer comum
        const footerPlaceholder = document.getElementById('footer-placeholder');
        if (footerPlaceholder) {
            try {
                const footerResp = await fetch('frontend/footer.html');
                if (footerResp.ok) {
                    const footerHtml = await footerResp.text();
                    footerPlaceholder.innerHTML = footerHtml;
                }
            } catch (e) {
                console.warn('Rodapé não pôde ser carregado:', e.message);
            }
        }
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        safeModal({
            title: 'Erro no Sistema',
            message: `Não foi possível carregar a lista de usuários: ${error.message}`
        });
    }
});
