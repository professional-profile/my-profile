function editUserInterests(target: HTMLButtonElement) {
  const url = getCurrentURL() + "/interests_update"
  const container = document.getElementById("userInterests")
  const form = target.form as HTMLFormElement
  if (container) {
    showLoading()
    loadAjax(
      url,
      container,
      function () {
        hideLoading()
        hideOtherElements(form, target, "btn-edit")
      },
      hideLoading,
    )
  }
}
function closeUserInterests(target: HTMLButtonElement) {
  const url = getCurrentURL() + "/interests"
  const container = document.getElementById("userInterests")
  const form = target.form as HTMLFormElement
  if (container) {
    showLoading()
    loadAjax(
      url,
      container,
      function () {
        hideLoading()
        showOtherElements(form, target, "btn-edit")
      },
      hideLoading,
    )
  }
}
