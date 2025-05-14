function tipo(opcode) {
    if (opcode === "000000")
        return "r"
    if (opcode === "000110" || opcode === "001011" || opcode === "001100")
        return 'j'
    return "i"
}
function imediato(im, bitWidth) {
    v = Math.abs(+im).toString(2)
    extensor = ""
    for (let i = 0; i < bitWidth - v.length; i++)
        extensor += '0'
    v = extensor + v
    if (+im < 0) {
        v = (Math.pow(2, bitWidth) + Number(im)).toString(2)
        while (v.length < bitWidth) {
            v = '0' + v;
        }
    }
    return v
}
function compilador(codigo) {
    const tokens = codigo.split(/\s*,\s*|\s+|\(|\)/).filter(parte => parte != "");
    //console.log(tokens)
    let trecho = '', word, opcode
    for (let i in tokens) {
        if (!isNaN(Number(tokens[i]))) {
            word = imediato(tokens[i], (tipo(opcode) == 'i') ? 16 : 26)
        } else if (tokens[i].includes("$")) {
            word = register[tokens[i]]
        } else {
            word = opcodes[tokens[i]]
            opcode = word
            if (tipo(opcode) == 'r') {
                //console.log('antes', tokens)
                tokens.push(tokens.splice(1, 1)[0])
                //console.log('depois', tokens)
            } else if (tipo(opcode == 'i')) {
                //console.log('antes', tokens)
                let aux = tokens[1]
                tokens[1] = tokens[2]
                tokens[2] = aux
                //console.log('depois', tokens)
            }
            if (tokens[i] == 'lw' || tokens[i] == 'sw') {
                let temp = tokens[2]
                tokens[2] = tokens[3]
                tokens[3] = temp
                temp = tokens[1]
                tokens[1] = tokens[2]
                tokens[2] = temp
            }
        }
        //console.log(word)
        trecho = trecho + word
    }
    if (tipo(opcode) == 'r') {
        trecho = trecho + '00000' + funct[tokens[0]]
    }
    //console.log(trecho)
    return trecho
}
function hexadecimal(instrucao) {
    let n = parseInt(instrucao, 2).toString(16)
    while (n.length < 8)
        n = '0' + n
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

        navigator.clipboard.writeText(texto)/*
            .then(() => {
                //alert('Conteúdo copiado para a área de transferência!');
            })*/
            .catch(err => {
                console.error('Falha ao copiar para a área de transferência: ', err);
                alert('Erro ao copiar o conteúdo.');
            });
    });
});