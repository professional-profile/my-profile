import { param } from "pg-extension"
import { buildSort, Statement } from "query-core"
import { UserFilter, userModel } from "./user"

export function buildQuery(filter: UserFilter): Statement {
  const where = []
  const params = []
  let i = 1
  let query: string
  if (filter.userId) {
    query = `select u.id, u.username, u.email, u.image_url, u.display_name, u.occupation, u.headline,
        ui.follower_count, ui.following_count, uf.following_at, ur.followed_at
      from users u
      left join user_info ui on u.id = ui.id
      left join user_followings uf on uf.id = ${param(i++)} and uf.following = u.id
      left join user_followers ur on ur.id = ${param(i++)} and ur.follower = u.id`
    params.push(filter.userId, filter.userId)
  } else {
    query = `select u.id, u.username, u.email, u.image_url, u.display_name, u.occupation, u.headline from users u`
  }

  if (filter.interests && filter.interests.length > 0) {
    params.push(filter.interests)
    where.push(`interests && ${param(i++)}`)
  }
  if (filter.skills && filter.skills.length > 0) {
    const skills = []
    for (const skill of filter.skills) {
      skills.push(`${param(i++)} <@ ANY(skills)`)
      params.push(skill)
    }
    where.push(`(${skills.join(" or ")})`)
  }
  if (filter.dateOfBirth) {
    if (filter.dateOfBirth.min) {
      where.push(`date_of_birth >= ${param(i++)}`)
      params.push(filter.dateOfBirth.min)
    }
    if (filter.dateOfBirth.max) {
      where.push(`date_of_birth <= ${param(i++)}`)
      params.push(filter.dateOfBirth.max)
    }
  }
  if (filter.id && filter.id.length > 0) {
    where.push(`id = ${param(i++)}`)
    params.push(filter.id)
  }
  if (filter.username && filter.username.length > 0) {
    where.push(`username ilike ${param(i++)}`)
    params.push("%" + filter.username + "%")
  }
  if (filter.email && filter.email.length > 0) {
    where.push(`email ilike ${param(i++)}`)
    params.push(filter.email + "%")
  }
  if (filter.phone && filter.phone.length > 0) {
    where.push(`username ilike ${param(i++)}`)
    params.push("%" + filter.phone + "%")
  }
  /*
  if (s.settings) {
    params.push(s.settings);
    where.push(`settings @> ${param(i++)}`);
  }
  if (s.achievements && s.achievements.length > 0) {
    const achievements = [];
    for (const achievement of s.achievements) {
      achievements.push(`${param(i++)} <@ ANY(achievements)`);
      params.push(achievement);
    }
    where.push(`(${achievements.join(' or ')})`);
  }
  */
  if (where.length > 0) {
    query = query + ` where ` + where.join(" and ")
  }
  const orderBy = buildSort(filter.sort, userModel)
  if (orderBy.length > 0) {
    query = query + ` order by ${orderBy}`
  }
  /*
  if (filter.limit && filter.limit > 0) {
    query = query + ` limit ${filter.limit}`
  }
  */
  return { query, params }
}
// CREATE INDEX interests_index ON users (interests);
// db.Query(`select interests from users where interests && $1 and skills && $2`, [ 'Basketball', 'Kapp' ])
