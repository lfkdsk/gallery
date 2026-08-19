function getParam(key) {
  const queryString = window.location.search;
  console.log(queryString);
  const urlParams = new URLSearchParams(queryString);
  const id = urlParams.get(key);
  console.log(id);
  return id;
}

function replaceQueryParam(param, newval, search) {
  var regex = new RegExp("([?;&])" + param + "[^&;]*[;&]?");
  var query = search.replace(regex, "$1").replace(/&$/, "");
  return (
    (query.length > 2 ? query + "&" : "?") +
    (newval ? param + "=" + newval : "")
  );
}
function updateParams(name) {
  const url = new URL(window.location.href);
  url.searchParams.set("name", name);
  window.history.replaceState(null, null, url); // or pushState
}

function copyToClipboard(content) {
  toastr.options = {
    closeButton: true,
    debug: false,
    newestOnTop: false,
    progressBar: false,
    positionClass: "toast-top-right",
    preventDuplicates: false,
    onclick: null,
    showDuration: "300",
    hideDuration: "1000",
    timeOut: "5000",
    extendedTimeOut: "1000",
    showEasing: "swing",
    hideEasing: "linear",
    showMethod: "fadeIn",
    hideMethod: "fadeOut",
  };
  if (window.isSecureContext && navigator.clipboard) {
    navigator.clipboard.writeText(content);
    toastr.success("Copy single url into Clipboard.");
  } else {
    toastr.info("Please check your clipboard write permission.");
  }
}

/**
 * 把「相框 + 照片 + EXIF 卡」渲染成一张可下载的图片。
 *
 * ── 为什么不用 html2canvas ──────────────────────────────────────────────
 * 原来是 html2canvas(node) 直接截图，两个问题：
 *
 * 1) 输出尺寸 = 节点在屏幕上的显示尺寸 × devicePixelRatio。实测一张
 *    12480×8320（104 MP）的原图，下载下来只有 1736×1298（2.3 MP）——只剩 2.2%
 *    的像素，而且窗口越小下载的图越糊。
 * 2) 它用 fillText 自己算文字基线，和浏览器的行盒排版对不上：EXIF 卡右侧三行
 *    整体下沉（上方空一大截、末行贴着卡片下缘），而同一张卡里的分隔线和 logo
 *    却是居中的。对比 scale=2 与 scale=4.6 的产出，偏移比例一致，说明这是它
 *    一直以来的渲染差异，不是分辨率造成的。页面排版本身是对的。
 *
 * ── 这里的做法 ────────────────────────────────────────────────────────
 * 自己在 canvas 上画，但**排版仍然从 DOM 读**——每个元素的位置、尺寸、字体、
 * 颜色都取自 getBoundingClientRect + getComputedStyle，只是把「画」这一步接管
 * 过来。所以 CSS 依旧是排版的单一来源，改样式不需要同步改这里；同时位置完全
 * 可控，也不再需要 html2canvas 那 194 KB。
 *
 * 文字用 textBaseline: 'middle' 放在各自盒子的垂直中心，字形自然居中，不受
 * 字体 ascent/descent 不对称的影响——这正是上面第 2 个问题的根源。
 *
 * maxEdge 默认 4000：A3 打印约需 3500px，分享绰绰有余。
 *
 * @param {Object}      o
 * @param {HTMLElement} o.node      要渲染的节点（#all-pic）
 * @param {HTMLImageElement} o.img  节点里的主图
 * @param {string}     [o.fullSrc]  原图 URL；省略则用 img 当前的 src
 * @param {string}      o.filename  下载文件名，不含扩展名
 * @param {Element}    [o.button]   触发按钮，用于显示生成中状态
 * @param {number}     [o.maxEdge]  输出长边上限
 */
async function downloadFramedPhoto(o) {
  var node = o.node;
  var img = o.img;
  var maxEdge = o.maxEdge || 4000;
  var btn = o.button && o.button.jquery ? o.button[0] : o.button;
  var btnText = btn ? btn.textContent : null;
  var objectUrl = null;

  if (btn) {
    btn.textContent = " 生成中… ";
    btn.style.pointerEvents = "none";
    btn.style.opacity = "0.6";
  }

  try {
    var nb = node.getBoundingClientRect();
    var k = maxEdge / Math.max(nb.width, nb.height); // CSS px → 输出像素
    if (k < 1) k = 1;

    // 相对节点左上角的坐标换算
    var rel = function (el) {
      var b = el.getBoundingClientRect();
      return { x: (b.left - nb.left) * k, y: (b.top - nb.top) * k,
               w: b.width * k, h: b.height * k, cy: (b.top - nb.top + b.height / 2) * k };
    };
    var visible = function (el) {
      if (!el) return false;
      var c = getComputedStyle(el);
      if (c.display === "none" || c.visibility === "hidden") return false;
      return el.getBoundingClientRect().width > 0;
    };

    var canvas = document.createElement("canvas");
    canvas.width = Math.round(nb.width * k);
    canvas.height = Math.round(nb.height * k);
    var ctx = canvas.getContext("2d");

    // 底色用节点自己的背景（暗色模式下相框是白的）
    var nodeCS = getComputedStyle(node);
    ctx.fillStyle = nodeCS.backgroundColor === "rgba(0, 0, 0, 0)" ? "#ffffff" : nodeCS.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ── 照片：换成原图后按显示位置铺满 ──────────────────────────────
    var bmp = null;
    if (o.fullSrc) {
      try {
        var res = await fetch(o.fullSrc, { mode: "cors" });
        if (res.ok) bmp = await createImageBitmap(await res.blob());
      } catch (e) {
        console.warn("原图取不到，退回页面上的图:", e);
      }
    }
    var ir = rel(img);
    if (bmp) {
      ctx.drawImage(bmp, ir.x, ir.y, ir.w, ir.h);
      bmp.close && bmp.close();
    } else {
      ctx.drawImage(img, ir.x, ir.y, ir.w, ir.h);
    }

    // ── EXIF 卡 ────────────────────────────────────────────────────
    var drawText = function (el) {
      if (!visible(el)) return;
      var text = el.textContent.trim();
      if (!text) return;
      var c = getComputedStyle(el);
      var r = rel(el);
      ctx.font = c.fontStyle + " " + c.fontWeight + " " +
                 (parseFloat(c.fontSize) * k) + "px " + c.fontFamily;
      ctx.fillStyle = c.color;
      ctx.textBaseline = "middle"; // 字形居中于行盒，避开 ascent/descent 不对称
      ctx.textAlign = "left";
      // 超宽就截断加省略号，对应 CSS 的 text-overflow: ellipsis
      var maxW = r.w;
      if (maxW > 0 && ctx.measureText(text).width > maxW) {
        while (text.length > 1 && ctx.measureText(text + "…").width > maxW) {
          text = text.slice(0, -1);
        }
        text += "…";
      }
      ctx.fillText(text, r.x, r.cy);
    };

    var wrap = document.getElementById("exif-wrapper");
    var normal = document.getElementById("normal-wrapper");
    var card = visible(wrap) ? wrap : (visible(normal) ? normal : null);
    if (card) {
      var cr = rel(card);
      var cc = getComputedStyle(card);
      ctx.fillStyle = cc.backgroundColor;
      ctx.fillRect(cr.x, cr.y, cr.w, cr.h);
    }

    if (visible(wrap)) {
      // 分隔竖线
      var divider = wrap.querySelector(".exif-right > div > div:nth-child(2)");
      if (visible(divider)) {
        var dr = rel(divider);
        ctx.fillStyle = getComputedStyle(divider).backgroundColor;
        ctx.fillRect(dr.x, dr.y, Math.max(dr.w, 1), dr.h);
      }
      // 厂商 logo
      var logo = document.getElementById("exif-maker-logo");
      if (visible(logo) && logo.complete && logo.naturalWidth) {
        var lr = rel(logo);
        ctx.drawImage(logo, lr.x, lr.y, lr.w, lr.h);
      }
      ["exif-param", "exif-date", "exif-maker", "exif-lens", "exif-author"]
        .forEach(function (id) { drawText(document.getElementById(id)); });
    } else if (visible(normal)) {
      // 没有 EXIF 数据时的那行居中提示
      var tip = document.getElementById("no-exif-data");
      if (visible(tip)) {
        var tr = rel(tip);
        var tc = getComputedStyle(tip);
        ctx.font = tc.fontWeight + " " + (parseFloat(tc.fontSize) * k) + "px " + tc.fontFamily;
        ctx.fillStyle = tc.color;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText(tip.textContent.trim(), tr.x + tr.w / 2, tr.cy);
      }
    }

    // ── 相框描边 ───────────────────────────────────────────────────
    var bw = parseFloat(nodeCS.borderTopWidth) * k;
    if (bw > 0) {
      ctx.strokeStyle = nodeCS.borderTopColor;
      ctx.lineWidth = bw;
      ctx.strokeRect(bw / 2, bw / 2, canvas.width - bw, canvas.height - bw);
    }

    // toBlob 而不是 toDataURL：后者会先生成一个几 MB 的 base64 字符串白占内存
    var blob = await new Promise(function (resolve) {
      canvas.toBlob(resolve, "image/jpeg", 0.92);
    });
    if (!blob) throw new Error("canvas.toBlob 返回空");

    objectUrl = URL.createObjectURL(blob);
    simulateDownloadImageClick(objectUrl, o.filename + ".jpg");
  } catch (e) {
    console.error("下载图片生成失败:", e);
    if (typeof toastr !== "undefined") toastr.error("图片生成失败，请重试");
  } finally {
    if (btn) {
      btn.textContent = btnText;
      btn.style.pointerEvents = "";
      btn.style.opacity = "";
    }
    // 给下载动作留出时间再释放，否则 Safari 上偶发拿不到内容
    if (objectUrl) setTimeout(function () { URL.revokeObjectURL(objectUrl); }, 60000);
  }
}

function simulateDownloadImageClick(uri, filename) {
  var link = document.createElement("a");
  link.setAttribute("class", "screenshot");
  if (typeof link.download !== "string") {
    window.open(uri);
  } else {
    link.href = uri;
    link.download = filename;
    accountForFirefox(clickLink, link);
  }
}

function clickLink(link) {
  link.click();
}

function accountForFirefox(click) {
  // wrapper function
  let link = arguments[1];
  document.body.appendChild(link);
  click(link);
  document.body.removeChild(link);
}

function wrapperData(v, author) {
  var exifParam = $("#exif-param");
  var exifMaker = $("#exif-maker");
  var exifDate = $("#exif-date");
  var exifLens = $("#exif-lens");
  var exifLogo = $("#exif-maker-logo");
  var exifAuthor = $("#exif-author");

  const maker = v.exif_data["Image Make"];
  console.log(maker);
  exifLogo.attr("class", 'nofancy')
  switch (maker) {
    case 'Hasselblad': {
      exifLogo.attr("src", "img/hasselblad.jpg");
      exifLogo.addClass("hasselblad-logo");
      break;
    }
    case "Apple": {
      exifLogo.attr("src", "img/apple.png");
      exifLogo.addClass("apple-logo");
      break;
    }
    case "RICOH IMAGING COMPANY, LTD.  ": {
      exifLogo.attr("src", "img/384_ricoh.jpg");
      exifLogo.addClass("ricoh-logo");
      break;
    }
    case "Canon": {
      exifLogo.attr("src", "img/canon.png");
      exifLogo.addClass("canon-logo");
      break;
    }
    case "SONY": {
      exifLogo.attr("src", "img/sony.png");
      exifLogo.addClass("sony-logo");
      break;
    }
    case "NIKON CORPORATION": {
      exifLogo.attr("src", "img/nikon.png");
      exifLogo.addClass("nikon-logo");
      break;
    }
    case "DJI": {
      exifLogo.attr("src", "img/dajiang.png");
      exifLogo.addClass("dji-logo");
      break;
    }
    case "FUJIFILM": {
      exifLogo.attr("src", "img/fujifilm.png");
      exifLogo.addClass("fujifilm-logo");
      break;
    }
    case "OM Digital Solutions   ": {
      exifLogo.attr("src", "img/om-system.svg");
      exifLogo.addClass("om-system-logo");
      break;
    }
    case "OLYMPUS CORPORATION    ":
    case "OLYMPUS IMAGING CORP.": {
      exifLogo.attr("src", "img/OlympusLogoBlueAndGoldRGB.png");
      exifLogo.addClass("olympus-logo");
      break;
    }
    default: {
      break;
    }
  }
  exifParam.text(
    v.exif_data["EXIF ISOSpeedRatings"] +
      " " +
      v.exif_data["EXIF FNumber"] +
      " " +
      v.exif_data['EXIF FocalLength'] +
      " " +
      v.exif_data["EXIF ExposureTime"]
  );
  exifLens.text(v.exif_data["EXIF LensModel"] ?? "");
  exifMaker.text(v.exif_data["Image Model"] ?? "");
  exifDate.text(v.exif_data["EXIF DateTimeOriginal"] ?? "");
  exifAuthor.text("By " + author);
}

function heatmap(db, root) {
  var chartDom = document.getElementById("chart-wrapper");
  var option;
  var result = db.exec(
    `
WITH daily_counts AS (
SELECT
strftime('%Y-%m-%d', exifdata.date) AS exifdate,
count(*) AS cnt
FROM photo
LEFT JOIN exifdata ON exifdata.id = photo.exif_data_id
WHERE photo.exif_data_id IS NOT NULL
GROUP BY strftime('%Y-%m-%d', exifdata.date)
)
SELECT
SUBSTR(exifdate, 1, 4) AS year,
GROUP_CONCAT(exifdate || ':' || cnt) AS dates_and_counts
FROM daily_counts
GROUP BY SUBSTR(exifdate, 1, 4)
ORDER BY SUBSTR(exifdate, 1, 4) DESC;
`
  );
  var index = 0;
  for (const item of result[0].values) {
    const year = item[0];
    const data = item[1];
    const arr = data.split(",");
    for (var i = 0; i < arr.length; i++) {
      arr[i] = arr[i].split(":");
    }
    var subDom = document.createElement("div");
    subDom.classList = "status";
    subDom.id = "year" + index;
    subDom.style.width = '1200px';
    subDom.style.height = '250px';
    chartDom.appendChild(subDom);
    var myChart = echarts.init(subDom);
    option = {
      tooltip: {
        formatter: function (params) {
          return params.value[0] + " : " + params.value[1];
        },
      },
      visualMap: {
        show: false,
        min: 1,
        max: 4,
        inRange: {
          color: ["#9BE9A8", "#40C463", "#216E39"],
        },
        orient: "vertical", // 图例的排列方式
        right: 10, // 图例距离右侧的距离
        bottom: 10, // 图例距离底部的距离
      },
      calendar: [
        {
          itemStyle: {
            color: "#EBEDF0",
            borderWidth: 3,
            borderColor: "#fff",
          },
          cellSize: [20, 20],
          range: [year + "-01-01", year + "-12-31"],
          splitLine: true,
          dayLabel: {
            firstDay: 0,
            nameMap: ["Sun.", "Mon.", "Tue.", "Wed.", "Thu.", "Fri.", "Sat."],
          },
          monthLabel: {
            nameMap: [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ],
          },
          yearLabel: {
            show: true,
          },
          silent: {
            show: true,
          },
        },
      ],
      series: {
        type: "heatmap",
        coordinateSystem: "calendar",
        data: arr,
      },
    };
    myChart.on('click', function (params) {
      if (params === undefined || params.value.length !== 2) {
        return;
      }
      window.open(root + 'grid-all?filter='+ params.value[0]);
    });


    option && myChart.setOption(option);
    index += 1;
  }
}

function command(q, db) {
  switch (q) {
    case "heatmap":
      heatmap(db);
      return true;
    default:
      break;
  }
  return false;
}

function addBackUp(ele, url, name) {
  ele.onerror = function() {
    ele.onerror = null;
    ele.src = url + name;
  }
}

function isImage(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  return ['jpg', 'jpeg', 'gif', 'png', 'bmp', 'svg', 'webp'].includes(ext);
}

function fillTable(data, name, callback, thumbnail_url, backup_thumbnail_url) {
  const wrapper = document.getElementById('table-wrapper');
  var i = 0;
  console.log(data)
  for (const item of data) {
    const table = document.createElement('table');
    table.classList = 'ln-table table table-hover table-responsive';
    const thead = table.createTHead();
    thead.classList.add('thead-dark');
    const row = thead.insertRow();

    if (name !== null && name !== "" && name[i] !== "") {
      const caption = document.createElement('caption');
      caption.innerText = name[i];
      table.appendChild(caption);
    }
    i++;

    wrapper.appendChild(table);
    for (const column of item.columns) {
        const th = document.createElement('th');
        th.scope = 'col';
        const text = document.createTextNode(column);
        th.appendChild(text);
        row.appendChild(th);
    }

    const resolveImg = (td, cell) => {
      const a = document.createElement('a');
      a.text = cell
      a.setAttribute('href', 'photo?name=' + cell);
      td.appendChild(a);
      const img = document.createElement('img');
      img.style.width = '200px'
      img.src = thumbnail_url + cell.replace(/\.\w+$/, '.webp');
      addBackUp(img, backup_thumbnail_url + '/', cell.replace(/\.\w+$/, '.webp'))
      td.appendChild(img)
    }

    // 添加数据行
    const tbody = table.createTBody();
    for (const row of item.values) {
        const tr = tbody.insertRow();
        var index = 0
        for (const cell of row) {
            const td = tr.insertCell();
            if (callback !== null) {
              td.appendChild(callback(td, cell, index));
              index++;
              continue;
            }
            if (isImage(cell + "")) {
                resolveImg(td, cell)
                index++;
                continue
            }
            const result = document.createTextNode(cell);
            td.appendChild(result);
            index++;
        }
    }
  }
}

function queryTable(name, sql, callback, db, thumbnail_url, backup_thumbnail_url) {
  var data = db.exec(sql);
  fillTable(data, name, callback, thumbnail_url, backup_thumbnail_url);
}

const getTodayPhotos = () => {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  const query = `
    WITH photo_list AS (
      SELECT
        path,
        (
          SELECT COUNT(*)
          FROM Photo p2
          JOIN EXIFData e2 ON p2.exif_data_id = e2.id
          WHERE strftime('%m', e2.date) = '${month}'
          AND strftime('%d', e2.date) = '${day}'
        ) as total,
        ROW_NUMBER() OVER (ORDER BY e.date DESC) - 1 as rn
      FROM Photo p
      JOIN EXIFData e ON p.exif_data_id = e.id
      WHERE strftime('%m', e.date) = '${month}'
      AND strftime('%d', e.date) = '${day}'
      ORDER BY e.date DESC
    )
    SELECT
      GROUP_CONCAT(
        CASE WHEN rn = row_num * cols + 0 THEN path ELSE NULL END
      ) as column0,
      GROUP_CONCAT(
        CASE WHEN rn = row_num * cols + 1 THEN path ELSE NULL END
      ) as column1,
      GROUP_CONCAT(
        CASE WHEN rn = row_num * cols + 2 THEN path ELSE NULL END
      ) as column2,
      GROUP_CONCAT(
        CASE WHEN rn = row_num * cols + 3 AND cols = 4 THEN path ELSE NULL END
      ) as column3
    FROM (
      SELECT
        *,
        CASE WHEN total > 9 THEN 4 ELSE 3 END as cols,
        CAST(rn / CASE WHEN total > 9 THEN 4 ELSE 3 END AS INTEGER) as row_num
      FROM photo_list
    )
    GROUP BY row_num
    ORDER BY row_num;
  `;

  return query;
};

function checkShowYearEndSummary() {
  const now = new Date();
  const year = now.getFullYear();
  const lastDay = new Date(year + 1, 1, 31);
  const twoWeeksBefore = new Date(lastDay);
  twoWeeksBefore.setDate(lastDay.getDate() - 64);
  return now >= twoWeeksBefore && now <= lastDay;
}

function addYearEndSummaryLink(container, root) {
  const style = document.createElement('style');
  style.textContent = `
    .year-end-summary {
      color: #000;
      text-decoration: none;
      opacity: 0;
      transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: clamp(1rem, 2vw, 1.2rem);
      margin-top: 1rem;
      pointer-events: none;
    }

    .year-end-summary.visible {
      opacity: 0.7;
      pointer-events: auto;
    }

    .year-end-summary.visible:hover {
      opacity: 1;
    }

    .year-end-summary::after {
      content: '→';
      transition: transform 0.3s ease;
    }

    .year-end-summary.visible:hover::after {
      transform: translateX(6px);
    }
    @media (prefers-color-scheme: dark) {
      .year-end-summary {
        color: #fff;
      }
    }
  `;
  document.head.appendChild(style);
  const now = new Date();
  const year = now.getFullYear();
  const link = document.createElement('a');
  link.href = root + '/summary?year=' + year;
  link.className = 'year-end-summary';
  link.textContent = year + ' 年度回顾';
  container.appendChild(link)
  if (checkShowYearEndSummary()) {
    // 使用 requestAnimationFrame 确保过渡动画正常工作
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        link.classList.add('visible');
      });
    });
  }
}

function attachLivePhoto(wrap, hasLive, videoUrl) {
  if (hasLive) {
    // data-livephoto
    // data-autoload="visible"
    // data-label="LIVE"
    // data-hotspot="corner"
    // data-corner="tl"
    // data-trigger="hover"
    wrap.setAttribute('data-livephoto', '');
    wrap.setAttribute('data-label', 'LIVE');
    wrap.setAttribute('data-hotspot', 'corner');
    wrap.setAttribute('data-corner', 'tl');
    wrap.setAttribute('data-sound', 'off');
    wrap.dataset.video = videoUrl;

    const isMobile = matchMedia('(any-pointer: coarse)').matches;
    if (isMobile) {
      wrap.setAttribute('data-trigger', 'hover');
      wrap.setAttribute('data-hotspot', 'full');
    } else {
      wrap.setAttribute('data-trigger', 'hover'); // 桌面端仍是 hover
      wrap.setAttribute('data-hotspot', 'full');
    }

    wrap.classList.remove('no-video');
    if (wrap.__mlp) wrap.__mlp.destroy();
    wrap.__mlp = MiniLivePhoto.mount(wrap);

} else {
    // 移除 data-* 属性
    wrap.removeAttribute('data-livephoto');
    wrap.removeAttribute('data-label');
    wrap.removeAttribute('data-hotspot');
    wrap.removeAttribute('data-corner');
    wrap.removeAttribute('data-video');
    delete wrap.dataset.video;

    // 删除角标和 video 元素
    wrap.querySelectorAll('.mlp-badge, .mlp-video').forEach(el => el.remove());

    // 恢复 no-video 状态
    wrap.classList.add('no-video');
    if (wrap.__mlp) {
        wrap.__mlp.destroy();
        delete wrap.__mlp;
    }
  }

  document.querySelectorAll('[data-livephoto]').forEach(el => {
    el.addEventListener('contextmenu', e => e.preventDefault());
    el.addEventListener('dragstart', e => e.preventDefault());
  });
}