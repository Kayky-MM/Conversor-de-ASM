const defaultOpcodes = Object.freeze({
  add: "000000",
  sub: "000000",
  mul: "000000",
  div: "000000",
  and: "000000",
  or: "000000",
  slt: "000000",
  sll: "001101",
  srl: "001110",
  addi: "000001",
  subi: "000010",
  muli: "000011",
  divi: "000100",
  beq: "000101",
  lw: "000111",
  sw: "001000",
  bne: "001001",
  slti: "001010",
  jr: "001011",
  j: "000110",
  jal: "001100"
});
const register = Object.freeze({
  "$zero": "00000",
  "$at": "00001",
  "$v0": "00010",
  "$v1": "00011",
  "$a0": "00100",
  "$a1": "00101",
  "$a2": "00110",
  "$a3": "00111",
  "$t0": "01000",
  "$t1": "01001",
  "$t2": "01010",
  "$t3": "01011",
  "$t4": "01100",
  "$t5": "01101",
  "$t6": "01110",
  "$t7": "01111",
  "$s0": "10000",
  "$s1": "10001",
  "$s2": "10010",
  "$s3": "10011",
  "$s4": "10100",
  "$s5": "10101",
  "$s6": "10110",
  "$s7": "10111",
  "$t8": "11000",
  "$t9": "11001",
  "$k0": "11010",
  "$k1": "11011",
  "$gp": "11100",
  "$sp": "11101",
  "$fp": "11110",
  "$ra": "11111"
});
const registerN = Object.freeze({
  '$0': '00000',
  '$1': '00001',
  '$2': '00010',
  '$3': '00011',
  '$4': '00100',
  '$5': '00101',
  '$6': '00110',
  '$7': '00111',
  '$8': '01000',
  '$9': '01001',
  '$10': '01010',
  '$11': '01011',
  '$12': '01100',
  '$13': '01101',
  '$14': '01110',
  '$15': '01111',
  '$16': '10000',
  '$17': '10001',
  '$18': '10010',
  '$19': '10011',
  '$20': '10100',
  '$21': '10101',
  '$22': '10110',
  '$23': '10111',
  '$24': '11000',
  '$25': '11001',
  '$26': '11010',
  '$27': '11011',
  '$28': '11100',
  '$29': '11101',
  '$30': '11110',
  '$31': '11111'
});
const defaultFunct = Object.freeze({
  add: "000000",
  sub: "000001",
  mul: "000010",
  div: "000011",
  and: "000100",
  or: "000101",
  slt: "000110",
  sll: "000111",
  srl: "001000"
});
let configOpcode, configFunct;
const html = document.querySelector('html');
function restoreDefault(){
    configFunct = {...defaultFunct};
    configOpcode = {...defaultOpcodes};
    localStorage.removeItem('ConfigOpcodes');
    localStorage.removeItem('ConfigFunct');
}
function carregarDoLocalStorage() {
    const op = JSON.parse(localStorage.getItem('ConfigOpcodes'));
    const fn = JSON.parse(localStorage.getItem('ConfigFunct'));

    if (op && fn && Object.values(op).every(code => /^[01]{6}$/.test(code)) && Object.values(fn).every(code => /^[01]{6}$/.test(code))) {
        configOpcode = op;
        configFunct = fn;
    } else {
        restoreDefault();
    }
}

function setTheme(chosenTheme){
    if(chosenTheme === 'Tema claro'){
        document.getElementById('sun').classList.add('theme')
        document.getElementById('moon').classList.remove('theme')
        html.classList.remove('dark-mode')
    }else if(chosenTheme === 'Tema escuro'){
        document.getElementById('sun').classList.remove('theme')
        document.getElementById('moon').classList.add('theme')
        html.classList.add('dark-mode')
    }else{
        return;
    }
    document.getElementById('theme-button').title = chosenTheme;
    document.querySelector('.nav-3').innerHTML = chosenTheme;
}

function preferTheme(){
  const theme = localStorage.getItem('preferTheme')
  if(theme != null){
    setTheme(theme)
    return;
  }
  if(window.matchMedia("(prefers-color-scheme: dark)").matches){
    setTheme('Tema escuro')
  }else{
    setTheme('Thema claro')
  }
}
preferTheme();
carregarDoLocalStorage();