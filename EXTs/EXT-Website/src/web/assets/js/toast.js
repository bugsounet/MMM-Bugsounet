/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/bootstrap-show-toast
 * License: MIT, see file 'LICENSE'
 * Modified for self usage and add animateCSS
 */

/* global bootstrap */

(function (bootstrap) {
  "use strict";

  function createElement (html) {
    const template = document.createElement("template");
    template.innerHTML = html.trim();
    return template.content.firstChild;
  }

  function Toast (props) {
    // see https://getbootstrap.com/docs/5.2/components/toasts/
    this.props = {
      header: "", // the header text
      headerSmall: "", // additional text in the header, aligns right
      body: "", // the body text of the toast
      closeButton: true, // show a close button
      closeButtonLabel: "close", // the label of the close button "x"
      closeButtonClass: "", // e.g. set to "btn-close-white" for a white "x" on a dark background
      toastClass: "", // the class of the toast, may be "text-bg-danger", see the bootstrap documentation
      animation: true, // apply default CSS fade transition to the toast
      animationPrefix: "animate_", // prefix of animateCSS
      animationInClass: "bounceInRight", // animateCSS In Class
      animationOutClass: "bounceOutRight", // animateCSS Out Class
      delay: 5000, //	delay in milliseconds before hiding the toast, set delay to `Infinity` to make it sticky
      position: "top-0 end-0", // top right
      direction: "append", // or "prepend", the stack direction
      ariaLive: "assertive" // the "aria-live" attribute, for accessibility
    };
    for (let prop in props) {
      this.props[prop] = props[prop];
    }
    this.containerId = `bootstrap-show-toast-container-${this.props.position.replaceAll(" ", "_")}`;
    const cssClass = (`toast ${this.props.toastClass}`).trim();
    let toastHeader = "";
    const showHeader = this.props.header || this.props.headerSmall;
    if (showHeader) {
      toastHeader = `<div class="toast-header">
                      <strong class="me-auto">${this.props.header}</strong>
                      ${this.props.headerSmall ? `<small>${this.props.headerSmall}</small>` : ""}
                      ${this.props.closeButton ? `<button type="button" class="btn-close ${this.props.closeButtonClass}" data-bs-dismiss="toast" aria-label="${this.props.closeButtonLabel}"></button>` : ""}
                    </div>`;
    }
    this.template = `<div class="${cssClass}" role="alert" aria-live="${this.props.ariaLive}" aria-atomic="true">
                       ${toastHeader}
                       <div class="d-flex">
                         <div class="toast-body">
                           ${this.props.body}
                         </div>
                         ${(!showHeader && this.props.closeButton) ? `<button type="button" class="btn-close me-2 mx-auto ${this.props.closeButtonClass}" style="margin-top: 0.69rem" data-bs-dismiss="toast" aria-label="${this.props.closeButtonLabel}"></button>` : ""}
                       </div>
                     </div>`;
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.id = this.containerId;
      this.container.setAttribute("class", `toast-container position-fixed p-3 ${this.props.position}`);
      document.body.appendChild(this.container);
    }
    this.element = createElement(this.template);
    this.toast = this.showToast(this.element);
  }

  Toast.prototype.showToast = function (toastElement) {
    const animateCSS = (element, animation) => {
      // We create a Promise and return it
      return new Promise((resolve) => {
        const animationName = `${this.props.animationPrefix}${animation}`;
        element.setAttribute("style", "display:block !important");
        element.classList.add(`${this.props.animationPrefix}animated`, animationName);
        // When the animation ends, we clean the classes and resolve the Promise
        const handleAnimationEnd = (event) => {
          event.stopPropagation();
          element.classList.remove(`${this.props.animationPrefix}animated`, animationName);
          resolve("Animation ended");
        };
        element.addEventListener("animationend", handleAnimationEnd, { once: true });
      });
    };

    if (this.props.direction === "prepend") {
      this.container.prepend(toastElement);
    } else {
      this.container.append(toastElement);
    }
    this.toast = new bootstrap.Toast(toastElement, {
      animation: (this.props.animationInClass && this.props.animationOutClass) ? false : this.props.animation,
      autohide: this.props.delay !== Infinity,
      delay: this.props.delay
    });
    if (this.props.animationInClass && this.props.animationOutClass) {
      animateCSS(toastElement, this.props.animationInClass);
    }
    this.toast.show();
    // remove on close, see https://github.com/shaack/bootstrap-show-toast/pull/3
    toastElement.addEventListener("hidden.bs.toast", () => {
      if (this.props.animationInClass && this.props.animationOutClass) {
        toastElement.classList.remove(this.props.animationInClass); // Remove show animation classes
        animateCSS(toastElement, this.props.animationOutClass).then(() => {
          toastElement.remove();
          if (this.container.children.length === 0) {
            this.container.remove();
          }
        });
      } else {
        toastElement.remove();
        if (this.container.children.length === 0) {
          this.container.remove();
        }
      }
    });
    return toastElement;
  };

  bootstrap.showToast = function (props) {
    return new Toast(props);
  };

}(bootstrap));
