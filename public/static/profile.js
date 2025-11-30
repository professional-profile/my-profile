"use strict"
function editUserInterests(target) {
  hideOtherElements(target, "btn-edit")
  var url = getCurrentURL()
  console.log("url " + url)
  url = url + "/interests_update"
  console.log("url " + url)
  var container = document.getElementById("userInterests")
  if (container) {
    showLoading()
    fetch(url, {
      method: "GET",
      headers: getHttpHeaders(),
    })
      .then(function (response) {
        if (response.ok) {
          response
            .text()
            .then(function (data) {
              container.innerHTML = data
              hideLoading()
            })
            .catch(function (err) {
              return handleError(err, resource.error_response_body)
            })
        } else {
          hideLoading()
          if (response.status === 401) {
            window.location.href = buildLoginUrl()
          } else if (response.status === 403) {
            alertError(resource.error_403)
          } else if (response.status === 404) {
            alertError(resource.error_404)
          } else {
            console.error("Error: ", response.statusText)
            alertError(resource.error_submit_failed, response.statusText)
          }
        }
      })
      .catch(function (err) {
        return handleError(err, resource.error_network)
      })
  }
}
function hideOtherElements(target, className) {
  var form = target.form
  if (form) {
    for (var i = 0; i < form.length; i++) {
      var ele = form[i]
      if (ele !== target && ele.classList.contains(className)) {
        ele.hidden = true
      }
    }
  }
}
