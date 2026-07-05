/**
 * Horizontal swipe detection for sliders and scroll strips.
 * onSwipeLeft = finger moved left (show next content)
 * onSwipeRight = finger moved right (show previous content)
 */
export function useTouchSwipe(onSwipeLeft, onSwipeRight, options = {}) {
  const threshold = options.threshold ?? 45;
  const maxVertical = options.maxVertical ?? 60;

  let startX = 0;
  let startY = 0;
  let tracking = false;

  function onTouchStart(event) {
    if (event.touches.length !== 1) return;
    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
    tracking = true;
  }

  function onTouchMove(event) {
    if (!tracking || event.touches.length !== 1) return;

    const dx = event.touches[0].clientX - startX;
    const dy = event.touches[0].clientY - startY;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 12) {
      event.preventDefault();
    }
  }

  function onTouchEnd(event) {
    if (!tracking) return;
    tracking = false;

    const dx = event.changedTouches[0].clientX - startX;
    const dy = event.changedTouches[0].clientY - startY;

    if (Math.abs(dx) < threshold) return;
    if (Math.abs(dy) > maxVertical && Math.abs(dy) > Math.abs(dx)) return;

    if (dx < 0) onSwipeLeft();
    else onSwipeRight();
  }

  function bind(el) {
    if (!el) return () => {};

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }

  return { bind, onTouchStart, onTouchMove, onTouchEnd };
}
