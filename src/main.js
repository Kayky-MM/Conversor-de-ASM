function generate() {
    const textArea = document.getElementById('codigo')
    const conteudo = textArea.value.trim().split(/\n+/).map(l => l.trim()).filter(l => l.length > 0)
    const output = document.querySelector('.show')
    if (conteudo.length === 0) {
        output.innerHTML = ``;
        return;
    }
    output.innerHTML = `<div class="line1">v2.0 raw </div>`
    for (let i in conteudo) {
        let objectFile = assembler(conteudo[i])
        if (objectFile.success === true) {
            output.innerHTML += `<div class="line${i % 2}">${objectFile.getHex()} # ${objectFile.getOriginal()} ${objectFile.getBinary()}</div>`
        } else {
            output.innerHTML += `<div class = "line${i % 2}">ERRO: ${objectFile.getMessage()}</div>`
            break;
        }
    }
}
function clearAll() {
    const textArea = document.getElementById('codigo')
    textArea.value = '';
    const output = document.querySelector('.show')
    output.innerHTML = '';
}

function download() {
    const lines = Array.from(document.querySelectorAll('.show > div'));
    const content = lines.map(div => div.innerText.trim()).join('\n').trim();
    if (!content || content.includes('ERRO'))
        return
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'v20raw.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
function toggleConfig() {
    const configArea = document.querySelector('.config-area');
    const editArea = document.querySelector('.edit-area');
    const configModal = document.getElementById('configModal');
    if (configModal.style.display === 'none') {
        editArea.style.display = 'none';
        configArea.style.display = 'none';
        loadTable();
        configModal.style.display = 'block';
    } else {
        editArea.style.display = 'flex';
        configArea.style.display = 'flex';
        configModal.style.display = 'none';
    }
}
function toggleHelp(){
    const configArea = document.querySelector('.config-area');
    const editArea = document.querySelector('.edit-area');
    const helpModal = document.getElementById('helpModal');
    if (helpModal.style.display === 'none') {
        editArea.style.display = 'none';
        configArea.style.display = 'none';
        helpModal.style.display = 'block';
    } else {
        editArea.style.display = 'flex';
        configArea.style.display = 'flex';
        helpModal.style.display = 'none';
    }
}
function loadTable() {
    const thead = document.querySelector('thead')
    const tbody = document.querySelector('tbody')
    thead.innerHTML = `<tr>
                            <th>Instrução</th>
                            <th>Tipo</th>
                            <th>Opcode</th>
                            <th>Funct</th>
                        </tr>`;
    tbody.innerHTML = ``;
    for (let instr in defaultOpcodes) {
        const opcodeBits = configOpcode[instr];
        const functBits = configFunct[instr] || null;
        const typeCode = type(instr).toUpperCase();

        const buildBitSpans = bits => [...bits].map(b => `<span class="bit">${b}</span>`).join('');

        const opcodeHTML = buildBitSpans(opcodeBits);
        const functHTML = functBits ? buildBitSpans(functBits) : '-';

        tbody.innerHTML += `
            <tr>
                <td>${instr.toUpperCase()}</td>
                <td>${typeCode}</td>
                <td>${opcodeHTML}</td>
                <td>${functHTML}</td>
            </tr>
        `;
    }
}
function restore(){
    restoreDefault();
    loadTable();
    alert('Configurações padrão restauradas!');
}
function highlightDuplicateFuncts() {
    const functSpans = document.querySelectorAll('td:nth-child(4)'); 
    const map = new Map();
    let repeated = false;
    functSpans.forEach(td => {
        const bits = Array.from(td.querySelectorAll('span.bit')).map(span => span.textContent).join('');
        if (!bits.includes('0') && !bits.includes('1')) return;

        if (!map.has(bits)) {
            map.set(bits, []);
        }
        map.get(bits).push(td);
    });

    functSpans.forEach(td => td.classList.remove('conflict'));

    for (const [bits, tds] of map.entries()) {
        if (tds.length > 1) {
            repeated = true;
            tds.forEach(td => td.classList.add('conflict'));
        }
    }
    return repeated
}
function highlightConflictingTypes() {
    const linhas = document.querySelectorAll('tbody tr');
    const opcodeMap = new Map(); 
    let repeated = false;
    linhas.forEach(tr => {
        const tdOpcode = tr.children[2];
        tdOpcode.style.outline = 'none';
    });

    linhas.forEach(tr => {
        const instrucao = tr.children[0].textContent.trim();
        const tipo = tr.children[1].textContent.trim();
        const tdOpcode = tr.children[2];
        const spans = tdOpcode.querySelectorAll('span.bit');
        const opcode = Array.from(spans).map(s => s.textContent).join('');

        if (!opcodeMap.has(opcode)) {
            opcodeMap.set(opcode, []);
        }

        opcodeMap.get(opcode).push({ tipo, td: tdOpcode });
    });

    opcodeMap.forEach((entradas, opcode) => {
        const tipos = new Set(entradas.map(e => e.tipo));
        if (tipos.size > 1) {
            repeated = true;
            entradas.forEach(({ td }) => {
                td.style.outline = '2px solid #4299e1';
            });
        }
    });
    return repeated;
}

function highlightDuplicateOpcodes() {
    const opcodeSpans = Array.from(document.querySelectorAll('td:nth-child(3)')).filter(td => td.parentElement.children[1].textContent.trim() !== 'R'); // Supondo que funct está na 4ª coluna
    const map = new Map();
    let repeated = false;
    opcodeSpans.forEach(td => {
        const bits = Array.from(td.querySelectorAll('span.bit')).map(span => span.textContent).join('');
        if (!map.has(bits)) {
            map.set(bits, []);
        }
        map.get(bits).push(td);
    });

    opcodeSpans.forEach(td => td.classList.remove('conflict'));

    for (const [bits, tds] of map.entries()) {
        if (tds.length > 1) {
            repeated = true;
            tds.forEach(td => td.classList.add('conflict'));
        }
    }
    return repeated
}

function saveConfigurations() {
    const novoOpcode = {};
    const novoFunct = {};

    const linhas = document.querySelectorAll('tbody tr');

    linhas.forEach(tr => {
        const colunas = tr.children;
        const instrucao = colunas[0].textContent.trim().toLowerCase();

        const spansOpcode = colunas[2].querySelectorAll('span.bit');
        const opcode = Array.from(spansOpcode).map(span => span.textContent).join('');

        if (opcode.length === 6) {
            novoOpcode[instrucao] = opcode;
        }

        const spansFunct = colunas[3].querySelectorAll('span.bit');
        const funct = Array.from(spansFunct).map(span => span.textContent).join('');

        if (funct.length === 6) {
            novoFunct[instrucao] = funct;
        }
    });

    configOpcode = novoOpcode;
    configFunct = novoFunct;
    localStorage.setItem('ConfigOpcodes', JSON.stringify(configOpcode));
    localStorage.setItem('ConfigFunct', JSON.stringify(configFunct));
}
function save() {
    let repeatedFuncts = highlightDuplicateFuncts()
    let repeatedOpcodes = highlightDuplicateOpcodes();
    if(repeatedFuncts || repeatedOpcodes){
        alert('Há opcodes ou functs repetidos!');
        return;
    }
    if(highlightConflictingTypes()){
        alert('Opcodes conflitantes!');
        return;
    }
    saveConfigurations();
    alert('Configurações salvas!');
}

document.addEventListener('DOMContentLoaded', function () {
    loadTable();
    document.addEventListener('click', e => {
        if (e.target.classList.contains('bit')) {
            e.target.textContent = e.target.textContent === '0' ? '1' : '0'
        }
    })

    const botaoCopiar = document.querySelector('.copy');
    const conteudo = document.getElementById('copy-area');
    botaoCopiar.addEventListener('click', function () {
        const texto = conteudo.innerText;

        navigator.clipboard.writeText(texto)
            .catch(err => {
                console.error('Falha ao copiar para a área de transferência: ', err);
                alert('Erro ao copiar o conteúdo.');
            });
    });

});