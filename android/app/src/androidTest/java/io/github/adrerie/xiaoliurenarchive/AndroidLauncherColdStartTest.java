package io.github.adrerie.xiaoliurenarchive;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.SystemClock;
import android.util.Log;
import android.webkit.WebView;

import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.ext.junit.runners.AndroidJUnit4;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;

/** Verifies the real MAIN/LAUNCHER path on the connected physical device. */
@RunWith(AndroidJUnit4.class)
public final class AndroidLauncherColdStartTest {
    private static final String TAG = "R5LauncherColdStart";
    private static final String APPLICATION_ID = "io.github.adrerie.xiaoliurenarchive";

    private static String evaluate(WebView webView, String script) throws Exception {
        CountDownLatch completed = new CountDownLatch(1);
        String[] observed = new String[1];
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() ->
                webView.evaluateJavascript(script, value -> {
                    observed[0] = value;
                    completed.countDown();
                }));
        Assert.assertTrue("Timed out while reading launcher WebView state", completed.await(5, TimeUnit.SECONDS));
        return observed[0];
    }

    @Test
    public void launcherColdStartReachesRenderedRoot() throws Exception {
        android.app.Instrumentation instrumentation = InstrumentationRegistry.getInstrumentation();
        Context targetContext = instrumentation.getTargetContext();
        Intent launcherIntent = targetContext.getPackageManager().getLaunchIntentForPackage(APPLICATION_ID);
        Assert.assertNotNull("The application must expose a package launcher intent", launcherIntent);
        Assert.assertEquals(Intent.ACTION_MAIN, launcherIntent.getAction());
        Assert.assertTrue(launcherIntent.hasCategory(Intent.CATEGORY_LAUNCHER));
        launcherIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK | Intent.FLAG_ACTIVITY_NEW_TASK);

        long start = SystemClock.elapsedRealtime();
        Activity activity = instrumentation.startActivitySync(launcherIntent);
        Assert.assertTrue("Launcher intent did not create MainActivity", activity instanceof MainActivity);
        WebView webView = ((MainActivity) activity).getBridge().getWebView();

        String finalSnapshot = null;
        long[] checkpoints = {1_000L, 3_000L, 10_000L};
        for (long checkpoint : checkpoints) {
            long remaining = checkpoint - (SystemClock.elapsedRealtime() - start);
            if (remaining > 0) SystemClock.sleep(remaining);
            finalSnapshot = evaluate(webView,
                    "JSON.stringify({readyState: document.readyState, rootChildren: document.getElementById('root')?.children.length ?? 0, heading: document.querySelector('h1')?.innerText ?? ''})");
            Log.i(TAG, "checkpointMs=" + checkpoint + " elapsedMs="
                    + (SystemClock.elapsedRealtime() - start) + " snapshot=" + finalSnapshot);
        }

        Assert.assertNotNull(finalSnapshot);
        Assert.assertTrue("WebView document did not reach complete state by 10s", finalSnapshot.contains("complete"));
        Assert.assertTrue("WebView root did not render by 10s", !finalSnapshot.contains("rootChildren\\\":0"));
        Assert.assertTrue("WebView did not render the app heading by 10s", finalSnapshot.contains("小六壬档案"));
    }
}
