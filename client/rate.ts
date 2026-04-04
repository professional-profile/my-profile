function openReview(id: string) {
  const modalDiv = document.getElementById(id)
  if (modalDiv) {
    modalDiv.style.display = "flex"
  }
}
function cancelReview(id: string) {
  const modalDiv = document.getElementById(id)
  if (modalDiv) {
    modalDiv.style.display = "none"
  }
}
function submitReview(e: Event) {
  e.preventDefault()
  const btn = e.target as HTMLButtonElement
  const form = btn.form
  if (form) {
    const review = getValue(form, "review") as string
    const picker = form.querySelector(".star-picker") as HTMLElement
    if (picker) {
      const v = picker.dataset.v
      if (!v) {
        alertWarning("Please select rating")
      } else {
        const rate = parseInt(v, 10)
        const data = { rate, review }
        const resource = getResource()
        const url = getCurrentURL()
        fetch(url, {
          method: "POST",
          headers: getHttpHeaders(),
          body: JSON.stringify(data),
        })
          .then((response) => {
            hideLoading()
            if (response.ok) {
              alertSuccess("Review is submitted successfully")
              const modal = findParent(form, "modal-bg")
              if (modal) {
                modal.style.display = "none"
              }
            } else {
              handleJsonError(response, resource, form)
            }
          })
          .catch((err) => handleError(err, resource.error_network))
      }
    }
  }
}
function starOnMouseEnter(e: Event) {
  const star = e.target as HTMLElement
  const picker = star.parentElement as HTMLElement
  const value = Number(star.dataset.v)
  const starts = picker.querySelectorAll("span")
  highlight(starts, value)
}
function starOnMouseLeave(e: Event) {
  const star = e.target as HTMLElement
  const picker = star.parentElement as HTMLElement
  const value = Number(picker.dataset.v ? picker.dataset.v : 0)
  const starts = picker.querySelectorAll("span")
  highlight(starts, value)
}
function starOnClick(e: Event) {
  const star = e.target as HTMLElement
  const picker = star.parentElement as HTMLElement
  picker.childNodes
  picker.setAttribute("data-v", star.dataset.v as string)
  const value = Number(star.dataset.v)
  const starts = picker.querySelectorAll("span")
  highlight(starts, value)
}
function highlight(stars: NodeListOf<HTMLSpanElement>, r: number) {
  stars.forEach((s) => s.classList.toggle("active", r >= (s.dataset.v as any)))
}
