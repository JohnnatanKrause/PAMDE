# PAMDE - Portal Analisador de Motores e Dispositivos Elétricos (Versão Frontend-Only)

## Visão Geral

O **PAMDE (Portal Analisador de Motores e Dispositivos Elétricos)** é um sistema de interface frontend, adaptado para operar de forma independente (sem backend dedicado na fase atual), focado na avaliação de desempenho, diagnóstico e otimização de motores e dispositivos elétricos para a fábrica de Alimentos Olé Conservas. Esta versão permite a coleta de dados de inspeção em campo, comparações com dados nominais (carregados de arquivos JSON locais) e a geração de relatórios (planejado para ser em PDF via JavaScript).

A estrutura do projeto inclui um `index.html` na raiz que redireciona para a aplicação principal dentro da pasta `frontend/`, permitindo futura integração de um servidor backend.

## Funcionalidades Principais

*   **Autenticação Local:** Simulação de login utilizando um arquivo JSON (`frontend/data_source/listadelogins.json`) para controle de acesso.
*   **Seleção de Setor:** Interface para o usuário selecionar o setor da fábrica a ser inspecionado.
*   **Checklist de Inspeção Dinâmico:**
    *   Carregamento de dados nominais de equipamentos a partir de arquivos JSON locais (`frontend/data_source/*.json`) específicos para cada setor.
    *   Navegação sequencial entre os equipamentos do setor selecionado.
    *   Formulário para entrada de dados medidos (elétricos, mecânicos), status de inspeção (Normal, N/A, N/M) e observações.
    *   Registro fotográfico obrigatório para cada equipamento inspecionado.
*   **Armazenamento Temporário de Dados:** Os dados da inspeção são mantidos no navegador durante a sessão.
*   **Geração de Relatório (Planejado):** Funcionalidade futura para gerar um relatório consolidado em PDF (utilizando bibliotecas JavaScript como jsPDF) ao final da inspeção de um setor.
*   **Interface Responsiva:** Estilização para adaptabilidade em diferentes tamanhos de tela.

## Público Alvo

Este sistema é direcionado principalmente para:

*   Técnicos e Equipes de Manutenção da Olé Conservas realizando inspeções em campo.
*   Engenheiros de Produção e Elétrica para consulta de dados nominais e acompanhamento de inspeções.

## Tecnologias Utilizadas

*   **Frontend:**
    *   HTML5
    *   CSS3 (com layout flexbox e grid)
    *   JavaScript (Vanilla JS - ES6+)
*   **Formato de Dados:** JSON (para dados nominais de equipamentos e lista de logins)
*   **Bibliotecas JavaScript Planejadas:**
    *   jsPDF (com jsPDF-AutoTable) ou pdfmake para geração de relatórios PDF.

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
│ │ ├── PANDE_logo.jpg
│ │ └── ole.jpg
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
## Como Executar Localmente

1.  **Clone o repositório:**
    ```bash
    git clone [URL_DO_SEU_REPOSITORIO_PAMDE]
    cd PAMDE_Portal
    ```
2.  **Abra o arquivo `index.html` (localizado na raiz do projeto `PAMDE_Portal/`) no seu navegador.** Ele deverá redirecioná-lo automaticamente para `frontend/index.html`.
    *   **Recomendado:** Utilize um servidor web local leve (como a extensão "Live Server" para VS Code) para servir os arquivos a partir da raiz do projeto (`PAMDE_Portal/`). Isso garante que as requisições `fetch()` para os arquivos JSON dentro de `frontend/data_source/` funcionem corretamente devido às políticas de segurança do navegador (CORS). Sem um servidor local, o `fetch` pode falhar.

## Lógica de Funcionamento

*   **Redirecionamento Inicial:** O `index.html` na raiz do projeto direciona o usuário para `frontend/index.html`.
*   **Autenticação:** O `frontend/js/login.js` compara as credenciais inseridas com os dados em `frontend/data_source/listadelogins.json`.
*   **Seleção de Setor:** O `frontend/js/dashboard.js` permite ao usuário escolher um setor. O setor escolhido é armazenado no `sessionStorage` do navegador.
*   **Checklist:**
    *   O `frontend/js/checklist.js` lê o setor do `sessionStorage`.
    *   Com base no setor, ele usa `fetch()` para carregar o arquivo JSON correspondente de `frontend/data_source/` (o caminho será relativo à página HTML que está executando o script, por exemplo, `data_source/nome_arquivo.json` se o `checklist.html` estiver em `frontend/`).
    *   Funções de *parsing* em JavaScript (dentro de `checklist.js`) processam a estrutura dos JSONs e montam a `listaDeEquipamentos`.
    *   O usuário navega pelos equipamentos, preenche os dados medidos e adiciona fotos.
    *   Os dados coletados são armazenados temporariamente em uma variável JavaScript (`dadosColetadosInspecao`).
*   **Relatório (Futuro):** Ao finalizar a inspeção, os dados coletados serão usados para gerar um PDF no lado do cliente.

## Observações sobre a Arquitetura

Esta versão do PAMDE opera como uma aplicação frontend-only, com dados nominais e de login armazenados em arquivos JSON. A inclusão de um `index.html` de redirecionamento na raiz facilita a futura integração de um servidor backend (Python ou outro) sem necessidade de reestruturar os caminhos base de acesso para os usuários ou para a configuração de plataformas de hospedagem como Vercel ou GitHub Pages (quando o foco for o frontend).

## Contato

Para questões relacionadas ao PAMDE na Olé Conservas, entre em contato com:
*   Johnnatan Krause Ribeiro Moreno
*   jkrause.eng@gmail.com