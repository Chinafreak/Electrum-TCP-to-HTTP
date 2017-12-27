var express = require('express');
const ElectrumCli = require('electrum-client')
var app = express();

var bodyParser = require('body-parser')
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
  extended: false
}));

var argv = require('minimist')(process.argv.slice(2));
const publicIp = require('public-ip');

publicIp.v4().then(ip => {
  var electrumPort = argv.e_port || 50002;
  var electrumAddress = argv.e_ip || ip;
  var electrumProtocol = argv.e_protocol || "tls";
  var port = argv.port || 50003;


  const ecl = new ElectrumCli(electrumPort, electrumAddress, electrumProtocol);
  ecl.onClose(() => {
    console.log("closed");
  })
  ecl.onEnd(() => {
    console.log("end");
  })
  ecl.onError((e) => {
    console.log("error: " + JSON.stringify(e));
  })
  ecl.connect().then(() => {
    app.post('/', async(req, res) => {
      if (req.body.params == null) {
        req.body.params = [];
      }

      if (req.body.method == null) {
        res.send(JSON.stringify({
          "success": 0,
          "message": "Method is missing",
          "result": null
        }))
      }

      setTimeout(() => {
        try {
          res.send(JSON.stringify({
            "success": 0,
            "message": "Timeout - maybe method/params is wrong?",
            "result": null
          }))
        } catch (e) {}
      }, 5000);

      ecl.request(req.body.method, req.body.params).then(result => {
          res.send(JSON.stringify({
            "success": 1,
            "message": "",
            "result": result
          }));
        })
        .catch(e => {
          res.send(JSON.stringify({
            "success": 0,
            "message": e,
            "result": null
          }))
        });

    })

    app.use(function (err, req, res, next) {
      console.error(err.stack)
      res.status(500).send('Something is broken!')
    })

    var server = app.listen(port, function () {
      var host = server.address().address
      var port = server.address().port

      console.log("App listening at http://%s:%s", host, port)
    });
  })
});