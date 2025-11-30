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
