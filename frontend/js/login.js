document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMessageDiv = document.getElementById('loginErrorMessage');

    // Array de usuários válidos (exemplo)
    // Em um sistema real, isso viria de um backend seguro.
    const validUsers = [
        { usuario: "operador1", cadastro: "OP001", senha: "senha123" },
        { usuario: "admin", cadastro: "ADM001", senha: "adminpass" },
        { usuario: "juliano", cadastro: "JP007", senha: "minhasenha" }
    ];

    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Impede o envio padrão do formulário

            const usuarioInput = document.getElementById('usuario').value;
            const cadastroInput = document.getElementById('cadastro').value;
            const senhaInput = document.getElementById('senha').value;

            console.log("Tentativa de login com:");
            console.log("Usuário:", usuarioInput);
            console.log("Cadastro:", cadastroInput);
            // Não logar a senha em produção por segurança, apenas para debug aqui.
            // console.log("Senha:", senhaInput);

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
                // Login bem-sucedido
                console.log("Login bem-sucedido para:", authenticatedUser.usuario, "Cadastro:", authenticatedUser.cadastro);
                errorMessageDiv.style.display = 'none';
                errorMessageDiv.textContent = '';

                // Armazenar dados do usuário para a próxima página (ex: localStorage)
                // localStorage é simples para demonstração, mas considere a segurança para dados sensíveis.
                localStorage.setItem('usuarioLogado', authenticatedUser.usuario);
                localStorage.setItem('cadastroLogado', authenticatedUser.cadastro);

                alert(`Bem-vindo, ${authenticatedUser.usuario}!`);

                // Redirecionar para a próxima página (ex: dashboard.html)
                // Substitua 'dashboard.html' pelo nome da sua próxima página.
                window.location.href = 'dashboard.html'; // << MUDE AQUI para sua próxima página

            } else {
                // Login falhou
                console.log("Falha no login.");
                errorMessageDiv.textContent = 'Usuário, cadastro ou senha inválidos. Tente novamente.';
                errorMessageDiv.style.display = 'block';
            }
        });
    } else {
        console.error("Elemento #loginForm não encontrado no DOM.");
    }
});