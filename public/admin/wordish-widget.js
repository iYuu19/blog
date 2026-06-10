(function () {
  function ensureGlobals() {
    if (!window.CMS || !window.toastui || !window.toastui.Editor || !window.createClass || !window.h) {
      throw new Error("Wordish editor dependencies are missing.");
    }
  }

  function toText(value) {
    return typeof value === "string" ? value : "";
  }

  function readBlobAsDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = () => reject(reader.error || new Error("Failed to read image blob."));
      reader.readAsDataURL(blob);
    });
  }

  ensureGlobals();

  const Editor = window.toastui.Editor;
  const h = window.h;
  const createClass = window.createClass;

  const toolbarItems = [
    ["heading", "bold", "italic", "strike"],
    ["hr", "quote"],
    ["ul", "ol", "task", "indent", "outdent"],
    ["table", "link", "image"],
    ["code", "codeblock"]
  ];

  const commonCodeLanguages = [
    { label: "JS", value: "js" },
    { label: "Python", value: "python" },
    { label: "Bash", value: "bash" },
    { label: "HTML", value: "html" },
    { label: "YAML", value: "yaml" },
    { label: "JSON", value: "json" },
    { label: "SQL", value: "sql" },
    { label: "Text", value: "text" }
  ];

  const WordishControl = createClass({
    getInitialState() {
      return {
        errorMessage: ""
      };
    },

    componentDidMount() {
      this.isMountedFlag = true;
      this.lastKnownValue = toText(this.props.value);
      this.mountEditor();
    },

    componentDidUpdate(prevProps) {
      if (!this.editor) {
        return;
      }

      const previousValue = toText(prevProps.value);
      const nextValue = toText(this.props.value);

      if (previousValue === nextValue) {
        return;
      }

      const currentValue = this.editor.getMarkdown();
      if (nextValue !== currentValue && nextValue !== this.lastKnownValue) {
        this.editor.setMarkdown(nextValue, false);
        this.lastKnownValue = nextValue;
      }
    },

    componentWillUnmount() {
      this.isMountedFlag = false;
      if (this.editor) {
        this.editor.destroy();
        this.editor = null;
      }
    },

    async handleImageBlob(blob, callback) {
      try {
        const imageDataUrl = await readBlobAsDataUrl(blob);
        const altText = blob && blob.name ? blob.name.replace(/\.[^.]+$/, "") : "截图";
        callback(imageDataUrl, altText);
        this.clearError();
        return false;
      } catch (error) {
        console.error(error);
        this.setState({
          errorMessage: "图片粘贴失败了，可以改用拖拽图片再试一次。"
        });
        return false;
      }
    },

    handleChange() {
      if (!this.editor) {
        return;
      }

      const nextValue = this.editor.getMarkdown();
      this.lastKnownValue = nextValue;

      if (nextValue !== toText(this.props.value)) {
        this.props.onChange(nextValue);
      }
    },

    clearError() {
      if (this.state.errorMessage) {
        this.setState({ errorMessage: "" });
      }
    },

    insertCodeBlock(language) {
      if (!this.editor) {
        return;
      }

      const resolvedLanguage = language || "text";
      const snippet = `\n\`\`\`${resolvedLanguage}\n在这里写 ${resolvedLanguage} 代码\n\`\`\`\n`;
      this.editor.insertText(snippet);
      this.handleChange();
      this.clearError();
    },

    insertCustomCodeBlock() {
      const input = window.prompt("输入代码块语言，例如 python、bash、js、yaml：", "python");
      if (!input) {
        return;
      }

      this.insertCodeBlock(input.trim().toLowerCase());
    },

    mountEditor() {
      if (!this.editorRoot) {
        return;
      }

      try {
        this.editor = new Editor({
          el: this.editorRoot,
          height: "720px",
          minHeight: "520px",
          initialValue: toText(this.props.value),
          initialEditType: "wysiwyg",
          previewStyle: "vertical",
          hideModeSwitch: false,
          usageStatistics: false,
          autofocus: false,
          toolbarItems,
          placeholder:
            "从这里开始写题解。可以直接 Ctrl+V 粘贴截图，也可以拖拽图片进来；代码块按钮在工具栏最后一组。",
          hooks: {
            addImageBlobHook: this.handleImageBlob
          }
        });

        this.editor.on("change", this.handleChange);
      } catch (error) {
        console.error(error);
        this.setState({
          errorMessage: "可视化编辑器启动失败了，请刷新后台再试。"
        });
      }
    },

    setEditorRoot(element) {
      this.editorRoot = element;
    },

    render() {
      const hint = this.props.field && this.props.field.get ? this.props.field.get("hint") : "";

      return h(
        "div",
        {
          className: "wordish-field"
        },
        h(
          "div",
          {
            className: "wordish-toolbar-note"
          },
          h("strong", {}, "Word 风格正文"),
          h(
            "span",
            {},
            "支持直接粘贴截图、拖拽图片、所见即所得排版，还保留行内代码和代码块。工具栏里 </> 是行内代码，CB 是代码块。"
          )
        ),
        h(
          "div",
          {
            className: "wordish-code-shortcuts"
          },
          h(
            "span",
            {
              className: "wordish-shortcuts-label"
            },
            "常用代码块："
          ),
          ...commonCodeLanguages.map((item) =>
            h(
              "button",
              {
                type: "button",
                className: "wordish-shortcut-button",
                onClick: () => this.insertCodeBlock(item.value)
              },
              item.label
            )
          ),
          h(
            "button",
            {
              type: "button",
              className: "wordish-shortcut-button is-accent",
              onClick: this.insertCustomCodeBlock
            },
            "自定义语言"
          )
        ),
        hint
          ? h(
              "p",
              {
                className: "wordish-hint"
              },
              hint
            )
          : null,
        this.state.errorMessage
          ? h(
              "p",
              {
                className: "wordish-error"
              },
              this.state.errorMessage
            )
          : null,
        h("div", {
          className: "wordish-editor-shell",
          ref: this.setEditorRoot
        }),
        h(
          "p",
          {
            className: "wordish-footnote"
          },
          "当前图片会直接嵌入文章内容里，所以复制粘贴最顺手。代码块如果带上 js / python / bash / html / yaml 这类语言名，前台会自动做语法高亮。"
        )
      );
    }
  });

  window.CMS.registerWidget("wordish", WordishControl);
})();
