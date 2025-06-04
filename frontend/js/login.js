// frontend/js/login.js
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    // O div 'loginErrorMessage' no HTML não será mais usado para exibir estas mensagens,
    // mas pode ser mantido no HTML se você tiver outros usos para ele.
    // Para esta lógica de modal, ele não é mais diretamente manipulado aqui.

    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) { // Tornamos a função async para usar await
            event.preventDefault();

            const usuarioInput = document.getElementById('usuario').value;
            const cadastroInput = document.getElementById('cadastro').value;
            const senhaInput = document.getElementById('senha').value;

            // Se você ainda tem o div 'loginErrorMessage' no HTML e quer limpá-lo:
            const loginErrorMessageDiv = document.getElementById('loginErrorMessage');
            if (loginErrorMessageDiv) {
                loginErrorMessageDiv.style.display = 'none';
                loginErrorMessageDiv.textContent = '';
            }

            try {
                // Carregar usuários do JSON local
                const response = await fetch('data_source/listadelogins.json'); // Caminho para seu JSON
                if (!response.ok) {
                    // Se a lista de logins não puder ser carregada, isso é um erro mais sério
                    throw new Error('Falha ao carregar dados de autenticação. O sistema pode estar indisponível.');
                }
                const validUsers = await response.json();

                let isAuthenticated = false;
                let authenticatedUser = null;

                for (const user of validUsers) {
                    if (user.usuario === usuarioInput && user.cadastro === cadastroInput && user.senha === senhaInput) {
                        isAuthenticated = true;
                        authenticatedUser = user;
                        break;
                    }
                }

                if (isAuthenticated) {
                    console.log("Login local bem-sucedido para:", authenticatedUser.usuario);
                    localStorage.setItem('usuarioLogado', authenticatedUser.usuario);
                    localStorage.setItem('cadastroLogado', authenticatedUser.cadastro);
                    window.location.href = 'dashboard.html';
                } else {
                    console.log("Falha no login local: credenciais inválidas.");
                    // Substitui o antigo errorMessageDiv.textContent por showCustomModal
                    await showCustomModal({
                        title: 'Falha no Login',
                        message: 'Usuário, cadastro ou senha inválidos.',
                        buttons: [{ text: 'Tentar Novamente', value: true, class: 'modal-btn-neutral' }]
                        // O valor 'true' não é usado aqui, mas a promessa esperará o clique.
                    });
                }

            } catch (error) {
                console.error("Erro ao processar login:", error);
                // Substitui o antigo errorMessageDiv.textContent por showCustomModal
                await showCustomModal({
                    title: 'Erro no Sistema',
                    message: `Ocorreu um erro ao tentar fazer login: ${error.message}\nPor favor, tente mais tarde. Se o problema persistir, contate o suporte.`,
                    buttons: [{ text: 'OK', value: true, class: 'modal-btn-neutral' }]
                });
            }
        });
    } else {
        console.error("Elemento #loginForm não encontrado no DOM.");
    }
});