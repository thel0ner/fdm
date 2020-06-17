
const readline = require('readline');
const path = require('path');
const fs = require('fs');
const ytdl = require('ytdl-core');
module.exports = (url, dom, dir, mp3) => {
    return new Promise(
        (resolve, reject) => {
            dom.css("width", "0%");
            if (mp3 === true) {
                //not supported yet
            } else {
                const output = path.resolve(dir, 'video.mp4');
                const video = ytdl(url);
                let starttime;
                video.pipe(fs.createWriteStream(output));
                video.once('response', () => starttime = new Date.now());
                video.on('progress', (chunkLength, downloaded, total) => {
                    dom.css("width", downloaded * 100 / total + "%");
                });
                video.on('end', () => {
                    resolve(true);
                });
                video.on('error', (error) => {
                    reject(error)
                });
            }
        }
    );
};