"use strict"
function saveItem(id) {
  var url = getCurrentURL()
  if (id && id.length > 0) {
    url = removeLast(url) + "/" + id
  }
  showLoading()
  fetch(url, {
    method: "PATCH",
    headers: getHttpHeaders(),
  })
    .then(function (response) {
      hideLoading()
      if (response.ok) {
        alertSuccess("Save item successfully")
      } else {
        if (response.status === 401) {
          window.location.href = buildLoginUrl()
        } else if (response.status === 409) {
        } else if (response.status === 422) {
          alertWarning("You reach the maximum of saved articles: 200. Remove some articles to have more slots to save.")
        }
      }
    })
    .catch(function (err) {
      return handleError(err, resource.error_network)
    })
}
function removeItem(id) {
  var url = getCurrentURL()
  if (id && id.length > 0) {
    url = removeLast(url) + "/" + id
  }
  showLoading()
  fetch(url, {
    method: "PATCH",
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
        }
      }
    })
    .catch(function (err) {
      return handleError(err, resource.error_network)
    })
}
