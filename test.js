
process.env.HFS = 'C:\\Program Files\\Side Effects Software\\Houdini 18.0.499'
process.env.PATH = 'C:\\Program Files\\Side Effects Software\\Houdini 18.0.499\\bin;'+process.env.PATH
//console.log(process.env)

const hapi = require('bindings')('hapi.node');

// console.log(hapi.test())

console.log("ok")