// frontend/js/checklist.js
console.log("[DEBUG] checklist.js: ARQUIVO SENDO LIDO E PARSEADO PELO NAVEGADOR");

document.addEventListener('DOMContentLoaded', function () {
    console.log("[DEBUG] checklist.js: DOMContentLoaded - INÍCIO");

    // --- SELETORES DE ELEMENTOS DO DOM ---
    const checklistUserInfo = document.getElementById('checklistUserInfo');
    const setorAtualTitulo = document.getElementById('setorAtualTitulo');
    const equipamentoTagElement = document.getElementById('equipamentoTag');
    const equipamentoAtualIndexElement = document.getElementById('equipamentoAtualIndex');
    const totalEquipamentosElement = document.getElementById('totalEquipamentos');
    const nominaisContainer = document.getElementById('nominaisContainer');
    const inspecaoForm = document.getElementById('inspecaoForm');
    const fotoEquipamentoInput = document.getElementById('foto_equipamento');
    const previewFotoElement = document.getElementById('preview_foto');
    const noEquipmentsMessage = document.getElementById('noEquipmentsMessage');
    const equipamentoInfoWrapper = document.querySelector('.equipamento-info-wrapper');

    const voltarDashboardBtn = document.getElementById('voltarDashboardBtn');
    const proximoEquipamentoBtn = document.getElementById('proximoEquipamentoBtn');
    const anteriorEquipamentoBtn = document.getElementById('anteriorEquipamentoBtn');
    const finalizarInspecaoBtn = document.getElementById('finalizarInspecaoBtn');

    const temperaturaMedidaInput = document.getElementById('temperatura_medida');
    const temperaturaStatusCheckboxes = document.querySelectorAll('input.status_checkbox[name="temperatura_medida_status"]');

    const marcaMedidaInput = document.getElementById('marca_medida');
    const modeloMedidoInput = document.getElementById('modelo_medido');
    const potenciaMedidaInput = document.getElementById('potencia_medida');
    const rotacaoMedidaInput = document.getElementById('rotacao_medida');
    const tensaoF1MedidaInput = document.getElementById('tensao_f1_medida');
    const tensaoF2MedidaInput = document.getElementById('tensao_f2_medida');
    const tensaoF3MedidaInput = document.getElementById('tensao_f3_medida');
    const correnteF1MedidaInput = document.getElementById('corrente_f1_medida');
    const correnteF2MedidaInput = document.getElementById('corrente_f2_medida');
    const correnteF3MedidaInput = document.getElementById('corrente_f3_medida');
    const regulagemCorrenteMedidaInput = document.getElementById('regulagem_corrente_medida');
    const rolamentoDMedidoInput = document.getElementById('rolamento_d_medido');
    const rolamentoTMedidoInput = document.getElementById('rolamento_t_medido');
    const vibracaoSelect = document.getElementById('vibracao');
    const ruidoRolDSelect = document.getElementById('ruido_rol_d');
    const ruidoRolTSelect = document.getElementById('ruido_rol_t');

    // --- ESTADO DA APLICAÇÃO ---
    let listaDeEquipamentos = [];
    let indiceEquipamentoAtual = 0;
    let dadosColetadosInspecao = [];


    // --- DEFINIÇÕES DAS FUNÇÕES ---

    function parseEquipamentosFromNestedJson(jsonData, setorPrincipalChaveNoJson) {
        const equipamentosExtraidos = [];
        if (!jsonData || !jsonData[setorPrincipalChaveNoJson]) {
            console.warn(`[PARSE] Chave principal do setor '${setorPrincipalChaveNoJson}' não encontrada no JSON.`);
            return equipamentosExtraidos;
        }

        const dadosDoSetor = jsonData[setorPrincipalChaveNoJson];

        // Nível 1: Iterar sobre chaves como "setor_teste_1", "setor_teste_2"
        for (const subsetorNivel1Nome in dadosDoSetor) {
            if (dadosDoSetor.hasOwnProperty(subsetorNivel1Nome)) {
                const subsetorNivel1Conteudo = dadosDoSetor[subsetorNivel1Nome];

                // Nível 2: Iterar sobre chaves como "equip_teste_A", "equip_teste_B"
                for (const subsetorNivel2Nome in subsetorNivel1Conteudo) {
                    if (subsetorNivel1Conteudo.hasOwnProperty(subsetorNivel2Nome)) {
                        const subsetorNivel2Conteudo = subsetorNivel1Conteudo[subsetorNivel2Nome];

                        // Nível 3 (Equipamentos/Motores): Iterar sobre chaves como "motor_A1", "motor_B1"
                        for (const nomeMotor in subsetorNivel2Conteudo) {
                            if (subsetorNivel2Conteudo.hasOwnProperty(nomeMotor)) {
                                const dadosMotor = subsetorNivel2Conteudo[nomeMotor];
                                equipamentosExtraidos.push({
                                    ...dadosMotor, // Copia todas as propriedades do motor (tag_motor, potencia_CV_nominal, etc.)
                                    // Adiciona informações de hierarquia e um ID único
                                    id_equipamento_db: dadosMotor.tag_motor + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5), // ID mais robusto
                                    setor_principal: setorPrincipalChaveNoJson.toUpperCase(), // Ex: "TESTE"
                                    subsetor_nivel1: subsetorNivel1Nome,
                                    subsetor_nivel2: subsetorNivel2Nome,
                                    nome_componente: nomeMotor // O nome da chave do motor, ex: "motor_A1"
                                });
                            }
                        }
                    }
                }
            }
        }
        console.log(`[PARSE] Equipamentos extraídos do JSON:`, equipamentosExtraidos);
        return equipamentosExtraidos;
    }

    // ESTA FUNÇÃO (fetchEquipamentosDoSetor) PRECISA SER DEFINIDA ANTES DE initChecklist
    async function fetchEquipamentosDoSetor(setorSelecionadoInterface) { // Ex: "TESTE"
        console.log(`[DEBUG] fetchEquipamentosDoSetor: Buscando para o setor da interface: ${setorSelecionadoInterface}`);
        let equipamentosCarregados = [];

        // 1. Determinar o nome do arquivo e a chave principal no JSON
        //    Vamos assumir que o nome do arquivo é "equipamentos" + nome do setor em minúsculas + ".json"
        //    E a chave principal dentro do JSON é o nome do setor em minúsculas.
        const setorEmMinusculas = setorSelecionadoInterface.toLowerCase(); // ex: "teste"
        const nomeArquivoJson = `data_source/equipamentos${setorEmMinusculas}.json`; // ex: "equipamentosteste.json"
        const chavePrincipalJson = setorEmMinusculas; // ex: "teste"

        console.log(`[DEBUG] Tentando carregar o arquivo: ${nomeArquivoJson} e usar a chave principal: ${chavePrincipalJson}`);

        try {
            const response = await fetch(nomeArquivoJson);
            if (!response.ok) {
                throw new Error(`Erro ao carregar ${nomeArquivoJson}: ${response.status} ${response.statusText}`);
            }
            const jsonData = await response.json();

            // 2. Parsear o JSON usando a nova função
            equipamentosCarregados = parseEquipamentosFromNestedJson(jsonData, chavePrincipalJson);

        } catch (error) {
            console.error(`[ERRO] Falha ao buscar ou processar equipamentos do arquivo ${nomeArquivoJson} para o setor ${setorSelecionadoInterface}:`, error);
            if (noEquipmentsMessage) {
                let msgErro = `Erro ao carregar dados para o setor "${setorSelecionadoInterface}".`;
                if (error.message.includes("404") || error.message.toLowerCase().includes("failed to fetch")) {
                    msgErro = `Arquivo de dados (${nomeArquivoJson}) não encontrado ou inacessível para o setor "${setorSelecionadoInterface}". Verifique se o arquivo existe no local correto.`;
                } else if (error instanceof SyntaxError) {
                    msgErro = `O arquivo ${nomeArquivoJson} contém um erro de sintaxe JSON. Verifique o arquivo.`;
                }
                noEquipmentsMessage.textContent = msgErro;
                noEquipmentsMessage.style.display = 'block';
            }
            if (equipamentoInfoWrapper) equipamentoInfoWrapper.style.display = 'none';
            equipamentosCarregados = []; // Garante que a lista esteja vazia em caso de erro
        }

        // 3. Atualizar o estado da aplicação
        listaDeEquipamentos = equipamentosCarregados;
        indiceEquipamentoAtual = 0;
        dadosColetadosInspecao = new Array(listaDeEquipamentos.length).fill(null);

        if (listaDeEquipamentos.length > 0) {
            if (noEquipmentsMessage) noEquipmentsMessage.style.display = 'none';
            if (equipamentoInfoWrapper) equipamentoInfoWrapper.style.display = 'block'; // ou 'flex'
            exibirEquipamentoAtual();
        } else {
            if (equipamentoInfoWrapper) equipamentoInfoWrapper.style.display = 'none';
            if (proximoEquipamentoBtn) proximoEquipamentoBtn.disabled = true;
            if (anteriorEquipamentoBtn) anteriorEquipamentoBtn.disabled = true;
            if (finalizarInspecaoBtn) finalizarInspecaoBtn.disabled = true;
            // A mensagem de erro já foi exibida no bloco catch se necessário,
            // ou se o parsing não retornou equipamentos.
            if (noEquipmentsMessage && noEquipmentsMessage.style.display === 'none' && equipamentosCarregados.length === 0) {
                noEquipmentsMessage.textContent = `Nenhum equipamento encontrado para o setor "${setorSelecionadoInterface}" no arquivo ${nomeArquivoJson}.`;
                noEquipmentsMessage.style.display = 'block';
            }
        }
        if (totalEquipamentosElement) totalEquipamentosElement.textContent = listaDeEquipamentos.length;
    }

    /* function handleStatusCheckboxChange(event) {
        const changedCheckbox = event.target;
        const targetInputId = changedCheckbox.dataset.targetInput;
        const targetInput = document.getElementById(targetInputId);
        if (!targetInput) return;

        document.querySelectorAll(`input.status_checkbox[name="${changedCheckbox.name}"][data-target-input="${targetInputId}"]`).forEach(cb => {
            if (cb !== changedCheckbox) cb.checked = false;
        });

        if (changedCheckbox.checked) {
            targetInput.value = '';
            targetInput.disabled = true;
        } else {
            const anyStatusChecked = Array.from(document.querySelectorAll(`input.status_checkbox[name="${changedCheckbox.name}"][data-target-input="${targetInputId}"]`))
                .some(cb => cb.checked);
            if (!anyStatusChecked) {
                targetInput.disabled = false;
            }
        }
    } */

function handleStatusCheckboxChange(event) {
    const changedCheckbox = event.target;
    const targetInputId = changedCheckbox.dataset.targetInput;
    const targetInput = document.getElementById(targetInputId);
    if (!targetInput) {
        console.warn(`[StatusCheckbox] Input alvo não encontrado para ID: ${targetInputId}`);
        return;
    }

    // Seleciona o span do tooltip específico para este grupo de checkboxes
    // O ID do tooltip deve ser "tooltip_" + o atributo 'name' dos checkboxes de status.
    const tooltipSpan = document.getElementById(`tooltip_${changedCheckbox.name}`);

    // Desmarcar outros checkboxes do mesmo grupo (que tenham o mesmo 'name' e 'data-target-input')
    document.querySelectorAll(`input.status_checkbox[name="${changedCheckbox.name}"][data-target-input="${targetInputId}"]`).forEach(cb => {
        if (cb !== changedCheckbox) {
            cb.checked = false;
        }
    });

    if (changedCheckbox.checked) {
        // Mostrar tooltip informativo
        if (tooltipSpan) {
            if (changedCheckbox.value === "NA") { // Usando "NA" e "NM" como nos values do HTML
                tooltipSpan.textContent = "N/A: Não se aplica a este equipamento.";
            } else if (changedCheckbox.value === "NM") {
                tooltipSpan.textContent = "N/M: Não medido (ex: falta de ferramenta/condição).";
            }
            tooltipSpan.style.display = 'inline-block'; // Usar inline-block para melhor alinhamento com CSS
        } else {
            // Se o tooltipSpan não for encontrado, logar um aviso.
            // Isso ajuda a identificar se o ID do span no HTML não está correto.
            console.warn(`[Tooltip] Span de tooltip não encontrado para o grupo de status: '${changedCheckbox.name}'. Esperava um elemento com ID: 'tooltip_${changedCheckbox.name}'`);
            // Como fallback, poderia usar alert, mas é melhor corrigir o HTML.
            // if (changedCheckbox.value === "NA") alert("N/A: Não se aplica.");
            // else if (changedCheckbox.value === "NM") alert("N/M: Não medido.");
        }

        // Limpar e desabilitar o input associado
        targetInput.value = '';
        targetInput.disabled = true;
        if (targetInput.tagName === 'SELECT') { // Se for um select, resetar para a primeira opção (geralmente "Selecione")
            targetInput.selectedIndex = 0;
        }

    } else {
        // Se o checkbox foi desmarcado, esconder o tooltip
        if (tooltipSpan) {
            tooltipSpan.style.display = 'none';
            tooltipSpan.textContent = '';
        }

        // Habilitar o input somente se NENHUM checkbox de status para este input estiver marcado
        const anyStatusCheckedForThisInput = Array.from(
            document.querySelectorAll(`input.status_checkbox[name="${changedCheckbox.name}"][data-target-input="${targetInputId}"]`)
        ).some(cb => cb.checked);

        if (!anyStatusCheckedForThisInput) {
            targetInput.disabled = false;
        }
    }
}

function limparFormularioInspecao() {
    if (inspecaoForm) {
        inspecaoForm.reset(); // Reseta valores de todos os campos do formulário
    }

    if (previewFotoElement) {
        previewFotoElement.style.display = 'none';
        previewFotoElement.src = "#";
    }

    // Reabilitar todos os inputs e selects que podem ter sido desabilitados por checkboxes de status
    // e desmarcar todos os checkboxes de status.
    // É importante fazer o reset do form ANTES para que os valores padrão sejam restaurados (se houver).
    document.querySelectorAll('input[type="text"][id], input[type="number"][id], select[id]').forEach(inputElement => {
        // Verifica se há checkboxes de status associados a este input
        const hasStatusCheckboxes = document.querySelector(`.status_checkbox[data-target-input="${inputElement.id}"]`);
        if (hasStatusCheckboxes) {
            inputElement.disabled = false; // Habilita o input/select
        }
    });

    // Desmarcar todos os checkboxes de status explicitamente (o form.reset() pode não desmarcar se não for o estado inicial)
    document.querySelectorAll('input.status_checkbox').forEach(cb => {
        cb.checked = false;
    });

    // Esconder todos os tooltips de status
    document.querySelectorAll('.status-tooltip').forEach(tooltip => {
        tooltip.style.display = 'none';
        tooltip.textContent = '';
    });

    // Garantir que inputs específicos como temperatura sejam habilitados se não tiverem status marcado
    // (já coberto pelo loop acima se 'temperaturaMedidaInput' for pego)
    // if (temperaturaMedidaInput) temperaturaMedidaInput.disabled = false;
}


    function preencherFormularioComDadosSalvos(dadosSalvos) {
        if (!inspecaoForm || !dadosSalvos) return;
        limparFormularioInspecao();

        for (const key in dadosSalvos) {
            if (dadosSalvos.hasOwnProperty(key)) {
                if (key === 'foto_equipamento_previewDataUrl') {
                    if (dadosSalvos[key] && previewFotoElement) {
                        previewFotoElement.src = dadosSalvos[key];
                        previewFotoElement.style.display = 'block';
                    } else if (previewFotoElement) {
                        previewFotoElement.style.display = 'none';
                    }
                    continue;
                }

                if (key.endsWith('_status') && dadosSalvos[key]) {
                    const targetInputId = key.replace('_status', '');
                    const targetInput = document.getElementById(targetInputId);
                    const statusCheckbox = document.querySelector(`input.status_checkbox[name="${key}"][value="${dadosSalvos[key]}"]`);

                    if (statusCheckbox) {
                        statusCheckbox.checked = true;
                        if (targetInput) {
                            targetInput.value = '';
                            targetInput.disabled = true;
                        }
                    }
                    continue;
                }

                const element = inspecaoForm.elements[key];
                if (element) {
                    if (element.type === 'file') { /* No-op */ }
                    else if (element.type === 'checkbox') { element.checked = dadosSalvos[key]; }
                    else if (element.type === 'radio' || (element.length && element[0] && element[0].type === 'radio')) {
                        document.querySelectorAll(`input[name="${key}"]`).forEach(radio => {
                            if (radio.value === String(dadosSalvos[key])) radio.checked = true;
                        });
                    } else if (element.tagName === 'SELECT') {
                        element.value = dadosSalvos[key];
                    } else if (element.name && !key.endsWith('_status')) {
                        if (!element.disabled) {
                            element.value = dadosSalvos[key];
                        }
                    }
                }
            }
        }
    }

    function exibirEquipamentoAtual() {
        limparFormularioInspecao();

        if (listaDeEquipamentos.length === 0) {
            if (equipamentoInfoWrapper) equipamentoInfoWrapper.style.display = 'none';
            if (noEquipmentsMessage) {
                noEquipmentsMessage.textContent = "Nenhum equipamento para exibir.";
                noEquipmentsMessage.style.display = 'block';
            }
            if (proximoEquipamentoBtn) proximoEquipamentoBtn.disabled = true;
            if (anteriorEquipamentoBtn) anteriorEquipamentoBtn.disabled = true;
            if (finalizarInspecaoBtn) finalizarInspecaoBtn.disabled = true;
            if (equipamentoTagElement) equipamentoTagElement.textContent = "N/A";
            if (equipamentoAtualIndexElement) equipamentoAtualIndexElement.textContent = "0";
            return;
        }

        if (indiceEquipamentoAtual >= listaDeEquipamentos.length) {
            if (proximoEquipamentoBtn) {
                proximoEquipamentoBtn.textContent = "Finalizar Inspeção";
                proximoEquipamentoBtn.disabled = true;
            }
            if (anteriorEquipamentoBtn) anteriorEquipamentoBtn.disabled = (listaDeEquipamentos.length === 0);
            if (finalizarInspecaoBtn) finalizarInspecaoBtn.disabled = false;
            if (equipamentoTagElement) equipamentoTagElement.textContent = "Fim da Lista";
            if (equipamentoAtualIndexElement) equipamentoAtualIndexElement.textContent = indiceEquipamentoAtual;
            return;
        }

        const equipamento = listaDeEquipamentos[indiceEquipamentoAtual];
        if (!equipamento) {
            console.error("Equipamento não encontrado no índice:", indiceEquipamentoAtual);
            return;
        }

        if (equipamentoTagElement) equipamentoTagElement.textContent = equipamento.tag_motor || "TAG Indisponível";
        if (equipamentoAtualIndexElement) equipamentoAtualIndexElement.textContent = indiceEquipamentoAtual + 1;

        if (nominaisContainer) {
            const spansNominais = nominaisContainer.querySelectorAll('span[data-nominal]');
            spansNominais.forEach(span => {
                const key = span.dataset.nominal;
                span.textContent = (equipamento[key] !== null && equipamento[key] !== undefined && String(equipamento[key]).trim() !== "") ? equipamento[key] : '-';
            });
        }

        if (anteriorEquipamentoBtn) anteriorEquipamentoBtn.disabled = (indiceEquipamentoAtual === 0);
        if (proximoEquipamentoBtn) {
            proximoEquipamentoBtn.disabled = false;
            proximoEquipamentoBtn.textContent = (indiceEquipamentoAtual === listaDeEquipamentos.length - 1) ? "Revisar/Finalizar Último Item" : "Próximo Equipamento";
        }
        if (finalizarInspecaoBtn) {
            finalizarInspecaoBtn.disabled = dadosColetadosInspecao.filter(d => d !== null).length === 0 && listaDeEquipamentos.length > 0;
        }

        const dadosSalvosParaEsteItem = dadosColetadosInspecao[indiceEquipamentoAtual];
        if (dadosSalvosParaEsteItem) {
            preencherFormularioComDadosSalvos(dadosSalvosParaEsteItem);
        }
    }

    function validarCamposObrigatorios() {
        const camposParaValidar = [
            { input: marcaMedidaInput, nome: "Marca" }, { input: modeloMedidoInput, nome: "Modelo" },
            { input: potenciaMedidaInput, nome: "Potência Medida (CV)" }, { input: rotacaoMedidaInput, nome: "Rotação Medida (RPM)" },
            { input: tensaoF1MedidaInput, nome: "Tensão F1" }, { input: tensaoF2MedidaInput, nome: "Tensão F2" },
            { input: tensaoF3MedidaInput, nome: "Tensão F3" }, { input: correnteF1MedidaInput, nome: "Corrente F1" },
            { input: correnteF2MedidaInput, nome: "Corrente F2" }, { input: correnteF3MedidaInput, nome: "Corrente F3" },
            { input: regulagemCorrenteMedidaInput, nome: "Regulagem de Corrente" },
            { input: rolamentoDMedidoInput, nome: "Rolamento Dianteiro" }, { input: rolamentoTMedidoInput, nome: "Rolamento Traseiro" },
            { input: vibracaoSelect, nome: "Vibração Excessiva" },
            { input: ruidoRolDSelect, nome: "Ruído Rol. Dianteiro" }, { input: ruidoRolTSelect, nome: "Ruído Rol. Traseiro" },
        ];

        for (const campo of camposParaValidar) {
            if (!campo.input) { console.warn(`Campo para validação '${campo.nome}' não encontrado no DOM.`); continue; }
            if (!campo.input.disabled && !campo.input.value.trim()) {
                alert(`Por favor, preencha o campo '${campo.nome}'.`);
                campo.input.focus();
                return false;
            }
        }

        if (temperaturaMedidaInput && !temperaturaMedidaInput.disabled) {
            const tempStatusMarcado = Array.from(temperaturaStatusCheckboxes).some(cb => cb.checked);
            if (!tempStatusMarcado && !temperaturaMedidaInput.value.trim()) {
                alert("Por favor, preencha o campo 'Temperatura' ou marque 'N/A' ou 'N/M'.");
                temperaturaMedidaInput.focus();
                return false;
            }
        }

        const dadosSalvosParaEsteItem = dadosColetadosInspecao[indiceEquipamentoAtual];
        const fotoJaSalva = dadosSalvosParaEsteItem && dadosSalvosParaEsteItem.foto_equipamento_previewDataUrl;

        if (!fotoJaSalva && (!fotoEquipamentoInput || !fotoEquipamentoInput.files || fotoEquipamentoInput.files.length === 0)) {
            alert("Por favor, adicione uma foto do equipamento.");
            if (fotoEquipamentoInput) fotoEquipamentoInput.focus();
            return false;
        }
        return true;
    }

    function coletarDadosDoFormulario() {
        if (!inspecaoForm || indiceEquipamentoAtual < 0 || indiceEquipamentoAtual >= listaDeEquipamentos.length || !listaDeEquipamentos[indiceEquipamentoAtual]) return null;


        const equipamentoAtual = listaDeEquipamentos[indiceEquipamentoAtual];
        const dados = {
            id_equipamento_db: equipamentoAtual.id_equipamento_db || equipamentoAtual.tag_motor,
            tag_motor: equipamentoAtual.tag_motor,
            setor_principal: equipamentoAtual.setor_principal,
            subsetor_nivel1: equipamentoAtual.subsetor_nivel1,
            subsetor_nivel2: equipamentoAtual.subsetor_nivel2,
            nome_componente: equipamentoAtual.nome_componente,
            potencia_CV_nominal: equipamentoAtual.potencia_CV_nominal,
            corrente_a_nominal: equipamentoAtual.corrente_a_nominal,
            tensao_v_nominal: equipamentoAtual.tensao_v_nominal,
        };

        const formData = new FormData(inspecaoForm);

        for (let [key, value] of formData.entries()) {
            const inputElement = inspecaoForm.elements[key];

            if (key.endsWith('_status')) {
                const checkedStatusCheckbox = document.querySelector(`input[name="${key}"]:checked`);
                if (checkedStatusCheckbox) {
                    dados[key] = checkedStatusCheckbox.value;
                    const inputName = key.replace('_status', '');
                    dados[inputName] = '';
                } else {
                    dados[key] = null;
                }
            } else if (key === 'foto_equipamento') {
                if (value instanceof File && value.name) {
                    dados[key] = value;
                    if (previewFotoElement && previewFotoElement.src.startsWith('data:image')) {
                        dados[`${key}_previewDataUrl`] = previewFotoElement.src;
                    }
                } else {
                    const dadosAnteriores = dadosColetadosInspecao[indiceEquipamentoAtual];
                    if (dadosAnteriores && dadosAnteriores.foto_equipamento_previewDataUrl) {
                        dados[`${key}_previewDataUrl`] = dadosAnteriores.foto_equipamento_previewDataUrl;
                    } else {
                        dados[`${key}_previewDataUrl`] = null;
                    }
                }
            } else {
                if (inputElement && !inputElement.disabled) {
                    dados[key] = value;
                } else if (inputElement && inputElement.disabled && !dados.hasOwnProperty(key)) {
                    dados[key] = '';
                } else if (!inputElement && !dados.hasOwnProperty(key)) {
                    dados[key] = value;
                }
            }
        }
        return dados;
    }

    function handleProximoEquipamento() {
        if (indiceEquipamentoAtual < 0 || indiceEquipamentoAtual >= listaDeEquipamentos.length) {
            console.warn("Índice de equipamento atual inválido para validação/coleta.");
            // Poderia tentar reajustar o índice ou apenas retornar
            exibirEquipamentoAtual(); // Tenta re-sincronizar a UI
            return;
        }

        if (!validarCamposObrigatorios()) {
            return;
        }
        const dadosAtuais = coletarDadosDoFormulario();
        if (dadosAtuais) {
            dadosColetadosInspecao[indiceEquipamentoAtual] = dadosAtuais;
        }

        if (indiceEquipamentoAtual < listaDeEquipamentos.length - 1) {
            indiceEquipamentoAtual++;
            exibirEquipamentoAtual();
        } else {
            indiceEquipamentoAtual = listaDeEquipamentos.length;
            exibirEquipamentoAtual();
            alert("Você revisou todos os equipamentos. Clique em 'Finalizar Inspeção' para concluir.");
            if (proximoEquipamentoBtn) proximoEquipamentoBtn.disabled = true;
            if (finalizarInspecaoBtn) finalizarInspecaoBtn.focus();
        }
    }

    function handleAnteriorEquipamento() {
        if (indiceEquipamentoAtual > 0) {
            indiceEquipamentoAtual--;
            exibirEquipamentoAtual();
        }
    }

    function handleFinalizarInspecao() {
        if (equipamentoInfoWrapper && equipamentoInfoWrapper.style.display !== 'none' &&
            listaDeEquipamentos.length > 0 &&
            indiceEquipamentoAtual >= 0 && indiceEquipamentoAtual < listaDeEquipamentos.length && // Índice válido
            listaDeEquipamentos[indiceEquipamentoAtual]) {

            if (!dadosColetadosInspecao[indiceEquipamentoAtual] || confirm("Salvar alterações no item atual antes de finalizar?")) {
                if (validarCamposObrigatorios()) {
                    const dadosUltimoForm = coletarDadosDoFormulario();
                    if (dadosUltimoForm) {
                        dadosColetadosInspecao[indiceEquipamentoAtual] = dadosUltimoForm;
                    }
                } else {
                    alert("Preencha os campos obrigatórios do equipamento atual antes de finalizar.");
                    return;
                }
            }
        }

        const inspecoesValidas = dadosColetadosInspecao.filter(d => d !== null && typeof d === 'object');
        if (inspecoesValidas.length === 0) {
            alert("Nenhuma inspeção foi realizada ou salva para ser finalizada.");
            return;
        }

        alert(`Inspeção do setor finalizada com ${inspecoesValidas.length} equipamento(s) inspecionado(s)!`);
        console.log("Dados finais coletados para o relatório:", inspecoesValidas);
    }

    function handlePreviewFoto(event) {
        if (!previewFotoElement) return;
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                previewFotoElement.src = e.target.result;
                previewFotoElement.style.display = 'block';
            }
            reader.readAsDataURL(file);
        } else {
            previewFotoElement.style.display = 'none';
            previewFotoElement.src = "#";
        }
    }

    // ESTA FUNÇÃO (attachEventListeners) PRECISA SER DEFINIDA ANTES DE initChecklis
function attachEventListeners() {
    // Listeners para os botões principais (estes permanecem como estavam)
    if (voltarDashboardBtn) {
        voltarDashboardBtn.addEventListener('click', () => {
            const inspecoesRealizadas = dadosColetadosInspecao.filter(d => d !== null).length > 0;
            if (inspecoesRealizadas && !confirm("Você tem dados de inspeção não finalizados. Deseja realmente voltar e perder esses dados?")) {
                return;
            }
            window.location.href = 'dashboard.html';
        });
    }
    if (proximoEquipamentoBtn) {
        proximoEquipamentoBtn.addEventListener('click', handleProximoEquipamento);
    }
    if (anteriorEquipamentoBtn) {
        anteriorEquipamentoBtn.addEventListener('click', handleAnteriorEquipamento);
    }
    if (finalizarInspecaoBtn) {
        finalizarInspecaoBtn.addEventListener('click', handleFinalizarInspecao);
    }
    if (fotoEquipamentoInput) {
        fotoEquipamentoInput.addEventListener('change', handlePreviewFoto);
    }

    // --- CORREÇÃO APLICADA AQUI ---
    // Anexar o event listener a TODOS os checkboxes de status
    const todosOsStatusCheckboxes = document.querySelectorAll('input.status_checkbox'); // Seleciona todos os inputs com a classe 'status_checkbox'

    if (todosOsStatusCheckboxes.length > 0) {
        todosOsStatusCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', handleStatusCheckboxChange);
        });
        console.log(`[DEBUG] attachEventListeners: Listener 'change' anexado a ${todosOsStatusCheckboxes.length} checkboxes de status.`);
    } else {
        console.warn("[DEBUG] attachEventListeners: Nenhum checkbox com a classe 'status_checkbox' encontrado.");
    }
    // --- FIM DA CORREÇÃO ---
}
    // ESTA É A FUNÇÃO PRINCIPAL DE INICIALIZAÇÃO
    // ELA CHAMA fetchEquipamentosDoSetor e attachEventListeners
    // AMBAS DEVEM ESTAR DEFINIDAS ACIMA
    function initChecklist() {
        console.log("[DEBUG] checklist.js - initChecklist() chamada");
        const usuarioLogado = localStorage.getItem('usuarioLogado');
        const cadastroLogado = localStorage.getItem('cadastroLogado');

        if (usuarioLogado && cadastroLogado) {
            if (checklistUserInfo) checklistUserInfo.textContent = `Usuário: ${usuarioLogado} (Cad: ${cadastroLogado})`;
        } else {
            alert("Sessão inválida. Por favor, faça login novamente.");
            window.location.href = 'index.html';
            return;
        }

        const setorSelecionado = sessionStorage.getItem('setorSelecionado');
        if (setorSelecionado) {
            if (setorAtualTitulo) setorAtualTitulo.textContent = setorSelecionado.toUpperCase();
            fetchEquipamentosDoSetor(setorSelecionado); // CHAMADA AQUI
        } else {
            console.error("Nenhum setor selecionado.");
            if (noEquipmentsMessage) {
                noEquipmentsMessage.textContent = "Nenhum setor foi selecionado. Por favor, volte ao dashboard e selecione um setor.";
                noEquipmentsMessage.style.display = 'block';
            }
            if (equipamentoInfoWrapper) equipamentoInfoWrapper.style.display = 'none';
            if (proximoEquipamentoBtn) proximoEquipamentoBtn.disabled = true;
            if (anteriorEquipamentoBtn) anteriorEquipamentoBtn.disabled = true;
            if (finalizarInspecaoBtn) finalizarInspecaoBtn.disabled = true;
        }
        attachEventListeners();
    }

    // --- INICIAR APLICAÇÃO ---
    // AQUI É ONDE initChecklist() É CHAMADA. TODAS AS FUNÇÕES QUE ELA USA (DIRETA OU INDIRETAMENTE)
    // DEVEM TER SIDO DEFINIDAS ANTES DESTE PONTO.
    initChecklist();

    console.log("[DEBUG] checklist.js: DOMContentLoaded - FIM");
});
console.log("[DEBUG] Checklist.js: ARQUIVO FINALIZADO PELO NAVEGADOR");