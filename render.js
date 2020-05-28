const electron = require("electron").remote;
const { shell } = require('electron')
const { ipcRenderer } = require("electron");
const dialog = electron.dialog;
window.$ = window.jQuery = require("jquery");
window.Bootstrap = require("bootstrap");
const connectionWatch = require("./connection");
const database = require("./database");
const downloader = require('./downloader');
const url_regex = new RegExp(/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/, "gi");
const date_options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
var directory = "";
var max_connection = 0;
var is_there_any_active_download = false;

// --> DOM
const open_directory = (dir) => {
    shell.openPath(dir);
}

$(document).ready(
    () => {
        console.log("Coded by : <thel0ner /> https://github.com/thel0ner");
        connectionWatch($("#offline"));

        $("#download_report").hide();

        $(function () {
            $('[data-toggle="popover"]').popover()
        });

        $("#open_settings").on("click", () => {
            $("#settings").modal("show");
            var settings = database.getItem(0);
            if (settings !== null) {
                $("#useAxel").prop("checked", settings.useAxel);
                $("#maxSpeed").val(settings.maxSpeed);
                $("#maxConnection").val(settings.maxConnction);
                max_connection = settings.maxConnction;
            } else {
                $("#useAxel").prop("checked", true);
            }
        });

        $("#saveSettings").on("click", () => {
            database.setItem(0, {
                useAxel: $("#useAxel").prop("checked"),
                maxSpeed: $("#maxSpeed").val(),
                maxConnction: $("#maxConnection").val()
            });
            $("#settings").modal("hide");
        });

        $("#start_download").on("click", () => {
            if (is_there_any_active_download === false) {
                $("#new_download").modal("show");
            }
        });

        $("#customFile").on("click", (event) => {
            event.preventDefault();
            const path = dialog.showOpenDialogSync({
                properties: ['openDirectory']
            });
            directory = typeof path !== "undefined" && path[0].length > 1 ? path[0] : ""
            $("#customFileLabel").text(directory.length < 15 ? directory : directory.substr(0, 15) + "...");
        });

        $("#download_btn").on("click", () => {
            $("#serverError").hide();
            $("#download_panel_message").html("");
            $("#download_panel_message").hide();
            const check_url = url_regex.test($("#url").val());

            if (check_url === false) {
                $("#download_panel_message").append("<strong>Invalid URL.</strong><br /> Entered URL is not valid.<br />");
                $("#download_panel_message").show();
                return;
            }
            if (directory.length < 3) {
                $("#download_panel_message").append("<strong>Invalid Directory.</strong><br /> Please specify a directory to put the downloaded file in.");
                $("#download_panel_message").show();
                return;
            }
            if ($("#connection").val() > 0) {
                max_connection = Number($("#connection").val());
            }
            is_there_any_active_download = true;
            let filename = $("#url").val().split("?");
            filename.length > 0 ? filename = filename[0] : filename = filename;
            filename = filename.split("/");
            filename[filename.length - 1].length > 0 ? filename = filename[filename.length - 1] : filename = filename[filename.length - 2];
            $("#filename").html(`${decodeURIComponent(filename)}`);
            $("#new_download").modal("hide");
            $("#download_report").show();
            const start_time = new Date();
            downloader(
                directory,
                max_connection,
                $("#url").val(),
                filename,
                $("#download_progress")
            ).then(
                data => {
                    const end_time = new Date();
                    const total_time = end_time - start_time;
                    is_there_any_active_download = false;
                    $("#download_report").hide();
                    let downloads = database.getItem(1);
                    downloads = downloads === null ? [] : downloads;
                    const event = new Date();
                    downloads.push(
                        {
                            time: event.toLocaleDateString(undefined, date_options),
                            url: $("#url").val(),
                            dest: directory,
                            file_name: filename
                        }
                    );
                    database.setItem(1, downloads);
                    $("#download_report_title").html("Download completed");
                    let temp = `
                        File name : <strong>${decodeURIComponent(filename)}</strong><br />
                        Duration : <strong>${total_time / 1000} seconds</strong> <br />
                        Directory : <strong>${directory}</strong> <span class="btn btn-success btn-sm" id="open_directory">Open</span>
                    `;
                    $("#download_success_report").html(temp);
                    $("#download_completed").show();
                    $("#open_directory").on(
                        "click",
                        () => {
                            shell.openPath(directory);
                        }
                    )
                }
            ).catch(
                err => {
                    console.error(err);

                    const html = "<strong>Error!</strong><br />We couldn't download the file, server returned status " + err;
                    $("#serverError").html(html);
                    $("#download_report").hide();
                    $("#serverError").show();
                    is_there_any_active_download = false;
                }
            );
        });

        $("#open_archive").on("click", () => {
            $("#archive_content").html("");
            const archive = database.getItem(1);
            if (archive === null) {
                $("#archive_content").html("<strong>Archive is empty</strong><br /> you have not downloaded anything yet");
            } else {
                let c = 1;
                archive.reverse().forEach(
                    x => {
                        $("#archive_content").append("<div class=\"border-bottom-1 border-primary shadow-sm my-4\">");
                        $("#archive_content").append(`${c}) Name : <strong>${decodeURIComponent(x.file_name)}</strong> <br />`);
                        $("#archive_content").append(`Date : <strong>${x.time}</strong><br />`);
                        $("#archive_content").append(`URL : <strong>${x.url.substr(0, 15)} ...</strong>
                            <button class="btn btn-info btn-sm" onclick="navigator.clipboard.writeText('${x.url}')">Copy</button><br /> `);
                        $("#archive_content").append(`Downloaded in : <strong>${x.dest.substr(0,13)}...</strong> 
                        <button class="btn btn-info btn-sm" onclick="open_directory('${x.dest}')">Open directory</button>`);
                        $("#archive_content").append("</div>");
                        c++;
                    }
                );
            }
            $("#archives").modal("show");
        });
    }
);




// ------------------ > Handling updates.
var version = document.getElementById("version");
var message = $("#message");
var notification = $("#updateModal");
var restart_btn = $("#restart_btn");
function restartApp() {
    ipcRenderer.send('restart_app');
}
ipcRenderer.send('app_version');
ipcRenderer.on('app_version', (event, arg) => {
    ipcRenderer.removeAllListeners('app_version');
    let temp = `&copy; FDM version ${arg.version} , all rights reserved.`;
    document.getElementById("version").innerHTML = temp;

});

ipcRenderer.on('update_available', () => {
    ipcRenderer.removeAllListeners('update_available');
    message.innerText = 'A new update is available. Downloading now...';
    notification.modal("show");

});

ipcRenderer.on('update_downloaded', () => {
    ipcRenderer.removeAllListeners('update_downloaded');
    message.innerText = 'Update Downloaded. It will be installed on restart. Restart now?';
    restart_btn.show();
    notification.modal("show");
});
