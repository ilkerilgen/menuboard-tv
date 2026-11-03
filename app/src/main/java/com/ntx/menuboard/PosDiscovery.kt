package com.ntx.menuboard

import android.content.Context
import android.util.Log
import java.net.InetSocketAddress
import java.net.NetworkInterface
import java.net.Socket
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

/**
 * Yerel ağda POSSAFE (arti POS backend) sunucusunu arar.
 * POS backend :3001 portundan hizmet verir; bu portu açık bulan ilk host aday kabul edilir.
 *
 * NOT: Faz 1'de yalnızca altyapıdır — bulunan IP Prefs'e yazılır, veri bağlama Faz 2'de yapılacak.
 */
object PosDiscovery {
    private const val TAG = "PosDiscovery"
    const val POS_PORT = 3001
    private const val CONNECT_TIMEOUT_MS = 150
    private const val SCAN_TIMEOUT_SEC = 25L

    /** API taban adresi (bulunduysa). Faz 2 bunu kullanacak. */
    fun apiBase(ctx: Context): String? {
        val ip = Prefs.posIp(ctx) ?: return null
        return "http://$ip:$POS_PORT"
    }

    fun discoverAndRemember(ctx: Context): String? {
        // Önce daha önce bulunan IP hâlâ geçerli mi?
        Prefs.posIp(ctx)?.let { if (isPosHost(it)) return it }

        val prefix = localSubnetPrefix() ?: return null
        val pool = Executors.newFixedThreadPool(32)
        @Volatile var found: String? = null
        try {
            for (i in 1..254) {
                val host = "$prefix.$i"
                pool.execute {
                    if (found == null && isPosHost(host)) {
                        synchronized(this) { if (found == null) found = host }
                    }
                }
            }
            pool.shutdown()
            pool.awaitTermination(SCAN_TIMEOUT_SEC, TimeUnit.SECONDS)
        } catch (e: Exception) {
            Log.w(TAG, "scan error: ${e.message}")
        } finally {
            pool.shutdownNow()
        }

        found?.let {
            Prefs.setPosIp(ctx, it)
            Log.i(TAG, "POSSAFE bulundu: $it:$POS_PORT")
        }
        return found
    }

    private fun isPosHost(host: String): Boolean {
        return try {
            Socket().use { s ->
                s.connect(InetSocketAddress(host, POS_PORT), CONNECT_TIMEOUT_MS)
                true
            }
        } catch (e: Exception) {
            false
        }
    }

    /** Cihazın IPv4 adresinden /24 ön ekini (ör. 192.168.1) üretir. */
    private fun localSubnetPrefix(): String? {
        try {
            val ifaces = NetworkInterface.getNetworkInterfaces()
            for (iface in ifaces) {
                if (!iface.isUp || iface.isLoopback) continue
                for (addr in iface.inetAddresses) {
                    val ip = addr.hostAddress ?: continue
                    if (!addr.isLoopbackAddress && ip.count { it == '.' } == 3 && !ip.startsWith("169.254")) {
                        return ip.substringBeforeLast('.')
                    }
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "subnet error: ${e.message}")
        }
        return null
    }
}
