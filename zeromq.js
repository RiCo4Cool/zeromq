require("dotenv").config();
var fs = require("fs");
var parseString = require("xml2js").parseString;
var zlib = require("zlib");
var zmq = require("zeromq");
var sock = zmq.socket("sub");
var moment = require("moment");
var init = [];
var kv17 = [];
var initToDB = {};

sock.connect("tcp://pubsub.besteffort.ndovloket.nl:7658");
sock.subscribe("/ARR/");
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
  const collection = client.db("Busoht").collection("oml");
  await collection.insertOne(JSON.parse(init));
  client.close();
}

setInterval(function oht() {
  if (init != undefined) {
    for (x = 0; x < init.length; x++) {
      // if (
      //   init[x]["lineplanningnumber"][0] == "23325" ||
      //   init[x]["lineplanningnumber"][0] == "23326" ||
      //   init[x]["lineplanningnumber"][0] == "23327" ||
      //   init[x]["lineplanningnumber"][0] == "23328" ||
      //   init[x]["lineplanningnumber"][0] == "23400"
      // ) {
      (initToDB =
        '{"operatingday": ' +
        JSON.stringify(init[x]["operatingday"][0]) +
        ", " +
        '"timestamp": ' +
        '"' +
        moment
          .utc(init[x]["timestamp"][0])
          .local()
          .format("YYYY-MM-DD HH:mm:ss") +
        '"' +
        ", " +
        '"lineplanningnumber": ' +
        JSON.stringify(init[x]["lineplanningnumber"][0]) +
        ", " +
        '"journeynumber": ' +
        JSON.stringify(init[x]["blockcode"][0]) +
        ", " +
        '"blockcode": ' +
        JSON.stringify(init[x]["blockcode"][0]) +
        ", " +
        '"vehiclenumber": ' +
        JSON.stringify(init[x]["vehiclenumber"][0]) +
        "}\n"),
        fs.appendFile("arr.txt", initToDB, (err) => {
          if (err) throw err;
        });
      updateDB(initToDB);
      init.splice(x, 1);
      // }
    }
  }
  if (kv17 != undefined && kv17 != "") {
    fs.appendFile("kv17.txt", JSON.stringify(kv17) + "\n", (err) => {
      if (err) throw err;
    });
    kv17 = "";
  }
}, 5000);

sock.on("message", function (topic, message) {
  parseString(zlib.gunzipSync(message).toString(), function (err, result) {
    if (err) throw err;

    if (
      result["VV_TM_PUSH"]["KV6posinfo"] != undefined &&
      result["VV_TM_PUSH"]["KV6posinfo"][0].INIT != undefined
    ) {
      for (x = 0; x < result["VV_TM_PUSH"]["KV6posinfo"][0].INIT.length; x++) {
        init.push(result["VV_TM_PUSH"]["KV6posinfo"][0].INIT[x]);
      }
    }
    if (result["VV_TM_PUSH"]["KV17cvlinfo"] != undefined) {
      kv17 = result["VV_TM_PUSH"]["KV17cvlinfo"];
    }
  });
});
