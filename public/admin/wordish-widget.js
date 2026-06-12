(function () {
  const CMS_USER_STORAGE_KEY = "decap-cms-user";
  const DEFAULT_MEDIA_FOLDER = "public/uploads";
  const DEFAULT_PUBLIC_FOLDER = "/uploads";
  const CHANGE_DEBOUNCE_MS = 180;
  const MAX_IMAGE_EDGE = 2200;
  const WEBP_QUALITY = 0.86;

  function ensureGlobals() {
    if (!window.CMS || !window.toastui || !window.toastui.Editor || !window.createClass || !window.h) {
      throw new Error("Wordish editor dependencies are missing.");
    }
  }

  function toText(value) {
    return typeof value === "string" ? value : "";
  }

  function listToArray(value) {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value.toJS === "function") {
      const result = value.toJS();
      return Array.isArray(result) ? result : [];
    }

    return [];
  }

  function getEntryField(entry, key) {
    if (!entry || typeof entry.getIn !== "function") {
      return "";
    }

    const value = entry.getIn(["data", key]);

    if (typeof value === "string") {
      return value;
    }

    if (typeof value === "number") {
      return String(value);
    }

    return "";
  }

  function getEntryListField(entry, key) {
    if (!entry || typeof entry.getIn !== "function") {
      return [];
    }

    return listToArray(entry.getIn(["data", key]));
  }

  function buildStatusItem(label, ready, detail) {
    return {
      label,
      ready: !!ready,
      detail: toText(detail)
    };
  }

  function stripQuotes(value) {
    return value.replace(/^['"]|['"]$/g, "");
  }

  function normalizeSlashes(value) {
    return toText(value).replace(/\\/g, "/").replace(/\/{2,}/g, "/");
  }

  function trimTrailingSlash(value) {
    return normalizeSlashes(value).replace(/\/+$/, "");
  }

  function sanitizeFileStem(value) {
    const stem = toText(value)
      .replace(/\.[^.]+$/, "")
      .normalize("NFKD")
      .replace(/[^\w-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();

    return stem || "image";
  }

  function extFromMimeType(mimeType) {
    const normalized = toText(mimeType).toLowerCase();

    if (normalized === "image/jpeg" || normalized === "image/jpg") {
      return "jpg";
    }

    if (normalized === "image/png") {
      return "png";
    }

    if (normalized === "image/webp") {
      return "webp";
    }

    if (normalized === "image/gif") {
      return "gif";
    }

    if (normalized === "image/svg+xml") {
      return "svg";
    }

    return "bin";
  }

  function inferAltText(blob) {
    return blob && blob.name ? sanitizeFileStem(blob.name) : "screenshot";
  }

  function readBlobAsDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = () => reject(reader.error || new Error("Failed to read image blob."));
      reader.readAsDataURL(blob);
    });
  }

  async function blobToBase64Content(blob) {
    const dataUrl = await readBlobAsDataUrl(blob);
    const parts = dataUrl.split(",", 2);

    if (parts.length !== 2 || !parts[1]) {
      throw new Error("Failed to encode image for upload.");
    }

    return parts[1];
  }

  function blobToImage(blob) {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(blob);
      const image = new Image();

      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(image);
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Failed to decode image."));
      };

      image.src = objectUrl;
    });
  }

  function canvasToBlob(canvas, mimeType, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to render optimized image."));
        }
      }, mimeType, quality);
    });
  }

  async function optimizeImageBlob(blob) {
    const bitmapMimePattern = /^image\/(png|jpe?g|webp)$/i;

    if (!blob || !bitmapMimePattern.test(blob.type || "")) {
      return {
        blob,
        extension: extFromMimeType(blob && blob.type)
      };
    }

    const image = await blobToImage(blob);
    const longestEdge = Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height);
    const shouldResize = longestEdge > MAX_IMAGE_EDGE;
    const shouldReencode = (blob.size || 0) > 350 * 1024 || shouldResize;

    if (!shouldReencode) {
      return {
        blob,
        extension: extFromMimeType(blob.type)
      };
    }

    const ratio = shouldResize ? MAX_IMAGE_EDGE / longestEdge : 1;
    const width = Math.max(1, Math.round((image.naturalWidth || image.width) * ratio));
    const height = Math.max(1, Math.round((image.naturalHeight || image.height) * ratio));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      return {
        blob,
        extension: extFromMimeType(blob.type)
      };
    }

    canvas.width = width;
    canvas.height = height;
    context.drawImage(image, 0, 0, width, height);

    const optimizedBlob = await canvasToBlob(canvas, "image/webp", WEBP_QUALITY);
    return {
      blob: optimizedBlob,
      extension: "webp"
    };
  }

  function parseConfigValue(text, key) {
    const pattern = new RegExp("^\\s*" + key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*:\\s*(.+)\\s*$", "m");
    const match = toText(text).match(pattern);

    return match ? stripQuotes(match[1].trim()) : "";
  }

  let uploadConfigPromise = null;

  async function loadUploadConfig() {
    if (!uploadConfigPromise) {
      uploadConfigPromise = fetch("/admin/config.yml", { credentials: "same-origin" })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to load CMS config.");
          }

          return response.text();
        })
        .then((text) => ({
          repo: parseConfigValue(text, "repo"),
          branch: parseConfigValue(text, "branch") || "main",
          mediaFolder: trimTrailingSlash(parseConfigValue(text, "media_folder") || DEFAULT_MEDIA_FOLDER),
          publicFolder: trimTrailingSlash(parseConfigValue(text, "public_folder") || DEFAULT_PUBLIC_FOLDER)
        }));
    }

    return uploadConfigPromise;
  }

  function getCmsSession() {
    try {
      const raw = window.localStorage.getItem(CMS_USER_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  function buildUploadFileName(originalName, extension) {
    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
    const randomPart = Math.random().toString(36).slice(2, 8);
    const stem = sanitizeFileStem(originalName);
    return `${stem}-${timestamp}-${randomPart}.${extension}`;
  }

  function pathToGitHubContentsUrl(repo, path) {
    const encodedPath = normalizeSlashes(path)
      .split("/")
      .filter(Boolean)
      .map((segment) => encodeURIComponent(segment))
      .join("/");

    return `https://api.github.com/repos/${repo}/contents/${encodedPath}`;
  }

  function toPublicAssetPath(repoPath, config) {
    const normalizedPath = trimTrailingSlash(repoPath);
    const normalizedMediaFolder = trimTrailingSlash(config.mediaFolder || DEFAULT_MEDIA_FOLDER);
    const normalizedPublicFolder = trimTrailingSlash(config.publicFolder || DEFAULT_PUBLIC_FOLDER);

    if (normalizedPath.startsWith(normalizedMediaFolder + "/")) {
      return `${normalizedPublicFolder}${normalizedPath.slice(normalizedMediaFolder.length)}`;
    }

    if (normalizedPath.startsWith("public/")) {
      return `/${normalizedPath.slice("public".length).replace(/^\/+/, "")}`;
    }

    return normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`;
  }

  async function uploadImageToRepo(blob, originalName) {
    const config = await loadUploadConfig();
    const session = getCmsSession();
    const token = session && (session.token || session.access_token);

    if (!token) {
      throw new Error("CMS login session expired. Please refresh and sign in again.");
    }

    if (!config.repo) {
      throw new Error("CMS repo is missing from config.yml.");
    }

    const { blob: preparedBlob, extension } = await optimizeImageBlob(blob);
    const fileName = buildUploadFileName(originalName, extension);
    const repoPath = `${trimTrailingSlash(config.mediaFolder)}/${fileName}`;
    const content = await blobToBase64Content(preparedBlob);
    const repoCandidates = [config.repo];

    if (session && session.useOpenAuthoring && session.login) {
      const repoName = config.repo.split("/")[1];
      const forkRepo = repoName ? `${session.login}/${repoName}` : "";

      if (forkRepo && !repoCandidates.includes(forkRepo)) {
        repoCandidates.push(forkRepo);
      }
    }

    let lastError = null;

    for (const repo of repoCandidates) {
      try {
        const response = await fetch(pathToGitHubContentsUrl(repo, repoPath), {
          method: "PUT",
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github+json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message: `chore: upload ${fileName}`,
            content,
            branch: config.branch || "main"
          })
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          const details =
            payload && payload.message ? payload.message : `GitHub upload failed with status ${response.status}.`;
          throw new Error(details);
        }

        return {
          publicPath: toPublicAssetPath(repoPath, config)
        };
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error("Image upload failed.");
  }

  ensureGlobals();

  const Editor = window.toastui.Editor;
  const h = window.h;
  const createClass = window.createClass;

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
        errorMessage: "",
        previewHtml: "",
        showReaderPreview: true
      };
    },

    componentDidMount() {
      this.lastKnownValue = toText(this.props.value);
      this.changeTimer = null;
      this.mountEditor();
    },

    componentDidUpdate(prevProps) {
      if (!this.editor) {
        return;
      }

      const previousValue = toText(prevProps.value);
      const nextValue = toText(this.props.value);

      if (previousValue === nextValue) {
        if (prevProps.entry !== this.props.entry) {
          this.refreshPreview();
        }
        return;
      }

      const currentValue = this.editor.getMarkdown();
      if (nextValue !== currentValue && nextValue !== this.lastKnownValue) {
        this.editor.setMarkdown(nextValue, false);
        this.lastKnownValue = nextValue;
      }

      this.refreshPreview();
    },

    componentWillUnmount() {
      this.flushPendingChange();

      if (this.editor) {
        this.editor.destroy();
        this.editor = null;
      }
    },

    async handleImageBlob(blob, callback) {
      try {
        const altText = inferAltText(blob);
        const { publicPath } = await uploadImageToRepo(blob, blob && blob.name ? blob.name : altText);

        callback(publicPath, altText);
        this.clearError();
        this.scheduleChange();
        return false;
      } catch (error) {
        console.error(error);
        this.setState({
          errorMessage: "Image upload failed. Refresh the admin page and sign in again, then retry the paste."
        });
        return false;
      }
    },

    scheduleChange() {
      if (this.changeTimer) {
        window.clearTimeout(this.changeTimer);
      }

      this.changeTimer = window.setTimeout(() => {
        this.changeTimer = null;
        this.flushPendingChange();
      }, CHANGE_DEBOUNCE_MS);
    },

    flushPendingChange() {
      if (this.changeTimer) {
        window.clearTimeout(this.changeTimer);
        this.changeTimer = null;
      }

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

    toggleReaderPreview() {
      this.setState((state) => ({
        showReaderPreview: !state.showReaderPreview
      }));
    },

    refreshPreview() {
      if (!this.editor) {
        return;
      }

      const nextHtml = this.editor.getHTML();

      if (nextHtml !== this.state.previewHtml) {
        this.setState({
          previewHtml: nextHtml
        });
      }
    },

    handleEditorChange() {
      this.scheduleChange();
      this.refreshPreview();
    },

    insertCodeBlock(language) {
      if (!this.editor) {
        return;
      }

      const resolvedLanguage = language || "text";
      const snippet = `\n\`\`\`${resolvedLanguage}\nWrite ${resolvedLanguage} code here\n\`\`\`\n`;
      this.editor.insertText(snippet);
      this.scheduleChange();
      this.clearError();
    },

    insertCustomCodeBlock() {
      const input = window.prompt("Enter a code block language, for example: python, bash, js, yaml", "python");
      if (!input) {
        return;
      }

      this.insertCodeBlock(input.trim().toLowerCase());
    },

    buildToolbarItems() {
      const customCodeButton = document.createElement("button");
      customCodeButton.type = "button";
      customCodeButton.className = "toastui-editor-toolbar-icons wordish-toolbar-codeblock";
      customCodeButton.textContent = "CB";
      customCodeButton.setAttribute("aria-label", "Insert a fenced code block");
      customCodeButton.setAttribute("title", "Insert a fenced code block");
      customCodeButton.addEventListener("click", (event) => {
        event.preventDefault();
        this.insertCustomCodeBlock();
      });

      return [
        ["heading", "bold", "italic", "strike"],
        ["hr", "quote"],
        ["ul", "ol", "task", "indent", "outdent"],
        ["table", "link", "image"],
        [
          "code",
          {
            name: "wordishCodeBlock",
            tooltip: "Insert a fenced code block",
            el: customCodeButton,
            state: "codeBlock",
            onUpdated: ({ active, disabled }) => {
              customCodeButton.classList.toggle("active", !!active);
              customCodeButton.disabled = !!disabled;
            }
          }
        ]
      ];
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
          previewStyle: "tab",
          hideModeSwitch: false,
          usageStatistics: false,
          autofocus: false,
          toolbarItems: this.buildToolbarItems(),
          placeholder:
            "Paste screenshots directly here. Images will be uploaded to /uploads instead of being embedded into the Markdown body.",
          hooks: {
            addImageBlobHook: this.handleImageBlob
          }
        });

        this.editor.on("change", this.handleEditorChange);
        this.refreshPreview();
      } catch (error) {
        console.error(error);
        this.setState({
          errorMessage: "The visual editor failed to start. Refresh the admin page and try again."
        });
      }
    },

    setEditorRoot(element) {
      this.editorRoot = element;
    },

    renderReaderPreview() {
      if (!this.state.showReaderPreview) {
        return null;
      }

      const entry = this.props.entry;
      const title = getEntryField(entry, "title") || "这里会显示文章标题";
      const description =
        getEntryField(entry, "description") || "这里会显示文章摘要，方便你边写边看前台阅读效果。";
      const category = getEntryField(entry, "category") || "未分类";
      const contest = getEntryField(entry, "contest") || getEntryField(entry, "oj");
      const track = getEntryField(entry, "track");
      const difficulty = getEntryField(entry, "difficulty") || "Notes";
      const pubDate = getEntryField(entry, "pubDate");
      const updatedDate = getEntryField(entry, "updatedDate");
      const coverImage = getEntryField(entry, "coverImage");
      const tags = getEntryListField(entry, "tags").filter(Boolean);
      const metaItems = [contest, track, difficulty, pubDate && `发布：${pubDate}`, updatedDate && `更新：${updatedDate}`]
        .filter(Boolean);

      return h(
        "section",
        {
          className: "wordish-reader-preview"
        },
        h(
          "div",
          {
            className: "wordish-reader-preview-head"
          },
          h(
            "div",
            {
              className: "wordish-reader-preview-copy"
            },
            h(
              "p",
              {
                className: "wordish-reader-preview-eyebrow"
              },
              "Reader Preview"
            ),
            h(
              "h3",
              {
                className: "wordish-reader-preview-title"
              },
              title
            ),
            h(
              "p",
              {
                className: "wordish-reader-preview-description"
              },
              description
            )
          ),
          coverImage
            ? h("img", {
                className: "wordish-reader-preview-cover",
                src: coverImage,
                alt: title
              })
            : null
        ),
        h(
          "div",
          {
            className: "wordish-reader-preview-meta"
          },
          h(
            "span",
            {
              className: "wordish-reader-preview-pill is-category"
            },
            category
          ),
          ...metaItems.map((item) =>
            h(
              "span",
              {
                className: "wordish-reader-preview-pill"
              },
              item
            )
          )
        ),
        tags.length > 0
          ? h(
              "div",
              {
                className: "wordish-reader-preview-tags"
              },
              ...tags.map((tag) =>
                h(
                  "span",
                  {
                    className: "wordish-reader-preview-tag"
                  },
                  `#${tag}`
                )
              )
            )
          : null,
        this.state.previewHtml
          ? h("div", {
              className: "wordish-reader-preview-body toastui-editor-contents",
              dangerouslySetInnerHTML: {
                __html: this.state.previewHtml
              }
            })
          : h(
              "p",
              {
                className: "wordish-reader-preview-empty"
              },
              "正文开始输入后，这里会显示实时阅读预览。"
        )
      );
    },

    renderStatusPanel() {
      const entry = this.props.entry;
      const title = getEntryField(entry, "title");
      const description = getEntryField(entry, "description");
      const category = getEntryField(entry, "category");
      const contest = getEntryField(entry, "contest") || getEntryField(entry, "oj");
      const contestSlug = getEntryField(entry, "contestSlug");
      const track = getEntryField(entry, "track");
      const coverImage = getEntryField(entry, "coverImage");
      const pubDate = getEntryField(entry, "pubDate");
      const tags = getEntryListField(entry, "tags").filter(Boolean);
      const isMatchWriteup = category === "比赛 WP";

      const items = [
        buildStatusItem("标题", Boolean(title), title || "建议先写清楚题目或文章主题"),
        buildStatusItem("摘要", Boolean(description), description || "前台卡片和分享描述都会用到"),
        buildStatusItem("分类", Boolean(category), category || "建议先确定这篇属于哪个内容栏目"),
        buildStatusItem("发布日期", Boolean(pubDate), pubDate || "会影响归档和前台排序"),
        buildStatusItem("标签", tags.length > 0, tags.length > 0 ? `${tags.length} 个标签` : "至少补 1 个更方便后面回看"),
        buildStatusItem("方向 / Track", Boolean(track), track || "做题方向、专题方向都可以填在这里"),
        buildStatusItem("封面图", Boolean(coverImage), coverImage ? "已设置封面" : "可选，但比赛页和分享图会更完整")
      ];

      if (isMatchWriteup) {
        items.push(
          buildStatusItem("比赛名", Boolean(contest), contest || "比赛 WP 建议补比赛名或 OJ"),
          buildStatusItem(
            "比赛标识",
            Boolean(contestSlug),
            contestSlug || "建议补一个英文或拼音短名，方便自动生成比赛页"
          )
        );
      }

      const completedCount = items.filter((item) => item.ready).length;
      const progressText = `${completedCount} / ${items.length}`;

      return h(
        "section",
        {
          className: "wordish-status-panel"
        },
        h(
          "div",
          {
            className: "wordish-status-panel-head"
          },
          h(
            "div",
            {
              className: "wordish-status-panel-copy"
            },
            h(
              "p",
              {
                className: "wordish-status-panel-eyebrow"
              },
              "Writing Status"
            ),
            h(
              "h3",
              {
                className: "wordish-status-panel-title"
              },
              "这篇文章现在还缺什么"
            ),
            h(
              "p",
              {
                className: "wordish-status-panel-note"
              },
              isMatchWriteup
                ? "当前分类是比赛 WP，所以比赛信息会一起纳入检查。"
                : "这个面板会帮你快速检查常用文章字段有没有漏。"
            )
          ),
          h(
            "div",
            {
              className: "wordish-status-panel-score"
            },
            h("strong", {}, progressText),
            h("span", {}, "已完成")
          )
        ),
        h(
          "div",
          {
            className: "wordish-status-grid"
          },
          ...items.map((item) =>
            h(
              "article",
              {
                className: `wordish-status-card ${item.ready ? "is-ready" : "is-pending"}`
              },
              h(
                "div",
                {
                  className: "wordish-status-card-head"
                },
                h(
                  "span",
                  {
                    className: "wordish-status-card-label"
                  },
                  item.label
                ),
                h(
                  "span",
                  {
                    className: `wordish-status-badge ${item.ready ? "is-ready" : "is-pending"}`
                  },
                  item.ready ? "已填写" : "待补充"
                )
              ),
              h(
                "p",
                {
                  className: "wordish-status-card-detail"
                },
                item.detail
              )
            )
          )
        )
      );
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
          h("strong", {}, "Word-style editor"),
          h(
            "span",
            {},
            "Paste screenshots, drag images, and keep inline code or fenced code blocks without stuffing base64 into the article body."
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
            "Common code blocks:"
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
            "Custom"
          ),
          h(
            "button",
            {
              type: "button",
              className: "wordish-shortcut-button wordish-preview-toggle",
              onClick: this.toggleReaderPreview
            },
            this.state.showReaderPreview ? "Hide Preview" : "Show Preview"
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
        this.renderStatusPanel(),
        this.renderReaderPreview(),
        h(
          "p",
          {
            className: "wordish-footnote"
          },
          "Pasted images are uploaded into the repo and stored as normal file paths. That keeps long posts much lighter and makes later typing noticeably smoother."
        )
      );
    }
  });

  window.CMS.registerWidget("wordish", WordishControl);
})();
