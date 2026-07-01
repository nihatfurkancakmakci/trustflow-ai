// trusflowai runtime error reporter
// Yayındaki sitede tarayıcı hatalarını yakalar ve Netlify function'a yollar.
(function () {
  var ENDPOINT = "/.netlify/functions/report-error";
  var reported = new Set();

  function fingerprint(msg, stack) {
    return (msg || "") + "|" + (stack || "").slice(0, 200);
  }

  function report(payload) {
    var fp = fingerprint(payload.message, payload.stack);
    if (reported.has(fp)) return;
    reported.add(fp);

    try {
      var body = JSON.stringify({
        message: payload.message,
        stack: payload.stack,
        url: location.href,
        userAgent: navigator.userAgent,
        line: payload.line,
        col: payload.col,
      });
      // sendBeacon: sayfa unload olsa bile ulaşır
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          ENDPOINT,
          new Blob([body], { type: "application/json" }),
        );
      } else {
        fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: body,
          keepalive: true,
        }).catch(function () {});
      }
    } catch (_) {}
  }

  window.addEventListener("error", function (e) {
    report({
      message: e.message,
      stack: e.error && e.error.stack,
      line: e.lineno,
      col: e.colno,
    });
  });

  window.addEventListener("unhandledrejection", function (e) {
    var reason = e.reason;
    report({
      message: "unhandledrejection: " + (reason && reason.message ? reason.message : String(reason)),
      stack: reason && reason.stack,
    });
  });
})();
