package expo.modules.notificacoes

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import org.json.JSONObject

class FinancasNotificationService : NotificationListenerService() {

  override fun onNotificationPosted(sbn: StatusBarNotification?) {
    if (sbn == null) return
    val pacote = sbn.packageName ?: return
    if (!pacoteDeBanco(pacote)) return

    val notificacao = sbn.notification ?: return
    val extras = notificacao.extras ?: return
    fun campo(chave: String): String = extras.getCharSequence(chave)?.toString()?.trim() ?: ""

    val titulo = campo(Notification.EXTRA_TITLE).ifBlank { campo(Notification.EXTRA_TITLE_BIG) }
    val partes = mutableListOf<String>()
    // Alguns avisos (como compra no débito) guardam o texto em campos diferentes.
    listOf(Notification.EXTRA_BIG_TEXT, Notification.EXTRA_TEXT, Notification.EXTRA_SUB_TEXT, Notification.EXTRA_SUMMARY_TEXT)
      .map { campo(it) }.filter { it.isNotBlank() }.forEach { if (!partes.contains(it)) partes.add(it) }
    extras.getCharSequenceArray(Notification.EXTRA_TEXT_LINES)?.forEach {
      val linha = it?.toString()?.trim() ?: ""
      if (linha.isNotBlank() && !partes.contains(linha)) partes.add(linha)
    }
    notificacao.tickerText?.toString()?.trim()?.let { if (it.isNotBlank() && !partes.contains(it)) partes.add(it) }
    // Se o texto grande já contém o texto curto, ficamos só com o maior.
    val texto = partes.sortedByDescending { it.length }
      .fold(mutableListOf<String>()) { acc, t -> if (acc.none { it.contains(t) }) acc.add(t); acc }
      .joinToString(" ")

    // Banco mandou algo sem texto nenhum: guardamos mesmo assim para aparecer na tela Notificações.
    val tituloFinal = titulo.ifBlank { if (texto.isBlank()) "(sem título)" else "" }
    val textoFinal = texto.ifBlank { "(sem texto)" }

    val item = JSONObject()
      .put("chave", "${sbn.key}|${sbn.postTime}")
      .put("pacote", pacote)
      .put("titulo", tituloFinal)
      .put("texto", textoFinal)
      .put("quando", sbn.postTime)
    Fila.adicionar(applicationContext, item)
  }

  // Só guardamos notificações de apps de banco. Todo o resto é ignorado e nunca é lido.
  private fun pacoteDeBanco(pacote: String): Boolean {
    return PREFIXOS.any { pacote.startsWith(it) }
  }

  companion object {
    private val PREFIXOS = listOf(
      "com.nu.", // Nubank
      "com.nubank",
      "br.com.nubank",
      "com.santander",
      "br.com.santander",
      "br.com.bb", // Banco do Brasil
      "br.com.intermedium", // Inter
      "br.com.inter",
    )
  }
}
