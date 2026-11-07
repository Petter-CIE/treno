package no.cie.varde.watch

import android.content.Context
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.foundation.lazy.rememberScalingLazyListState
import androidx.wear.compose.material.Button
import androidx.wear.compose.material.ButtonDefaults
import androidx.wear.compose.material.Chip
import androidx.wear.compose.material.ChipDefaults
import androidx.wear.compose.material.CircularProgressIndicator
import androidx.wear.compose.material.ListHeader
import androidx.wear.compose.material.MaterialTheme
import androidx.wear.compose.material.PositionIndicator
import androidx.wear.compose.material.Scaffold
import androidx.wear.compose.material.SwipeToDismissBox
import androidx.wear.compose.material.Text
import androidx.wear.compose.material.TimeText
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.UUID
import kotlin.math.max

private val Accent = Color(0xFF43E0B8)
private val Surface = Color(0xFF16242C)
private val Muted = Color(0xFF8FA3AD)
private val RestColor = Color(0xFF2FB7D6)
private val Warn = Color(0xFFF29A5E)

class MainActivity : ComponentActivity() {
    private lateinit var repo: Repo

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        repo = Repo(this)
        setContent { MaterialTheme { App(repo, onExit = { finish() }, keepOn = ::keepScreenOn) } }
    }

    private fun keepScreenOn(on: Boolean) {
        if (on) window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        else window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }
}

private sealed interface Screen {
    data object Home : Screen
    data object Run : Screen
    data object ConfirmEnd : Screen
    data class Finish(val completed: Boolean) : Screen
    data object Saved : Screen
}

/** A workout in progress. Timers run off wall-clock timestamps so pausing and recomposition stay exact. */
internal class Session(val workout: Workout, val plan: Plan) {
    var idx by mutableIntStateOf(0)
    var endsAt by mutableLongStateOf(0L)
    var pausedLeft by mutableLongStateOf(-1L) // ms left while paused, -1 when running
    val startedAt = System.currentTimeMillis()
    var pausedTotal = 0L
    private var pausedAt = 0L
    val sets = mutableStateListOf<DoneSet>()
    val kg = mutableStateMapOf<String, Double>()
    val reps = mutableStateMapOf<String, Int>()

    val step: Step? get() = workout.steps.getOrNull(idx)
    val paused get() = pausedLeft >= 0

    fun enter(i: Int) {
        idx = i
        val s = step ?: return
        pausedLeft = -1
        endsAt = if (s.kind != "manual" && s.seconds > 0) System.currentTimeMillis() + s.seconds * 1000L else 0L
        if (s.kind == "manual" && s.ex != null) {
            if (s.ex !in reps) reps[s.ex] = s.reps ?: 10
            if (s.ex !in kg) plan.ex[s.ex]?.let { kg[s.ex] = it.kg }
        }
    }

    fun togglePause() {
        val now = System.currentTimeMillis()
        if (paused) {
            endsAt = now + pausedLeft
            pausedLeft = -1
            pausedTotal += now - pausedAt
        } else {
            pausedLeft = max(0L, endsAt - now)
            pausedAt = now
        }
    }

    fun elapsedSec(): Int = ((System.currentTimeMillis() - startedAt - pausedTotal) / 1000).toInt()

    fun adjustKg(ex: String, dir: Int) {
        val info = plan.ex[ex] ?: return
        val cur = kg[ex] ?: info.kg
        val next = if (info.bells.isNotEmpty()) {
            if (dir > 0) info.bells.firstOrNull { it > cur + 0.01 } ?: cur else info.bells.lastOrNull { it < cur - 0.01 } ?: cur
        } else {
            val shownNext = shown(cur, plan.unit) + dir * info.inc
            max(0.0, if (plan.unit == "lb") shownNext / LB else shownNext)
        }
        kg[ex] = next
    }
}

@Composable
private fun App(repo: Repo, onExit: () -> Unit, keepOn: (Boolean) -> Unit) {
    val ctx = LocalContext.current
    val scope = rememberCoroutineScope()
    var plan by remember { mutableStateOf<Plan?>(null) }
    var pending by remember { mutableIntStateOf(0) }
    var screen by remember { mutableStateOf<Screen>(Screen.Home) }
    var session by remember { mutableStateOf<Session?>(null) }
    var rpe by remember { mutableIntStateOf(6) }

    DisposableEffect(Unit) {
        scope.launch {
            plan = repo.loadPlan() ?: Plan.EMPTY
            pending = repo.pendingLogs()
        }
        val l = repo.listen(onPlan = { plan = it }, onLogsChanged = { scope.launch { pending = repo.pendingLogs() } })
        onDispose { repo.stop(l) }
    }

    val running = screen == Screen.Run || screen == Screen.ConfirmEnd
    LaunchedEffect(running) { keepOn(running) }

    val p = plan
    val l = L(p?.lang ?: java.util.Locale.getDefault().language)

    fun save(completed: Boolean, withRpe: Int?) {
        val s = session ?: return
        val id = "w" + UUID.randomUUID().toString().replace("-", "").take(12)
        val json = logJson(id, s.workout, s.startedAt, System.currentTimeMillis(), s.elapsedSec(), withRpe, completed, s.sets.toList())
        scope.launch {
            repo.saveLog(id, json)
            pending = repo.pendingLogs()
        }
        buzz(ctx, long = true)
        session = null
        screen = Screen.Saved
    }

    when (val sc = screen) {
        Screen.Home -> SwipeToDismissBox(onDismissed = onExit) { bg ->
            if (!bg) Home(p, pending, l) { w ->
                val s = Session(w, p ?: Plan.EMPTY)
                s.enter(0)
                session = s
                rpe = 6
                screen = Screen.Run
            }
        }
        Screen.Run -> {
            val s = session
            if (s == null) screen = Screen.Home
            else {
                BackHandler { screen = Screen.ConfirmEnd }
                Run(s, l, onEnd = { screen = Screen.ConfirmEnd }, onFinished = { screen = Screen.Finish(true) })
            }
        }
        Screen.ConfirmEnd -> {
            BackHandler { screen = Screen.Run }
            ConfirmEnd(
                l,
                onSave = { screen = Screen.Finish(false) },
                onDiscard = { session = null; screen = Screen.Home },
                onContinue = {
                    session?.let { if (it.paused) it.togglePause() }
                    screen = Screen.Run
                },
            )
        }
        is Screen.Finish -> {
            BackHandler { }
            Finish(l, rpe, onRpe = { rpe = it }, onSave = { save(sc.completed, rpe) }, onDiscard = { session = null; screen = Screen.Home })
        }
        Screen.Saved -> {
            LaunchedEffect(Unit) {
                delay(2200)
                screen = Screen.Home
            }
            Box(Modifier.fillMaxSize().background(Color.Black), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("✓", color = Accent, fontSize = 40.sp, fontWeight = FontWeight.Bold)
                    Text(l["saved"], textAlign = TextAlign.Center, modifier = Modifier.padding(horizontal = 24.dp))
                }
            }
        }
    }
}

@Composable
internal fun Home(plan: Plan?, pending: Int, l: L, onStart: (Workout) -> Unit) {
    val state = rememberScalingLazyListState()
    Scaffold(timeText = { TimeText() }, positionIndicator = { PositionIndicator(scalingLazyListState = state) }) {
        ScalingLazyColumn(state = state, modifier = Modifier.fillMaxSize().background(Color.Black)) {
            item { ListHeader { Text(l["workouts"], color = Accent, fontWeight = FontWeight.Bold) } }
            if (plan != null && plan.workouts.isEmpty()) {
                item { Text(l["empty"], textAlign = TextAlign.Center, color = Muted, modifier = Modifier.padding(horizontal = 12.dp)) }
            }
            plan?.workouts?.forEach { w ->
                item {
                    Chip(
                        onClick = { onStart(w) },
                        label = { Text(w.name, maxLines = 2, overflow = TextOverflow.Ellipsis) },
                        secondaryLabel = { Text(listOf(w.sub, if (w.minutes > 0) "${w.minutes} min" else "").filter { it.isNotEmpty() }.joinToString(" · "), maxLines = 1, color = Muted) },
                        colors = ChipDefaults.chipColors(backgroundColor = Surface),
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
            }
            if (pending > 0) item { Text(l["waiting"].replace("%d", pending.toString()), color = Muted, fontSize = 12.sp, textAlign = TextAlign.Center) }
        }
    }
}

@Composable
private fun Run(s: Session, l: L, onEnd: () -> Unit, onFinished: () -> Unit) {
    val ctx = LocalContext.current
    val step = s.step
    if (step == null) {
        LaunchedEffect(Unit) { onFinished() }
        return
    }
    fun next() {
        if (s.idx >= s.workout.steps.size - 1) onFinished() else s.enter(s.idx + 1)
    }
    if (step.kind == "manual") ManualStep(s, step, l, onDone = {
        val ex = step.ex
        if (ex != null) s.sets.add(DoneSet(ex, s.reps[ex] ?: (step.reps ?: 0), s.kg[ex]))
        buzz(ctx)
        next()
    }, onEnd = onEnd)
    else TimedStep(s, step, l, onNext = { next() }, onEnd = onEnd)
}

@Composable
internal fun TimedStep(s: Session, step: Step, l: L, onNext: () -> Unit, onEnd: () -> Unit) {
    val ctx = LocalContext.current
    var leftMs by remember(s.idx) { mutableLongStateOf(step.seconds * 1000L) }
    LaunchedEffect(s.idx, s.paused) {
        var lastBeep = -1L
        while (!s.paused) {
            leftMs = max(0L, s.endsAt - System.currentTimeMillis())
            val sec = (leftMs + 999) / 1000
            if (sec in 1..3 && sec != lastBeep) {
                lastBeep = sec
                buzz(ctx, short = true)
            }
            if (leftMs <= 0L) {
                buzz(ctx, long = true)
                onNext()
                break
            }
            delay(100)
        }
        if (s.paused) leftMs = s.pausedLeft
    }
    val total = max(1, step.seconds) * 1000f
    val color = when (step.kind) {
        "rest" -> RestColor
        "prep" -> Warn
        else -> Accent
    }
    val secLeft = ((leftMs + 999) / 1000).toInt()
    Box(Modifier.fillMaxSize().background(Color.Black), contentAlignment = Alignment.Center) {
        CircularProgressIndicator(
            progress = leftMs / total,
            modifier = Modifier.fillMaxSize().padding(3.dp),
            indicatorColor = color,
            trackColor = Surface,
            strokeWidth = 6.dp,
        )
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(horizontal = 22.dp)) {
            Text(step.detail.ifEmpty { s.workout.name }, color = Muted, fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis, textAlign = TextAlign.Center)
            Text(step.title, fontWeight = FontWeight.SemiBold, fontSize = 15.sp, maxLines = 2, overflow = TextOverflow.Ellipsis, textAlign = TextAlign.Center)
            Text(if (secLeft >= 60) "%d:%02d".format(secLeft / 60, secLeft % 60) else "$secLeft", color = color, fontSize = 44.sp, fontWeight = FontWeight.Bold)
            if (step.kind == "amrap" && step.items.isNotEmpty()) {
                Text(step.items.joinToString(" · "), color = Muted, fontSize = 11.sp, maxLines = 2, overflow = TextOverflow.Ellipsis, textAlign = TextAlign.Center)
            }
            Spacer(Modifier.height(4.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                if (s.paused) {
                    SmallBtn("■", Surface, Warn) { onEnd() }
                }
                SmallBtn(if (s.paused) "▶" else "❚❚", Surface, Color.White) { s.togglePause() }
                SmallBtn("»", Surface, Color.White) { onNext() }
            }
        }
    }
}

@Composable
internal fun ManualStep(s: Session, step: Step, l: L, onDone: () -> Unit, onEnd: () -> Unit) {
    val ex = step.ex
    val weighted = ex != null && s.plan.ex.containsKey(ex)
    // everything on one round screen: set, name, reps, weight, done
    Box(Modifier.fillMaxSize().background(Color.Black), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(3.dp), modifier = Modifier.padding(horizontal = 14.dp)) {
            Text(step.detail, color = Muted, fontSize = 12.sp)
            Text(step.name ?: step.title, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, textAlign = TextAlign.Center, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.padding(horizontal = 18.dp))
            if (ex != null) {
                Stepper(l["reps"], "${s.reps[ex] ?: step.reps ?: 0}", onMinus = { s.reps[ex] = max(0, (s.reps[ex] ?: 0) - 1) }, onPlus = { s.reps[ex] = (s.reps[ex] ?: 0) + 1 })
            }
            if (weighted && ex != null) {
                Stepper(l["weight"], fmtWeight(s.kg[ex] ?: 0.0, s.plan.unit), onMinus = { s.adjustKg(ex, -1) }, onPlus = { s.adjustKg(ex, 1) })
            }
            Spacer(Modifier.height(2.dp))
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                Button(onClick = onEnd, colors = ButtonDefaults.buttonColors(backgroundColor = Surface, contentColor = Warn), modifier = Modifier.size(40.dp)) {
                    Text("■", color = Warn, fontSize = 13.sp)
                }
                Chip(
                    onClick = onDone,
                    label = { Text("✓ " + l["done"], fontWeight = FontWeight.Bold, color = Color.Black, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth()) },
                    colors = ChipDefaults.chipColors(backgroundColor = Accent),
                    modifier = Modifier.width(100.dp).height(44.dp),
                )
            }
        }
    }
}

/** label above a compact  −  value  +  row */
@Composable
private fun Stepper(label: String, value: String, onMinus: () -> Unit, onPlus: () -> Unit) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(label, color = Muted, fontSize = 10.sp)
        Row(verticalAlignment = Alignment.CenterVertically) {
            SmallBtn("−", Surface, Color.White, 36, onMinus)
            Text(value, fontSize = 20.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center, maxLines = 1, modifier = Modifier.width(84.dp))
            SmallBtn("+", Surface, Color.White, 36, onPlus)
        }
    }
}

@Composable
private fun ValueRow(label: String, value: String, onMinus: () -> Unit, onPlus: () -> Unit) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
        Text(label, color = Muted, fontSize = 11.sp)
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.Center) {
            SmallBtn("−", Surface, Color.White, onClick = onMinus)
            Text(value, fontSize = 22.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center, modifier = Modifier.width(92.dp))
            SmallBtn("+", Surface, Color.White, onClick = onPlus)
        }
    }
}

@Composable
private fun SmallBtn(label: String, bg: Color, fg: Color, sizeDp: Int = 48, onClick: () -> Unit) {
    Button(onClick = onClick, colors = ButtonDefaults.buttonColors(backgroundColor = bg, contentColor = fg), modifier = Modifier.size(sizeDp.dp)) {
        Text(label, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = fg)
    }
}

@Composable
internal fun ConfirmEnd(l: L, onSave: () -> Unit, onDiscard: () -> Unit, onContinue: () -> Unit) {
    val state = rememberScalingLazyListState()
    ScalingLazyColumn(state = state, modifier = Modifier.fillMaxSize().background(Color.Black)) {
        item { ListHeader { Text(l["endQ"], textAlign = TextAlign.Center) } }
        item { Chip(onClick = onSave, label = { Text(l["save"], color = Color.Black, fontWeight = FontWeight.Bold) }, colors = ChipDefaults.chipColors(backgroundColor = Accent), modifier = Modifier.fillMaxWidth()) }
        item { Chip(onClick = onContinue, label = { Text(l["cont"]) }, colors = ChipDefaults.chipColors(backgroundColor = Surface), modifier = Modifier.fillMaxWidth()) }
        item { Chip(onClick = onDiscard, label = { Text(l["discard"], color = Warn) }, colors = ChipDefaults.chipColors(backgroundColor = Surface), modifier = Modifier.fillMaxWidth()) }
    }
}

@Composable
internal fun Finish(l: L, rpe: Int, onRpe: (Int) -> Unit, onSave: () -> Unit, onDiscard: () -> Unit) {
    val state = rememberScalingLazyListState()
    ScalingLazyColumn(state = state, modifier = Modifier.fillMaxSize().background(Color.Black)) {
        item { ListHeader { Text(l["hard"], textAlign = TextAlign.Center) } }
        item { ValueRow("1–10", "$rpe", onMinus = { onRpe(max(1, rpe - 1)) }, onPlus = { onRpe(minOf(10, rpe + 1)) }) }
        item { Chip(onClick = onSave, label = { Text(l["save"], color = Color.Black, fontWeight = FontWeight.Bold) }, colors = ChipDefaults.chipColors(backgroundColor = Accent), modifier = Modifier.fillMaxWidth()) }
        item { Chip(onClick = onDiscard, label = { Text(l["discard"], color = Warn) }, colors = ChipDefaults.chipColors(backgroundColor = Surface), modifier = Modifier.fillMaxWidth()) }
    }
}

private fun buzz(ctx: Context, short: Boolean = false, long: Boolean = false) {
    val v = ctx.getSystemService(Vibrator::class.java) ?: return
    if (!v.hasVibrator()) return
    val effect = when {
        long -> VibrationEffect.createWaveform(longArrayOf(0, 180, 120, 260), -1)
        short -> VibrationEffect.createOneShot(40, VibrationEffect.DEFAULT_AMPLITUDE)
        else -> VibrationEffect.createOneShot(90, VibrationEffect.DEFAULT_AMPLITUDE)
    }
    v.vibrate(effect)
}
