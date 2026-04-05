"use strict"
function openReview(id) {
  var modalDiv = document.getElementById(id)
  if (modalDiv) {
    modalDiv.style.display = "flex"
  }
}
function cancelReview(id) {
  var modalDiv = document.getElementById(id)
  if (modalDiv) {
    modalDiv.style.display = "none"
  }
}
function submitReview(e, containerId) {
  e.preventDefault()
  var btn = e.target
  var form = btn.form
  if (form) {
    var review = getValue(form, "review")
    var picker = form.querySelector(".star-picker")
    if (picker) {
      var v = picker.dataset.v
      if (!v) {
        alertWarning("Please select rating")
      } else {
        var rate = parseInt(v, 10)
        var data = { rate: rate, review: review }
        var resource_1 = getResource()
        var url = getCurrentURL()
        fetch(url, {
          method: "POST",
          headers: getHttpHeaders(),
          body: JSON.stringify(data),
        })
          .then(function (response) {
            hideLoading()
            if (response.ok) {
              alertSuccess("Review is submitted successfully")
              var modal = findParent(form, "modal-bg")
              if (modal) {
                modal.style.display = "none"
              }
              if (containerId) {
                var container_1 = document.getElementById(containerId)
                if (container_1) {
                  var contentType = response.headers.get("Content-Type")
                  if (contentType && contentType.includes("text/html")) {
                    response
                      .text()
                      .then(function (data) {
                        container_1.innerHTML = data
                      })
                      .catch(function (err) {
                        return handleError(err, resource_1.error_response_body)
                      })
                  }
                }
              }
            } else {
              handleJsonError(response, resource_1, form)
            }
          })
          .catch(function (err) {
            return handleError(err, resource_1.error_network)
          })
      }
    }
  }
}
function starOnMouseEnter(e) {
  var star = e.target
  var picker = star.parentElement
  var value = Number(star.dataset.v)
  var starts = picker.querySelectorAll("span")
  highlight(starts, value)
}
function starOnMouseLeave(e) {
  var star = e.target
  var picker = star.parentElement
  var value = Number(picker.dataset.v ? picker.dataset.v : 0)
  var starts = picker.querySelectorAll("span")
  highlight(starts, value)
}
function starOnClick(e) {
  var star = e.target
  var picker = star.parentElement
  picker.childNodes
  picker.setAttribute("data-v", star.dataset.v)
  var value = Number(star.dataset.v)
  var starts = picker.querySelectorAll("span")
  highlight(starts, value)
}
function highlight(stars, r) {
  stars.forEach(function (s) {
    return s.classList.toggle("active", r >= s.dataset.v)
  })
}
