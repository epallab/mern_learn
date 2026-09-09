/* ============================================================
   MERN PREP — shared app layer
   Theme switching, document chrome (TOC / gutter numbers /
   scroll-spy / status bar), progress marks, code highlighting.

   Pages opt in via body classes:
     .page--guide     Q&A guides (marks on)
     .page--practice  coding problems (marks on, print-opens folds)
     .page--learn     learning tracks (read-only)
     .page--hub       the hub (progress fills, totals)
   ============================================================ */
(function () {
  "use strict";

  /* ---------- storage (fails soft on file:// quirks) ---------- */
  function store(key, value) {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch (e) {}
  }
  function read(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  /* ---------- manifest (hub tallies need cross-page counts) ---------- */
  var TOPICS = {
    react: { name: "React", worked: 32 },
    node: { name: "Node.js", worked: 32 },
    express: { name: "Express", worked: 30 },
    mongodb: { name: "MongoDB", worked: 31 },
    mern: { name: "MERN overview", worked: 25 },
    javascript: { name: "JavaScript", worked: 36 },
    system: { name: "System & API design", worked: 29 },
    htmlcss: { name: "HTML & CSS", worked: 32 },
    "dsa-theory": { name: "DSA theory", worked: 38 },
    dsa: { name: "Coding practice", worked: 57 },
    "learn-js": { name: "JS track", worked: 0 },
    "learn-ts": { name: "TS track", worked: 0 }
  };

  function marksFor(topic) {
    var raw = read("prep.marks." + topic);
    if (!raw) return {};
    try {
      return JSON.parse(raw) || {};
    } catch (e) {
      return {};
    }
  }
  function saveMarks(topic, marks) {
    store("prep.marks." + topic, JSON.stringify(marks));
  }

  /* ============================================================
     THEME
     ============================================================ */
  var html = document.documentElement;

  function applyTheme(theme, persist) {
    html.classList.add("theming");
    html.setAttribute("data-theme", theme);
    if (persist) store("prep.theme", theme);
    var opts = document.querySelectorAll(".theme-switch__opt");
    for (var i = 0; i < opts.length; i++) {
      var on = opts[i].getAttribute("data-set-theme") === theme;
      opts[i].setAttribute("aria-pressed", on ? "true" : "false");
      opts[i].setAttribute(
        "aria-label",
        on ? "Current theme: " + opts[i].textContent : "Switch to " + opts[i].textContent + " theme"
      );
    }
    window.setTimeout(function () {
      html.classList.remove("theming");
    }, 300);
  }

  function initTheme() {
    applyTheme(html.getAttribute("data-theme") || "day", false);
    document.addEventListener("click", function (e) {
      var btn = e.target.closest ? e.target.closest("[data-set-theme]") : null;
      if (btn) applyTheme(btn.getAttribute("data-set-theme"), true);
    });
    // another open tab switched — follow it
    window.addEventListener("storage", function (e) {
      if (e.key === "prep.theme" && (e.newValue === "day" || e.newValue === "night")) {
        applyTheme(e.newValue, false);
      }
    });
  }

  /* ============================================================
     CODE HIGHLIGHTING — conservative, display-only
     ============================================================ */
  var KEYWORDS =
    "const let var function return if else for while do switch case break continue new class extends super this typeof instanceof in of try catch finally throw async await yield import export from default delete void null undefined true false NaN static get set interface type enum implements readonly public private protected namespace declare as is keyof infer never unknown any require module".split(
      " "
    );
  var KW_SET = {};
  KEYWORDS.forEach(function (k) {
    KW_SET[k] = true;
  });

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  var CODE_RE =
    /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\[\s\S])*`)|\b(\d[\d_]*(?:\.\d+)?)\b|\b([A-Za-z_$][\w$]*)\b/g;

  function highlightCode(text) {
    var out = "";
    var last = 0;
    var m;
    CODE_RE.lastIndex = 0;
    while ((m = CODE_RE.exec(text))) {
      out += esc(text.slice(last, m.index));
      if (m[1]) out += '<span class="tok-c">' + esc(m[1]) + "</span>";
      else if (m[2]) out += '<span class="tok-s">' + esc(m[2]) + "</span>";
      else if (m[3]) out += '<span class="tok-n">' + esc(m[3]) + "</span>";
      else if (m[4]) {
        if (KW_SET[m[4]]) out += '<span class="tok-k">' + esc(m[4]) + "</span>";
        else if (text.charAt(CODE_RE.lastIndex) === "(")
          out += '<span class="tok-t">' + esc(m[4]) + "</span>";
        else out += esc(m[4]);
      }
      last = CODE_RE.lastIndex;
    }
    out += esc(text.slice(last));
    return out;
  }

  var MARKUP_RE = /(<!--[\s\S]*?-->)|(<\/?[a-zA-Z][^>]*>)/g;

  function highlightMarkup(text) {
    var out = "";
    var last = 0;
    var m;
    MARKUP_RE.lastIndex = 0;
    while ((m = MARKUP_RE.exec(text))) {
      out += esc(text.slice(last, m.index));
      if (m[1]) out += '<span class="tok-c">' + esc(m[1]) + "</span>";
      else {
        var tag = esc(m[2]).replace(/&quot;/g, '"'); // esc doesn't touch quotes
        tag = tag.replace(/"[^"]*"/g, function (s) {
          return '<span class="tok-s">' + s + "</span>";
        });
        out += '<span class="tok-t">' + tag + "</span>";
      }
      last = MARKUP_RE.lastIndex;
    }
    out += esc(text.slice(last));
    return out;
  }

  function highlightAll(root) {
    var pres = root.querySelectorAll("pre");
    for (var i = 0; i < pres.length; i++) {
      var pre = pres[i];
      var target =
        pre.children.length === 1 && pre.firstElementChild.tagName === "CODE"
          ? pre.firstElementChild
          : pre;
      // only highlight plain-text blocks; skip anything already marked up
      if (target.children.length > 0) continue;
      var text = target.textContent;
      target.innerHTML = /^\s*</.test(text) ? highlightMarkup(text) : highlightCode(text);
    }
  }

  /* ============================================================
     DOCUMENT CHROME — wrap, number, TOC, spy, status bar
     ============================================================ */
  function buildChrome(kind, topic) {
    var body = document.body;
    var topbar = body.querySelector(".topbar");

    // wrap everything after the topbar into .shell > .doc
    var doc = document.createElement("main");
    doc.className = "doc";
    var node = topbar ? topbar.nextSibling : body.firstChild;
    while (node) {
      var next = node.nextSibling;
      if (node.nodeType !== 1 || node.tagName !== "SCRIPT") doc.appendChild(node);
      node = next;
    }
    var shell = document.createElement("div");
    shell.className = "shell";
    var toc = document.createElement("nav");
    toc.className = "toc";
    toc.setAttribute("aria-label", "Contents");
    shell.appendChild(toc);
    shell.appendChild(doc);
    body.appendChild(shell);

    var withMarks = kind === "guide" || kind === "practice";
    var marks = withMarks ? marksFor(topic) : {};

    // --- sections from h1s (cover h1 excluded) ---
    var sections = [];
    var h1s = doc.querySelectorAll("h1");
    for (var i = 0; i < h1s.length; i++) {
      var h = h1s[i];
      if (h.closest && h.closest(".cover")) continue;
      var id = "sec-" + (sections.length + 1);
      h.id = id;
      // wrap a leading "3." in a gutter-toned span
      var t = h.firstChild;
      if (t && t.nodeType === 3) {
        var nm = t.nodeValue.match(/^\s*(\d+)\.\s*/);
        if (nm) {
          t.nodeValue = t.nodeValue.slice(nm[0].length);
          var no = document.createElement("span");
          no.className = "h1__no";
          no.textContent = nm[1] + ".";
          h.insertBefore(no, t);
        }
      }
      sections.push({ el: h, id: id, label: h.textContent.trim(), count: 0 });
    }

    // --- questions ---
    var qs = doc.querySelectorAll(".q");
    var items = []; // {el, id, label, section}
    var seq = 0;
    for (var j = 0; j < qs.length; j++) {
      var q = qs[j];
      seq++;
      // strip a leading "Q17:" / "Task 2:" / "P4:" / bare "Q:" prefix
      var first = q.firstChild;
      while (first && first.nodeType === 3 && !first.nodeValue.replace(/\s/g, "")) {
        first = first.nextSibling;
      }
      var label = "Q" + seq;
      if (first && first.nodeType === 3) {
        var qm = first.nodeValue.match(/^\s*(Q|Task|P)\s*(\d*)\s*[:.]\s*/i);
        if (qm) {
          var kindTxt = qm[1].charAt(0).toUpperCase() + qm[1].slice(1).toLowerCase();
          if (kindTxt === "P") kindTxt = "P";
          label = kindTxt + (qm[2] || seq);
          if (kindTxt.toLowerCase() === "task") label = "Task " + (qm[2] || seq);
          first.nodeValue = first.nodeValue.slice(qm[0].length);
        }
      }
      var qid = label.toLowerCase().replace(/\s+/g, "");
      q.id = qid;

      var textSpan = document.createElement("span");
      textSpan.className = "q__text";
      while (q.firstChild) textSpan.appendChild(q.firstChild);
      var numSpan = document.createElement("span");
      numSpan.className = "q__num";
      numSpan.textContent = label;
      q.appendChild(numSpan);
      q.appendChild(textSpan);

      // section attribution: nearest preceding h1
      var secIdx = -1;
      for (var s = sections.length - 1; s >= 0; s--) {
        if (
          sections[s].el.compareDocumentPosition(q) &
          Node.DOCUMENT_POSITION_FOLLOWING
        ) {
          secIdx = s;
          break;
        }
      }
      if (secIdx >= 0) sections[secIdx].count++;

      if (withMarks) {
        var mrow = document.createElement("span");
        mrow.className = "q__marks";
        mrow.appendChild(makeMark(topic, qid, "know", "know it", marks));
        mrow.appendChild(makeMark(topic, qid, "shaky", "shaky", marks));
        q.appendChild(mrow);
      }

      items.push({ el: q, id: qid, label: label, section: secIdx });
    }

    // --- TOC ---
    var tocLabel = document.createElement("p");
    tocLabel.className = "toc__label";
    tocLabel.textContent = "contents";
    toc.appendChild(tocLabel);
    var tocLinks = [];
    sections.forEach(function (sec) {
      var a = document.createElement("a");
      a.href = "#" + sec.id;
      var txt = document.createElement("span");
      txt.textContent = sec.label;
      a.appendChild(txt);
      if (sec.count > 0) {
        var c = document.createElement("span");
        c.className = "toc__count";
        c.textContent = sec.count;
        a.appendChild(c);
      }
      toc.appendChild(a);
      tocLinks.push(a);
    });

    // --- status bar ---
    var sb = document.createElement("div");
    sb.className = "statusbar";
    var topicName = (TOPICS[topic] && TOPICS[topic].name) || topic || "";
    sb.innerHTML =
      '<span class="sb__loc">' +
      '<span class="sb__crumb">' +
      esc(topicName) +
      "</span>" +
      '<span class="sb__sep sb__crumb--section">▸</span>' +
      '<span class="sb__crumb sb__crumb--section sb__sec"></span>' +
      '<span class="sb__sep sb__q-sep" hidden>▸</span>' +
      '<span class="sb__crumb sb__q"></span>' +
      "</span>" +
      '<span class="sb__tally"></span>' +
      '<button type="button" class="sb__top">↑ top</button>';
    document.body.appendChild(sb);
    sb.querySelector(".sb__top").addEventListener("click", function () {
      window.scrollTo({ top: 0 });
    });
    var sbSec = sb.querySelector(".sb__sec");
    var sbQ = sb.querySelector(".sb__q");
    var sbQSep = sb.querySelector(".sb__q-sep");

    function refreshTally() {
      if (!withMarks) {
        sb.querySelector(".sb__tally").textContent = sections.length + " modules";
        return;
      }
      var m = marksFor(topic);
      var know = 0,
        shaky = 0;
      for (var k in m) {
        if (m[k] === "know") know++;
        else if (m[k] === "shaky") shaky++;
      }
      sb.querySelector(".sb__tally").innerHTML =
        "<b>" + know + " known</b> · <i>" + shaky + " shaky</i> / " + items.length;
    }
    refreshTally();
    document.addEventListener("prep:marks", refreshTally);

    // --- scroll-spy over sections + questions ---
    var offsets = [];
    function recalc() {
      offsets = [];
      var y = window.scrollY || window.pageYOffset;
      sections.forEach(function (sec, idx) {
        offsets.push({
          top: sec.el.getBoundingClientRect().top + y,
          section: idx,
          item: null
        });
      });
      items.forEach(function (it) {
        offsets.push({
          top: it.el.getBoundingClientRect().top + y,
          section: it.section,
          item: it
        });
      });
      offsets.sort(function (a, b) {
        return a.top - b.top;
      });
    }

    var activeQ = null;
    var activeSec = -1;
    function spy() {
      var y = (window.scrollY || window.pageYOffset) + 90;
      var cur = null;
      for (var i = 0; i < offsets.length; i++) {
        if (offsets[i].top <= y) cur = offsets[i];
        else break;
      }
      var sec = cur ? cur.section : sections.length ? 0 : -1;
      var item = cur ? cur.item : null;
      if (sec !== activeSec) {
        activeSec = sec;
        tocLinks.forEach(function (a, idx) {
          a.classList.toggle("is-active", idx === sec);
        });
        sbSec.textContent = sec >= 0 ? sections[sec].label : "";
      }
      var qEl = item ? item.el : null;
      if (qEl !== activeQ) {
        if (activeQ) activeQ.classList.remove("is-active");
        if (qEl) qEl.classList.add("is-active");
        activeQ = qEl;
        sbQ.textContent = item ? item.label : "";
        sbQSep.hidden = !item;
      }
    }

    var ticking = false;
    window.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(function () {
          ticking = false;
          spy();
        });
      },
      { passive: true }
    );
    var rTimer = null;
    window.addEventListener("resize", function () {
      window.clearTimeout(rTimer);
      rTimer = window.setTimeout(function () {
        recalc();
        spy();
      }, 150);
    });

    recalc();
    spy();
    window.addEventListener("load", function () {
      recalc();
      spy();
    });
    // opening a hint/solution fold shifts everything below it
    document.addEventListener(
      "toggle",
      function () {
        recalc();
        spy();
      },
      true
    );
    if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
      document.fonts.ready.then(function () {
        recalc();
        spy();
      });
    }
  }

  function makeMark(topic, qid, value, text, initial) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "mark mark--" + value;
    b.textContent = text;
    b.setAttribute("aria-pressed", initial[qid] === value ? "true" : "false");
    b.addEventListener("click", function () {
      var marks = marksFor(topic);
      var on = marks[qid] === value;
      if (on) delete marks[qid];
      else marks[qid] = value;
      saveMarks(topic, marks);
      var siblings = b.parentNode.querySelectorAll(".mark");
      for (var i = 0; i < siblings.length; i++) {
        var v = siblings[i].classList.contains("mark--know") ? "know" : "shaky";
        siblings[i].setAttribute("aria-pressed", marks[qid] === v ? "true" : "false");
      }
      document.dispatchEvent(new CustomEvent("prep:marks"));
    });
    return b;
  }

  /* ============================================================
     HUB — progress fills + totals
     ============================================================ */
  function buildHub() {
    function refresh() {
      var totalKnown = 0;
      var totalWorked = 0;
      var progs = document.querySelectorAll(".prog[data-topic]");
      for (var i = 0; i < progs.length; i++) {
        var topic = progs[i].getAttribute("data-topic");
        var info = TOPICS[topic];
        if (!info || !info.worked) continue;
        var m = marksFor(topic);
        var know = 0;
        for (var k in m) if (m[k] === "know") know++;
        var pct = Math.min(100, Math.round((know / info.worked) * 100));
        var fill = progs[i].querySelector(".prog__fill");
        if (fill) fill.style.width = pct + "%";
        progs[i].setAttribute("data-empty", know === 0 ? "true" : "false");
        progs[i].setAttribute(
          "title",
          know + " of " + info.worked + " marked known"
        );
        totalKnown += know;
        totalWorked += info.worked;
      }
      var sb = document.querySelector(".statusbar .sb__tally");
      if (sb)
        sb.innerHTML =
          "<b>" + totalKnown + " known</b> / " + totalWorked + " worked answers";
    }

    var sb = document.createElement("div");
    sb.className = "statusbar";
    sb.innerHTML =
      '<span class="sb__loc"><span class="sb__crumb">MERN Prep</span>' +
      '<span class="sb__sep">▸</span>' +
      '<span class="sb__crumb">9 guides · 2 tracks · 1 practice set</span></span>' +
      '<span class="sb__tally"></span>' +
      '<button type="button" class="sb__top">↑ top</button>';
    document.body.appendChild(sb);
    sb.querySelector(".sb__top").addEventListener("click", function () {
      window.scrollTo({ top: 0 });
    });

    refresh();

    var reset = document.querySelector(".reset-marks");
    if (reset) {
      reset.addEventListener("click", function () {
        if (!window.confirm("Clear every saved mark on this browser?")) return;
        for (var topic in TOPICS) store("prep.marks." + topic, null);
        refresh();
      });
    }
    window.addEventListener("storage", function (e) {
      if (e.key && e.key.indexOf("prep.marks.") === 0) refresh();
    });
  }

  /* ============================================================
     MOBILE MENU — hamburger + drawer, cloned from the topbar
     ============================================================ */
  function buildMenu() {
    var topbar = document.querySelector(".topbar");
    if (!topbar) return;
    var nav = topbar.querySelector(".topbar__nav");
    var switcher = topbar.querySelector(".theme-switch");

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "menu-btn";
    btn.setAttribute("aria-label", "Open menu");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", "drawer");
    for (var i = 0; i < 3; i++) {
      var bar = document.createElement("span");
      bar.className = "menu-btn__bar";
      btn.appendChild(bar);
    }
    topbar.appendChild(btn);

    var scrim = document.createElement("div");
    scrim.className = "scrim";

    var drawer = document.createElement("aside");
    drawer.className = "drawer";
    drawer.id = "drawer";
    drawer.setAttribute("aria-label", "Menu");

    var head = document.createElement("div");
    head.className = "drawer__head";
    var title = document.createElement("span");
    title.className = "drawer__title";
    title.textContent = "menu";
    head.appendChild(title);
    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "drawer__close";
    closeBtn.setAttribute("aria-label", "Close menu");
    closeBtn.textContent = "✕";
    head.appendChild(closeBtn);
    drawer.appendChild(head);

    if (nav) {
      var dnav = document.createElement("nav");
      dnav.className = "drawer__nav";
      dnav.setAttribute("aria-label", "Site");
      var links = nav.querySelectorAll("a");
      for (var j = 0; j < links.length; j++) {
        dnav.appendChild(links[j].cloneNode(true)); // keeps aria-current
      }
      drawer.appendChild(dnav);
    }

    var foot = document.createElement("div");
    foot.className = "drawer__foot";
    var label = document.createElement("span");
    label.className = "drawer__label";
    label.textContent = "theme";
    foot.appendChild(label);
    if (switcher) {
      // clone carries data-set-theme + aria-pressed; the delegated theme
      // handler and applyTheme's class-wide sync cover it automatically
      foot.appendChild(switcher.cloneNode(true));
    }
    drawer.appendChild(foot);

    document.body.appendChild(scrim);
    document.body.appendChild(drawer);

    function setOpen(open, refocus) {
      html.classList.toggle("menu-open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      if (open) closeBtn.focus();
      else if (refocus) btn.focus();
    }

    btn.addEventListener("click", function () {
      setOpen(!html.classList.contains("menu-open"), false);
    });
    closeBtn.addEventListener("click", function () {
      setOpen(false, true);
    });
    scrim.addEventListener("click", function () {
      setOpen(false, false);
    });
    drawer.addEventListener("click", function (e) {
      // navigating (or jumping to a hub anchor) closes the drawer;
      // theme taps keep it open so the change is visible
      if (e.target.closest && e.target.closest("a")) setOpen(false, false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && html.classList.contains("menu-open")) {
        setOpen(false, true);
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 640 && html.classList.contains("menu-open")) {
        setOpen(false, false);
      }
    });
  }

  /* ============================================================
     PRINT — open folds so solutions land on paper
     ============================================================ */
  function initPrint() {
    var opened = [];
    window.addEventListener("beforeprint", function () {
      opened = [];
      var folds = document.querySelectorAll("details:not([open])");
      for (var i = 0; i < folds.length; i++) {
        folds[i].setAttribute("open", "");
        opened.push(folds[i]);
      }
    });
    window.addEventListener("afterprint", function () {
      opened.forEach(function (d) {
        d.removeAttribute("open");
      });
      opened = [];
    });
  }

  /* ============================================================
     BOOT
     ============================================================ */
  function boot() {
    initTheme();
    initPrint();

    var body = document.body;
    var topic = body.getAttribute("data-topic") || "";
    var kind = body.classList.contains("page--guide")
      ? "guide"
      : body.classList.contains("page--practice")
        ? "practice"
        : body.classList.contains("page--learn")
          ? "learn"
          : body.classList.contains("page--hub")
            ? "hub"
            : "";

    // mark the matching topbar zone
    var zoneHash =
      kind === "guide"
        ? "#guides"
        : kind === "learn"
          ? "#learn"
          : kind === "practice"
            ? "#practice"
            : "";
    if (zoneHash) {
      var links = document.querySelectorAll(".topbar__nav a");
      for (var i = 0; i < links.length; i++) {
        var href = links[i].getAttribute("href") || "";
        if (href.indexOf(zoneHash) !== -1)
          links[i].setAttribute("aria-current", "true");
      }
    }

    if (kind === "guide" || kind === "learn" || kind === "practice") {
      buildChrome(kind, topic);
      highlightAll(document.body);
    } else if (kind === "hub") {
      buildHub();
    }

    // after the chrome build so the drawer isn't swept into .doc,
    // and after aria-current so the cloned links carry it
    buildMenu();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
