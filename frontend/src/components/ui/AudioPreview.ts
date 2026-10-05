import { computed, defineComponent, onUnmounted, ref } from 'vue'
import { Play, Pause, Square, AudioLines } from '@lucide/vue'
import { uiMessages as text } from './messages'

export default defineComponent({
  components: { Play, Pause, Square, AudioLines },
  props: {
    src: { type: String, required: true },
    seconds: { type: Number, default: 0 },
  },
  setup(props) {
    const audio = ref<HTMLAudioElement>(),
      playing = ref(false),
      elapsed = ref(0),
      duration = ref(0),
      error = ref('')
    const total = computed(() =>
      Number.isFinite(duration.value) && duration.value > 0
        ? duration.value
        : Math.max(props.seconds, elapsed.value, 1),
    )
    function update() {
      elapsed.value = audio.value?.currentTime ?? 0
      duration.value = audio.value?.duration ?? 0
    }
    async function toggle() {
      error.value = ''
      if (!audio.value) return
      if (playing.value) audio.value.pause()
      else {
        try {
          await audio.value.play()
        } catch {
          error.value = text.playbackError
        }
      }
    }
    function stop() {
      if (audio.value) {
        audio.value.pause()
        audio.value.currentTime = 0
      }
      elapsed.value = 0
    }
    function time(value: number) {
      return `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`
    }
    onUnmounted(() => audio.value?.pause())
    return {
      text,
      audio,
      playing,
      elapsed,
      total,
      error,
      update,
      toggle,
      stop,
      time,
    }
  },
})
