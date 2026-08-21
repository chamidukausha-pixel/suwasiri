allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}

// package_info_plus 10.2+ skips applying KGP on AGP 9+ when it believes built-in
// Kotlin is active. Flutter still sets android.builtInKotlin=false, so force
// KGP 2.3.20 onto Android library plugins. :flutter_webrtc uses a settings overlay
// (see settings.gradle.kts) so Flutter does not regex-flag its leftover KGP apply.
subprojects {
    pluginManager.withPlugin("com.android.library") {
        val hasKotlin =
            pluginManager.hasPlugin("org.jetbrains.kotlin.android") ||
                pluginManager.hasPlugin("kotlin-android")
        if (!hasKotlin) {
            pluginManager.apply("org.jetbrains.kotlin.android")
        }
    }
}

subprojects {
    project.evaluationDependsOn(":app")
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
