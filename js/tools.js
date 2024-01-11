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
  switch (maker) {
    case "Apple": {
      exifLogo.attr("src", "img/apple.png");
      break;
    }
    case "RICOH IMAGING COMPANY, LTD.  ": {
      exifLogo.attr("src", "img/384_ricoh.jpg");
      break;
    }
    case "Canon": {
      exifLogo.attr("src", "img/canon.png");
      break;
    }
    default: {
      break;
    }
    case "FUJIFILM": {
      exifLogo.attr("src", "img/fujifilm.png");
      break;
    }
  }
  exifParam.text(
    v.exif_data["EXIF ISOSpeedRatings"] +
      " " +
      v.exif_data["EXIF FNumber"] +
      " " +
      v.exif_data["EXIF ExposureTime"]
  );
  exifLens.text(v.exif_data["EXIF LensModel"]);
  exifMaker.text(v.exif_data["Image Model"]);
  exifDate.text(v.exif_data["EXIF DateTimeOriginal"]);
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
GROUP BY SUBSTR(exifdate, 1, 4);
`
  );
  for (const item of result[0].values) {
    const year = item[0];
    const data = item[1];
    const arr = data.split(",");
    for (var i = 0; i < arr.length; i++) {
      arr[i] = arr[i].split(":");
    }
    var subDom = document.createElement("div");
    subDom.classList = "status";
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
              "一月",
              "二月",
              "三月",
              "四月",
              "五月",
              "六月",
              "七月",
              "八月",
              "九月",
              "十月",
              "十一月",
              "十二月",
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

function fillTable(data, name, thumbnail_url, backup_thumbnail_url) {
  const wrapper = document.getElementById('table-wrapper');
  var i = 0;
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

    // 添加数据行
    const tbody = table.createTBody();
    for (const row of item.values) {
        const tr = tbody.insertRow();
        for (const cell of row) {
            const td = tr.insertCell();
            if (isImage(cell + "")) {
                const a = document.createElement('a');
                a.text = cell
                a.setAttribute('href', 'photo?name=' + cell);
                td.appendChild(a);
                const img = document.createElement('img');
                img.style.width = '200px'
                img.src = thumbnail_url + cell.replace(/\.\w+$/, '.webp');
                addBackUp(img, backup_thumbnail_url + '/', cell.replace(/\.\w+$/, '.webp'))
                td.appendChild(img)
                continue
            }
            const text = document.createTextNode(cell);
            td.appendChild(text);
        }
    }
  }
}

function queryTable(name, sql, db, thumbnail_url, backup_thumbnail_url) {
  var data = db.exec(sql);
  fillTable(data, name, thumbnail_url, backup_thumbnail_url);
}