require("dotenv").config();
var fs = require("fs");
var parseString = require("xml2js").parseString;
var zlib = require("zlib");
var zmq = require("zeromq");
var sock = zmq.socket("sub");
var init = [];

sock.connect("tcp://pubsub.besteffort.ndovloket.nl:7658");
sock.subscribe("/ARR/KV6posinfo");
console.log("Subscriber connected to port 7658");

async function updateDB(init) {
  const { MongoClient } = require("mongodb");
  const uri =
    "mongodb+srv://" +
    process.env.DB_NAME +
    ":" +
    process.env.DB_PASSW +
    "@cluster0.e56ou.mongodb.net/Busoht?retryWrites=true&w=majority";
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await client.connect();
  console.log("ingelogd in DB");
  const collection = client.db("Busoht").collection("oml");
  // perform actions on the collection object
  await collection.insertOne(
    init
    // { $set: { barcode: barcode, product: "productname" } }
  );
  client.close();
}

setInterval(function oht() {
  if (init != undefined) {
    for (x = 0; x < init.length; x++) {
      if (
        init[x]["lineplanningnumber"][0] == "23325" ||
        init[x]["lineplanningnumber"][0] == "23326" ||
        init[x]["lineplanningnumber"][0] == "23327" ||
        init[x]["lineplanningnumber"][0] == "23328" ||
        init[x]["lineplanningnumber"][0] == "23400"
      ) {
        fs.appendFile("arr.txt", JSON.stringify(init[x]) + "\n", (err) => {
          if (err) throw err;
        });
        console.log(init[x]);
        updateDB(init[x]);
        init.splice(x, 1);
      }
    }
  }
}, 5000);

sock.on("message", function (topic, message) {
  parseString(zlib.gunzipSync(message).toString(), function (err, result) {
    if (err) throw err;

    if (result["VV_TM_PUSH"]["KV6posinfo"][0].INIT != undefined) {
      for (x = 0; x < result["VV_TM_PUSH"]["KV6posinfo"][0].INIT.length; x++) {
        init.push(result["VV_TM_PUSH"]["KV6posinfo"][0].INIT[x]);
      }
      //       for (x = 0; x < result["VV_TM_PUSH"]["KV6posinfo"][0].INIT.length; x++) {
      //         var compare =
      //           result["VV_TM_PUSH"]["KV6posinfo"][0].INIT[x].lineplanningnumber[0];
      //         if (
      //           compare == "23325" ||
      //           compare == "23326" ||
      //           compare == "23327" ||
      //           compare == "23400" ||
      // compare == "23328"
      //         ) {
      //           fs.appendFile(
      //             "arr.txt",
      //             "INIT: " +
      //               JSON.stringify(result["VV_TM_PUSH"]["KV6posinfo"][0].INIT[x]) +
      //               "\n",
      //             function (err) {
      //               if (err) throw err;
      //               console.log("Init Saved!");
      //             }
      //           );
      //         }

      //         if (result["VV_TM_PUSH"]["KV6posinfo"][0].END != undefined) {
      //           for (
      //             x = 0;
      //             x < result["VV_TM_PUSH"]["KV6posinfo"][0].END.length;
      //             x++
      //           ) {
      //             var compare =
      //               result["VV_TM_PUSH"]["KV6posinfo"][0].END[x]
      //                 .lineplanningnumber[0];
      //             if (
      //               compare == "23325" ||
      //               compare == "23326" ||
      //               compare == "23327" ||
      //               compare == "23400" ||
      //           compare == "23328"
      //             ) {
      //               fs.appendFile(
      //                 "arr.txt",
      //                 "END: " +
      //                   JSON.stringify(result["VV_TM_PUSH"]["KV6posinfo"][0].END[x]) +
      //                   "\n",
      //                 function (err) {
      //                   if (err) throw err;
      //                   console.log("End Saved!");
      //                 }
      //               );
      //             }
      //           }
      //         }
      //       }
    }
  });
});
