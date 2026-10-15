package expo.modules.notificacoes

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

// Fila de notificações guardada no próprio celular (SharedPreferences).
// O serviço coloca aqui mesmo com o app fechado; o app lê quando abre.
object Fila {
  private const val ARQUIVO = "financas_notificacoes"
  private const val CHAVE = "fila"
  private const val LIMITE = 500
  private val trava = Any()

  fun adicionar(context: Context, item: JSONObject) {
    synchronized(trava) {
      val prefs = context.getSharedPreferences(ARQUIVO, Context.MODE_PRIVATE)
      val atual = JSONArray(prefs.getString(CHAVE, "[]"))
      atual.put(item)
      // se acumular demais (app nunca aberto), descarta as mais antigas
      val final = if (atual.length() > LIMITE) {
        val nova = JSONArray()
        for (i in atual.length() - LIMITE until atual.length()) nova.put(atual.get(i))
        nova
      } else atual
      prefs.edit().putString(CHAVE, final.toString()).apply()
    }
  }

  fun ler(context: Context): String {
    synchronized(trava) {
      return context.getSharedPreferences(ARQUIVO, Context.MODE_PRIVATE).getString(CHAVE, "[]") ?: "[]"
    }
  }

  // Remove os primeiros "qtd" itens (os que o app já processou).
  fun remover(context: Context, qtd: Int) {
    synchronized(trava) {
      val prefs = context.getSharedPreferences(ARQUIVO, Context.MODE_PRIVATE)
      val atual = JSONArray(prefs.getString(CHAVE, "[]"))
      val nova = JSONArray()
      for (i in qtd until atual.length()) nova.put(atual.get(i))
      prefs.edit().putString(CHAVE, nova.toString()).apply()
    }
  }
}
