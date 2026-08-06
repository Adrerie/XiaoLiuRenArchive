package io.github.adrerie.xiaoliurenarchive;

import static androidx.test.espresso.web.action.DriverAtoms.webKeys;
import static androidx.test.espresso.web.action.WebViewActions.clearElement;
import static androidx.test.espresso.web.action.WebViewActions.webClick;
import static androidx.test.espresso.web.assertion.WebViewAssertions.webMatches;
import static androidx.test.espresso.web.model.Atoms.findElement;
import static androidx.test.espresso.web.model.Atoms.getText;
import static androidx.test.espresso.web.sugar.Web.onWebView;
import static org.hamcrest.CoreMatchers.containsString;

import androidx.test.core.app.ActivityScenario;
import androidx.test.espresso.web.model.Locator;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.uiautomator.UiDevice;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public final class AndroidDeviceSmokeTest {

    @Test
    public void offlineBetaFlowUsesStableDomSelectors() {
        try (ActivityScenario<MainActivity> ignored = ActivityScenario.launch(MainActivity.class)) {
            onWebView().forceJavascriptEnabled();
            onWebView()
                    .withElement(findElement(Locator.ID, "generate-result-button"))
                    .perform(webClick())
                    .withElement(findElement(Locator.ID, "final-palace-result"))
                    .check(webMatches(getText(), containsString("\u5c0f\u5409")));

            onWebView()
                    .withElement(findElement(Locator.ID, "nav-library"))
                    .perform(webClick())
                    .withElement(findElement(Locator.ID, "library-search-input"))
                    .perform(clearElement())
                    .perform(webKeys("\u5c0f\u5409"))
                    .withElement(findElement(Locator.ID, "palace-detail"))
                    .check(webMatches(getText(), containsString("\u5c0f\u5409")));

            UiDevice device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());
            device.pressBack();
            onWebView()
                    .withElement(findElement(Locator.ID, "generate-result-button"))
                    .check(webMatches(getText(), containsString("\u751f\u6210")))
                    .withElement(findElement(Locator.ID, "copy-json-button"))
                    .perform(webClick())
                    .withElement(findElement(Locator.ID, "export-status"))
                    .check(webMatches(getText(), containsString("\u526a\u8d34\u677f")));

            onWebView()
                    .withElement(findElement(Locator.ID, "nav-about"))
                    .perform(webClick())
                    .withElement(findElement(Locator.ID, "about-app-version"))
                    .check(webMatches(getText(), containsString("0.4.0-beta.1")))
                    .withElement(findElement(Locator.ID, "about-build-channel"))
                    .check(webMatches(getText(), containsString("beta-debug")))
                    .withElement(findElement(Locator.ID, "about-build-heading"))
                    .check(webMatches(getText(), containsString("\u6d4b\u8bd5\u7248\u4fe1\u606f")));
        }
    }
}
