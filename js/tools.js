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
    default: {
      break;
    }
    case "FUJIFILM": {
      exifLogo.attr("src", "img/fujifilm.png");
      exifLogo.addClass("fujifilm-logo");
      break;
    }
    case "OM Digital Solutions": {
      exifLogo.attr("src", "img/om-system.svg");
      exifLogo.addClass("om-system-logo");
      break;
    }
    case "OLYMPUS CORPORATION": 
    case "OLYMPUS IMAGING CORP.": {
      exifLogo.attr("src", "img/OlympusLogoBlueAndGoldRGB.png");
      exifLogo.addClass("olympus-logo");
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