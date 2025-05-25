// frontend/js/login.js
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMessageDiv = document.getElementById('loginErrorMessage');

    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) { // Adicionamos 'async' aqui
            event.preventDefault(); // Impede o envio padrão do formulário

            const usuarioInput = document.getElementById('usuario').value;
            const cadastroInput = document.getElementById('cadastro').value;
            const senhaInput = document.getElementById('senha').value;

            // Limpa mensagens de erro anteriores
            errorMessageDiv.style.display = 'none';
            errorMessageDiv.textContent = '';

            console.log("Tentativa de login com:");
            console.log("Usuário:", usuarioInput);
            console.log("Cadastro:", cadastroInput);
            // Não logar a senha em produção por segurança

            try {
                const response = await fetch('http://127.0.0.1:5000/api/login', { // URL da nossa API
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        usuario: usuarioInput,
                        cadastro: cadastroInput,
                        senha: senhaInput
                    })
                });

                const data = await response.json(); // Pega a resposta do backend em JSON

                if (response.ok) { // Status HTTP 200-299 significa sucesso
                    // Login bem-sucedido
                    console.log("Login bem-sucedido:", data);
                    
                    // Armazenar dados do usuário para a próxima página
                    localStorage.setItem('usuarioLogado', data.usuario);
                    localStorage.setItem('cadastroLogado', data.cadastro);
                    // Se o backend retornasse um token, poderíamos armazená-lo aqui também:
                    // localStorage.setItem('authToken', data.token);

                    alert(`Bem-vindo, ${data.usuario}!`);

                    // Redirecionar para a próxima página
                    window.location.href = 'dashboard.html';

                } else {
                    // Login falhou (erro retornado pelo backend)
                    console.error("Falha no login:", data.error);
                    errorMessageDiv.textContent = data.error || 'Erro desconhecido ao tentar fazer login.';
                    errorMessageDiv.style.display = 'block';
                }

            } catch (error) {
                // Erro na comunicação com o servidor (ex: servidor offline, problema de rede)
                console.error("Erro ao conectar com o servidor:", error);
                errorMessageDiv.textContent = 'Não foi possível conectar ao servidor. Tente novamente mais tarde.';
                errorMessageDiv.style.display = 'block';
            }
        });
    } else {
        console.error("Elemento #loginForm não encontrado no DOM.");
    }
});