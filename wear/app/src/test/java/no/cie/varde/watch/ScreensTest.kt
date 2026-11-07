package no.cie.varde.watch

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onRoot
import androidx.wear.compose.material.MaterialTheme
import com.github.takahirom.roborazzi.captureRoboImage
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/** Renders the main watch screens on a round 1.4" watch (Galaxy Watch size). Output: app/build/outputs/roborazzi */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [34], qualifiers = "w225dp-h225dp-round-watch-xhdpi")
class ScreensTest {
    @get:Rule val rule = createComposeRule()

    private val plan = Plan.parse(javaClass.getResource("/" + (System.getenv("WATCH_PAYLOAD") ?: "payload.json"))!!.readText())
    private val l = L(plan.lang)

    private fun shot(name: String, content: @androidx.compose.runtime.Composable () -> Unit) {
        rule.setContent {
            MaterialTheme { Box(Modifier.fillMaxSize().clip(CircleShape).background(Color.Black)) { content() } }
        }
        rule.mainClock.advanceTimeBy(500)
        rule.onRoot().captureRoboImage("build/outputs/roborazzi/$name.png")
    }

    @Test fun home() = shot("1_home") { Home(plan, 1, l) {} }

    @Test fun manual() {
        val s = Session(plan.workouts[0], plan)
        val i = plan.workouts[0].steps.indexOfFirst { it.kind == "manual" }
        s.enter(i)
        shot("2_set") { ManualStep(s, s.step!!, l, {}, {}) }
    }

    @Test fun rest() {
        val s = Session(plan.workouts[0], plan)
        val i = plan.workouts[0].steps.indexOfFirst { it.kind == "rest" }
        s.enter(i)
        rule.mainClock.autoAdvance = false
        shot("3_rest") { TimedStep(s, s.step!!, l, {}, {}) }
    }

    @Test fun work() {
        val w = plan.workouts.first { wo -> wo.steps.any { it.kind == "work" && it.seconds in 30..60 } }
        val s = Session(w, plan)
        s.enter(w.steps.indexOfFirst { it.kind == "work" && it.seconds in 30..60 })
        rule.mainClock.autoAdvance = false
        shot("5_work") { TimedStep(s, s.step!!, l, {}, {}) }
    }

    @Test fun finish() = shot("4_finish") { Finish(l, 7, {}, {}, {}) }
}
