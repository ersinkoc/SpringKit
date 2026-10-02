/**
 * Listen for the pointer leaving the document (browser window).
 *
 * `mouseleave` on `window` is not fired by most browsers; a `mouseout` on the
 * document whose `relatedTarget` is null is the reliable signal.
 *
 * @returns a function that removes the listener
 */
export function onPointerLeaveWindow(handler: () => void): () => void {
  if (typeof document === 'undefined') return () => {}
  const listener = (event: MouseEvent) => {
    if (event.relatedTarget === null) handler()
  }
  document.addEventListener('mouseout', listener, { passive: true })
  return () => document.removeEventListener('mouseout', listener)
}
