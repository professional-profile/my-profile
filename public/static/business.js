"use strict"
function saveArticle(target, id, remove) {
  var url = getCurrentURL()
  url = (remove ? removeLast(url) : url) + "/" + id
  var strue = remove ? ", true" : ""
  if (target.nodeName !== "I") {
    target = target.parentElement
  }
  var resource = getResource()
  showLoading()
  fetch(url, {
    method: "PATCH",
    headers: getHttpHeaders(),
  })
    .then(function (response) {
      hideLoading()
      if (response.ok) {
        toast(resource.article_save_success)
        target.onclick = null
        target.innerText = "bookmark"
        target.setAttribute("onclick", "removeItem(this, '" + escapeHTML(id) + "'" + strue + ")")
      } else {
        if (response.status === 401) {
          window.location.href = buildLoginUrl()
        } else if (response.status === 409) {
          toast(resource.article_save_conflict)
        } else if (response.status === 422) {
          alertWarning(resource.article_save_fail)
        }
      }
    })
    .catch(function (err) {
      return handleError(err, resource.error_network)
    })
}
function unsaveArticle(target, id, remove) {
  var url = getCurrentURL()
  url = (remove ? removeLast(url) : url) + "/" + id
  var strue = remove ? ", true" : ""
  if (target.nodeName !== "I") {
    target = target.parentElement
  }
  var resource = getResource()
  showLoading()
  fetch(url, {
    method: "DELETE",
    headers: getHttpHeaders(),
  })
    .then(function (response) {
      hideLoading()
      if (response.ok) {
        toast(resource.article_unsave_success)
        target.onclick = null
        target.innerText = "bookmark_border"
        target.setAttribute("onclick", "saveItem(this, '" + escapeHTML(id) + "'" + strue + ")")
      } else {
        if (response.status === 401) {
          window.location.href = buildLoginUrl()
        } else if (response.status === 410) {
          toast(resource.article_unsave_success)
        }
      }
    })
    .catch(function (err) {
      return handleError(err, resource.error_network)
    })
}
function setUseful(target, id) {
  var url = getCurrentURL()
  url = removeLast(removeLast(url)) + "/" + id + "/useful"
  console.log("useful url " + url)
  if (target.nodeName !== "I") {
    target = target.parentElement
  }
  var resource = getResource()
  showLoading()
  fetch(url, {
    method: "PATCH",
    headers: getHttpHeaders(),
  })
    .then(function (response) {
      var _a, _b
      hideLoading()
      if (response.ok) {
        target.classList.add("highlight")
        target.onclick = null
        target.setAttribute("onclick", "removeUseful(this, '" + escapeHTML(id) + "')")
        var parent_1 = (_a = target.parentElement) === null || _a === void 0 ? void 0 : _a.parentElement
        if (parent_1) {
          var span = parent_1.querySelector(".useful")
          if (span) {
            var likes = parseInt(span.innerHTML || "0", 10)
            likes = likes + 1
            span.innerHTML = likes.toString()
            ;(_b = span.parentElement) === null || _b === void 0 ? void 0 : _b.removeAttribute("hidden")
          }
        }
      }
    })
    .catch(function (err) {
      return handleError(err, resource.error_network)
    })
}
function removeUseful(target, id) {
  var url = getCurrentURL()
  url = removeLast(removeLast(url)) + "/" + id + "/useful"
  console.log("useful url " + url)
  if (target.nodeName !== "I") {
    target = target.parentElement
  }
  var resource = getResource()
  showLoading()
  fetch(url, {
    method: "DELETE",
    headers: getHttpHeaders(),
  })
    .then(function (response) {
      var _a
      hideLoading()
      if (response.ok) {
        target.classList.remove("highlight")
        target.onclick = null
        target.setAttribute("onclick", "setUseful(this, '" + escapeHTML(id) + "')")
        var parent_2 = (_a = target.parentElement) === null || _a === void 0 ? void 0 : _a.parentElement
        if (parent_2) {
          var span = parent_2.querySelector(".useful")
          if (span) {
            var likes = parseInt(span.innerHTML || "0", 10)
            likes = likes - 1
            span.innerHTML = likes.toString()
          }
        }
      }
    })
    .catch(function (err) {
      return handleError(err, resource.error_network)
    })
}
function follow(target, id, remove) {
  var url = getCurrentURL()
  url = (remove ? removeLast(url) : url) + "/" + id
  if (target.nodeName !== "I" && target.nodeName !== "BUTTON") {
    target = target.parentElement
  }
  var strue = remove ? ", true" : ""
  var resource = getResource()
  showLoading()
  fetch(url, {
    method: "PATCH",
    headers: getHttpHeaders(),
  })
    .then(function (response) {
      hideLoading()
      if (response.ok) {
        toast(resource.user_profile_follow_success)
        if (target.nodeName === "I") {
          target.onclick = null
          target.innerText = "bookmark"
          target.setAttribute("onclick", "unfollow(this, '" + escapeHTML(id) + "'" + strue + ")")
        } else if (target.nodeName === "BUTTON") {
          target.onclick = null
          target.innerText = target.getAttribute("data-unfollow-text") || ""
          target.setAttribute("onclick", "unfollow(this, '" + escapeHTML(id) + "'" + strue + ")")
          var followers = parseInt(target.getAttribute("data-followers") || "0", 10)
          followers = followers + 1
          target.setAttribute("data-followers", "" + followers)
          var p = document.getElementById("followerCount")
          if (p && p.lastChild) {
            var newText = format(resource.user_profile_followers, followers)
            p.lastChild.textContent = newText
          }
        }
      } else {
        if (response.status === 401) {
          window.location.href = buildLoginUrl()
        } else if (response.status === 409) {
          toast(resource.user_profile_follow_conflict)
        }
      }
    })
    .catch(function (err) {
      return handleError(err, resource.error_network)
    })
}
function unfollow(target, id, remove) {
  var url = getCurrentURL()
  url = (remove ? removeLast(url) : url) + "/" + id
  var strue = remove ? ", true" : ""
  showLoading()
  fetch(url, {
    method: "DELETE",
    headers: getHttpHeaders(),
  })
    .then(function (response) {
      hideLoading()
      if (response.ok) {
        toast(resource.user_profile_unfollow_success)
        if (target.nodeName === "I") {
          target.onclick = null
          target.innerText = "bookmark_border"
          target.setAttribute("onclick", "follow(this, '" + escapeHTML(id) + "'" + strue + ")")
        } else if (target.nodeName === "BUTTON") {
          target.onclick = null
          target.innerText = target.getAttribute("data-follow-text") || ""
          target.setAttribute("onclick", "follow(this, '" + escapeHTML(id) + "'" + strue + ")")
          var followers = parseInt(target.getAttribute("data-followers") || "0", 10)
          followers = followers - 1
          target.setAttribute("data-followers", "" + followers)
          var p = document.getElementById("followerCount")
          if (p && p.lastChild) {
            var newText = format(resource.user_profile_followers, followers)
            p.lastChild.textContent = newText
          }
        }
      } else {
        if (response.status === 401) {
          window.location.href = buildLoginUrl()
        } else if (response.status === 410) {
          toast(resource.user_profile_unfollow_conflict)
        }
      }
    })
    .catch(function (err) {
      return handleError(err, resource.error_network)
    })
}
function saveAchievements(e) {
  var _a, _b
  e.preventDefault()
  var target = e.target
  var parent = (_a = target.parentElement) === null || _a === void 0 ? void 0 : _a.parentElement
  if (parent) {
    var sections = parent.querySelectorAll('section[data-value="true"]')
    var l = sections.length
    var achievements = []
    for (var i = 0; i < l; i++) {
      var section = sections[i]
      var achievement = {}
      var hSubject = section.querySelector("h3")
      if (hSubject) {
        achievement.subject = (_b = hSubject.firstChild) === null || _b === void 0 ? void 0 : _b.textContent
        var iHighlight = hSubject.querySelector("i.star.highlight")
        if (iHighlight) {
          achievement.highlight = true
        }
      }
      var pDescription = section.querySelector("p")
      if (pDescription) {
        achievement.description = pDescription.innerText
      }
      achievements.push(achievement)
    }
    var url = getCurrentURL()
    var data = { achievements: achievements }
    callSubmitPartialForm(url, target, data, "userAchievements", "achievements", "btn-edit")
  }
}
function addAchievement(target) {
  var _a
  var parent = (_a = target.parentElement) === null || _a === void 0 ? void 0 : _a.parentElement
  if (parent) {
    var achievement = decodeFromElement(parent, ["subject", "description", "highlight"])
    var container = parent.parentElement
    if (container && container.childNodes.length > 2) {
      var beforeElement = container.querySelector('section[data-value="true"]')
      if (!beforeElement) {
        beforeElement = container.querySelector("footer")
      }
      if (beforeElement) {
        var sec = document.createElement("section")
        sec.setAttribute("data-value", "true")
        sec.innerHTML = renderAchievement(achievement.subject, achievement.description, achievement.highlight)
        container.insertBefore(sec, beforeElement)
      }
    }
  }
}
function renderAchievement(subject, description, highlight) {
  var star = highlight ? '<i class="star"></i>' : ""
  return (
    "<h3>" +
    escapeHTML(subject) +
    star +
    '</h3>\n<p class="description">' +
    escapeHTML(description) +
    '</p>\n<button type="button" class="btn-remove" onclick="removeParent(this)"></button>'
  )
}
function toggleView(target, viewId, editorId, toolbarId) {
  var form = target.form
  if (form) {
    var contentView = form.querySelector("#" + viewId)
    var editor = form.querySelector("#" + editorId)
    var toolbar_1 = form.querySelector("#" + toolbarId)
    if (contentView && editor && toolbar_1) {
      if (contentView.style.display !== "none") {
        if (contentView.form) {
          contentView.form.quill.clipboard.dangerouslyPasteHTML(contentView.value)
        }
        contentView.style.display = "none"
        editor.style.display = "block"
        toolbar_1.style.display = "block"
      } else {
        if (contentView.form) {
          var html = contentView.form.quill.root.innerHTML
          html = html.replace(/ class=\"ql-indent-\\d+\"/g, "")
          contentView.value = html
        }
        contentView.style.display = "block"
        editor.style.display = "none"
        toolbar_1.style.display = "none"
      }
    }
  }
}
