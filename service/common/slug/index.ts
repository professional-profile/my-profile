import { nanoid } from "nanoid"

export function slugify(title: string, wordLimit: number = 10, maxLength: number = 60): string {
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, wordLimit)

  let slug = words.join("-")
  if (slug.length > maxLength) {
    slug = slug.substring(0, maxLength).replace(/-+$/, "") // remove trailing dash
  }
  return slug + "-" + generate()
}

function generate(): string {
  return nanoid(10)
}
