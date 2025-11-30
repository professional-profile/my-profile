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
function editPart(target, containerId, partialName, toggleClassName) {
  var container = document.getElementById(containerId)
  if (container) {
    var url = getCurrentURL() + "/" + partialName
    var form_1 = target.form
    if (container) {
      showLoading()
      loadAjax(
        url,
        container,
        function () {
          hideLoading()
          if (form_1 && toggleClassName) {
            hideOtherElements(form_1, target, toggleClassName)
          }
        },
        hideLoading,
      )
    }
  }
}
function closePart(target, containerId, partialName, toggleClassName) {
  var container = document.getElementById(containerId)
  if (container) {
    var url = getCurrentURL() + "/" + partialName
    var form_2 = target.form
    if (container) {
      showLoading()
      loadAjax(
        url,
        container,
        function () {
          hideLoading()
          if (form_2 && toggleClassName) {
            showOtherElements(form_2, target, toggleClassName)
          }
        },
        hideLoading,
      )
    }
  }
}
function submitPartialForm(e, containerId, successPartialName, toggleClassName, confirm) {
  e.preventDefault()
  var target = e.target
  var form = target.form
  var valid = validateForm(form)
  if (!valid) {
    return
  }
  var data = decodeFromForm(form)
  var url = getCurrentURL()
  if (confirm) {
    var confirmMsg = getConfirmMessage(target, resource)
    showConfirm(confirmMsg, function () {
      callSubmitPartialForm(url, form, data, containerId, successPartialName, toggleClassName)
    })
  } else {
    callSubmitPartialForm(url, form, data, containerId, successPartialName, toggleClassName)
  }
}
function callSubmitPartialForm(url, form, data, containerId, successPartialName, toggleClassName) {
  var resource = getResource()
  showLoading()
  fetch(url, {
    method: "POST",
    headers: getHttpHeaders(),
    body: JSON.stringify(data),
  })
    .then(function (response) {
      hideLoading()
      if (response.ok) {
        if (containerId) {
          var container = document.getElementById(containerId)
          if (container) {
            loadAjax(url + "/" + successPartialName, container)
            if (toggleClassName) {
              showOtherElements(form, undefined, toggleClassName)
            }
          }
        }
      } else {
        handleJsonError(response, resource, form)
      }
    })
    .catch(function (err) {
      return handleError(err, resource.error_network)
    })
}
