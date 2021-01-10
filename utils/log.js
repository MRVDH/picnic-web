import fs from "fs";
import utils from "./utils.js";

export default {
    inf: (msg) => {
        console.log(utils.getTime() + ": %s", msg);
        fs.appendFile("log.txt", utils.getTime() + ": " + msg + "\r\n", (err) => { if (err) throw err; });
    },
    alt: (msg) => {
        console.log(utils.getTime() + ": " + utils.c.FgYellow + msg + utils.c.Reset);
        fs.appendFile("log.txt", utils.getTime() + ": " + msg + "\r\n", (err) => { if (err) throw err; });
    },
    suc: (msg) => {
        console.log(utils.getTime() + ": " + utils.c.FgGreen + msg + utils.c.Reset);
        fs.appendFile("log.txt", utils.getTime() + ": " + msg + "\r\n", (err) => { if (err) throw err; });
    },
    err: (msg, errs) => {
        console.log(utils.getTime() + ": " + utils.c.BgRed + msg + utils.c.Reset);
        fs.appendFile("log.txt", utils.getTime() + ": " + msg + "\r\n", (err) => { if (err) throw err; });
        if (errs.constructor === Array) {
            for (let err of errs) {
                console.log(err);
                fs.appendFile("log.txt", (typeof err === "object" ? JSON.stringify(err) : err) + "\r\n", (er) => { if (er) throw er; });
            }
        } else {
            console.log(errs);
            fs.appendFile("log.txt", (typeof errs === "object" ? JSON.stringify(errs) : errs) + "\r\n", (err) => { if (err) throw err; });
        }
        console.log(utils.getTime() + ": " + utils.c.BgRed + "end of error message." + utils.c.Reset);
    }
}