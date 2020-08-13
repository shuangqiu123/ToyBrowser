const http = require('http');

http.createServer((req,res)=>{
    let body=[];
    req.on('error', (err)=>{
        console.log(err);
    }).on('data', (chunk) =>{
        body.push(chunk.toString());
    }).on('end', ()=>{
        tmp = [];
        for (var i of body){
            tmp.push(Buffer.from(i));
        }
        body = Buffer.concat(tmp).toString();
        console.log("body:",body);
        res.writeHead(200, {"Content-type":'text/html'});
        var html = `<html>\n    <head class="dada">\n    </head>\n <body>\n      <h1>Hello World!</h1>\n   </body>\n</html>`;
        res.end(html);
    });
}).listen(80);

console.log("server started!");