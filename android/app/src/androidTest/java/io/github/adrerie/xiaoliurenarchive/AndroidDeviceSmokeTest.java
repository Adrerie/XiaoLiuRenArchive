package io.github.adrerie.xiaoliurenarchive;

import android.content.Intent;
import android.os.SystemClock;
import android.webkit.WebView;
import static androidx.test.espresso.web.sugar.Web.onWebView;
import static androidx.test.espresso.web.webdriver.DriverAtoms.clearElement;
import static androidx.test.espresso.web.webdriver.DriverAtoms.findElement;
import static androidx.test.espresso.web.webdriver.DriverAtoms.webClick;
import static androidx.test.espresso.web.webdriver.DriverAtoms.webKeys;

import androidx.test.core.app.ActivityScenario;
import androidx.test.espresso.web.webdriver.Locator;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.uiautomator.UiDevice;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public final class AndroidDeviceSmokeTest {

    private static void assertElementText(
            ActivityScenario<MainActivity> scenario,
            String elementId,
            String expected
    ) throws Exception {
        CountDownLatch evaluated = new CountDownLatch(1);
        String[] observed = new String[1];
        scenario.onActivity(activity -> {
            WebView webView = activity.getBridge().getWebView();
            webView.evaluateJavascript("document.getElementById('" + elementId + "')?.innerText", value -> {
                        observed[0] = value;
                        evaluated.countDown();
                    });
        });
        if (!evaluated.await(5, TimeUnit.SECONDS)) {
            throw new AssertionError("Timed out while reading the physical-device element " + elementId);
        }
        if (observed[0] == null || !observed[0].contains(expected)) {
            throw new AssertionError(
                    "Expected " + elementId + " to contain " + expected + ", got " + observed[0]
            );
        }
    }

    private static void assertElementTextEventually(
            ActivityScenario<MainActivity> scenario,
            String elementId,
            String expected
    ) throws Exception {
        CountDownLatch evaluated = new CountDownLatch(1);
        String[] observed = new String[1];
        scenario.onActivity(activity -> {
            WebView webView = activity.getBridge().getWebView();
            long deadline = SystemClock.uptimeMillis() + 5_000L;
            webView.post(new Runnable() {
                @Override
                public void run() {
                    webView.evaluateJavascript("document.getElementById('" + elementId + "')?.innerText", value -> {
                        observed[0] = value;
                        if (value != null && value.contains(expected)) {
                            evaluated.countDown();
                        } else if (SystemClock.uptimeMillis() < deadline) {
                            webView.postDelayed(this, 100L);
                        } else {
                            evaluated.countDown();
                        }
                    });
                }
            });
        });
        if (!evaluated.await(6, TimeUnit.SECONDS)) {
            throw new AssertionError("Timed out while reading the physical-device element " + elementId);
        }
        if (observed[0] == null || !observed[0].contains(expected)) {
            throw new AssertionError(
                    "Expected " + elementId + " to contain " + expected + ", got " + observed[0]
            );
        }
    }

    private static void setInputValueThroughStandardEvents(
            ActivityScenario<MainActivity> scenario,
            String elementId,
            String value
    ) throws Exception {
        CountDownLatch evaluated = new CountDownLatch(1);
        String[] observed = new String[1];
        String escapedValue = value.replace("\\", "\\\\").replace("'", "\\'");
        String script = "(function() {"
                + "var input = document.getElementById('" + elementId + "');"
                + "if (!input) return null;"
                + "var descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');"
                + "if (!descriptor || !descriptor.set) return null;"
                + "descriptor.set.call(input, '" + escapedValue + "');"
                + "input.dispatchEvent(new Event('input', { bubbles: true }));"
                + "input.dispatchEvent(new Event('change', { bubbles: true }));"
                + "return input.value;"
                + "})()";
        scenario.onActivity(activity -> activity.getBridge().getWebView().evaluateJavascript(script, valueResult -> {
            observed[0] = valueResult;
            evaluated.countDown();
        }));
        if (!evaluated.await(5, TimeUnit.SECONDS)) {
            throw new AssertionError("Timed out while entering the physical-device search query");
        }
        if (observed[0] == null || !observed[0].contains(value)) {
            throw new AssertionError("Expected search input to contain " + value + ", got " + observed[0]);
        }
    }

    @Test
    public void offlineBetaFlowUsesStableDomSelectors() throws Exception {
        UiDevice device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());
        Intent launchIntent = new Intent(
                InstrumentationRegistry.getInstrumentation().getTargetContext(),
                MainActivity.class
        ).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK | Intent.FLAG_ACTIVITY_NEW_TASK);

        try (ActivityScenario<MainActivity> ignored = ActivityScenario.launch(launchIntent)) {
            onWebView()
                    .withElement(findElement(Locator.ID, "casting-mode-manual_lunar_time"))
                    .perform(webClick())
                    .withElement(findElement(Locator.ID, "lunar-month-input"))
                    .perform(clearElement())
                    .withElement(findElement(Locator.ID, "lunar-month-input"))
                    .perform(webKeys("3"))
                    .withElement(findElement(Locator.ID, "lunar-day-input"))
                    .perform(clearElement())
                    .withElement(findElement(Locator.ID, "lunar-day-input"))
                    .perform(webKeys("5"))
                    .withElement(findElement(Locator.CSS_SELECTOR, "#earthly-branch-select option[value='5']"))
                    .perform(webClick());
            onWebView()
                    .withElement(findElement(Locator.ID, "generate-result-button"))
                    .perform(webClick());
            assertElementText(ignored, "final-palace-result", "\u5c0f\u5409");

            onWebView()
                    .withElement(findElement(Locator.ID, "nav-library"))
                    .perform(webClick());
            onWebView()
                    .withElement(findElement(Locator.ID, "library-search-input"))
                    .perform(clearElement());
            setInputValueThroughStandardEvents(ignored, "library-search-input", "\u5c0f\u5409");
            assertElementTextEventually(ignored, "library-result-count", "1");
            onWebView()
                    .withElement(findElement(Locator.ID, "palace-card-xiao_ji"))
                    .perform(webClick());
            assertElementText(ignored, "palace-detail", "\u5c0f\u5409");

            device.pressBack();
            onWebView().withElement(findElement(Locator.ID, "copy-json-button")).perform(webClick());
            assertElementText(ignored, "generate-result-button", "\u751f\u6210");
            assertElementTextEventually(ignored, "export-status", "\u526a\u8d34\u677f");

            onWebView()
                    .withElement(findElement(Locator.ID, "nav-about"))
                    .perform(webClick());
            assertElementText(ignored, "about-app-version", "0.5.0-beta.1");
            assertElementText(ignored, "about-build-channel", "beta-debug");
            assertElementText(ignored, "about-build-heading", "\u6d4b\u8bd5\u7248\u4fe1\u606f");
        }
    }
}
