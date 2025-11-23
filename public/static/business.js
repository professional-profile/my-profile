function saveItem(target, id, remove) {
  var url = getCurrentURL()
  url = (remove ? removeLast(url) : url) + "/" + id
  showLoading()
  fetch(url, {
    method: "PATCH",
    headers: getHttpHeaders(),
  })
    .then(function (response) {
      hideLoading()
      if (response.ok) {
        toast("Save item successfully")
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
  showLoading()
  fetch(url, {
    method: "DELETE",
    headers: getHttpHeaders(),
  })
    .then(function (response) {
      hideLoading()
      if (response.ok) {
        alertSuccess("Remove item successfully")
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
  showLoading()
  fetch(url, {
    method: "PATCH",
    headers: getHttpHeaders(),
  })
    .then(function (response) {
      hideLoading()
      if (response.ok) {
        toast("Follow successfully")
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
  showLoading()
  fetch(url, {
    method: "DELETE",
    headers: getHttpHeaders(),
  })
    .then(function (response) {
      hideLoading()
      if (response.ok) {
        alertSuccess("Remove item successfully")
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
