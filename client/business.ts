function saveArticle(target: HTMLElement, id: string) {
  const url = `/news/${id}`
  if (target.nodeName !== "I") {
    target = target.parentElement as HTMLElement
  }
  const resource = getResource()
  showLoading()
  fetch(url, {
    method: "PATCH",
    headers: getHttpHeaders(),
  })
    .then((response) => {
      hideLoading()
      if (response.ok || response.status === 409) {
        toast(resource.article_save_success)
        target.onclick = null
        target.innerText = "bookmark"
        target.setAttribute("onclick", `unsaveArticle(this, '${escapeHTML(id)}')`)
      } else {
        if (response.status === 401) {
          window.location.href = buildLoginUrl()
        } else if (response.status === 422) {
          alertWarning(resource.article_save_fail)
        }
      }
    })
    .catch((err) => handleError(err, resource.error_network))
}
function unsaveArticle(target: HTMLElement, id: string) {
  const url = `/news/${id}`
  if (target.nodeName !== "I") {
    target = target.parentElement as HTMLElement
  }
  const resource = getResource()
  showLoading()
  fetch(url, {
    method: "DELETE",
    headers: getHttpHeaders(),
  })
    .then((response) => {
      hideLoading()
      if (response.ok || response.status === 410) {
        toast(resource.article_unsave_success)
        target.onclick = null
        target.innerText = "bookmark_border"
        target.setAttribute("onclick", `saveArticle(this, '${escapeHTML(id)}')`)
      } else {
        if (response.status === 401) {
          window.location.href = buildLoginUrl()
        }
      }
    })
    .catch((err) => handleError(err, resource.error_network))
}
function saveJob(target: HTMLElement, id: string) {
  const url = `/jobs/${id}`
  if (target.nodeName !== "I") {
    target = target.parentElement as HTMLElement
  }
  const resource = getResource()
  showLoading()
  fetch(url, {
    method: "PATCH",
    headers: getHttpHeaders(),
  })
    .then((response) => {
      hideLoading()
      if (response.ok || response.status === 409) {
        toast(resource.job_save_success)
        target.onclick = null
        target.innerText = "bookmark"
        target.setAttribute("onclick", `unsaveJob(this, '${escapeHTML(id)}')`)
      } else {
        if (response.status === 401) {
          window.location.href = buildLoginUrl()
        } else if (response.status === 422) {
          alertWarning(resource.job_save_fail)
        }
      }
    })
    .catch((err) => handleError(err, resource.error_network))
}
function unsaveJob(target: HTMLElement, id: string) {
  const url = `/jobs/${id}`
  if (target.nodeName !== "I") {
    target = target.parentElement as HTMLElement
  }
  const resource = getResource()
  showLoading()
  fetch(url, {
    method: "DELETE",
    headers: getHttpHeaders(),
  })
    .then((response) => {
      hideLoading()
      if (response.ok || response.status === 410) {
        toast(resource.job_unsave_success)
        target.onclick = null
        target.innerText = "bookmark_border"
        target.setAttribute("onclick", `saveJob(this, '${escapeHTML(id)}')`)
      } else {
        if (response.status === 401) {
          window.location.href = buildLoginUrl()
        }
      }
    })
    .catch((err) => handleError(err, resource.error_network))
}

function setUseful(target: HTMLElement, id: string) {
  let url = getCurrentURL()
  url = `${removeLast(removeLast(url))}/${id}/useful`
  if (target.nodeName !== "I") {
    target = target.parentElement as HTMLElement
  }
  const resource = getResource()
  showLoading()
  fetch(url, {
    method: "PATCH",
    headers: getHttpHeaders(),
  })
    .then((response) => {
      hideLoading()
      if (response.ok) {
        target.classList.add("highlight")
        target.onclick = null
        target.setAttribute("onclick", `removeUseful(this, '${escapeHTML(id)}')`)
        const parent = target.parentElement?.parentElement
        if (parent) {
          const span = parent.querySelector(".useful")
          if (span) {
            let likes = parseInt(span.innerHTML || "0", 10)
            likes = likes + 1
            span.innerHTML = likes.toString()
            span.parentElement?.removeAttribute("hidden")
          }
        }
      }
    })
    .catch((err) => handleError(err, resource.error_network))
}
function removeUseful(target: HTMLElement, id: string) {
  let url = getCurrentURL()
  url = `${removeLast(removeLast(url))}/${id}/useful`
  if (target.nodeName !== "I") {
    target = target.parentElement as HTMLElement
  }
  const resource = getResource()
  showLoading()
  fetch(url, {
    method: "DELETE",
    headers: getHttpHeaders(),
  })
    .then((response) => {
      hideLoading()
      if (response.ok) {
        target.classList.remove("highlight")
        target.onclick = null
        target.setAttribute("onclick", `setUseful(this, '${escapeHTML(id)}')`)
        const parent = target.parentElement?.parentElement
        if (parent) {
          const span = parent.querySelector(".useful")
          if (span) {
            let likes = parseInt(span.innerHTML || "0", 10)
            likes = likes - 1
            span.innerHTML = likes.toString()
          }
        }
      }
    })
    .catch((err) => handleError(err, resource.error_network))
}

function followCompany(target: HTMLElement, id: string) {
  const resource = getResource()
  follow(target, id, `/companies/${id}`, "unfollowCompany", resource.company_followers, resource.company_follow_success)
}
function unfollowCompany(target: HTMLElement, id: string) {
  const resource = getResource()
  unfollow(target, id, `/companies/${id}`, "followCompany", resource.company_followers, resource.company_unfollow_success)
}
function followUser(target: HTMLElement, id: string) {
  const resource = getResource()
  follow(target, id, `/users/${id}`, "unfollowUser", resource.user_profile_followers, resource.user_profile_follow_success)
}
function unfollowUser(target: HTMLElement, id: string) {
  const resource = getResource()
  unfollow(target, id, `/users/${id}`, "followUser", resource.user_profile_followers, resource.user_profile_unfollow_success)
}
function follow(target: HTMLElement, id: string, url: string, unfollowFunction: string, folowersText: string, successMsg: string) {
  const resource = getResource()
  showLoading()
  fetch(url, {
    method: "PATCH",
    headers: getHttpHeaders(),
  })
    .then((response) => {
      hideLoading()
      if (response.ok || response.status === 409) {
        toast(successMsg)
        if (target.nodeName === "I") {
          target.onclick = null
          target.innerText = "bookmark"
          target.setAttribute("onclick", `${unfollowFunction}(this, '${escapeHTML(id)}')`)
        } else if (target.nodeName === "BUTTON") {
          target.onclick = null
          target.innerText = target.getAttribute("data-unfollow-text") || ""
          target.setAttribute("onclick", `${unfollowFunction}(this, '${escapeHTML(id)}')`)
          let followers = parseInt(target.getAttribute("data-followers") || "0", 10)
          followers = followers + 1
          target.setAttribute("data-followers", "" + followers)
          const p = document.getElementById("followerCount")
          if (p && p.lastChild) {
            const newText = format(folowersText, followers)
            p.lastChild.textContent = newText
          }
        }
      } else {
        if (response.status === 401) {
          window.location.href = buildLoginUrl()
        }
      }
    })
    .catch((err) => handleError(err, resource.error_network))
}
function unfollow(target: HTMLElement, id: string, url: string, followFunction: string, folowersText: string, successMsg: string) {
  showLoading()
  fetch(url, {
    method: "DELETE",
    headers: getHttpHeaders(),
  })
    .then((response) => {
      hideLoading()
      if (response.ok || response.status === 410) {
        toast(successMsg)
        if (target.nodeName === "I") {
          target.onclick = null
          target.innerText = "bookmark_border"
          target.setAttribute("onclick", `follow(this, '${escapeHTML(id)}')`)
        } else if (target.nodeName === "BUTTON") {
          target.onclick = null
          target.innerText = target.getAttribute("data-follow-text") || ""
          target.setAttribute("onclick", `follow(this, '${escapeHTML(id)}')`)
          let followers = parseInt(target.getAttribute("data-followers") || "0", 10)
          followers = followers - 1
          target.setAttribute("data-followers", "" + followers)
          const p = document.getElementById("followerCount")
          if (p && p.lastChild) {
            const newText = format(folowersText, followers)
            p.lastChild.textContent = newText
          }
        }
      } else {
        if (response.status === 401) {
          window.location.href = buildLoginUrl()
        }
      }
    })
    .catch((err) => handleError(err, resource.error_network))
}

function saveAchievements(e: Event) {
  e.preventDefault()
  const target = e.target as HTMLButtonElement
  const parent = target.parentElement?.parentElement
  if (parent) {
    const sections = parent.querySelectorAll('section[data-value="true"]')
    const l = sections.length
    const achievements = []
    for (let i = 0; i < l; i++) {
      const section = sections[i]
      const achievement = {} as any
      const hSubject = section.querySelector("h3") as HTMLElement
      if (hSubject) {
        achievement.subject = hSubject.firstChild?.textContent
        const iHighlight = hSubject.querySelector("i.star.highlight")
        if (iHighlight) {
          achievement.highlight = true
        }
      }
      const pDescription = section.querySelector("p") as HTMLElement
      if (pDescription) {
        achievement.description = pDescription.innerText
      }
      achievements.push(achievement)
    }
    const url = getCurrentURL()
    const data = { achievements }
    callSubmitPartialForm(url, target, data, "userAchievements", "achievements", "btn-edit")
  }
}
interface Achievement {
  subject: string
  description: string
  highlight?: boolean
}
function addAchievement(target: HTMLButtonElement) {
  const parent = target.parentElement?.parentElement
  if (parent) {
    const achievement = decodeFromElement<Achievement>(parent, ["subject", "description", "highlight"])
    const container = parent.parentElement
    if (container && container.childNodes.length > 2) {
      let beforeElement = container.querySelector('section[data-value="true"]')
      if (!beforeElement) {
        beforeElement = container.querySelector("footer")
      }
      if (beforeElement) {
        const sec = document.createElement("section")
        sec.setAttribute("data-value", "true")
        sec.innerHTML = renderAchievement(achievement.subject, achievement.description, achievement.highlight)
        container.insertBefore(sec, beforeElement)
      }
    }
  }
}
function renderAchievement(subject: string, description: string, highlight?: boolean): string {
  const star = highlight ? '<i class="star"></i>' : ""
  return `<h3>${escapeHTML(subject)}${star}</h3>
<p class="description">${escapeHTML(description)}</p>
<button type="button" class="btn-remove" onclick="removeParent(this)"></button>`
}

function toggleView(target: HTMLButtonElement, viewId: string, editorId: string, toolbarId: string) {
  const form = target.form
  if (form) {
    const contentView = form.querySelector("#" + viewId) as HTMLTextAreaElement
    const editor = form.querySelector("#" + editorId) as HTMLElement
    const toolbar = form.querySelector("#" + toolbarId) as HTMLElement

    if (contentView && editor && toolbar) {
      if (contentView.style.display !== "none") {
        // HTML to Quill
        if (contentView.form) {
          // quill.root.innerHTML = htmlEditor.value
          // quill.setContents(htmlEditor.value)
          contentView.form.quill.clipboard.dangerouslyPasteHTML(contentView.value)
        }
        contentView.style.display = "none"
        editor.style.display = "block"
        toolbar.style.display = "block"
      } else {
        // Quill to HTML
        if (contentView.form) {
          let html = contentView.form.quill.root.innerHTML
          html = html.replace(/ class=\"ql-indent-\\d+\"/g, "")
          contentView.value = html
        }
        contentView.style.display = "block"
        editor.style.display = "none"
        toolbar.style.display = "none"
      }
    }
  }
}
