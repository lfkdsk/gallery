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