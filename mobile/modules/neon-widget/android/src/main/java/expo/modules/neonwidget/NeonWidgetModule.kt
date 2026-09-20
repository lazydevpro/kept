package expo.modules.neonwidget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class NeonWidgetModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("NeonWidget")

    AsyncFunction("updateProgress") { snapshot: Map<String, Any?> ->
      val context = appContext.reactContext ?: return@AsyncFunction
      val rings = snapshot["rings"] as? Map<*, *> ?: emptyMap<String, Double>()
      context.getSharedPreferences(NeonReserveWidgetProvider.PREFS, 0).edit()
        .putString("title", snapshot["title"] as? String ?: "Keep this week")
        .putString("message", snapshot["message"] as? String ?: "Your next promise is waiting")
        .putFloat("consistency", (rings["consistency"] as? Number)?.toFloat() ?: 0f)
        .putFloat("circle", (rings["circle"] as? Number)?.toFloat() ?: 0f)
        .putFloat("goal", (rings["goal"] as? Number)?.toFloat() ?: 0f)
        .apply()

      val manager = AppWidgetManager.getInstance(context)
      val component = ComponentName(context, NeonReserveWidgetProvider::class.java)
      NeonReserveWidgetProvider.updateAll(context, manager, manager.getAppWidgetIds(component))
    }
  }
}
