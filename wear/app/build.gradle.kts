plugins {
    id("com.android.application")
    id("io.github.takahirom.roborazzi")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

// Same applicationId as the phone app: Google Play ships this as the Wear OS form factor of Varde Fitness.
// versionCode lives in its own range so it never collides with the phone builds (EAS counts from 1).
val wearVersion = (System.getenv("WEAR_VERSION_CODE") ?: "1").toInt()

android {
    namespace = "no.cie.varde.watch"
    compileSdk = 36

    defaultConfig {
        applicationId = "no.cie.varde"
        minSdk = 30
        targetSdk = 35
        versionCode = 1_000_000 + wearVersion
        versionName = "1.0.$wearVersion"
    }

    signingConfigs {
        create("release") {
            val ks = System.getenv("VARDE_KEYSTORE")
            if (ks != null) {
                storeFile = file(ks)
                storePassword = System.getenv("VARDE_KEYSTORE_PASSWORD")
                keyAlias = System.getenv("VARDE_KEY_ALIAS")
                keyPassword = System.getenv("VARDE_KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            if (System.getenv("VARDE_KEYSTORE") != null) signingConfig = signingConfigs.getByName("release")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    buildFeatures { compose = true }
    testOptions {
        unitTests {
            isIncludeAndroidResources = true
            all {
                // optional: point Robolectric at a pre-downloaded android-all jar (offline machines)
                System.getenv("ROBOLECTRIC_DIR")?.let { dir ->
                    it.systemProperty("robolectric.offline", "true")
                    it.systemProperty("robolectric.dependency.dir", dir)
                }
            }
        }
    }
}

kotlin { compilerOptions { jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17) } }

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2025.08.00")
    implementation(composeBom)
    implementation("androidx.activity:activity-compose:1.10.1")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.wear.compose:compose-material:1.4.1")
    implementation("androidx.wear.compose:compose-foundation:1.4.1")
    implementation("androidx.wear:wear:1.3.0")
    implementation("com.google.android.gms:play-services-wearable:19.0.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-play-services:1.10.2")
    implementation("androidx.core:core-splashscreen:1.0.1")

    // screenshot tests of the watch screens (./gradlew recordRoborazziDebug)
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.robolectric:robolectric:4.15.1")
    testImplementation("io.github.takahirom.roborazzi:roborazzi:1.46.1")
    testImplementation("io.github.takahirom.roborazzi:roborazzi-compose:1.46.1")
    testImplementation("androidx.compose.ui:ui-test-junit4")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
