import { merge } from "config-plus"
import cookieParser from "cookie-parser"
import dotenv from "dotenv"
import express, { NextFunction, Request, Response } from "express"
import { MiddlewareLogger } from "express-ext"
import http from "http"
import { verify } from "jsonwebtoken"
import { createLogger } from "logger-core"
import nunjucks from "nunjucks"
import { Pool } from "pg"
import { PoolManager } from "pg-extension"
import { datetimeToString } from "ui-formatter"
import { config, env } from "./config"
import { route } from "./service"
import { useContext } from "./service/context"
import { resources } from "./service/template"

const prefix = "Bearer "

export class TokenVerifier {
  constructor(private secret: string, private account: string, private token: string) {
    this.verify = this.verify.bind(this)
  }

  verify(req: Request, res: Response, next: NextFunction) {
    let token: string | undefined
    if (req.cookies) {
      token = req.cookies[this.token]
      if (token) {
        console.log("Token from cookie: " + token)
      }
    }

    if (!token || token.length === 0) {
      let data = req.headers["authorization"]
      if (data && data.startsWith(prefix)) {
        token = data.substring(prefix.length)
        console.log("Token from bearer token: " + token)
      }
    }

    if (token && token.length > 0) {
      verify(token, this.secret, (err, decoded) => {
        if (err) {
          console.log("Token verification error: " + err.message)
          next()
        } else {
          console.log("Decoded token: " + JSON.stringify(decoded))
          res.locals[this.account] = decoded
          next()
        }
      })
    } else {
      next()
    }
  }
}

dotenv.config()
const cfg = merge(config, process.env, env, process.env.ENV)

// buildJavascript()
// buildCSS()

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
