# PAMDE - Portal Analisador de Motores e Dispositivos Elétricos (Versão Frontend-Only)

## Visão Geral

O **PAMDE (Portal Analisador de Motores e Dispositivos Elétricos)** é um sistema de interface frontend projetado para operar de forma independente (sem backend dedicado na fase atual). Seu foco é a avaliação de desempenho, diagnóstico e otimização de motores e dispositivos elétricos para a fábrica de Alimentos Olé Conservas. Esta versão permite a coleta de dados de inspeção em campo, comparações com dados nominais (carregados de arquivos JSON locais), a geração de relatórios em PDF via JavaScript e um sistema de feedback ao usuário através de modais customizados.

A estrutura do projeto inclui um `index.html` na raiz que redireciona para a aplicação principal dentro da pasta `frontend/`, facilitando uma futura integração de um servidor backend.

**Link para a Aplicação (Vercel):** [https://pamde-portalanalisadordemotoresedispositivoseletricos.vercel.app/frontend/index.html](https://pamde-portalanalisadordemotoresedispositivoseletricos.vercel.app/frontend/index.html)

## Funcionalidades Principais

*   **Autenticação Local:** Simulação de login utilizando um arquivo JSON (`frontend/data_source/listadelogins.json`) para controle de acesso. As credenciais do usuário logado (`usuarioLogado` e `cadastroLogado`) são armazenadas no `localStorage` do navegador.
*   **Seleção de Setor:** Interface no `dashboard.html` para o usuário selecionar o setor da fábrica a ser inspecionado. A seleção é armazenada no `sessionStorage` (`setorSelecionado`).
*   **Checklist de Inspeção Dinâmico (`checklist.html`):**
    *   Carregamento de dados nominais de equipamentos a partir de arquivos JSON locais (`frontend/data_source/equipamentos[SETOR].json`) específicos para cada setor. A função `parseEquipamentosFromNestedJson` em `checklist.js` é responsável por processar a estrutura hierárquica aninhada desses arquivos JSON.
    *   Navegação sequencial (Anterior/Próximo) entre os equipamentos do setor selecionado.
    *   Formulário detalhado para entrada de dados medidos:
        *   **Dados de Placa do Motor:** Marca, Modelo, Potência (CV).
        *   **Dados Elétricos Medidos:** Potência (CV), Rotação (RPM), Tensão (F1, F2, F3), Corrente (F1, F2, F3), Regulagem de Corrente (Relé).
        *   **Dados Mecânicos Medidos:** Modelo Rolamento Dianteiro, Modelo Rolamento Traseiro.
        *   **Inspeção Qualitativa:** Vibração Excessiva, Temperatura (°C), Ruído Rolamento Dianteiro, Ruído Rolamento Traseiro.
    *   Para cada campo de medição, o usuário pode marcar "N/A" (Não Aplicável) ou "N/M" (Não Medido), desabilitando o campo de entrada correspondente.
    *   Registro fotográfico obrigatório para cada equipamento inspecionado (preview da imagem exibido na tela).
*   **Armazenamento Temporário de Dados:** Os dados da inspeção de cada equipamento são mantidos em uma variável JavaScript (`dadosColetadosInspecao` em `checklist.js`) durante a sessão da página de checklist. Fotos são temporariamente convertidas para Data URL para preview e inclusão no PDF.
*   **Geração de Pareceres Técnicos:** Ao salvar os dados de um equipamento, a função `gerarPareceresEquipamento` em `checklist.js` compara os dados medidos com os nominais, gerando pareceres automáticos (Ex: "Conforme", "Alerta - Subtensão", "Divergência", etc.) para diversos parâmetros.
*   **Geração de Relatório PDF:**
    *   Após finalizar a inspeção de um setor, o usuário pode gerar um relatório consolidado em PDF utilizando `jsPDF` e `jsPDF-AutoTable`.
    *   O relatório inclui:
        *   Cabeçalho com logos da Olé e PAMDE (convertidas para Base64 e armazenadas no `sessionStorage` via `imageToBase64` e `carregarLogosBase64`).
        *   Informações do inspetor e data/hora.
        *   Detalhes de cada equipamento inspecionado: dados nominais, dados medidos/placa (com status N/A, N/M), pareceres técnicos, foto e observações.
        *   Uma seção de "Itens para Atualização no Cadastro (JSON)" caso dados de placa preenchidos pelo usuário não constem ou divirjam dos nominais no JSON.
        *   Um resumo da inspeção do setor (total de equipamentos cadastrados vs. inspecionados).
*   **Interface de Usuário Interativa:** Utilização de um sistema de modal customizado (`common.js` e `footer.html`) para exibir mensagens de erro, confirmações e alertas, melhorando a experiência do usuário.
*   **Interface Responsiva:** Estilização com CSS3 (utilizando Flexbox e Grid Layout) para adaptabilidade em diferentes tamanhos de tela.

## Como o Usuário Final Utilizará o Sistema

1.  **Acesso ao Sistema:**
    *   O usuário acessa a página de login (`frontend/index.html`).
    *   Insere "Usuário", "Cadastro (ID Operador)" e "Senha".
    *   O sistema valida as credenciais contra o `listadelogins.json`. Em caso de sucesso, redireciona para o Dashboard; caso contrário, exibe um modal de erro.
2.  **Seleção de Setor (Dashboard):**
    *   No `dashboard.html`, o usuário visualiza uma mensagem de boas-vindas e os botões dos setores disponíveis.
    *   Clica no botão do setor que deseja inspecionar. A escolha é salva e ele é redirecionado para a página de Checklist.
    *   Há um botão "Sair" que, após confirmação via modal, limpa os dados de sessão/login e retorna à página de login.
3.  **Inspeção de Equipamentos (Checklist):**
    *   Na página `checklist.html`, o sistema carrega o primeiro equipamento do setor selecionado.
    *   O usuário visualiza os "Dados Nominais" do equipamento.
    *   Preenche a seção "Dados Medidos e Inspeção", incluindo:
        *   Informações da placa do motor.
        *   Medições elétricas e mecânicas.
        *   Avaliações qualitativas (vibração, ruído, temperatura).
        *   Para cada campo, pode marcar N/A ou N/M se a medição não for possível ou aplicável.
        *   Adiciona uma foto obrigatória do equipamento.
        *   Escreve observações relevantes.
    *   Clica em "Próximo Equipamento" para salvar os dados do item atual e carregar o próximo. Pode usar "Anterior" para revisar.
    *   Os campos obrigatórios são validados antes de avançar.
4.  **Finalização da Inspeção do Setor:**
    *   Após inspecionar o último equipamento (ou a qualquer momento se desejar finalizar com os itens já preenchidos), o usuário clica em "Finalizar Inspeção do Setor".
    *   Isso salva o último item (se modificado e validado) e prepara o sistema para a geração do relatório. O formulário de inspeção é ocultado.
5.  **Geração do Relatório PDF:**
    *   O botão "Gerar Relatório PDF" torna-se visível.
    *   Ao clicar, o sistema compila todos os dados coletados e pareceres, gerando um arquivo PDF que é baixado pelo navegador.
6.  **Pós-Relatório:**
    *   Após a geração do PDF, um modal pergunta se o usuário deseja inspecionar outro setor ou sair.
    *   "Sim, Novo Setor" redireciona para o Dashboard.
    *   "Não, Sair" limpa a sessão e redireciona para a página de Login.
    *   O usuário pode optar por voltar ao Dashboard a qualquer momento durante a inspeção (com aviso de perda de dados não finalizados).

## Público Alvo

Este sistema é direcionado principalmente para:

*   Técnicos e Equipes de Manutenção da Olé Conservas realizando inspeções em campo.
*   Engenheiros de Produção e Elétrica para consulta de dados nominais e acompanhamento de inspeções.

## Tecnologias Utilizadas

*   **Frontend:**
    *   HTML5
    *   CSS3 (com layout Flexbox e Grid Layout)
    *   JavaScript (Vanilla JS - ES6+)
*   **Formato de Dados:** JSON (para dados nominais de equipamentos e lista de logins)
*   **Bibliotecas JavaScript Utilizadas:**
    *   jsPDF (com jsPDF-AutoTable) para geração de relatórios PDF.
*   **Armazenamento no Navegador:**
    *   `localStorage`: Para persistência das credenciais de login do usuário entre sessões.
    *   `sessionStorage`: Para armazenar o setor selecionado para a inspeção atual e logos convertidas para Base64.
    *   Variáveis JavaScript: Para armazenamento dos dados da inspeção em andamento na página de checklist (resetadas ao sair da página).

## Estrutura do Projeto

PAMDE_Portal/
├── frontend/
│ ├── assets/
│ │ ├── css/
│ │ │ ├── checklist.css
│ │ │ ├── dashboard.css
│ │ │ ├── global.css
│ │ │ └── login.css
│ │ └── img/
│ │ ├── favicon.png
│ │ ├── plano_de_fundo.png
│ │ ├── pande_logo.jpg
│ │ └── ole_logo.jpg
│ ├── data_source/ <-- DADOS DOS EQUIPAMENTOS E LOGINS
│ │ ├── equipamentosautoclaves.json
│ │ ├── equipamentospreparacao.json
│ │ ├── equipamentossafra.json
│ │ ├── equipamentosteste.json
│ │ ├── equipamentostorres.json
│ │ ├── equipamentosvegetais.json
│ │ └── listadelogins.json
│ ├── js/
│ │ ├── checklist.js
│ │ ├── common.js
│ │ ├── dashboard.js
│ │ └── login.js
│ ├── checklist.html
│ ├── dashboard.html
│ ├── footer.html
│ └── index.html <-- PÁGINA DE LOGIN (PONTO DE ENTRADA DA APLICAÇÃO FRONTEND)
├── index.html <-- PÁGINA DE REDIRECIONAMENTO (PARA frontend/index.html)
└── README.md <-- ESTE ARQUIVO


## Lógica de Funcionamento Detalhada

*   **Redirecionamento Inicial:** O `index.html` na raiz do projeto direciona o usuário para `frontend/index.html`.
*   **Autenticação (`login.js`):**
    *   Compara as credenciais inseridas com os dados em `frontend/data_source/listadelogins.json` via `fetch`.
    *   Se autenticado, armazena `usuarioLogado` e `cadastroLogado` no `localStorage` e redireciona para `dashboard.html`.
    *   Falhas ou erros são comunicados via `showCustomModal`.
*   **Seleção de Setor (`dashboard.js`):**
    *   Verifica se o usuário está logado (checa `localStorage`).
    *   Permite ao usuário escolher um setor. O setor escolhido (`setorSelecionado`) é armazenado no `sessionStorage`.
    *   Redireciona para `checklist.html`.
    *   Logout limpa `localStorage` e `sessionStorage`.
*   **Checklist (`checklist.js`):**
    *   Recupera `setorSelecionado` do `sessionStorage` e dados do usuário do `localStorage`.
    *   Carrega logos (`ole_logo.jpg`, `pande_logo.jpg`) via `fetch`, converte para Base64 com `imageToBase64`, e armazena no `sessionStorage` para uso no PDF.
    *   Com base no setor, usa `fetch()` para carregar o arquivo JSON de equipamento correspondente de `frontend/data_source/`.
    *   A função `parseEquipamentosFromNestedJson` processa a estrutura dos JSONs (que podem ter múltiplos níveis de aninhamento e arrays de motores) e monta a `listaDeEquipamentos`.
    *   O usuário navega pelos equipamentos. Os dados nominais são exibidos. O formulário é limpo ou preenchido com dados previamente salvos (da variável `dadosColetadosInspecao`) para o item atual.
    *   Ao avançar/finalizar, os dados do formulário são coletados por `coletarDadosDoFormulario`.
    *   `validarCamposObrigatorios` garante que campos-chave e a foto sejam preenchidos (ou marcados como N/A, N/M).
    *   `gerarPareceresEquipamento` analisa os dados coletados contra os nominais, gerando diagnósticos.
    *   Os dados coletados e pareceres são armazenados na variável `dadosColetadosInspecao`.
*   **Comunicação e Feedback (`common.js`):**
    *   `loadFooter` injeta o `footer.html` (que contém a estrutura do modal) no placeholder `#footer-placeholder`.
    *   `initializeModalSelectors` configura os seletores do modal após o carregamento do footer.
    *   `showCustomModal` é uma função centralizada para exibir diálogos (erros, confirmações, informações) de forma consistente.
*   **Relatório PDF (`checklist.js` - `criarPDF`):**
    *   Ao finalizar a inspeção e clicar em "Gerar Relatório PDF", a função `criarPDF` é chamada.
    *   Utiliza `jsPDF` e `jsPDF-AutoTable` para montar o documento.
    *   Inclui dados do inspetor, setor, data/hora, logos.
    *   Para cada equipamento: dados nominais, dados medidos (com tratamento para N/A, N/M), pareceres técnicos, foto (se houver), observações.
    *   Adiciona uma seção de resumo com equipamentos que necessitam de atualização no JSON e um balanço da inspeção.
    *   O PDF é gerado e o download é iniciado no navegador do cliente.

## Observações sobre a Arquitetura

Esta versão do PAMDE opera como uma aplicação frontend-only, com dados nominais e de login armazenados em arquivos JSON locais. A lógica de negócios, validações e geração de relatórios é toda executada no lado do cliente (navegador).

A inclusão de um `index.html` de redirecionamento na raiz facilita a futura integração de um servidor backend (Python, Node.js, etc.) sem necessidade de reestruturar os caminhos base de acesso para os usuários ou para a configuração de plataformas de hospedagem como Vercel ou GitHub Pages (quando o foco for o frontend).

O uso de `localStorage` para dados de login permite uma persistência básica entre sessões, enquanto `sessionStorage` é usado para dados transitórios da sessão de inspeção (setor, logos em base64). A coleta principal dos dados de inspeção reside em uma variável JavaScript, sendo volátil se a página for fechada antes da finalização.

## Contato

Para questões relacionadas ao PAMDE na Olé Conservas, entre em contato com:
*   Johnnatan Krause Ribeiro Moreno
*   jkrause.eng@gmail.com