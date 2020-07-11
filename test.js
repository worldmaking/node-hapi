const HFS = 'C:\\Program Files\\Side Effects Software\\Houdini 18.0.499'
// this is necessary in order that the module can find the Houdini dll libraries from the place it expects to:
process.env.PATH = `${HFS}\\bin;${process.env.PATH}`
// this might also be necessary at some point, I'm not sure:
//process.env.HFS = HFS

const hapi = require('bindings')('hapi.node');

console.log(hapi.test())
console.log("ok")