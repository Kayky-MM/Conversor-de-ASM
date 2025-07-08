class Instruction {
    #original;
    #binary;
    #hex;

    constructor(original, binary) {
        this.success = true
        this.#original = original;
        this.#binary = binary;
        this.#hex = hexadecimal(binary)
    }
    getBinary() {
        return this.#binary;
    }

    getHex() {
        return this.#hex;
    }

    getOriginal() {
        return this.#original;
    }
}

function type(opcode) {
    const r = [
        'add', 'sub', 'and', 'or', 'slt',
        'sll', 'srl','mul', 'div'
    ];

    const i = [
        'addi', 'subi', 'muli', 'divi', 'slti', 'lw', 'sw',
        'beq', 'bne', 'jr'
    ];

    const j = [
        'j', 'jal'
    ];
    if(r.includes(opcode))
        return 'r';
    if(i.includes(opcode))
        return 'i';
    if(j.includes(opcode))
        return 'j'
    return null
}
function extensor(im, bitWidth, typeI) {
    im = Number(im)
    if (isNaN(im)) {
        return null
    }
    switch (typeI) {
        case 'i':
            if (im < -32768 || im > 32767)
                return null
            break;
        case 'j':
            if (im < 0 || im > 2 ** 26 - 1)
                return null
            break;
        case 'r':
            if (im < 0 || im > 2 ** 5 - 1)
                return null
            break;
        default:
            return null
    }
    let v = Math.abs(im).toString(2)
    if (im < 0) {
        v = (im & ((1 << bitWidth) - 1)).toString(2)
    }
    return v.padStart(bitWidth, '0')
}

function compilerRInstruction(cluster) {
    let opcode = configOpcode[cluster.tokens[0]];
    let rs, rt, rd, shamt, fcode;
    let invalidRegs = []
    if (cluster.tokens[0] == 'sll' || cluster.tokens[0] == 'srl') {
        rs = register[cluster.tokens[1]] || registerN[cluster.tokens[1]];
        rt = register[cluster.tokens[2]] || registerN[cluster.tokens[2]];
        rd = '00000'
        shamt = extensor(cluster.tokens[3], 5, 'r')
        if(!rd) invalidRegs.push(cluster.tokens[1])
        if(!rt) invalidRegs.push(cluster.tokens[2])
    } else {
        rs = register[cluster.tokens[2]] || registerN[cluster.tokens[2]];
        rt = register[cluster.tokens[3]] || registerN[cluster.tokens[3]];
        rd = register[cluster.tokens[1]] || registerN[cluster.tokens[1]];
        shamt = '00000';
        if(!rs) invalidRegs.push(cluster.tokens[2])
        if(!rt) invalidRegs.push(cluster.tokens[3])
        if(!rd) invalidRegs.push(cluster.tokens[1])
    }
    fcode = configFunct[cluster.tokens[0]]
    if (invalidRegs.length > 0) {
        return {
            error: '01101',
            msg: `Registrador(es) inválido(s): ${invalidRegs.join(', ')}`
        }
    }
    if (!shamt) {
        return {
            error: '01110',
            msg: `Shamt inválido: "${cluster.tokens[3]}". Deve ser um valor entre 0 e 31`
        }
    }
    return new Instruction(cluster.originInstruction, opcode + rs + rt + rd + shamt + fcode)
}
function compilerIInstruction(cluster) {
    let opcode = configOpcode[cluster.tokens[0]]
    let rs, rt, immediate
    let invalidRegs = []
    if (cluster.tokens[0] == 'jr') {
        rs = register[cluster.tokens[1]] || registerN[cluster.tokens[1]]
        rt = '00000'
        immediate = extensor('0', 16, 'i')
        if(!rs) invalidRegs.push(cluster.tokens[1])
    } else if (cluster.tokens[0] == 'lw' || cluster.tokens[0] == 'sw') {
        rs = register[cluster.tokens[3]] || registerN[cluster.tokens[3]]
        rt = register[cluster.tokens[1]] || registerN[cluster.tokens[1]]
        immediate = extensor(cluster.tokens[2], 16, 'i')
        if(!rs) invalidRegs.push(cluster.tokens[3])
        if(!rt) invalidRegs.push(cluster.tokens[1])
    } else {
        rs = register[cluster.tokens[1]] || registerN[cluster.tokens[1]]
        rt = register[cluster.tokens[2]] || registerN[cluster.tokens[2]]
        immediate = extensor(cluster.tokens[3], 16, 'i')
        if(!rs) invalidRegs.push(cluster.tokens[1])
        if(!rt) invalidRegs.push(cluster.tokens[2])
    }
    if (invalidRegs.length > 0)
        return {
            error: '01101',
            msg: `Registrador(es) inválido(s): ${invalidRegs.join(', ')}`
        }
    if (!immediate) {
        const immToken = (cluster.tokens[0] == 'lw' || cluster.tokens[0] == 'sw') ? cluster.tokens[2] : cluster.tokens[3];
        return {
            error: '01111',
            msg: `Valor inválido para o imediato: "${immToken}"`
        }
    }
    return new Instruction(cluster.originInstruction, opcode + rs + rt + immediate)
}
function compilerJInstruction(cluster) {
    let opcode = configOpcode[cluster.tokens[0]]
    let label = extensor(cluster.tokens[1], 26, 'j')
    if (!label)
        return {
            error: '10000',
            msg: `Valor inválido para o label: "${cluster.tokens[1]}"`
        }
    return new Instruction(cluster.originInstruction, opcode + label)
}

function compiler(cluster) {
    let output
    switch (cluster.type) {
        case 'r':
            output = compilerRInstruction(cluster)
            break;
        case 'i':
            output = compilerIInstruction(cluster)
            break;
        case 'j':
            output = compilerJInstruction(cluster)
            break;
        default:
            output = {
                error: '10010',
                msg: `Instrução desconhecida: "${cluster.type}"`
            }
    }
    return output;
}

function hexadecimal(instrucao) {
    return parseInt(instrucao, 2).toString(16).padStart(8, '0')
}