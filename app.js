import log from "./utils/log.js";
log.inf("Loading packages and middleware...");

import express from "express"; 
import bodyParser from "body-parser";
import { dirname } from 'path';
import path from 'path';
import { fileURLToPath } from 'url';
import request from "./middleware/request.js";
import routing from "./middleware/routes.js";

log.inf("Configuring middleware...");

global.port = 8081;

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(request.cors);
app.enable("trust proxy");
app.use(express.static(path.join(__dirname, `dist`)));
app.use('/js', express.static(path.join(__dirname, 'dist/js')));
app.use('/css', express.static(path.join(__dirname, 'dist/css')));
app.use('/img', express.static(path.join(__dirname, 'dist/img')));
app.use('/assets', express.static(path.join(__dirname, 'dist/assets')));
app.use('/fonts', express.static(path.join(__dirname, 'dist/fonts')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(request.filterNonApiRequests(__dirname));

log.inf("Setting up routing...");
await routing.setUpRouting(app);

log.inf("App setup finish. Starting server...");
app.listen(global.port, _ => log.suc("Server running on port " + global.port));