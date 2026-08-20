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

// package_info_plus 10.2+ and flutter_webrtc 1.5+ skip applying KGP on AGP 9+ when
// they believe built-in Kotlin is active. Flutter still sets android.builtInKotlin=false
// until Firebase plugins migrate, so force KGP 2.3.20 onto Android library plugins.
// settings.gradle.kts also sets extra["android.builtInKotlin"]=true on :flutter_webrtc
// so that plugin does not apply its own KGP 2.1.0 (which breaks app javac).
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
