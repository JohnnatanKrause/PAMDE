// frontend/js/dashboard.js
document.addEventListener('DOMContentLoaded', function() {
    const welcomeMessageElement = document.getElementById('welcomeMessage');
    const logoutButton = document.getElementById('logoutButton');
    const setorButtons = document.querySelectorAll('.setor-btn');

    // Verificar se o usuário está logado
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    const cadastroLogado = localStorage.getItem('cadastroLogado');

    if (welcomeMessageElement) {
        if (usuarioLogado && cadastroLogado) {
            welcomeMessageElement.textContent = `Bem-vindo, ${usuarioLogado} (Cadastro: ${cadastroLogado})`;
        } else {
            // Se não houver dados de login, redireciona para a página de login
            console.warn("Dados de login não encontrados no localStorage. Redirecionando para login.");
            window.location.href = 'index.html';
            return; // Interrompe a execução do script
        }
    } else {
        console.error("Elemento #welcomeMessage não encontrado no DOM. Redirecionando para login.");
        window.location.href = 'index.html'; // Medida de segurança
        return;
    }

    // Lógica do botão de Logout
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            localStorage.removeItem('usuarioLogado');
            localStorage.removeItem('cadastroLogado');
            // localStorage.removeItem('authToken'); // Se você usar tokens no futuro
            // alert("Você foi desconectado."); // Alerta opcional, removido para fluxo mais direto
            window.location.href = 'index.html';
        });
    } else {
        console.error("Elemento #logoutButton não encontrado no DOM.");
    }

    // Lógica para os botões de setor
    if (setorButtons && setorButtons.length > 0) {
        setorButtons.forEach(button => {
            button.addEventListener('click', function() {
                const setorSelecionado = this.dataset.setor;
                console.log("Setor selecionado pelo botão:", setorSelecionado); // Mantido para fácil debug

                // Armazenar o setor selecionado para a próxima página (checklist.html)
                sessionStorage.setItem('setorSelecionado', setorSelecionado);

                // Redirecionar para a página de checklist
                window.location.href = 'checklist.html'; // <<< LINHA DE REDIRECIONAMENTO ATIVADA
            });
        });
    } else {
        console.error("Nenhum botão .setor-btn encontrado ou NodeList vazia!");
    }
});