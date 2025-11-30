"use strict"
function loadAjax(url, container, handleSuccess, handleFail) {
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
            if (handleSuccess) {
              handleSuccess()
            }
          })
          .catch(function (err) {
            if (handleFail) {
              handleFail()
            }
            handleError(err, resource.error_response_body)
          })
      } else {
        if (response.status === 401) {
          if (handleFail) {
            handleFail()
          }
          window.location.href = buildLoginUrl()
        } else {
          if (handleFail) {
            handleFail()
          }
          if (response.status === 403) {
            alertError(resource.error_403)
          } else if (response.status === 404) {
            alertError(resource.error_404)
          } else {
            console.error("Error: ", response.statusText)
            alertError(resource.error_ajax, response.statusText)
          }
        }
      }
    })
    .catch(function (err) {
      return handleError(err, resource.error_network)
    })
}
function hideOtherElements(form, target, className) {
  if (form) {
    for (var i = 0; i < form.length; i++) {
      var ele = form[i]
      if (ele !== target && ele.classList.contains(className)) {
        ele.hidden = true
      }
    }
  }
}
function showOtherElements(form, target, className) {
  if (form) {
    for (var i = 0; i < form.length; i++) {
      var ele = form[i]
      if (ele !== target && ele.classList.contains(className)) {
        ele.hidden = false
      }
    }
  }
}
