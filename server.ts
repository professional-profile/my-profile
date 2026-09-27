import { merge } from "config-plus"
import cookieParser from "cookie-parser"
import dotenv from "dotenv"
import express from "express"
import { resources as expressResources, generateStarChips, generateTags } from "express-web-kit"
import http from "http"
import { createLogger } from "logger-core"
import nunjucks from "nunjucks"
import { Pool } from "pg"
import { datetimeToString } from "ui-formatter"
import { config, env } from "./config"
import { route, TokenVerifier } from "./service"
import { useContext } from "./service/context"
import { resources } from "./service/template"

dotenv.config()
const cfg = merge(config, process.env, env, process.env.ENV)

// buildJavascript()
// buildCSS()
expressResources.defaultLimit = 12

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

const verifier = new TokenVerifier("account", "accessToken", cfg.token.secret, cfg.token.expires, "rememberToken", cfg.rememberToken.secret)
app.use(cookieParser(), verifier.verify)

// const middleware = new MiddlewareLogger(logger.info, cfg.middleware)
// app.use(allow(conf.allow), json(), middleware.log)
// app.use(allow(conf.allow), json())

const pool = new Pool(cfg.db)

const ctx = useContext(pool, cfg)
route(app, ctx)

app.locals.datetimeToString = datetimeToString
app.locals.generateTags = generateTags
app.locals.generateStarChips = generateStarChips

http.createServer(app).listen(cfg.port, () => {
  console.log("Start server at port " + cfg.port)
})
