const util = require("util");
var fs = require("fs");
var parseString = require("xml2js").parseString;
var zlib = require("zlib");
var zmq = require("zeromq");
var sock = zmq.socket("sub");

sock.connect("tcp://pubsub.besteffort.ndovloket.nl:7658");
sock.subscribe("/ARR/");
console.log("Subscriber connected to port 7658");

sock.on("message", function (topic, message) {
  console.log(
    "received a message related to:",
    topic.toString(),
    "containing message:",
    parseString(zlib.gunzipSync(message).toString(), function (err, result) {
if (result["VV_TM_PUSH"]["KV6posinfo"][0].INIT != undefined) {
      console.log(
        util.inspect(result["VV_TM_PUSH"]["KV6posinfo"][0].INIT, false, null, true)
      );
	fs.appendFile('arr.txt', JSON.stringify(result["VV_TM_PUSH"]["KV6posinfo"][0].INIT), 
	function(err) {
	if (err) throw err;
	console.log('Saved!');
    });
 
}
}))});
