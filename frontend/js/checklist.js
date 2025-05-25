// frontend/js/checklist.js
document.addEventListener('DOMContentLoaded', function () {
    // Seletores de Elementos do DOM
    const checklistUserInfo = document.getElementById('checklistUserInfo');
    const setorAtualTitulo = document.getElementById('setorAtualTitulo');
    const equipamentoTagElement = document.getElementById('equipamentoTag');
    const equipamentoAtualIndexElement = document.getElementById('equipamentoAtualIndex');
    const totalEquipamentosElement = document.getElementById('totalEquipamentos');
    const nominaisContainer = document.getElementById('nominaisContainer');
    const inspecaoForm = document.getElementById('inspecaoForm');

    // Inputs do formulário para fácil acesso e validação
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
    const temperaturaMedidaInput = document.getElementById('temperatura_medida');
    const ruidoRolDSelect = document.getElementById('ruido_rol_d');
    const ruidoRolTSelect = document.getElementById('ruido_rol_t');
    const fotoEquipamentoInput = document.getElementById('foto_equipamento'); // ESSENCIAL
    const previewFotoElement = document.getElementById('preview_foto');     // ESSENCIAL
    const observacaoTextarea = document.getElementById('observacao');

    // Checkboxes de status para temperatura (exemplo)
    const temperaturaStatusCheckboxes = document.querySelectorAll('input[name="temperatura_medida_status"]');

    const loadingMessage = document.getElementById('loadingMessage');
    const noEquipmentsMessage = document.getElementById('noEquipmentsMessage');
    const equipamentoInfoWrapper = document.querySelector('.equipamento-info-wrapper');

    const voltarDashboardBtn = document.getElementById('voltarDashboardBtn');
    const proximoEquipamentoBtn = document.getElementById('proximoEquipamentoBtn');
    const anteriorEquipamentoBtn = document.getElementById('anteriorEquipamentoBtn');
    const finalizarInspecaoBtn = document.getElementById('finalizarInspecaoBtn');

    // Estado da Aplicação
    let listaDeEquipamentos = [];
    let indiceEquipamentoAtual = 0;
    let dadosColetadosInspecao = [];

    // --- INICIALIZAÇÃO ---
    function initChecklist() {
        console.log("Checklist.js - initChecklist() chamada");
        const usuarioLogado = localStorage.getItem('usuarioLogado');
        const cadastroLogado = localStorage.getItem('cadastroLogado');
        if (usuarioLogado && cadastroLogado) {
            if (checklistUserInfo) checklistUserInfo.textContent = `Usuário: ${usuarioLogado} (Cad: ${cadastroLogado})`;
        } else {
            window.location.href = 'index.html'; return;
        }
        const setorSelecionado = sessionStorage.getItem('setorSelecionado');
        if (setorSelecionado) {
            if (setorAtualTitulo) setorAtualTitulo.textContent = setorSelecionado.toUpperCase();
            fetchEquipamentosDoSetor(setorSelecionado);
        } else {
            console.error("Nenhum setor selecionado.");
            if (noEquipmentsMessage) noEquipmentsMessage.textContent = "Nenhum setor foi selecionado. Por favor, volte ao dashboard.";
            if (noEquipmentsMessage) noEquipmentsMessage.style.display = 'block';
            if (equipamentoInfoWrapper) equipamentoInfoWrapper.style.display = 'none';
        }
        attachEventListeners();
    }

    function attachEventListeners() {
        console.log("Checklist.js - attachEventListeners() chamada");
        if (voltarDashboardBtn) voltarDashboardBtn.addEventListener('click', () => window.location.href = 'dashboard.html');
        if (proximoEquipamentoBtn) proximoEquipamentoBtn.addEventListener('click', handleProximoEquipamento);
        if (anteriorEquipamentoBtn) anteriorEquipamentoBtn.addEventListener('click', handleAnteriorEquipamento);
        if (finalizarInspecaoBtn) finalizarInspecaoBtn.addEventListener('click', handleFinalizarInspecao);

        console.log("Verificando fotoEquipamentoInput em attachEventListeners:", fotoEquipamentoInput); // DEBUG
        if (fotoEquipamentoInput && previewFotoElement) { // Verificação se ambos existem
            fotoEquipamentoInput.addEventListener('change', handlePreviewFoto);
        } else {
            if (!fotoEquipamentoInput) console.error("Elemento fotoEquipamentoInput NÃO encontrado em attachEventListeners!");
            if (!previewFotoElement) console.error("Elemento previewFotoElement NÃO encontrado em attachEventListeners!");
        }

        temperaturaStatusCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', handleStatusCheckboxChange);
        });
    }

    function handleStatusCheckboxChange(event) {
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
            targetInput.disabled = false;
        }
    }

    async function fetchEquipamentosDoSetor(setor) {
        if (loadingMessage) loadingMessage.style.display = 'block';
        if (equipamentoInfoWrapper) equipamentoInfoWrapper.style.display = 'none';
        if (noEquipmentsMessage) noEquipmentsMessage.style.display = 'none';
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/setores/${setor}/equipamentos`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Erro desconhecido." }));
                throw new Error(`Falha: ${response.status} - ${errorData.error || response.statusText}`);
            }
            listaDeEquipamentos = await response.json();
            if (loadingMessage) loadingMessage.style.display = 'none';
            if (listaDeEquipamentos && listaDeEquipamentos.length > 0) {
                indiceEquipamentoAtual = 0;
                dadosColetadosInspecao = new Array(listaDeEquipamentos.length).fill(null);
                exibirEquipamentoAtual();
                if (equipamentoInfoWrapper) equipamentoInfoWrapper.style.display = 'block';
            } else {
                if (noEquipmentsMessage) noEquipmentsMessage.textContent = `Nenhum equipamento encontrado para o setor '${setor}'.`;
                if (noEquipmentsMessage) noEquipmentsMessage.style.display = 'block';
            }
        } catch (error) {
            console.error("Erro ao buscar equipamentos:", error);
            if (loadingMessage) loadingMessage.style.display = 'none';
            if (noEquipmentsMessage) noEquipmentsMessage.textContent = `Erro: ${error.message}. Verifique servidor/conexão.`;
            if (noEquipmentsMessage) noEquipmentsMessage.style.display = 'block';
        }
    }

    function limparFormularioInspecao() {
        if (inspecaoForm) inspecaoForm.reset();
        if (previewFotoElement) {
            previewFotoElement.style.display = 'none';
            previewFotoElement.src = "#";
        }
        if (temperaturaMedidaInput) temperaturaMedidaInput.disabled = false;
    }

    function preencherFormularioComDadosSalvos(dadosSalvos) {
        if (!inspecaoForm || !dadosSalvos) return;
        for (const key in dadosSalvos) {
            if (dadosSalvos.hasOwnProperty(key)) {
                if (key === 'foto_equipamento_previewDataUrl') {
                    console.log("[DEBUG] preencherFormulario: Encontrada chave foto_equipamento_previewDataUrl.");
                    console.log("[DEBUG] preencherFormulario: Valor do DataURL:", dadosSalvos[key] ? String(dadosSalvos[key]).substring(0, 60) + "..." : "Nenhum DataURL");
                    if (dadosSalvos[key] && previewFotoElement) { // Adicionada verificação para previewFotoElement
                        previewFotoElement.src = dadosSalvos[key];
                        previewFotoElement.style.display = 'block';
                        console.log("[DEBUG] preencherFormulario: Preview src DEFINIDO e display setado para 'block'.");
                    } else if (previewFotoElement) {
                        previewFotoElement.style.display = 'none';
                        console.log("[DEBUG] preencherFormulario: DataURL NULO ou previewFotoElement não encontrado, preview display setado para 'none'.");
                    }
                    continue;
                }
                if (key.endsWith('_status') && dadosSalvos[key]) {
                    const targetInputId = key.replace('_status', '');
                    const targetInput = document.getElementById(targetInputId);
                    document.querySelectorAll(`input.status_checkbox[name="${key}"][data-target-input="${targetInputId}"]`).forEach(cb => {
                        if (cb.value === dadosSalvos[key]) {
                            cb.checked = true;
                            if (targetInput) targetInput.disabled = true;
                        } else {
                            cb.checked = false;
                        }
                    });
                    if (targetInput && dadosSalvos[key]) targetInput.value = '';
                    continue;
                }
                const element = inspecaoForm.elements[key];
                if (element) {
                    if (element.type === 'file') { }
                    else if (element.type === 'checkbox' || element.type === 'radio') {
                        if (element.length && (element instanceof NodeList || Array.isArray(element))) {
                            element.forEach(radio => { if (radio.value === dadosSalvos[key]) radio.checked = true; });
                        } else { element.checked = dadosSalvos[key]; }
                    } else if (element.name) { element.value = dadosSalvos[key]; }
                }
            }
        }
    }

    function exibirEquipamentoAtual() {
        limparFormularioInspecao();
        if (listaDeEquipamentos.length === 0) { /* ... */ return; }
        if (indiceEquipamentoAtual >= listaDeEquipamentos.length) { /* ... */ return; }
        const equipamento = listaDeEquipamentos[indiceEquipamentoAtual];
        if (equipamentoTagElement) equipamentoTagElement.textContent = equipamento.tag_motor || "TAG Indisponível";
        if (equipamentoAtualIndexElement) equipamentoAtualIndexElement.textContent = indiceEquipamentoAtual + 1;
        if (totalEquipamentosElement) totalEquipamentosElement.textContent = listaDeEquipamentos.length;
        if (nominaisContainer) {
            const spansNominais = nominaisContainer.querySelectorAll('span[data-nominal]');
            spansNominais.forEach(span => {
                const key = span.dataset.nominal;
                span.textContent = equipamento[key] !== null && equipamento[key] !== undefined ? equipamento[key] : '-';
            });
        }
        if (dadosColetadosInspecao[indiceEquipamentoAtual]) {
            console.log("exibirEquipamentoAtual: Encontrados dados salvos para o índice", indiceEquipamentoAtual, dadosColetadosInspecao[indiceEquipamentoAtual]);
            preencherFormularioComDadosSalvos(dadosColetadosInspecao[indiceEquipamentoAtual]);
        }
        if (equipamentoInfoWrapper) equipamentoInfoWrapper.style.display = 'block';
        if (noEquipmentsMessage) noEquipmentsMessage.style.display = 'none';
        atualizarBotoesNavegacao();
        console.log("Exibindo equipamento:", equipamento.tag_motor);
    }

    function atualizarBotoesNavegacao() {
        if (!anteriorEquipamentoBtn || !proximoEquipamentoBtn || !finalizarInspecaoBtn) return;
        anteriorEquipamentoBtn.disabled = (indiceEquipamentoAtual === 0);
        proximoEquipamentoBtn.style.display = 'inline-block';
        finalizarInspecaoBtn.style.display = 'none';
        if (indiceEquipamentoAtual === listaDeEquipamentos.length - 1) {
            proximoEquipamentoBtn.textContent = "Concluir Último Equipamento";
            finalizarInspecaoBtn.style.display = 'inline-block';
        } else {
            proximoEquipamentoBtn.textContent = "Próximo Equipamento";
        }
        if (indiceEquipamentoAtual >= listaDeEquipamentos.length) {
            proximoEquipamentoBtn.style.display = 'none';
        }
    }

    function validarCamposObrigatorios() {
        const camposParaValidar = [
            { input: marcaMedidaInput, nome: "Marca" }, { input: modeloMedidoInput, nome: "Modelo" },
            { input: potenciaMedidaInput, nome: "Potência Medida (kW)" }, { input: rotacaoMedidaInput, nome: "Rotação Medida (RPM)" },
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
            if (!campo.input.value.trim()) {
                alert(`Por favor, preencha o campo '${campo.nome}'.`);
                campo.input.focus();
                return false;
            }
        }
        const tempStatusMarcado = Array.from(temperaturaStatusCheckboxes).some(cb => cb.checked);
        if (!tempStatusMarcado && (!temperaturaMedidaInput || !temperaturaMedidaInput.value.trim())) {
            alert("Por favor, preencha o campo 'Temperatura' ou marque 'N/A' ou 'N/M'.");
            if (temperaturaMedidaInput) temperaturaMedidaInput.focus();
            return false;
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
        if (!inspecaoForm || !listaDeEquipamentos[indiceEquipamentoAtual]) return null;
        const equipamentoAtual = listaDeEquipamentos[indiceEquipamentoAtual];
        const dados = {
            id_equipamento_db: equipamentoAtual.id, tag_motor: equipamentoAtual.tag_motor,
            setor_principal: equipamentoAtual.setor_principal, subsetor_nivel1: equipamentoAtual.subsetor_nivel1,
            subsetor_nivel2: equipamentoAtual.subsetor_nivel2, nome_componente: equipamentoAtual.nome_componente,
            potencia_kw_nominal: equipamentoAtual.potencia_kw_nominal, corrente_a_nominal: equipamentoAtual.corrente_a_nominal,
            tensao_v_nominal: equipamentoAtual.tensao_v_nominal,
        };
        const formData = new FormData(inspecaoForm);
        for (let [key, value] of formData.entries()) {
            if (key.endsWith('_status')) {
                const inputName = key.replace('_status', '');
                const checkedStatusCheckbox = document.querySelector(`input[name="${key}"]:checked`);
                if (checkedStatusCheckbox) {
                    dados[key] = checkedStatusCheckbox.value;
                    dados[inputName] = '';
                } else {
                    dados[key] = null;
                }
                // O valor do input principal será pego abaixo se não houver status marcado para ele
                // e o input não estiver desabilitado.
                if (inspecaoForm.elements[inputName] && inspecaoForm.elements[inputName].disabled) {
                    // Se está desabilitado, o valor já foi tratado pelo status, não pegar do formData.
                } else if (inspecaoForm.elements[inputName]) { // Se não está desabilitado
                    dados[inputName] = formData.get(inputName); // Pega o valor atual do input
                }
                // Não 'continue' aqui, pois queremos que os inputs normais sejam processados depois
            } else if (key === 'foto_equipamento' && value instanceof File && value.name) {
                dados[key] = value;
                if (previewFotoElement) dados[`${key}_previewDataUrl`] = previewFotoElement.src;
                console.log("coletarDados: Salvando foto_equipamento_previewDataUrl:", previewFotoElement && previewFotoElement.src ? previewFotoElement.src.substring(0, 60) + "..." : "Preview src vazio");
            } else if (key !== 'foto_equipamento') {
                // Apenas adiciona se não for um campo de status já tratado e não for a foto principal
                if (!key.endsWith('_status')) {
                    dados[key] = value;
                }
            } else if (!dadosColetadosInspecao[indiceEquipamentoAtual] || !dadosColetadosInspecao[indiceEquipamentoAtual].foto_equipamento_previewDataUrl) {
                dados[key] = null;
            }
        }
        if (dadosColetadosInspecao[indiceEquipamentoAtual] && dadosColetadosInspecao[indiceEquipamentoAtual].foto_equipamento_previewDataUrl && !dados.foto_equipamento) {
            dados.foto_equipamento_previewDataUrl = dadosColetadosInspecao[indiceEquipamentoAtual].foto_equipamento_previewDataUrl;
        }
        return dados;
    }

    function handleProximoEquipamento() {
        if (!validarCamposObrigatorios()) { return; }
        const dadosAtuais = coletarDadosDoFormulario();
        if (dadosAtuais) {
            dadosColetadosInspecao[indiceEquipamentoAtual] = dadosAtuais;
            console.log("Dados coletados para", dadosAtuais.tag_motor, ":", dadosAtuais);
        }
        if (indiceEquipamentoAtual < listaDeEquipamentos.length - 1) {
            indiceEquipamentoAtual++;
            exibirEquipamentoAtual();
        } else {
            console.log("Chegou ao último equipamento ou passou dele.");
            indiceEquipamentoAtual = listaDeEquipamentos.length;
            exibirEquipamentoAtual();
        }
    }

    function handleAnteriorEquipamento() {
        if (indiceEquipamentoAtual > 0) {
            const dadosFormularioAtual = coletarDadosDoFormulario();
            if (dadosFormularioAtual && validarCamposObrigatoriosParaSalvarAoVoltar(dadosFormularioAtual)) {
                dadosColetadosInspecao[indiceEquipamentoAtual] = dadosFormularioAtual;
                console.log("Dados salvos (ao voltar) para", dadosFormularioAtual.tag_motor);
            }
            indiceEquipamentoAtual--;
            exibirEquipamentoAtual();
        }
    }

    function validarCamposObrigatoriosParaSalvarAoVoltar(dados) {
        return !!(dados && dados.tag_motor); // Adicionada verificação de 'dados'
    }

    function handleFinalizarInspecao() {
        if (equipamentoInfoWrapper && equipamentoInfoWrapper.style.display !== 'none' &&
            listaDeEquipamentos.length > 0 &&
            indiceEquipamentoAtual < listaDeEquipamentos.length &&
            listaDeEquipamentos[indiceEquipamentoAtual]) {
            if (validarCamposObrigatorios()) {
                const dadosUltimoForm = coletarDadosDoFormulario();
                if (dadosUltimoForm) dadosColetadosInspecao[indiceEquipamentoAtual] = dadosUltimoForm;
            } else {
                alert("Preencha os campos obrigatórios do equipamento atual antes de finalizar.");
                return;
            }
        }
        const inspecoesValidas = dadosColetadosInspecao.filter(d => d !== null);
        if (inspecoesValidas.length === 0) {
            alert("Nenhuma inspeção foi realizada para ser finalizada."); return;
        }
        alert("Inspeção do setor finalizada! Próximo passo: enviar dados para gerar relatório.");
        console.log("Dados finais coletados para o relatório:", inspecoesValidas);
    }

    function handlePreviewFoto(event) {
        if (!previewFotoElement) return; // Proteção
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

    // --- INICIAR APLICAÇÃO ---
    initChecklist();
});