const handsfree = window.handsfree = new Handsfree({hands: true})
handsfree.enablePlugins('browser')

// listen to clicks, check if .handsfree-start is clicked
document.addEventListener('click', (event) => {
  if (event.target.matches('.handsfree-start')) {
    handsfree.start()
  }
  if (event.target.matches('.handsfree-stop')) {
    handsfree.stop()
  }
})
