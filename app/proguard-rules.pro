# WebView JS arayüzü ileride kullanılacak; isimleri koru.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
