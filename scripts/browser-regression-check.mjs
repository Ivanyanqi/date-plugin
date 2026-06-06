import { chromium } from "playwright";

const baseUrl = process.env.DATE_PLUGIN_TEST_BASE_URL || "http://127.0.0.1:8765";

const testPages = [
  "tests/core/calendar.test.html",
  "tests/state/instance-state.test.html",
  "tests/interaction/keyboard-navigation.test.html",
  "tests/accessibility/aria-semantics.test.html",
  "tests/public/date-picker-api.test.html",
  "tests/public/month-control-api.test.html",
  "tests/public/package-manifest.test.html",
  "tests/public/showcase-runtime.test.html",
  "tests/public/showcase-homepage.test.html",
  "tests/options/date-constraints.test.html",
  "tests/options/display-options.test.html",
  "tests/options/input-sync-callbacks.test.html",
  "tests/options/footer-actions-positioning.test.html",
  "tests/options/visual-states-placement.test.html",
  "tests/options/mobile-sheet-layout.test.html",
  "tests/options/mobile-overlay-scroll-lock.test.html",
  "tests/options/mobile-animation-safe-area.test.html",
  "tests/options/mobile-reduced-motion.test.html",
  "regression.html"
];

async function waitForSummary(page) {
  await page.waitForFunction(
    function () {
      var summary = document.querySelector("#summary");
      if (!summary) {
        return false;
      }

      var text = summary.textContent || "";
      return text.indexOf("All checks passed.") >= 0 || /check\(s\) failed\./.test(text);
    },
    { timeout: 15000 }
  );
}

async function runPage(browser, pagePath, index) {
  const page = await browser.newPage({
    viewport: {
      width: 1440,
      height: 1200
    }
  });

  const pageErrors = [];
  page.on("pageerror", function (error) {
    pageErrors.push(error.message);
  });

  const url = new URL(pagePath, baseUrl + "/");
  url.searchParams.set("ci", String(index + 1));

  try {
    await page.goto(url.toString(), {
      waitUntil: "domcontentloaded",
      timeout: 15000
    });

    await waitForSummary(page);

    const summaryText = await page.locator("#summary").innerText();
    const failedChecks = await page.locator(".fail").allInnerTexts();

    if (pageErrors.length > 0) {
      throw new Error("页面脚本异常: " + pageErrors.join(" | "));
    }

    if (summaryText.indexOf("All checks passed.") < 0) {
      throw new Error(
        "摘要未通过: " +
          summaryText +
          (failedChecks.length ? " | 失败项: " + failedChecks.join(" || ") : "")
      );
    }

    console.log("PASS", pagePath, "-", summaryText.trim());
  } finally {
    await page.close();
  }
}

async function main() {
  const browser = await chromium.launch({
    headless: true
  });

  try {
    for (let index = 0; index < testPages.length; index += 1) {
      await runPage(browser, testPages[index], index);
    }

    console.log("All browser regression pages passed.");
  } finally {
    await browser.close();
  }
}

main().catch(function (error) {
  console.error(error.message);
  process.exitCode = 1;
});
