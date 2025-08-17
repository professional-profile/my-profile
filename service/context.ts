import { Authenticator, initializeStatus, SqlAuthTemplateConfig, useUserRepository } from "authen-service"
import { compare } from "bcrypt"
import { Comparator } from "bcrypt-plus"
import { MenuBuilder, MenuItemLoader } from "content-menu"
import { HealthController, LogController, Logger, Middleware, MiddlewareController, resources } from "express-ext"
import { generateToken } from "jsonwebtoken-plus"
import { nanoid } from "nanoid"
import { MailConfig, MailData, StringMap } from "onecore"
import { MailSender, PasswordService, PasswordTemplateConfig, usePasswordRepository } from "password-service"
import { CodeRepository } from "pg-extension"
import { createChecker, DB } from "query-core"
import { initStatus, Signup, SignupSender, SignupService, SignupTemplateConfig, useRepository, Validator } from "signup-service"
import { check } from "types-validation"
import { createValidator } from "xvalidators"
import { ArticleController, useArticleController } from "./article"
import { SigninController } from "./authentication"
import { ContactController, useContactController } from "./contact"
import { ContentController, useContentController } from "./content"
import { JobController, useJobController } from "./job"
import { PasswordController } from "./password"
import { getResourceByLang } from "./resources"
import { SignUpController } from "./signup"

resources.createValidator = createValidator
resources.check = check

export interface Config {
  cookie?: boolean
  auth: SqlAuthTemplateConfig
  map: StringMap
  signup: SignupTemplateConfig
  password: PasswordTemplateConfig
  mail: MailConfig
}
export interface ApplicationContext {
  health: HealthController
  log: LogController
  middleware: MiddlewareController
  menu: MenuBuilder
  signin: SigninController
  signup: SignUpController
  password: PasswordController
  content: ContentController
  article: ArticleController
  job: JobController
  contact: ContactController
}

export function useContext(db: DB, logger: Logger, midLogger: Middleware, cfg: Config): ApplicationContext {
  const log = new LogController(logger)
  const middleware = new MiddlewareController(midLogger)
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
  const authenticator = new Authenticator(
    status,
    compare,
    generateToken,
    auth.token,
    auth.payload,
    auth.account,
    userRepository,
    undefined,
    auth.lockedMinutes,
    auth.maxPasswordFailed,
  )
  const signin = new SigninController(authenticator, logger.error)

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
  const signup = new SignUpController(signupService, signupStatus, logger.error)
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
  const password = new PasswordController(passwordService, logger.error)

  const content = useContentController(db, ["vi"], menuItemsLoader)
  const article = useArticleController(db)
  const job = useJobController(db)
  const contact = useContactController(db, logger.error)

  return { health, log, middleware, menu, signin, signup, password, content, article, job, contact }
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
