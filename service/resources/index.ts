import { Request } from "express"
import { query } from "express-ext"
import { en as articleEN } from "./article/en"
import { vi as articleVI } from "./article/vi"
import { en as authenticationEN } from "./authentication/en"
import { vi as authenticationVI } from "./authentication/vi"
import { en as commonEN } from "./en"
import { en as profileEN } from "./profile/en"
import { vi as profileVI } from "./profile/vi"
import { vi as commonVI } from "./vi"

export interface Resource {
  resource(): StringMap
  value(key: string, param?: any): string
  format(f: string, ...args: any[]): string
}
export interface StringMap {
  [key: string]: string
}
export interface Resources {
  [key: string]: StringMap
}

const en: StringMap = {
  ...commonEN,
  ...authenticationEN,
  ...articleEN,
  ...profileEN,
}
const vi: StringMap = {
  ...commonVI,
  ...authenticationVI,
  ...articleVI,
  ...profileVI,
}

export const resources: Resources = {
  en: en,
  vi: vi,
}

export function getDateFormat(lang?: string): string {
  if (lang === "vi") {
    return "d/M/yyyy"
  }
  return "M/d/yyyy"
}
export function getLang(req: Request): string {
  let lang = query(req, "lang")
  if (lang !== "vi") {
    lang = "en"
  }
  return lang
}
export function getLangSearch(lang?: string) {
  if (!lang || lang === "en") {
    return ""
  }
  return `?lang=${lang}`
}
export function getResource(lang?: string | Request): StringMap {
  if (lang) {
    if (typeof lang === "string") {
      const r = resources[lang]
      if (r) {
        return r
      }
    } else {
      const l = query(lang, "lang")
      if (l) {
        const r = resources[l]
        if (r) {
          return r
        }
      }
    }
  }
  return resources["en"]
}
export function getResourceByLang(lang: string): StringMap {
  if (lang) {
    const r = resources[lang]
    if (r) {
      return r
    }
  }
  return resources["en"]
}
