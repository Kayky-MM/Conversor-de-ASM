function tipo(opcode) {
    if (!opcode)
        return null
    switch (opcode) {
        case '000000':
        case "001101":
        case "001110":
            return 'r'
        case '000110':
        case '001011':
        case '001100':
            return 'j'
        default:
            return 'i'
    }
}

function bitWidth(tipo) {
    const r = { 'r': 5, 'i': 16, 'j': 26 }
    return r[tipo]
}

function imediato(im, bitWidth) {
    im = Number(im)
    let v = Math.abs(im).toString(2)
    //console.log(im, v, bitWidth)
    if (im < 0) {
        v = (Math.pow(2, bitWidth) + im).toString(2)
    }
    v = v.padStart(bitWidth, '0')
    //console.log(v)
    return v
}

function compilador(codigo) {
    const tokens = codigo.split(/\s*,\s*|\s+|\(|\)/).filter(parte => parte != "");
    let n = tokens.length
    //console.log('o array', tokens)
    let trecho = '', word, opcode = null
    for (let i in tokens) {
        type = tipo(opcode)
        if (!isNaN(Number(tokens[i]))) {
            let largura = bitWidth(type)
            word = imediato(tokens[i], largura)
        } else if (tokens[i].includes("$")) {
            word = register[tokens[i]] || registerN[tokens[i]]
            if (tokens[0] == 'jr')
                word = imediato(word, 26)
        } else {
            word = opcodes[tokens[i]]
            opcode = word
            type = tipo(opcode)
            if (type == 'i' || (tokens[i] == 'sll' || tokens[i] == 'slr')){
                //console.log('antes', tokens)
                let aux = tokens[1]
                tokens[1] = tokens[2]
                tokens[2] = aux
                //console.log('depois', tokens)
            } else if (tokens[i] == 'lw' || tokens[i] == 'sw') {
                let temp = tokens[2]
                tokens[2] = tokens[3]
                tokens[3] = temp
                temp = tokens[1]
                tokens[1] = tokens[2]
                tokens[2] = temp
            } else if (type == 'r') {
                //console.log('antes', tokens)
                tokens.push(tokens.splice(1, 1)[0])
                //console.log('depois', tokens)
            }
        }
        //console.log(word)
        trecho = trecho + word
    }
    if (tipo(opcode) == 'r') {
        if (tokens[0] == 'sll' || tokens[0] == 'slr') {
            trecho = trecho.slice(0, 16) + '00000' + trecho.slice(16)
        } else {
            trecho = trecho + '00000'
        }
        trecho = trecho + funct[tokens[0]]
    }
    //console.log(trecho)
    return trecho
}
function hexadecimal(instrucao) {
    let n = parseInt(instrucao, 2).toString(16).padStart(8, '0')
    return n
}
function gerar() {
    const textArea = document.getElementById('codigo')
    const conteudo = textArea.value.split(/\n+/)
    const output = document.querySelector('.show')
    const selected = document.getElementById('selected')
    output.innerHTML = ''
    for (let linha of conteudo) {
        linha = compilador(linha)
        output.innerHTML += ((selected.checked) ? hexadecimal(linha) : linha) + '<br>'
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const botaoCopiar = document.getElementById('copy-button');
    const conteudo = document.getElementById('copy');

    botaoCopiar.addEventListener('click', function () {
        const texto = conteudo.innerText;

        navigator.clipboard.writeText(texto)
            .catch(err => {
                console.error('Falha ao copiar para a área de transferência: ', err);
                alert('Erro ao copiar o conteúdo.');
            });
    });
});