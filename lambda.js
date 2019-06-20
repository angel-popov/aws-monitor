'use strict';
var http = require('https'); 

function cr(method, path,body) {
    return new Promise((resolve,reject) => {
        var options = {
            headers:{'authorization':'Bearer xxxxxxx'},
            method: method,
        };

        var req = http.request('https://nexmo-omni-channel.geeks-lab.net/cs'+path, options, res => {
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
    req.end();});
}

function errorDetected(err){
    console.error(err);
    return new Promise((resolve,reject)=>resolve(err));
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

function shouldContain(text){ return verify("there should be text '"+text+"'",contains (text))}
function shouldNotContain(text){ return verify('there should not be text "'+ text +'"', negate(contains (text)))}

module.exports.handler =  async (event, context, callback) => {
    return Promise.all([
        cr('GET','/api/application','')
            .then(shouldContain ("id"))
            .then(shouldNotContain("error")),
        cr('GET','/app/index.html','')
            .then(shouldContain("href=/cs/app/js/app"))
            .then(shouldNotContain("error")),
        cr('GET','/ump/index.html','')
            .then(shouldContain("href=/cs/ump/js/app"))
            .then(shouldNotContain("error"))
        ].map (p => p.catch(errorDetected))// without this, it will stop on first error
                      )
            ;
}