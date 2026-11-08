// The form's buttons, pinned to the bottom when it scrolls. Reaches the dialog's edges and holds its bottom
// padding, so the form scrolls behind it and never shows beneath; the fade above says there is more under it
export const formStrip =
  'sticky bottom-0 -mx-4 mt-auto bg-(--ws-soft) px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] before:pointer-events-none before:absolute before:inset-x-0 before:-top-4 before:h-4 before:bg-linear-to-t before:from-(--ws-soft) before:to-transparent'
