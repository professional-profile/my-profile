import { Request, Response } from "express"
import { escape, handleError, toMap } from "express-ext"
import { nanoid } from "nanoid"
import { Log } from "onecore"
import { DB, Repository } from "query-core"
import { validate } from "xvalidators"
import { getLang, getResource } from "../resources"
import { render } from "../template"
import { Contact, contactModel, ContactRepository, ContactService } from "./contact"
export * from "./contact"

export class SqlContactRepository extends Repository<Contact, string> implements ContactRepository {
  constructor(db: DB) {
    super(db, "contacts", contactModel)
  }
}
export class ContactUseCase implements ContactService {
  constructor(private repository: ContactRepository) {}
  submit(contact: Contact): Promise<number> {
    contact.id = nanoid(10)
    contact.submittedAt = new Date()
    return this.repository.create(contact)
  }
}

export class ContactController {
  constructor(protected service: ContactService, private log: Log) {
    this.render = this.render.bind(this)
    this.submit = this.submit.bind(this)
  }
  render(req: Request, res: Response) {
    const lang = getLang(req)
    const resource = getResource(lang)
    render(req, res, "contact", { resource, contact: {} })
  }
  submit(req: Request, res: Response) {
    const resource = getResource(req)
    console.log("Enter post contact " + JSON.stringify(req.body))
    const contact = req.body
    const errors = validate<Contact>(contact, contactModel, resource)
    if (errors.length > 0) {
      // res.status(getStatusCode(errors)).json(errors).end()
      const errorMap = toMap(errors)
      console.log(JSON.stringify(errorMap))
      render(req, res, "contact", { resource, contact: escape(contact), errors: errorMap })
    } else {
      this.service
        .submit(contact)
        .then((result) => {
          // res.status(201).json(contact).end()
          render(req, res, "contact", { resource, contact: escape(contact) })
        })
        .catch((err) => handleError(err, res, this.log))
    }
  }
}

export function useContactController(db: DB, log: Log): ContactController {
  const repository = new SqlContactRepository(db)
  const service = new ContactUseCase(repository)
  return new ContactController(service, log)
}
