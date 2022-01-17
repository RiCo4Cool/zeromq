require("dotenv").config();
var fs = require("fs");
var parseString = require("xml2js").parseString;
var zlib = require("zlib");
const { MongoClient } = require("mongodb");
const util = require("util");
var zmq = require("zeromq");
var sock = zmq.socket("sub");
var moment = require("moment");
var SlackWebhook = require("slack-webhook");
var init = [];
var kv15 = [];
var kv17 = [];
var initToDB = {};
var messagetime;

sock.connect("tcp://pubsub.besteffort.ndovloket.nl:7658");
sock.subscribe("/ARR/");
console.log("Subscriber connected to port 7658");

async function updateDB(init, dbname) {
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
  const collection = client.db("Busoht").collection(dbname);
  await collection.insertOne(JSON.parse(init));
  client.close();
}

setInterval(function oht() {
  if (new Date().getTime() - messagetime.getTime() > 300000) {
    fs.appendFile(
      "heartbeat.txt",
      "{" +
        new Date().toString() +
        ", " +
        (new Date().getTime() - messagetime.getTime()).toString() +
        "}\n",
      (err) => {
        if (err) throw err;
      }
    );
  }
  if (init != undefined) {
    for (x = 0; x < init.length; x++) {
      if (
        init[x]["lineplanningnumber"][0] == "23325" ||
        init[x]["lineplanningnumber"][0] == "23326" ||
        init[x]["lineplanningnumber"][0] == "23327" ||
        init[x]["lineplanningnumber"][0] == "23328" ||
        init[x]["lineplanningnumber"][0] == "23400"
      ) {
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
          JSON.stringify(init[x]["journeynumber"][0]) +
          ", " +
          '"blockcode": ' +
          JSON.stringify(init[x]["blockcode"][0]) +
          ", " +
          '"reinforcementnumber": ' +
          JSON.stringify(init[x]["reinforcementnumber"][0]) +
          ", " +
          '"vehiclenumber": ' +
          JSON.stringify(init[x]["vehiclenumber"][0]) +
          "}\n"),
          fs.appendFile("arr.txt", initToDB, (err) => {
            if (err) throw err;
          });
        updateDB(initToDB, "oml");
        init = [];
      }
    }
  }
  if (kv17 != undefined && kv17.length > 0) {
    for (x = 0; x < kv17.length; x++) {
      if (
        kv17[x]["KV17JOURNEY"][0]["lineplanningnumber"][0] == "23325" ||
        kv17[x]["KV17JOURNEY"][0]["lineplanningnumber"][0] == "23326" ||
        kv17[x]["KV17JOURNEY"][0]["lineplanningnumber"][0] == "23327" ||
        kv17[x]["KV17JOURNEY"][0]["lineplanningnumber"][0] == "23328" ||
        kv17[x]["KV17JOURNEY"][0]["lineplanningnumber"][0] == "23400"
      ) {
        fs.appendFile("kv17.txt", JSON.stringify(kv17[x]) + "\n", (err) => {
          if (err) throw err;
        });
        updateDB('{"KV17JOURNEY":' + JSON.stringify(kv17[x]) + "}\n", "mut");
        var slack = new SlackWebhook(process.env.SLACKURL);
        slack
          .send(
            "https://drgl.nl/journey/ARR:" +
              kv17[x]["KV17JOURNEY"][0]["lineplanningnumber"][0] +
              ":" +
              kv17[x]["KV17JOURNEY"][0]["journeynumber"][0] +
              "/" +
              kv17[x]["KV17JOURNEY"][0]["operatingday"][0].replace(/-/g, "") +
              "/" +
              "\n" +
              JSON.stringify(kv17[x])
          )
          .catch(function (err) {
            console.log(err);
          });
      }
      fs.appendFile("kv17nl.txt", JSON.stringify(kv17[x]) + "\n", (err) => {
        if (err) throw err;
      });
      console.log(util.inspect(kv17[x], false, null, true));
    }
    kv17 = [];
  }

  if (kv15 != undefined && kv15.length > 0) {
    fs.appendFile("kv15.txt", JSON.stringify(kv15) + "\n", (err) => {
      if (err) throw err;
    });
    for (x = 0; x < kv15.length; x++) {
      updateDB('{"KV15messages":' + JSON.stringify(kv15[x]) + "}\n", "mess");
    }
    kv15 = [];
  }
}, 60000);

sock.on("message", function (topic, message) {
  messagetime = new Date();
  parseString(zlib.gunzipSync(message).toString(), function (err, result) {
    if (err) throw err;
    if (
      result["VV_TM_PUSH"] != undefined &&
      result["VV_TM_PUSH"]["KV6posinfo"] != undefined &&
      result["VV_TM_PUSH"]["KV6posinfo"][0].INIT != undefined
    ) {
      for (x = 0; x < result["VV_TM_PUSH"]["KV6posinfo"][0].INIT.length; x++) {
        init.push(result["VV_TM_PUSH"]["KV6posinfo"][0].INIT[x]);
      }
    }
    if (
      result["VV_TM_PUSH"] != undefined &&
      result["VV_TM_PUSH"]["KV17cvlinfo"] != undefined
    ) {
      for (x = 0; x < result["VV_TM_PUSH"]["KV17cvlinfo"].length; x++) {
        kv17.push(result["VV_TM_PUSH"]["KV17cvlinfo"][x]);
      }
    }
    if (
      result["VV_TM_PUSH"] != undefined &&
      result["VV_TM_PUSH"]["KV15messages"] != undefined
    ) {
      for (x = 0; x < result["VV_TM_PUSH"]["KV15messages"].length; x++) {
        kv15.push(result["VV_TM_PUSH"]["KV15messages"][x]);
        console.log(
          util.inspect(
            result["VV_TM_PUSH"]["KV15messages"][x],
            false,
            null,
            true
          )
        );
      }
    }
  });
});
