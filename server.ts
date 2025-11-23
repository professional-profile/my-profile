import { merge } from "config-plus"
import cookieParser from "cookie-parser"
import dotenv from "dotenv"
import express from "express"
import { resources as exResources, MiddlewareLogger } from "express-ext"
import http from "http"
import { createLogger } from "logger-core"
import nunjucks from "nunjucks"
import { Pool } from "pg"
import { PoolManager } from "pg-extension"
import { datetimeToString } from "ui-formatter"
import { config, env } from "./config"
import { route, TokenVerifier } from "./service"
import { useContext } from "./service/context"
import { resources } from "./service/template"

dotenv.config()
const cfg = merge(config, process.env, env, process.env.ENV)

// buildJavascript()
// buildCSS()
exResources.defaultLimit = 24

const app = express()
// Define public folder :
app.use(express.static(__dirname + "/public"))
// Setup views folder :
app.set("views", __dirname + "/views")
// Setup view engine :
// Setting Nunjucks as default view
const nunjucksEnv = nunjucks.configure("views", {
  autoescape: false,
  express: app,
  noCache: false,
})
resources.nunjucks = nunjucksEnv
app.set("view engine", "html")

const logger = createLogger(cfg.log)
resources.log = logger.error

const verifier = new TokenVerifier(cfg.auth.token.secret, "account", "token")
app.use(cookieParser(), verifier.verify)

const middleware = new MiddlewareLogger(logger.info, cfg.middleware)
// app.use(allow(conf.allow), json(), middleware.log)
// app.use(allow(conf.allow), json())

const pool = new Pool(cfg.db)
const db = new PoolManager(pool)
const ctx = useContext(db, logger, middleware, cfg)
route(app, ctx)

app.locals.datetimeToString = datetimeToString

http.createServer(app).listen(cfg.port, () => {
  console.log("Start server at port " + cfg.port)
})
