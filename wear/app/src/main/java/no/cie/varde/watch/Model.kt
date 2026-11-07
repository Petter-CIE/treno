package no.cie.varde.watch

import org.json.JSONArray
import org.json.JSONObject

/** Mirrors WatchPayload / WatchLog in src/lib/wear.ts on the phone. */
data class Step(
    val kind: String, // prep | work | rest | manual | amrap
    val seconds: Int,
    val title: String,
    val detail: String,
    val ex: String?,
    val name: String?,
    val reps: Int?,
    val items: List<String>,
)

data class Workout(
    val id: String,
    val name: String,
    val sub: String,
    val discipline: String,
    val minutes: Int,
    val steps: List<Step>,
)

data class ExerciseInfo(val kg: Double, val inc: Double, val bells: List<Double>)

data class Plan(
    val lang: String,
    val unit: String, // kg | lb
    val workouts: List<Workout>,
    val ex: Map<String, ExerciseInfo>,
) {
    companion object {
        val EMPTY = Plan("en", "kg", emptyList(), emptyMap())

        fun parse(json: String): Plan {
            val o = JSONObject(json)
            val ws = o.optJSONArray("workouts") ?: JSONArray()
            val workouts = (0 until ws.length()).map { i ->
                val w = ws.getJSONObject(i)
                val st = w.optJSONArray("steps") ?: JSONArray()
                Workout(
                    id = w.getString("id"),
                    name = w.optString("name"),
                    sub = w.optString("sub"),
                    discipline = w.optString("disc"),
                    minutes = w.optInt("min"),
                    steps = (0 until st.length()).map { j ->
                        val s = st.getJSONObject(j)
                        val items = s.optJSONArray("items")
                        Step(
                            kind = s.optString("k"),
                            seconds = s.optInt("s"),
                            title = s.optString("t"),
                            detail = s.optString("d"),
                            ex = s.optString("ex").ifEmpty { null },
                            name = s.optString("n").ifEmpty { null },
                            reps = if (s.has("r")) s.optInt("r") else null,
                            items = if (items == null) emptyList() else (0 until items.length()).map { items.getString(it) },
                        )
                    },
                )
            }
            val exO = o.optJSONObject("ex") ?: JSONObject()
            val ex = exO.keys().asSequence().associateWith { k ->
                val e = exO.getJSONObject(k)
                val b = e.optJSONArray("bells")
                ExerciseInfo(
                    kg = e.optDouble("kg", 10.0),
                    inc = e.optDouble("inc", 2.5),
                    bells = if (b == null) emptyList() else (0 until b.length()).map { b.getDouble(it) },
                )
            }
            return Plan(o.optString("lang", "en"), o.optString("unit", "kg"), workouts, ex)
        }
    }
}

data class DoneSet(val ex: String, val reps: Int, val kg: Double?)

fun logJson(
    id: String, workout: Workout, start: Long, end: Long, durationSec: Int, rpe: Int?, completed: Boolean, sets: List<DoneSet>,
): String {
    val o = JSONObject()
    o.put("id", id)
    o.put("w", workout.id)
    o.put("title", workout.name)
    o.put("disc", workout.discipline)
    o.put("start", iso(start))
    o.put("end", iso(end))
    o.put("dur", durationSec)
    if (rpe != null) o.put("rpe", rpe)
    o.put("done", completed)
    val arr = JSONArray()
    for (s in sets) {
        val x = JSONObject()
        x.put("ex", s.ex)
        x.put("reps", s.reps)
        if (s.kg != null) x.put("kg", Math.round(s.kg * 100) / 100.0)
        arr.put(x)
    }
    o.put("sets", arr)
    return o.toString()
}

private fun iso(ms: Long): String = java.time.Instant.ofEpochMilli(ms).toString()

const val LB = 2.20462

/** kg → value shown on the watch */
fun shown(kg: Double, unit: String): Double = if (unit == "lb") kg * LB else kg

fun fmtWeight(kg: Double, unit: String): String {
    val v = shown(kg, unit)
    val r = if (unit == "lb") Math.round(v).toDouble() else Math.round(v * 2) / 2.0
    val s = if (r % 1.0 == 0.0) r.toLong().toString() else r.toString()
    return "$s $unit"
}
