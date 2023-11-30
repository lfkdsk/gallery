function getParam(key) {
  const queryString = window.location.search;
  console.log(queryString);
  const urlParams = new URLSearchParams(queryString);
  const id = urlParams.get(key)
  console.log(id)
  return id
}

function replaceQueryParam(param, newval, search) {
  var regex = new RegExp("([?;&])" + param + "[^&;]*[;&]?");
  var query = search.replace(regex, "$1").replace(/&$/, '');
  return (query.length > 2 ? query + "&" : "?") + (newval ? param + "=" + newval : '');
}
function updateParams(name) {
  const url = new URL(window.location.href);
  url.searchParams.set('name', name);
  window.history.replaceState(null, null, url); // or pushState
}

function copyToClipboard(content) {
  toastr.options = {
    "closeButton": true,
    "debug": false,
    "newestOnTop": false,
    "progressBar": false,
    "positionClass": "toast-top-right",
    "preventDuplicates": false,
    "onclick": null,
    "showDuration": "300",
    "hideDuration": "1000",
    "timeOut": "5000",
    "extendedTimeOut": "1000",
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "fadeIn",
    "hideMethod": "fadeOut"
  }
  if (window.isSecureContext && navigator.clipboard) {
    navigator.clipboard.writeText(content);
    toastr.success('Copy single url into Clipboard.');
  } else {
    toastr.info('Please check your clipboard write permission.')
  }
}

function simulateDownloadImageClick(uri, filename) {
  var link = document.createElement('a');
  link.setAttribute("class", "screenshot");
  if (typeof link.download !== 'string') {
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

function accountForFirefox(click) { // wrapper function
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

  const maker = v.exif_data['Image Make'];
  console.log(maker);
  switch (maker) {
    case 'Apple': {
      exifLogo.attr('src', 'img/apple.png');
      break;
    }
    case 'RICOH IMAGING COMPANY, LTD.  ': {
      exifLogo.attr('src', 'img/384_ricoh.jpg');
      break;
    }
    case 'Canon': {
      exifLogo.attr('src', 'img/canon.png');
      break;
    }
    default: {
      break;
    }
    case 'FUJIFILM': {
      exifLogo.attr('src', 'img/fujifilm.png');
      break;
    }
  }
  exifParam.text(v.exif_data['EXIF ISOSpeedRatings'] + ' ' + v.exif_data['EXIF FNumber'] + ' ' + v.exif_data['EXIF ExposureTime']);
  exifLens.text(v.exif_data['EXIF LensModel']);
  exifMaker.text(v.exif_data['Image Model'])
  exifDate.text(v.exif_data['EXIF DateTimeOriginal']);
  exifAuthor.text("By " + author)
}