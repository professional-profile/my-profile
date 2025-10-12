import { Attributes, DateRange, Filter, Result, SearchResult } from "onecore"

export interface User {
  id: string
  username: string
  email?: string
  phone?: string
  dateOfBirth?: Date
  displayName?: string
  givenName?: string
  familyName?: string
  middleName?: string
  status?: string
  title?: string
  //image?: UploadSize[]
  imageURL?: string
  coverURL?: string
  bio?: string
  website?: string
  occupation?: string
  company?: string
  location?: string
  interests: string[]
  skills: Skill[]
  achievements: Achievement[]
  works: Work[]
  educations: Education[]
  settings?: UserSettings
}
export interface UserSettings {
  language: string
  dateFormat: string
  dateTimeFormat: string
  timeFormat: string
  notification: boolean
}
export interface Skill {
  skill: string
  hirable: boolean
}
export interface Achievement {
  subject: string
  description: string
}
export interface Work {
  name: string
  position: string
  description: string
  item: string[]
  from: string
  to: string
} // End of Work
export interface Education {
  school: string
  degree: string
  major: string
  title: string
  from: string
  to: string
} // Education
export interface UserFilter extends Filter {
  id?: string
  username?: string
  email?: string
  phone?: string
  dateOfBirth?: DateRange
  interests?: string[]
  skills?: Skill[]
}

export interface UserRepository {
  search(filter: UserFilter, limit: number, page?: number | string, fields?: string[], ctx?: any): Promise<SearchResult<User>>
  load(id: string): Promise<User | null>
  create(user: User): Promise<number>
  update(user: User): Promise<number>
  patch(user: Partial<User>): Promise<number>
  delete(id: string): Promise<number>
}
export interface UserService {
  search(filter: UserFilter, limit: number, page?: number | string, fields?: string[], ctx?: any): Promise<SearchResult<User>>
  load(id: string): Promise<User | null>
  create(user: User): Promise<Result<User>>
  update(user: User): Promise<Result<User>>
  patch(user: Partial<User>): Promise<Result<User>>
  delete(id: string): Promise<number>
}

export const skillsModel: Attributes = {
  skill: {
    required: true,
  },
  hirable: {
    type: "boolean",
  },
}
export const achievementsModel: Attributes = {
  description: {},
  highlight: {
    type: "boolean",
  },
  subject: {},
}
export const educationsModel: Attributes = {
  from: {
    type: "string",
  },
  to: {
    type: "boolean",
  },
  major: {
    type: "string",
  },
  title: {
    type: "string",
  },
  degree: {
    type: "string",
  },
  school: {
    type: "string",
  },
}
export const userSettingsModel: Attributes = {
  userId: {},
  language: {},
  dateFormat: {},
  dateTimeFormat: {},
  timeFormat: {},
  notification: {
    type: "boolean",
  },
}
export const userModel: Attributes = {
  id: {
    key: true,
    match: "equal",
  },
  username: {},
  email: {
    format: "email",
    required: true,
    match: "prefix",
  },
  phone: {
    format: "phone",
  },
  dateOfBirth: {
    column: "date_of_birth",
    type: "datetime",
  },
  displayName: {
    column: "display_name",
    length: 100,
  },
  givenName: {
    column: "given_name",
    length: 100,
  },
  familyName: {
    column: "family_name",
    length: 100,
  },
  middleName: {
    column: "middle_name",
    length: 100,
  },
  status: {
    match: "equal",
    length: 1,
  },
  title: {
    length: 20,
  },
  position: {
    length: 20,
  },
  imageURL: {
    column: "image_url",
    length: 255,
  },
  coverURL: {
    column: "cover_url",
    length: 255,
  },
  bio: {
    length: 255,
  },
  website: {},
  occupation: {
    length: 100,
  },
  company: {
    length: 100,
  },
  location: {
    length: 100,
  },
  interests: {
    type: "strings",
  },
  skills: {
    type: "array",
    typeof: skillsModel,
  },
  achievements: {
    type: "array",
    typeof: achievementsModel,
  },
  educations: {
    type: "primitives",
    typeof: educationsModel,
  },
  settings: {
    type: "object",
    typeof: userSettingsModel,
  },
}
