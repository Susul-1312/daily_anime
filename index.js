const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const request = require('request');
const fs = require('fs');
const CronJob = require('cron').CronJob;

var distribution = new CronJob('0 0 * * * *', function() {
	const options = {
		url: "https://nekos.life/api/v2/img/neko",
		method: 'GET'
	};

	request(options, (err, res, body) => {
		if (err) {
			console.log(JSON.stringify(err, null, 4));
		}

		body = JSON.parse(body);

		console.log("Starting distribution of %s", body.url);
		distribute(body.url);

	});

});

var hooks = [];

fs.readFile('webhooks.json', (err, data) => {
	distribution.start();
	if (err) {
		console.log(JSON.stringify(err, null, 4));
		return err;
	}
	hooks = JSON.parse(data);
	console.log(hooks);
});

var server = app.listen(4002, () => console.log("Listening on Port 4002"));
app.use(bodyParser.urlencoded({extended: true}));

app.use(function (req, res, next) {
	console.log('Got Request, Time: %d, Path: %s', Date.now(), req.url);
	next();
})

app.use(express.static('public'));

app.use("/add", async (req, res) => {
	const webhook = req.body.webhook;

	if (hooks.includes(webhook)) {
		res.end("Webhook already added");
		return;
	}

	const code = await validate(webhook);
	console.log(code);
	if (code == 200) {
		hooks.push(webhook);
		write();
		res.end("Success");
	} else {
		res.end("Something is wrong with the Webhook URL");
	}
});

function distribute(img_url) {
	const message = {"content": null,"embeds": [{"color": null, "image": {"url": img_url}}]}

	hooks.forEach((webhook) => {
		const options = {
			url: webhook,
			json: true,
			body: message
		};

		request.post(options, (err, res, body) => {
			if (err) {
				console.log(JSON.stringify(err, null, 4));
			}
			console.log(`Status: ${res.statusCode}`);
			console.log(body);
			});
	});
}


function validate(webhook) {
	var code;
	const options = {
		url: webhook,
		method: 'GET'
	};

	return new Promise((resolve, reject) => {

	request(options, (err, res, body) => {
		if (err) {
			console.log(JSON.stringify(err, null, 4));
			reject(err);
		}
		console.log(res.statusCode);
		code = res.statusCode;
		resolve(code);
	});

	});
}

function write() {
	fs.writeFile('webhooks.json', JSON.stringify(hooks, null, 4), (err) => {
		if (err) throw err;
		console.log('Data written to file');
	});
}
