'use strict';
var http = require('https'); 

function cr(method, path,body,host) {
    if (host==undefined){
        host = 'https://nexmo-omni-channel.geeks-lab.net/cs'
    }
    return new Promise((resolve,reject) => {
        var options = {
            headers:{'authorization':'Bearer MDczMjdhMmU6MzNmM2IyOWM2YmZiOThlZQ==',
                     'content-type':'application/json'
            },
            method: method,
        };

        var req = http.request(host+path, options, res => {
            res.setEncoding('utf8');
            var responseString = "";
            res.on('error', err => {
                reject(err);
            });
        
            //accept incoming data asynchronously
            res.on('data', chunk => {
                responseString = responseString + chunk;
            });
        
            //return the data when streaming is complete
            res.on('end', () => {
                //console.log(responseString);
                resolve( responseString);
            });

    });
 
    //console.log("sending body "+body); 
    req.write(body);
    req.end();
        
    });
}

function errorDetected(err){
    console.error(err);
    return new Promise((resolve,reject)=>resolve(err));
}

function failOnFailedValidation(res){
    if (res.filter(contains("Failed validation:")).length > 0){
        throw new Error(res);
    } else return res;
}

function negate (predicateFunc) {
    return function () {
        return !predicateFunc.apply(this, arguments);
    };
}

function contains(item){    return (text) => {return text.toLowerCase().indexOf(item.toLowerCase())> -1;}}
function verify(description,validate){
    return (text) => new Promise((resolve,reject) => {
        if (validate (text)) {resolve(text);} 
        else {reject("Failed validation:" + description + " - "+text)}
        });
}

function shouldContain(descr,text){ return verify(descr+": there should be text '"+text+"'",contains (text))}
function shouldNotContain(descr,text){ return verify(descr+': there should not be text "'+ text +'"', negate(contains (text)))}

module.exports.handler =  async (event, context, callback) => {
    return Promise.all([
        cr('POST','/ni/advanced/json',JSON.stringify({"api_key":"07327a2e","api_secret":"33f3b29c6bfb98ee","number":"359899041699"}),"https://api.nexmo.com")
            .then(shouldContain ("Connect to nexmo","does not have sufficient credit"))
            .then(shouldNotContain("Connect to nexmo","error")),
        cr('GET','/api/application','')
            .then(shouldContain ("Get applications request","id"))
            .then(shouldNotContain("Get applications request","error")),
        cr('POST','/api/application',
                JSON.stringify({"defaultPassword":"defaultPass","name":"test",
                "capabilities":{"voice":{"webhooks":{"eventUrl":{"httpMethod":"POST","address":"http://eventurl"},
                "answerUrl":{"httpMethod":"POST","address":"http://answerurl"}}}}}))
            .then(shouldContain ("Create application","id"))
            .then(shouldNotContain("Create application","error")),
            
        cr('GET','/app/index.html','')
            .then(shouldContain("Get web app","href=/cs/app/js/app"))
            .then(shouldNotContain("Get web app","error")),
        cr('GET','/ump/index.html','')
            .then(shouldContain("Get web ump","href=/cs/ump/js/app"))
            .then(shouldNotContain("Get web ump", "error"))
        ].map (p => p.catch(errorDetected))// without this, it will stop on first error
                        ).then(failOnFailedValidation)
        
            ;
}
