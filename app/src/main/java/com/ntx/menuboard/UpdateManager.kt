package com.ntx.menuboard

import android.app.PendingIntent
import android.app.admin.DevicePolicyManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageInstaller
import android.os.Build
import android.util.Log
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

/**
 * GitHub Releases üzerinden otomatik güncelleme.
 *
 * - En son release'in etiketi "v<versionCode>" biçiminde olmalı (ör. v2, v3).
 * - Yüklü sürümden yeni ise .apk indirilir ve kurulur.
 * - Cihaz "device owner" ise kurulum SESSİZ olur; değilse sistem onay ekranı gösterir.
 *
 * Depo herkese açık (public) olduğundan API çağrısı token gerektirmez.
 */
object UpdateManager {
    private const val TAG = "UpdateManager"
    private const val OWNER = "ilkerilgen"
    private const val REPO = "menuboard-tv"
    private const val LATEST =
        "https://api.github.com/repos/$OWNER/$REPO/releases/latest"
    private const val INSTALL_ACTION = "com.ntx.menuboard.INSTALL_RESULT"

    fun checkAndUpdate(ctx: Context) {
        try {
            val json = httpGet(LATEST) ?: return
            val obj = JSONObject(json)
            val tag = obj.optString("tag_name").ifBlank { return }
            val latestCode = tag.filter { it.isDigit() }.toIntOrNull() ?: return
            if (latestCode <= BuildConfig.VERSION_CODE) {
                Log.i(TAG, "Güncel (yüklü=${BuildConfig.VERSION_CODE}, son=$latestCode)")
                return
            }

            val assets = obj.optJSONArray("assets") ?: return
            var apkUrl: String? = null
            for (i in 0 until assets.length()) {
                val a = assets.getJSONObject(i)
                if (a.optString("name").endsWith(".apk", true)) {
                    apkUrl = a.optString("browser_download_url")
                    break
                }
            }
            if (apkUrl.isNullOrBlank()) return

            val apk = downloadApk(ctx, apkUrl, latestCode) ?: return
            installApk(ctx, apk)
        } catch (e: Exception) {
            Log.w(TAG, "update error: ${e.message}")
        }
    }

    private fun httpGet(url: String): String? {
        var conn: HttpURLConnection? = null
        return try {
            conn = (URL(url).openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                connectTimeout = 8000
                readTimeout = 8000
                setRequestProperty("Accept", "application/vnd.github+json")
                setRequestProperty("User-Agent", "MenuboardTV")
            }
            if (conn.responseCode != 200) return null
            conn.inputStream.bufferedReader().use { it.readText() }
        } catch (e: Exception) {
            null
        } finally {
            conn?.disconnect()
        }
    }

    private fun downloadApk(ctx: Context, url: String, code: Int): File? {
        var conn: HttpURLConnection? = null
        return try {
            val dir = File(ctx.cacheDir, "updates").apply { mkdirs() }
            dir.listFiles()?.forEach { it.delete() }
            val out = File(dir, "menuboard-v$code.apk")

            conn = (URL(url).openConnection() as HttpURLConnection).apply {
                connectTimeout = 15000
                readTimeout = 30000
                instanceFollowRedirects = true
                setRequestProperty("User-Agent", "MenuboardTV")
            }
            if (conn.responseCode != 200) return null
            conn.inputStream.use { input ->
                out.outputStream().use { input.copyTo(it) }
            }
            out
        } catch (e: Exception) {
            Log.w(TAG, "download error: ${e.message}")
            null
        } finally {
            conn?.disconnect()
        }
    }

    private fun installApk(ctx: Context, apk: File) {
        registerResultReceiver(ctx)
        val pi = ctx.packageManager.packageInstaller
        val params = PackageInstaller.SessionParams(
            PackageInstaller.SessionParams.MODE_FULL_INSTALL
        )
        val sessionId = pi.createSession(params)
        pi.openSession(sessionId).use { session ->
            session.openWrite("menuboard", 0, apk.length()).use { out ->
                apk.inputStream().use { it.copyTo(out) }
                session.fsync(out)
            }
            val intent = Intent(INSTALL_ACTION).setPackage(ctx.packageName)
            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S)
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
            else
                PendingIntent.FLAG_UPDATE_CURRENT
            val pending = PendingIntent.getBroadcast(ctx, sessionId, intent, flags)
            session.commit(pending.intentSender)
        }
        Log.i(TAG, "Kurulum oturumu başlatıldı (deviceOwner=${isDeviceOwner(ctx)})")
    }

    private fun isDeviceOwner(ctx: Context): Boolean {
        return try {
            val dpm = ctx.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            dpm.isDeviceOwnerApp(ctx.packageName)
        } catch (e: Exception) {
            false
        }
    }

    @Volatile private var receiverRegistered = false
    private fun registerResultReceiver(ctx: Context) {
        if (receiverRegistered) return
        receiverRegistered = true
        val receiver = object : BroadcastReceiver() {
            override fun onReceive(c: Context, i: Intent) {
                val status = i.getIntExtra(
                    PackageInstaller.EXTRA_STATUS,
                    PackageInstaller.STATUS_FAILURE
                )
                if (status == PackageInstaller.STATUS_PENDING_USER_ACTION) {
                    // device owner değil → sistem onay ekranını göster.
                    val confirm = @Suppress("DEPRECATION")
                    (i.getParcelableExtra<Intent>(Intent.EXTRA_INTENT))
                    confirm?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    confirm?.let { c.startActivity(it) }
                } else {
                    Log.i(TAG, "Install status=$status ${i.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE)}")
                }
            }
        }
        val filter = IntentFilter(INSTALL_ACTION)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ctx.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            @Suppress("UnspecifiedRegisterReceiverFlag")
            ctx.registerReceiver(receiver, filter)
        }
    }
}
