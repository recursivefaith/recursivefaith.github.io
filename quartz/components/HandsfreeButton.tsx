import { QuartzComponentConstructor } from "./types"

function HandsfreeButton() {
  // From the documentation [17]:
  // "Let's always ask the user to start"
  return (
    <div>
      <button className="width-full bg-tertiary handsfree handsfree-start handsfree-show-when-stopped handsfree-hide-while-loading">Start Handsfree Webcam</button>
      <button className="width-full bg-highlight handsfree handsfree-show-when-loading">...loading...</button>
      <button className="width-full bg-secondary handsfree handsfree-stop handsfree-show-when-started">Stop Handsfree Webcam</button>
    </div>
  )
}

export default (() => HandsfreeButton) satisfies QuartzComponentConstructor