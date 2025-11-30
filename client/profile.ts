function editUserInterests(target: HTMLButtonElement) {
  hideOtherElements(target, "btn-edit")
  let url = getCurrentURL()
  console.log("url " + url)
  url = url + "/interests_update"
  console.log("url " + url)
  const container = document.getElementById("userInterests")
  if (container) {
    showLoading()
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
              hideLoading()
            })
            .catch((err) => handleError(err, resource.error_response_body))
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
      .catch((err) => handleError(err, resource.error_network))
  }
}
function hideOtherElements(target: HTMLButtonElement, className: string) {
  const form = target.form
  if (form) {
    for (let i = 0; i < form.length; i++) {
      const ele = form[i] as HTMLInputElement
      if (ele !== target && ele.classList.contains(className)) {
        ele.hidden = true
      }
    }
  }
}
