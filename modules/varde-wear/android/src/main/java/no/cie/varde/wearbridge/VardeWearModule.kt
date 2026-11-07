package no.cie.varde.wearbridge

import android.content.Context
import android.net.Uri
import com.google.android.gms.wearable.DataClient
import com.google.android.gms.wearable.DataEvent
import com.google.android.gms.wearable.DataEventBuffer
import com.google.android.gms.wearable.DataMapItem
import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.Wearable
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Phone side of the Varde watch link (Wear OS Data Layer).
 *  - /varde/plan        phone -> watch: workouts the watch can run (JSON)
 *  - /varde/log/<id>    watch -> phone: a finished workout (JSON); deleted here once handed to JS
 */
class VardeWearModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("No context")

  private val listener = DataClient.OnDataChangedListener { events: DataEventBuffer ->
    val logs = mutableListOf<Pair<Uri, String>>()
    for (e in events) {
      if (e.type != DataEvent.TYPE_CHANGED) continue
      val item = e.dataItem
      if (item.uri.path?.startsWith(LOG_PREFIX) != true) continue
      val json = DataMapItem.fromDataItem(item).dataMap.getString("json") ?: continue
      logs.add(item.uri to json)
    }
    events.release()
    for ((uri, json) in logs) {
      sendEvent("onLog", mapOf("json" to json))
      Wearable.getDataClient(context).deleteDataItems(uri)
    }
  }

  override fun definition() = ModuleDefinition {
    Name("VardeWear")

    Events("onLog")

    OnStartObserving {
      Wearable.getDataClient(context).addListener(listener)
    }

    OnStopObserving {
      Wearable.getDataClient(context).removeListener(listener)
    }

    /** Publish the workouts the watch can run. Identical JSON is a no-op for the Data Layer. */
    AsyncFunction("setPlan") { json: String, promise: Promise ->
      val req = PutDataMapRequest.create(PLAN_PATH).apply { dataMap.putString("json", json) }
        .asPutDataRequest().setUrgent()
      Wearable.getDataClient(context).putDataItem(req)
        .addOnSuccessListener { promise.resolve(true) }
        .addOnFailureListener { promise.resolve(false) }
    }

    /** Workouts finished on the watch that have not been picked up yet. Each is removed once returned. */
    AsyncFunction("collectLogs") { promise: Promise ->
      val client = Wearable.getDataClient(context)
      client.getDataItems(Uri.parse("wear://*$LOG_PREFIX"), DataClient.FILTER_PREFIX)
        .addOnSuccessListener { buffer ->
          val out = mutableListOf<String>()
          val uris = mutableListOf<Uri>()
          for (item in buffer) {
            DataMapItem.fromDataItem(item).dataMap.getString("json")?.let { out.add(it); uris.add(item.uri) }
          }
          buffer.release()
          uris.forEach { client.deleteDataItems(it) }
          promise.resolve(out)
        }
        .addOnFailureListener { promise.resolve(emptyList<String>()) }
    }

    /** Names of connected watches (empty when none, or when Wear OS isn't installed). */
    AsyncFunction("connectedWatches") { promise: Promise ->
      Wearable.getNodeClient(context).connectedNodes
        .addOnSuccessListener { nodes -> promise.resolve(nodes.map { it.displayName }) }
        .addOnFailureListener { promise.resolve(emptyList<String>()) }
    }
  }

  companion object {
    const val PLAN_PATH = "/varde/plan"
    const val LOG_PREFIX = "/varde/log/"
  }
}
