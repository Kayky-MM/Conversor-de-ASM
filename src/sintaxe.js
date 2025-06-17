function checkPunctuationErrors(tokens, type) {
    const commaCount = tokens.filter(t => t === ',').length;
    const parenCount = tokens.filter(t => t === '(' || t === ')').length;
    if (tokens[0] === 'lw' || tokens[0] === 'sw') {
        if (parenCount < 2) return { error: '00011', msg: 'Falta de parêntese na instrução' };
        if (parenCount > 2) return { error: '00100', msg: 'Excesso de parênteses na instrução' };
        if (commaCount < 1) return { error: '00101', msg: 'Falta de vírgulas na instrução' };
        if (commaCount > 1) return { error: '00110', msg: 'Excesso de vírgulas na instrução' };
    } else if (type === 'j' || tokens[0] === 'jr') {
        if (parenCount !== 0 || commaCount !== 0) {
            return { error: '01000', msg: 'Parêntese e/ou vírgulas inesperados na instrução' };
        }
    } else if (type === 'r' || type === 'i') {
        if (parenCount !== 0) return { error: '00111', msg: 'Parêntese insesperado na instrução' };
        if (commaCount < 2) return { error: '00101', msg: 'Falta de vírgulas na instrução' };
        if (commaCount > 2) return { error: '00110', msg: 'Excesso de vírgulas na instrução' };
    }
    return null;
}

function numberOfArguments(tokens, form) {
    const argCount = tokens.filter(t => t.match(/^[-\w$]+$/)).length;
    const validArg = /^-?[a-zA-Z0-9$]+$/
    const expectedArgs = form.format.filter(f => f.toString() === validArg.toString()).length;
    if (argCount > expectedArgs) {
        return {
            error: '01001',
            msg: `Muitos argumentos para a instrução "${tokens[0]}"`
        }
    }
    if (argCount < expectedArgs) {
        return {
            error: '01010',
            msg: `Poucos argumentos para a instrução "${tokens[0]}"`
        }
    }
    return null;
}
function spellChecker(tokens, form, type) {
    const argsError = numberOfArguments(tokens, form)
    const punctuation = checkPunctuationErrors(tokens, type)
    if (argsError && punctuation) {
        const argsMsg = (argsError.msg.includes('Muitos')) ? 'Muitos' : 'Poucos';
        const punctuationMsg = punctuation.msg.replace('na instrução', '').toLowerCase();
        return {
            error: '10011',
            msg: `${argsMsg} argumentos e/ou ${punctuationMsg} na instrução "${tokens[0]}"`

        }
    }
    if (argsError)
        return argsError
    if (punctuation)
        return punctuation;
    for (let i = 1; i < form.args; i++) {
        if (!form.format[i].test(tokens[i])) {
                return {
                    error: '01011',
                    msg: `Vírgula e/ou parêntesis em posição inesperada`
                }
            
        }
    }
    return null;//se não houver erro, retorna null
}
function formatting(tokens, tokenFormat) {
    if (tokenFormat.args === 6) {//estrutura para i e r
        return `${tokens[0]} ${tokens[1]}, ${tokens[2]}, ${tokens[3]}`
    } else if (tokenFormat.args === 7) {//estrutura para lw e sw
        return `${tokens[0]} ${tokens[1]}, ${tokens[2]}(${tokens[3]})`
    } else {//estrutura para j e jr
        return `${tokens[0]} ${tokens[1]}`
    }
}

function validateTokens(tokens) {
    const validFormat = /^(-?\d+|\$[a-zA-Z0-9]+|,|\(|\))$/
    for(let i = 1; i < tokens.length; i++){//pula o primeiro token que é a instrução, pois já foi validado
        const token = tokens[i];
        if(!validFormat.test(token)){
            return {
                error: '10011',
                msg: `Elemento inválido na instrução: "${token}"`
            }
        }
    }
    return null;
}

function verifySyntax(instruction) {
    if (/[^a-zA-Z0-9$\s,()\-]/.test(instruction)) {
        return { error: '00001', msg: 'Caracteres inválidos encontrados na instrução' };
    }
    const tokens = instruction.toLowerCase().match(/[\w$-]+|[(),]/g)

    const op = tokens[0];
    const opcode = type(opcodes[op]);//função que retorna 'r', 'i' ou 'j'
    if (!opcode) {
        return { error: '00010', msg: `Instrução desconhecida: "${op}"` };
    }

    const validationError = validateTokens(tokens)
    if( validationError) {
        return validationError;
    }

    const regexes = {
        validArg: /^-?[a-zA-Z0-9$]+$/,//instruction, register or number
        comma: /^,$/,
        lparen: /^\($/,
        rparen: /^\)$/
    };
    const instructionFormats = {
        'r': { args: 6, format: [regexes.validArg, regexes.validArg, regexes.comma, regexes.validArg, regexes.comma, regexes.validArg] },
        'i': { args: 6, format: [regexes.validArg, regexes.validArg, regexes.comma, regexes.validArg, regexes.comma, regexes.validArg] },
        'jr': { args: 2, format: [regexes.validArg, regexes.validArg] },
        'j': { args: 2, format: [regexes.validArg, regexes.validArg] },
        'lw': { args: 7, format: [regexes.validArg, regexes.validArg, regexes.comma, regexes.validArg, regexes.lparen, regexes.validArg, regexes.rparen] },
        'sw': { args: 7, format: [regexes.validArg, regexes.validArg, regexes.comma, regexes.validArg, regexes.lparen, regexes.validArg, regexes.rparen] }
    };

    const tokenFormat = instructionFormats[op] || instructionFormats[opcode];
    const result = spellChecker(tokens, tokenFormat, opcode)

    if (result) {
        return result
    } else {
        const tokensFiltered = tokens.filter(token => !token.match(/[,()]/)).map(t => (!isNaN(Number(t))) ? `${Number(t)}` : t)//filtra números do tipo 012 para 12
        const originInstruction = formatting(tokensFiltered, tokenFormat)
        return {
            success: true,
            tokens: tokensFiltered,
            originInstruction: originInstruction,
            type: opcode
        }
    }
}

function assembler(code) {
    const syntaxResponse = verifySyntax(code)
    if (syntaxResponse.error) {
        return {
            success: false,
            getMessage: () => syntaxResponse.msg
        }
    }
    if (syntaxResponse.success) {

        const compilerResponse = compiler(syntaxResponse)
        if (compilerResponse.error) {
            return {
                success: false,
                getMessage: () => compilerResponse.msg
            }
        }
        return compilerResponse

    } else {
        return {
            success: false,
            getMessage: () => `Algum problema impediu a compilação`
        }
    }

}