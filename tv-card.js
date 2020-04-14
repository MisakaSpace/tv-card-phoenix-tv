const LitElement = Object.getPrototypeOf(
  customElements.get("ha-panel-lovelace")
);
const html = LitElement.prototype.html;

class TVCardServices extends LitElement {
  static get properties() {
    return {
      hass: {},
      _config: {},
      _apps: {}
    };
  }

//  static async getConfigElement() {
//    await import("./tv-card-phoenix-tv-editor.js");
//    return document.createElement("tv-card-editor");
//  }

  static getStubConfig() {
    return {};
  }

  getCardSize() {
    return 7;
  }

  setConfig(config) {
    if (!config.entity) {
      console.log("Invalid configuration");
      return;
    }

    this._config = { theme: "default", ...config };
  }

  render() {
    if (!this._config || !this.hass) {
      return html``;
    }

    const stateObj = this.hass.states[this._config.entity];
    return html`
      ${this.renderStyle()}
      <ha-card .header="${this._config.name}">
        <div class="row"></div>
        <div class="row">
          <paper-icon-button 
            .action="${"power"}" 
            @click="${this.handleActionClick}" 
            icon="mdi:power"
            title="Power"
          ></paper-icon-button>
          
          <paper-icon-button
            .action="${"volume_down"}"
            @click="${this.handleActionClick}"
            icon="mdi:volume-medium"
            title="Volume -"
          ></paper-icon-button>
          
          <paper-icon-button
            .action="${"volume_up"}"
            @click="${this.handleActionClick}"
            icon="mdi:volume-high"
            title="Volume +"
          ></paper-icon-button>
        </div>

        <div class="row">
          <paper-icon-button
            .action="${"c3"}"
            @click="${this.handleActionClick}"
            icon="mdi:numeric-3"
            title="3"
          ></paper-icon-button>
        </div>
      </div>
      </ha-card>
    `;
  }

  updated(changedProps) {
    if (!this._config) {
      return;
    }

    const oldHass = changedProps.get("hass");
    if (!oldHass || oldHass.themes !== this.hass.themes) {
      this.applyThemesOnElement(this, this.hass.themes, this._config.theme);
    }
  }

  renderStyle() {
    return html`
      <style>
        .remote {
          padding: 16px 0px 16px 0px;
        }
        img,
        paper-icon-button {
          width: 64px;
          height: 64px;
          cursor: pointer;
        }
        .row {
          display: flex;
          padding: 8px 36px 8px 36px;
          justify-content: space-evenly;
        }
        .diagonal {
          background-color: var(--light-primary-color);
        }
      </style>
    `;
  }

  launchApp(e) {
    this.hass.callService("media_player", "select_source", {
      entity_id: this._config.entity,
      source: e.currentTarget.value
    });
  }

  handleActionClick(e) {
    const custom_services = [
      "power",
      "volume_up",
      "volume_down",
      "c3"
    ];

    if (
      custom_services.indexOf(e.currentTarget.action) >= 0 &&
      this._config[e.currentTarget.action]
    ) {
      const [domain, service] = this._config[
        e.currentTarget.action
      ].service.split(".", 2);
      this.hass.callService(
        domain,
        service,
        this._config[e.currentTarget.action].service_data
          ? this._config[e.currentTarget.action].service_data
          : null
      );
    } else {
      let remote = this._config.remote
        ? this._config.remote
        : "remote." + this._config.entity.split(".")[1];
      this.hass.callService("remote", "send_command", {
        entity_id: remote,
        command: e.currentTarget.action
      });
    }
  }

  applyThemesOnElement(element, themes, localTheme) {
    if (!element._themes) {
      element._themes = {};
    }
    let themeName = themes.default_theme;
    if (localTheme === "default" || (localTheme && themes.themes[localTheme])) {
      themeName = localTheme;
    }
    const styles = Object.assign({}, element._themes);
    if (themeName !== "default") {
      var theme = themes.themes[themeName];
      Object.keys(theme).forEach(key => {
        var prefixedKey = "--" + key;
        element._themes[prefixedKey] = "";
        styles[prefixedKey] = theme[key];
      });
    }
    if (element.updateStyles) {
      element.updateStyles(styles);
    } else if (window.ShadyCSS) {
      // implement updateStyles() method of Polemer elements
      window.ShadyCSS.styleSubtree(
        /** @type {!HTMLElement} */ (element),
        styles
      );
    }

    const meta = document.querySelector("meta[name=theme-color]");
    if (meta) {
      if (!meta.hasAttribute("default-content")) {
        meta.setAttribute("default-content", meta.getAttribute("content"));
      }
      const themeColor =
        styles["--primary-color"] || meta.getAttribute("default-content");
      meta.setAttribute("content", themeColor);
    }
  }
}

customElements.define("tv-card-phoenix-tv", TVCardServices);
