/**
 * parsing using state machine in html standard
 * https://html.spec.whatwg.org/#tokenization
**/

const EOF = Symbol("EOF");
let currentToken = null;
let stack = [{type:"document", children:[]}];
let currentTextNode = null;

function emit(token){
    let top = stack[stack.length-1];

    if (token.type === "startTag"){
        let element = {
            type: "element",
            children: [],
            attributes: []
        };
        element.tagName = token.tagName;

        for (let p in token){
            if (p !== "type" && p!= "tagName"){
                element.attributes.push({
                    name: p,
                    value: token[p]
                });
            }
        }
        top.children.push(element);
        element.parent = top;

        if (!token.isSelfClosing)
            stack.push(element);
        currentTextNode = null;
    }
    else if (token.type === "EndTag"){
        if (top.tagName != token.tagName){
            throw Error("Tag start and end does not match")
        }
        else {
            stack.pop();
        }
        currentTextNode = null;
    }
    else if (token.type === "text") {
        if (currentTextNode == null){
            currentTextNode = {
                type: "text",
                content: ""
            };
            top.children.push(currentTextNode);
        }
        currentTextNode += token.content;
    }
};

function data(c){
    if (c === '<'){
        return tagOpen;
    }
    else if (c === EOF){
        emit({
            type:"EOF"
        });
        return;
    }
    else {
        emit({
            type:"text",
            content: c
        });
        return data;
    }
}

function tagOpen(c){
    // </ end tag pattern
    if (c === '/'){
        return endTagOpen;
    }
    // any letters <a
    else if (c.match(/^[a-zA-Z]$/)) {
        currentToken = {
            type: "startTag",
            tagName : ""
        };
        return tagName(c);
    }
    else{
        return;
    }
}

function endTagOpen(c){
    if (c.match(/^[a-zA-Z]$/)){
        currentToken = {
            type: "EndTag",
            tagName : ""
        };
        return tagName(c);
    }
    else if (c === '>'){
    }
    else if (c === EOF){

    }
}

function tagName(c){
    // <html <insert attribute here>
    if (c.match(/^[\n\t\f ]$/)){
        return beforeAttributeName;
    }
    else if (c === '/'){
        return selfClosingTag;
    }
    else if (c.match(/^[a-zA-Z]$/)){
        currentToken.tagName += c.toLowerCase();
        return tagName;
    }
    else if (c === '>'){
        emit(currentToken);
        return data;
    }
    else{
        return tagName;
    }
}

//<html ...
function beforeAttributeName(c){
    if (c.match(/^[\n\t\f ]$/)){
        return beforeAttributeName;
    }
    else if (c === '>' || c === '/' || c=== EOF){
        return afterAttributeName(c);
    }
    else if (c === '='){
        // error
    }
    else {
        currentAttribute = {
            name:"",
            value:""
        }
        return attributeName(c);
    }
}

function attributeName(c){
    //<div class="abc"> 
    if (c.match(/^[/n/t/f ]$/) || c==='/' || c==='>' || c===EOF){
        return afterAttributeName(c);
    }
    else if (c === '='){
        return beforeAttributeValue; 
    }
    else if (c==='\u0000'){

    }
    else if (c==="\"" || c==="'" || c==="<"){

    }
    else {
        currentAttribute.name += c;
        return attributeName;
    }
}


function beforeAttributeValue(c){
    if (c.match(/^[/n/t/f ]$/) || c==='/' || c==='>' || c===EOF){
        return beforeAttributeValue;
    }
    else if (c==="\"")
        return doubleQuotedAttributeValue;
    else if (c==="\'")
        return singleQuotedAttributeValue;
    else if (c==='>'){
        //return data
    }
    else{
        return unquotedAttributeValue(c);
    }
}

function doubleQuotedAttributeValue(c){
    if (c==="\""){
        currentToken[currentAttribute.name] = currentAttribute.value;
        return afterQuotedAttributeValue;
    }
    else if (c==='\u0000'){

    }
    else if (c===EOF){

    }
    else{
        currentAttribute.value += c;
        return doubleQuotedAttributeValue;
    }
}

function singleQuotedAttributeValue(c){
    if (c==="\'"){
        currentToken[currentAttribute.name] = currentAttribute.value;
        return afterQuotedAttributeValue;
    }
    else if (c==='\u0000'){

    }
    else if (c===EOF){

    }
    else{
        currentAttribute.value += c;
        return singleQuotedAttributeValue;
    }
}

function unquotedAttributeValue(c){
    if (c.match(/^[/n/t/f ]$/) || c==='/' || c==='>' || c===EOF){
        currentToken[currentAttribute.name] = currentAttribute.value;
        return beforeAttributeValue;
    }
    else if (c==="/"){
        currentToken[currentAttribute.name] = currentAttribute.value;
        return selfClosingTag;
    }
    else if (c==='>'){
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(token);
        return data;
    }
    else if (c==='\u0000'){

    }
    else if (c==='\"' || c==="'" || c==="<" || c==="=" || c==="`"){

    }
    else if (c===EOF){

    }
    else{
        currentAttribute.value += c;
        return unquotedAttributeValue;
    }
}


function afterQuotedAttributeValue(c){
    if (c.match(/^[/n/t/f ]$/)){
        return beforeAttributeValue;
    }
    else if (c === '/'){
        return selfClosingTag;
    }
    else if (c === '>'){
        emit(currentToken);
        return data;
    }
    else if (c === EOF){

    }
    else {
        return beforeAttributeName(c);
    }
}
function selfClosingTag(c){
    if (c==='>'){
        currentToken.isSelfClosing = true;
        emit(currentToken);
        return data;
    }
    else if (c === "EOF"){

    }
    else {

    }
}



module.exports.parseHTML = function parseHTML(html){
    let state = data;

    for (let c of html){
        state = state(c);
    }
    //force to terminate
    state = state(EOF);
    return stack[0];
}