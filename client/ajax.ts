function loadAjax(url: string, container: HTMLElement, handleSuccess?: () => void, handleFail?: () => void) {
  fetch(url, {
    method: "GET",
    headers: getHttpHeaders(),
  })
    .then((response) => {
      if (response.ok) {
        response
          .text()
          .then((data) => {
            container.innerHTML = data
            if (handleSuccess) {
              handleSuccess()
            }
          })
          .catch((err) => {
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
    .catch((err) => handleError(err, resource.error_network))
}
function hideOtherElements(form: HTMLFormElement, target: HTMLButtonElement, className: string) {
  if (form) {
    for (let i = 0; i < form.length; i++) {
      const ele = form[i] as HTMLInputElement
      if (ele !== target && ele.classList.contains(className)) {
        ele.hidden = true
      }
    }
  }
}
function showOtherElements(form: HTMLFormElement, target: HTMLButtonElement, className: string) {
  if (form) {
    for (let i = 0; i < form.length; i++) {
      const ele = form[i] as HTMLInputElement
      if (ele !== target && ele.classList.contains(className)) {
        ele.hidden = false
      }
    }
  }
}
function editPart(target: HTMLButtonElement, containerId: string, partialName: string, toggleClassName?: string) {
  const container = document.getElementById(containerId)
  if (container) {
    const url = getCurrentURL() + "/" + partialName
    const form = target.form as HTMLFormElement
    if (container) {
      showLoading()
      loadAjax(
        url,
        container,
        function () {
          hideLoading()
          if (form && toggleClassName) {
            hideOtherElements(form, target, toggleClassName)
          }
        },
        hideLoading,
      )
    }
  }
}

function closePart(target: HTMLButtonElement, containerId: string, partialName: string, toggleClassName?: string) {
  const container = document.getElementById(containerId)
  if (container) {
    const url = getCurrentURL() + "/" + partialName
    const form = target.form as HTMLFormElement
    if (container) {
      showLoading()
      loadAjax(
        url,
        container,
        function () {
          hideLoading()
          if (form && toggleClassName) {
            showOtherElements(form, target, toggleClassName)
          }
        },
        hideLoading,
      )
    }
  }
}
