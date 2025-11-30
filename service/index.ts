import { Application, json, NextFunction, Request, Response, urlencoded } from "express"
import { sign, verify } from "jsonwebtoken"
import { ApplicationContext } from "./context"

export * from "./context"

const prefix = "Bearer "
export class TokenVerifier {
  constructor(
    private account: string,
    private token: string,
    private secret: string,
    private expiresIn: number,
    private remember: string,
    private rememberSecret: string,
  ) {
    this.verify = this.verify.bind(this)
  }

  verify(req: Request, res: Response, next: NextFunction) {
    let token: string | undefined
    let remember: string | undefined
    if (req.cookies) {
      token = req.cookies[this.token]
      remember = req.cookies[this.remember]
      if (token) {
        console.log("Token from cookie " + token)
      }
      if (remember) {
        console.log("Remember from cookie " + remember)
      }
    }
    if (!token) {
      if (!remember) {
        next()
      } else {
        verify(remember, this.rememberSecret, (err2: any, decoded2: any) => {
          if (err2) {
            next()
          } else {
            console.log("Decoded remember not token " + JSON.stringify(decoded2))
            removeJWTFields(decoded2)
            const newToken = sign(decoded2, this.secret, { expiresIn: this.expiresIn })
            res.cookie(this.token, newToken, { httpOnly: true, secure: true, sameSite: "lax", maxAge: this.expiresIn })
            res.locals[this.account] = decoded2
            res.locals.userId = decoded2.id
            if (decoded2.username) {
              res.locals.username = decoded2.username
            }
            next()
          }
        })
      }
    } else {
      verify(token, this.secret, (err: any, decoded: any) => {
        if (err) {
          if (!remember) {
            next()
          } else {
            verify(remember, this.rememberSecret, (err2: any, decoded2: any) => {
              if (err2) {
                next()
              } else {
                console.log("Decoded remember token " + JSON.stringify(decoded2))
                removeJWTFields(decoded2)
                const newToken = sign(decoded2, this.secret, { expiresIn: this.expiresIn })
                res.cookie(this.token, newToken, { httpOnly: true, secure: true, sameSite: "lax", maxAge: this.expiresIn })
                res.locals[this.account] = decoded2
                res.locals.userId = decoded2.id
                if (decoded2.username) {
                  res.locals.username = decoded2.username
                }
                next()
              }
            })
          }
        } else {
          res.locals[this.account] = decoded
          res.locals.userId = decoded.id
          if (decoded.username) {
            res.locals.username = decoded.username
          }
          next()
        }
      })
    }
  }
}

function removeJWTFields(obj: any) {
  delete obj.iat
  delete obj.exp
}

function checkAuthen(req: Request, res: Response, next: NextFunction) {
  const account = res.locals.account
  if (!account) {
    let url = req.url
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
  app.get("/change-password", checkAuthen, ctx.menu.build, ctx.password.renderChangePassword)
  app.post("/change-password", authorized, ctx.menu.build, json(), ctx.password.changePassword)

  app.get("/my-profile", checkAuthen, ctx.menu.build, ctx.myProfile.view)
  app.get("/my-profile/interests", checkAuthen, ctx.myProfile.getInterests)
  app.get("/my-profile/interests_update", checkAuthen, ctx.myProfile.getInterestsUpdate)
  app.post("/my-profile", authorized, ctx.menu.build, json(), ctx.myProfile.submit)

  app.get("/settings", checkAuthen, ctx.menu.build, ctx.myProfile.viewSettings)
  app.post("/settings", authorized, ctx.menu.build, json(), ctx.myProfile.saveSettings)

  app.get("/my-articles", checkAuthen, ctx.menu.build, ctx.myArticles.search)
  app.get("/my-articles/:id", checkAuthen, ctx.menu.build, ctx.myArticles.view)
  app.post("/my-articles/:id", authorized, ctx.menu.build, json(), ctx.myArticles.submit)

  app.get("/profiles", ctx.menu.build, ctx.user.search)
  app.get("/profiles/:id", ctx.menu.build, ctx.user.view)
  app.patch("/profiles/:id", checkAuthen, ctx.user.follow)
  app.delete("/profiles/:id", checkAuthen, ctx.user.unfollow)

  app.get("/news", ctx.menu.build, ctx.article.search)
  app.get("/news/:id", ctx.menu.build, ctx.article.view)
  app.get("/saved-news", checkAuthen, ctx.menu.build, ctx.article.getSavedArticles)
  app.patch("/news/:id", checkAuthen, ctx.article.save)
  app.delete("/news/:id", checkAuthen, ctx.article.remove)

  app.get("/careers", ctx.menu.build, ctx.job.search)
  app.get("/careers/:id", ctx.menu.build, ctx.job.view)

  app.get("/", ctx.menu.build, ctx.content.view)
  app.get("/:id", ctx.menu.build, ctx.content.view)
  app.get("/:lang/:id", ctx.menu.build, ctx.content.view)
}
