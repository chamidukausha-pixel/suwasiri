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

// package_info_plus 10.2+ skips applying KGP on AGP 9+ (Built-in Kotlin), but Flutter
// still sets android.builtInKotlin=false until Firebase plugins migrate. Force KGP onto
// Android library plugins so their Kotlin sources still compile without the KGP warning
// from plugins that declare kotlin-android themselves.
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
