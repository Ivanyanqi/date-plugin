(function () {
  var LOCAL_SHOWCASE_URL = "http://127.0.0.1:8765/index.html";

  function isFilePreview(locationLike) {
    return !!locationLike && locationLike.protocol === "file:";
  }

  function getLocalPreviewRedirectUrl(locationLike) {
    if (!isFilePreview(locationLike)) {
      return null;
    }

    return LOCAL_SHOWCASE_URL + (locationLike.hash || "");
  }

  function shouldAutoRedirect(locationLike) {
    if (!isFilePreview(locationLike)) {
      return false;
    }

    return !/(?:^|[?&])filePreviewStay=1(?:&|$)/.test(locationLike.search || "");
  }

  window.datePluginShowcaseRuntime = {
    getLocalPreviewRedirectUrl: getLocalPreviewRedirectUrl,
    isFilePreview: isFilePreview,
    shouldAutoRedirect: shouldAutoRedirect
  };
})();
