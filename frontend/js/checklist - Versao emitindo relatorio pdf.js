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
    let listaDeEquipamentos = []; // Será populada por fetchEquipamentosDoSetor
    let indiceEquipamentoAtual = 0;
    let dadosColetadosInspecao = [];

    function parseEquipamentosFromNestedJson(jsonData, setorPrincipalChaveNoJson) {
        const equipamentosExtraidos = [];
        if (!jsonData || !jsonData[setorPrincipalChaveNoJson]) {
            console.warn(`[PARSE] Chave principal do setor '${setorPrincipalChaveNoJson}' não encontrada no JSON.`);
            return equipamentosExtraidos;
        }
        const dadosDoSetor = jsonData[setorPrincipalChaveNoJson];
        for (const subsetorNivel1Nome in dadosDoSetor) {
            if (dadosDoSetor.hasOwnProperty(subsetorNivel1Nome)) {
                const subsetorNivel1Conteudo = dadosDoSetor[subsetorNivel1Nome];
                for (const subsetorNivel2Nome in subsetorNivel1Conteudo) {
                    if (subsetorNivel1Conteudo.hasOwnProperty(subsetorNivel2Nome)) {
                        const subsetorNivel2Conteudo = subsetorNivel1Conteudo[subsetorNivel2Nome];
                        for (const nomeComponenteOuGrupo in subsetorNivel2Conteudo) {
                            if (subsetorNivel2Conteudo.hasOwnProperty(nomeComponenteOuGrupo)) {
                                const itemComponente = subsetorNivel2Conteudo[nomeComponenteOuGrupo];
                                if (Array.isArray(itemComponente)) {
                                    itemComponente.forEach((motorDoArray, index) => {
                                        if (typeof motorDoArray === 'object' && motorDoArray !== null && motorDoArray.tag_motor) {
                                            equipamentosExtraidos.push({
                                                ...motorDoArray,
                                                id_equipamento_db: motorDoArray.tag_motor + '_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
                                                setor_principal: setorPrincipalChaveNoJson.toUpperCase(),
                                                subsetor_nivel1: subsetorNivel1Nome,
                                                subsetor_nivel2: subsetorNivel2Nome,
                                                nome_componente: `${nomeComponenteOuGrupo}_item_${index + 1}`
                                            });
                                        } else {
                                            console.warn(`[PARSE] Item inválido no array '${nomeComponenteOuGrupo}':`, motorDoArray);
                                        }
                                    });
                                } else if (typeof itemComponente === 'object' && itemComponente !== null && itemComponente.tag_motor) {
                                    equipamentosExtraidos.push({
                                        ...itemComponente,
                                        id_equipamento_db: itemComponente.tag_motor + '_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
                                        setor_principal: setorPrincipalChaveNoJson.toUpperCase(),
                                        subsetor_nivel1: subsetorNivel1Nome,
                                        subsetor_nivel2: subsetorNivel2Nome,
                                        nome_componente: nomeComponenteOuGrupo
                                    });
                                } else {
                                    console.warn(`[PARSE] Item não processado ou sem tag_motor em '${nomeComponenteOuGrupo}':`, itemComponente);
                                }
                            }
                        }
                    }
                }
            }
        }
        console.log(`[PARSE] Equipamentos extraídos do JSON:`, equipamentosExtraidos);
        return equipamentosExtraidos;
    }

    async function fetchEquipamentosDoSetor(setorSelecionadoInterface) {
        console.log(`[DEBUG] fetchEquipamentosDoSetor: Buscando para o setor da interface: ${setorSelecionadoInterface}`);
        let equipamentosCarregados = [];
        const setorEmMinusculas = setorSelecionadoInterface.toLowerCase();
        const nomeArquivoJson = `data_source/equipamentos${setorEmMinusculas}.json`;
        const chavePrincipalJson = setorEmMinusculas;
        console.log(`[DEBUG] Tentando carregar o arquivo: ${nomeArquivoJson} e usar a chave principal: ${chavePrincipalJson}`);
        try {
            const response = await fetch(nomeArquivoJson);
            if (!response.ok) {
                throw new Error(`Erro ao carregar ${nomeArquivoJson}: ${response.status} ${response.statusText}`);
            }
            const jsonData = await response.json();
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
            equipamentosCarregados = [];
        }
        listaDeEquipamentos = equipamentosCarregados; // Atualiza a variável global
        indiceEquipamentoAtual = 0;
        dadosColetadosInspecao = new Array(listaDeEquipamentos.length).fill(null);
        if (listaDeEquipamentos.length > 0) {
            if (noEquipmentsMessage) noEquipmentsMessage.style.display = 'none';
            if (equipamentoInfoWrapper) equipamentoInfoWrapper.style.display = 'block';
            exibirEquipamentoAtual();
        } else {
            if (equipamentoInfoWrapper) equipamentoInfoWrapper.style.display = 'none';
            if (proximoEquipamentoBtn) proximoEquipamentoBtn.disabled = true;
            if (anteriorEquipamentoBtn) anteriorEquipamentoBtn.disabled = true;
            if (finalizarInspecaoBtn) finalizarInspecaoBtn.disabled = true;
            if (noEquipmentsMessage && noEquipmentsMessage.style.display === 'none' && equipamentosCarregados.length === 0) {
                noEquipmentsMessage.textContent = `Nenhum equipamento encontrado para o setor "${setorSelecionadoInterface}" no arquivo ${nomeArquivoJson}.`;
                noEquipmentsMessage.style.display = 'block';
            }
        }
        if (totalEquipamentosElement) totalEquipamentosElement.textContent = listaDeEquipamentos.length;
    }

    function handleStatusCheckboxChange(event) {
        const changedCheckbox = event.target;
        const targetInputId = changedCheckbox.dataset.targetInput;
        const targetInput = document.getElementById(targetInputId);
        if (!targetInput) {
            console.warn(`[StatusCheckbox] Input alvo não encontrado para ID: ${targetInputId}`);
            return;
        }
        const tooltipSpan = document.getElementById(`tooltip_${changedCheckbox.name}`);
        document.querySelectorAll(`input.status_checkbox[name="${changedCheckbox.name}"][data-target-input="${targetInputId}"]`).forEach(cb => {
            if (cb !== changedCheckbox) cb.checked = false;
        });
        if (changedCheckbox.checked) {
            if (tooltipSpan) {
                if (changedCheckbox.value === "NA") tooltipSpan.textContent = "N/A: Não se aplica a este equipamento.";
                else if (changedCheckbox.value === "NM") tooltipSpan.textContent = "N/M: Não medido (ex: falta de ferramenta/condição).";
                tooltipSpan.style.display = 'inline-block';
            } else {
                console.warn(`[Tooltip] Span de tooltip não encontrado para o grupo de status: '${changedCheckbox.name}'. Esperava um elemento com ID: 'tooltip_${changedCheckbox.name}'`);
            }
            targetInput.value = '';
            targetInput.disabled = true;
            if (targetInput.tagName === 'SELECT') targetInput.selectedIndex = 0;
        } else {
            if (tooltipSpan) {
                tooltipSpan.style.display = 'none';
                tooltipSpan.textContent = '';
            }
            const anyStatusCheckedForThisInput = Array.from(
                document.querySelectorAll(`input.status_checkbox[name="${changedCheckbox.name}"][data-target-input="${targetInputId}"]`)
            ).some(cb => cb.checked);
            if (!anyStatusCheckedForThisInput) targetInput.disabled = false;
        }
    }

    function limparFormularioInspecao() {
        if (inspecaoForm) inspecaoForm.reset();
        if (previewFotoElement) {
            previewFotoElement.style.display = 'none';
            previewFotoElement.src = "#";
        }
        document.querySelectorAll('input[type="text"][id], input[type="number"][id], select[id]').forEach(inputElement => {
            const hasStatusCheckboxes = document.querySelector(`.status_checkbox[data-target-input="${inputElement.id}"]`);
            if (hasStatusCheckboxes) inputElement.disabled = false;
        });
        document.querySelectorAll('input.status_checkbox').forEach(cb => cb.checked = false);
        document.querySelectorAll('.status-tooltip').forEach(tooltip => {
            tooltip.style.display = 'none';
            tooltip.textContent = '';
        });
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
                        if (!element.disabled) element.value = dadosSalvos[key];
                    }
                }
            }
        }
    }

    function exibirEquipamentoAtual() {
        // console.log(`%c[DEBUG] exibirEquipamentoAtual: INÍCIO - Índice Atual: ${indiceEquipamentoAtual}, Total Equipamentos: ${listaDeEquipamentos.length}`, "color:dodgerblue;");
        limparFormularioInspecao();

        if (equipamentoInfoWrapper) equipamentoInfoWrapper.style.display = 'block';
        if (noEquipmentsMessage) noEquipmentsMessage.style.display = 'none';

        if (listaDeEquipamentos.length === 0) {
            // console.log("[DEBUG] exibirEquipamentoAtual: Lista de equipamentos VAZIA.");
            if (equipamentoInfoWrapper) equipamentoInfoWrapper.style.display = 'none';
            if (noEquipmentsMessage) {
                noEquipmentsMessage.textContent = "Nenhum equipamento para exibir neste setor.";
                noEquipmentsMessage.style.display = 'block';
            }
            if (equipamentoTagElement) equipamentoTagElement.textContent = "N/A";
            if (equipamentoAtualIndexElement) equipamentoAtualIndexElement.textContent = "0";
            if (totalEquipamentosElement) totalEquipamentosElement.textContent = "0";
            if (proximoEquipamentoBtn) proximoEquipamentoBtn.disabled = true;
            if (anteriorEquipamentoBtn) anteriorEquipamentoBtn.disabled = true;
            if (finalizarInspecaoBtn) {
                finalizarInspecaoBtn.style.display = 'none';
                finalizarInspecaoBtn.disabled = true;
            }
            const btnGerarPDFInicial = document.getElementById('btnGerarRelatorioPDF');
            if (btnGerarPDFInicial) btnGerarPDFInicial.style.display = 'none';
            // console.log("[DEBUG] exibirEquipamentoAtual: FIM (lista vazia).");
            return;
        }

        if (indiceEquipamentoAtual < listaDeEquipamentos.length) {
            // console.log(`[DEBUG] exibirEquipamentoAtual: Exibindo equipamento no índice ${indiceEquipamentoAtual}.`);
            const equipamento = listaDeEquipamentos[indiceEquipamentoAtual];
            if (!equipamento) {
                console.error("Equipamento não encontrado no índice:", indiceEquipamentoAtual);
                if (equipamentoInfoWrapper) equipamentoInfoWrapper.style.display = 'none';
                if (noEquipmentsMessage) {
                    noEquipmentsMessage.textContent = "Erro: Equipamento não encontrado.";
                    noEquipmentsMessage.style.display = 'block';
                }
                // console.log("[DEBUG] exibirEquipamentoAtual: FIM (erro, equipamento não encontrado).");
                return;
            }

            if (equipamentoTagElement) equipamentoTagElement.textContent = equipamento.tag_motor || "TAG Indisponível";
            if (equipamentoAtualIndexElement) equipamentoAtualIndexElement.textContent = indiceEquipamentoAtual + 1;
            if (totalEquipamentosElement) totalEquipamentosElement.textContent = listaDeEquipamentos.length;

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
                if (indiceEquipamentoAtual === listaDeEquipamentos.length - 1) {
                    proximoEquipamentoBtn.textContent = "Revisar/Finalizar Último Item";
                } else {
                    proximoEquipamentoBtn.textContent = "Próximo Equipamento";
                }
            }

            if (finalizarInspecaoBtn) {
                const algumDadoColetado = dadosColetadosInspecao.some(d => d !== null && Object.keys(d).length > 0);
                let ultimoItemSalvo = false;
                if (indiceEquipamentoAtual === listaDeEquipamentos.length - 1 &&
                    dadosColetadosInspecao[indiceEquipamentoAtual] &&
                    Object.keys(dadosColetadosInspecao[indiceEquipamentoAtual]).length > 0) {
                    ultimoItemSalvo = true;
                }
                if (indiceEquipamentoAtual === listaDeEquipamentos.length - 1 || algumDadoColetado) {
                    finalizarInspecaoBtn.style.display = 'inline-block';
                    finalizarInspecaoBtn.disabled = !algumDadoColetado && !(indiceEquipamentoAtual === listaDeEquipamentos.length -1 && ultimoItemSalvo);
                     if (indiceEquipamentoAtual === listaDeEquipamentos.length -1 && !dadosColetadosInspecao[indiceEquipamentoAtual]){
                        finalizarInspecaoBtn.disabled = false;
                    }
                } else {
                    finalizarInspecaoBtn.style.display = 'none';
                    finalizarInspecaoBtn.disabled = true;
                }
            }

            const dadosSalvosParaEsteItem = dadosColetadosInspecao[indiceEquipamentoAtual];
            if (dadosSalvosParaEsteItem) {
                preencherFormularioComDadosSalvos(dadosSalvosParaEsteItem);
            }
            
            const btnGerarPDFDuranteInspecao = document.getElementById('btnGerarRelatorioPDF');
            if (btnGerarPDFDuranteInspecao) {
                btnGerarPDFDuranteInspecao.style.display = 'none';
            }

        } else { 
            console.log("%c[DEBUG] exibirEquipamentoAtual: ENTRANDO NO BLOCO ELSE (inspeção concluída)", "background-color: yellow; color: black; font-weight: bold;");
            if (equipamentoInfoWrapper) {
                console.log("[DEBUG] exibirEquipamentoAtual (ELSE): Escondendo equipamentoInfoWrapper.");
                equipamentoInfoWrapper.style.display = 'none';
            }
            if (noEquipmentsMessage) {
                noEquipmentsMessage.textContent = "Inspeção do setor concluída. Clique em 'Gerar Relatório PDF' para criar o documento.";
                noEquipmentsMessage.style.display = 'block';
                noEquipmentsMessage.style.color = 'inherit'; 
                console.log("[DEBUG] exibirEquipamentoAtual (ELSE): Mensagem de conclusão exibida.");
            } else {
                console.warn("[DEBUG] exibirEquipamentoAtual (ELSE): Elemento noEquipmentsMessage NÃO encontrado.");
            }
            if (proximoEquipamentoBtn) {
                proximoEquipamentoBtn.disabled = true;
                console.log("[DEBUG] exibirEquipamentoAtual (ELSE): Botão Próximo desabilitado.");
            }
            if (anteriorEquipamentoBtn) {
                anteriorEquipamentoBtn.disabled = true;
                console.log("[DEBUG] exibirEquipamentoAtual (ELSE): Botão Anterior desabilitado.");
            }
            if (finalizarInspecaoBtn) {
                finalizarInspecaoBtn.disabled = true;
                finalizarInspecaoBtn.style.display = 'none';
                console.log("[DEBUG] exibirEquipamentoAtual (ELSE): Botão Finalizar Inspeção escondido e desabilitado.");
            }
            const btnGerarPDF = document.getElementById('btnGerarRelatorioPDF');
            const secaoGlobalActions = document.querySelector('.global-actions');
            if (secaoGlobalActions) {
                console.log("[DEBUG] exibirEquipamentoAtual (ELSE): Seção .global-actions ENCONTRADA.");
                console.log("[DEBUG] ... Estilo display ANTES da seção .global-actions:", window.getComputedStyle(secaoGlobalActions).display);
                secaoGlobalActions.style.display = 'block';
                console.log("[DEBUG] ... Estilo display ATRIBUÍDO à seção .global-actions: block");
                console.log("[DEBUG] ... Estilo display COMPUTADO DEPOIS da seção .global-actions:", window.getComputedStyle(secaoGlobalActions).display);
            } else {
                console.error("[CRÍTICO] exibirEquipamentoAtual (ELSE): Seção .global-actions NÃO ENCONTRADA!");
            }
            if (btnGerarPDF) {
                console.log("[DEBUG] exibirEquipamentoAtual (ELSE): Botão btnGerarRelatorioPDF ENCONTRADO.");
                console.log("[DEBUG] ... Estilo display ANTES de modificar (btnGerarPDF):", window.getComputedStyle(btnGerarPDF).display);
                console.log("[DEBUG] ... Atributo style.display ANTES (btnGerarPDF):", btnGerarPDF.style.display);
                btnGerarPDF.style.display = 'inline-block';
                btnGerarPDF.disabled = false;
                console.log("[DEBUG] ... Atributo style.display DEPOIS (btnGerarPDF):", btnGerarPDF.style.display);
                console.log("[DEBUG] ... Estilo display COMPUTADO DEPOIS (btnGerarPDF):", window.getComputedStyle(btnGerarPDF).display);
                console.log("[DEBUG] ... Botão PDF habilitado. Deveria estar visível.");
                if (btnGerarPDF.parentNode) {
                    console.log("[DEBUG] ... ParentNode do botão PDF é:", btnGerarPDF.parentNode.tagName, "com classe:", btnGerarPDF.parentNode.className || "Nenhuma");
                } else {
                     console.warn("[DEBUG] ... Botão PDF não tem ParentNode (estranho).");
                }
            } else {
                console.error("[CRÍTICO] exibirEquipamentoAtual (ELSE): Botão btnGerarRelatorioPDF NÃO ENCONTRADO NO DOM!");
                if (noEquipmentsMessage) {
                    noEquipmentsMessage.textContent += " ERRO CRÍTICO: Botão para gerar PDF não encontrado (ID: btnGerarRelatorioPDF). Contate o suporte.";
                    noEquipmentsMessage.style.color = "red";
                }
            }
            console.log("%c[DEBUG] exibirEquipamentoAtual: FIM DO BLOCO ELSE.", "background-color: yellow; color: black; font-weight: bold;");
        }
    }

    function validarCamposObrigatorios() {
        const camposParaValidar = [
            { input: marcaMedidaInput, nome: "Marca (Placa)" }, { input: modeloMedidoInput, nome: "Modelo (Placa)" },
            { input: document.getElementById('potencia_placa_cv'), nome: "Potência de Placa (CV)" }, { input: rotacaoMedidaInput, nome: "Rotação Medida (RPM)" },
            { input: tensaoF1MedidaInput, nome: "Tensão F1" }, { input: tensaoF2MedidaInput, nome: "Tensão F2" }, { input: tensaoF3MedidaInput, nome: "Tensão F3" },
            { input: correnteF1MedidaInput, nome: "Corrente F1" }, { input: correnteF2MedidaInput, nome: "Corrente F2" }, { input: correnteF3MedidaInput, nome: "Corrente F3" },
            { input: regulagemCorrenteMedidaInput, nome: "Regulagem de Corrente" }, { input: rolamentoDMedidoInput, nome: "Modelo Rolamento Dianteiro" },
            { input: rolamentoTMedidoInput, nome: "Modelo Rolamento Traseiro" }, { input: vibracaoSelect, nome: "Vibração Excessiva" },
            { input: ruidoRolDSelect, nome: "Ruído Rol. Dianteiro" }, { input: ruidoRolTSelect, nome: "Ruído Rol. Traseiro" },
        ];
        for (const campo of camposParaValidar) {
            if (!campo.input) { console.warn(`[Validação] Input para '${campo.nome}' não encontrado no DOM. Pulando validação.`); continue; }
            if (!campo.input.disabled && campo.input.value.trim() === "") { alert(`Por favor, preencha o campo '${campo.nome}' ou marque 'N/A' ou 'N/M' (se aplicável).`); campo.input.focus(); return false; }
        }
        if (temperaturaMedidaInput && !temperaturaMedidaInput.disabled) {
            const tempStatusMarcado = Array.from(temperaturaStatusCheckboxes).some(cb => cb.checked);
            if (!tempStatusMarcado && temperaturaMedidaInput.value.trim() === "") { alert("Por favor, preencha o campo 'Temperatura (°C)' ou marque 'N/A' ou 'N/M'."); temperaturaMedidaInput.focus(); return false; }
        }
        const potenciaMedidaInput = document.getElementById('potencia_medida');
        const potenciaMedidaStatusCheckboxes = document.querySelectorAll('input.status_checkbox[name="potencia_medida_status"]');
        if (potenciaMedidaInput && !potenciaMedidaInput.disabled) {
            const potenciaStatusMarcado = Array.from(potenciaMedidaStatusCheckboxes).some(cb => cb.checked);
            if (!potenciaStatusMarcado && potenciaMedidaInput.value.trim() === "") { alert("Por favor, preencha o campo 'Potência Medida (CV)' ou marque 'N/A' ou 'N/M'."); potenciaMedidaInput.focus(); return false; }
        }
        const dadosSalvosParaEsteItem = dadosColetadosInspecao[indiceEquipamentoAtual];
        const fotoJaSalva = dadosSalvosParaEsteItem && dadosSalvosParaEsteItem.foto_equipamento_previewDataUrl;
        if (!fotoJaSalva && (!fotoEquipamentoInput || !fotoEquipamentoInput.files || fotoEquipamentoInput.files.length === 0)) { alert("Por favor, adicione uma foto do equipamento."); if (fotoEquipamentoInput) fotoEquipamentoInput.focus(); return false; }
        return true;
    }

    function coletarDadosDoFormulario() {
        if (!inspecaoForm || indiceEquipamentoAtual < 0 || indiceEquipamentoAtual >= listaDeEquipamentos.length || !listaDeEquipamentos[indiceEquipamentoAtual]) return null;
        const equipamentoAtual = listaDeEquipamentos[indiceEquipamentoAtual];
        const dados = {
            id_equipamento_db: equipamentoAtual.id_equipamento_db || equipamentoAtual.tag_motor, tag_motor: equipamentoAtual.tag_motor,
            setor_principal: equipamentoAtual.setor_principal, subsetor_nivel1: equipamentoAtual.subsetor_nivel1, subsetor_nivel2: equipamentoAtual.subsetor_nivel2,
            nome_componente: equipamentoAtual.nome_componente, potencia_CV_nominal: equipamentoAtual.potencia_CV_nominal, corrente_a_nominal: equipamentoAtual.corrente_a_nominal,
            tensao_v_nominal: equipamentoAtual.tensao_v_nominal, potencia_kw_nominal: equipamentoAtual.potencia_kw_nominal, rotacao_rpm_nominal: equipamentoAtual.rotacao_rpm_nominal,
            rolamento_d_nominal: equipamentoAtual.rolamento_d_nominal, rolamento_t_nominal: equipamentoAtual.rolamento_t_nominal, carcaca_nominal: equipamentoAtual.carcaca_nominal,
            ip_nominal: equipamentoAtual.ip_nominal, regulagem_corrente_nominal: equipamentoAtual.regulagem_corrente_nominal, // Adicionado para consistência se existir
            marca_nominal: equipamentoAtual.marca_nominal, modelo_nominal: equipamentoAtual.modelo_nominal, // Adicionado para consistência se existir
        };
        const formData = new FormData(inspecaoForm);
        for (let [key, value] of formData.entries()) {
            const inputElement = inspecaoForm.elements[key];
            if (key.endsWith('_status')) {
                const checkedStatusCheckbox = document.querySelector(`input[name="${key}"]:checked`);
                if (checkedStatusCheckbox) { dados[key] = checkedStatusCheckbox.value; const inputName = key.replace('_status', ''); dados[inputName] = ''; } else { dados[key] = null; }
            } else if (key === 'foto_equipamento') {
                if (value instanceof File && value.name) { if (previewFotoElement && previewFotoElement.src.startsWith('data:image')) { dados[`${key}_previewDataUrl`] = previewFotoElement.src; } } else { const dadosAnteriores = dadosColetadosInspecao[indiceEquipamentoAtual]; if (dadosAnteriores && dadosAnteriores.foto_equipamento_previewDataUrl) { dados[`${key}_previewDataUrl`] = dadosAnteriores.foto_equipamento_previewDataUrl; } else { dados[`${key}_previewDataUrl`] = null; } }
            } else { if (inputElement && !inputElement.disabled) { dados[key] = value; } else if (inputElement && inputElement.disabled && !dados.hasOwnProperty(key)) { dados[key] = ''; } else if (!inputElement && !dados.hasOwnProperty(key)) { dados[key] = value; } }
        }
        for (const element of inspecaoForm.elements) { if (element.name && !dados.hasOwnProperty(element.name) && !element.name.endsWith('_status')) { if (element.type === 'file') {} else if (element.disabled) { dados[element.name] = ''; } else { dados[element.name] = element.value; } } }
        return dados;
    }

    function handleProximoEquipamento() {
        if (indiceEquipamentoAtual < 0 || indiceEquipamentoAtual >= listaDeEquipamentos.length) { console.warn("Índice de equipamento atual inválido para validação/coleta."); exibirEquipamentoAtual(); return; }
        if (!validarCamposObrigatorios()) { return; }
        const dadosAtuaisColetados = coletarDadosDoFormulario();
        if (dadosAtuaisColetados && listaDeEquipamentos[indiceEquipamentoAtual]) {
            const equipamentoAtualNominal = listaDeEquipamentos[indiceEquipamentoAtual];
            const pareceresDoEquipamento = gerarPareceresEquipamento(equipamentoAtualNominal, dadosAtuaisColetados);
            dadosAtuaisColetados.pareceres = pareceresDoEquipamento; dadosColetadosInspecao[indiceEquipamentoAtual] = dadosAtuaisColetados;
        }
        if (indiceEquipamentoAtual < listaDeEquipamentos.length - 1) { indiceEquipamentoAtual++; exibirEquipamentoAtual(); } else {
            console.log("[DEBUG] handleProximoEquipamento: Chegou ao último item. Preparando para finalizar.");
            indiceEquipamentoAtual = listaDeEquipamentos.length - 1; 
            if (equipamentoTagElement) equipamentoTagElement.textContent = (listaDeEquipamentos[indiceEquipamentoAtual].tag_motor || "TAG Indisponível") + " (Último Item - Revise e Finalize)";
            if (equipamentoAtualIndexElement) equipamentoAtualIndexElement.textContent = indiceEquipamentoAtual + 1;
            if (proximoEquipamentoBtn) { proximoEquipamentoBtn.textContent = "Próximo Equipamento"; proximoEquipamentoBtn.disabled = true; }
            if (anteriorEquipamentoBtn) { anteriorEquipamentoBtn.disabled = (listaDeEquipamentos.length <= 1); }
            if (finalizarInspecaoBtn) { finalizarInspecaoBtn.style.display = 'inline-block'; finalizarInspecaoBtn.disabled = false; finalizarInspecaoBtn.focus(); }
            alert("Você preencheu o último equipamento. Revise os dados se necessário e clique em 'Finalizar Inspeção do Setor'.");
        }
    }

    function handleAnteriorEquipamento() { if (indiceEquipamentoAtual > 0) { indiceEquipamentoAtual--; exibirEquipamentoAtual(); } }

    function handleFinalizarInspecao() {
        console.log("%c[DEBUG] handleFinalizarInspecao: INÍCIO DA FUNÇÃO", "color: blue; font-weight: bold;");
        const estaEmItemValidoParaSalvar = listaDeEquipamentos.length > 0 && indiceEquipamentoAtual >= 0 && indiceEquipamentoAtual < listaDeEquipamentos.length && listaDeEquipamentos[indiceEquipamentoAtual];
        if (estaEmItemValidoParaSalvar) {
            console.log(`[DEBUG] handleFinalizarInspecao: Verificando formulário do item atual no índice ${indiceEquipamentoAtual}.`);
            let formModificado = false;
            if (inspecaoForm && inspecaoForm.elements) { for (let i = 0; i < inspecaoForm.elements.length; i++) { const element = inspecaoForm.elements[i]; if (element.name && !element.name.endsWith('_status')) { if ((element.type === 'text' || element.type === 'number' || element.type === 'textarea') && element.value.trim() !== "") { formModificado = true; break; } if (element.tagName === 'SELECT' && element.value !== "" && element.selectedIndex !== 0) { formModificado = true; break; } if (element.type === 'file' && element.files && element.files.length > 0) { formModificado = true; break; } } } }
            console.log("[DEBUG] handleFinalizarInspecao: Formulário considerado modificado?", formModificado);
            const itemAtualFoiSalvo = dadosColetadosInspecao[indiceEquipamentoAtual] && Object.keys(dadosColetadosInspecao[indiceEquipamentoAtual]).length > 0;
            if ((!itemAtualFoiSalvo && formModificado) || (itemAtualFoiSalvo && formModificado && confirm("O item atual exibido possui dados que parecem ter sido modificados. Deseja salvá-los/sobrescrevê-los antes de finalizar a inspeção do setor?"))) {
                if (validarCamposObrigatorios()) {
                    const dadosFormAtual = coletarDadosDoFormulario();
                    if (dadosFormAtual) { const equipamentoNominalAtual = listaDeEquipamentos[indiceEquipamentoAtual]; const pareceresDoEquipamento = gerarPareceresEquipamento(equipamentoNominalAtual, dadosFormAtual); dadosFormAtual.pareceres = pareceresDoEquipamento; dadosColetadosInspecao[indiceEquipamentoAtual] = dadosFormAtual; console.log(`%c[DEBUG] handleFinalizarInspecao: Dados do item ${indiceEquipamentoAtual} (formulário atual) salvos/atualizados.`, "color: orange;"); }
                } else { alert("Preencha os campos obrigatórios do equipamento atual antes de finalizar o setor."); console.log("%c[DEBUG] handleFinalizarInspecao: Validação falhou para o item atual. Finalização do setor interrompida.", "color: red;"); return; }
            } else if (itemAtualFoiSalvo && formModificado) { console.log(`%c[DEBUG] handleFinalizarInspecao: Mantendo dados previamente salvos para item ${indiceEquipamentoAtual} (usuário não quis sobrescrever).`, "color: orange;"); } 
            else if (itemAtualFoiSalvo && !formModificado) { console.log(`%c[DEBUG] handleFinalizarInspecao: Mantendo dados previamente salvos para item ${indiceEquipamentoAtual} (formulário não modificado).`, "color: orange;"); } 
            else { console.log(`%c[DEBUG] handleFinalizarInspecao: Item atual ${indiceEquipamentoAtual} não precisou ser salvo (novo e não modificado).`, "color: orange;"); }
        } else { console.log(`[DEBUG] handleFinalizarInspecao: Não está em um item válido para salvar/atualizar formulário (índice: ${indiceEquipamentoAtual}, total: ${listaDeEquipamentos.length}).`); }
        const inspecoesValidasParaRelatorio = dadosColetadosInspecao.filter(dado => dado && typeof dado === 'object' && Object.keys(dado).length > 0 && dado.tag_motor);
        if (inspecoesValidasParaRelatorio.length === 0) {
            console.log("%c[DEBUG] handleFinalizarInspecao: Nenhuma inspeção válida encontrada. PDF não será gerado.", "color: red; font-weight: bold;");
            alert("Nenhuma inspeção foi realizada ou salva com dados válidos para ser finalizada. Por favor, inspecione ao menos um equipamento.");
            const btnFinalizarAtual = document.getElementById('finalizarInspecaoBtn'); if (btnFinalizarAtual) { btnFinalizarAtual.disabled = false; btnFinalizarAtual.style.display = 'inline-block'; }
            console.log("%c[DEBUG] handleFinalizarInspecao: FIM DA FUNÇÃO (sem inspeções válidas)", "color: blue; font-weight: bold;"); return;
        }
        console.log(`%c[DEBUG] handleFinalizarInspecao: Inspeção será finalizada com ${inspecoesValidasParaRelatorio.length} equipamento(s).`, "color: green;");
        alert(`Inspeção do setor finalizada com ${inspecoesValidasParaRelatorio.length} equipamento(s) inspecionado(s)! \nClique em 'Gerar Relatório PDF' para criar o documento.`);
        console.log("%c[DEBUG] handleFinalizarInspecao: Dados finais COLETADOS COM PARECERES para o relatório:", "color: green;", JSON.parse(JSON.stringify(inspecoesValidasParaRelatorio)));
        indiceEquipamentoAtual = listaDeEquipamentos.length;
        console.log(`%c[DEBUG] handleFinalizarInspecao: Índice atualizado para ${indiceEquipamentoAtual}. Chamando exibirEquipamentoAtual() para UI finalizada.`, "color: #FF8C00; font-weight: bold;");
        exibirEquipamentoAtual();
        console.log("%c[DEBUG] handleFinalizarInspecao: FIM DA FUNÇÃO (APÓS chamada a exibirEquipamentoAtual)", "color: blue; font-weight: bold;");
    }

    function handlePreviewFoto(event) {
        if (!previewFotoElement) return; const file = event.target.files[0];
        if (file) { const reader = new FileReader(); reader.onload = function (e) { previewFotoElement.src = e.target.result; previewFotoElement.style.display = 'block'; }; reader.readAsDataURL(file); } else { previewFotoElement.style.display = 'none'; previewFotoElement.src = "#"; }
    }

    function gerarPareceresEquipamento(equipamentoNominal, dadosColetados) {
        const pareceres = {}; const toNumber = (val) => { const num = parseFloat(val); return isNaN(num) ? null : num; };
        const tensaoNominal = toNumber(equipamentoNominal.tensao_v_nominal); const tensoesMedidas = { f1: toNumber(dadosColetados.tensao_f1_medida), f2: toNumber(dadosColetados.tensao_f2_medida), f3: toNumber(dadosColetados.tensao_f3_medida) }; const statusTensoes = { f1: dadosColetados.tensao_f1_medida_status, f2: dadosColetados.tensao_f2_medida_status, f3: dadosColetados.tensao_f3_medida_status };
        ['f1', 'f2', 'f3'].forEach(fase => { if (statusTensoes[fase] === 'NA') pareceres[`tensao_${fase}`] = "Não Aplicável"; else if (statusTensoes[fase] === 'NM') pareceres[`tensao_${fase}`] = "Não Medido"; else if (tensaoNominal === null || tensoesMedidas[fase] === null) pareceres[`tensao_${fase}`] = "Dados insuficientes"; else { const limiteInferior = tensaoNominal * 0.95, limiteSuperior = tensaoNominal * 1.05; if (tensoesMedidas[fase] < limiteInferior) pareceres[`tensao_${fase}`] = `Não Conforme - Subtensão (${tensoesMedidas[fase]}V)`; else if (tensoesMedidas[fase] > limiteSuperior) pareceres[`tensao_${fase}`] = `Não Conforme - Sobretensão (${tensoesMedidas[fase]}V)`; else pareceres[`tensao_${fase}`] = `Conforme (${tensoesMedidas[fase]}V)`; } });
        const tensoesValidas = [tensoesMedidas.f1, tensoesMedidas.f2, tensoesMedidas.f3].filter(t => t !== null); if (tensoesValidas.length === 3 && !statusTensoes.f1 && !statusTensoes.f2 && !statusTensoes.f3) { const mediaTensoes = tensoesValidas.reduce((a, b) => a + b, 0) / 3; let maxDesvioTensao = 0; tensoesValidas.forEach(t => { maxDesvioTensao = Math.max(maxDesvioTensao, Math.abs(t - mediaTensoes)); }); const percDesbTensao = (mediaTensoes > 0) ? (maxDesvioTensao / mediaTensoes) * 100 : 0; if (percDesbTensao > 3) pareceres.desbalanceamento_tensao = `Alerta - Desbalanceamento (${percDesbTensao.toFixed(1)}%)`; else pareceres.desbalanceamento_tensao = `Conforme (${percDesbTensao.toFixed(1)}%)`; } else pareceres.desbalanceamento_tensao = "Não foi possível calcular (dados faltantes/inválidos)";
        const tempMedida = toNumber(dadosColetados.temperatura_medida), tempStatus = dadosColetados.temperatura_medida_status; if (tempStatus === 'NA') pareceres.temperatura = "Não Aplicável"; else if (tempStatus === 'NM') pareceres.temperatura = "Não Medido"; else if (tempMedida === null) pareceres.temperatura = "Dados insuficientes"; else if (tempMedida > 85) pareceres.temperatura = `Alerta - Temperatura Elevada (${tempMedida}°C)`; else pareceres.temperatura = `Conforme (${tempMedida}°C)`;
        const correnteNominal = toNumber(equipamentoNominal.corrente_a_nominal); const correntesMedidas = { f1: toNumber(dadosColetados.corrente_f1_medida), f2: toNumber(dadosColetados.corrente_f2_medida), f3: toNumber(dadosColetados.corrente_f3_medida) }; const statusCorrentes = { f1: dadosColetados.corrente_f1_medida_status, f2: dadosColetados.corrente_f2_medida_status, f3: dadosColetados.corrente_f3_medida_status };
        ['f1', 'f2', 'f3'].forEach(fase => { if (statusCorrentes[fase] === 'NA') pareceres[`corrente_${fase}`] = "Não Aplicável"; else if (statusCorrentes[fase] === 'NM') pareceres[`corrente_${fase}`] = "Não Medido"; else if (correntesMedidas[fase] === null) pareceres[`corrente_${fase}`] = "Dados insuficientes"; else if (correnteNominal === null) pareceres[`corrente_${fase}`] = `Registrado (${correntesMedidas[fase]}A) - Nominal N/D`; else if (correntesMedidas[fase] > (correnteNominal * 1.10)) pareceres[`corrente_${fase}`] = `Alerta - Corrente Alta (${correntesMedidas[fase]}A)`; else pareceres[`corrente_${fase}`] = `Registrado (${correntesMedidas[fase]}A)`; });
        const correntesValidas = [correntesMedidas.f1, correntesMedidas.f2, correntesMedidas.f3].filter(c => c !== null); if (correntesValidas.length === 3 && !statusCorrentes.f1 && !statusCorrentes.f2 && !statusCorrentes.f3) { const mediaCorrentes = correntesValidas.reduce((a, b) => a + b, 0) / 3; let maxDesvioCorrente = 0; if (mediaCorrentes > 0) { correntesValidas.forEach(c => { maxDesvioCorrente = Math.max(maxDesvioCorrente, Math.abs(c - mediaCorrentes)); }); const percDesbCorrente = (maxDesvioCorrente / mediaCorrentes) * 100; if (percDesbCorrente > 10) pareceres.desbalanceamento_corrente = `Alerta - Desbalanceamento (${percDesbCorrente.toFixed(1)}%)`; else pareceres.desbalanceamento_corrente = `Conforme (${percDesbCorrente.toFixed(1)}%)`; } else if (mediaCorrentes === 0 && correntesValidas.every(c => c === 0)) pareceres.desbalanceamento_corrente = `Conforme (0.0%) - Sem Carga`; else pareceres.desbalanceamento_corrente = "Não foi possível calcular (dados zerados/inválidos)"; } else pareceres.desbalanceamento_corrente = "Não foi possível calcular (dados faltantes/inválidos)";
        const potPlacaCV = toNumber(dadosColetados.potencia_placa_cv), potNominalCV = toNumber(equipamentoNominal.potencia_cv_nominal); if (potPlacaCV === null && potNominalCV === null) pareceres.potencia_placa = "Dados insuficientes"; else if (potPlacaCV === null) pareceres.potencia_placa = `Nominal: ${potNominalCV} CV (Placa não informada)`; else if (potNominalCV === null || String(equipamentoNominal.potencia_cv_nominal).toUpperCase() === 'S/INF' || equipamentoNominal.potencia_cv_nominal === "") pareceres.potencia_placa = `Placa: ${potPlacaCV} CV (Nominal não cadastrado)`; else if (potPlacaCV === potNominalCV) pareceres.potencia_placa = "Conforme"; else pareceres.potencia_placa = `Alerta - Divergência (Placa: ${potPlacaCV} CV, Nominal: ${potNominalCV} CV)`;
        const rotNominal = toNumber(equipamentoNominal.rotacao_rpm_nominal), rotMedida = toNumber(dadosColetados.rotacao_medida), rotStatus = dadosColetados.rotacao_medida_status; if (rotStatus === 'NA') pareceres.rotacao = "Não Aplicável"; else if (rotStatus === 'NM') pareceres.rotacao = "Não Medido"; else if (rotNominal === null || rotMedida === null) pareceres.rotacao = "Dados insuficientes"; else { const limiteInferiorRot = rotNominal * 0.95, limiteSuperiorRot = rotNominal * 1.05; if (rotMedida < limiteInferiorRot) pareceres.rotacao = `Alerta - Rotação Baixa (${rotMedida} RPM)`; else if (rotMedida > limiteSuperiorRot) pareceres.rotacao = `Alerta - Rotação Alta (${rotMedida} RPM)`; else pareceres.rotacao = `Conforme (${rotMedida} RPM)`; }
        const rolDNominal = equipamentoNominal.rolamento_d_nominal, rolTNominal = equipamentoNominal.rolamento_t_nominal; const rolDMedido = dadosColetados.rolamento_d_medido, rolTMedido = dadosColetados.rolamento_t_medido; const rolDStatus = dadosColetados.rolamento_d_medido_status, rolTStatus = dadosColetados.rolamento_t_medido_status; if (rolDStatus === 'NA') pareceres.rolamento_dianteiro = "Não Aplicável"; else if (rolDStatus === 'NM') pareceres.rolamento_dianteiro = "Não Medido"; else if (!rolDMedido || rolDMedido.trim() === "") pareceres.rolamento_dianteiro = "Não Informado (Placa)"; else if (!rolDNominal || String(rolDNominal).toUpperCase() === 'S/INF' || rolDNominal.trim() === "") pareceres.rolamento_dianteiro = `Placa: ${rolDMedido} (Nominal N/D)`; else if (String(rolDMedido).toUpperCase() === String(rolDNominal).toUpperCase()) pareceres.rolamento_dianteiro = "Conforme"; else pareceres.rolamento_dianteiro = `Alerta - Divergência (Med: ${rolDMedido}, Nom: ${rolDNominal})`; if (rolTStatus === 'NA') pareceres.rolamento_traseiro = "Não Aplicável"; else if (rolTStatus === 'NM') pareceres.rolamento_traseiro = "Não Medido"; else if (!rolTMedido || rolTMedido.trim() === "") pareceres.rolamento_traseiro = "Não Informado (Placa)"; else if (!rolTNominal || String(rolTNominal).toUpperCase() === 'S/INF' || rolTNominal.trim() === "") pareceres.rolamento_traseiro = `Placa: ${rolTMedido} (Nominal N/D)`; else if (String(rolTMedido).toUpperCase() === String(rolTNominal).toUpperCase()) pareceres.rolamento_traseiro = "Conforme"; else pareceres.rolamento_traseiro = `Alerta - Divergência (Med: ${rolTMedido}, Nom: ${rolTNominal})`;
        const vibracaoStatus = dadosColetados.vibracao_status; if (vibracaoStatus === 'NA') pareceres.vibracao = "Não Aplicável"; else if (vibracaoStatus === 'NM') pareceres.vibracao = "Não Verificado"; else if (dadosColetados.vibracao === 'sim') pareceres.vibracao = "Alerta - Vibração Excessiva"; else if (dadosColetados.vibracao === 'nao') pareceres.vibracao = "Normal"; else pareceres.vibracao = "Não Informado"; const ruidoDStatus = dadosColetados.ruido_rol_d_status; if (ruidoDStatus === 'NA') pareceres.ruido_rol_dianteiro = "Não Aplicável"; else if (ruidoDStatus === 'NM') pareceres.ruido_rol_dianteiro = "Não Verificado"; else if (dadosColetados.ruido_rol_d === 'sim') pareceres.ruido_rol_dianteiro = "Alerta - Ruído Anormal"; else if (dadosColetados.ruido_rol_d === 'nao') pareceres.ruido_rol_dianteiro = "Normal"; else pareceres.ruido_rol_dianteiro = "Não Informado"; const ruidoTStatus = dadosColetados.ruido_rol_t_status; if (ruidoTStatus === 'NA') pareceres.ruido_rol_traseiro = "Não Aplicável"; else if (ruidoTStatus === 'NM') pareceres.ruido_rol_traseiro = "Não Verificado"; else if (dadosColetados.ruido_rol_t === 'sim') pareceres.ruido_rol_traseiro = "Alerta - Ruído Anormal"; else if (dadosColetados.ruido_rol_t === 'nao') pareceres.ruido_rol_traseiro = "Normal"; else pareceres.ruido_rol_traseiro = "Não Informado";
        pareceres.necessita_atualizacao_json = false; const camposNominaisParaChecar = [ { nominalKey: 'marca_nominal', placaKey: 'marca_medida' }, { nominalKey: 'modelo_nominal', placaKey: 'modelo_medido' }, { nominalKey: 'potencia_cv_nominal', placaKey: 'potencia_placa_cv' }, { nominalKey: 'rolamento_d_nominal', placaKey: 'rolamento_d_medido' }, { nominalKey: 'rolamento_t_nominal', placaKey: 'rolamento_t_medido' } ]; let listaAtualizacoes = [];
        camposNominaisParaChecar.forEach(campo => { const valorNominal = equipamentoNominal[campo.nominalKey], valorPlaca = dadosColetados[campo.placaKey]; if ((!valorNominal || String(valorNominal).toUpperCase() === 'S/INF' || String(valorNominal).trim() === "") && (valorPlaca && String(valorPlaca).trim() !== "")) { pareceres.necessita_atualizacao_json = true; listaAtualizacoes.push(`Campo '${campo.nominalKey}': Nominal ausente/S.INF, Placa/Medido: '${valorPlaca}'`); } }); if (pareceres.necessita_atualizacao_json) pareceres.detalhes_atualizacao_json = listaAtualizacoes;
        return pareceres;
    }

    async function gerarRelatorioPDFHandler() {
        console.log("%c[PDF_DEBUG] gerarRelatorioPDFHandler: INÍCIO", "color: purple; font-weight: bold;");
        const inspecoesParaRelatorio = dadosColetadosInspecao.filter(dado => dado && typeof dado === 'object' && Object.keys(dado).length > 0);
        if (!inspecoesParaRelatorio || inspecoesParaRelatorio.length === 0) {
            alert("Nenhum dado de inspeção válido para gerar o relatório.");
            const btnPDFInit = document.getElementById('btnGerarRelatorioPDF');
            if (btnPDFInit) { btnPDFInit.disabled = false; btnPDFInit.textContent = "Gerar Relatório PDF"; }
            console.log("%c[PDF_DEBUG] gerarRelatorioPDFHandler: FIM (sem dados)", "color: purple; font-weight: bold;");
            return;
        }
        console.log("[PDF_DEBUG] Iniciando geração de PDF com os seguintes dados:", JSON.parse(JSON.stringify(inspecoesParaRelatorio)));
        const btnPDF = document.getElementById('btnGerarRelatorioPDF');
        if (!btnPDF) { console.error("[PDF_DEBUG] Botão 'btnGerarRelatorioPDF' não encontrado no DOM."); return; }
        btnPDF.disabled = true; btnPDF.textContent = "Gerando...";
        try {
            await criarPDF(inspecoesParaRelatorio);
            if (confirm("Relatório PDF gerado com sucesso!\nDeseja realizar a inspeção de outro setor?")) {
                dadosColetadosInspecao = []; indiceEquipamentoAtual = 0;
                if (typeof limparFormularioInspecao === "function") limparFormularioInspecao();
                const btnProximo = document.getElementById('btnProximoEquipamento'), btnAnterior = document.getElementById('btnAnteriorEquipamento'), btnFinalizar = document.getElementById('btnFinalizarInspecao');
                if (btnProximo) btnProximo.disabled = true; if (btnAnterior) btnAnterior.disabled = true;
                if (btnFinalizar) { btnFinalizar.disabled = true; btnFinalizar.style.display = 'none';}
                btnPDF.style.display = 'none'; btnPDF.disabled = false; btnPDF.textContent = "Gerar Relatório PDF";
                if(noEquipmentsMessage) noEquipmentsMessage.style.display = 'none';
                if(equipamentoInfoWrapper) equipamentoInfoWrapper.style.display = 'block';
                window.location.href = 'dashboard.html';
            } else {
                localStorage.removeItem('usuarioLogado'); localStorage.removeItem('cadastroLogado'); sessionStorage.removeItem('setorSelecionado');
                window.location.href = '../index.html';
            }
        } catch (error) {
            console.error("[PDF_DEBUG] Erro ao gerar PDF:", error); 
            alert("Ocorreu um erro ao gerar o relatório PDF. Verifique o console para detalhes.");
            if(btnPDF) { btnPDF.disabled = false; btnPDF.textContent = "Gerar Relatório PDF"; }
        }
        console.log("%c[PDF_DEBUG] gerarRelatorioPDFHandler: FIM", "color: purple; font-weight: bold;");
    }

    async function criarPDF(dadosDaInspecao) {
        console.log("%c[PDF_DEBUG] criarPDF: INÍCIO com dados:", "color: purple; font-weight: bold;", JSON.parse(JSON.stringify(dadosDaInspecao)));
        const { jsPDF } = window.jspdf; 
        const doc = new jsPDF();
        
        const nomeUsuario = localStorage.getItem('usuarioLogado') || 'N/A (Nome não encontrado)';
        const cadastroUsuario = localStorage.getItem('cadastroLogado') || 'N/A (Cadastro não encontrado)'; // Pega o cadastro
        
        const dataHora = new Date().toLocaleString('pt-BR');
        const setorInspecionado = sessionStorage.getItem('setorSelecionado') ? sessionStorage.getItem('setorSelecionado').toUpperCase() : 'N/A';
        
        let posY = 10; 
        const margemEsquerda = 15;
        const margemDireita = doc.internal.pageSize.getWidth() - 15;
        const larguraConteudo = margemDireita - margemEsquerda;
        
        const logoOleBase64 = sessionStorage.getItem('logoOleBase64');
        const logoPandeBase64 = sessionStorage.getItem('logoPandeBase64');

        if (logoOleBase64) { try { doc.addImage(logoOleBase64, 'PNG', margemEsquerda, posY, 30, 10); } catch (e) { console.error("[PDF_DEBUG] Erro ao adicionar logo Olé:", e); doc.setFontSize(8).text('Olé Conservas (erro logo)', margemEsquerda, posY + 7); } } else doc.setFontSize(8).text('Olé Conservas', margemEsquerda, posY + 7);
        if (logoPandeBase64) { try { doc.addImage(logoPandeBase64, 'PNG', margemDireita - 30, posY, 30, 10); } catch (e) { console.error("[PDF_DEBUG] Erro ao adicionar logo PAMDE:", e); doc.setFontSize(8).text('PAMDE (erro logo)', margemDireita - 15, posY + 7, { align: 'right' }); } } else doc.setFontSize(8).text('PAMDE', margemDireita - 15, posY + 7, { align: 'right' });
        
        posY += 15; 
        doc.setFontSize(16).setFont(undefined, 'bold'); 
        doc.text(`Relatório de Inspeção - Setor: ${setorInspecionado}`, doc.internal.pageSize.getWidth() / 2, posY, { align: 'center' }); 
        posY += 8; 
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10); 
        doc.text(`Inspetor: ${nomeUsuario} (Cad: ${cadastroUsuario})`, margemEsquerda, posY); // MODIFICADO AQUI
        doc.text(`Data e Hora: ${dataHora}`, margemDireita, posY, { align: 'right' }); 
        posY += 6; 
        doc.setLineWidth(0.2).line(margemEsquerda, posY, margemDireita, posY); 
        posY += 4;

        function addPageIfNeeded(alturaEstimadaProximoConteudo = 20) {
            if (posY + alturaEstimadaProximoConteudo > doc.internal.pageSize.getHeight() - 15) {
                doc.addPage(); posY = 15;
                doc.setFontSize(8).setTextColor(100);
                doc.text(`Relatório de Inspeção - Setor: ${setorInspecionado} (Pág. ${doc.internal.getNumberOfPages()})`, doc.internal.pageSize.getWidth() / 2, 10, { align: 'center' });
                doc.setTextColor(0);
            }
        }

        const tableOptionsComumBase = {
            theme: 'striped', styles: { fontSize: 7, cellPadding: 1, overflow: 'linebreak' },
            headStyles: { fillColor: [52, 73, 94], textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 8 },
            margin: { left: margemEsquerda, right: margemEsquerda },
            didDrawPage: function (data) { posY = data.cursor.y; }
        };

        for (const [index, equipamento] of dadosDaInspecao.entries()) {
            addPageIfNeeded(60); 
            doc.setFontSize(12).setFont(undefined, 'bold'); doc.text(`Equipamento: ${equipamento.tag_motor || 'N/A'} (${equipamento.nome_componente || 'N/A'})`, margemEsquerda, posY); posY += 6;
            doc.setFont(undefined, 'normal').setFontSize(9); doc.text(`Local: ${equipamento.setor_principal || ''} > ${equipamento.subsetor_nivel1 || ''} > ${equipamento.subsetor_nivel2 || ''}`, margemEsquerda, posY); posY += 7;
            
            addPageIfNeeded(30); 
            const nominaisBody = [ ["Potência Nominal (CV/kW):", `${equipamento.potencia_CV_nominal || 'S/INF'} / ${equipamento.potencia_kw_nominal || 'S/INF'}`], ["Tensão Nominal (V):", equipamento.tensao_v_nominal || 'S/INF'], ["Corrente Nominal (A):", equipamento.corrente_a_nominal || 'S/INF'], ["Rotação Nominal (RPM):", equipamento.rotacao_rpm_nominal || 'S/INF'], ["Rol. Dianteiro Nominal:", equipamento.rolamento_d_nominal || 'S/INF'], ["Rol. Traseiro Nominal:", equipamento.rolamento_t_nominal || 'S/INF'], ["Carcaça Nominal:", equipamento.carcaca_nominal || 'S/INF'], ["IP Nominal:", equipamento.ip_nominal || 'S/INF'] ];
            doc.autoTable({ ...tableOptionsComumBase, startY: posY, head: [['Dados Nominais', 'Valor']], body: nominaisBody, columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 }, 1: { cellWidth: larguraConteudo - 45 } } });
            posY = doc.autoTable.previous.finalY + 4;

            addPageIfNeeded(50);
            const medidosPlacaBody = [ ["Marca (Placa/Medido):", formatarMedicaoComStatus(equipamento.marca_medida, equipamento.marca_medida_status)], ["Modelo (Placa/Medido):", formatarMedicaoComStatus(equipamento.modelo_medido, equipamento.modelo_medido_status)], ["Potência (Placa CV/kW):", `${formatarMedicaoComStatus(equipamento.potencia_placa_cv, equipamento.potencia_placa_cv_status)} / ${formatarMedicaoComStatus(equipamento.potencia_placa_kw, equipamento.potencia_placa_kw_status)}`], ["Rol. Diant. (Placa):", formatarMedicaoComStatus(equipamento.rolamento_d_placa || equipamento.rolamento_d_medido, equipamento.rolamento_d_medido_status)], ["Rol. Tras. (Placa):", formatarMedicaoComStatus(equipamento.rolamento_t_placa || equipamento.rolamento_t_medido, equipamento.rolamento_t_medido_status)], ["Carcaça (Placa):", formatarMedicaoComStatus(equipamento.carcaca_placa, equipamento.carcaca_placa_status)], ["IP (Placa):", formatarMedicaoComStatus(equipamento.ip_placa, equipamento.ip_placa_status)], ["Potência Medida (CV):", formatarMedicaoComStatus(equipamento.potencia_medida, equipamento.potencia_medida_status)], ["Tensão Medida (F1/F2/F3) V:", `${formatarMedicaoComStatus(equipamento.tensao_f1_medida, equipamento.tensao_f1_medida_status)} / ${formatarMedicaoComStatus(equipamento.tensao_f2_medida, equipamento.tensao_f2_medida_status)} / ${formatarMedicaoComStatus(equipamento.tensao_f3_medida, equipamento.tensao_f3_medida_status)}`], ["Corrente Medida (F1/F2/F3) A:", `${formatarMedicaoComStatus(equipamento.corrente_f1_medida, equipamento.corrente_f1_medida_status)} / ${formatarMedicaoComStatus(equipamento.corrente_f2_medida, equipamento.corrente_f2_medida_status)} / ${formatarMedicaoComStatus(equipamento.corrente_f3_medida, equipamento.corrente_f3_medida_status)}`], ["Temperatura Medida (°C):", formatarMedicaoComStatus(equipamento.temperatura_medida, equipamento.temperatura_medida_status)], ["Rotação Medida (RPM):", formatarMedicaoComStatus(equipamento.rotacao_medida, equipamento.rotacao_medida_status)], ["Regulagem Disjuntor (A):", formatarMedicaoComStatus(equipamento.regulagem_corrente_medida, equipamento.regulagem_corrente_medida_status)], ];
            doc.autoTable({ ...tableOptionsComumBase, startY: posY, head: [['Dados Medidos / Placa', 'Valor']], body: medidosPlacaBody, columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 }, 1: { cellWidth: larguraConteudo - 45 } } });
            posY = doc.autoTable.previous.finalY + 4;

            addPageIfNeeded(40); 
            const pareceresArray = []; if (equipamento.pareceres) { const chavesExcluirParecer = ['necessita_atualizacao_json', 'detalhes_atualizacao_json', 'potencia_placa', 'rolamento_dianteiro', 'rolamento_traseiro']; for (const [chave, valor] of Object.entries(equipamento.pareceres)) { if (!chavesExcluirParecer.includes(chave)) { pareceresArray.push([`${formatarChaveParecer(chave)}:`, valor]); } } if (equipamento.pareceres.potencia_placa) pareceresArray.push(["Potência (Placa vs Nominal):", equipamento.pareceres.potencia_placa]); if (equipamento.pareceres.rolamento_dianteiro) pareceresArray.push(["Rolamento Dianteiro (Placa vs Nominal):", equipamento.pareceres.rolamento_dianteiro]); if (equipamento.pareceres.rolamento_traseiro) pareceresArray.push(["Rolamento Traseiro (Placa vs Nominal):", equipamento.pareceres.rolamento_traseiro]); }
            if (pareceresArray.length > 0) { doc.autoTable({ ...tableOptionsComumBase, startY: posY, head: [['Análise Técnica / Pareceres', 'Resultado']], body: pareceresArray, columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 }, 1: { cellWidth: larguraConteudo - 60 } } }); posY = doc.autoTable.previous.finalY + 4; }

            addPageIfNeeded(60); 
            if (equipamento.foto_equipamento_previewDataUrl) { doc.setFontSize(9).setFont(undefined, 'bold'); doc.text("Foto do Equipamento:", margemEsquerda, posY); posY += 4; try { const larguraFoto = 70, alturaMaxFoto = 50; doc.addImage(equipamento.foto_equipamento_previewDataUrl, 'JPEG', margemEsquerda, posY, larguraFoto, alturaMaxFoto, undefined, 'FAST'); posY += alturaMaxFoto + 4; } catch (e) { console.warn("[PDF_DEBUG] Erro ao adicionar imagem ao PDF:", e); doc.setFont(undefined, 'normal').setTextColor(255, 0, 0); doc.text("Erro ao carregar imagem.", margemEsquerda, posY); posY += 5; doc.setTextColor(0); } }
            
            addPageIfNeeded(20); 
            if (equipamento.observacao) { doc.setFontSize(9).setFont(undefined, 'bold'); doc.text("Observações:", margemEsquerda, posY); posY += 4; doc.setFont(undefined, 'normal').setFontSize(8); const obsLines = doc.splitTextToSize(equipamento.observacao, larguraConteudo); doc.text(obsLines, margemEsquerda, posY); posY += (obsLines.length * 3.5) + 4; }

            if (index < dadosDaInspecao.length - 1) { addPageIfNeeded(5); doc.setLineWidth(0.1).line(margemEsquerda, posY, margemDireita, posY); posY += 4; }
        } 

        addPageIfNeeded(30); 
        const itensParaAtualizar = dadosDaInspecao.filter(eq => eq.pareceres && eq.pareceres.necessita_atualizacao_json && eq.pareceres.detalhes_atualizacao_json);
        if (itensParaAtualizar.length > 0) {
            doc.setFontSize(11).setFont(undefined, 'bold'); doc.text("Itens para Atualização no Cadastro (JSON):", margemEsquerda, posY); posY += 6; const atualizacoesBody = [];
            itensParaAtualizar.forEach(eq => { const tag = eq.tag_motor || 'N/A'; if (Array.isArray(eq.pareceres.detalhes_atualizacao_json)) { eq.pareceres.detalhes_atualizacao_json.forEach(detalheStr => { atualizacoesBody.push([tag, detalheStr]); }); } else if (typeof eq.pareceres.detalhes_atualizacao_json === 'object') { for (const [campo, valor] of Object.entries(eq.pareceres.detalhes_atualizacao_json)) atualizacoesBody.push([tag, `Campo '${campo}' para '${valor}'`]); } });
            doc.autoTable({ ...tableOptionsComumBase, startY: posY, head: [['Equipamento', 'Detalhe da Atualização Sugerida']], body: atualizacoesBody, headStyles: { ...tableOptionsComumBase.headStyles, fillColor: [230, 126, 34] }, columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 }, 1: { cellWidth: larguraConteudo - 40 } }, });
            posY = doc.autoTable.previous.finalY + 4;
        } else { doc.setFontSize(9).setFont(undefined, 'italic'); doc.text("Nenhum item identificado para atualização no cadastro.", margemEsquerda, posY); posY += 6; }

        // --- INÍCIO DO RESUMO DA INSPEÇÃO ---
        addPageIfNeeded(25); 
        doc.setFontSize(11).setFont(undefined, 'bold');
        doc.text("Resumo da Inspeção do Setor", margemEsquerda, posY);
        posY += 7;
        doc.setFontSize(9).setFont(undefined, 'normal');
        const totalNoSetor = listaDeEquipamentos.length; 
        const totalInspecionados = dadosDaInspecao.length;
        doc.text(`Total de equipamentos cadastrados no setor: ${totalNoSetor}`, margemEsquerda, posY);
        posY += 5;
        doc.text(`Total de equipamentos inspecionados neste relatório: ${totalInspecionados}`, margemEsquerda, posY);
        posY += 7;
        if (totalInspecionados < totalNoSetor) {
            doc.setTextColor(255, 0, 0); doc.setFont(undefined, 'bold');
            doc.text(`Atenção: ${totalNoSetor - totalInspecionados} equipamento(s) do setor não foram incluídos nesta inspeção.`, margemEsquerda, posY);
            doc.setTextColor(0); doc.setFont(undefined, 'normal');
            posY += 7;
        } else if (totalInspecionados === totalNoSetor && totalNoSetor > 0) { // Adicionado totalNoSetor > 0 para evitar mensagem se o setor estiver vazio
            doc.setTextColor(0, 128, 0); doc.setFont(undefined, 'bold');
            doc.text(`Todos os ${totalNoSetor} equipamentos cadastrados no setor foram inspecionados.`, margemEsquerda, posY);
            doc.setTextColor(0); doc.setFont(undefined, 'normal');
            posY += 7;
        } else if (totalNoSetor === 0) { // Caso o setor não tenha equipamentos cadastrados
            doc.setFont(undefined, 'italic');
            doc.text(`Nenhum equipamento cadastrado para este setor.`, margemEsquerda, posY);
            posY += 7;
        }
        // --- FIM DO RESUMO DA INSPEÇÃO ---

        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) { doc.setPage(i); doc.setFontSize(8).setTextColor(150); doc.text('Página ' + String(i) + ' de ' + String(pageCount), doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 7, { align: 'center' }); }
        doc.setTextColor(0);
        const nomeArquivo = `Relatorio_Inspecao_${setorInspecionado.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.pdf`;
        doc.save(nomeArquivo);
        console.log(`[PDF_DEBUG] PDF "${nomeArquivo}" gerado e download iniciado.`);
        console.log("%c[PDF_DEBUG] criarPDF: FIM", "color: purple; font-weight: bold;");
    }

    function formatarChaveParecer(chave) {
        let str = chave.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        return str.replace("Tensao F1", "Tensão F1").replace("Tensao F2", "Tensão F2").replace("Tensao F3", "Tensão F3").replace("Corrente F1", "Corrente F1").replace("Corrente F2", "Corrente F2").replace("Corrente F3", "Corrente F3").replace("Desbalanceamento Tensao", "Desbalanceamento de Tensão").replace("Desbalanceamento Corrente", "Desbalanceamento de Corrente").replace("Ruido Rol Dianteiro", "Ruído Rol. Dianteiro").replace("Ruido Rol Traseiro", "Ruído Rol. Traseiro").replace("Potencia Placa", "Potência (Placa vs Nominal)").replace("Rolamento Dianteiro", "Rol. Dianteiro (Placa vs Nominal)").replace("Rolamento Traseiro", "Rol. Traseiro (Placa vs Nominal)");
    }
    function formatarMedicaoComStatus(valor, status) { if (status === 'NA') return 'N/A'; if (status === 'NM') return 'N/M'; if (valor === null || valor === undefined || String(valor).trim() === "") return 'S/INF'; return String(valor); }

    async function imageToBase64(url) {
        try {
            const response = await fetch(url); if (!response.ok) { console.error(`Falha ao buscar imagem: ${response.status} ${response.statusText} para ${url}`); return null; }
            const blob = await response.blob(); return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onloadend = () => resolve(reader.result); reader.onerror = (error) => { console.error("Erro no FileReader para:", url, error); reject(null); }; reader.readAsDataURL(blob); });
        } catch (error) { console.error("Erro na função imageToBase64 para:", url, error); return null; }
    }

    async function carregarLogosBase64() {
        try {
            if (!sessionStorage.getItem('logoOleBase64')) { const logoOle = await imageToBase64('assets/img/ole_logo.jpg'); if (logoOle) sessionStorage.setItem('logoOleBase64', logoOle); else console.warn("Logo Olé não pôde ser carregada."); }
            if (!sessionStorage.getItem('logoPandeBase64')) { const logoPande = await imageToBase64('assets/img/pande_logo.jpg'); if (logoPande) sessionStorage.setItem('logoPandeBase64', logoPande); else console.warn("Logo PAMDE não pôde ser carregada."); }
        } catch (error) { console.error("Erro ao carregar logos como Base64:", error); }
    }

    function attachEventListeners() {
        if (voltarDashboardBtn) { voltarDashboardBtn.addEventListener('click', () => { const inspecoesRealizadas = dadosColetadosInspecao.filter(d => d !== null).length > 0; if (inspecoesRealizadas && !confirm("Você tem dados de inspeção não finalizados. Deseja realmente voltar e perder esses dados?")) return; window.location.href = 'dashboard.html'; }); }
        if (proximoEquipamentoBtn) proximoEquipamentoBtn.addEventListener('click', handleProximoEquipamento);
        if (anteriorEquipamentoBtn) anteriorEquipamentoBtn.addEventListener('click', handleAnteriorEquipamento);
        if (finalizarInspecaoBtn) { finalizarInspecaoBtn.addEventListener('click', handleFinalizarInspecao); } else { console.warn("[DEBUG] Botão finalizarInspecaoBtn NÃO encontrado para anexar listener."); }
        const btnGerarPDF = document.getElementById('btnGerarRelatorioPDF'); if (btnGerarPDF) { btnGerarPDF.addEventListener('click', gerarRelatorioPDFHandler); } else { console.warn("[DEBUG] Botão btnGerarRelatorioPDF NÃO encontrado para anexar listener."); }
        if (fotoEquipamentoInput) fotoEquipamentoInput.addEventListener('change', handlePreviewFoto);
        const todosOsStatusCheckboxes = document.querySelectorAll('input.status_checkbox'); if (todosOsStatusCheckboxes.length > 0) { todosOsStatusCheckboxes.forEach(checkbox => checkbox.addEventListener('change', handleStatusCheckboxChange)); } else { console.warn("[DEBUG] Nenhum checkbox com a classe 'status_checkbox' encontrado."); }
    }

    function initChecklist() {
        console.log("[DEBUG] checklist.js - initChecklist() chamada");
        carregarLogosBase64();
        const usuarioLogado = localStorage.getItem('usuarioLogado'), cadastroLogado = localStorage.getItem('cadastroLogado');
        if (usuarioLogado && cadastroLogado) { if (checklistUserInfo) checklistUserInfo.textContent = `Usuário: ${usuarioLogado} (Cad: ${cadastroLogado})`; } else { alert("Sessão inválida. Por favor, faça login novamente."); window.location.href = 'index.html'; return; }
        const setorSelecionado = sessionStorage.getItem('setorSelecionado');
        if (setorSelecionado) { if (setorAtualTitulo) setorAtualTitulo.textContent = setorSelecionado.toUpperCase(); fetchEquipamentosDoSetor(setorSelecionado); } else {
            console.error("Nenhum setor selecionado.");
            if (noEquipmentsMessage) { noEquipmentsMessage.textContent = "Nenhum setor foi selecionado. Por favor, volte ao dashboard e selecione um setor."; noEquipmentsMessage.style.display = 'block'; }
            if (equipamentoInfoWrapper) equipamentoInfoWrapper.style.display = 'none'; if (proximoEquipamentoBtn) proximoEquipamentoBtn.disabled = true; if (anteriorEquipamentoBtn) anteriorEquipamentoBtn.disabled = true; if (finalizarInspecaoBtn) finalizarInspecaoBtn.disabled = true;
        }
        attachEventListeners();
        console.log("[DEBUG] initChecklist() finalizada.");
    }

    initChecklist();
    console.log("[DEBUG] checklist.js: DOMContentLoaded - FIM");
});
console.log("[DEBUG] Checklist.js: ARQUIVO FINALIZADO PELO NAVEGADOR");