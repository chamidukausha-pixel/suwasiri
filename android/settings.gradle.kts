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

// flutter_webrtc 1.6.0 still has a start-of-line `apply plugin: 'kotlin-android'`
// in android/build.gradle. Flutter's Gradle plugin regex-matches that text and
// prints the KGP warning even when the apply is skipped at runtime.
// Point :flutter_webrtc at a copied overlay whose apply line is commented so
// Flutter no longer flags it; KGP 2.3.20 is applied by Flutter / root
// build.gradle.kts instead of the plugin's KGP 2.1.0.
val flutterWebrtc = try {
    project(":flutter_webrtc")
} catch (_: org.gradle.api.UnknownProjectException) {
    null
}
if (flutterWebrtc != null) {
    val originalAndroid = flutterWebrtc.projectDir
    val originalGradle = File(originalAndroid, "build.gradle")
    val overlayDir = File(rootDir, "gradle/flutter_webrtc_overlay")
    val overlayGradle = File(overlayDir, "build.gradle")
    val stampFile = File(overlayDir, ".suwasiri-stamp")
    val stamp = "${originalAndroid.invariantSeparatorsPath}|${originalGradle.lastModified()}|${originalGradle.length()}"
    val alreadyPatched =
        overlayGradle.isFile &&
            overlayGradle.readText().contains("Suwasiri: hide from Flutter KGP regex") &&
            stampFile.isFile &&
            stampFile.readText() == stamp
    if (!alreadyPatched) {
        overlayDir.deleteRecursively()
        originalAndroid.copyRecursively(overlayDir)
        val patched =
            overlayGradle.readText().replace(
                "    apply plugin: 'kotlin-android'",
                "    // apply plugin: 'kotlin-android' // Suwasiri: hide from Flutter KGP regex",
            )
        require(patched != overlayGradle.readText()) {
            "flutter_webrtc android/build.gradle no longer contains apply plugin: 'kotlin-android'; update the overlay patch."
        }
        overlayGradle.writeText(patched)
        stampFile.writeText(stamp)
    }
    flutterWebrtc.projectDir = overlayDir
}

// Skip the plugin's own KGP 2.1.0 apply (classpath mismatch broke app javac).
gradle.beforeProject {
    if (name == "flutter_webrtc") {
        extra["android.builtInKotlin"] = true
    }
}
