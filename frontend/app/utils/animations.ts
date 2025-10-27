/**
 * Count up animation for a numeric value
 * @param target The target number to count to
 * @param outputRef A ref to update the value
 * @param duration Duration in milliseconds (default 1000ms)
 */
export function countUp(
  target: number,
  outputRef: { value: number },
  duration = 1000
) {
  const start = 0
  const range = target - start
  const startTime = performance.now()

  function step(currentTime: number) {
    const elapsed = currentTime - startTime
    if (elapsed < duration) {
      const progress = elapsed / duration
      outputRef.value = Math.round(progress * range)
      requestAnimationFrame(step)
    } else {
      outputRef.value = target
    }
  }

  requestAnimationFrame(step)
}
