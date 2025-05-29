// frontend/js/login.js
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMessageDiv = document.getElementById('loginErrorMessage');

    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const usuarioInput = document.getElementById('usuario').value;
            const cadastroInput = document.getElementById('cadastro').value;
            const senhaInput = document.getElementById('senha').value;

            errorMessageDiv.style.display = 'none';
            errorMessageDiv.textContent = '';

            try {
                // Carregar usuários do JSON local
                const response = await fetch('data_source/listadelogins.json'); // Caminho para seu JSON
                if (!response.ok) {
                    throw new Error('Não foi possível carregar a lista de usuários.');
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
                    // Não há token ou dados complexos do backend para armazenar
                    window.location.href = 'dashboard.html';
                } else {
                    console.log("Falha no login local.");
                    errorMessageDiv.textContent = 'Usuário, cadastro ou senha inválidos.';
                    errorMessageDiv.style.display = 'block';
                }

            } catch (error) {
                console.error("Erro ao processar login:", error);
                errorMessageDiv.textContent = 'Erro ao tentar fazer login. Verifique o console.';
                errorMessageDiv.style.display = 'block';
            }
        });
    } else {
        console.error("Elemento #loginForm não encontrado no DOM.");
    }
});