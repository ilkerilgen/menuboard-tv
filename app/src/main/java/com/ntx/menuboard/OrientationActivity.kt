package com.ntx.menuboard

import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import android.app.Activity

/** İlk açılışta "Dikey mi Yatay mı?" soran, D-pad ile gezilebilir ekran. */
class OrientationActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor("#111316"))
            setPadding(dp(48), dp(48), dp(48), dp(48))
        }

        val title = TextView(this).apply {
            text = "EKRAN YÖNÜNÜ SEÇİN"
            setTextColor(Color.parseColor("#f2be71"))
            textSize = 30f
            gravity = Gravity.CENTER
            letterSpacing = 0.08f
        }
        val subtitle = TextView(this).apply {
            text = "Menü panosu bu yönde gösterilecek. Daha sonra değiştirmek için uygulamayı yeniden kurabilirsiniz."
            setTextColor(Color.parseColor("#bcc8d3"))
            textSize = 15f
            gravity = Gravity.CENTER
            setPadding(0, dp(12), 0, dp(40))
        }

        val row = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
        }
        val portrait = choiceButton("↕  DİKEY") { choose(Prefs.PORTRAIT) }
        val landscape = choiceButton("↔  YATAY") { choose(Prefs.LANDSCAPE) }
        row.addView(portrait)
        row.addView(landscape)

        root.addView(title)
        root.addView(subtitle)
        root.addView(row)
        setContentView(root)

        landscape.requestFocus()
    }

    private fun choose(value: String) {
        Prefs.setOrientation(this, value)
        startActivity(Intent(this, MainActivity::class.java))
        finish()
    }

    private fun choiceButton(label: String, onClick: () -> Unit): Button {
        return Button(this).apply {
            text = label
            isAllCaps = false
            textSize = 24f
            setTextColor(Color.parseColor("#f2be71"))
            setBackgroundColor(Color.parseColor("#801222"))
            val lp = LinearLayout.LayoutParams(dp(220), dp(150))
            lp.setMargins(dp(16), 0, dp(16), 0)
            layoutParams = lp
            isFocusable = true
            isFocusableInTouchMode = false
            setOnClickListener { onClick() }
            setOnFocusChangeListener { _, hasFocus ->
                setBackgroundColor(
                    Color.parseColor(if (hasFocus) "#a3182e" else "#801222")
                )
                scaleX = if (hasFocus) 1.06f else 1f
                scaleY = if (hasFocus) 1.06f else 1f
            }
        }
    }

    private fun dp(v: Int): Int = (v * resources.displayMetrics.density).toInt()
}
