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
        var html = `<html maaa=a>

        <head>
            <style>
               #container {
                    width: 500px;
                    height: 300px;
                    display: flex;
                    background-color: rgb(255,255,255);
                }
        
                #container #myid {
                    width: 200px;
                    height: 100px;
                    background-color: rgb(255,0,0);
                }
        
                #container .c1 {
                    flex:1;
                    background-color: rgb(0,255,0);
                }
            </style>
        </head>
        
        <body>
            <div id="container">
                <div id="myid"></div>
                <div class="c1"></div>
            </div>
        </body>
        </html>`;
        res.end(html);
    });
}).listen(80);
console.log("server started!");

