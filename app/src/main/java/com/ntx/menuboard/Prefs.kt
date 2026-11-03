package com.ntx.menuboard

import android.content.Context

/** Basit kalıcı ayar deposu: yön seçimi ve bulunan POS IP'si. */
object Prefs {
    private const val FILE = "menuboard_prefs"
    private const val KEY_ORIENTATION = "orientation" // "portrait" | "landscape" | null
    private const val KEY_POS_IP = "pos_ip"

    const val PORTRAIT = "portrait"
    const val LANDSCAPE = "landscape"

    private fun sp(ctx: Context) =
        ctx.applicationContext.getSharedPreferences(FILE, Context.MODE_PRIVATE)

    fun orientation(ctx: Context): String? = sp(ctx).getString(KEY_ORIENTATION, null)

    fun setOrientation(ctx: Context, value: String) =
        sp(ctx).edit().putString(KEY_ORIENTATION, value).apply()

    fun isOrientationChosen(ctx: Context): Boolean = orientation(ctx) != null

    fun posIp(ctx: Context): String? = sp(ctx).getString(KEY_POS_IP, null)

    fun setPosIp(ctx: Context, ip: String?) =
        sp(ctx).edit().putString(KEY_POS_IP, ip).apply()
}
