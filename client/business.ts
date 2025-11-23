function saveItem(target: HTMLElement, id: string, remove?: boolean) {
  let url = getCurrentURL()
  url = (remove ? removeLast(url) : url) + "/" + id
  showLoading()
  fetch(url, {
    method: "PATCH",
    headers: getHttpHeaders(),
  })
    .then((response) => {
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
    .catch((err) => handleError(err, resource.error_network))
}
function removeItem(target: HTMLElement, id: string, remove?: boolean) {
  let url = getCurrentURL()
  url = (remove ? removeLast(url) : url) + "/" + id
  showLoading()
  fetch(url, {
    method: "DELETE",
    headers: getHttpHeaders(),
  })
    .then((response) => {
      hideLoading()
      if (response.ok) {
        toast("Remove item successfully")
      } else {
        if (response.status === 401) {
          window.location.href = buildLoginUrl()
        } else if (response.status === 410) {
          toast("No change. You already removed this item before.")
        }
      }
    })
    .catch((err) => handleError(err, resource.error_network))
}
function follow(target: HTMLElement, id: string, remove?: boolean) {
  let url = getCurrentURL()
  url = (remove ? removeLast(url) : url) + "/" + id
  showLoading()
  fetch(url, {
    method: "PATCH",
    headers: getHttpHeaders(),
  })
    .then((response) => {
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
    .catch((err) => handleError(err, resource.error_network))
}
function unfollow(target: HTMLElement, id: string, remove?: boolean) {
  let url = getCurrentURL()
  url = (remove ? removeLast(url) : url) + "/" + id
  showLoading()
  fetch(url, {
    method: "DELETE",
    headers: getHttpHeaders(),
  })
    .then((response) => {
      hideLoading()
      if (response.ok) {
        toast("Unfollow successfully")
      } else {
        if (response.status === 401) {
          window.location.href = buildLoginUrl()
        } else if (response.status === 410) {
          toast("No change. You already unfollowed this user before.")
        }
      }
    })
    .catch((err) => handleError(err, resource.error_network))
}

function toggleView(target: HTMLButtonElement, viewId: string, editorId: string, toolbarId: string) {
  const form = target.form
  if (form) {
    const contentView = form.querySelector("#" + viewId) as HTMLTextAreaElement
    const editor = form.querySelector("#" + editorId) as HTMLElement
    const toolbar = form.querySelector("#" + toolbarId) as HTMLElement

    if (contentView && editor && toolbar) {
      if (contentView.style.display !== "none") {
        // HTML to Quill
        if (contentView.form) {
          // quill.root.innerHTML = htmlEditor.value
          // quill.setContents(htmlEditor.value)
          contentView.form.quill.clipboard.dangerouslyPasteHTML(contentView.value)
        }
        contentView.style.display = "none"
        editor.style.display = "block"
        toolbar.style.display = "block"
      } else {
        // Quill to HTML
        if (contentView.form) {
          let html = contentView.form.quill.root.innerHTML
          html = html.replace(/ class=\"ql-indent-\\d+\"/g, "")
          contentView.value = html
        }
        contentView.style.display = "block"
        editor.style.display = "none"
        toolbar.style.display = "none"
      }
    }
  }
}
