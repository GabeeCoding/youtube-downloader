const fs = require("fs")
const ytdl = require("ytdl-core")
const express = require("express");
const { randomUUID } = require("crypto");
const cp = require("child_process")
const ffmpeg = require("ffmpeg-static")
const path = require("path")

const app = express();

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

function getVideoTitle(videoUrl){
	return new Promise ((resolve, reject) => {
	   ytdl.getBasicInfo (videoUrl, (err, info) => {
			resolve (info.title)
	   })
	})
}

app.get("/getUrl", async (req, resp) => {
	let headers = req.headers
	let url = headers.url
	let format = headers.format
	if(AreHeadersValid([url, format]) === false){
		resp.status(400).send("Missing headers");
		return
	}
	let title = (await ytdl.getInfo(url)).videoDetails.title
	//before we download it
	//validate the url lazily
	///How?
	//The URL needs to start with https://
	
	let fileName = randomUUID()

	if(format === "mp4"){
		//just download it nothing special
		let stream = ytdl(url, {filter: "video"})
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
		let stream = ytdl(url, {quality: 'highestaudio'})
		.pipe(fs.createWriteStream(videoPath));
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
fs.readdirSync("./storage/temp", {withFileTypes: true})
.forEach((ent) => {
	let n = ent.name
	console.log(`Removing ${n.split(".")[1]} file`)
	fs.rm(`./storage/temp/${ent.name}`, () => {});
})

app.use(express.static("./storage"));

const port = process.env.PORT || 3000
app.listen(port, () => {
	console.log(`Listening on port ${port}`)
});