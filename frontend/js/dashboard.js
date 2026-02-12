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
            // Poderia usar showCustomModal aqui também, mas um redirect direto pode ser aceitável
            // se a intenção é forçar o login.
            // Ex: await showCustomModal({title: "Sessão Expirada", message: "Sua sessão expirou ou não foi iniciada. Você será redirecionado para o login."})
            //     .then(() => window.location.href = 'index.html');
            window.location.href = 'index.html';
            return; // Interrompe a execução do script
        }
    } else {
        // Se o elemento de boas-vindas não existe, algo está muito errado com a página.
        console.error("Elemento #welcomeMessage não encontrado no DOM. Redirecionando para login como medida de segurança.");
        window.location.href = 'index.html'; 
        return;
    }

    // Lógica do botão de Logout
    if (logoutButton) {
        logoutButton.addEventListener('click', async function() { // Função tornada async
            // Usar o modal customizado para confirmar o logout
            const userConfirmedLogout = await showCustomModal({
                title: 'Confirmar Saída',
                message: 'Tem certeza de que deseja sair do sistema?',
                buttons: [
                    // Ordem dos botões pode ser ajustada visualmente no CSS se necessário,
                    // ou pela ordem que são adicionados, ou com `reverseButtons` em algumas libs.
                    // Para nosso modal DIY, a ordem de definição no array é a ordem de exibição.
                    { text: 'Não, Ficar', value: false, class: 'modal-btn-neutral' }, // Botão de "não" primeiro
                    { text: 'Sim, Sair', value: true, class: 'modal-btn-cancel' }   // Botão de "sim" (sair) como "cancel" (vermelho)
                ]
            });

            if (userConfirmedLogout === true) { // Usuário clicou em "Sim, Sair"
                localStorage.removeItem('usuarioLogado');
                localStorage.removeItem('cadastroLogado');
                sessionStorage.clear(); // Limpa sessionStorage também (setorSelecionado, etc.)
                
                // Opcional: um modal rápido de "desconectado" antes de redirecionar
                // await showCustomModal({ 
                //     title: 'Desconectado', 
                //     message: 'Você foi desconectado com sucesso.', 
                //     buttons: [{text: 'OK', value:true, class: 'modal-btn-neutral'}]
                // });
                
                window.location.href = '/index.html';
            }
            // Se userConfirmedLogout for false ou 'dismiss_esc'/'dismiss_overlay', não faz nada (usuário clicou em "Não, Ficar" ou fechou o modal)
        });
    } else {
        console.error("Elemento #logoutButton não encontrado no DOM.");
    }

    // Lógica para os botões de setor
    if (setorButtons && setorButtons.length > 0) {
        setorButtons.forEach(button => {
            button.addEventListener('click', function() {
                const setorSelecionado = this.dataset.setor;
                console.log("Setor selecionado pelo botão:", setorSelecionado);

                // Armazenar o setor selecionado para a próxima página (checklist.html)
                sessionStorage.setItem('setorSelecionado', setorSelecionado);

                // Redirecionar para a página de checklist
                window.location.href = 'checklist.html';
            });
        });
    } else {
        console.error("Nenhum botão .setor-btn encontrado ou NodeList vazia!");
    }
});