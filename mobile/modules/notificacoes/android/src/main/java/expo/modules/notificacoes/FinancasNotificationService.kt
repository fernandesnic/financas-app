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

    val extras = sbn.notification?.extras ?: return
    val titulo = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""
    val texto = (extras.getCharSequence(Notification.EXTRA_BIG_TEXT)
      ?: extras.getCharSequence(Notification.EXTRA_TEXT))?.toString() ?: ""
    if (titulo.isBlank() && texto.isBlank()) return

    val item = JSONObject()
      .put("chave", "${sbn.key}|${sbn.postTime}")
      .put("pacote", pacote)
      .put("titulo", titulo)
      .put("texto", texto)
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
    )
  }
}
