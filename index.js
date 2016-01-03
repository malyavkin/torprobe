"use strict";
var co = require('co');
var parser = require('configparser');
var WMIC = require('wmic-wrapper');
var _ = require('underscore');
var fs = require('fs');

function probe(){
    return new Promise((resolve,reject) => {
        co(function*(){
            let result = yield new WMIC().if("Name","tor.exe").get(['CommandLine']).run();
            if(result.length){
                let commandline =result[0].CommandLine;
                let torrc_finder = /--defaults-torrc\s+?"(.*?)"/g;
                let torrc = torrc_finder.exec(commandline)[1];
                fs.readFile(torrc,{encoding:"utf8"}, (err, data) =>{
                    if(err){
                        reject(err)
                    } else {
                        let conf = parser(data,"key_arguments","hash");
                        resolve(_.pick(conf,["SocksPort","ControlPort"]))
                    }
                });
            } else {
                reject('no processes found')
            }
        }).catch(x=>reject(x));
    });
}
module.exports=probe;

if(require.main === module) {
    co(function* () {
        let tor = yield probe();
        console.log(tor);
    }).catch(x=>console.log(x.stack));
}