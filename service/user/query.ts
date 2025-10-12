import { Statement } from "query-core"
import { UserFilter } from "./user"

export function buildQuery(filter: UserFilter): Statement {
  let query = `select * from users`
  const where = []
  const params = []
  let i = 1
  if (filter.interests && filter.interests.length > 0) {
    params.push(filter.interests)
    where.push(`interests && $${i++}`)
  }
  if (filter.skills && filter.skills.length > 0) {
    const skills = []
    for (const skill of filter.skills) {
      skills.push(`$${i++} <@ ANY(skills)`)
      params.push(skill)
    }
    where.push(`(${skills.join(" or ")})`)
  }
  if (filter.dateOfBirth) {
    if (filter.dateOfBirth.min) {
      where.push(`date_of_birth >= $${i++}`)
      params.push(filter.dateOfBirth.min)
    }
    if (filter.dateOfBirth.max) {
      where.push(`date_of_birth <= $${i++}`)
      params.push(filter.dateOfBirth.max)
    }
  }
  if (filter.id && filter.id.length > 0) {
    where.push(`id = $${i++}`)
    params.push(filter.id)
  }
  if (filter.username && filter.username.length > 0) {
    where.push(`username ilike $${i++}`)
    params.push("%" + filter.username + "%")
  }
  if (filter.email && filter.email.length > 0) {
    where.push(`email ilike $${i++}`)
    params.push(filter.email + "%")
  }
  if (filter.phone && filter.phone.length > 0) {
    where.push(`username ilike $${i++}`)
    params.push("%" + filter.phone + "%")
  }
  /*
  if (s.settings) {
    params.push(s.settings);
    where.push(`settings @> $${i++}`);
  }
  if (s.achievements && s.achievements.length > 0) {
    const achievements = [];
    for (const achievement of s.achievements) {
      achievements.push(`$${i++} <@ ANY(achievements)`);
      params.push(achievement);
    }
    where.push(`(${achievements.join(' or ')})`);
  }
  */
  if (where.length > 0) {
    query = query + ` where ` + where.join(" and ")
  }
  /*
  if (filter.limit && filter.limit > 0) {
    query = query + ` limit ${filter.limit}`
  }
  */
  console.log(query)
  return { query, params }
}
// CREATE INDEX interests_index ON users (interests);
// db.Query(`select interests from users where interests && $1 and skills && $2`, [ 'Basketball', 'Kapp' ])
