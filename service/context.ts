import { Authenticator, initializeStatus, SqlAuthTemplateConfig, Token, useUserRepository } from "authen-service"
import { compare } from "bcrypt"
import { Comparator } from "bcrypt-plus"
import { MenuBuilder, MenuItemLoader } from "content-menu"
import { HealthController, ItemController, Logger, resources } from "express-ext"
import { nanoid } from "nanoid"
import { MailConfig, MailData, StringMap } from "onecore"
import { MailSender, PasswordService, PasswordTemplateConfig, usePasswordRepository } from "password-service"
import { CodeRepository, StringService } from "pg-extension"
import { createChecker, DB } from "query-core"
import { initStatus, Signup, SignupSender, SignupService, SignupTemplateConfig, useRepository, Validator } from "signup-service"
import { check } from "types-validation"
import { createValidator } from "xvalidators"
import { ArticleController, useArticleController } from "./article"
import { SigninController } from "./authentication"
import { ContentController, useContentController } from "./content"
import { JobController, useJobController } from "./job"
import { MyArticlesController, useMyArticlesController } from "./my-articles"
import { MyProfileController, useMyProfileController } from "./my-profile"
import { PasswordController } from "./password"
import { getResourceByLang } from "./resources"
import { SignUpController } from "./signup"
import { UserController, useUserController } from "./user"

resources.createValidator = createValidator
resources.check = check

export interface Config {
  cookie?: boolean
  rememberToken: Token
  auth: SqlAuthTemplateConfig
  map: StringMap
  signup: SignupTemplateConfig
  password: PasswordTemplateConfig
  mail: MailConfig
}
export interface ApplicationContext {
  health: HealthController
  menu: MenuBuilder
  signin: SigninController
  signup: SignUpController
  password: PasswordController
  skill: ItemController<string[]>
  interest: ItemController<string[]>
  myProfile: MyProfileController
  myArticles: MyArticlesController
  user: UserController
  content: ContentController
  article: ArticleController
  job: JobController
}

export function useContext(db: DB, logger: Logger, cfg: Config): ApplicationContext {
  const sqlChecker = createChecker(db)
  const health = new HealthController([sqlChecker])

  const menuItemsLoader = new MenuItemLoader(
    db.query,
    "select id, name, path, resource_key as resource, icon, sequence, type, parent from categories where status = 'A'",
  )
  const menu = new MenuBuilder(getResourceByLang, menuItemsLoader.load, ["en", "vi"], "en")

  const auth = cfg.auth
  const status = initializeStatus(cfg.auth.status)
  const userRepository = useUserRepository<string, SqlAuthTemplateConfig>(db, cfg.auth, cfg.map)
  const authenticator = new Authenticator(status, compare, auth.account, userRepository, undefined, auth.lockedMinutes, auth.maxPasswordFailed)
  const signin = new SigninController(
    authenticator,
    "token",
    cfg.auth.token.secret,
    cfg.auth.token.expires,
    "remember",
    cfg.rememberToken.secret,
    cfg.rememberToken.expires,
  )

  const comparator = new Comparator()
  const signupMailSender = new SignupSender(cfg.signup.url, sendMail, cfg.mail.from, cfg.signup.template.body, cfg.signup.template.subject)
  const passcodeRepository = new CodeRepository<string>(db, "passcodes", "id", "expired_at")
  const signupRepository = useRepository<string, Signup>(
    db,
    "users",
    "passwords",
    cfg.signup.userStatus,
    cfg.signup.fields,
    cfg.signup.maxPasswordAge,
    cfg.signup.track,
    cfg.signup.map,
  )
  const validator = new Validator()
  const signupStatus = initStatus(cfg.signup.status)
  const signupService = new SignupService<string, Signup>(
    signupStatus,
    signupRepository,
    generate,
    comparator,
    comparator,
    passcodeRepository,
    signupMailSender.send,
    cfg.signup.expires,
    validator.validate,
  )
  const signup = new SignUpController(signupService, signupStatus)
  const resetPasswordMailSender = new MailSender(sendMail, cfg.mail.from, cfg.password.templates.reset.body, cfg.password.templates.reset.subject)
  const changePasswordMailSender = new MailSender(sendMail, cfg.mail.from, cfg.password.templates.change.body, cfg.password.templates.change.subject)
  // const codeRepository = new CodeRepository<string>(db, "passwordcodes")
  const passwordRepository = usePasswordRepository<string>(db, cfg.password.db, cfg.password.max, cfg.password.fields)
  const passwordService = new PasswordService<string>(
    comparator,
    passwordRepository,
    resetPasswordMailSender.send,
    cfg.password.expires,
    passcodeRepository,
    cfg.password.max,
    undefined,
    hasTwoFactors,
    undefined,
    changePasswordMailSender.send,
  )
  const password = new PasswordController(passwordService)

  const skillService = new StringService("skills", "skill", db.query, db.execute)
  const skill = new ItemController<string[]>(skillService.load, "q")
  const interestService = new StringService("interests", "interest", db.query, db.execute)
  const interest = new ItemController<string[]>(interestService.load, "q")
  const myProfile = useMyProfileController(db, skillService.save, interestService.save)
  const myArticles = useMyArticlesController(db)

  const user = useUserController(db)
  const content = useContentController(db, ["vi"])
  const article = useArticleController(db)
  const job = useJobController(db)

  return { health, menu, signin, signup, password, myProfile, skill, interest, myArticles, user, content, article, job }
}

function generate(): string {
  return nanoid(10)
}
function sendMail(mailData: MailData): Promise<boolean> {
  console.log("" + mailData.subject + " " + mailData.html)
  return Promise.resolve(true)
}
function hasTwoFactors(): Promise<boolean> {
  return Promise.resolve(true)
}
