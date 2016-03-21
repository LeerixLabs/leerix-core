
/**
 * Definition of the tokens
 * Token are define by regex, Type and a function that extract value
 */
let TokensType = [
    //Order Matters!
    [/^[ \t]*/, 'Space', (m)=>""],//will be ignore
    [/^\n/, 'Newline', (m)=>""],// will be ignore
    [/^(1)st|(2)nd|(3)rd|([0-9]+)th/i,'Order', (m)=>m[1]],
    [/^(small|medium|large)/i, 'Size', (m)=>m[0]],
    [/^(red|orange|yellow|green|blue|purple|pink|brown|black|white|gray)/i, 'Color', (m)=>m[0]],
    [/^(element|button|link|checkbox|label|image|panel|toolabr|tab)/i, 'Target', (m)=>m[0]],
    //TODO: remove the spaceing...
    [/^at[ \t\r\n]+the[ \t\r\n]+(top|bottom|middle)|on[ \t\r\n]+the[ \t\r\n]+(left|right|)/i, 'Position', (m)=>m[1]],
    [/^with/i, 'With', (m)=>m[1]],
    [/^(class|style|identity|tag|text|attribute)/i, 'WithEx', (m)=>m[1]],
    //TODO: support above of left of ....
    [/^(above|below|left|right|near|inside)/i, 'Relation', (m)=>m[1]],
    // String should be last!
    [/^"([^"]+)"|'([^']+)'|([0-9A-Za-z\-!@#]+)/i, 'String', (m)=>m.slice(1).filter((v)=>v)[0]]

];


export class Lexer{
    constructor(){
        "use strict";
    }
    /**
     * Tokenize the query into a stream of tokens
     *
     * @param query
     */
     * analyze(query){
        var curr = query;
        var row = 0;
        var column =0;
        while (curr.length > 0){
            var found = false;
            for (var t of TokensType){
                let match = t[0].exec(curr);
                if (match && match[0].length > 0){
                    let len = match[0].length;
                    curr = curr.slice(len);
                    if (t[1] === 'Newline'){
                        column = 0;
                        row +=1;
                    }else {
                        if (t[1] !== 'Space' && t[1] !== 'Newline') { //filter out space
                            yield new Token(t[1], match[0], t[2](match), new Span(row, column, len));
                        }
                        column += len;
                    }
                    found = true;
                    break;
                }
            }
            if (!found){
                throw new Error("Unexpected Token at:" + row+ ":" +column);
            }
        }
    }
}

/**
 * A Token
 */
export class Token{
    constructor(type, text, val, location){
        this.type = type;
        this.text = text;
        this.value = val;
        this.location = location;
    }
}

/**
 * A span of text in the query used by token
 */
export class Span{
    constructor(row, start, length){
        "use strict";
        this.row = row;
        this.start = start;
        this.end = start + length;
    }
}