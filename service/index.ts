import { Application, json, NextFunction, Request, Response, urlencoded } from "express"
import { sign, verify } from "jsonwebtoken"
import { ApplicationContext } from "./context"

export * from "./context"
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
    }
    if (!token) {
      if (!remember) {
        next()
      } else {
        verify(remember, this.rememberSecret, (err2: any, decoded2: any) => {
          if (err2) {
            next()
          } else {
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

  app.get("/skills", authorized, ctx.skill.query)
  app.get("/interests", authorized, ctx.interest.query)
  app.get("/my-profile", checkAuthen, ctx.menu.build, ctx.myProfile.view)
  app.get("/my-profile/info", authorized, ctx.myProfile.getInfo)
  app.get("/my-profile/info_update", authorized, ctx.myProfile.getInfoUpdate)
  app.get("/my-profile/bio", authorized, ctx.myProfile.getBio)
  app.get("/my-profile/bio_update", authorized, ctx.myProfile.getBioUpdate)
  app.get("/my-profile/skills", authorized, ctx.myProfile.getSkills)
  app.get("/my-profile/skills_update", authorized, ctx.myProfile.getSkillsUpdate)
  app.get("/my-profile/interests", authorized, ctx.myProfile.getInterests)
  app.get("/my-profile/interests_update", authorized, ctx.myProfile.getInterestsUpdate)
  app.get("/my-profile/achievements", authorized, ctx.myProfile.getAchievements)
  app.get("/my-profile/achievements_update", authorized, ctx.myProfile.getAchievementsUpdate)
  app.get("/my-profile/skills_update", authorized, ctx.myProfile.getSkillsUpdate)
  app.post("/my-profile", authorized, ctx.menu.build, json(), ctx.myProfile.submit)

  app.get("/settings", checkAuthen, ctx.menu.build, ctx.myProfile.viewSettings)
  app.post("/settings", authorized, ctx.menu.build, json(), ctx.myProfile.saveSettings)

  app.get("/my-articles", checkAuthen, ctx.menu.build, ctx.myArticles.search)
  app.get("/my-articles/:id", checkAuthen, ctx.menu.build, ctx.myArticles.view)
  app.post("/my-articles/:id", authorized, ctx.menu.build, json(), ctx.myArticles.submit)

  app.get("/profiles", ctx.menu.build, ctx.user.search)
  app.get("/profiles/:id", ctx.menu.build, ctx.user.view)
  app.get("/profiles/:id/followers", ctx.menu.build, ctx.user.getFollowers)
  app.get("/profiles/:id/following", ctx.menu.build, ctx.user.getFollowing)
  app.patch("/profiles/:id", authorized, ctx.user.follow)
  app.delete("/profiles/:id", authorized, ctx.user.unfollow)

  app.get("/news", ctx.menu.build, ctx.article.search)
  app.get("/news/:id", ctx.menu.build, ctx.article.view)
  app.get("/news/:id/review", ctx.menu.build, ctx.article.review)
  app.post("/news/:id/review", authorized, json(), ctx.article.rate)
  app.get("/saved-news", checkAuthen, ctx.menu.build, ctx.article.getSavedArticles)
  app.patch("/news/:id", authorized, ctx.article.save)
  app.delete("/news/:id", authorized, ctx.article.remove)

  app.get("/jobs", ctx.menu.build, ctx.job.search)
  app.get("/jobs/:id", ctx.menu.build, ctx.job.view)

  app.get("/", ctx.menu.build, ctx.content.view)
  app.get("/:id", ctx.menu.build, ctx.content.view)
  app.get("/:lang/:id", ctx.menu.build, ctx.content.view)
}
