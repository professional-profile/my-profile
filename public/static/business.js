function saveItem(target, id, remove) {
  var url = getCurrentURL()
  url = (remove ? removeLast(url) : url) + "/" + id
  var strue = remove ? ", true" : ""
  if (target.nodeName !== "I") {
    target = target.parentElement
  }
  showLoading()
  fetch(url, {
    method: "PATCH",
    headers: getHttpHeaders(),
  })
    .then(function (response) {
      hideLoading()
      if (response.ok) {
        toast("Save item successfully")
        target.onclick = null
        target.innerText = "bookmark"
        target.setAttribute("onclick", "removeItem(this, '" + escapeHTML(id) + "'" + strue + ")")
      } else {
        if (response.status === 401) {
          window.location.href = buildLoginUrl()
        } else if (response.status === 409) {
          toast("No change. You already saved this item before.")
        } else if (response.status === 422) {
          alertWarning("You reach the maximum of saved articles: 200. Remove some articles to have more slots to save.")
        }
      }
    })
    .catch(function (err) {
      return handleError(err, resource.error_network)
    })
}
function removeItem(target, id, remove) {
  var url = getCurrentURL()
  url = (remove ? removeLast(url) : url) + "/" + id
  var strue = remove ? ", true" : ""
  if (target.nodeName !== "I") {
    target = target.parentElement
  }
  showLoading()
  fetch(url, {
    method: "DELETE",
    headers: getHttpHeaders(),
  })
    .then(function (response) {
      hideLoading()
      if (response.ok) {
        toast("Remove item successfully")
        target.onclick = null
        target.innerText = "bookmark_border"
        target.setAttribute("onclick", "saveItem(this, '" + escapeHTML(id) + "'" + strue + ")")
      } else {
        if (response.status === 401) {
          window.location.href = buildLoginUrl()
        } else if (response.status === 410) {
          toast("No change. You already removed this item before.")
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
  showLoading()
  fetch(url, {
    method: "PATCH",
    headers: getHttpHeaders(),
  })
    .then(function (response) {
      hideLoading()
      if (response.ok) {
        toast("Follow successfully")
        if (target.nodeName === "I") {
          target.onclick = null
          target.innerText = "bookmark"
        } else if (target.nodeName === "BUTTON") {
          target.onclick = null
          target.innerText = target.getAttribute("data-unfollow-text") || ""
        }
        target.setAttribute("onclick", "unfollow(this, '" + escapeHTML(id) + "'" + strue + ")")
      } else {
        if (response.status === 401) {
          window.location.href = buildLoginUrl()
        } else if (response.status === 409) {
          toast("No change. You already follow this user before.")
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
        toast("Unfollow successfully")
        if (target.nodeName === "I") {
          target.onclick = null
          target.innerText = "bookmark_border"
        } else if (target.nodeName === "BUTTON") {
          target.onclick = null
          target.innerText = target.getAttribute("data-follow-text") || ""
        }
        target.setAttribute("onclick", "follow(this, '" + escapeHTML(id) + "'" + strue + ")")
      } else {
        if (response.status === 401) {
          window.location.href = buildLoginUrl()
        } else if (response.status === 410) {
          toast("No change. You already unfollowed this user before.")
        }
      }
    })
    .catch(function (err) {
      return handleError(err, resource.error_network)
    })
}
