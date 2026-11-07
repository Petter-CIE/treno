package no.cie.varde.watch

import android.content.Context
import android.net.Uri
import com.google.android.gms.wearable.DataClient
import com.google.android.gms.wearable.DataEvent
import com.google.android.gms.wearable.DataMapItem
import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.Wearable
import kotlinx.coroutines.tasks.await

/** Data Layer: /varde/plan comes from the phone, /varde/log/<id> goes to it (the phone deletes it once saved). */
class Repo(context: Context) {
    private val client: DataClient = Wearable.getDataClient(context.applicationContext)

    suspend fun loadPlan(): Plan? = runCatching {
        val buf = client.getDataItems(Uri.parse("wear://*$PLAN")).await()
        val json = buf.firstOrNull()?.let { DataMapItem.fromDataItem(it).dataMap.getString("json") }
        buf.release()
        json?.let { Plan.parse(it) }
    }.getOrNull()

    suspend fun pendingLogs(): Int = runCatching {
        val buf = client.getDataItems(Uri.parse("wear://*$LOG"), DataClient.FILTER_PREFIX).await()
        val n = buf.count
        buf.release()
        n
    }.getOrDefault(0)

    fun listen(onPlan: (Plan) -> Unit, onLogsChanged: () -> Unit): DataClient.OnDataChangedListener {
        val l = DataClient.OnDataChangedListener { events ->
            for (e in events) {
                val path = e.dataItem.uri.path ?: continue
                if (path == PLAN && e.type == DataEvent.TYPE_CHANGED) {
                    DataMapItem.fromDataItem(e.dataItem).dataMap.getString("json")?.let { j -> runCatching { Plan.parse(j) }.getOrNull()?.let(onPlan) }
                } else if (path.startsWith(LOG)) onLogsChanged()
            }
            events.release()
        }
        client.addListener(l)
        return l
    }

    fun stop(l: DataClient.OnDataChangedListener) {
        client.removeListener(l)
    }

    suspend fun saveLog(id: String, json: String): Boolean = runCatching {
        val req = PutDataMapRequest.create("$LOG$id").apply { dataMap.putString("json", json) }.asPutDataRequest().setUrgent()
        client.putDataItem(req).await()
        true
    }.getOrDefault(false)

    companion object {
        const val PLAN = "/varde/plan"
        const val LOG = "/varde/log/"
    }
}
