const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const request = require('request');

var server = app.listen(4002, () => console.log("Listening on Port 4002"));
app.use(bodyParser.urlencoded({extended: true}));

var hooks = [];

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
		res.end("Success");
	} else {
		res.end("Something is wrong with the Webhook URL");
	}
});

app.use("/read", (req, res) => {
	res.end(JSON.stringify(hooks));
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
				console.log(err);
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
			console.log(err);
			reject(err);
		}
		console.log(res.statusCode);
		code = res.statusCode;
		resolve(code);
	});

	});
}
