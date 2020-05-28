const multi_part_download = require('multipart-download');
const request = require("request");
const electron = require('electron');

const get_file_size = (path) => {
    return new Promise(
        (resolve, reject) => {
            request(
                {
                    url: path,
                    method: "HEAD"
                },
                (err, res, body) => {
                    if (err) {
                        reject(err);
                    }
                    if (res.statusCode !== 200) {
                        reject(res.statusCode);
                    } else {
                        resolve(res.headers["content-length"]);
                    }
                }
            );
        }
    );
}

module.exports = (dir, connections, url, file_name, progress_dom) => {
    return new Promise(
        (resolve, reject) => {
            get_file_size(url).then(data => {
                const whole_size = data;
                progress_dom.css("width", "0%");
                new multi_part_download().start(
                    url,
                    {
                        numOfConnections: connections,
                        saveDirectory: dir,
                        fileName: decodeURIComponent(file_name)
                    }
                )
                    .on('error', (error) => {
                        reject(error);
                    })
                    .on('data', (data, offset) => {
                        progress_dom.css("width", offset * 100 / whole_size + "%");
                    })
                    .on('end', (file_path) => {
                        resolve(file_path);
                    });
            }).catch(err => reject(err));
        }
    );
}