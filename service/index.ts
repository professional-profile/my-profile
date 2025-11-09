import { Application, json, NextFunction, Request, Response, urlencoded } from "express"
import { verify } from "jsonwebtoken"
import { ApplicationContext } from "./context"

export * from "./context"

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
          res.locals.userId = (decoded as any).id
          if ((decoded as any).username) {
            res.locals.username = (decoded as any).username
          }
          next()
        }
      })
    } else {
      next()
    }
  }
}

function checkAuthen(req: Request, res: Response, next: NextFunction) {
  const account = res.locals.account
  console.log(req.originalUrl)
  if (!account) {
    let url = req.url
    console.log("not log in " + url)
    if (url.startsWith("/")) {
      url = url.substring(1)
    }
    if (url === "") {
      return res.redirect(`login`)
    } else {
      return res.redirect(`login?redirectUrl=${url}`)
    }
  } else {
    next()
  }
}
function authorized(req: Request, res: Response, next: NextFunction) {
  const account = res.locals.account
  console.log(req.originalUrl)
  if (!account) {
    res.status(401).end("Require Authentication")
  } else {
    next()
  }
}
export function route(app: Application, ctx: ApplicationContext): void {
  app.get("/health", ctx.health.check)
  app.patch("/log", ctx.log.config)
  app.patch("/middleware", ctx.middleware.config)

  app.get("/login", ctx.signin.render)
  // app.post("/login", json(), parser.none(), ctx.login.submit)
  app.post("/login", urlencoded(), ctx.signin.submit)

  app.get("/signup", ctx.signup.render)
  app.post("/signup", json(), ctx.signup.submit)
  app.get("/verify-account/:id/:code", ctx.signup.verify)
  app.get("/forgot-password", ctx.password.renderForgotPassword)
  app.post("/forgot-password", json(), ctx.password.forgotPassword)
  app.get("/reset-password", ctx.password.renderResetPassword)
  app.post("/reset-password", json(), ctx.password.resetPassword)
  app.get("/change-password", ctx.password.renderChangePassword)
  app.post("/change-password", json(), ctx.password.changePassword)

  app.get("/my-profile", checkAuthen, ctx.menu.build, ctx.myProfile.view)
  app.post("/my-profile", authorized, ctx.menu.build, ctx.myProfile.submit)

  app.get("/settings", checkAuthen, ctx.menu.build, ctx.myProfile.viewSettings)
  app.post("/settings", authorized, ctx.menu.build, ctx.myProfile.saveSettings)

  app.get("/my-articles", checkAuthen, ctx.menu.build, ctx.myArticles.search)
  app.get("/my-articles/:id", checkAuthen, ctx.menu.build, ctx.myArticles.view)
  app.post("/my-articles/:id", authorized, ctx.menu.build, json(), ctx.myArticles.submit)

  app.get("/profiles", ctx.menu.build, ctx.user.search)
  app.get("/profiles/:id", ctx.menu.build, ctx.user.view)

  app.get("/news", ctx.menu.build, ctx.article.search)
  app.get("/news/:id", ctx.menu.build, ctx.article.view)

  app.get("/careers", ctx.menu.build, ctx.job.search)
  app.get("/careers/:id", ctx.menu.build, ctx.job.view)

  app.get("/", ctx.menu.build, ctx.content.view)
  app.get("/:id", ctx.menu.build, ctx.content.view)
  app.get("/:lang/:id", ctx.menu.build, ctx.content.view)
}
