package io.github.adrerie.xiaoliurenarchive;

import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Bundle;
import android.view.Window;
import android.view.WindowManager;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String THEME_PREFERENCES = "xiaoliurenarchive.theme";
    private String appTheme = "system";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ThemeBarPlugin.class);
        appTheme = getSharedPreferences(THEME_PREFERENCES, MODE_PRIVATE)
                .getString("preference", "system");
        super.onCreate(savedInstanceState);
        configureSystemBars();
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        configureSystemBars();
    }

    private void configureSystemBars() {
        Window window = getWindow();
        WindowCompat.setDecorFitsSystemWindows(window, false);
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);
        window.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);

        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, window.getDecorView());
        boolean darkSystem = (getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK)
                == Configuration.UI_MODE_NIGHT_YES;
        boolean darkTheme = "dark".equals(appTheme) || ("system".equals(appTheme) && darkSystem);
        controller.setAppearanceLightStatusBars(!darkTheme);
        controller.setAppearanceLightNavigationBars(!darkTheme);
    }

    void setAppTheme(String theme) {
        if (!"light".equals(theme) && !"dark".equals(theme) && !"system".equals(theme)) {
            theme = "system";
        }
        appTheme = theme;
        getSharedPreferences(THEME_PREFERENCES, MODE_PRIVATE)
                .edit()
                .putString("preference", appTheme)
                .apply();
        configureSystemBars();
    }
}
