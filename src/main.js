function formateLine(instructionString) {
    const regex = /(\$[a-zA-Z0-9]+)|(-?\b\d+\b)|(\b[a-zA-Z]+\b)|([\s.,()]+)/g;
    return instructionString.replace(regex, (match, registerMatch, numberMatch, wordMatch, punctuationOrSpaceMatch) => {
        if (registerMatch) {
            return `<span class="register">${registerMatch}</span>`;
        } else if (numberMatch) {
            return `<span class="number">${numberMatch}</span>`;
        } else if (wordMatch) {
            return `<span class="instrucao">${wordMatch}</span>`;
        } else if (punctuationOrSpaceMatch) {
            return punctuationOrSpaceMatch;
        }
        return match;
    });
}

function generate() {
    const textArea = document.getElementById('codigo')
    const conteudo = textArea.value.trim().split(/\n+/).map(l => l.trim()).filter(l => l.length > 0)
    const output = document.querySelector('.show')
    if (conteudo.length === 0) {
        output.innerHTML = ``;
        return;
    }
    output.innerHTML = `<div class="line">v2.0 raw </div>`
    for (const line of conteudo) {
        let objectFile = assembler(line)
        if (objectFile.success === true) {
            output.innerHTML += `<div class="line">
            <span class="binary">${objectFile.getHex()}</span> # ${formateLine(objectFile.getOriginal())} 
            <span class="binary">${objectFile.getBinary()}</span>
            </div>`
        } else {
            output.innerHTML += `<div class = "line error">ERRO: ${objectFile.getMessage()}</div>`
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
    const helpModal = document.getElementById('helpModal');
    const configModal = document.getElementById('configModal');
    const buttonGroup = document.querySelector('.button-group');
    if (configModal.style.display === 'none') {
        editArea.style.display = 'none';
        configArea.style.display = 'none';
        buttonGroup.style.display = 'none';
        helpModal.style.display = 'none';
        loadTable();
        configModal.style.display = 'block';
    } else {
        editArea.style.display = 'flex';
        configArea.style.display = 'flex';
        buttonGroup.style.display = 'flex';
        configModal.style.display = 'none';
    }
}
function toggleHelp() {
    const configArea = document.querySelector('.config-area');
    const editArea = document.querySelector('.edit-area');
    const helpModal = document.getElementById('helpModal');
    const configModal = document.getElementById('configModal');
    const buttonGroup = document.querySelector('.button-group');
    if (helpModal.style.display === 'none') {
        editArea.style.display = 'none';
        configArea.style.display = 'none';
        buttonGroup.style.display = 'none';
        configModal.style.display = 'none';
        helpModal.style.display = 'block';
    } else {
        editArea.style.display = 'flex';
        configArea.style.display = 'flex';
        buttonGroup.style.display = 'flex';
        configModal.style.display = 'none';
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
function restore() {
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
        tdOpcode.classList.remove('conflict')
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
                td.classList.add('conflict')
            });
        }
    });
    return repeated;
}

function highlightDuplicateOpcodes() {
    const opcodeSpans = Array.from(document.querySelectorAll('td:nth-child(3)')).filter(td => td.parentElement.children[1].textContent.trim() !== 'R');
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
    if (repeatedFuncts || repeatedOpcodes) {
        alert('Há opcodes ou functs repetidos!');
        return;
    }
    if (highlightConflictingTypes()) {
        alert('Opcodes conflitantes!');
        return;
    }
    saveConfigurations();
    alert('Configurações salvas!');
}

function toggleNav() {
  document.querySelector('.nav-bar').classList.toggle('open');
}

function changeTheme() {
    const moon = document.getElementById('moon')
    moon.classList.toggle('theme')
    document.getElementById('sun').classList.toggle('theme')
    document.getElementById('theme-button').title = (moon.classList.contains('theme')) ? 'Tema claro' : 'Tema escuro'
    document.querySelector('.nav-3').innerHTML = (moon.classList.contains('theme')) ? 'Tema claro' : 'Tema escuro';
    document.querySelector('html').classList.toggle('dark-mode');
}

function rearrangeMobile() {
    const container = document.querySelector('.container');
    const configArea = document.querySelector('.config-area');
    const buttonGroup = document.querySelector('.button-group');
    const rightSide = document.querySelector('.right-side');
    if (window.innerWidth <= 426 ) {
        if (configArea.nextElementSibling !== buttonGroup) {
            container.insertBefore(buttonGroup, configArea.nextElementSibling);
        }
    }else{
        if(configArea.nextElementSibling === buttonGroup) {
            rightSide.appendChild(buttonGroup);
        }
    }
}

let timeoutId;
window.addEventListener('resize', () => {
  clearTimeout(timeoutId);
  timeoutId = setTimeout(rearrangeMobile, 100);
});
document.addEventListener('DOMContentLoaded', function () {
    rearrangeMobile();
    loadTable();
    document.addEventListener('click', e => {
        if (e.target.classList.contains('bit')) {
            e.target.textContent = e.target.textContent === '0' ? '1' : '0'
        }
    })
    const botaoCopiar = document.querySelector('.copy');
    const conteudo = document.getElementById('copy-area');
    botaoCopiar.addEventListener('click', function () {
        const texto = conteudo.innerText.trim();
        if(!texto || texto.includes('ERRO')) {
            return;
        }
        navigator.clipboard.writeText(texto)
            .catch(err => {
                console.error('Falha ao copiar para a área de transferência: ', err);
                alert('Erro ao copiar o conteúdo.');
            });
        alert('Conteúdo copiado para a área de transferência!');
    });

});