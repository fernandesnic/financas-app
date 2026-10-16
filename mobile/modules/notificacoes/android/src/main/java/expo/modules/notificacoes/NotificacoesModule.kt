package expo.modules.notificacoes

import android.content.ComponentName
import android.content.Context
import android.content.pm.PackageManager
import android.content.Intent
import android.provider.Settings
import android.service.notification.NotificationListenerService
import androidx.core.app.NotificationManagerCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class NotificacoesModule : Module() {
  private val context: Context
    get() = requireNotNull(appContext.reactContext) { "Contexto do React indisponível" }

  override fun definition() = ModuleDefinition {
    Name("Notificacoes")

    // O usuário já liberou o "acesso às notificações" para este app?
    Function("acessoConcedido") {
      NotificationManagerCompat.getEnabledListenerPackages(context).contains(context.packageName)
    }

    // Depois de atualizar o app, o Android às vezes não religa o serviço de notificações sozinho.
    // Isto pede o religamento e, se preciso, desliga/liga o componente para forçar.
    Function("religar") {
      val nome = ComponentName(context, FinancasNotificationService::class.java)
      try {
        val pm = context.packageManager
        pm.setComponentEnabledSetting(nome, PackageManager.COMPONENT_ENABLED_STATE_DISABLED, PackageManager.DONT_KILL_APP)
        pm.setComponentEnabledSetting(nome, PackageManager.COMPONENT_ENABLED_STATE_ENABLED, PackageManager.DONT_KILL_APP)
        NotificationListenerService.requestRebind(nome)
      } catch (e: Exception) {
        // se falhar, o usuário ainda pode desligar/ligar o acesso nas configurações
      }
    }

    // Abre a tela do Android onde se liga o acesso às notificações.
    Function("abrirConfiguracoes") {
      val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
    }

    // Devolve (em texto JSON) as notificações que o serviço guardou.
    Function("lerPendentes") {
      Fila.ler(context)
    }

    // Depois de salvar no banco, o app pede para apagar da fila os primeiros "qtd".
    Function("confirmar") { qtd: Int ->
      Fila.remover(context, qtd)
    }
  }
}
