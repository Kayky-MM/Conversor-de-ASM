function generate() {
    const textArea = document.getElementById('codigo')
    const conteudo = textArea.value.trim().split(/\n+/).map(l => l.trim()).filter(l => l.length > 0)
    const output = document.querySelector('.show')
    if(conteudo.length === 0){
        output.innerHTML = ``;
        return;
    }
    output.innerHTML = `<div class="line1">v2.0 raw </div>`
    for (let i in conteudo) {
        let objectFile = assembler(conteudo[i])
        if(objectFile.success === true){
            output.innerHTML += `<div class="line${i%2}">${objectFile.getHex()} # ${objectFile.getOriginal()} ${objectFile.getBinary()}</div>`
        }else{
            output.innerHTML += `<div class = "line${i%2}">ERRO: ${objectFile.getMessage()}</div>`
            break;
        }
    }
}
function clearAll(){
    const textArea = document.getElementById('codigo')
    textArea.value = '';
    const output = document.querySelector('.show')
    output.innerHTML = '';
}
document.addEventListener('DOMContentLoaded', function () {
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