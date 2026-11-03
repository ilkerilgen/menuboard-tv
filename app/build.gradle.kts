import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.ntx.menuboard"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.ntx.menuboard"
        minSdk = 23
        targetSdk = 34
        // Her yeni sürümde versionCode'u BİR artır (otomatik güncelleme bunu karşılaştırır).
        versionCode = 1
        versionName = "1.0"
    }

    // Keystore CI'da secret'tan gelir. Lokalde yoksa debug imzaya düşer.
    val keystoreFile = rootProject.file("keystore/release.jks")
    signingConfigs {
        if (keystoreFile.exists()) {
            create("release") {
                storeFile = keystoreFile
                storePassword = System.getenv("KEYSTORE_PASSWORD") ?: "menuboard"
                keyAlias = System.getenv("KEY_ALIAS") ?: "menuboard"
                keyPassword = System.getenv("KEY_PASSWORD") ?: "menuboard"
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = if (keystoreFile.exists()) {
                signingConfigs.getByName("release")
            } else {
                signingConfigs.getByName("debug")
            }
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        buildConfig = true
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
}
