package io.github.adrerie.xiaoliurenarchive;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;

@CapacitorPlugin(name = "ThemeBar")
public final class ThemeBarPlugin extends Plugin {
    @PluginMethod
    public void setTheme(PluginCall call) {
        String theme = call.getString("theme", "system");
        if (getActivity() instanceof MainActivity) {
            MainActivity activity = (MainActivity) getActivity();
            activity.runOnUiThread(() -> {
                activity.setAppTheme(theme);
                call.resolve(new JSObject());
            });
            return;
        }
        call.reject("Theme bars are not available");
    }
}
