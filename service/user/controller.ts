import { Request, Response } from "express"
import {
  buildMessage,
  buildPages,
  buildPageSearch,
  buildSortSearch,
  cloneFilter,
  escape,
  escapeArray,
  fromRequest,
  getOffset,
  getSearch,
  hasSearch,
  queryLimit,
  queryPage,
  resources,
} from "express-ext"
import { Log } from "onecore"
import { getLang, getResource } from "../resources"
import { render, renderError404, renderError500 } from "../template"
import { UserFilter, UserService } from "./user"

const fields = ["id", "username", "email", "displayName", "status"]

export class UserController {
  constructor(private service: UserService, private log: Log) {
    this.search = this.search.bind(this)
    this.view = this.view.bind(this)
  }
  search(req: Request, res: Response) {
    const lang = getLang(req)
    const resource = getResource(lang)
    let filter: UserFilter = {
      q: "",
      limit: resources.defaultLimit,
    }
    if (hasSearch(req)) {
      filter = fromRequest<UserFilter>(req, ["status"])
    }
    const page = queryPage(req, filter)
    const limit = queryLimit(req)
    const offset = getOffset(limit, page)
    this.service
      .search(cloneFilter(filter, limit, page), limit, page)
      .then((result) => {
        const list = escapeArray(result.list, offset, "sequence")
        if (list && list.length > 0) {
          list.forEach((user) => {
            if (!user.username) {
              user.username = user.id
            }
          })
        }
        const search = getSearch(req.url)
        render(req, res, "users", {
          resource,
          limits: resources.limits,
          filter,
          list,
          pages: buildPages(limit, result.total),
          pageSearch: buildPageSearch(search),
          sort: buildSortSearch(search, fields, filter.sort),
          message: buildMessage(resource, list, limit, page, result.total),
        })
      })
      .catch((err) => renderError500(req, res, resource, err))
  }
  view(req: Request, res: Response) {
    const lang = getLang(req)
    const resource = getResource(lang)
    const id = req.params.id
    this.service
      .load(id)
      .then((user) => {
        if (!user) {
          renderError404(req, res, resource)
        } else {
          const x = {
            userId: "77c35c38c3554ea6906730dbcfeca0f2",
            id: "77c35c38c3554ea6906730dbcfeca0f2",
            username: "minhduc1405",
            displayName: "Duc Nguyen",
            email: "minhduc1405@gmail.com",
            lookingFor: ["friends", "football team", "room mate", "basketball team"],
            interests: ["money", "basketball", "football"],
            gallery: [
              { url: "https://storage.googleapis.com/go-firestore-rest-api.appspot.com/gallery/77c35c38c3554ea6906730dbcfeca0f2_d8Z1-zIut", type: "image" },
              { url: "https://storage.googleapis.com/go-firestore-rest-api.appspot.com/gallery/77c35c38c3554ea6906730dbcfeca0f2_4LrDMmb-f.mp4", type: "video" },
              { type: "youtube", url: "https://www.youtube.com/embed/UYBRXOxVDIA" },
              { url: "https://storage.googleapis.com/go-firestore-rest-api.appspot.com/gallery/77c35c38c3554ea6906730dbcfeca0f2_45jv6Ewm8", type: "image" },
              { url: "https://storage.googleapis.com/go-firestore-rest-api.appspot.com/gallery/77c35c38c3554ea6906730dbcfeca0f2_wh4r6Wzm2", type: "image" },
              {
                source: null,
                url: "https://storage.googleapis.com/go-firestore-rest-api.appspot.com/gallery/77c35c38c3554ea6906730dbcfeca0f2_Os3wTEtrY",
                type: "image",
              },
            ],
            coverURL: "https://storage.googleapis.com/go-firestore-rest-api.appspot.com/cover/77c35c38c3554ea6906730dbcfeca0f2_dHIRtsb92_1500x500 (1).jpg",
            bio: "I am a programer",
            skills: [
              { hirable: true, skill: "GO" },
              { hirable: true, skill: "Java" },
              { hirable: true, skill: "nodejs" },
              { hirable: true, skill: "Javascript" },
              { hirable: true, skill: "Reactjs" },
              { hirable: true, skill: "Angular" },
              { hirable: false, skill: "Vuejs" },
            ],
            occupation: "Developer",
            imageURL: "https://storage.googleapis.com/go-firestore-rest-api.appspot.com/image/77c35c38c3554ea6906730dbcfeca0f2_IFGjoPlXj_png.png",
            familyName: "Nguyen",
            givenName: "Duc",
            links: {
              facebook: "facebook",
              linkedin: "linkedin",
              instagram: "instagram",
              twitter: "twitter",
              skype: "skype",
              dribble: "dribble",
              google: "google",
            },
            achievements: [
              { subject: "Star Performer 2023", description: "I got Star Performer 2023", highlight: true },
              { subject: "Star Performer 2024", description: "I got Star Performer 2024" },
            ],
            facebookLink: "https://www.facebook.com/minhduc1405",
            linkedinLink: "https://www.linkedin.com/in/duc-nguyen-437240239/",
            xlink: "https://x.com/minhduc1405",
          }
          render(req, res, "user", {
            resource,
            user: escape(x),
          })
        }
      })
      .catch((err) => renderError500(req, res, resource, err))
  }
}
