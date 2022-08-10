const fs = require("fs")
const ytdl = require("ytdl-core")

ytdl("https://www.youtube.com/watch?v=pIwTFsUM-eA", {filter: "audio"}).pipe(fs.createWriteStream("output.mp3"))