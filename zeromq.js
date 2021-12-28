var fs = require("fs");
var parseString = require("xml2js").parseString;
var zlib = require("zlib");
var zmq = require("zeromq");
var sock = zmq.socket("sub");

sock.connect("tcp://pubsub.besteffort.ndovloket.nl:7658");
sock.subscribe("/ARR/");
console.log("Subscriber connected to port 7658");

sock.on("message", function (topic, message) {
  parseString(zlib.gunzipSync(message).toString(), function (err, result) {
    if (result["VV_TM_PUSH"]["KV6posinfo"][0].INIT != undefined) {
      for (x = 0; x < result["VV_TM_PUSH"]["KV6posinfo"][0].INIT.length; x++) {
        if (
          result["VV_TM_PUSH"]["KV6posinfo"][0].INIT[
            x
          ].lineplanningnumber[0].includes(
            "23325" || "23326" || "23327" || "23400"
          )
        ) {
          fs.appendFile(
            "arr.txt",
            "INIT: " +
              JSON.stringify(result["VV_TM_PUSH"]["KV6posinfo"][0].INIT[x]) +
              "\n",
            function (err) {
              if (err) throw err;
              console.log("Init Saved!");
            }
          );
        }

        if (result["VV_TM_PUSH"]["KV6posinfo"][0].END != undefined) {
          for (
            x = 0;
            x < result["VV_TM_PUSH"]["KV6posinfo"][0].END.length;
            x++
          ) {
            if (
              result["VV_TM_PUSH"]["KV6posinfo"][0].END[
                x
              ].lineplanningnumber[0].includes(
                "23325" || "23326" || "23327" || "23400"
              )
            ) {
              fs.appendFile(
                "arr.txt",
                "END: " +
                  JSON.stringify(
                    result["VV_TM_PUSH"]["KV6posinfo"][0].END[x]
                  ) +
                  "\n",
                function (err) {
                  if (err) throw err;
                  console.log("End Saved!");
                }
              );
            }
          }
        }
      }
    }
  });
});

