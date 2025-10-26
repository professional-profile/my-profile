import { Application, json, urlencoded } from "express"
import multer from "multer"
import { ApplicationContext } from "./context"

export * from "./context"

const parser = multer()

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
