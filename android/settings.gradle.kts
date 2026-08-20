pluginManagement {
    val flutterSdkPath =
        run {
            val properties = java.util.Properties()
            file("local.properties").inputStream().use { properties.load(it) }
            val flutterSdkPath = properties.getProperty("flutter.sdk")
            require(flutterSdkPath != null) { "flutter.sdk not set in local.properties" }
            flutterSdkPath
        }

    includeBuild("$flutterSdkPath/packages/flutter_tools/gradle")

    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

plugins {
    id("dev.flutter.flutter-plugin-loader") version "1.0.0"
    id("com.android.application") version "9.0.1" apply false
    id("org.jetbrains.kotlin.android") version "2.3.20" apply false
    id("com.google.gms.google-services") version "4.4.2" apply false
}

include(":app")

// flutter_webrtc 1.6.0 applies KGP 2.1.0 when android.builtInKotlin=false. That
// second apply (after this repo already force-applies KGP 2.3.20) leaves
// FlutterWebRTCPlugin off the app Java compile classpath:
// GeneratedPluginRegistrant cannot find symbol FlutterWebRTCPlugin.
// Setting the extra only on that project makes its build.gradle skip the
// legacy apply; root android/build.gradle.kts then wires KGP 2.3.20 like
// the other Android library plugins.
gradle.beforeProject {
    if (name == "flutter_webrtc") {
        extra["android.builtInKotlin"] = true
    }
}
