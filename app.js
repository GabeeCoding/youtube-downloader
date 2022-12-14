const fs = require("fs")
const ytdl = require("ytdl-core")
const express = require("express");
const { randomUUID } = require("crypto");
const cp = require("child_process")
const ffmpeg = require("ffmpeg-static")
require("dotenv").config()

const app = express();

app.use((req, resp, next) => {
	resp.header("Access-Control-Allow-Origin", "*")
	resp.header("Access-Control-Allow-Headers", "*")
	if (req.method === 'OPTIONS') {
	    return resp.sendStatus(200);
	} else {
		return next();
	}
})

app.get("/", (req, resp) => {
	//send html file
	resp.sendFile(__dirname + "/storage/index.html")
});

function AreHeadersValid(headers){
	let valid = true
	headers.forEach((header) => {
		if(header === undefined){
			valid = false
		}
	})
	return valid
}

function getStream(url, options){
	let stream
	try {
		stream = ytdl(url, options)
	} catch(err) {
		console.log("Failed to download video: ")
		console.log(err)
	}
	return stream
}

app.get("/getUrl", async (req, resp) => {
	let headers = req.headers
	let url = headers.url
	let format = headers.format
	if(AreHeadersValid([url, format]) === false){
		resp.status(400).json({message: "Missing headers"});
		return
	}
	let title 
	try {
		title = (await ytdl.getInfo(url)).videoDetails.title
	} catch (e) {
		resp.status(400).json({message: "Invalid video url, failed"}).end()
		return
	}
	let fileName = randomUUID()

	if(format === "mp4"){
		//just download it nothing special
		let stream = getStream(url, {filter: "video"});
		if(stream === undefined){
			//stream failed
			resp.status(500).send(JSON.stringify({message: "Failed to download video"}));
			return
		}
		stream.pipe(fs.createWriteStream(`./storage/temp/${fileName}.mp4`));
		await new Promise((resolve, reject) => {
			stream.on('finish', resolve);
			stream.on('error', (err) => {
				reject(err);
			});
		});
		resp.send(JSON.stringify({url: `/temp/${fileName}.mp4`, title: title}));
	} else {
		//OUR CODE
		let videoPath = `./storage/temp/${fileName}.mp4`
		let audioPath = `./storage/temp/${fileName}.mp3`
		let stream = getStream(url, {quality: 'highestaudio'});
		if(stream === undefined){
			//stream failed
			resp.status(500).send(JSON.stringify({message: "Failed to download video"}));
			return
		}
		stream.pipe(fs.createWriteStream(videoPath));
		//wait for the file to finish downloading
		await new Promise((resolve, reject) => {
			stream.on('finish', resolve);
			stream.on('error', (err) => {
				reject(err);
			});
		});
		cp.execSync(`${ffmpeg} -loglevel 24 -i ${videoPath} -vn -sn -c:a mp3 -ab 192k ${audioPath}`);
		fs.rmSync(videoPath);
		resp.send(JSON.stringify({url: `/temp/${fileName}.mp3`, title: title}))
	}
})

//clear temp storage
fs.readdirSync(__dirname + "/storage/temp", {withFileTypes: true})
.forEach((ent) => {
	let n = ent.name
	if(n === "text.txt"){
		return
	}
	console.log(`Removing ${n.split(".")[1]} file`)
	fs.rm(`./storage/temp/${ent.name}`, () => {});
})

app.use(express.static("./storage"));

const port = process.env.PORT || 3000
app.listen(port, () => {
	console.log(`Listening on port ${port} (http://localhost:${port}) (http://${Object.values(require('os').networkInterfaces()).reduce((r, list) => r.concat(list.reduce((rr, i) => rr.concat(i.family==='IPv4' && !i.internal && i.address || []), [])), [])}:${port})`)
});
